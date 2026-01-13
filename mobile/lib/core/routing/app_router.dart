import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:oneedge_mobile/core/di/providers.dart';
import 'package:oneedge_mobile/features/auth/presentation/login_screen.dart';
import 'package:oneedge_mobile/features/chat/presentation/chat_screen.dart';
import 'package:oneedge_mobile/features/chat/presentation/home_screen.dart';
import 'package:oneedge_mobile/features/profile/presentation/profile_screen.dart';
import 'package:oneedge_mobile/features/projects/presentation/projects_screen.dart';
import 'package:oneedge_mobile/features/sia/presentation/sia_screen.dart';
import 'package:oneedge_mobile/shared/widgets/app_shell.dart';

/// Route names.
abstract class Routes {
  static const String login = '/login';
  static const String home = '/';
  static const String chat = '/chat';
  static const String sia = '/sia';
  static const String projects = '/projects';
  static const String profile = '/profile';
}

/// App router provider.
final appRouterProvider = Provider<GoRouter>((ref) {
  final isAuthenticated = ref.watch(isAuthenticatedProvider);

  return GoRouter(
    initialLocation: Routes.home,
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isLoggingIn = state.matchedLocation == Routes.login;

      // If not authenticated and not on login page, redirect to login
      if (!isAuthenticated && !isLoggingIn) {
        return Routes.login;
      }

      // If authenticated and on login page, redirect to home
      if (isAuthenticated && isLoggingIn) {
        return Routes.home;
      }

      return null;
    },
    routes: [
      // Login route (no shell)
      GoRoute(
        path: Routes.login,
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),

      // App shell with bottom navigation
      ShellRoute(
        builder: (context, state, child) {
          return AppShell(child: child);
        },
        routes: [
          // Home (Chats list)
          GoRoute(
            path: Routes.home,
            name: 'home',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const HomeScreen(),
              transitionsBuilder: _fadeTransition,
            ),
          ),

          // Sia voice assistant
          GoRoute(
            path: Routes.sia,
            name: 'sia',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const SiaScreen(),
              transitionsBuilder: _fadeTransition,
            ),
          ),

          // Projects
          GoRoute(
            path: Routes.projects,
            name: 'projects',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const ProjectsScreen(),
              transitionsBuilder: _fadeTransition,
            ),
          ),

          // Profile
          GoRoute(
            path: Routes.profile,
            name: 'profile',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const ProfileScreen(),
              transitionsBuilder: _fadeTransition,
            ),
          ),
        ],
      ),

      // Chat route (outside shell for full screen)
      GoRoute(
        path: '${Routes.chat}/:id',
        name: 'chat',
        pageBuilder: (context, state) {
          final id = state.pathParameters['id'];
          return CustomTransitionPage(
            key: state.pageKey,
            child: ChatScreen(conversationId: id),
            transitionsBuilder: _slideTransition,
          );
        },
      ),

      // New chat route
      GoRoute(
        path: Routes.chat,
        name: 'newChat',
        pageBuilder: (context, state) {
          return CustomTransitionPage(
            key: state.pageKey,
            child: const ChatScreen(),
            transitionsBuilder: _slideTransition,
          );
        },
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Page not found',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              state.matchedLocation,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go(Routes.home),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
});

/// Fade transition builder.
Widget _fadeTransition(
  BuildContext context,
  Animation<double> animation,
  Animation<double> secondaryAnimation,
  Widget child,
) {
  return FadeTransition(
    opacity: CurveTween(curve: Curves.easeInOut).animate(animation),
    child: child,
  );
}

/// Slide transition builder.
Widget _slideTransition(
  BuildContext context,
  Animation<double> animation,
  Animation<double> secondaryAnimation,
  Widget child,
) {
  return SlideTransition(
    position: Tween<Offset>(
      begin: const Offset(1.0, 0.0),
      end: Offset.zero,
    ).chain(CurveTween(curve: Curves.easeInOut)).animate(animation),
    child: child,
  );
}
