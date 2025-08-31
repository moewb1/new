import type { ReactNode } from "react";

export interface ChakraDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  placement?: "start" | "end" | "top" | "bottom";
  trigger?: ReactNode;
}
