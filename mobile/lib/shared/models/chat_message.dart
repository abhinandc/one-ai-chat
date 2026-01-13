import 'package:equatable/equatable.dart';

/// Role of a chat message.
enum MessageRole {
  user,
  assistant,
  system;

  factory MessageRole.fromString(String value) {
    switch (value.toLowerCase()) {
      case 'user':
        return MessageRole.user;
      case 'assistant':
        return MessageRole.assistant;
      case 'system':
        return MessageRole.system;
      default:
        return MessageRole.user;
    }
  }
}

/// A single message in a chat conversation.
class ChatMessage extends Equatable {
  const ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    this.model,
    this.tokens,
    this.isStreaming = false,
    this.error,
    required this.timestamp,
  });

  /// Create from JSON (from Supabase messages JSONB).
  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String? ?? '',
      role: MessageRole.fromString(json['role'] as String? ?? 'user'),
      content: json['content'] as String? ?? '',
      model: json['model'] as String?,
      tokens: json['tokens'] as int?,
      isStreaming: json['isStreaming'] as bool? ?? false,
      error: json['error'] as String?,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : DateTime.now(),
    );
  }

  /// Create a new user message.
  factory ChatMessage.user({
    required String id,
    required String content,
  }) {
    return ChatMessage(
      id: id,
      role: MessageRole.user,
      content: content,
      timestamp: DateTime.now(),
    );
  }

  /// Create a new assistant message.
  factory ChatMessage.assistant({
    required String id,
    String content = '',
    String? model,
    int? tokens,
    bool isStreaming = false,
    String? error,
  }) {
    return ChatMessage(
      id: id,
      role: MessageRole.assistant,
      content: content,
      model: model,
      tokens: tokens,
      isStreaming: isStreaming,
      error: error,
      timestamp: DateTime.now(),
    );
  }

  /// Create a new system message.
  factory ChatMessage.system({
    required String id,
    required String content,
  }) {
    return ChatMessage(
      id: id,
      role: MessageRole.system,
      content: content,
      timestamp: DateTime.now(),
    );
  }

  final String id;
  final MessageRole role;
  final String content;
  final String? model;
  final int? tokens;
  final bool isStreaming;
  final String? error;
  final DateTime timestamp;

  /// Convert to JSON for Supabase.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'role': role.name,
      'content': content,
      if (model != null) 'model': model,
      if (tokens != null) 'tokens': tokens,
      'isStreaming': isStreaming,
      if (error != null) 'error': error,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  /// Copy with updated fields.
  ChatMessage copyWith({
    String? id,
    MessageRole? role,
    String? content,
    String? model,
    int? tokens,
    bool? isStreaming,
    String? error,
    DateTime? timestamp,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      role: role ?? this.role,
      content: content ?? this.content,
      model: model ?? this.model,
      tokens: tokens ?? this.tokens,
      isStreaming: isStreaming ?? this.isStreaming,
      error: error ?? this.error,
      timestamp: timestamp ?? this.timestamp,
    );
  }

  /// Check if this is a user message.
  bool get isUser => role == MessageRole.user;

  /// Check if this is an assistant message.
  bool get isAssistant => role == MessageRole.assistant;

  /// Check if this is a system message.
  bool get isSystem => role == MessageRole.system;

  /// Check if this message has an error.
  bool get hasError => error != null && error!.isNotEmpty;

  @override
  List<Object?> get props => [
        id,
        role,
        content,
        model,
        tokens,
        isStreaming,
        error,
        timestamp,
      ];
}
