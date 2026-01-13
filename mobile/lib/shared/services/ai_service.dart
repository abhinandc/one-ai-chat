import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:oneedge_mobile/core/config/env_config.dart';
import 'package:oneedge_mobile/shared/models/chat_message.dart';
import 'package:oneedge_mobile/shared/services/supabase_service.dart';
import 'package:oneedge_mobile/shared/services/virtual_key_service.dart';

/// Service for AI model API interactions.
///
/// Connects to EdgeAdmin API proxy using virtual keys from Supabase.
/// Virtual keys are provisioned by EdgeAdmin and stored in Supabase.
class AIService {
  const AIService();

  final VirtualKeyService _virtualKeyService = const VirtualKeyService();

  /// Get the API proxy URL.
  /// This should be the EdgeAdmin API proxy URL.
  static String get _baseUrl {
    final configuredUrl = EnvConfig.apiProxyUrl;
    if (configuredUrl.isNotEmpty) {
      return configuredUrl;
    }
    // Default to EdgeAdmin proxy URL if not configured
    // This assumes EdgeAdmin runs on the same domain or is proxied
    return 'https://admin.oneorigin.us/api';
  }

  /// Get the current user email from Supabase session.
  static String? get _currentUserEmail =>
      SupabaseService.instance.currentSession?.user.email;

  /// Check if the service is configured (has a base URL and user is logged in).
  static bool get isConfigured =>
      _baseUrl.isNotEmpty && _currentUserEmail != null;

  /// Get a virtual key for API authorization.
  Future<String?> _getVirtualKeyForModel(String model) async {
    final email = _currentUserEmail;
    if (email == null) return null;

    final key = await _virtualKeyService.getKeyForModel(email, model);
    return key?.keyHash;
  }

  /// Get the primary virtual key.
  Future<String?> _getPrimaryVirtualKey() async {
    final email = _currentUserEmail;
    if (email == null) return null;

    final key = await _virtualKeyService.getPrimaryKey(email);
    return key?.keyHash;
  }

  /// Send a chat completion request.
  ///
  /// Returns a stream of content chunks for streaming responses.
  /// Uses virtual keys from EdgeAdmin via Supabase for authorization.
  Stream<String> streamChatCompletion({
    required String model,
    required List<ChatMessage> messages,
    double temperature = 0.7,
    int maxTokens = 4096,
    String? systemPrompt,
  }) async* {
    if (!isConfigured) {
      yield 'AI service not configured. Please log in.';
      return;
    }

    // Get virtual key for the requested model
    final virtualKey = await _getVirtualKeyForModel(model);
    if (virtualKey == null) {
      // Fall back to primary key if no model-specific key found
      final primaryKey = await _getPrimaryVirtualKey();
      if (primaryKey == null) {
        yield 'No API access available. Contact your administrator to get a virtual key.';
        return;
      }
    }

    final authKey = virtualKey ?? await _getPrimaryVirtualKey();
    if (authKey == null) {
      yield 'Authentication failed. Please log in again.';
      return;
    }

    final requestMessages = <Map<String, String>>[];

    // Add system prompt if provided
    if (systemPrompt != null && systemPrompt.isNotEmpty) {
      requestMessages.add({
        'role': 'system',
        'content': systemPrompt,
      });
    }

    // Add conversation messages
    for (final message in messages) {
      requestMessages.add({
        'role': message.role.name,
        'content': message.content,
      });
    }

    final request = http.Request('POST', Uri.parse('$_baseUrl/v1/chat/completions'));
    request.headers.addAll({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $authKey',
    });
    request.body = jsonEncode({
      'model': model,
      'messages': requestMessages,
      'temperature': temperature,
      'max_tokens': maxTokens,
      'stream': true,
    });

    try {
      final response = await http.Client().send(request);

      if (response.statusCode != 200) {
        final body = await response.stream.bytesToString();
        yield 'Error: ${response.statusCode} - $body';
        return;
      }

      await for (final chunk in response.stream.transform(utf8.decoder)) {
        // Parse SSE format
        for (final line in chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            final data = line.substring(6).trim();
            if (data == '[DONE]') return;

            try {
              final json = jsonDecode(data) as Map<String, dynamic>;
              final choices = json['choices'] as List?;
              if (choices != null && choices.isNotEmpty) {
                final delta = choices[0]['delta'] as Map<String, dynamic>?;
                final content = delta?['content'] as String?;
                if (content != null) {
                  yield content;
                }
              }
            } catch (_) {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (e) {
      yield 'Error: $e';
    }
  }

  /// Send a non-streaming chat completion request.
  /// Uses virtual keys from EdgeAdmin via Supabase for authorization.
  Future<String> chatCompletion({
    required String model,
    required List<ChatMessage> messages,
    double temperature = 0.7,
    int maxTokens = 4096,
    String? systemPrompt,
  }) async {
    if (!isConfigured) {
      return 'AI service not configured. Please log in.';
    }

    // Get virtual key for the requested model
    final virtualKey = await _getVirtualKeyForModel(model);
    final authKey = virtualKey ?? await _getPrimaryVirtualKey();

    if (authKey == null) {
      return 'No API access available. Contact your administrator to get a virtual key.';
    }

    final requestMessages = <Map<String, String>>[];

    // Add system prompt if provided
    if (systemPrompt != null && systemPrompt.isNotEmpty) {
      requestMessages.add({
        'role': 'system',
        'content': systemPrompt,
      });
    }

    // Add conversation messages
    for (final message in messages) {
      requestMessages.add({
        'role': message.role.name,
        'content': message.content,
      });
    }

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/v1/chat/completions'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authKey',
        },
        body: jsonEncode({
          'model': model,
          'messages': requestMessages,
          'temperature': temperature,
          'max_tokens': maxTokens,
          'stream': false,
        }),
      );

      if (response.statusCode != 200) {
        return 'Error: ${response.statusCode} - ${response.body}';
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final choices = json['choices'] as List?;
      if (choices != null && choices.isNotEmpty) {
        final message = choices[0]['message'] as Map<String, dynamic>?;
        return message?['content'] as String? ?? 'No response received.';
      }

      return 'No response received.';
    } catch (e) {
      return 'Error: $e';
    }
  }

  /// Get available models for the user from their virtual keys.
  /// Virtual keys are provisioned by EdgeAdmin and stored in Supabase.
  Future<List<String>> getAvailableModels() async {
    final email = _currentUserEmail;
    if (email == null) {
      return [];
    }

    try {
      // Get available models from user's virtual keys in Supabase
      return await _virtualKeyService.getAvailableModels(email);
    } catch (e) {
      return [];
    }
  }
}
