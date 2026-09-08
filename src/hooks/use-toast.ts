"use client";

import { useState } from "react";

export function useToast() {
  const [toast, setToast] = useState({
    open: false,
    title: "",
    description: "",
    variant: "default",
  });

  const show = (options: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => {
    setToast({
      open: true,
      title: options.title,
      description: options.description,
      variant: options.variant ?? "default",
    });
  };

  const dismiss = () => {
    setToast({
      open: false,
      title: "",
      description: "",
      variant: "default",
    });
  };

  return { toast: { open: toast.open, title: toast.title, description: toast.description, variant: toast.variant }, show, dismiss };
}