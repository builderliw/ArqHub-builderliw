import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.985] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--ink)] text-white shadow-[0_1px_0_0_rgb(255_255_255/0.08)_inset,0_1px_2px_0_rgb(0_0_0/0.08),0_4px_12px_-2px_rgb(0_0_0/0.12)] hover:bg-black",
        primary:
          "bg-primary text-primary-foreground shadow-[0_1px_0_0_rgb(255_255_255/0.12)_inset,0_2px_8px_-2px_color-mix(in_oklab,var(--primary)_40%,transparent)] hover:bg-primary-dark",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:opacity-95",
        outline:
          "border border-border-strong bg-background text-foreground shadow-xs hover:bg-surface hover:border-border-strong",
        secondary:
          "bg-surface text-foreground border border-border hover:bg-surface-2",
        ghost:
          "text-foreground hover:bg-surface",
        link:
          "text-primary underline-offset-4 hover:underline px-0 h-auto",
      },
      size: {
        default: "h-9 px-4 text-sm",
        sm: "h-8 rounded-md px-3 text-[13px]",
        lg: "h-11 rounded-md px-6 text-[15px]",
        xl: "h-12 rounded-lg px-7 text-[15px]",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
