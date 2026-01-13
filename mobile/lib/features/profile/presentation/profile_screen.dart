import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:oneedge_mobile/core/config/app_config.dart';
import 'package:oneedge_mobile/core/di/providers.dart';
import 'package:oneedge_mobile/core/routing/app_router.dart';
import 'package:oneedge_mobile/core/theme/app_colors.dart';
import 'package:oneedge_mobile/core/theme/app_spacing.dart';
import 'package:oneedge_mobile/core/theme/app_typography.dart';

/// Profile and settings screen.
class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = ref.watch(currentUserProvider);
    final themeMode = ref.watch(themeModeProvider);

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          children: [
            // Header
            _buildHeader(theme, user)
                .animate()
                .fadeIn(duration: 400.ms)
                .slideY(begin: -0.1, end: 0),

            const SizedBox(height: 24),

            // User profile section
            _buildProfileSection(theme, user),

            const SizedBox(height: 24),

            // Appearance section
            _buildAppearanceSection(theme, themeMode),

            const SizedBox(height: 24),

            // AI preferences section
            _buildAIPreferencesSection(theme),

            const SizedBox(height: 24),

            // Help & support section
            _buildHelpSection(theme),

            const SizedBox(height: 24),

            // Sign out button
            _buildSignOutButton(theme),

            const SizedBox(height: 32),

            // Version info
            _buildVersionInfo(theme),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(ThemeData theme, user) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Profile',
            style: AppTypography.headlineMedium.copyWith(
              color: theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Manage your account and preferences',
            style: AppTypography.bodyMedium.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileSection(ThemeData theme, user) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.colorScheme.outline.withOpacity(0.1),
        ),
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: user?.avatarUrl != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.network(
                      user!.avatarUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _buildAvatarPlaceholder(theme, user),
                    ),
                  )
                : _buildAvatarPlaceholder(theme, user),
          ),
          const SizedBox(width: 16),

          // User info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user?.displayName ?? 'User',
                  style: AppTypography.titleMedium.copyWith(
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user?.email ?? '',
                  style: AppTypography.bodySmall.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),

          // Edit button
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () {
              HapticFeedback.lightImpact();
              // TODO: Edit profile
            },
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms, delay: 100.ms);
  }

  Widget _buildAvatarPlaceholder(ThemeData theme, user) {
    return Center(
      child: Text(
        user?.initials ?? 'U',
        style: AppTypography.headlineSmall.copyWith(
          color: theme.colorScheme.primary,
        ),
      ),
    );
  }

  Widget _buildAppearanceSection(
    ThemeData theme,
    AppThemeMode themeMode,
  ) {
    return _SettingsSection(
      title: 'Appearance',
      children: [
        // Theme mode
        _SettingsTile(
          icon: Icons.brightness_6_outlined,
          title: 'Theme',
          subtitle: _getThemeModeLabel(themeMode),
          onTap: () => _showThemeModePicker(context, themeMode),
        ),

        // Color scheme info (OKLCH-based from hardUIrules.md)
        _SettingsTile(
          icon: Icons.palette_outlined,
          title: 'Color Scheme',
          subtitle: 'OneEdge Design System',
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _ColorDot(
                color: theme.colorScheme.primary,
              ),
              const SizedBox(width: 8),
              Icon(
                Icons.check_circle,
                size: 18,
                color: theme.colorScheme.primary,
              ),
            ],
          ),
          onTap: () {
            HapticFeedback.lightImpact();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Using OneEdge design system colors'),
                duration: Duration(seconds: 2),
              ),
            );
          },
        ),
      ],
    ).animate().fadeIn(duration: 400.ms, delay: 200.ms);
  }

  String _getThemeModeLabel(AppThemeMode mode) {
    switch (mode) {
      case AppThemeMode.light:
        return 'Light';
      case AppThemeMode.dark:
        return 'Dark';
      case AppThemeMode.system:
        return 'System';
    }
  }

  Widget _buildAIPreferencesSection(ThemeData theme) {
    final modelMode = ref.watch(modelModeProvider);

    return _SettingsSection(
      title: 'AI Preferences',
      children: [
        _SettingsTile(
          icon: Icons.smart_toy_outlined,
          title: 'Default Mode',
          subtitle: modelMode.displayName,
          onTap: () => _showModelModePicker(context, modelMode),
        ),
        _SettingsTile(
          icon: Icons.record_voice_over_outlined,
          title: 'Sia Voice',
          subtitle: 'Default voice',
          onTap: () {
            HapticFeedback.lightImpact();
            // TODO: Voice picker
          },
        ),
        _SettingsTile(
          icon: Icons.history_outlined,
          title: 'Sia Memory',
          subtitle: 'Manage persistent memory',
          onTap: () {
            HapticFeedback.lightImpact();
            // TODO: Memory management
          },
        ),
      ],
    ).animate().fadeIn(duration: 400.ms, delay: 300.ms);
  }

  Widget _buildHelpSection(ThemeData theme) {
    return _SettingsSection(
      title: 'Help & Support',
      children: [
        _SettingsTile(
          icon: Icons.help_outline,
          title: 'Help Center',
          onTap: () {
            HapticFeedback.lightImpact();
            // TODO: Open help center
          },
        ),
        _SettingsTile(
          icon: Icons.feedback_outlined,
          title: 'Send Feedback',
          onTap: () {
            HapticFeedback.lightImpact();
            // TODO: Open feedback form
          },
        ),
        _SettingsTile(
          icon: Icons.description_outlined,
          title: 'Terms of Service',
          onTap: () {
            HapticFeedback.lightImpact();
            // TODO: Open terms
          },
        ),
        _SettingsTile(
          icon: Icons.privacy_tip_outlined,
          title: 'Privacy Policy',
          onTap: () {
            HapticFeedback.lightImpact();
            // TODO: Open privacy policy
          },
        ),
      ],
    ).animate().fadeIn(duration: 400.ms, delay: 400.ms);
  }

  Widget _buildSignOutButton(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: OutlinedButton.icon(
        onPressed: () => _showSignOutConfirmation(context),
        icon: const Icon(Icons.logout),
        label: const Text('Sign Out'),
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.error,
          side: BorderSide(color: AppColors.error.withOpacity(0.5)),
          minimumSize: const Size(double.infinity, 48),
        ),
      ),
    ).animate().fadeIn(duration: 400.ms, delay: 500.ms);
  }

  Widget _buildVersionInfo(ThemeData theme) {
    return Center(
      child: Text(
        '${AppConfig.appName} v${AppConfig.version} (${AppConfig.buildNumber})',
        style: AppTypography.bodySmall.copyWith(
          color: theme.colorScheme.onSurfaceVariant.withOpacity(0.5),
        ),
      ),
    ).animate().fadeIn(duration: 400.ms, delay: 600.ms);
  }

  void _showThemeModePicker(BuildContext context, AppThemeMode currentMode) {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'Theme',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              const Divider(height: 1),
              ...AppThemeMode.values.map((mode) {
                final isSelected = mode == currentMode;
                return ListTile(
                  leading: Icon(_getThemeModeIcon(mode)),
                  title: Text(_getThemeModeLabel(mode)),
                  trailing:
                      isSelected ? const Icon(Icons.check) : null,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    ref.read(themeModeProvider.notifier).state = mode;
                    Navigator.pop(context);
                  },
                );
              }),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  IconData _getThemeModeIcon(AppThemeMode mode) {
    switch (mode) {
      case AppThemeMode.light:
        return Icons.light_mode_outlined;
      case AppThemeMode.dark:
        return Icons.dark_mode_outlined;
      case AppThemeMode.system:
        return Icons.settings_brightness_outlined;
    }
  }

  void _showModelModePicker(BuildContext context, ModelModeType currentMode) {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'Default Mode',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              const Divider(height: 1),
              ...ModelModeType.values.map((mode) {
                final isSelected = mode == currentMode;
                return ListTile(
                  leading: Icon(_getModelModeIcon(mode)),
                  title: Text(mode.displayName),
                  subtitle: Text(mode.description),
                  trailing: isSelected ? const Icon(Icons.check) : null,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    ref.read(modelModeProvider.notifier).state = mode;
                    Navigator.pop(context);
                  },
                );
              }),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  IconData _getModelModeIcon(ModelModeType mode) {
    switch (mode) {
      case ModelModeType.thinking:
        return Icons.psychology;
      case ModelModeType.fast:
        return Icons.bolt;
      case ModelModeType.coding:
        return Icons.code;
    }
  }

  void _showSignOutConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(authRepositoryProvider).signOut();
              if (mounted) {
                context.go(Routes.login);
              }
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }
}

/// Settings section widget.
class _SettingsSection extends StatelessWidget {
  const _SettingsSection({
    required this.title,
    required this.children,
  });

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            title,
            style: AppTypography.labelMedium.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: theme.colorScheme.outline.withOpacity(0.1),
            ),
          ),
          child: Column(
            children: children.asMap().entries.map((entry) {
              final index = entry.key;
              final child = entry.value;
              return Column(
                children: [
                  if (index > 0)
                    Divider(
                      height: 1,
                      indent: 56,
                      color: theme.colorScheme.outline.withOpacity(0.1),
                    ),
                  child,
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

/// Settings tile widget.
///
/// Ensures 44pt minimum touch target per Apple HIG.
class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          minHeight: AppSpacing.minTouchTarget,
        ),
        child: Padding(
          padding: AppSpacing.listTilePadding,
          child: Row(
            children: [
              Icon(
                icon,
                size: AppSpacing.iconMd,
                color: theme.colorScheme.onSurfaceVariant,
              ),
              AppSpacing.gapH16,
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: AppTypography.bodyMedium.copyWith(
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    if (subtitle != null)
                      Text(
                        subtitle!,
                        style: AppTypography.bodySmall.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                  ],
                ),
              ),
              trailing ??
                  Icon(
                    Icons.chevron_right,
                    color: theme.colorScheme.onSurfaceVariant.withOpacity(0.5),
                  ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Color dot widget.
class _ColorDot extends StatelessWidget {
  const _ColorDot({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.3),
            blurRadius: 4,
            spreadRadius: 1,
          ),
        ],
      ),
    );
  }
}
