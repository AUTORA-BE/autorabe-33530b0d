import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_4px_14px_-3px_hsl(var(--primary)/0.4)] hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_hsl(var(--primary)/0.5)] active:translate-y-0 active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-border/60 bg-background/80 backdrop-blur-sm text-foreground hover:bg-secondary/60 hover:border-primary/30",
        secondary:
          "bg-secondary text-secondary-foreground border border-border/30 hover:bg-secondary/70",
        ghost:
          "text-foreground hover:bg-secondary/60",
        link:
          "text-primary underline-offset-4 hover:underline h-auto p-0",
        primary:
          "bg-primary text-primary-foreground shadow-[0_4px_14px_-3px_hsl(var(--primary)/0.4)] hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_hsl(var(--primary)/0.5)] active:translate-y-0 active:scale-[0.98]",
        glass:
          "bg-card/60 backdrop-blur-xl border border-border/30 text-foreground hover:bg-card/80 hover:border-border/50",
        "ghost-link":
          "text-muted-foreground hover:text-foreground hover:underline underline-offset-4 h-auto p-0",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    // Force type="button" by default to prevent accidental form submissions
    // when a Button is rendered inside a <form> without an explicit type.
    // Without this, every <Button> in a form behaves as a submit button by
    // HTML spec — which caused mobile photo upload bugs in the Sell wizard.
    // Explicit type="submit" / "reset" still works (caller wins).
    const resolvedType = asChild ? undefined : (type ?? "button");
    return (
      <Comp
        type={resolvedType}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
