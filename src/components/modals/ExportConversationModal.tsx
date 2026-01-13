import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { conversationService } from "@/services/conversationService";
import { Download, FileText, FileType, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  conversationTitle: string;
  userEmail: string;
}

export function ExportConversationModal({
  open,
  onOpenChange,
  conversationId,
  conversationTitle,
  userEmail,
}: ExportConversationModalProps) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"markdown" | "pdf" | null>(null);

  const handleExport = async (format: "markdown" | "pdf") => {
    setExporting(true);
    setSelectedFormat(format);

    try {
      if (format === "markdown") {
        const markdown = await conversationService.exportAsMarkdown(conversationId, userEmail);

        // Create a blob and download
        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${conversationTitle.replace(/[^a-z0-9]/gi, "_")}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Exported as Markdown",
          description: "Your conversation has been downloaded as a .md file",
        });
      } else if (format === "pdf") {
        const pdfBlob = await conversationService.exportAsPDF(conversationId, userEmail);

        // Create a blob and download
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${conversationTitle.replace(/[^a-z0-9]/gi, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Exported as PDF",
          description: "Your conversation has been downloaded as a .pdf file",
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export conversation",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
      setSelectedFormat(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="size-5 text-primary" />
            Export Conversation
          </DialogTitle>
          <DialogDescription>
            Choose a format to download your conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <motion.button
            onClick={() => !exporting && handleExport("markdown")}
            disabled={exporting}
            whileHover={{ scale: exporting ? 1 : 1.02 }}
            whileTap={{ scale: exporting ? 1 : 0.98 }}
            className={cn(
              "w-full p-4 rounded-lg border-2 transition-all",
              "hover:border-primary hover:bg-primary/5",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-start gap-4 text-left"
            )}
          >
            <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              {exporting && selectedFormat === "markdown" ? (
                <Loader2 className="size-5 text-blue-500 animate-spin" />
              ) : (
                <FileText className="size-5 text-blue-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">Markdown (.md)</h3>
              <p className="text-sm text-muted-foreground">
                Plain text format with formatting. Great for documentation and version control.
              </p>
            </div>
          </motion.button>

          <motion.button
            onClick={() => !exporting && handleExport("pdf")}
            disabled={exporting}
            whileHover={{ scale: exporting ? 1 : 1.02 }}
            whileTap={{ scale: exporting ? 1 : 0.98 }}
            className={cn(
              "w-full p-4 rounded-lg border-2 transition-all",
              "hover:border-primary hover:bg-primary/5",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-start gap-4 text-left"
            )}
          >
            <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
              {exporting && selectedFormat === "pdf" ? (
                <Loader2 className="size-5 text-red-500 animate-spin" />
              ) : (
                <FileType className="size-5 text-red-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">PDF Document (.pdf)</h3>
              <p className="text-sm text-muted-foreground">
                Professional document format. Perfect for sharing and archiving.
              </p>
            </div>
          </motion.button>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exporting}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
