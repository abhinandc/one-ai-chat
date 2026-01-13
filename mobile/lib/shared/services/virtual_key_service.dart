import 'package:oneedge_mobile/shared/services/supabase_service.dart';

/// Virtual key data from EdgeAdmin.
class VirtualKey {
  const VirtualKey({
    required this.id,
    required this.email,
    required this.label,
    required this.keyHash,
    required this.models,
    this.budgetUsd = 0,
    this.rpm = 60,
    this.rpd = 1000,
    this.tpm = 100000,
    this.tpd = 1000000,
    this.disabled = false,
    this.maskedKey,
  });

  factory VirtualKey.fromJson(Map<String, dynamic> json) {
    // Parse models from models_json field
    List<String> models = [];
    final modelsJson = json['models_json'];
    if (modelsJson != null) {
      if (modelsJson is List) {
        models = modelsJson.cast<String>();
      } else if (modelsJson is Map) {
        // Could be a map like {"models": ["gpt-4", "claude-3"]}
        final modelsList = modelsJson['models'];
        if (modelsList is List) {
          models = modelsList.cast<String>();
        }
      }
    }

    return VirtualKey(
      id: json['id'] as String,
      email: json['email'] as String,
      label: json['label'] as String? ?? 'Default',
      keyHash: json['key_hash'] as String,
      models: models,
      budgetUsd: (json['budget_usd'] as num?)?.toDouble() ?? 0,
      rpm: json['rpm'] as int? ?? 60,
      rpd: json['rpd'] as int? ?? 1000,
      tpm: json['tpm'] as int? ?? 100000,
      tpd: json['tpd'] as int? ?? 1000000,
      disabled: json['disabled'] as bool? ?? false,
      maskedKey: json['masked_key'] as String?,
    );
  }

  final String id;
  final String email;
  final String label;
  final String keyHash;
  final List<String> models;
  final double budgetUsd;
  final int rpm;
  final int rpd;
  final int tpm;
  final int tpd;
  final bool disabled;
  final String? maskedKey;

  /// Check if this key has access to a specific model.
  bool hasModel(String model) => models.contains(model);

  /// Check if this key is active.
  bool get isActive => !disabled;
}

/// Service for managing virtual keys from EdgeAdmin.
class VirtualKeyService {
  const VirtualKeyService();

  /// Get the Supabase client.
  static get _client => SupabaseService.client;

  /// Get all virtual keys for the current user.
  Future<List<VirtualKey>> getVirtualKeys(String email) async {
    try {
      final response = await _client
          .from('virtual_keys')
          .select()
          .eq('email', email)
          .eq('disabled', false);

      return (response as List)
          .map((json) => VirtualKey.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  /// Get the primary (first active) virtual key for a user.
  Future<VirtualKey?> getPrimaryKey(String email) async {
    final keys = await getVirtualKeys(email);
    return keys.isNotEmpty ? keys.first : null;
  }

  /// Get all available models from user's virtual keys.
  Future<List<String>> getAvailableModels(String email) async {
    final keys = await getVirtualKeys(email);
    final models = <String>{};

    for (final key in keys) {
      models.addAll(key.models);
    }

    return models.toList();
  }

  /// Get a virtual key that has access to a specific model.
  Future<VirtualKey?> getKeyForModel(String email, String model) async {
    final keys = await getVirtualKeys(email);

    for (final key in keys) {
      if (key.hasModel(model)) {
        return key;
      }
    }

    return null;
  }
}
