import 'package:equatable/equatable.dart';

/// User model for the authenticated user.
class User extends Equatable {
  const User({
    required this.id,
    required this.email,
    this.name,
    this.givenName,
    this.familyName,
    this.avatarUrl,
    this.createdAt,
  });

  /// Create from Supabase Auth user.
  factory User.fromSupabaseAuth(Map<String, dynamic> json) {
    final userMetadata = json['user_metadata'] as Map<String, dynamic>? ?? {};

    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      name: userMetadata['full_name'] as String? ??
          userMetadata['name'] as String?,
      givenName: userMetadata['given_name'] as String?,
      familyName: userMetadata['family_name'] as String?,
      avatarUrl: userMetadata['avatar_url'] as String? ??
          userMetadata['picture'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  /// Create from app_users table.
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
      givenName: json['given_name'] as String?,
      familyName: json['family_name'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  final String id;
  final String email;
  final String? name;
  final String? givenName;
  final String? familyName;
  final String? avatarUrl;
  final DateTime? createdAt;

  /// Get display name (full name or email).
  String get displayName {
    if (name != null && name!.isNotEmpty) return name!;
    if (givenName != null && familyName != null) {
      return '$givenName $familyName';
    }
    if (givenName != null) return givenName!;
    return email.split('@').first;
  }

  /// Get initials for avatar.
  String get initials {
    if (givenName != null && familyName != null) {
      return '${givenName![0]}${familyName![0]}'.toUpperCase();
    }
    if (name != null && name!.isNotEmpty) {
      final parts = name!.split(' ');
      if (parts.length >= 2) {
        return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      }
      return name![0].toUpperCase();
    }
    return email[0].toUpperCase();
  }

  /// Convert to JSON.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'given_name': givenName,
      'family_name': familyName,
      'avatar_url': avatarUrl,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  /// Copy with updated fields.
  User copyWith({
    String? id,
    String? email,
    String? name,
    String? givenName,
    String? familyName,
    String? avatarUrl,
    DateTime? createdAt,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      givenName: givenName ?? this.givenName,
      familyName: familyName ?? this.familyName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        email,
        name,
        givenName,
        familyName,
        avatarUrl,
        createdAt,
      ];
}
