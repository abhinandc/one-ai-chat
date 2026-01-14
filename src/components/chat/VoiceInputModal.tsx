import { useState, useEffect, useRef } from "react";
import { X, Mic, MicOff, Loader2 } from "lucide-react";
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

  const startListening = () => {
    setError(null);
    setTranscript("");

    // Check for browser support
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

  const handleSubmit = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    stopListening();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-screen m-0 p-0 bg-background/95 backdrop-blur-xl border-none rounded-none flex flex-col items-center justify-center">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-10 w-10 rounded-full"
          onClick={handleCancel}
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="flex flex-col items-center justify-center gap-8 max-w-2xl px-8">
          {/* Animated mic indicator */}
          <div className="relative">
            {/* Pulsing rings */}
            <AnimatePresence>
              {isListening && (
                <>
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-primary/30"
                  />
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    className="absolute inset-0 rounded-full bg-primary/30"
                  />
                </>
              )}
            </AnimatePresence>

            {/* Main mic button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={isListening ? stopListening : startListening}
              className={cn(
                "relative z-10 h-32 w-32 rounded-full flex items-center justify-center transition-colors",
                isListening
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              {isListening ? (
                <Mic className="h-12 w-12" />
              ) : (
                <MicOff className="h-12 w-12" />
              )}
            </motion.button>
          </div>

          {/* Status text */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">
              {isListening ? "Listening..." : "Tap to speak"}
            </h2>
            <p className="text-muted-foreground">
              {isListening
                ? "Speak clearly into your microphone"
                : "Click the microphone to start voice input"}
            </p>
          </div>

          {/* Transcript display */}
          <AnimatePresence mode="wait">
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-h-[200px] overflow-y-auto rounded-xl bg-muted/50 p-6"
              >
                <p className="text-lg text-center">{transcript}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error display */}
          {error && (
            <div className="text-destructive text-sm text-center">{error}</div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="lg" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={!transcript.trim()}
              className="min-w-[120px]"
            >
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}