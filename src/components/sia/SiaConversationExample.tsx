/**
 * Sia Conversation Example
 *
 * Example implementation showing how to integrate Sia Memory Service
 * with a voice conversation interface.
 *
 * This is a reference implementation for the mobile app.
 *
 * @module components/sia/SiaConversationExample
 */

import { useState, useEffect } from 'react';
import { useSiaMemory } from '@/hooks/useSiaMemory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SiaMemoryData } from '@/integrations/supabase';
import { Mic, MicOff, Brain } from 'lucide-react';

interface SiaConversationExampleProps {
  userId: string;
}

interface Message {
  role: 'user' | 'sia';
  content: string;
  timestamp: Date;
}

/**
 * Example component showing Sia conversation with memory integration.
 *
 * In production, this would integrate with ElevenLabs Agent SDK:
 * - Voice input via microphone
 * - Voice output via ElevenLabs TTS
 * - Real-time streaming conversation
 */
export function SiaConversationExample({ userId }: SiaConversationExampleProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');

  const { memory, updateMemory, isLoading } = useSiaMemory(userId);

  const memoryData = memory
    ? (memory.memory_data as SiaMemoryData)
    : { facts: [], preferences: {}, context: {}, recentTopics: [] };

  // Simulate Sia response (in production, this would call ElevenLabs Agent API)
  const simulateSiaResponse = (userMessage: string): string => {
    // Use memory to personalize response
    const recentTopics = memoryData.recentTopics || [];
    const preferences = memoryData.preferences || {};

    if (recentTopics.length > 0) {
      return `I remember we discussed ${recentTopics[0]} recently. About your message: "${userMessage}" - I'm here to help with that!`;
    }

    return `I heard you say: "${userMessage}". How can I assist you today?`;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate Sia thinking...
    const siaResponse = simulateSiaResponse(inputText);

    const siaMessage: Message = {
      role: 'sia',
      content: siaResponse,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, siaMessage]);

    // Update memory with interaction
    await updateMemory({
      message: inputText,
      response: siaResponse,
      topic: extractTopic(inputText),
      facts: extractFacts(inputText, siaResponse),
      timestamp: new Date().toISOString(),
    });

    setInputText('');
  };

  // Simple topic extraction (in production, use AI/NLP)
  const extractTopic = (message: string): string => {
    const words = message.toLowerCase().split(' ');
    const keywords = ['weather', 'code', 'project', 'help', 'schedule', 'email'];

    for (const keyword of keywords) {
      if (words.includes(keyword)) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1);
      }
    }

    return 'General conversation';
  };

  // Simple fact extraction (in production, use AI/NLP)
  const extractFacts = (message: string, response: string) => {
    const facts = [];

    // Example: Extract time preferences
    if (message.toLowerCase().includes('morning') || message.toLowerCase().includes('evening')) {
      facts.push({
        content: `User mentioned ${message.toLowerCase().includes('morning') ? 'morning' : 'evening'} activities`,
        category: 'preference' as const,
        confidence: 0.7,
      });
    }

    return facts;
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 space-y-4">
      {/* Memory Context Display */}
      <Card className="bg-secondary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Sia Memory Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div>
            <strong>Total Interactions:</strong> {memory?.total_interactions || 0}
          </div>
          <div>
            <strong>Facts Learned:</strong> {memoryData.facts.length}
          </div>
          <div>
            <strong>Recent Topics:</strong>{' '}
            {memoryData.recentTopics.length > 0
              ? memoryData.recentTopics.join(', ')
              : 'None yet'}
          </div>
          {Object.keys(memoryData.preferences).length > 0 && (
            <div>
              <strong>Preferences:</strong> {JSON.stringify(memoryData.preferences)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation Display */}
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Conversation with Sia</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Start a conversation with Sia!</p>
              <p className="text-xs mt-2">
                (In production, this would be voice-based using ElevenLabs)
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  <div className="text-xs font-semibold mb-1">
                    {msg.role === 'user' ? 'You' : 'Sia'}
                  </div>
                  <div className="text-sm">{msg.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Input Area */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message (or use voice in production)..."
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsRecording(!isRecording)}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4 text-destructive" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Button onClick={handleSendMessage} disabled={!inputText.trim()}>
              Send
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Production: Voice input via microphone, processed by ElevenLabs Agent SDK
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
