import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:oneedge_mobile/core/routing/app_router.dart';
import 'package:oneedge_mobile/core/theme/app_spacing.dart';

/// Main app shell with bottom navigation.
///
/// Provides a consistent navigation structure across all main screens.
/// Ensures 44pt minimum touch targets per Apple HIG.
class AppShell extends StatelessWidget {
  const AppShell({
    required this.child,
    super.key,
  });

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final currentLocation = GoRouterState.of(context).matchedLocation;

    return Scaffold(
      body: child,
      bottomNavigationBar: _buildBottomNav(context, theme, currentLocation),
    );
  }

  Widget _buildBottomNav(
    BuildContext context,
    ThemeData theme,
    String currentLocation,
  ) {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: theme.colorScheme.outline.withOpacity(0.1),
            width: 1,
          ),
        ),
      ),
      child: NavigationBar(
        height: AppSpacing.bottomNavHeight,
        selectedIndex: _getSelectedIndex(currentLocation),
        onDestinationSelected: (index) => _onItemTapped(context, index),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            selectedIcon: Icon(Icons.chat_bubble),
            label: 'Chats',
            tooltip: 'Chats',
          ),
          NavigationDestination(
            icon: Icon(Icons.graphic_eq_outlined),
            selectedIcon: Icon(Icons.graphic_eq),
            label: 'Sia',
            tooltip: 'Sia Voice Assistant',
          ),
          NavigationDestination(
            icon: Icon(Icons.folder_outlined),
            selectedIcon: Icon(Icons.folder),
            label: 'Projects',
            tooltip: 'Projects',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
            tooltip: 'Profile & Settings',
          ),
        ],
      ),
    );
  }

  int _getSelectedIndex(String location) {
    if (location.startsWith(Routes.sia)) return 1;
    if (location.startsWith(Routes.projects)) return 2;
    if (location.startsWith(Routes.profile)) return 3;
    return 0; // Home/Chats is default
  }

  void _onItemTapped(BuildContext context, int index) {
    // Haptic feedback
    HapticFeedback.lightImpact();

    switch (index) {
      case 0:
        context.go(Routes.home);
      case 1:
        context.go(Routes.sia);
      case 2:
        context.go(Routes.projects);
      case 3:
        context.go(Routes.profile);
    }
  }
}
