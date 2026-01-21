"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => {
    return (
      <div
        className={cn(
          "inline-flex",
          orientation === "horizontal"
            ? "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none [&>*:not(:last-child)]:border-r-0"
            : "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none [&>*:not(:last-child)]:border-b-0",
          className
        )}
        ref={ref}
        role="group"
        {...props}
      />
    );
  }
);
ButtonGroup.displayName = "ButtonGroup";

export interface ButtonGroupTextProps
  extends React.HTMLAttributes<HTMLSpanElement> {}

const ButtonGroupText = React.forwardRef<HTMLSpanElement, ButtonGroupTextProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center px-3 py-1 text-sm font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
ButtonGroupText.displayName = "ButtonGroupText";

export { ButtonGroup, ButtonGroupText };
