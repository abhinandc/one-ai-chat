import 'package:oneedge_mobile/shared/services/supabase_service.dart';

/// Sia memory data model.
class SiaMemory {
  const SiaMemory({
    required this.id,
    required this.userId,
    required this.memoryData,
    this.summary,
    this.lastInteractionAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SiaMemory.fromJson(Map<String, dynamic> json) {
    return SiaMemory(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      memoryData: json['memory_data'] as Map<String, dynamic>? ?? {},
      summary: json['summary'] as String?,
      lastInteractionAt: json['last_interaction_at'] != null
          ? DateTime.parse(json['last_interaction_at'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  final String id;
  final String userId;
  final Map<String, dynamic> memoryData;
  final String? summary;
  final DateTime? lastInteractionAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  /// Get user preferences from memory.
  Map<String, dynamic> get preferences =>
      memoryData['preferences'] as Map<String, dynamic>? ?? {};

  /// Get facts about the user.
  List<Map<String, dynamic>> get facts =>
      (memoryData['facts'] as List<dynamic>?)
          ?.cast<Map<String, dynamic>>() ??
      [];

  /// Get recent topics discussed.
  List<String> get recentTopics =>
      (memoryData['recent_topics'] as List<dynamic>?)?.cast<String>() ?? [];

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'memory_data': memoryData,
      'summary': summary,
      'last_interaction_at': lastInteractionAt?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  SiaMemory copyWith({
    String? id,
    String? userId,
    Map<String, dynamic>? memoryData,
    String? summary,
    DateTime? lastInteractionAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return SiaMemory(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      memoryData: memoryData ?? this.memoryData,
      summary: summary ?? this.summary,
      lastInteractionAt: lastInteractionAt ?? this.lastInteractionAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

/// Service for Sia voice assistant operations.
///
/// Manages persistent memory, conversation context, and ElevenLabs integration.
class SiaService {
  const SiaService();

  /// Get the Supabase client.
  static get _client => SupabaseService.client;

  /// Get or create Sia memory for a user.
  Future<SiaMemory?> getMemory(String userId) async {
    try {
      final response = await _client
          .from('sia_memory')
          .select()
          .eq('user_id', userId)
          .maybeSingle();

      if (response == null) {
        // Create initial memory if not exists
        return await _createInitialMemory(userId);
      }

      return SiaMemory.fromJson(response);
    } catch (e) {
      // Table may not exist yet
      return null;
    }
  }

  /// Create initial Sia memory for a new user.
  Future<SiaMemory?> _createInitialMemory(String userId) async {
    try {
      final response = await _client
          .from('sia_memory')
          .insert({
            'user_id': userId,
            'memory_data': {
              'preferences': {},
              'facts': [],
              'recent_topics': [],
            },
            'summary': null,
            'last_interaction_at': DateTime.now().toIso8601String(),
          })
          .select()
          .single();

      return SiaMemory.fromJson(response);
    } catch (e) {
      return null;
    }
  }

  /// Update Sia memory with new information.
  Future<SiaMemory?> updateMemory({
    required String userId,
    Map<String, dynamic>? memoryData,
    String? summary,
  }) async {
    try {
      final updates = <String, dynamic>{
        'last_interaction_at': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      };

      if (memoryData != null) updates['memory_data'] = memoryData;
      if (summary != null) updates['summary'] = summary;

      final response = await _client
          .from('sia_memory')
          .update(updates)
          .eq('user_id', userId)
          .select()
          .single();

      return SiaMemory.fromJson(response);
    } catch (e) {
      return null;
    }
  }

  /// Add a fact to Sia's memory about the user.
  Future<SiaMemory?> addFact({
    required String userId,
    required String fact,
    required String category,
    double confidence = 1.0,
  }) async {
    final currentMemory = await getMemory(userId);
    if (currentMemory == null) return null;

    final facts = List<Map<String, dynamic>>.from(currentMemory.facts);
    facts.add({
      'fact': fact,
      'category': category,
      'confidence': confidence,
      'learned_at': DateTime.now().toIso8601String(),
    });

    final updatedData = Map<String, dynamic>.from(currentMemory.memoryData);
    updatedData['facts'] = facts;

    return updateMemory(
      userId: userId,
      memoryData: updatedData,
    );
  }

  /// Add a recent topic to the conversation history.
  Future<SiaMemory?> addRecentTopic({
    required String userId,
    required String topic,
    int maxTopics = 10,
  }) async {
    final currentMemory = await getMemory(userId);
    if (currentMemory == null) return null;

    final topics = List<String>.from(currentMemory.recentTopics);
    topics.insert(0, topic);
    if (topics.length > maxTopics) {
      topics.removeRange(maxTopics, topics.length);
    }

    final updatedData = Map<String, dynamic>.from(currentMemory.memoryData);
    updatedData['recent_topics'] = topics;

    return updateMemory(
      userId: userId,
      memoryData: updatedData,
    );
  }

  /// Update user preference in Sia's memory.
  Future<SiaMemory?> updatePreference({
    required String userId,
    required String key,
    required dynamic value,
  }) async {
    final currentMemory = await getMemory(userId);
    if (currentMemory == null) return null;

    final preferences = Map<String, dynamic>.from(currentMemory.preferences);
    preferences[key] = value;

    final updatedData = Map<String, dynamic>.from(currentMemory.memoryData);
    updatedData['preferences'] = preferences;

    return updateMemory(
      userId: userId,
      memoryData: updatedData,
    );
  }

  /// Clear all Sia memory for a user (GDPR/privacy).
  Future<void> clearMemory(String userId) async {
    try {
      await _client.from('sia_memory').delete().eq('user_id', userId);
    } catch (e) {
      // Ignore errors
    }
  }

  /// Generate a context prompt from Sia's memory.
  String generateContextPrompt(SiaMemory memory) {
    final buffer = StringBuffer();

    buffer.writeln('You are Sia, a Strategic Intelligence Assistant.');
    buffer.writeln('You have the following information about this user:');
    buffer.writeln();

    // Add summary if available
    if (memory.summary != null && memory.summary!.isNotEmpty) {
      buffer.writeln('Summary: ${memory.summary}');
      buffer.writeln();
    }

    // Add known facts
    if (memory.facts.isNotEmpty) {
      buffer.writeln('Known facts:');
      for (final fact in memory.facts.take(10)) {
        buffer.writeln('- ${fact['fact']}');
      }
      buffer.writeln();
    }

    // Add preferences
    if (memory.preferences.isNotEmpty) {
      buffer.writeln('User preferences:');
      memory.preferences.forEach((key, value) {
        buffer.writeln('- $key: $value');
      });
      buffer.writeln();
    }

    // Add recent topics
    if (memory.recentTopics.isNotEmpty) {
      buffer.writeln('Recent conversation topics: ${memory.recentTopics.join(', ')}');
      buffer.writeln();
    }

    buffer.writeln('Be warm, concise, and helpful. Reference known information when relevant.');

    return buffer.toString();
  }
}
