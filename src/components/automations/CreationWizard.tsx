import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Zap, 
  Clock, 
  Webhook, 
  Mail, 
  MessageSquare,
  Database,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const STEPS = [
  { id: 1, title: "Select Trigger", description: "What starts this workflow?" },
  { id: 2, title: "Configure Trigger", description: "Set up the trigger details" },
  { id: 3, title: "Add Action", description: "What happens next?" },
  { id: 4, title: "Configure Action", description: "Set up the action details" },
];

const TRIGGERS = [
  { id: "webhook", label: "Webhook", icon: Webhook, description: "Runs when data is received via URL" },
  { id: "schedule", label: "Schedule", icon: Clock, description: "Runs at specific intervals" },
  { id: "event", label: "Event", icon: Zap, description: "Runs when something happens in an app" },
];

const ACTIONS = [
  { id: "email", label: "Send Email", icon: Mail, description: "Send an email via SMTP or API" },
  { id: "slack", label: "Send Slack Message", icon: MessageSquare, description: "Post a message to a channel" },
  { id: "db", label: "Update Database", icon: Database, description: "Insert or update a record" },
];

export function CreationWizard({ open, onOpenChange, onComplete }: CreationWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    trigger: "",
    triggerConfig: {},
    action: "",
    actionConfig: {}
  });

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else onComplete();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <RadioGroup 
              value={data.trigger} 
              onValueChange={(v) => setData({ ...data, trigger: v })}
              className="grid gap-3"
            >
              {TRIGGERS.map((t) => (
                <div key={t.id}>
                  <RadioGroupItem value={t.id} id={t.id} className="peer sr-only" />
                  <Label 
                    htmlFor={t.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-card border border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50 hover:border-primary/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-md bg-muted text-muted-foreground",
                        data.trigger === t.id && "bg-primary/10 text-primary"
                      )}>
                        <t.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{t.label}</div>
                        <div className="text-xs text-muted-foreground">{t.description}</div>
                      </div>
                    </div>
                    {data.trigger === t.id && <Check className="h-4 w-4 text-primary" />}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
               {data.trigger === "schedule" && (
                 <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Input placeholder="e.g. Every Monday at 9am" className="bg-muted border-border" />
                    <p className="text-xs text-muted-foreground">Natural language supported.</p>
                 </div>
               )}
               {data.trigger === "webhook" && (
                 <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <div className="p-3 rounded-md bg-muted border border-border font-mono text-xs text-muted-foreground break-all">
                       https://api.oneorigin.ai/hooks/v1/workspaces/ws_123/catch
                    </div>
                    <p className="text-xs text-muted-foreground">Send a POST request to this URL.</p>
                 </div>
               )}
               {data.trigger === "event" && (
                 <div className="space-y-2">
                    <Label>Event Source</Label>
                    <Input placeholder="Select source..." className="bg-muted border-border" />
                 </div>
               )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <RadioGroup 
              value={data.action} 
              onValueChange={(v) => setData({ ...data, action: v })}
              className="grid gap-3"
            >
              {ACTIONS.map((a) => (
                <div key={a.id}>
                  <RadioGroupItem value={a.id} id={a.id} className="peer sr-only" />
                  <Label 
                    htmlFor={a.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-card border border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50 hover:border-primary/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-md bg-muted text-muted-foreground",
                        data.action === a.id && "bg-primary/10 text-primary"
                      )}>
                        <a.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{a.label}</div>
                        <div className="text-xs text-muted-foreground">{a.description}</div>
                      </div>
                    </div>
                    {data.action === a.id && <Check className="h-4 w-4 text-primary" />}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      case 4:
         return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="space-y-4">
               <div className="space-y-2">
                  <Label>Configuration</Label>
                  <Textarea placeholder="Enter JSON configuration..." className="min-h-[120px] bg-muted border-border font-mono text-xs" />
               </div>
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => {
        if (!v) setStep(1); // Reset on close
        onOpenChange(v);
    }}>
      <SheetContent className="w-[400px] sm:w-[540px] border-l border-border bg-background p-0 shadow-2xl flex flex-col">
        
        {/* Header */}
        <SheetHeader className="px-6 py-6 border-b border-border bg-card/50">
           <div className="flex items-center justify-between mb-2">
              <SheetTitle className="text-xl font-semibold">New Automation</SheetTitle>
              <div className="text-sm text-muted-foreground font-mono">Step {step}/4</div>
           </div>
           
           {/* Progress Bar */}
           <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300 ease-in-out" 
                style={{ width: `${(step / 4) * 100}%` }} 
              />
           </div>
           
           <div className="pt-4">
              <h2 className="text-lg font-medium text-foreground">{STEPS[step-1].title}</h2>
              <p className="text-sm text-muted-foreground">{STEPS[step-1].description}</p>
           </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
           {renderStepContent()}
        </div>

        {/* Footer */}
        <SheetFooter className="p-6 border-t border-border bg-card/50">
           <div className="flex w-full justify-between gap-4">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                disabled={step === 1}
                className="flex-1 border-border"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                className="flex-1"
                disabled={
                   (step === 1 && !data.trigger) || 
                   (step === 3 && !data.action)
                }
              >
                {step === 4 ? "Create & Open Builder" : "Next"}
                {step !== 4 && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
           </div>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
}
