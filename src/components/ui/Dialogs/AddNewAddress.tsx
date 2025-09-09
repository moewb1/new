// components/AddNewAddress.tsx
import React, { FormEventHandler } from "react";
import {
    Button,
    Fieldset,
    Field,
    HStack,
    Stack,
    Text,
    Input,
    VStack,
} from "@chakra-ui/react";
import { FiGlobe, FiHash, FiHome, FiMapPin } from "react-icons/fi";
import { FaStreetView } from "react-icons/fa";
import { useForm } from "@inertiajs/react";
import ChakraDialog from "./ChakraDialog/ChakraDialog";
import Colors from "@/Constants/Colors";
import Typography from "@/Constants/Typography";
import Spacing from "@/Constants/Spacing";
import { toaster } from "@/Components/toaster";
import { MdLabelImportantOutline } from "react-icons/md";

// common label styles
const commonLabelProps = {
    fontWeight: Typography.fontWeights.bold,
    fontSize: Typography.fontSizes.sm,
};

export interface Address {
    country: string;
    city: string;
    street: string;
    building: string;
    apartment: string;
}

interface AddNewAddressProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (address: Address) => void;
}

export default function AddNewAddress({
    isOpen,
    onClose,
    onSave,
}: AddNewAddressProps) {
    const url = window.location.pathname;
    const { data, setData, post, processing, errors, reset } = useForm({
        country_id: "184", // fixed
        label: "",
        city: "",
        address_line: "",
        url: url,
    });

    const commonInputProps = {
        borderColor: Colors.border.medium,
        borderRadius: 6,
        _focus: { boxShadow: "none", borderColor: Colors.border.medium },
    };
    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("customer.addresses.store"), {
            onSuccess: () => {
                onClose();
                reset();
                toaster.create({
                    title: "Address added.",
                    type: "success",
                });
            },
        });
    };

    const header = (
        <Text fontSize="xl" fontWeight="bold">
            Add New Address
        </Text>
    );

    const body = (
        <Fieldset.Root
            size="lg"
            overflowY="auto"
            focusRingColor={Colors.primary.main}
        >
            <Fieldset.Content as="form" onSubmit={handleSubmit}>
                <Stack gap={4}>
                    {/* Country (read-only) */}
                    <Field.Root>
                        <Field.Label {...commonLabelProps}>
                            <FiGlobe color={Colors.primary.main} /> Country
                        </Field.Label>
                        <Input
                            name="country"
                            readOnly
                            value={"United Arab Emirates"}
                            bg={Colors.gray.light}
                            {...commonInputProps}
                        />
                    </Field.Root>
                    <Field.Root>
                        <Field.Label {...commonLabelProps}>
                            <MdLabelImportantOutline
                                color={Colors.primary.main}
                            />{" "}
                            Label
                        </Field.Label>
                        <Input
                            name="label"
                            placeholder="e.g. Home, Work"
                            value={data.label}
                            onChange={(e) => setData("label", e.target.value)}
                            {...commonInputProps}
                        />
                        {errors.label && (
                            <Text color="red.500">{errors.label}</Text>
                        )}
                    </Field.Root>
                    <VStack gap={Spacing.md}>
                        {/* City */}
                        <Field.Root>
                            <Field.Label {...commonLabelProps}>
                                <FiMapPin color={Colors.primary.main} /> City
                            </Field.Label>
                            <Input
                                name="city"
                                placeholder="e.g. Dubai"
                                value={data.city}
                                onChange={(e) =>
                                    setData("city", e.target.value)
                                }
                                {...commonInputProps}
                            />
                            {errors.city && (
                                <Text color="red.500">{errors.city}</Text>
                            )}
                        </Field.Root>

                        {/* Address Line */}
                        <Field.Root>
                            <Field.Label {...commonLabelProps}>
                                <FaStreetView color={Colors.primary.main} />{" "}
                                Address Line
                            </Field.Label>
                            <Input
                                name="street"
                                placeholder="e.g. Sheikh Zayed Rd, Burj Khalifa Tower, Apt 2105"
                                value={data.address_line}
                                onChange={(e) =>
                                    setData("address_line", e.target.value)
                                }
                                {...commonInputProps}
                            />
                            {errors.address_line && (
                                <Text color="red.500">
                                    {errors.address_line}
                                </Text>
                            )}
                        </Field.Root>
                    </VStack>

                    {/* Save button */}
                    <HStack
                        justify="flex-end"
                        gap={Spacing.mds}
                        pt={Spacing.sm}
                    >
                        <Button
                            bg={Colors.primary.main}
                            p={Spacing.sm}
                            color={Colors.primary.onPrimary}
                            fontWeight={Typography.fontWeights.bold}
                            disabled={processing}
                            onClick={handleSubmit}
                        >
                            Save Address
                        </Button>
                    </HStack>
                </Stack>
            </Fieldset.Content>
        </Fieldset.Root>
    );

    return (
        <ChakraDialog
            title={header}
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
        >
            {body}
        </ChakraDialog>
    );
}
