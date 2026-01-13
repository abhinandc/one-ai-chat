import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:oneedge_mobile/features/auth/data/auth_repository.dart';
import 'package:oneedge_mobile/shared/models/user.dart';
import 'package:oneedge_mobile/shared/models/conversation.dart';
import 'package:oneedge_mobile/shared/models/project.dart';
import 'package:oneedge_mobile/shared/services/conversation_service.dart';
import 'package:oneedge_mobile/shared/services/project_service.dart';
import 'package:oneedge_mobile/shared/services/ai_service.dart';
import 'package:oneedge_mobile/shared/services/sia_service.dart';
import 'package:oneedge_mobile/shared/services/elevenlabs_service.dart';
import 'package:oneedge_mobile/shared/services/speech_service.dart';
import 'package:oneedge_mobile/shared/services/sia_agent_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supabase;

// =============================================================================
// AUTH PROVIDERS
// =============================================================================

/// Auth repository provider.
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return const AuthRepository();
});

/// Auth state provider - streams auth state changes.
final authStateProvider = StreamProvider<supabase.AuthState>((ref) {
  return ref.watch(authRepositoryProvider).authStateChanges;
});

/// Current user provider.
final currentUserProvider = Provider<User?>((ref) {
  final authState = ref.watch(authStateProvider);
  return authState.maybeWhen(
    data: (state) {
      final supabaseUser = state.session?.user;
      if (supabaseUser == null) return null;
      return User.fromSupabaseAuth(supabaseUser.toJson());
    },
    orElse: () => null,
  );
});

/// Is authenticated provider.
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(currentUserProvider) != null;
});

// =============================================================================
// CONVERSATION PROVIDERS
// =============================================================================

/// Conversation service provider.
final conversationServiceProvider = Provider<ConversationService>((ref) {
  return const ConversationService();
});

/// All conversations provider.
final conversationsProvider = FutureProvider<List<Conversation>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];

  final service = ref.watch(conversationServiceProvider);
  return service.getConversations(user.email);
});

/// Single conversation provider.
final conversationProvider =
    FutureProvider.family<Conversation?, String>((ref, id) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return null;

  final service = ref.watch(conversationServiceProvider);
  return service.getConversation(id, user.email);
});

/// Pinned conversations provider.
final pinnedConversationsProvider =
    FutureProvider<List<Conversation>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];

  final service = ref.watch(conversationServiceProvider);
  return service.getPinnedConversations(user.email);
});

// =============================================================================
// THEME PROVIDERS
// =============================================================================

/// App theme mode enum.
enum AppThemeMode { light, dark, system }

/// Theme mode provider (light/dark/system).
/// Uses OKLCH colors from hardUIrules.md for consistent theming.
final themeModeProvider = StateProvider<AppThemeMode>((ref) => AppThemeMode.system);

// =============================================================================
// MODEL MODE PROVIDERS
// =============================================================================

/// Current model mode provider.
final modelModeProvider = StateProvider<ModelModeType>((ref) {
  return ModelModeType.fast;
});

/// Model mode types.
enum ModelModeType {
  thinking,
  fast,
  coding;

  String get displayName {
    switch (this) {
      case ModelModeType.thinking:
        return 'Thinking';
      case ModelModeType.fast:
        return 'Fast';
      case ModelModeType.coding:
        return 'Coding';
    }
  }

  String get description {
    switch (this) {
      case ModelModeType.thinking:
        return 'Deep analysis, complex reasoning';
      case ModelModeType.fast:
        return 'Quick responses, casual chat';
      case ModelModeType.coding:
        return 'Code generation, debugging';
    }
  }

  String get model {
    switch (this) {
      case ModelModeType.thinking:
        return 'claude-3-opus';
      case ModelModeType.fast:
        return 'gpt-4o-mini';
      case ModelModeType.coding:
        return 'claude-3-sonnet';
    }
  }

  double get temperature {
    switch (this) {
      case ModelModeType.thinking:
        return 0.3;
      case ModelModeType.fast:
        return 0.7;
      case ModelModeType.coding:
        return 0.2;
    }
  }
}

// =============================================================================
// PROJECT PROVIDERS
// =============================================================================

/// Project service provider.
final projectServiceProvider = Provider<ProjectService>((ref) {
  return const ProjectService();
});

/// All projects provider.
final projectsProvider = FutureProvider<List<Project>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];

  final service = ref.watch(projectServiceProvider);
  return service.getProjectsWithCounts(user.email);
});

/// Single project provider.
final projectProvider =
    FutureProvider.family<Project?, String>((ref, id) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return null;

  final service = ref.watch(projectServiceProvider);
  return service.getProject(id, user.email);
});

// =============================================================================
// AI SERVICE PROVIDERS
// =============================================================================

/// AI service provider.
final aiServiceProvider = Provider<AIService>((ref) {
  return const AIService();
});

// =============================================================================
// SIA PROVIDERS
// =============================================================================

/// Sia service provider.
final siaServiceProvider = Provider<SiaService>((ref) {
  return const SiaService();
});

/// Sia memory provider.
final siaMemoryProvider = FutureProvider<SiaMemory?>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return null;

  final service = ref.watch(siaServiceProvider);
  return service.getMemory(user.id);
});

// =============================================================================
// VOICE SERVICES PROVIDERS
// =============================================================================

/// ElevenLabs TTS service provider.
final elevenLabsServiceProvider = Provider<ElevenLabsService>((ref) {
  return ElevenLabsService();
});

/// Speech recognition service provider.
final speechServiceProvider = Provider<SpeechService>((ref) {
  return SpeechService();
});

/// Speech recognition availability provider.
final speechAvailableProvider = FutureProvider<bool>((ref) async {
  final service = ref.watch(speechServiceProvider);
  return service.initialize();
});

/// ElevenLabs configuration status provider.
final elevenLabsConfiguredProvider = Provider<bool>((ref) {
  return ElevenLabsService.isConfigured;
});

/// Sia Conversational AI Agent service provider.
final siaAgentServiceProvider = Provider<SiaAgentService>((ref) {
  return SiaAgentService();
});

/// Sia Agent configuration status provider.
final siaAgentConfiguredProvider = Provider<bool>((ref) {
  return SiaAgentService.isConfigured;
});

// =============================================================================
// LOADING STATES
// =============================================================================

/// Global loading state provider.
final isLoadingProvider = StateProvider<bool>((ref) => false);
