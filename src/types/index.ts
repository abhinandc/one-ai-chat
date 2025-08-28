// Chat Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    provider?: string;
    tokens?: number;
    cost?: number;
    toolCalls?: ToolRun[];
    citations?: Citation[];
  };
}

export interface ToolRun {
  id: string;
  name: string;
  input: Record<string, any>;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
  duration?: number;
}

export interface Citation {
  id: string;
  source: string;
  title: string;
  url?: string;
  snippet: string;
  relevance: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  folderId?: string;
  pinned: boolean;
  shared: boolean;
  unread: boolean;
  tags: string[];
  settings: {
    model: string;
    provider: 'litellm' | 'openwebui';
    temperature: number;
    topP: number;
    maxTokens: number;
    stopSequences: string[];
    systemPrompt?: string;
    tools?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationFolder {
  id: string;
  name: string;
  color?: string;
  conversationIds: string[];
  createdAt: Date;
}

export interface ChatState {
  conversations: Conversation[];
  folders: ConversationFolder[];
  activeConversationId?: string;
  isStreaming: boolean;
  error?: string;
}

// Model Types
export interface Model {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  inputPrice?: number;
  outputPrice?: number;
  capabilities: {
    vision: boolean;
    tools: boolean;
    json: boolean;
    streaming: boolean;
  };
  tags: string[];
  description?: string;
  maxTokens?: number;
  createdAt: Date;
}

export interface RouteRule {
  id: string;
  name: string;
  priority: number;
  conditions: {
    tenant?: string;
    label?: string;
    regex?: string;
    model?: string;
  };
  targetModelId: string;
  fallbackModelId?: string;
  enabled: boolean;
  createdAt: Date;
}

// Prompt Types
export interface Prompt {
  id: string;
  name: string;
  description?: string;
  content: string;
  variables: PromptVariable[];
  category: string;
  tags: string[];
  owner: string;
  usage: number;
  currentVersion: number;
  versions: PromptVersion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  description?: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
}

export interface PromptVersion {
  version: number;
  content: string;
  variables: PromptVariable[];
  changelog?: string;
  createdAt: Date;
  createdBy: string;
}

// Agent Types
export interface Agent {
  id: string;
  name: string;
  description?: string;
  graph: AgentGraph;
  environment: 'dev' | 'staging' | 'prod';
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentGraph {
  nodes: AgentNode[];
  edges: AgentEdge[];
}

export interface AgentNode {
  id: string;
  type: 'system' | 'tool' | 'router' | 'memory' | 'retrieval' | 'decision' | 'code' | 'human' | 'webhook' | 'delay' | 'output';
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface AgentEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  data?: Record<string, any>;
}

// Flow Types
export interface Flow {
  id: string;
  name: string;
  description?: string;
  trigger: FlowTrigger;
  actions: FlowAction[];
  enabled: boolean;
  lastRun?: Date;
  runCount: number;
  errorCount: number;
  createdAt: Date;
}

export interface FlowTrigger {
  type: 'schedule' | 'webhook' | 'email' | 'slack' | 'notion' | 'sheets' | 'reclaim';
  config: Record<string, any>;
}

export interface FlowAction {
  id: string;
  type: 'llm' | 'extract' | 'classify' | 'http' | 'task' | 'dm' | 'sheet' | 'notify';
  config: Record<string, any>;
  position: number;
}

// Tool Types
export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  config: Record<string, any>;
  enabled: boolean;
  createdAt: Date;
}

export interface ToolExecution {
  id: string;
  toolId: string;
  input: Record<string, any>;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
  startTime: Date;
  endTime?: Date;
}