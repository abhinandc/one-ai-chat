/// Environment configuration for OneEdge mobile app.
///
/// Uses the same Supabase project as the web app.
class EnvConfig {
  EnvConfig._();

  /// Supabase project URL (same as web app)
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://vzrnxiowtshzspybrxeq.supabase.co',
  );

  /// Supabase anonymous key (same as web app)
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6cm54aW93dHNoenNweWJyeGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODY0NDEsImV4cCI6MjA3NDI2MjQ0MX0.CpSZhCBJYkrCGqsqVd5Qm8TKrQBBE0l8l0hN_iMLVbc',
  );

  /// ElevenLabs API key for Sia voice assistant
  static const String elevenLabsApiKey = String.fromEnvironment(
    'ELEVENLABS_API_KEY',
    defaultValue: 'sk_d8f63af3f0bd3eda3c1361105ce73a37032628078a911cb7',
  );

  /// ElevenLabs Conversational AI Agent ID for Sia
  static const String siaAgentId = String.fromEnvironment(
    'SIA_AGENT_ID',
    defaultValue: 'agent_8701keg7xdvgfx89gk8fspx7jk5x',
  );

  /// ElevenLabs voice ID for Sia (fallback for TTS-only mode)
  static const String siaVoiceId = String.fromEnvironment(
    'SIA_VOICE_ID',
    defaultValue: 'EXAVITQu4vr4xnSDxMaL', // Default ElevenLabs voice
  );

  /// API proxy URL for AI model requests
  static const String apiProxyUrl = String.fromEnvironment(
    'API_PROXY_URL',
    defaultValue: '',
  );

  /// Check if all required environment variables are configured
  static bool get isConfigured =>
      supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;

  /// Get a debug string of the current configuration (masking sensitive values)
  static String get debugInfo => '''
EnvConfig:
  supabaseUrl: ${supabaseUrl.isEmpty ? 'NOT SET' : supabaseUrl}
  supabaseAnonKey: ${supabaseAnonKey.isEmpty ? 'NOT SET' : '***${supabaseAnonKey.substring(supabaseAnonKey.length - 4)}'}
  elevenLabsApiKey: ${elevenLabsApiKey.isEmpty ? 'NOT SET' : '***'}
  apiProxyUrl: ${apiProxyUrl.isEmpty ? 'NOT SET' : apiProxyUrl}
''';
}
