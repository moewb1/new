// src/components/WebApp/OrderDialog/OrderDialog.tsx
import React from "react";
import { HStack, VStack, Text, Button, Icon } from "@chakra-ui/react";
import { FiCheckCircle } from "react-icons/fi";
import ChakraDialog from "@/Components/WebApp/Dialogs/ChakraDialog/ChakraDialog";
import Colors from "@/Constants/Colors";
import Typography from "@/Constants/Typography";
import { IconType } from "react-icons";

interface OrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  description: React.ReactNode;
  icon: IconType;
  iconColor?: string;
}

export const OrderDialog: React.FC<OrderDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  description,
  icon,
  iconColor = Colors.primary.main,

}) => (
  <ChakraDialog
    isOpen={isOpen}
    onClose={onClose}
    size="md"
    title={
      <HStack gap={3}>
        <Icon as={icon} boxSize={35.5} color={iconColor} />
        <VStack align="start" gap={0}>
          <Text fontSize={Typography.fontSizes["2xl"]} fontWeight={Typography.fontWeights.semibold}>
            {title}
          </Text>
          {subtitle && (
            <Text fontSize="md" color={Colors.gray.xDark}>
              {subtitle}
            </Text>
          )}
        </VStack>
      </HStack>
    }
    footer={
      <Button onClick={onClose} bgColor={Colors.primary.main} color="white" p={5}>
        OK
      </Button>
    }
  >
    {description}
  </ChakraDialog>
);
