import 'package:equatable/equatable.dart';

/// Project model for conversation organization.
///
/// Maps to conversation_folders table in Supabase (renamed to projects in mobile).
class Project extends Equatable {
  const Project({
    required this.id,
    required this.userEmail,
    required this.name,
    this.description,
    this.color = '#E5A84B',
    this.icon = 'folder',
    this.conversationIds = const [],
    required this.createdAt,
  });

  /// Create from Supabase JSON response.
  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'] as String,
      userEmail: json['user_email'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      color: json['color'] as String? ?? '#E5A84B',
      icon: json['icon'] as String? ?? 'folder',
      conversationIds:
          (json['conversation_ids'] as List<dynamic>?)?.cast<String>() ?? [],
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  /// Create from conversation_folders table format.
  factory Project.fromFolderJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'] as String,
      userEmail: json['user_email'] as String,
      name: json['name'] as String,
      color: _parseColor(json['color'] as String?),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  final String id;
  final String userEmail;
  final String name;
  final String? description;
  final String color;
  final String icon;
  final List<String> conversationIds;
  final DateTime createdAt;

  /// Convert to JSON for Supabase.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_email': userEmail,
      'name': name,
      if (description != null) 'description': description,
      'color': color,
      'icon': icon,
      'conversation_ids': conversationIds,
      'created_at': createdAt.toIso8601String(),
    };
  }

  /// Convert to conversation_folders format for Supabase.
  Map<String, dynamic> toFolderJson() {
    return {
      'id': id,
      'user_email': userEmail,
      'name': name,
      'color': 'bg-accent-$color', // Convert hex to class name
      'created_at': createdAt.toIso8601String(),
    };
  }

  /// Copy with updated fields.
  Project copyWith({
    String? id,
    String? userEmail,
    String? name,
    String? description,
    String? color,
    String? icon,
    List<String>? conversationIds,
    DateTime? createdAt,
  }) {
    return Project(
      id: id ?? this.id,
      userEmail: userEmail ?? this.userEmail,
      name: name ?? this.name,
      description: description ?? this.description,
      color: color ?? this.color,
      icon: icon ?? this.icon,
      conversationIds: conversationIds ?? this.conversationIds,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  /// Number of conversations in this project.
  int get conversationCount => conversationIds.length;

  @override
  List<Object?> get props => [
        id,
        userEmail,
        name,
        description,
        color,
        icon,
        conversationIds,
        createdAt,
      ];

  /// Parse color from various formats.
  static String _parseColor(String? value) {
    if (value == null) return '#E5A84B';

    // If already hex, return as-is
    if (value.startsWith('#')) return value;

    // Parse from bg-accent-* class name
    if (value.startsWith('bg-accent-')) {
      final colorName = value.substring('bg-accent-'.length);
      return _colorNameToHex(colorName);
    }

    return '#E5A84B';
  }

  /// Convert color name to hex.
  static String _colorNameToHex(String name) {
    const colorMap = {
      'blue': '#3B82F6',
      'green': '#22C55E',
      'yellow': '#F59E0B',
      'red': '#EF4444',
      'purple': '#8B5CF6',
      'pink': '#EC4899',
      'orange': '#F97316',
      'teal': '#14B8A6',
      'indigo': '#6366F1',
      'cyan': '#06B6D4',
    };
    return colorMap[name] ?? '#E5A84B';
  }
}
