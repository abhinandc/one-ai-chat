import { useState, useEffect, useRef, useCallback } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Volume2, VolumeX } from "lucide-react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Orb, type AgentState } from "@/components/ui/orb";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/services/supabaseClient";

// Sia Agent ID
const SIA_AGENT_ID = "agent_8701keg7xdvgfx89gk8fspx7jk5x";

// Design system colors for the orb (accent-blue)
const ORB_COLORS: [string, string] = ["#0080ff", "#4da6ff"];

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
  const [agentState, setAgentState] = useState<AgentState>(null);

  // ElevenLabs Conversational AI
  const conversation = useConversation({
    onConnect: () => {
      setIsConnecting(false);
      setError(null);
      setAgentState("listening");
    },
    onDisconnect: () => {
      setIsConnecting(false);
      setAgentState(null);
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
      setAgentState(null);
      // Fallback to browser speech recognition
      startBrowserSpeechRecognition();
    },
  });

  // Update agent state based on conversation
  useEffect(() => {
    if (conversation.status === "connected") {
      if (conversation.isSpeaking) {
        setAgentState("talking");
      } else {
        setAgentState("listening");
      }
    } else {
      setAgentState(null);
    }
  }, [conversation.status, conversation.isSpeaking]);

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

    recognition.onstart = () => {
      setBrowserListening(true);
      setAgentState("listening");
    };
    recognition.onend = () => {
      setBrowserListening(false);
      setAgentState(null);
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
    setAgentState("thinking");

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
      setAgentState(null);
      if (isListening) {
        conversation.endSession();
      }
      if (browserListening) {
        stopBrowserSpeechRecognition();
      }
    }
  }, [open]);

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
        <div className="relative z-10 flex flex-col items-center justify-center gap-12 w-full max-w-3xl px-8">
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

          {/* ElevenLabs Orb */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleListening}
            disabled={isConnecting}
            className="relative z-10 disabled:cursor-wait focus:outline-none"
          >
            <div className="h-64 w-64 relative">
              <Orb
                colors={ORB_COLORS}
                agentState={agentState}
                className="h-full w-full"
              />
              
              {/* Connecting overlay */}
              {isConnecting && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 border-2 border-primary/50 border-t-primary rounded-full animate-spin" />
                </div>
              )}
            </div>
          </motion.button>

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