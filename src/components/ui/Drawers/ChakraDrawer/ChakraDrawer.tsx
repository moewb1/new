import { ChakraDrawerProps } from "@/types/Components/ChakraDrawerProps.type";
import { Drawer, Portal, CloseButton, ButtonProps } from "@chakra-ui/react";

export const ChakraDrawer = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = "md",
    placement = "end",
}: ChakraDrawerProps) => {
    return (
        <Drawer.Root
            open={isOpen}
            onOpenChange={(e) => e.open === false && onClose()}
            size={size}
            placement={placement}
        >
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.Header
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                        >
                            {title && <Drawer.Title>{title}</Drawer.Title>}
                            <Drawer.CloseTrigger asChild>
                                <CloseButton />
                            </Drawer.CloseTrigger>
                        </Drawer.Header>
                        <Drawer.Body>{children}</Drawer.Body>

                        {footer && <Drawer.Footer>{footer}</Drawer.Footer>}
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
};
