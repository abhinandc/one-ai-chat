import { useState, useEffect, useRef } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SiaConversationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTranscript?: (text: string) => void;
}

export function SiaConversation({
  open,
  onOpenChange,
  onTranscript,
}: SiaConversationProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [siaResponse, setSiaResponse] = useState("");
  const [visualizerBars, setVisualizerBars] = useState<number[]>(Array(20).fill(0.2));
  const recognitionRef = useRef<any>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!open) {
      setTranscript("");
      setSiaResponse("");
      setIsListening(false);
      setIsSpeaking(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  }, [open]);

  // Animate visualizer bars
  useEffect(() => {
    const animate = () => {
      if (isListening || isSpeaking) {
        setVisualizerBars((prev) =>
          prev.map(() => 0.2 + Math.random() * 0.8)
        );
      } else {
        setVisualizerBars((prev) =>
          prev.map((v) => Math.max(0.2, v * 0.95))
        );
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, isSpeaking]);

  // Auto-start listening when modal opens
  useEffect(() => {
    if (open && !isListening) {
      startListening();
    }
  }, [open]);

  const startListening = () => {
    setTranscript("");

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
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
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
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
    
    if (transcript && onTranscript) {
      onTranscript(transcript);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleClose = () => {
    stopListening();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-screen m-0 p-0 bg-background border-none rounded-none flex flex-col items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/10" />
          
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/30"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [null, Math.random() * -200, null],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-6 right-6 h-12 w-12 rounded-full text-muted-foreground hover:text-foreground z-50"
          onClick={handleClose}
        >
          <Cross2Icon className="h-6 w-6" />
        </Button>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-16 w-full max-w-3xl px-8">
          {/* Sia Label */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="text-2xl font-light tracking-wider text-foreground/90">
              Sia
            </h2>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Voice Assistant
            </p>
          </motion.div>

          {/* Audio Visualizer Orb */}
          <div className="relative flex items-center justify-center">
            {/* Outer glow rings */}
            <AnimatePresence>
              {(isListening || isSpeaking) && (
                <>
                  <motion.div
                    initial={{ scale: 1, opacity: 0.2 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    className="absolute rounded-full bg-primary/20"
                    style={{ width: 200, height: 200 }}
                  />
                  <motion.div
                    initial={{ scale: 1, opacity: 0.3 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: "easeOut" }}
                    className="absolute rounded-full bg-primary/25"
                    style={{ width: 200, height: 200 }}
                  />
                </>
              )}
            </AnimatePresence>

            {/* Main Orb with Visualizer */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleListening}
              className="relative z-10 group"
            >
              <div className={cn(
                "relative h-48 w-48 rounded-full flex items-center justify-center transition-all duration-500",
                (isListening || isSpeaking)
                  ? "bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-2xl shadow-primary/30"
                  : "bg-gradient-to-br from-muted via-muted/80 to-muted/60 group-hover:from-primary/30 group-hover:to-primary/10"
              )}>
                {/* Circular Audio Bars */}
                <div className="absolute inset-4 rounded-full overflow-hidden">
                  <div className="relative w-full h-full flex items-center justify-center">
                    {visualizerBars.map((height, i) => {
                      const angle = (i / visualizerBars.length) * 360;
                      const barHeight = 20 + height * 40;
                      
                      return (
                        <motion.div
                          key={i}
                          className={cn(
                            "absolute w-1 rounded-full origin-bottom transition-colors duration-300",
                            (isListening || isSpeaking) 
                              ? "bg-white/80" 
                              : "bg-muted-foreground/30"
                          )}
                          style={{
                            height: barHeight,
                            transform: `rotate(${angle}deg) translateY(-60px)`,
                          }}
                          animate={{
                            scaleY: (isListening || isSpeaking) ? height : 0.3,
                          }}
                          transition={{ duration: 0.1 }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Center Icon */}
                <motion.div
                  animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="relative z-10"
                >
                  {isListening ? (
                    <Mic className="h-8 w-8 text-white" />
                  ) : (
                    <MicOff className="h-8 w-8 text-muted-foreground" />
                  )}
                </motion.div>
              </div>
            </motion.button>
          </div>

          {/* Status & Controls */}
          <div className="flex flex-col items-center gap-6">
            {/* Status Text */}
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-sm text-muted-foreground/70 font-light tracking-wide"
            >
              {isListening 
                ? "Listening..." 
                : isSpeaking 
                ? "Sia is speaking..." 
                : "Tap to speak"}
            </motion.p>

            {/* Transcript Display */}
            <AnimatePresence mode="wait">
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="min-h-[60px] max-w-xl text-center"
                >
                  <p className="text-xl font-light text-foreground/90 leading-relaxed">
                    {transcript}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mute/Unmute Control */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Volume2 className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          </div>

          {/* Hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1 }}
            className="absolute bottom-8 text-xs text-muted-foreground/50"
          >
            Tap orb to stop • Press X to close
          </motion.p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
