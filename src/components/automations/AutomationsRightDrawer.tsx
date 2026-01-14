import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MoreHorizontal, 
  Edit,
  Trash2,
  Activity,
  Calendar,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AutomationData {
  id: number;
  title: string;
  description: string;
  active: boolean;
}

interface AutomationsRightDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation: AutomationData | null;
  onEdit: () => void;
}

export function AutomationsRightDrawer({ 
  open, 
  onOpenChange, 
  automation,
  onEdit 
}: AutomationsRightDrawerProps) {
  if (!automation) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] border-l border-border bg-background p-0 shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 py-5 border-b border-border bg-card/50">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <SheetTitle className="text-xl font-semibold tracking-tight text-foreground">
                  {automation.title}
                </SheetTitle>
                <SheetDescription className="text-muted-foreground flex items-center gap-2">
                  <span className="flex items-center gap-1.5">
                    {automation.active ? (
                      <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-zinc-600" />
                    )}
                    {automation.active ? 'Active' : 'Inactive'}
                  </span>
                  <span>•</span>
                  <span>Last run 2 mins ago</span>
                </SheetDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Main Content */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={onEdit} 
                  className="w-full bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border border-primary/20 shadow-none"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Workflow
                </Button>
                <div className="flex items-center justify-between px-4 py-2 rounded-md border border-border bg-card">
                  <span className="text-sm font-medium text-foreground">Enable</span>
                  <Switch checked={automation.active} />
                </div>
              </div>

              {/* Stats/Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg border border-border bg-card/50 space-y-1">
                  <span className="text-xs text-muted-foreground block">Success Rate</span>
                  <span className="text-lg font-mono font-medium text-green-500">98.5%</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card/50 space-y-1">
                  <span className="text-xs text-muted-foreground block">Total Runs</span>
                  <span className="text-lg font-mono font-medium text-foreground">1,240</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card/50 space-y-1">
                  <span className="text-xs text-muted-foreground block">Avg Duration</span>
                  <span className="text-lg font-mono font-medium text-foreground">1.2s</span>
                </div>
              </div>

              {/* Tabs for History/Details */}
              <Tabs defaultValue="history" className="w-full">
                <TabsList className="w-full grid grid-cols-2 bg-muted/50 p-1">
                  <TabsTrigger value="history" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Run History</TabsTrigger>
                  <TabsTrigger value="settings" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="history" className="mt-4 space-y-4">
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</h4>
                    
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/30 hover:bg-card/50 transition-colors group cursor-default">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-md flex items-center justify-center border",
                            i === 3 ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-green-500/10 border-green-500/20 text-green-500"
                          )}>
                            {i === 3 ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {i === 3 ? 'Failed to process' : 'Successfully processed'}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Today, 10:{30 + i} AM
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">0.8s</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="settings" className="mt-4 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <h4 className="text-sm font-medium text-foreground">General</h4>
                       <div className="space-y-4 rounded-lg border border-border p-4 bg-card/30">
                          <div className="flex items-center justify-between">
                             <div className="space-y-0.5">
                               <label className="text-sm font-medium text-foreground">Error Notifications</label>
                               <p className="text-xs text-muted-foreground">Receive emails when runs fail</p>
                             </div>
                             <Switch defaultChecked />
                          </div>
                          <Separator className="bg-border/50" />
                          <div className="flex items-center justify-between">
                             <div className="space-y-0.5">
                               <label className="text-sm font-medium text-foreground">Debug Logging</label>
                               <p className="text-xs text-muted-foreground">Keep detailed logs for 24h</p>
                             </div>
                             <Switch />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <h4 className="text-sm font-medium text-red-400">Danger Zone</h4>
                       <div className="rounded-lg border border-red-900/20 p-4 bg-red-950/10">
                          <div className="flex items-center justify-between">
                             <div className="space-y-0.5">
                               <label className="text-sm font-medium text-red-400">Delete Automation</label>
                               <p className="text-xs text-red-400/70">Permanently remove this workflow</p>
                             </div>
                             <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-950/30">
                               <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                       </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
