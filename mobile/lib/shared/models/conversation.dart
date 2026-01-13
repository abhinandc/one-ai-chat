import 'package:equatable/equatable.dart';
import 'package:oneedge_mobile/shared/models/chat_message.dart';

/// Conversation model matching Supabase conversations table.
class Conversation extends Equatable {
  const Conversation({
    required this.id,
    required this.userEmail,
    required this.title,
    required this.messages,
    this.folderId,
    this.pinned = false,
    this.shared = false,
    this.unread = false,
    this.tags = const [],
    this.settings = const {},
    required this.createdAt,
    required this.updatedAt,
  });

  /// Create from Supabase JSON response.
  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'] as String,
      userEmail: json['user_email'] as String,
      title: json['title'] as String,
      messages: _parseMessages(json['messages']),
      folderId: json['folder_id'] as String?,
      pinned: json['pinned'] as bool? ?? false,
      shared: json['shared'] as bool? ?? false,
      unread: json['unread'] as bool? ?? false,
      tags: (json['tags'] as List<dynamic>?)?.cast<String>() ?? [],
      settings: (json['settings'] as Map<String, dynamic>?) ?? {},
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  final String id;
  final String userEmail;
  final String title;
  final List<ChatMessage> messages;
  final String? folderId;
  final bool pinned;
  final bool shared;
  final bool unread;
  final List<String> tags;
  final Map<String, dynamic> settings;
  final DateTime createdAt;
  final DateTime updatedAt;

  /// Convert to JSON for Supabase.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_email': userEmail,
      'title': title,
      'messages': messages.map((m) => m.toJson()).toList(),
      'folder_id': folderId,
      'pinned': pinned,
      'shared': shared,
      'unread': unread,
      'tags': tags,
      'settings': settings,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  /// Copy with updated fields.
  Conversation copyWith({
    String? id,
    String? userEmail,
    String? title,
    List<ChatMessage>? messages,
    String? folderId,
    bool? pinned,
    bool? shared,
    bool? unread,
    List<String>? tags,
    Map<String, dynamic>? settings,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Conversation(
      id: id ?? this.id,
      userEmail: userEmail ?? this.userEmail,
      title: title ?? this.title,
      messages: messages ?? this.messages,
      folderId: folderId ?? this.folderId,
      pinned: pinned ?? this.pinned,
      shared: shared ?? this.shared,
      unread: unread ?? this.unread,
      tags: tags ?? this.tags,
      settings: settings ?? this.settings,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  /// Get the last message in the conversation.
  ChatMessage? get lastMessage => messages.isNotEmpty ? messages.last : null;

  /// Get the model used in the conversation settings.
  String? get model => settings['model'] as String?;

  /// Get temperature setting.
  double? get temperature => (settings['temperature'] as num?)?.toDouble();

  @override
  List<Object?> get props => [
        id,
        userEmail,
        title,
        messages,
        folderId,
        pinned,
        shared,
        unread,
        tags,
        settings,
        createdAt,
        updatedAt,
      ];

  static List<ChatMessage> _parseMessages(dynamic messagesJson) {
    if (messagesJson == null) return [];
    if (messagesJson is List) {
      return messagesJson
          .map((m) => ChatMessage.fromJson(m as Map<String, dynamic>))
          .toList();
    }
    return [];
  }
}
