import { useState, useRef } from "react";
import { Upload, X, Paperclip, Database, Link, Plus, ExternalLink, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ContextFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
}

export interface ContextLink {
  id: string;
  url: string;
  title: string;
  content?: string;
}

interface InspectorPanelProps {
  onContextChange?: (files: ContextFile[], links: ContextLink[]) => void;
}

export function InspectorPanel({ onContextChange }: InspectorPanelProps) {
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [contextLinks, setContextLinks] = useState<ContextLink[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsLoadingFile(true);

    try {
      const newFiles: ContextFile[] = [];

      for (const file of Array.from(files)) {
        try {
          const content = await readFileContent(file);
          newFiles.push({
            id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            type: file.type || 'text/plain',
            size: file.size,
            content: content,
          });
        } catch (err) {
          console.error(`Failed to read ${file.name}:`, err);
        }
      }

      const updatedFiles = [...contextFiles, ...newFiles];
      setContextFiles(updatedFiles);
      onContextChange?.(updatedFiles, contextLinks);
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const removeFile = (id: string) => {
    const updatedFiles = contextFiles.filter((f) => f.id !== id);
    setContextFiles(updatedFiles);
    onContextChange?.(updatedFiles, contextLinks);
  };

  const addLink = async () => {
    if (!newLinkUrl.trim()) return;

    setIsLoadingLink(true);

    try {
      let url = newLinkUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const newLink: ContextLink = {
        id: `link_${Date.now()}`,
        url: url,
        title: new URL(url).hostname,
      };

      const updatedLinks = [...contextLinks, newLink];
      setContextLinks(updatedLinks);
      setNewLinkUrl("");
      onContextChange?.(contextFiles, updatedLinks);
    } catch (err) {
      console.error('Invalid URL:', err);
    } finally {
      setIsLoadingLink(false);
    }
  };

  const removeLink = (id: string) => {
    const updatedLinks = contextLinks.filter((l) => l.id !== id);
    setContextLinks(updatedLinks);
    onContextChange?.(contextFiles, updatedLinks);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('text') || type.includes('markdown')) return '📝';
    if (type.includes('json') || type.includes('javascript') || type.includes('typescript')) return '💻';
    if (type.includes('csv') || type.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const totalContextSize = contextFiles.reduce((acc, f) => acc + f.content.length, 0);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-primary flex items-center gap-2">
        <Database className="h-4 w-4 text-text-secondary" />
        <h3 className="text-sm font-medium text-text-primary">RAG Context</h3>
        <span className="text-xs text-text-tertiary ml-auto">
          {contextFiles.length + contextLinks.length} items
        </span>
      </div>

      {/* Context Stats */}
      {(contextFiles.length > 0 || contextLinks.length > 0) && (
        <div className="px-4 py-2 border-b border-border-primary bg-surface-graphite/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">Context loaded</span>
            <span className="text-accent-blue font-medium">
              ~{Math.ceil(totalContextSize / 4)} tokens
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* File Upload Area */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-2">
            Attach Files
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isLoadingFile && fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
              isDragOver
                ? "border-accent-blue bg-accent-blue/5"
                : "border-border-primary hover:border-text-tertiary",
              isLoadingFile && "opacity-50 cursor-wait"
            )}
          >
            {isLoadingFile ? (
              <>
                <Loader2 className="h-6 w-6 text-accent-blue mx-auto mb-2 animate-spin" />
                <p className="text-xs text-text-secondary">Reading files...</p>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-text-tertiary mx-auto mb-2" />
                <p className="text-xs text-text-secondary">
                  Drop files here or click to upload
                </p>
                <p className="text-xs text-text-quaternary mt-1">
                  PDF, TXT, MD, JSON, CSV, Code files
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md,.json,.csv,.js,.ts,.jsx,.tsx,.py,.html,.css,.xml,.yaml,.yml"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Attached Files List */}
        {contextFiles.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Attached Files ({contextFiles.length})
            </label>
            <div className="space-y-2">
              {contextFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 p-2 bg-surface-graphite rounded-lg group"
                >
                  <span className="text-sm">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-primary truncate">{file.name}</p>
                    <p className="text-xs text-text-quaternary">
                      {formatFileSize(file.size)} · ~{Math.ceil(file.content.length / 4)} tokens
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-accent-red"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* URL Links */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-2">
            Reference Links
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addLink()}
              placeholder="https://..."
              disabled={isLoadingLink}
              className="flex-1 px-3 py-2 bg-surface-graphite border border-border-primary rounded-lg text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent disabled:opacity-50"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={addLink}
              disabled={!newLinkUrl.trim() || isLoadingLink}
              className="h-8 w-8 p-0"
            >
              {isLoadingLink ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Links List */}
          {contextLinks.length > 0 && (
            <div className="mt-2 space-y-2">
              {contextLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center gap-2 p-2 bg-surface-graphite rounded-lg group"
                >
                  <Link className="h-3 w-3 text-accent-blue shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-primary truncate">{link.title}</p>
                    <p className="text-xs text-text-quaternary truncate">{link.url}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(link.url, '_blank')}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-text-primary"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLink(link.id)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-accent-red"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty State */}
        {contextFiles.length === 0 && contextLinks.length === 0 && (
          <div className="text-center py-6">
            <Paperclip className="h-8 w-8 text-text-quaternary mx-auto mb-3" />
            <p className="text-xs text-text-tertiary">No context attached</p>
            <p className="text-xs text-text-quaternary mt-1">
              Add files or links to include in your chat
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
