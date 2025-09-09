import { FormEventHandler, useState } from "react";
import {
    Button,
    createListCollection,
    Field,
    Fieldset,
    For,
    HStack,
    IconButton,
    Input,
    InputGroup,
    NativeSelect,
    Portal,
    Select,
    SimpleGrid,
    Stack,
    Text,
} from "@chakra-ui/react";
import { FaEye, FaEyeSlash, FaStreetView } from "react-icons/fa";
import ChakraDialog from "./ChakraDialog/ChakraDialog";
import Colors from "@/Constants/Colors";
import Typography from "@/Constants/Typography";
import { router, useForm } from "@inertiajs/react";
import InputError from "@/Components/InputError";
import { toaster } from "@/Components/toaster";
import {
    FiGlobe,
    FiHash,
    FiHome,
    FiLock,
    FiMail,
    FiMapPin,
    FiPhone,
    FiUser,
} from "react-icons/fi";
import { MdLabelImportantOutline } from "react-icons/md";
import countryDialCodes from "../../../Utils/DialCodes.json";
import businessTypes from "../../../Utils/BusinessTypes.json";
interface AuthFormProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthDialog({ isOpen, onClose }: AuthFormProps) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const url = window.location.pathname;
    const dialCodes = createListCollection({
        items: countryDialCodes.countries,
    });
    const businessTypesCollection = createListCollection({
        items: businessTypes.business_types,
    });
    /* --------------- sign-in form state --------------- */
    const {
        data: signInData,
        setData: setSignInData,
        post: postSignIn,
        processing: signInProcessing,
        errors: signInErrors,
        reset: resetSignIn,
        clearErrors: clearSignInErrors,
    } = useForm({
        email: "",
        password: "",
        remember: false as boolean,
        url,
        role: "customer",
    });

    /* --------------- sign-up form state --------------- */
    const {
        data: signUpData,
        setData: setSignUpData,
        post: postSignUp,
        processing: signUpProcessing,
        errors: signUpErrors,
        reset: resetSignUp,
        clearErrors: clearSignUpErrors,
    } = useForm({
        fname: "",
        lname: "",
        email: "",
        dial_code: "+971",
        phone_number: "",
        country_id: "184",
        company_name: "",
        website: "",
        business_type: "Company",
        city: "",
        address_line: "",
        trade_liscence_picture: null as File | null,
        url,
    });

    const commonLabelProps = {
        fontWeight: Typography.fontWeights.bold,
        fontSize: Typography.fontSizes.sm,
    };

    const commonInputProps = {
        borderColor: Colors.border.medium,
        borderRadius: 6,
        _focus: { boxShadow: "none", borderColor: Colors.border.medium },
    };

    /* --------------- submit handler --------------- */
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isSignUp) {
            console.log('route("register"));', route("register"));
            console.log("signUpData", signUpData);
            postSignUp(route("register"), {
                onSuccess: () => {
                    onClose();
                    resetSignUp();
                    toaster.create({
                        title: "Request Sent Successfully",
                        type: "success",
                    });
                },
                // onError: () => resetSignUp("password"),
            });
        } else {
            postSignIn(route("login"), {
                onSuccess: () => {
                    onClose();
                    resetSignIn();
                    toaster.create({
                        title: "Successfully logged in.",
                        type: "success",
                    });
                },
                onError: () => resetSignIn("password"),
            });
        }
    };
    const onCloseDialog = () => {
        onClose();
        resetSignUp();
        resetSignIn();
        clearSignInErrors(); // <-- wipe messages
        clearSignUpErrors();
        setIsSignUp(false);
    };
    /* --------------- header --------------- */
    const header = (
        <Text fontSize="xl" fontWeight="bold">
            {isSignUp ? "Create Account" : "Sign In"}
        </Text>
    );

    /* --------------- footer --------------- */
    const footer = (
        <Stack align="center" w={"full"}>
            <Button
                type="submit"
                bg={Colors.primary.main}
                color={Colors.text.onPrimary}
                fontWeight={Typography.fontWeights.bold}
                fontSize={Typography.fontSizes.md}
                width={["xs", "sm", "md"]}
                onClick={submit}
                disabled={isSignUp ? signUpProcessing : signInProcessing}
            >
                {isSignUp ? "Submit Request" : "Sign In"}
            </Button>

            <HStack mt={2}>
                <Text>
                    {isSignUp
                        ? "Already have an account?"
                        : "Don’t have an account?"}
                </Text>
                <Button
                    onClick={() => setIsSignUp((prev) => !prev)}
                    textDecor="underline"
                    color={Colors.primary.main}
                    fontWeight={Typography.fontWeights.bold}
                >
                    {isSignUp ? "Sign in" : "Create one"}
                </Button>
            </HStack>
        </Stack>
    );

    /* --------------- sign-in body --------------- */
    const signInBody = (
        <Fieldset.Root
            size="lg"
            maxHeight="60dvh"
            overflowY="auto"
            focusRingColor={Colors.primary.main}
            css={{
                "&::-webkit-scrollbar": { width: "0px" },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: Colors.primary.main,
                    borderRadius: "0px",
                },
            }}
        >
            <Fieldset.Content as="form">
                <Stack gap={4}>
                    {/* Email */}
                    <Field.Root>
                        <Field.Label {...commonLabelProps}>
                            <FiMail color={Colors.primary.main} /> Email
                        </Field.Label>
                        <Input
                            placeholder="example@email.com"
                            name="email"
                            type="email"
                            value={signInData.email}
                            onChange={(e) =>
                                setSignInData("email", e.target.value)
                            }
                            {...commonInputProps}
                        />
                        <InputError
                            message={signInErrors.email}
                            className="mt-1"
                        />
                    </Field.Root>

                    {/* Password */}
                    <Field.Root>
                        <Field.Label {...commonLabelProps}>
                            <FiLock color={Colors.primary.main} /> Password
                        </Field.Label>
                        <InputGroup
                            endElement={
                                <IconButton
                                    h="1.75rem"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowPassword((s) => !s)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </IconButton>
                            }
                        >
                            <Input
                                placeholder="Enter your password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={signInData.password}
                                onChange={(e) =>
                                    setSignInData("password", e.target.value)
                                }
                                {...commonInputProps}
                            />
                        </InputGroup>
                        <InputError
                            message={signInErrors.password}
                            className="mt-1"
                        />
                    </Field.Root>
                    <Text
                        textAlign={"right"}
                        fontSize={Typography.fontSizes.sm}
                        fontWeight={Typography.fontWeights.medium}
                        onClick={() => router.get(route("password.request"))}
                        cursor={"pointer"}
                    >
                        Forgot password?
                    </Text>
                </Stack>
            </Fieldset.Content>
        </Fieldset.Root>
    );

    /* --------------- sign-up body --------------- */
    /* --------------- sign-up body --------------- */
    const signUpBody = (
        <Fieldset.Root
            size="lg"
            maxHeight="60dvh"
            overflowY="auto"
            focusRingColor={Colors.primary.main}
            css={{
                "&::-webkit-scrollbar": { width: "0px" },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: Colors.primary.main,
                    borderRadius: "0px",
                },
            }}
        >
            <Fieldset.Content as="form">
                <Stack gap={6}>
                    {/* ───── Personal block ───── */}
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                        {/* row 1 */}
                        <Field.Root>
                            <Field.Label {...commonLabelProps}>
                                <FiUser color={Colors.primary.main} /> First
                                Name
                            </Field.Label>
                            <Input
                                placeholder="John"
                                name="fname"
                                value={signUpData.fname}
                                onChange={(e) =>
                                    setSignUpData("fname", e.target.value)
                                }
                                {...commonInputProps}
                            />
                            <InputError
                                message={signUpErrors.fname}
                                className="mt-1"
                            />
                        </Field.Root>

                        <Field.Root>
                            <Field.Label {...commonLabelProps}>
                                <FiUser color={Colors.primary.main} /> Last Name
                            </Field.Label>
                            <Input
                                placeholder="Doe"
                                name="lname"
                                value={signUpData.lname}
                                onChange={(e) =>
                                    setSignUpData("lname", e.target.value)
                                }
                                {...commonInputProps}
                            />
                            <InputError
                                message={signUpErrors.lname}
                                className="mt-1"
                            />
                        </Field.Root>

                        <Field.Root>
                            <Select.Root
                                collection={dialCodes}
                                onValueChange={(value) =>
                                    setSignUpData("dial_code", value.value[0])
                                }
                            >
                                <Select.HiddenSelect />
                                <Select.Label>{"Dial Code"}</Select.Label>
                                <Field.RequiredIndicator />
                                <Select.Control
                                    borderWidth={1}
                                    borderRadius={5}
                                    borderColor={"blackAlpha.400"}
                                >
                                    <Select.Trigger>
                                        <Select.ValueText
                                            placeholder={"+971"}
                                            ml={3}
                                        />
                                    </Select.Trigger>
                                    <Select.IndicatorGroup>
                                        <Select.Indicator />
                                    </Select.IndicatorGroup>
                                </Select.Control>
                                <Select.Positioner>
                                    <Select.Content>
                                        {dialCodes.items.map((code) => (
                                            <Select.Item
                                                item={code}
                                                key={code.value}
                                            >
                                                {code.label +
                                                    " (" +
                                                    code.value +
                                                    ")"}
                                                <Select.ItemIndicator />
                                            </Select.Item>
                                        ))}
                                    </Select.Content>
                                </Select.Positioner>
                            </Select.Root>
                        </Field.Root>

                        {/* row 2 */}
                        <Field.Root>
                            <Field.Label {...commonLabelProps}>
                                <FiPhone color={Colors.primary.main} /> Phone
                                Number
                            </Field.Label>
                            <Input
                                placeholder="050-123-4567"
                                name="phone_number"
                                type="number"
                                value={signUpData.phone_number}
                                onChange={(e) =>
                                    setSignUpData(
                                        "phone_number",
                                        e.target.value
                                    )
                                }
                                {...commonInputProps}
                            />
                            <InputError
                                message={signUpErrors.phone_number}
                                className="mt-1"
                            />
                        </Field.Root>
                    </SimpleGrid>

                    <Field.Root>
                        <Field.Label {...commonLabelProps}>
                            <FiMail color={Colors.primary.main} /> Email
                        </Field.Label>
                        <Input
                            placeholder="example@email.com"
                            name="email"
                            type="email"
                            value={signUpData.email}
                            onChange={(e) =>
                                setSignUpData("email", e.target.value)
                            }
                            {...commonInputProps}
                        />
                        <InputError
                            message={signUpErrors.email}
                            className="mt-1"
                        />
                    </Field.Root>

                    {/* ───── Address title ───── */}
                    <Text fontWeight="bold" fontSize="lg">
                        Company Data
                    </Text>

                    {/* ───── Address block ───── */}
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                        {/* row 4 */}
                        <Field.Root>
                            <Field.Label {...commonLabelProps}>
                                <MdLabelImportantOutline
                                    color={Colors.primary.main}
                                />
                                Company Name
                            </Field.Label>
                            <Input
                                placeholder="e.g. Home, Work"
                                name="label"
                                value={signUpData.company_name}
                                onChange={(e) =>
                                    setSignUpData(
                                        "company_name",
                                        e.target.value
                                    )
                                }
                                {...commonInputProps}
                            />
                            <InputError
                                message={signUpErrors.company_name}
                                className="mt-1"
                            />
                        </Field.Root>

                        <Field.Root>
                            <Select.Root
                                collection={businessTypesCollection}
                                onValueChange={(value) =>
                                    setSignUpData(
                                        "business_type",
                                        value.value[0]
                                    )
                                }
                            >
                                <Select.HiddenSelect />
                                <Select.Label>{"Business Type"}</Select.Label>
                                <Field.RequiredIndicator />
                                <Select.Control
                                    borderWidth={1}
                                    borderRadius={5}
                                    borderColor={"blackAlpha.400"}
                                >
                                    <Select.Trigger>
                                        <Select.ValueText
                                            placeholder={"Company"}
                                            ml={3}
                                        />
                                    </Select.Trigger>
                                    <Select.IndicatorGroup>
                                        <Select.Indicator />
                                    </Select.IndicatorGroup>
                                </Select.Control>
                                <Select.Positioner>
                                    <Select.Content>
                                        {businessTypesCollection.items.map(
                                            (business_type) => (
                                                <Select.Item
                                                    item={business_type}
                                                    key={business_type.value}
                                                >
                                                    {business_type.label}
                                                    <Select.ItemIndicator />
                                                </Select.Item>
                                            )
                                        )}
                                    </Select.Content>
                                </Select.Positioner>
                            </Select.Root>
                        </Field.Root>

                        <Field.Root>
                            <Field.Label {...commonLabelProps}>
                                <FiGlobe color={Colors.primary.main} /> Country
                            </Field.Label>
                            <NativeSelect.Root>
                                <NativeSelect.Field
                                    name="country_id"
                                    value={signUpData.country_id}
                                    onChange={(e) =>
                                        setSignUpData(
                                            "country_id",
                                            e.target.value
                                        )
                                    }
                                    {...commonInputProps}
                                >
                                    <For each={["United Arab Emirates"]}>
                                        {(c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        )}
                                    </For>
                                </NativeSelect.Field>
                            </NativeSelect.Root>
                            <InputError
                                message={signUpErrors.country_id}
                                className="mt-1"
                            />
                        </Field.Root>

                        {/* row 5 */}
                        <Field.Root>
                            <Field.Label {...commonLabelProps}>
                                <FiMapPin color={Colors.primary.main} /> City
                            </Field.Label>
                            <Input
                                placeholder="Dubai"
                                name="city"
                                value={signUpData.city}
                                onChange={(e) =>
                                    setSignUpData("city", e.target.value)
                                }
                                {...commonInputProps}
                            />
                            <InputError
                                message={signUpErrors.city}
                                className="mt-1"
                            />
                        </Field.Root>

                        <Field.Root>
                            <Field.Label {...commonLabelProps}>
                                <FaStreetView color={Colors.primary.main} />{" "}
                                Adress Line
                            </Field.Label>
                            <Input
                                placeholder="Sheikh Zayed Road"
                                name="street"
                                value={signUpData.address_line}
                                onChange={(e) =>
                                    setSignUpData(
                                        "address_line",
                                        e.target.value
                                    )
                                }
                                {...commonInputProps}
                            />
                            <InputError
                                message={signUpErrors.address_line}
                                className="mt-1"
                            />
                        </Field.Root>

                        {/* row 6 */}
                        <Field.Root>
                            <Field.Label {...commonLabelProps}>
                                <FiGlobe color={Colors.primary.main} /> Website
                            </Field.Label>
                            <Input
                                placeholder="Tower 1"
                                name="building"
                                value={signUpData.website}
                                onChange={(e) =>
                                    setSignUpData("website", e.target.value)
                                }
                                {...commonInputProps}
                            />
                            <InputError
                                message={signUpErrors.website}
                                className="mt-1"
                            />
                        </Field.Root>
                    </SimpleGrid>
                    <Field.Root>
                        <Field.Label {...commonLabelProps}>
                            Trade-licence (PDF)
                        </Field.Label>

                        <Input
                            type="file"
                            accept="application/pdf"
                            // ✨ don’t give <Input /> a value prop when type="file"
                            onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                setSignUpData("trade_liscence_picture", file);
                            }}
                            {...commonInputProps}
                            px={1}
                        />
                        {signUpData.trade_liscence_picture && (
                            <Text mt={1} fontSize="xs" color="gray.600">
                                {signUpData.trade_liscence_picture.name}
                            </Text>
                        )}
                        <InputError
                            message={signUpErrors.trade_liscence_picture}
                            className="mt-1"
                        />
                    </Field.Root>
                </Stack>
            </Fieldset.Content>
        </Fieldset.Root>
    );

    /* --------------- final render --------------- */
    return (
        <ChakraDialog
            title={header}
            footer={footer}
            isOpen={isOpen}
            onClose={onCloseDialog}
            size="lg"
        >
            {isSignUp ? signUpBody : signInBody}
        </ChakraDialog>
    );
}
