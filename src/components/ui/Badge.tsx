import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "text-primary-foreground border-transparent bg-primary hover:bg-primary/80",
        secondary:
          "text-secondary-foreground border-transparent bg-secondary hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/80 border-transparent",
        outline: "text-foreground",
        // Add variants for rarities if desired, e.g.:
        // common: "bg-gray-500 text-white border-transparent",
        // uncommon: "bg-green-600 text-white border-transparent",
        // rare: "bg-blue-600 text-white border-transparent",
        // epic: "bg-purple-600 text-white border-transparent",
        // legendary: "bg-yellow-500 text-black border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
