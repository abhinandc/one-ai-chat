import { useState } from "react";
import { Search, Plus, Pin, Share, MoreHorizontal, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import type { Conversation, ConversationFolder } from "@/types";

interface ConversationListProps {
  conversations: Conversation[];
  folders: ConversationFolder[];
  activeId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function ConversationList({
  conversations,
  folders,
  activeId,
  onSelectConversation,
  onNewConversation,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter(conv => conv.pinned);
  const unfolderConversations = filteredConversations.filter(conv => !conv.folderId && !conv.pinned);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col bg-surface-graphite/30 border-r border-border-primary/50">
      {/* Header */}
      <div className="p-lg border-b border-border-secondary/50">
        <div className="flex items-center justify-between mb-md">
          <h2 className="text-lg font-semibold text-text-primary">Conversations</h2>
          <Button onClick={onNewConversation} size="sm" className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <GlassInput
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            variant="search"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-md space-y-sm">
        {/* Pinned Conversations */}
        {pinnedConversations.length > 0 && (
          <div className="space-y-sm">
            <div className="flex items-center gap-2 px-2 py-1">
              <Pin className="h-3 w-3 text-text-tertiary" />
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Pinned</span>
            </div>
            {pinnedConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeId}
                onClick={() => onSelectConversation(conversation.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {/* Folders */}
        {folders.map((folder) => {
          const folderConversations = filteredConversations.filter(conv => conv.folderId === folder.id);
          if (folderConversations.length === 0) return null;

          const isExpanded = expandedFolders.includes(folder.id);

          return (
            <div key={folder.id} className="space-y-sm">
              <button
                onClick={() => toggleFolder(folder.id)}
                className="flex items-center gap-2 w-full px-2 py-1 hover:bg-interactive-hover rounded"
              >
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  folder.color || "bg-accent-blue"
                )} />
                <span className="text-xs font-medium text-text-secondary flex-1 text-left">{folder.name}</span>
                <span className="text-xs text-text-quaternary">{folderConversations.length}</span>
              </button>
              
              {isExpanded && (
                <div className="ml-4 space-y-sm">
                  {folderConversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === activeId}
                      onClick={() => onSelectConversation(conversation.id)}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Unfolder Conversations */}
        {unfolderConversations.length > 0 && (
          <div className="space-y-sm">
            {unfolderConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeId}
                onClick={() => onSelectConversation(conversation.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {filteredConversations.length === 0 && (
          <div className="text-center py-xl">
            <MessageSquare className="h-8 w-8 text-text-quaternary mx-auto mb-md" />
            <p className="text-sm text-text-tertiary">No conversations found</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  formatDate: (date: Date) => string;
}

function ConversationItem({ conversation, isActive, onClick, formatDate }: ConversationItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative p-md rounded-xl cursor-pointer transition-all duration-normal",
        "hover:bg-interactive-hover",
        isActive ? "bg-interactive-selected border border-accent-blue/30" : "border border-transparent"
      )}
    >
      <div className="flex items-start justify-between gap-sm">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-sm mb-xs">
            <h3 className={cn(
              "text-sm font-medium truncate",
              isActive ? "text-accent-blue" : "text-text-primary"
            )}>
              {conversation.title}
            </h3>
            {conversation.unread && (
              <div className="h-2 w-2 bg-accent-blue rounded-full flex-shrink-0" />
            )}
          </div>
          
          <p className="text-xs text-text-tertiary truncate">
            {conversation.messages[conversation.messages.length - 1]?.content || "No messages yet"}
          </p>
          
          <div className="flex items-center justify-between mt-sm">
            <span className="text-xs text-text-quaternary">
              {formatDate(conversation.updatedAt)}
            </span>
            
            <div className="flex items-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
              {conversation.pinned && <Pin className="h-3 w-3 text-text-tertiary" />}
              {conversation.shared && <Share className="h-3 w-3 text-text-tertiary" />}
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}