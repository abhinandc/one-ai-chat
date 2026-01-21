"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface InputGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        className={cn(
          "bg-background border-input ring-offset-background flex w-full flex-col rounded-lg border focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
InputGroup.displayName = "InputGroup";

export interface InputGroupAddonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  align?: "block-start" | "block-end" | "inline-start" | "inline-end";
}

const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, align = "block-end", ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex items-center px-3 py-2",
          align === "block-start" && "border-b",
          align === "block-end" && "border-t",
          align === "inline-start" && "border-r",
          align === "inline-end" && "border-l",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
InputGroupAddon.displayName = "InputGroupAddon";

export interface InputGroupTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  InputGroupTextareaProps
>(({ className, ...props }, ref) => {
  return (
    <Textarea
      className={cn(
        "resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
InputGroupTextarea.displayName = "InputGroupTextarea";

export interface InputGroupButtonProps
  extends React.ComponentProps<typeof Button> {}

const InputGroupButton = React.forwardRef<
  HTMLButtonElement,
  InputGroupButtonProps
>(({ className, ...props }, ref) => {
  return (
    <Button
      className={cn("shrink-0", className)}
      ref={ref}
      {...props}
    />
  );
});
InputGroupButton.displayName = "InputGroupButton";

export {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
  InputGroupButton,
};
