import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:oneedge_mobile/core/config/env_config.dart';

/// Supabase service for database and auth operations.
///
/// Uses the same Supabase project as the web app.
class SupabaseService {
  SupabaseService._();

  static SupabaseService? _instance;
  static SupabaseClient? _client;

  /// Get the singleton instance.
  static SupabaseService get instance {
    _instance ??= SupabaseService._();
    return _instance!;
  }

  /// Get the Supabase client.
  static SupabaseClient get client {
    if (_client == null) {
      throw StateError(
        'SupabaseService not initialized. Call SupabaseService.initialize() first.',
      );
    }
    return _client!;
  }

  /// Check if the service is initialized.
  static bool get isInitialized => _client != null;

  /// Initialize the Supabase client.
  ///
  /// Must be called before using any Supabase features.
  static Future<void> initialize() async {
    if (_client != null) return;

    if (!EnvConfig.isConfigured) {
      throw StateError(
        'Supabase environment variables not configured. '
        'Set SUPABASE_URL and SUPABASE_ANON_KEY.',
      );
    }

    await Supabase.initialize(
      url: EnvConfig.supabaseUrl,
      anonKey: EnvConfig.supabaseAnonKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
      ),
      realtimeClientOptions: const RealtimeClientOptions(
        logLevel: RealtimeLogLevel.info,
      ),
    );

    _client = Supabase.instance.client;
  }

  /// Get the current authenticated user.
  User? get currentUser => _client?.auth.currentUser;

  /// Get the current session.
  Session? get currentSession => _client?.auth.currentSession;

  /// Check if user is authenticated.
  bool get isAuthenticated => currentUser != null;

  /// Get the user's email.
  String? get userEmail => currentUser?.email;

  /// Auth state change stream.
  Stream<AuthState> get authStateChanges =>
      _client?.auth.onAuthStateChange ?? const Stream.empty();
}
