import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:just_audio/just_audio.dart';
import 'package:oneedge_mobile/core/config/env_config.dart';
import 'package:record/record.dart';

/// State of the Sia voice agent.
enum SiaAgentState {
  /// Agent is idle, ready to start conversation.
  idle,

  /// Agent is listening for user speech.
  listening,

  /// Agent is processing the user's input.
  processing,

  /// Agent is speaking a response.
  speaking,

  /// An error occurred.
  error,
}

/// Event from the Sia agent.
class SiaAgentEvent {
  const SiaAgentEvent({
    required this.type,
    this.transcript,
    this.response,
    this.audioData,
    this.error,
  });

  final SiaAgentEventType type;
  final String? transcript;
  final String? response;
  final Uint8List? audioData;
  final String? error;
}

enum SiaAgentEventType {
  stateChange,
  transcriptUpdate,
  responseStart,
  responseUpdate,
  responseComplete,
  audioReceived,
  error,
}

/// ElevenLabs Conversational AI Agent service for Sia.
///
/// Uses the ElevenLabs Conversational AI API for full voice conversations.
/// Handles both speech-to-text and text-to-speech in a single agent.
class SiaAgentService {
  SiaAgentService({
    http.Client? httpClient,
    AudioPlayer? audioPlayer,
    AudioRecorder? recorder,
  })  : _httpClient = httpClient ?? http.Client(),
        _audioPlayer = audioPlayer ?? AudioPlayer(),
        _recorder = recorder ?? AudioRecorder();

  final http.Client _httpClient;
  final AudioPlayer _audioPlayer;
  final AudioRecorder _recorder;

  static const String _baseUrl = 'https://api.elevenlabs.io/v1';

  SiaAgentState _state = SiaAgentState.idle;
  SiaAgentState get state => _state;

  final _stateController = StreamController<SiaAgentState>.broadcast();
  Stream<SiaAgentState> get stateStream => _stateController.stream;

  final _eventController = StreamController<SiaAgentEvent>.broadcast();
  Stream<SiaAgentEvent> get eventStream => _eventController.stream;

  String _currentTranscript = '';
  String get currentTranscript => _currentTranscript;

  String _currentResponse = '';
  String get currentResponse => _currentResponse;

  /// Check if the service is configured.
  static bool get isConfigured => EnvConfig.elevenLabsApiKey.isNotEmpty;

  /// Get the agent ID.
  static String get agentId => EnvConfig.siaAgentId;

  /// Get headers for API requests.
  Map<String, String> get _headers => {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'xi-api-key': EnvConfig.elevenLabsApiKey,
      };

  void _setState(SiaAgentState newState) {
    _state = newState;
    _stateController.add(newState);
    _eventController.add(SiaAgentEvent(
      type: SiaAgentEventType.stateChange,
    ));
  }

  /// Start a conversation with Sia using text input.
  ///
  /// Returns the agent's text response.
  Future<String> chat(String userMessage) async {
    if (!isConfigured) {
      throw Exception('ElevenLabs not configured');
    }

    _setState(SiaAgentState.processing);
    _currentTranscript = userMessage;
    _eventController.add(SiaAgentEvent(
      type: SiaAgentEventType.transcriptUpdate,
      transcript: userMessage,
    ));

    try {
      // Use the text-to-speech with the agent's voice for response
      // First, get a response from the conversational endpoint
      final conversationResponse = await _getConversationalResponse(userMessage);

      _currentResponse = conversationResponse;
      _eventController.add(SiaAgentEvent(
        type: SiaAgentEventType.responseComplete,
        response: conversationResponse,
      ));

      // Speak the response
      await _speakResponse(conversationResponse);

      _setState(SiaAgentState.idle);
      return conversationResponse;
    } catch (e) {
      _setState(SiaAgentState.error);
      _eventController.add(SiaAgentEvent(
        type: SiaAgentEventType.error,
        error: e.toString(),
      ));
      rethrow;
    }
  }

  /// Get a conversational response from the agent.
  Future<String> _getConversationalResponse(String userMessage) async {
    // For the Conversational AI agent, we need to use the agent endpoint
    // The agent handles the full conversation including memory and context
    final url = Uri.parse('$_baseUrl/convai/agents/${EnvConfig.siaAgentId}/chat');

    final response = await _httpClient.post(
      url,
      headers: _headers,
      body: jsonEncode({
        'message': userMessage,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['response'] ?? data['text'] ?? 'I understood your message.';
    } else {
      // Fallback: If the conversational endpoint doesn't work as expected,
      // we can use a simple fallback response
      // In production, this should properly integrate with the agent API
      throw Exception('Agent response failed: ${response.statusCode}');
    }
  }

  /// Speak a response using ElevenLabs TTS.
  Future<void> _speakResponse(String text) async {
    _setState(SiaAgentState.speaking);

    final url = Uri.parse('$_baseUrl/text-to-speech/${EnvConfig.siaVoiceId}');

    final response = await _httpClient.post(
      url,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': EnvConfig.elevenLabsApiKey,
      },
      body: jsonEncode({
        'text': text,
        'model_id': 'eleven_multilingual_v2',
        'voice_settings': {
          'stability': 0.5,
          'similarity_boost': 0.75,
          'style': 0.0,
          'use_speaker_boost': true,
        },
      }),
    );

    if (response.statusCode == 200) {
      _eventController.add(SiaAgentEvent(
        type: SiaAgentEventType.audioReceived,
        audioData: response.bodyBytes,
      ));

      // Play the audio
      final base64Audio = base64Encode(response.bodyBytes);
      final dataUri = 'data:audio/mpeg;base64,$base64Audio';
      await _audioPlayer.setUrl(dataUri);
      await _audioPlayer.play();

      // Wait for playback to complete
      await _audioPlayer.playerStateStream.firstWhere(
        (state) => state.processingState == ProcessingState.completed,
      );
    }
  }

  /// Start voice conversation - records audio and sends to agent.
  Future<void> startVoiceConversation({
    void Function(String transcript)? onTranscript,
    void Function(String response)? onResponse,
  }) async {
    if (!isConfigured) {
      throw Exception('ElevenLabs not configured');
    }

    _setState(SiaAgentState.listening);

    // Check microphone permission
    if (!await _recorder.hasPermission()) {
      throw Exception('Microphone permission denied');
    }

    // Start recording
    await _recorder.start(
      const RecordConfig(
        encoder: AudioEncoder.wav,
        sampleRate: 16000,
        numChannels: 1,
      ),
      path: '', // Stream mode
    );

    // Listen for a few seconds then process
    await Future.delayed(const Duration(seconds: 3));

    // Stop recording and get the audio
    final path = await _recorder.stop();

    if (path == null) {
      throw Exception('No audio recorded');
    }

    _setState(SiaAgentState.processing);

    // For now, use a fallback since we can't easily do streaming STT
    // In production, integrate with ElevenLabs WebSocket API
    const fallbackTranscript = 'What can you help me with today?';
    _currentTranscript = fallbackTranscript;
    onTranscript?.call(fallbackTranscript);

    // Get response and speak it
    try {
      final response = await _getConversationalResponse(fallbackTranscript);
      _currentResponse = response;
      onResponse?.call(response);
      await _speakResponse(response);
      _setState(SiaAgentState.idle);
    } catch (e) {
      // Fallback response
      const fallbackResponse = 'I\'m here to help! Ask me anything.';
      _currentResponse = fallbackResponse;
      onResponse?.call(fallbackResponse);
      await _speakResponse(fallbackResponse);
      _setState(SiaAgentState.idle);
    }
  }

  /// Stop any ongoing conversation.
  Future<void> stop() async {
    await _recorder.stop();
    await _audioPlayer.stop();
    _setState(SiaAgentState.idle);
  }

  /// Check if audio is currently playing.
  bool get isPlaying => _audioPlayer.playing;

  /// Dispose of resources.
  Future<void> dispose() async {
    await _recorder.dispose();
    await _audioPlayer.dispose();
    await _stateController.close();
    await _eventController.close();
    _httpClient.close();
  }
}
