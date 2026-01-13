import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:oneedge_mobile/shared/models/user.dart' as app;
import 'package:oneedge_mobile/shared/services/supabase_service.dart';

/// Repository for authentication operations.
class AuthRepository {
  const AuthRepository();

  /// Get the Supabase auth client.
  static GoTrueClient get _auth => SupabaseService.client.auth;

  /// Get the current Supabase user.
  User? get currentSupabaseUser => _auth.currentUser;

  /// Get the current session.
  Session? get currentSession => _auth.currentSession;

  /// Check if user is authenticated.
  bool get isAuthenticated => currentSupabaseUser != null;

  /// Get the current app user.
  app.User? get currentUser {
    final supabaseUser = currentSupabaseUser;
    if (supabaseUser == null) return null;

    return app.User.fromSupabaseAuth(supabaseUser.toJson());
  }

  /// Auth state changes stream.
  Stream<AuthState> get authStateChanges => _auth.onAuthStateChange;

  /// Sign in with Google.
  ///
  /// Uses Supabase's OAuth flow with Google.
  Future<AuthResponse> signInWithGoogle() async {
    final response = await _auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: 'io.oneedge.mobile://callback',
      scopes: 'email profile',
      queryParams: {
        'access_type': 'offline',
        'prompt': 'consent',
      },
    );

    if (!response) {
      throw Exception('Google sign-in was cancelled or failed');
    }

    // Wait for the auth state to update
    final completer = await _auth.onAuthStateChange.firstWhere(
      (state) => state.event == AuthChangeEvent.signedIn,
    );

    return AuthResponse(
      session: completer.session,
      user: completer.session?.user,
    );
  }

  /// Sign in with email and password.
  Future<AuthResponse> signInWithEmail({
    required String email,
    required String password,
  }) async {
    return _auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  /// Sign up with email and password.
  Future<AuthResponse> signUpWithEmail({
    required String email,
    required String password,
    String? fullName,
  }) async {
    return _auth.signUp(
      email: email,
      password: password,
      data: fullName != null ? {'full_name': fullName} : null,
    );
  }

  /// Sign out the current user.
  Future<void> signOut() async {
    await _auth.signOut();
  }

  /// Send password reset email.
  Future<void> resetPassword(String email) async {
    await _auth.resetPasswordForEmail(email);
  }

  /// Update user profile.
  Future<UserResponse> updateProfile({
    String? email,
    String? password,
    Map<String, dynamic>? data,
  }) async {
    return _auth.updateUser(
      UserAttributes(
        email: email,
        password: password,
        data: data,
      ),
    );
  }

  /// Refresh the current session.
  Future<AuthResponse> refreshSession() async {
    return _auth.refreshSession();
  }

  /// Get the access token for API calls.
  String? get accessToken => currentSession?.accessToken;

  /// Get the refresh token.
  String? get refreshToken => currentSession?.refreshToken;
}
