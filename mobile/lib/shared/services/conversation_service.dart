import 'package:oneedge_mobile/shared/models/conversation.dart';
import 'package:oneedge_mobile/shared/models/chat_message.dart';
import 'package:oneedge_mobile/shared/services/supabase_service.dart';

/// Service for conversation CRUD operations.
class ConversationService {
  const ConversationService();

  /// Get the Supabase client.
  static get _client => SupabaseService.client;

  /// Fetch all conversations for a user.
  Future<List<Conversation>> getConversations(String userEmail) async {
    final response = await _client
        .from('conversations')
        .select()
        .eq('user_email', userEmail)
        .order('updated_at', ascending: false);

    return (response as List)
        .map((json) => Conversation.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// Fetch a single conversation by ID.
  Future<Conversation?> getConversation(String id, String userEmail) async {
    final response = await _client
        .from('conversations')
        .select()
        .eq('id', id)
        .eq('user_email', userEmail)
        .maybeSingle();

    if (response == null) return null;
    return Conversation.fromJson(response);
  }

  /// Create a new conversation.
  Future<Conversation> createConversation({
    required String userEmail,
    required String title,
    List<ChatMessage> messages = const [],
    String? folderId,
    Map<String, dynamic> settings = const {},
  }) async {
    final response = await _client
        .from('conversations')
        .insert({
          'user_email': userEmail,
          'title': title,
          'messages': messages.map((m) => m.toJson()).toList(),
          'folder_id': folderId,
          'settings': settings,
        })
        .select()
        .single();

    return Conversation.fromJson(response);
  }

  /// Update a conversation.
  Future<Conversation> updateConversation({
    required String id,
    required String userEmail,
    String? title,
    List<ChatMessage>? messages,
    String? folderId,
    bool? pinned,
    bool? shared,
    bool? unread,
    List<String>? tags,
    Map<String, dynamic>? settings,
  }) async {
    final updates = <String, dynamic>{
      'updated_at': DateTime.now().toIso8601String(),
    };

    if (title != null) updates['title'] = title;
    if (messages != null) {
      updates['messages'] = messages.map((m) => m.toJson()).toList();
    }
    if (folderId != null) updates['folder_id'] = folderId;
    if (pinned != null) updates['pinned'] = pinned;
    if (shared != null) updates['shared'] = shared;
    if (unread != null) updates['unread'] = unread;
    if (tags != null) updates['tags'] = tags;
    if (settings != null) updates['settings'] = settings;

    final response = await _client
        .from('conversations')
        .update(updates)
        .eq('id', id)
        .eq('user_email', userEmail)
        .select()
        .single();

    return Conversation.fromJson(response);
  }

  /// Add a message to a conversation.
  Future<Conversation> addMessage({
    required String conversationId,
    required String userEmail,
    required ChatMessage message,
  }) async {
    // First get the current conversation
    final conversation = await getConversation(conversationId, userEmail);
    if (conversation == null) {
      throw Exception('Conversation not found');
    }

    // Add the new message
    final updatedMessages = [...conversation.messages, message];

    return updateConversation(
      id: conversationId,
      userEmail: userEmail,
      messages: updatedMessages,
    );
  }

  /// Delete a conversation.
  Future<void> deleteConversation(String id, String userEmail) async {
    await _client
        .from('conversations')
        .delete()
        .eq('id', id)
        .eq('user_email', userEmail);
  }

  /// Search conversations by title or content.
  Future<List<Conversation>> searchConversations({
    required String userEmail,
    required String query,
  }) async {
    final response = await _client
        .from('conversations')
        .select()
        .eq('user_email', userEmail)
        .ilike('title', '%$query%')
        .order('updated_at', ascending: false);

    return (response as List)
        .map((json) => Conversation.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// Get pinned conversations.
  Future<List<Conversation>> getPinnedConversations(String userEmail) async {
    final response = await _client
        .from('conversations')
        .select()
        .eq('user_email', userEmail)
        .eq('pinned', true)
        .order('updated_at', ascending: false);

    return (response as List)
        .map((json) => Conversation.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// Get conversations in a folder.
  Future<List<Conversation>> getConversationsInFolder({
    required String userEmail,
    required String folderId,
  }) async {
    final response = await _client
        .from('conversations')
        .select()
        .eq('user_email', userEmail)
        .eq('folder_id', folderId)
        .order('updated_at', ascending: false);

    return (response as List)
        .map((json) => Conversation.fromJson(json as Map<String, dynamic>))
        .toList();
  }
}
