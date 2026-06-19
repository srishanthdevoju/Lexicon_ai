import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-white",
        secondary: "border-transparent bg-background text-text-secondary",
        outline: "border-border text-text-secondary",
        standard: "border-transparent bg-gray-100 text-gray-700",
        keyterm: "border-transparent bg-primary-50 text-primary-700",
        critical: "border-transparent bg-red-50 text-red-700",
        high: "border-transparent bg-red-50 text-red-700",
        medium: "border-transparent bg-orange-50 text-orange-700",
        low: "border-transparent bg-green-50 text-green-700",
        success: "border-transparent bg-success-light text-green-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
