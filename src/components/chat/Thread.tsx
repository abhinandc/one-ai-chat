import { useState } from "react";
import { Copy, Check, Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import type { Message, ToolRun } from "@/types";

interface ThreadProps {
  messages: Message[];
  isStreaming?: boolean;
  streamingMessage?: string;
}

export function Thread({ messages, isStreaming, streamingMessage }: ThreadProps) {
  return (
    <div className="flex-1 overflow-y-auto p-lg space-y-lg">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      
      {isStreaming && streamingMessage && (
        <MessageItem 
          message={{
            id: "streaming",
            role: "assistant",
            content: streamingMessage,
            timestamp: new Date(),
          }}
          isStreaming
        />
      )}
      
      {messages.length === 0 && !isStreaming && (
        <div className="text-center py-xl">
          <div className="text-6xl mb-lg">💭</div>
          <h2 className="text-xl font-semibold text-text-primary mb-md">Start a conversation</h2>
          <p className="text-text-secondary">
            Ask a question or describe what you&apos;d like help with
          </p>
        </div>
      )}
    </div>
  );
}

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
}

function MessageItem({ message, isStreaming }: MessageItemProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  
  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  if (isSystem) {
    return (
      <div className="text-center py-md">
        <div className="inline-block px-md py-sm bg-surface-graphite rounded-full text-xs text-text-tertiary">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "group relative",
      isUser ? "flex justify-end" : "flex justify-start"
    )}>
      <div className={cn(
        "max-w-[85%] space-y-md",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Avatar & Header */}
        <div className={cn(
          "flex items-start gap-md",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            isUser
              ? "bg-accent-blue text-white"
              : "bg-surface-graphite text-text-secondary"
          )}>
            {isUser ? "U" : "Agent"}
          </div>
          
          <div className="flex-1 space-y-sm">
            {/* Message Content */}
            <GlassCard className={cn(
              "p-lg",
              isUser 
                ? "bg-accent-blue text-white" 
                : "bg-card border border-accent-blue/20 shadow-lg shadow-accent-blue/5"
            )}>
              <div className="space-y-md">
                <MessageContent content={message.content} />
                
                {/* Tool Runs */}
                {message.metadata?.toolCalls && message.metadata.toolCalls.length > 0 && (
                  <div className="space-y-sm">
                    {message.metadata.toolCalls.map((toolRun) => (
                      <ToolRunChip key={toolRun.id} toolRun={toolRun} />
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
            
            {/* Message Footer */}
            <div className={cn(
              "flex items-center gap-sm text-xs text-text-quaternary",
              isUser ? "justify-end" : "justify-start"
            )}>
              <span>{message.timestamp.toLocaleTimeString()}</span>
              
              {message.metadata?.model && (
                <>
                  <span>•</span>
                  <span>{message.metadata.model}</span>
                </>
              )}
              
              {message.metadata?.tokens && (
                <>
                  <span>•</span>
                  <span>{message.metadata.tokens} tokens</span>
                </>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(message.content, message.id)}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copiedStates[message.id] ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {isStreaming && (
          <div className="flex items-center gap-sm text-text-tertiary">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs">AI is thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Basic markdown rendering - in production, use a proper markdown library
  const renderContent = () => {
    // Handle code blocks
    if (content.includes("```")) {
      const parts = content.split(/(```[\s\S]*?```)/);
      return parts.map((part, index) => {
        if (part.startsWith("```")) {
          const code = part.slice(3, -3);
          const [language, ...codeLines] = code.split("\n");
          const codeContent = codeLines.join("\n");
          
          return (
            <CodeBlock 
              key={index}
              code={codeContent}
              language={language}
            />
          );
        }
        return <span key={index}>{part}</span>;
      });
    }
    
    // Handle inline code
    const inlineCodeRegex = /`([^`]+)`/g;
    if (inlineCodeRegex.test(content)) {
      return content.split(inlineCodeRegex).map((part, index) => {
        if (index % 2 === 1) {
          return (
            <code key={index} className="px-1 py-0.5 bg-surface-graphite rounded text-sm font-mono">
              {part}
            </code>
          );
        }
        return part;
      });
    }
    
    return content;
  };

  return <div className="prose prose-sm max-w-none">{renderContent()}</div>;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  
  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between bg-surface-graphite border border-border-primary rounded-t-lg px-md py-sm">
        <span className="text-xs text-text-secondary font-medium">{language || "code"}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyCode}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <pre className="bg-surface-graphite border border-t-0 border-border-primary rounded-b-lg p-md overflow-x-auto">
        <code className="text-sm font-mono text-text-primary">{code}</code>
      </pre>
    </div>
  );
}

function ToolRunChip({ toolRun }: { toolRun: ToolRun }) {
  const getStatusIcon = () => {
    switch (toolRun.status) {
      case "pending":
        return <div className="w-2 h-2 bg-accent-orange rounded-full" />;
      case "running":
        return <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse" />;
      case "completed":
        return <Check className="h-3 w-3 text-accent-green" />;
      case "error":
        return <ExternalLink className="h-3 w-3 text-accent-red" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-sm px-md py-sm rounded-lg text-xs",
      "bg-surface-graphite border border-border-primary"
    )}>
      {getStatusIcon()}
      <span className="font-medium">{toolRun.name}</span>
      {toolRun.duration && (
        <span className="text-text-tertiary">({toolRun.duration}ms)</span>
      )}
      {toolRun.status === "completed" && (
        <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-sm">
          <Play className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}