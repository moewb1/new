// types/Components/ChakraDialogProps.type.ts
import type { ReactNode } from "react";

export type DialogSize = "xs" | "sm" | "md" | "lg" | "xl" | "cover" | "full";

export type ResponsiveDialogSize =
  | DialogSize
  | DialogSize[]
  | Partial<Record<"base" | "sm" | "md" | "lg" | "xl", DialogSize>>;

export interface ChakraDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  // now accepts "md", ["sm","md"], or { base: "sm", md: "lg" }
  size?: ResponsiveDialogSize;
  placement?: "center" | "top" | "bottom";
  motionPreset?:
    | "scale"
    | "slide-in-bottom"
    | "slide-in-top"
    | "slide-in-left"
    | "slide-in-right"
    | "none";
  closeOnOverlayClick?: boolean;
}
