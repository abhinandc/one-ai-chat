import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceInputModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTranscript: (text: string) => void;
}

export function VoiceInputModal({
  open,
  onOpenChange,
  onTranscript,
}: VoiceInputModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!open) {
      setTranscript("");
      setError(null);
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  }, [open]);

  // Auto-start listening when modal opens
  useEffect(() => {
    if (open && !isListening) {
      startListening();
    }
  }, [open]);

  // Auto-send transcript when user stops speaking (after a pause)
  useEffect(() => {
    if (!isListening && transcript.trim()) {
      // Small delay to allow final words to be captured
      const timer = setTimeout(() => {
        onTranscript(transcript.trim());
        onOpenChange(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, transcript, onTranscript, onOpenChange]);

  const startListening = () => {
    setError(null);
    setTranscript("");

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleClose = () => {
    stopListening();
    onOpenChange(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-screen m-0 p-0 bg-background/98 backdrop-blur-2xl border-none rounded-none flex flex-col items-center justify-center">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-6 right-6 h-10 w-10 rounded-full text-muted-foreground hover:text-foreground"
          onClick={handleClose}
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="flex flex-col items-center justify-center gap-12 max-w-2xl px-8">
          {/* Animated Orb */}
          <div className="relative">
            {/* Outer glow rings */}
            <AnimatePresence>
              {isListening && (
                <>
                  <motion.div
                    initial={{ scale: 1, opacity: 0.3 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-primary/20"
                    style={{ width: 160, height: 160, left: -16, top: -16 }}
                  />
                  <motion.div
                    initial={{ scale: 1, opacity: 0.3 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-primary/25"
                    style={{ width: 160, height: 160, left: -16, top: -16 }}
                  />
                  <motion.div
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-primary/30"
                    style={{ width: 160, height: 160, left: -16, top: -16 }}
                  />
                </>
              )}
            </AnimatePresence>

            {/* Main orb */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleListening}
              className="relative z-10"
            >
              <motion.div
                animate={isListening ? {
                  boxShadow: [
                    "0 0 40px rgba(var(--primary-rgb, 59, 130, 246), 0.4)",
                    "0 0 80px rgba(var(--primary-rgb, 59, 130, 246), 0.6)",
                    "0 0 40px rgba(var(--primary-rgb, 59, 130, 246), 0.4)",
                  ]
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={cn(
                  "h-32 w-32 rounded-full flex items-center justify-center transition-all duration-300",
                  isListening
                    ? "bg-gradient-to-br from-primary via-primary/90 to-primary/70"
                    : "bg-gradient-to-br from-muted via-muted/80 to-muted/60 hover:from-primary/40 hover:to-primary/20"
                )}
              >
                {/* Inner orb core */}
                <motion.div
                  animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className={cn(
                    "h-16 w-16 rounded-full transition-all duration-300",
                    isListening
                      ? "bg-gradient-to-br from-white/90 to-white/60"
                      : "bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/5"
                  )}
                />
              </motion.div>
            </motion.button>
          </div>

          {/* Minimal status text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground/70 font-light tracking-wide"
          >
            {isListening ? "Listening..." : error ? error : "Tap to speak"}
          </motion.p>

          {/* Live transcript display - light and elegant */}
          <AnimatePresence mode="wait">
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="min-h-[60px] flex items-center justify-center"
              >
                <p className="text-2xl md:text-3xl font-light text-center text-foreground/90 leading-relaxed">
                  {transcript}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Subtle hint at bottom */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1 }}
            className="absolute bottom-8 text-xs text-muted-foreground/50"
          >
            Tap orb to stop • Press X to cancel
          </motion.p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
