"use client";

import { useEffect } from "react";

export function ErrorHandler() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const reason = event.reason as {
        msg?: string;
        type?: string;
        name?: string;
        message?: string;
      } | undefined;

      const isCancelation =
        reason?.type === "cancelation" ||
        reason?.name === "Canceled" ||
        reason?.msg === "operation is manually canceled" ||
        reason?.message === "operation is manually canceled" ||
        (event.reason instanceof Error && event.reason.name === "Canceled");

      if (isCancelation) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return null;
}
