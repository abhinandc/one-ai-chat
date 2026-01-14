import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ChainOfThoughtContextValue {
  defaultOpen?: boolean;
}

const ChainOfThoughtContext = React.createContext<ChainOfThoughtContextValue>({
  defaultOpen: false,
});

interface ChainOfThoughtProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function ChainOfThought({
  defaultOpen = false,
  children,
  className,
  ...props
}: ChainOfThoughtProps) {
  return (
    <ChainOfThoughtContext.Provider value={{ defaultOpen }}>
      <div
        className={cn(
          "rounded-xl border border-border/50 bg-muted/30 backdrop-blur-sm overflow-hidden",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </ChainOfThoughtContext.Provider>
  );
}

interface ChainOfThoughtContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ChainOfThoughtContent({
  children,
  className,
  ...props
}: ChainOfThoughtContentProps) {
  return (
    <div className={cn("divide-y divide-border/30", className)} {...props}>
      {children}
    </div>
  );
}

interface ChainOfThoughtItemProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function ChainOfThoughtItem({
  children,
  defaultOpen,
  className,
}: ChainOfThoughtItemProps) {
  const context = React.useContext(ChainOfThoughtContext);
  const [isOpen, setIsOpen] = React.useState(
    defaultOpen ?? context.defaultOpen ?? false
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn("group", className)}>{children}</div>
    </Collapsible>
  );
}

interface ChainOfThoughtTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function ChainOfThoughtTrigger({
  children,
  className,
  ...props
}: ChainOfThoughtTriggerProps) {
  return (
    <CollapsibleTrigger asChild>
      <button
        className={cn(
          "flex w-full items-center justify-between px-4 py-3",
          "text-sm font-medium text-foreground/80 hover:text-foreground",
          "hover:bg-muted/50 transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          className
        )}
        {...props}
      >
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary/60 group-data-[state=open]:bg-primary animate-pulse" />
          {children}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </button>
    </CollapsibleTrigger>
  );
}

interface ChainOfThoughtStepProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ChainOfThoughtStep({
  children,
  className,
  ...props
}: ChainOfThoughtStepProps) {
  return (
    <CollapsibleContent>
      <div
        className={cn(
          "px-4 pb-3 pt-1 space-y-2 text-sm text-muted-foreground",
          "border-l-2 border-primary/20 ml-[1.1rem] pl-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </CollapsibleContent>
  );
}

interface ChainOfThoughtStepItemProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function ChainOfThoughtStepItem({
  children,
  className,
  ...props
}: ChainOfThoughtStepItemProps) {
  return (
    <p
      className={cn(
        "text-sm leading-relaxed text-foreground/70",
        "pl-2 relative before:absolute before:left-0 before:top-2 before:h-1 before:w-1 before:rounded-full before:bg-muted-foreground/40",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}
