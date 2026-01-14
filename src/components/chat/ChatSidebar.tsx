import { useState } from "react";
import { Search, Plus, Pin, Trash2, MessageSquare, X, MoreHorizontal, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (id: string) => void;
}

export function ChatSidebar({
  conversations,
  activeId,
  isOpen,
  onClose,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter(conv => conv.pinned);
  const regularConversations = filteredConversations.filter(conv => !conv.pinned);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Group conversations by date
  const groupedConversations = regularConversations.reduce((acc, conv) => {
    const dateKey = formatDate(conv.updatedAt);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(conv);
    return acc;
  }, {} as Record<string, Conversation[]>);

  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40"
          style={{ top: '4rem' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-72 bg-background border-r border-border transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <Button
            onClick={onNewConversation}
            variant="outline"
            size="sm"
            className="flex-1 mr-2 justify-start gap-2"
          >
            <Plus className="h-4 w-4" />
            New chat
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {/* Pinned Section */}
            {pinnedConversations.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Pin className="h-3 w-3" />
                  Pinned
                </div>
                {pinnedConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === activeId}
                    onClick={() => {
                      onSelectConversation(conversation.id);
                      onClose();
                    }}
                    onDelete={onDeleteConversation}
                  />
                ))}
              </div>
            )}

            {/* Grouped by Date */}
            {Object.entries(groupedConversations).map(([dateKey, convs]) => (
              <div key={dateKey} className="mb-4">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {dateKey}
                </div>
                {convs.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === activeId}
                    onClick={() => {
                      onSelectConversation(conversation.id);
                      onClose();
                    }}
                    onDelete={onDeleteConversation}
                  />
                ))}
              </div>
            ))}

            {filteredConversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No conversations found" : "No conversations yet"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={onNewConversation}
                    variant="link"
                    size="sm"
                    className="mt-2"
                  >
                    Start a new chat
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FolderOpen className="h-3.5 w-3.5" />
            <span>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete?: (id: string) => void;
}

function ConversationItem({ conversation, isActive, onClick, onDelete }: ConversationItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors",
        "hover:bg-muted/70",
        isActive && "bg-muted"
      )}
    >
      <MessageSquare className={cn(
        "h-4 w-4 shrink-0",
        isActive ? "text-primary" : "text-muted-foreground"
      )} />
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm truncate font-medium",
          isActive ? "text-foreground" : "text-foreground/80"
        )}>
          {conversation.title}
        </p>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {onDelete && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conversation.id);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
