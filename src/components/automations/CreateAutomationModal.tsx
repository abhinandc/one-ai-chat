import { useState } from "react";
import { X, Plus, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAgents } from "@/hooks/useAgents";

interface CreateAutomationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (automation: any) => void;
}

export function CreateAutomationModal({ open, onClose, onSave }: CreateAutomationModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [trigger, setTrigger] = useState("manual");
  const [schedule, setSchedule] = useState("");
  const [actions, setActions] = useState<string[]>(["Process input"]);
  const [category, setCategory] = useState("General");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const { agents } = useAgents({ env: 'prod' });

  const triggerOptions = [
    { value: "manual", label: "Manual Trigger" },
    { value: "schedule", label: "Schedule" },
    { value: "webhook", label: "Webhook/API" },
    { value: "email", label: "Email Received" },
    { value: "file", label: "File Upload" },
    { value: "slack", label: "Slack Message" },
  ];

  const categoryOptions = [
    "General", "Research", "Product", "Executive", "VIP", "Marketing", "Support", "Development", "Analytics"
  ];

  const addAction = () => {
    setActions(prev => [...prev, "New action"]);
  };

  const updateAction = (index: number, value: string) => {
    setActions(prev => prev.map((action, i) => i === index ? value : action));
  };

  const removeAction = (index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleSave = () => {
    if (!name.trim() || !description.trim()) {
      alert("Please enter name and description");
      return;
    }

    const automation = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      trigger: trigger === "schedule" ? `Schedule: ${schedule}` : trigger,
      actions,
      status: "draft" as const,
      lastRun: new Date(),
      totalRuns: 0,
      successRate: 100,
      category,
      tags,
      createdAt: new Date(),
      agentId: selectedAgent || undefined,
    };

    onSave(automation);
    
    // Reset form
    setName("");
    setDescription("");
    setSelectedAgent("");
    setTrigger("manual");
    setSchedule("");
    setActions(["Process input"]);
    setCategory("General");
    setTags([]);
    setNewTag("");
    
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border-primary rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent-blue" />
              Create New Automation
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

        <div className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Automation Name *
              </label>
              <GlassInput
                placeholder="Enter automation name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                variant="default"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Description *
              </label>
              <textarea
                placeholder="Describe what this automation does..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-20 px-3 py-2 bg-surface-graphite border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary resize-none"
              />
            </div>
          </div>

          {/* Agent Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Base Agent (Optional)
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-3 py-2 bg-surface-graphite border border-border-primary rounded-lg text-text-primary"
            >
              <option value="">No agent (custom automation)</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} - {agent.owner}
                </option>
              ))}
            </select>
          </div>

          {/* Trigger Configuration */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Trigger Type
              </label>
              <select
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                className="w-full px-3 py-2 bg-surface-graphite border border-border-primary rounded-lg text-text-primary"
              >
                {triggerOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {trigger === "schedule" && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Schedule
                </label>
                <GlassInput
                  placeholder="e.g., Every day at 9:00 AM, Every Monday, etc."
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  variant="default"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-text-primary">
                Actions
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAction}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Action
              </Button>
            </div>
            <div className="space-y-2">
              {actions.map((action, index) => (
                <div key={index} className="flex items-center gap-2">
                  <GlassInput
                    placeholder="Enter action..."
                    value={action}
                    onChange={(e) => updateAction(index, e.target.value)}
                    variant="default"
                    className="flex-1"
                  />
                  {actions.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAction(index)}
                      className="text-accent-red hover:text-accent-red"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Category and Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-surface-graphite border border-border-primary rounded-lg text-text-primary"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Tags
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <GlassInput
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    variant="default"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTag}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-accent-red/20"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-secondary">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || !description.trim()}
              className="bg-accent-blue hover:bg-accent-blue/90"
            >
              <Zap className="h-4 w-4 mr-2" />
              Create Automation
            </Button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
