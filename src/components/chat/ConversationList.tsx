import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Pin,
  Share,
  MoreHorizontal,
  MessageSquare,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit2,
  Tag,
  X,
  Check,
  PinOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassInput } from "@/components/ui/GlassInput";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Conversation, ConversationFolder } from "@/types";

// Color options for folders
const FOLDER_COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#22C55E" },
  { name: "Purple", value: "#A855F7" },
  { name: "Orange", value: "#F97316" },
  { name: "Pink", value: "#EC4899" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Red", value: "#EF4444" },
];

// Preset tag colors
const TAG_COLORS: Record<string, string> = {
  work: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  personal: "bg-green-500/20 text-green-400 border-green-500/30",
  important: "bg-red-500/20 text-red-400 border-red-500/30",
  coding: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  research: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  creative: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  default: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

interface ConversationListProps {
  conversations: Conversation[];
  folders: ConversationFolder[];
  currentConversationId?: string;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onCreateNew: () => void;
  onCreateFolder?: (name: string, color: string) => void;
  onUpdateFolder?: (id: string, updates: Partial<ConversationFolder>) => void;
  onDeleteFolder?: (id: string) => void;
  onMoveToFolder?: (conversationId: string, folderId: string | null) => void;
  onTogglePin?: (conversationId: string) => void;
  onAddTag?: (conversationId: string, tag: string) => void;
  onRemoveTag?: (conversationId: string, tag: string) => void;
  onRenameConversation?: (conversationId: string, newTitle: string) => void;
  loading?: boolean;
}

export function ConversationList({
  conversations,
  folders,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onCreateNew,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onMoveToFolder,
  onTogglePin,
  onAddTag,
  onRemoveTag,
  onRenameConversation,
  loading = false,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0].value);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [showAddTag, setShowAddTag] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState("");

  // Filter and group conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [conversations, searchQuery]);

  const pinnedConversations = useMemo(
    () => filteredConversations.filter((conv) => conv.pinned),
    [filteredConversations]
  );

  const unfolderConversations = useMemo(
    () => filteredConversations.filter((conv) => !conv.folderId && !conv.pinned),
    [filteredConversations]
  );

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    );
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim() && onCreateFolder) {
      onCreateFolder(newFolderName.trim(), newFolderColor);
      setNewFolderName("");
      setNewFolderColor(FOLDER_COLORS[0].value);
      setShowCreateFolder(false);
    }
  };

  const handleRenameFolder = (folderId: string) => {
    if (editingFolderName.trim() && onUpdateFolder) {
      onUpdateFolder(folderId, { name: editingFolderName.trim() });
      setEditingFolderId(null);
      setEditingFolderName("");
    }
  };

  const handleAddTag = (conversationId: string) => {
    if (newTag.trim() && onAddTag) {
      onAddTag(conversationId, newTag.trim().toLowerCase());
      setNewTag("");
      setShowAddTag(null);
    }
  };

  const handleRenameConversation = (conversationId: string) => {
    if (renamingTitle.trim() && onRenameConversation) {
      onRenameConversation(conversationId, renamingTitle.trim());
      setRenamingConversationId(null);
      setRenamingTitle("");
    }
  };

  const getTagColor = (tag: string): string => {
    return TAG_COLORS[tag.toLowerCase()] || TAG_COLORS.default;
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-surface-graphite/30 border-r border-border-primary/50">
        <div className="p-lg border-b border-border-secondary/50">
          <div className="h-6 w-32 bg-surface-graphite animate-pulse rounded mb-md" />
          <div className="h-10 bg-surface-graphite animate-pulse rounded" />
        </div>
        <div className="flex-1 p-md space-y-sm">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-surface-graphite animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface-graphite/30 border-r border-border-primary/50" data-testid="conversation-list">
      {/* Header */}
      <div className="p-lg border-b border-border-secondary/50">
        <div className="flex items-center justify-between mb-md">
          <h2 className="text-lg font-semibold text-text-primary">Conversations</h2>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setShowCreateFolder(true)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Create folder"
            >
              <Folder className="h-4 w-4" />
            </Button>
            <Button onClick={onCreateNew} size="sm" className="h-8 w-8 p-0" title="New conversation" data-testid="new-chat">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <GlassInput
            placeholder="Search conversations or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            variant="search"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-md space-y-md">
        {/* Pinned Section */}
        {pinnedConversations.length > 0 && (
          <div className="space-y-sm">
            <div className="flex items-center gap-2 px-2 py-1">
              <Pin className="h-3 w-3 text-accent-blue" />
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Pinned
              </span>
            </div>
            {pinnedConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === currentConversationId}
                isRenaming={renamingConversationId === conversation.id}
                renamingTitle={renamingTitle}
                onRenamingTitleChange={setRenamingTitle}
                onRenameSubmit={() => handleRenameConversation(conversation.id)}
                onRenameCancel={() => {
                  setRenamingConversationId(null);
                  setRenamingTitle("");
                }}
                onClick={() => onSelectConversation(conversation.id)}
                onDelete={() => onDeleteConversation(conversation.id)}
                onTogglePin={onTogglePin ? () => onTogglePin(conversation.id) : undefined}
                onMoveToFolder={
                  onMoveToFolder ? (folderId) => onMoveToFolder(conversation.id, folderId) : undefined
                }
                onAddTag={
                  onAddTag
                    ? () => {
                        setShowAddTag(conversation.id);
                        setNewTag("");
                      }
                    : undefined
                }
                onRemoveTag={onRemoveTag ? (tag) => onRemoveTag(conversation.id, tag) : undefined}
                onStartRename={() => {
                  setRenamingConversationId(conversation.id);
                  setRenamingTitle(conversation.title);
                }}
                folders={folders}
                formatDate={formatDate}
                getTagColor={getTagColor}
                showAddTag={showAddTag === conversation.id}
                newTag={newTag}
                onNewTagChange={setNewTag}
                onNewTagSubmit={() => handleAddTag(conversation.id)}
                onNewTagCancel={() => {
                  setShowAddTag(null);
                  setNewTag("");
                }}
              />
            ))}
          </div>
        )}

        {/* Folders Section */}
        {folders.length > 0 && (
          <div className="space-y-sm">
            <div className="flex items-center gap-2 px-2 py-1">
              <Folder className="h-3 w-3 text-text-tertiary" />
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Folders
              </span>
            </div>
            {folders.map((folder) => {
              const folderConversations = filteredConversations.filter(
                (conv) => conv.folderId === folder.id && !conv.pinned
              );
              const isExpanded = expandedFolders.includes(folder.id);
              const isEditing = editingFolderId === folder.id;

              return (
                <div key={folder.id} className="space-y-sm">
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                      "hover:bg-interactive-hover cursor-pointer group"
                    )}
                    onClick={() => !isEditing && toggleFolder(folder.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-text-tertiary" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-text-tertiary" />
                    )}
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: folder.color || FOLDER_COLORS[0].value }}
                    />
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editingFolderName}
                          onChange={(e) => setEditingFolderName(e.target.value)}
                          className="h-6 text-sm py-0"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameFolder(folder.id);
                            if (e.key === "Escape") {
                              setEditingFolderId(null);
                              setEditingFolderName("");
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => handleRenameFolder(folder.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setEditingFolderId(null);
                            setEditingFolderName("");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        {isExpanded ? (
                          <FolderOpen className="h-4 w-4 text-text-secondary" />
                        ) : (
                          <Folder className="h-4 w-4 text-text-secondary" />
                        )}
                        <span className="text-sm font-medium text-text-primary flex-1 truncate">
                          {folder.name}
                        </span>
                        <span className="text-xs text-text-quaternary">{folderConversations.length}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFolderId(folder.id);
                                setEditingFolderName(folder.name);
                              }}
                            >
                              <Edit2 className="h-3 w-3 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <div
                                  className="h-3 w-3 rounded-full mr-2"
                                  style={{ backgroundColor: folder.color || FOLDER_COLORS[0].value }}
                                />
                                Color
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {FOLDER_COLORS.map((color) => (
                                  <DropdownMenuItem
                                    key={color.value}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onUpdateFolder?.(folder.id, { color: color.value });
                                    }}
                                  >
                                    <div
                                      className="h-3 w-3 rounded-full mr-2"
                                      style={{ backgroundColor: color.value }}
                                    />
                                    {color.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteFolder?.(folder.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete folder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="ml-6 space-y-sm">
                      {folderConversations.length > 0 ? (
                        folderConversations.map((conversation) => (
                          <ConversationItem
                            key={conversation.id}
                            conversation={conversation}
                            isActive={conversation.id === currentConversationId}
                            isRenaming={renamingConversationId === conversation.id}
                            renamingTitle={renamingTitle}
                            onRenamingTitleChange={setRenamingTitle}
                            onRenameSubmit={() => handleRenameConversation(conversation.id)}
                            onRenameCancel={() => {
                              setRenamingConversationId(null);
                              setRenamingTitle("");
                            }}
                            onClick={() => onSelectConversation(conversation.id)}
                            onDelete={() => onDeleteConversation(conversation.id)}
                            onTogglePin={onTogglePin ? () => onTogglePin(conversation.id) : undefined}
                            onMoveToFolder={
                              onMoveToFolder
                                ? (folderId) => onMoveToFolder(conversation.id, folderId)
                                : undefined
                            }
                            onAddTag={
                              onAddTag
                                ? () => {
                                    setShowAddTag(conversation.id);
                                    setNewTag("");
                                  }
                                : undefined
                            }
                            onRemoveTag={
                              onRemoveTag ? (tag) => onRemoveTag(conversation.id, tag) : undefined
                            }
                            onStartRename={() => {
                              setRenamingConversationId(conversation.id);
                              setRenamingTitle(conversation.title);
                            }}
                            folders={folders}
                            formatDate={formatDate}
                            getTagColor={getTagColor}
                            showAddTag={showAddTag === conversation.id}
                            newTag={newTag}
                            onNewTagChange={setNewTag}
                            onNewTagSubmit={() => handleAddTag(conversation.id)}
                            onNewTagCancel={() => {
                              setShowAddTag(null);
                              setNewTag("");
                            }}
                          />
                        ))
                      ) : (
                        <p className="text-xs text-text-quaternary px-3 py-2">No conversations</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Unfoldered Conversations */}
        {unfolderConversations.length > 0 && (
          <div className="space-y-sm">
            {(folders.length > 0 || pinnedConversations.length > 0) && (
              <div className="flex items-center gap-2 px-2 py-1">
                <MessageSquare className="h-3 w-3 text-text-tertiary" />
                <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                  Recent
                </span>
              </div>
            )}
            {unfolderConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === currentConversationId}
                isRenaming={renamingConversationId === conversation.id}
                renamingTitle={renamingTitle}
                onRenamingTitleChange={setRenamingTitle}
                onRenameSubmit={() => handleRenameConversation(conversation.id)}
                onRenameCancel={() => {
                  setRenamingConversationId(null);
                  setRenamingTitle("");
                }}
                onClick={() => onSelectConversation(conversation.id)}
                onDelete={() => onDeleteConversation(conversation.id)}
                onTogglePin={onTogglePin ? () => onTogglePin(conversation.id) : undefined}
                onMoveToFolder={
                  onMoveToFolder ? (folderId) => onMoveToFolder(conversation.id, folderId) : undefined
                }
                onAddTag={
                  onAddTag
                    ? () => {
                        setShowAddTag(conversation.id);
                        setNewTag("");
                      }
                    : undefined
                }
                onRemoveTag={onRemoveTag ? (tag) => onRemoveTag(conversation.id, tag) : undefined}
                onStartRename={() => {
                  setRenamingConversationId(conversation.id);
                  setRenamingTitle(conversation.title);
                }}
                folders={folders}
                formatDate={formatDate}
                getTagColor={getTagColor}
                showAddTag={showAddTag === conversation.id}
                newTag={newTag}
                onNewTagChange={setNewTag}
                onNewTagSubmit={() => handleAddTag(conversation.id)}
                onNewTagCancel={() => {
                  setShowAddTag(null);
                  setNewTag("");
                }}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredConversations.length === 0 && (
          <div className="text-center py-xl">
            <MessageSquare className="h-8 w-8 text-text-quaternary mx-auto mb-md" />
            <p className="text-sm text-text-tertiary">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </p>
            {!searchQuery && (
              <Button onClick={onCreateNew} variant="outline" size="sm" className="mt-md">
                <Plus className="h-4 w-4 mr-2" />
                Start a conversation
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>Organize your conversations into folders</DialogDescription>
          </DialogHeader>
          <div className="space-y-md py-md">
            <div className="space-y-sm">
              <Label htmlFor="folder-name">Folder name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                }}
              />
            </div>
            <div className="space-y-sm">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewFolderColor(color.value)}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      newFolderColor === color.value && "ring-2 ring-offset-2 ring-offset-background"
                    )}
                    style={{
                      backgroundColor: color.value,
                      ringColor: color.value,
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isRenaming: boolean;
  renamingTitle: string;
  onRenamingTitleChange: (title: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onClick: () => void;
  onDelete: () => void;
  onTogglePin?: () => void;
  onMoveToFolder?: (folderId: string | null) => void;
  onAddTag?: () => void;
  onRemoveTag?: (tag: string) => void;
  onStartRename: () => void;
  folders: ConversationFolder[];
  formatDate: (date: Date | undefined) => string;
  getTagColor: (tag: string) => string;
  showAddTag: boolean;
  newTag: string;
  onNewTagChange: (tag: string) => void;
  onNewTagSubmit: () => void;
  onNewTagCancel: () => void;
}

function ConversationItem({
  conversation,
  isActive,
  isRenaming,
  renamingTitle,
  onRenamingTitleChange,
  onRenameSubmit,
  onRenameCancel,
  onClick,
  onDelete,
  onTogglePin,
  onMoveToFolder,
  onAddTag,
  onRemoveTag,
  onStartRename,
  folders,
  formatDate,
  getTagColor,
  showAddTag,
  newTag,
  onNewTagChange,
  onNewTagSubmit,
  onNewTagCancel,
}: ConversationItemProps) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];

  return (
    <div
      onClick={isRenaming ? undefined : onClick}
      className={cn(
        "group relative p-md rounded-xl transition-all duration-normal",
        !isRenaming && "cursor-pointer hover:bg-interactive-hover",
        isActive ? "bg-interactive-selected border border-accent-blue/30" : "border border-transparent"
      )}
    >
      <div className="flex items-start justify-between gap-sm">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-sm mb-xs">
            {isRenaming ? (
              <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={renamingTitle}
                  onChange={(e) => onRenamingTitleChange(e.target.value)}
                  className="h-6 text-sm py-0"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onRenameSubmit();
                    if (e.key === "Escape") onRenameCancel();
                  }}
                />
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onRenameSubmit}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onRenameCancel}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <h3
                  className={cn(
                    "text-sm font-medium truncate",
                    isActive ? "text-accent-blue" : "text-text-primary"
                  )}
                >
                  {conversation.title}
                </h3>
                {conversation.unread && (
                  <div className="h-2 w-2 bg-accent-blue rounded-full flex-shrink-0" />
                )}
              </>
            )}
          </div>

          {/* Preview */}
          {!isRenaming && (
            <p className="text-xs text-text-tertiary truncate">
              {lastMessage?.content || "No messages yet"}
            </p>
          )}

          {/* Tags */}
          {conversation.tags.length > 0 && !isRenaming && (
            <div className="flex flex-wrap gap-1 mt-sm">
              {conversation.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0 h-4", getTagColor(tag))}
                >
                  {tag}
                  {onRemoveTag && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTag(tag);
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}

          {/* Add Tag Input */}
          {showAddTag && (
            <div className="flex items-center gap-1 mt-sm" onClick={(e) => e.stopPropagation()}>
              <Input
                value={newTag}
                onChange={(e) => onNewTagChange(e.target.value)}
                placeholder="Add tag..."
                className="h-6 text-xs py-0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") onNewTagSubmit();
                  if (e.key === "Escape") onNewTagCancel();
                }}
              />
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onNewTagSubmit}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onNewTagCancel}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Footer */}
          {!isRenaming && (
            <div className="flex items-center justify-between mt-sm">
              <span className="text-xs text-text-quaternary">{formatDate(conversation.updatedAt)}</span>

              <div className="flex items-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                {conversation.pinned && <Pin className="h-3 w-3 text-accent-blue" />}
                {conversation.shared && <Share className="h-3 w-3 text-text-tertiary" />}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onStartRename}>
                      <Edit2 className="h-3 w-3 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    {onTogglePin && (
                      <DropdownMenuItem onClick={onTogglePin}>
                        {conversation.pinned ? (
                          <>
                            <PinOff className="h-3 w-3 mr-2" />
                            Unpin
                          </>
                        ) : (
                          <>
                            <Pin className="h-3 w-3 mr-2" />
                            Pin
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    {onAddTag && (
                      <DropdownMenuItem onClick={onAddTag}>
                        <Tag className="h-3 w-3 mr-2" />
                        Add tag
                      </DropdownMenuItem>
                    )}
                    {onMoveToFolder && folders.length > 0 && (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Folder className="h-3 w-3 mr-2" />
                          Move to folder
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => onMoveToFolder(null)}>
                            <X className="h-3 w-3 mr-2" />
                            Remove from folder
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {folders.map((folder) => (
                            <DropdownMenuItem key={folder.id} onClick={() => onMoveToFolder(folder.id)}>
                              <div
                                className="h-3 w-3 rounded-full mr-2"
                                style={{ backgroundColor: folder.color }}
                              />
                              {folder.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
