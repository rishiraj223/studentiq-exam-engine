import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { hover?: boolean; glass?: boolean }
>(({ className, hover = false, glass = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl text-white transition-all duration-300",
      glass ? "bg-white/5 border border-white/10 backdrop-blur-sm" : "bg-dark-card border border-dark-border",
      hover && "hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-500/10",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardContent };
