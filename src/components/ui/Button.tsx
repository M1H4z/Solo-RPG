import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils"; // Assuming a utility for merging class names exists

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "text-primary-foreground bg-primary hover:bg-primary/90 focus-visible:ring-primary",
        destructive:
          "text-danger-foreground bg-danger hover:bg-danger/90 focus-visible:ring-danger",
        outline:
          "border border-border-light bg-transparent hover:bg-surface hover:text-text-primary focus-visible:ring-primary",
        secondary:
          "text-secondary-foreground bg-secondary hover:bg-secondary/90 focus-visible:ring-secondary",
        ghost: "hover:bg-surface hover:text-text-primary",
        link: "text-primary underline-offset-4 hover:underline",
        accent:
          "text-accent-foreground bg-accent hover:bg-accent/90 focus-visible:ring-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "size-10",
      },
      glow: {
        none: "",
        primary: "hover:shadow-glow-primary",
        secondary: "hover:shadow-glow-secondary",
        accent: "hover:shadow-glow-accent",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: "none",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, glow, asChild = false, ...props }, ref) => {
    // Note: This assumes you might use Radix Slot for `asChild`, but it's not strictly necessary here.
    // If not using Slot, remove `asChild` prop and logic.
    const Comp = "button"; // Simplified: Always render a button for now
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, glow, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
