import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring/30 focus:ring-offset-1",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-ink text-white",
        primary:
          "border-transparent bg-accent text-accent-foreground",
        secondary:
          "border-border bg-surface text-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline:
          "border-border-strong bg-transparent text-foreground",
        success:
          "border-transparent bg-emerald-50 text-emerald-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
