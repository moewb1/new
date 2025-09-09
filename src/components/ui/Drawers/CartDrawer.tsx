import { ChakraDrawer } from "@/Components/WebApp/Drawers/ChakraDrawer/ChakraDrawer";
import {
    Button,
    VStack,
    Text,
    Box,
    Stack,
    HStack,
    Image,
    IconButton,
} from "@chakra-ui/react";
import { BiMinus, BiPlus } from "react-icons/bi";
import Typography from "@/Constants/Typography";
import colors from "@/Constants/Colors";
import Spacing from "@/Constants/Spacing";
import { useCartStore } from "@/Store/useCartStore";
import { useProductStore } from "@/Store/useProductStore";
import { router } from "@inertiajs/react";
import { Auth } from "@/types";
import Colors from "@/Constants/Colors";
import { FaTrash } from "react-icons/fa";
import { HiOutlineTrash } from "react-icons/hi";
import {
    discountedPriceStyle,
    discountPriceStackStyle,
    priceFromTextStyle,
    strikePriceStyle,
} from "@/styles/discountedPrice.styles";
const CartDrawerTitle = ({ count }: { count: number }) => {
    const { clearCart } = useCartStore();

    return (
        <HStack alignItems="center" w="100%">
            <Text
                fontSize={Typography.fontSizes.lg}
                fontWeight={Typography.fontWeights.bold}
                color={colors.text.primary}
            >
                Your Cart ({count})
            </Text>
            <IconButton
                aria-label="Clear cart"
                size={{ base: "sm", sm: "md" }}
                variant="ghost"
                display={"block"}
                onClick={clearCart}
                color={colors.semantic.error}
            >
                <HiOutlineTrash />
            </IconButton>
        </HStack>
    );
};

const CartDrawerBody = () => {
    const { items, increase, decrease } = useCartStore();
    const { getProductById } = useProductStore();
    return (
        <Stack gap={Spacing.lg}>
            {items.map((item) => {
                const product = getProductById(item.product_id);
                const variant = product?.variants.find(
                    (v) => v.id === item.variant_id
                );
                if (!product || !variant) return null;

                return (
                    <HStack
                        key={item.variant_id}
                        gap={4}
                        alignItems="center"
                        justifyContent="center"
                        cursor={"pointer"}
                        onClick={() => {
                            router.visit(`/products/${product.id}`);
                        }}
                    >
                        <Image
                            src={product?.medias?.[0]?.variants?.thumb_plus}
                            alt={product?.name}
                            style={{
                                borderRadius: 5,
                                borderWidth: 1,
                                userSelect: "none",
                            }}
                            boxSize="60px"
                            objectFit="cover"
                            draggable={false}
                            cursor={"pointer"}
                        />
                        <VStack align="start" gap={0} flex="1">
                            <HStack w="full" justify="space-between">
                                <Text
                                    style={{
                                        fontSize: Typography.fontSizes.sm,
                                        fontWeight: Typography.fontWeights.bold,
                                        color: colors.text.primary,
                                    }}
                                >
                                    {product.name}
                                </Text>
                            </HStack>

                            <Text
                                style={{
                                    fontSize: Typography.fontSizes.xs,
                                    fontWeight: Typography.fontWeights.bold,
                                    color: colors.gray.dark,
                                }}
                            >
                                Size: {variant.size_label}
                            </Text>

                            <Box>
                                {variant?.total_discount_percentage > 0 ? (
                                    <Stack {...discountPriceStackStyle}>
                                        <Text
                                            {...strikePriceStyle}
                                            fontSize={Typography.fontSizes.xsl}
                                        >
                                            AED{" "}
                                            {variant?.whole_sale_price?.toFixed(
                                                2
                                            )}
                                        </Text>
                                        <Text
                                            {...discountedPriceStyle}
                                            fontSize={Typography.fontSizes.xsl}
                                        >
                                            AED{" "}
                                            {variant?.final_price?.toFixed(2)}
                                        </Text>
                                    </Stack>
                                ) : (
                                    <Text
                                        {...priceFromTextStyle}
                                        fontSize={Typography.fontSizes.xsl}
                                    >
                                        AED {variant?.final_price?.toFixed(2)}
                                    </Text>
                                )}
                            </Box>
                        </VStack>
                        <HStack gap={3}>
                            <BiMinus
                                cursor="pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    decrease(item.variant_id);
                                }}
                            />
                            <Text textAlign="center" userSelect={"none"}>
                                {item.quantity}
                            </Text>
                            <BiPlus
                                cursor="pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    increase(item.product_id, item.variant_id);
                                }}
                            />
                        </HStack>
                    </HStack>
                );
            })}
        </Stack>
    );
};

interface CartDrawerFooterProps {
    auth: Auth;
    unauthenticatedAction: () => void;
}

const CartDrawerFooter: React.FC<CartDrawerFooterProps> = ({
    auth,
    unauthenticatedAction,
}) => {
    const { subtotal, items } = useCartStore();

    const handleCheckout = () => {
        if (auth.user) {
            router.get(route("checkout"));
        } else {
            unauthenticatedAction();
        }
    };
    return (
        <VStack w="full">
            <Box flex="1" w="full">
                <Text
                    textAlign="right"
                    color={colors.text.primary}
                    fontWeight={Typography.fontWeights.bold}
                >
                    Subtotal: AED {subtotal().toFixed(2)}
                </Text>
            </Box>
            <Button
                w="full"
                bg={colors.primary.main}
                borderRadius={5}
                px={Spacing.xl}
                fontSize={Typography.fontSizes.sm}
                fontWeight={Typography.fontWeights.bold}
                color={colors.text.onPrimary}
                onClick={handleCheckout}
                disabled={items.length == 0}
            >
                Checkout
            </Button>
        </VStack>
    );
};

const CartDrawer: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    auth: Auth;
    unauthenticatedAction: () => void;
}> = ({ isOpen, onClose, auth, unauthenticatedAction }) => {
    const getTotalQuantities = useCartStore((s) => s.totalQuantity);

    return (
        <ChakraDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={<CartDrawerTitle count={getTotalQuantities()} />}
            footer={
                <CartDrawerFooter
                    auth={auth}
                    unauthenticatedAction={unauthenticatedAction}
                />
            }
        >
            <CartDrawerBody />
        </ChakraDrawer>
    );
};

export default CartDrawer;
