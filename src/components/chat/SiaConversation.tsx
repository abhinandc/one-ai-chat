import { useState, useEffect, useRef, useCallback } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/services/supabaseClient";

// Sia Voice ID from ElevenLabs
const SIA_AGENT_ID = "sia_voice_agent"; // Replace with actual agent ID if available

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
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visualizerBars, setVisualizerBars] = useState<number[]>(Array(20).fill(0.2));
  const animationFrameRef = useRef<number>();

  // ElevenLabs Conversational AI
  const conversation = useConversation({
    onConnect: () => {
      setIsConnecting(false);
      setError(null);
    },
    onDisconnect: () => {
      setIsConnecting(false);
    },
    onMessage: (message) => {
      // Handle user transcript from the message
      const msg = message as Record<string, any>;
      if (msg?.user_transcription_event?.user_transcript) {
        setTranscript(msg.user_transcription_event.user_transcript);
      }
    },
    onError: (err) => {
      console.error("ElevenLabs error:", err);
      setError("Voice connection failed. Using browser speech recognition.");
      setIsConnecting(false);
      // Fallback to browser speech recognition
      startBrowserSpeechRecognition();
    },
  });

  const isListening = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  // Browser speech recognition fallback
  const recognitionRef = useRef<any>(null);
  const [useBrowserSpeech, setUseBrowserSpeech] = useState(false);
  const [browserListening, setBrowserListening] = useState(false);

  const startBrowserSpeechRecognition = useCallback(() => {
    setUseBrowserSpeech(true);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setBrowserListening(true);
    recognition.onend = () => setBrowserListening(false);

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

    recognition.start();
  }, []);

  const stopBrowserSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setBrowserListening(false);
  }, []);

  // Start ElevenLabs conversation
  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try to get token from edge function
      const { data, error: fetchError } = await supabase.functions.invoke(
        "elevenlabs-conversation-token"
      );

      if (fetchError || !data?.token) {
        throw new Error(fetchError?.message || "No token received");
      }

      // Start the conversation with WebRTC
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
    } catch (err) {
      console.error("Failed to start ElevenLabs conversation:", err);
      setError("Using browser speech recognition.");
      setIsConnecting(false);
      // Fallback to browser speech recognition
      startBrowserSpeechRecognition();
    }
  }, [conversation, startBrowserSpeechRecognition]);

  const stopConversation = useCallback(async () => {
    if (useBrowserSpeech) {
      stopBrowserSpeechRecognition();
    } else {
      await conversation.endSession();
    }
    
    if (transcript && onTranscript) {
      onTranscript(transcript);
    }
  }, [conversation, useBrowserSpeech, stopBrowserSpeechRecognition, transcript, onTranscript]);

  // Auto-start when modal opens
  useEffect(() => {
    if (open && !isListening && !browserListening && !isConnecting) {
      startConversation();
    }
  }, [open]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      setTranscript("");
      setError(null);
      setUseBrowserSpeech(false);
      if (isListening) {
        conversation.endSession();
      }
      if (browserListening) {
        stopBrowserSpeechRecognition();
      }
    }
  }, [open]);

  // Animate visualizer bars
  useEffect(() => {
    const animate = () => {
      const active = isListening || isSpeaking || browserListening;
      if (active) {
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
  }, [isListening, isSpeaking, browserListening]);

  const toggleListening = () => {
    if (isListening || browserListening) {
      stopConversation();
    } else {
      startConversation();
    }
  };

  const handleClose = () => {
    stopConversation();
    onOpenChange(false);
  };

  const activeListening = isListening || browserListening;
  const activeSpeaking = isSpeaking;

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
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
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
              {useBrowserSpeech ? "Voice Assistant (Browser)" : "Voice Assistant"}
            </p>
          </motion.div>

          {/* Audio Visualizer Orb */}
          <div className="relative flex items-center justify-center">
            {/* Outer glow rings */}
            <AnimatePresence>
              {(activeListening || activeSpeaking) && (
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
              disabled={isConnecting}
              className="relative z-10 group disabled:cursor-wait"
            >
              <div className={cn(
                "relative h-48 w-48 rounded-full flex items-center justify-center transition-all duration-500",
                (activeListening || activeSpeaking)
                  ? "bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-2xl shadow-primary/30"
                  : isConnecting
                  ? "bg-gradient-to-br from-amber-500/50 via-amber-500/30 to-amber-500/20"
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
                            "absolute w-1 rounded-full origin-bottom",
                            (activeListening || activeSpeaking) 
                              ? "bg-white/80" 
                              : "bg-muted-foreground/30"
                          )}
                          style={{
                            height: barHeight,
                            transform: `rotate(${angle}deg) translateY(-60px)`,
                          }}
                          animate={{
                            scaleY: (activeListening || activeSpeaking) ? height : 0.3,
                          }}
                          transition={{ duration: 0.1 }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Center Icon */}
                <motion.div
                  animate={activeListening ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="relative z-10"
                >
                  {isConnecting ? (
                    <div className="h-8 w-8 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : activeListening ? (
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
            {/* Error Message */}
            {error && (
              <p className="text-xs text-amber-500/80">{error}</p>
            )}

            {/* Status Text */}
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-sm text-muted-foreground/70 font-light tracking-wide"
            >
              {isConnecting 
                ? "Connecting..." 
                : activeListening 
                ? "Listening..." 
                : activeSpeaking 
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