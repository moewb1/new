import { ChakraDialogProps } from "@/types/Components/ChakraDialogProps.type";
import { CloseButton, Dialog, Portal, useBreakpointValue } from "@chakra-ui/react";

export default function ChakraDialog({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = "md",
    placement = "center",
    motionPreset = "scale",
    closeOnOverlayClick = true,
}: ChakraDialogProps) {
    const resolvedSize = useBreakpointValue(size as any) ?? (size as string);
    return (
        <Dialog.Root
            open={isOpen}
            onOpenChange={(e) => {
                if (!e.open) onClose();
            }}
            size={resolvedSize}
            placement={placement}
            motionPreset={motionPreset}
            closeOnInteractOutside={closeOnOverlayClick}
        >
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        {title && (
                            <Dialog.Header>
                                <Dialog.Title>{title}</Dialog.Title>
                            </Dialog.Header>
                        )}

                        <Dialog.Body>{children}</Dialog.Body>

                        {footer && <Dialog.Footer>{footer}</Dialog.Footer>}

                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
