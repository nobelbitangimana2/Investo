"use client";
import { useToastStore } from "@/lib/toast-store";

export function useToast() {
  const { addToast } = useToastStore();

  return {
    success: (message: string, title?: string) =>
      addToast({ type: "success", message, title }),
    error: (message: string, title?: string) =>
      addToast({ type: "error", message, title }),
    info: (message: string, title?: string) =>
      addToast({ type: "info", message, title }),
    warning: (message: string, title?: string) =>
      addToast({ type: "warning", message, title }),
  };
}
