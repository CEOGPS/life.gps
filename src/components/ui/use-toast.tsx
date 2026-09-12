import { toast as sonnerToast } from "sonner";

export type Toast = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  const toast = (props: Toast) => {
    if (props.variant === "destructive") {
      return sonnerToast.error(props.title, { description: props.description });
    }
    return sonnerToast(props.title, { description: props.description });
  };

  return { toast };
}

// Also export toast directly for compatibility
export const toast = sonnerToast;