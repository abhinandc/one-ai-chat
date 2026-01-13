import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:just_audio/just_audio.dart';
import 'package:oneedge_mobile/core/config/env_config.dart';

/// ElevenLabs API error.
class ElevenLabsException implements Exception {
  const ElevenLabsException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => 'ElevenLabsException: $message (status: $statusCode)';
}

/// Voice settings for text-to-speech.
class VoiceSettings {
  const VoiceSettings({
    this.stability = 0.5,
    this.similarityBoost = 0.75,
    this.style = 0.0,
    this.useSpeakerBoost = true,
  });

  final double stability;
  final double similarityBoost;
  final double style;
  final bool useSpeakerBoost;

  Map<String, dynamic> toJson() => {
        'stability': stability,
        'similarity_boost': similarityBoost,
        'style': style,
        'use_speaker_boost': useSpeakerBoost,
      };
}

/// ElevenLabs text-to-speech service.
///
/// Provides real voice synthesis using ElevenLabs API.
/// Requires ELEVENLABS_API_KEY environment variable to be set.
class ElevenLabsService {
  ElevenLabsService({
    http.Client? httpClient,
    AudioPlayer? audioPlayer,
  })  : _httpClient = httpClient ?? http.Client(),
        _audioPlayer = audioPlayer ?? AudioPlayer();

  final http.Client _httpClient;
  final AudioPlayer _audioPlayer;

  static const String _baseUrl = 'https://api.elevenlabs.io/v1';

  /// Check if the service is configured with an API key.
  static bool get isConfigured => EnvConfig.elevenLabsApiKey.isNotEmpty;

  /// Get the configured voice ID for Sia.
  static String get voiceId => EnvConfig.siaVoiceId;

  /// Get headers for API requests.
  Map<String, String> get _headers => {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': EnvConfig.elevenLabsApiKey,
      };

  /// Convert text to speech and return audio bytes.
  ///
  /// Throws [ElevenLabsException] if the API call fails.
  Future<Uint8List> textToSpeech(
    String text, {
    String? voiceId,
    VoiceSettings? voiceSettings,
    String modelId = 'eleven_multilingual_v2',
  }) async {
    if (!isConfigured) {
      throw const ElevenLabsException(
        'ElevenLabs API key not configured. Set ELEVENLABS_API_KEY environment variable.',
      );
    }

    final effectiveVoiceId = voiceId ?? ElevenLabsService.voiceId;
    final url = Uri.parse('$_baseUrl/text-to-speech/$effectiveVoiceId');

    final body = {
      'text': text,
      'model_id': modelId,
      'voice_settings': (voiceSettings ?? const VoiceSettings()).toJson(),
    };

    try {
      final response = await _httpClient.post(
        url,
        headers: _headers,
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        return response.bodyBytes;
      } else {
        final errorBody = response.body;
        String errorMessage = 'Text-to-speech failed';

        try {
          final errorJson = jsonDecode(errorBody);
          errorMessage = errorJson['detail']?['message'] ??
                        errorJson['detail'] ??
                        errorJson['message'] ??
                        errorMessage;
        } catch (_) {
          // Use default message
        }

        throw ElevenLabsException(
          errorMessage,
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ElevenLabsException) rethrow;
      throw ElevenLabsException('Network error: $e');
    }
  }

  /// Convert text to speech and play it immediately.
  ///
  /// Returns a [Future] that completes when playback finishes.
  Future<void> speak(
    String text, {
    String? voiceId,
    VoiceSettings? voiceSettings,
    String modelId = 'eleven_multilingual_v2',
  }) async {
    final audioBytes = await textToSpeech(
      text,
      voiceId: voiceId,
      voiceSettings: voiceSettings,
      modelId: modelId,
    );

    // Create a data URI for the audio
    final base64Audio = base64Encode(audioBytes);
    final dataUri = 'data:audio/mpeg;base64,$base64Audio';

    // Play the audio
    await _audioPlayer.setUrl(dataUri);
    await _audioPlayer.play();

    // Wait for playback to complete
    await _audioPlayer.playerStateStream.firstWhere(
      (state) => state.processingState == ProcessingState.completed,
    );
  }

  /// Stop any currently playing audio.
  Future<void> stop() async {
    await _audioPlayer.stop();
  }

  /// Pause currently playing audio.
  Future<void> pause() async {
    await _audioPlayer.pause();
  }

  /// Resume paused audio.
  Future<void> resume() async {
    await _audioPlayer.play();
  }

  /// Get the current playback state.
  Stream<PlayerState> get playerStateStream => _audioPlayer.playerStateStream;

  /// Check if audio is currently playing.
  bool get isPlaying => _audioPlayer.playing;

  /// Get available voices from ElevenLabs.
  Future<List<Map<String, dynamic>>> getVoices() async {
    if (!isConfigured) {
      throw const ElevenLabsException(
        'ElevenLabs API key not configured.',
      );
    }

    final url = Uri.parse('$_baseUrl/voices');

    try {
      final response = await _httpClient.get(
        url,
        headers: {
          'Accept': 'application/json',
          'xi-api-key': EnvConfig.elevenLabsApiKey,
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data['voices'] ?? []);
      } else {
        throw ElevenLabsException(
          'Failed to fetch voices',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ElevenLabsException) rethrow;
      throw ElevenLabsException('Network error: $e');
    }
  }

  /// Dispose of resources.
  Future<void> dispose() async {
    await _audioPlayer.dispose();
    _httpClient.close();
  }
}
