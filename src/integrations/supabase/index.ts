/**
 * Supabase Integration Module
 *
 * This module provides a centralized export for all Supabase-related
 * functionality in the OneEdge application.
 *
 * @module integrations/supabase
 *
 * @example
 * ```ts
 * import { supabase, signInWithGoogle, type Agent } from '@/integrations/supabase';
 *
 * // Use the client
 * const { data, error } = await supabase.from('agents').select('*');
 *
 * // Sign in
 * await signInWithGoogle();
 * ```
 */

// Re-export the Supabase client and auth functions
export {
  supabase,
  supabaseUrl,
  supabaseAnonKey,
  onAuthStateChange,
  getCurrentSession,
  getCurrentUser,
  signInWithGoogle,
  signOut,
  refreshSession,
  type AuthStateChangeCallback,
} from './client';

// Re-export all types
export type {
  // Database types
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,

  // OneEdge table types
  UserRole,
  Agent,
  EdgeVaultCredential,
  AutomationTemplate,
  PromptFeed,
  ExternalPrompt,
  AIGalleryRequest,
  N8nConfiguration,
  Project,
  SiaMemory,

  // Shared table types
  VirtualKey,
  Model,
  Conversation,
  ConversationFolder,
  PromptTemplate,
  PromptLike,
  Automation,
  AutomationExecution,
  Usage,
  User,

  // Insert types
  AgentInsert,
  EdgeVaultCredentialInsert,
  AutomationTemplateInsert,
  PromptFeedInsert,
  ExternalPromptInsert,
  AIGalleryRequestInsert,
  N8nConfigurationInsert,
  ProjectInsert,
  SiaMemoryInsert,

  // Update types
  AgentUpdate,
  EdgeVaultCredentialUpdate,
  AutomationTemplateUpdate,
  PromptFeedUpdate,
  ExternalPromptUpdate,
  AIGalleryRequestUpdate,
  N8nConfigurationUpdate,
  ProjectUpdate,
  SiaMemoryUpdate,

  // Enum types
  IntegrationType,
  CredentialStatus,
  AutomationCategory,
  FeedSourceType,
  RequestType,
  RequestPriority,
  RequestStatus,
  ConnectionStatus,
  DifficultyLevel,
  UsageStatus,

  // Structured types
  SiaMemoryData,
  SiaFact,
  AgentWorkflowData,
  WorkflowNode,
  WorkflowEdge,
  AutomationTemplateData,
  AutomationTrigger,
  AutomationStep,
  AutomationVariable,
} from './types';

// Default export the supabase client
export { supabase as default } from './client';
