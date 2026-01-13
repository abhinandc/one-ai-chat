import 'dart:async';

import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart';

/// Speech recognition status.
enum SpeechStatus {
  /// Not initialized yet.
  notInitialized,

  /// Available and ready to use.
  available,

  /// Currently listening for speech.
  listening,

  /// Speech recognition is not available on this device.
  unavailable,

  /// An error occurred.
  error,
}

/// Speech recognition service for voice input.
///
/// Uses device's native speech recognition (Google/Apple).
/// No API key required - works offline/online via OS.
class SpeechService {
  SpeechService({SpeechToText? speechToText})
      : _speechToText = speechToText ?? SpeechToText();

  final SpeechToText _speechToText;

  /// Current status of the speech service.
  SpeechStatus _status = SpeechStatus.notInitialized;
  SpeechStatus get status => _status;

  /// Controller for status changes.
  final _statusController = StreamController<SpeechStatus>.broadcast();
  Stream<SpeechStatus> get statusStream => _statusController.stream;

  /// Controller for recognized words (partial and final).
  final _wordsController = StreamController<String>.broadcast();
  Stream<String> get wordsStream => _wordsController.stream;

  /// Current recognized text.
  String _recognizedText = '';
  String get recognizedText => _recognizedText;

  /// Last error message.
  String? _lastError;
  String? get lastError => _lastError;

  /// Whether speech recognition is available.
  bool get isAvailable => _status == SpeechStatus.available;

  /// Whether currently listening.
  bool get isListening => _status == SpeechStatus.listening;

  /// Initialize the speech recognition service.
  ///
  /// Returns true if speech recognition is available on this device.
  Future<bool> initialize() async {
    if (_status != SpeechStatus.notInitialized &&
        _status != SpeechStatus.error) {
      return _status == SpeechStatus.available;
    }

    try {
      final available = await _speechToText.initialize(
        onStatus: _onStatus,
        onError: _onError,
      );

      _status =
          available ? SpeechStatus.available : SpeechStatus.unavailable;
      _statusController.add(_status);

      return available;
    } catch (e) {
      _status = SpeechStatus.error;
      _lastError = e.toString();
      _statusController.add(_status);
      return false;
    }
  }

  /// Start listening for speech.
  ///
  /// [onResult] is called with each recognition result (partial and final).
  /// [localeId] specifies the language (e.g., 'en_US', 'es_ES').
  /// [listenFor] is the maximum duration to listen (default: 30 seconds).
  Future<void> startListening({
    void Function(String text, bool isFinal)? onResult,
    String? localeId,
    Duration listenFor = const Duration(seconds: 30),
  }) async {
    if (_status == SpeechStatus.notInitialized) {
      final available = await initialize();
      if (!available) {
        throw Exception('Speech recognition not available');
      }
    }

    if (_status != SpeechStatus.available) {
      throw Exception('Speech recognition not ready: $_status');
    }

    _recognizedText = '';
    _status = SpeechStatus.listening;
    _statusController.add(_status);

    await _speechToText.listen(
      onResult: (result) => _handleResult(result, onResult),
      localeId: localeId,
      listenFor: listenFor,
      pauseFor: const Duration(seconds: 3),
      partialResults: true,
      cancelOnError: true,
      listenMode: ListenMode.dictation,
    );
  }

  /// Stop listening for speech.
  Future<void> stopListening() async {
    await _speechToText.stop();
    _status = SpeechStatus.available;
    _statusController.add(_status);
  }

  /// Cancel the current listening session.
  Future<void> cancel() async {
    await _speechToText.cancel();
    _recognizedText = '';
    _status = SpeechStatus.available;
    _statusController.add(_status);
  }

  /// Get available locales for speech recognition.
  Future<List<LocaleName>> getLocales() async {
    if (_status == SpeechStatus.notInitialized) {
      await initialize();
    }
    return _speechToText.locales();
  }

  void _handleResult(
    SpeechRecognitionResult result,
    void Function(String text, bool isFinal)? onResult,
  ) {
    _recognizedText = result.recognizedWords;
    _wordsController.add(_recognizedText);

    onResult?.call(result.recognizedWords, result.finalResult);

    if (result.finalResult) {
      _status = SpeechStatus.available;
      _statusController.add(_status);
    }
  }

  void _onStatus(String status) {
    if (status == 'listening') {
      _status = SpeechStatus.listening;
    } else if (status == 'notListening') {
      _status = SpeechStatus.available;
    } else if (status == 'done') {
      _status = SpeechStatus.available;
    }
    _statusController.add(_status);
  }

  void _onError(dynamic error) {
    _lastError = error.toString();
    _status = SpeechStatus.error;
    _statusController.add(_status);

    // Auto-recover to available state after error
    Future.delayed(const Duration(milliseconds: 500), () {
      if (_status == SpeechStatus.error) {
        _status = SpeechStatus.available;
        _statusController.add(_status);
      }
    });
  }

  /// Dispose of resources.
  Future<void> dispose() async {
    await _speechToText.stop();
    await _statusController.close();
    await _wordsController.close();
  }
}
