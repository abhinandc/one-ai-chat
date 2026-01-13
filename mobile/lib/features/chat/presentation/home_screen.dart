import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:oneedge_mobile/core/config/app_config.dart';
import 'package:oneedge_mobile/core/di/providers.dart';
import 'package:oneedge_mobile/core/routing/app_router.dart';
import 'package:oneedge_mobile/core/theme/app_colors.dart';
import 'package:oneedge_mobile/core/theme/app_typography.dart';
import 'package:oneedge_mobile/shared/models/conversation.dart';
import 'package:oneedge_mobile/shared/widgets/conversation_tile.dart';
import 'package:oneedge_mobile/shared/widgets/search_bar.dart';
import 'package:oneedge_mobile/shared/widgets/skeleton_loader.dart';

/// Home screen showing list of conversations.
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query.toLowerCase();
    });
  }

  List<Conversation> _filterConversations(List<Conversation> conversations) {
    if (_searchQuery.isEmpty) return conversations;
    return conversations.where((c) {
      return c.title.toLowerCase().contains(_searchQuery) ||
          c.messages.any((m) => m.content.toLowerCase().contains(_searchQuery));
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = ref.watch(currentUserProvider);
    final conversationsAsync = ref.watch(conversationsProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            _buildHeader(theme, user?.displayName),

            // Search bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: AppSearchBar(
                controller: _searchController,
                hintText: 'Search conversations...',
                onChanged: _onSearchChanged,
              ),
            ),

            // Model mode selector
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: _buildModelModeSelector(theme),
            ),

            // Conversations list
            Expanded(
              child: conversationsAsync.when(
                data: (conversations) {
                  final filtered = _filterConversations(conversations);
                  return _buildConversationsList(theme, filtered);
                },
                loading: () => _buildLoadingSkeleton(),
                error: (error, stack) => _buildErrorState(theme, error),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: _buildNewChatFab(theme),
    );
  }

  Widget _buildHeader(ThemeData theme, String? userName) {
    final greeting = _getGreeting();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            greeting,
            style: AppTypography.bodyMedium.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            userName ?? 'Welcome back',
            style: AppTypography.headlineMedium.copyWith(
              color: theme.colorScheme.onSurface,
            ),
          ),
        ],
      ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.1, end: 0),
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  Widget _buildModelModeSelector(ThemeData theme) {
    final currentMode = ref.watch(modelModeProvider);

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: ModelModeType.values.map((mode) {
          final isSelected = mode == currentMode;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: _ModelModeChip(
              mode: mode,
              isSelected: isSelected,
              onTap: () {
                HapticFeedback.lightImpact();
                ref.read(modelModeProvider.notifier).state = mode;
              },
            ),
          );
        }).toList(),
      ),
    ).animate().fadeIn(duration: 400.ms, delay: 100.ms);
  }

  Widget _buildConversationsList(
    ThemeData theme,
    List<Conversation> conversations,
  ) {
    if (conversations.isEmpty) {
      return _buildEmptyState(theme);
    }

    // Group conversations by date
    final grouped = _groupConversationsByDate(conversations);

    return RefreshIndicator(
      onRefresh: () async {
        HapticFeedback.mediumImpact();
        ref.invalidate(conversationsProvider);
      },
      child: ListView.builder(
        padding: const EdgeInsets.only(top: 8, bottom: 100),
        itemCount: grouped.length,
        itemBuilder: (context, index) {
          final entry = grouped.entries.elementAt(index);
          return _buildDateSection(theme, entry.key, entry.value, index);
        },
      ),
    );
  }

  Map<String, List<Conversation>> _groupConversationsByDate(
    List<Conversation> conversations,
  ) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final lastWeek = today.subtract(const Duration(days: 7));

    final grouped = <String, List<Conversation>>{};

    for (final conversation in conversations) {
      final date = DateTime(
        conversation.updatedAt.year,
        conversation.updatedAt.month,
        conversation.updatedAt.day,
      );

      String key;
      if (date == today) {
        key = 'Today';
      } else if (date == yesterday) {
        key = 'Yesterday';
      } else if (date.isAfter(lastWeek)) {
        key = 'This Week';
      } else {
        key = DateFormat('MMMM yyyy').format(date);
      }

      grouped.putIfAbsent(key, () => []).add(conversation);
    }

    return grouped;
  }

  Widget _buildDateSection(
    ThemeData theme,
    String label,
    List<Conversation> conversations,
    int sectionIndex,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Text(
            label,
            style: AppTypography.labelMedium.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        ...conversations.asMap().entries.map((entry) {
          final index = entry.key;
          final conversation = entry.value;
          return ConversationTile(
            conversation: conversation,
            onTap: () {
              HapticFeedback.lightImpact();
              context.push('${Routes.chat}/${conversation.id}');
            },
            onDelete: () => _deleteConversation(conversation),
          )
              .animate()
              .fadeIn(
                duration: 300.ms,
                delay: Duration(milliseconds: 50 * index),
              )
              .slideX(begin: 0.1, end: 0);
        }),
      ],
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 64,
            color: theme.colorScheme.onSurfaceVariant.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No conversations yet',
            style: AppTypography.titleMedium.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Start a new chat to begin',
            style: AppTypography.bodyMedium.copyWith(
              color: theme.colorScheme.onSurfaceVariant.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => context.push(Routes.chat),
            icon: const Icon(Icons.add),
            label: const Text('New Chat'),
          ),
        ],
      ).animate().fadeIn(duration: 400.ms).scale(begin: const Offset(0.9, 0.9)),
    );
  }

  Widget _buildLoadingSkeleton() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 6,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: const SkeletonLoader(height: 72, borderRadius: 12)
              .animate()
              .fadeIn(
                duration: 300.ms,
                delay: Duration(milliseconds: 50 * index),
              ),
        );
      },
    );
  }

  Widget _buildErrorState(ThemeData theme, Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 48,
            color: AppColors.error,
          ),
          const SizedBox(height: 16),
          Text(
            'Something went wrong',
            style: AppTypography.titleMedium.copyWith(
              color: theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            error.toString(),
            style: AppTypography.bodySmall.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: () => ref.invalidate(conversationsProvider),
            icon: const Icon(Icons.refresh),
            label: const Text('Try Again'),
          ),
        ],
      ),
    );
  }

  Widget _buildNewChatFab(ThemeData theme) {
    return FloatingActionButton.extended(
      onPressed: () {
        HapticFeedback.mediumImpact();
        context.push(Routes.chat);
      },
      backgroundColor: theme.colorScheme.primary,
      foregroundColor: theme.colorScheme.onPrimary,
      icon: const Icon(Icons.add),
      label: const Text('New Chat'),
    ).animate().fadeIn(duration: 400.ms, delay: 300.ms).scale(
          begin: const Offset(0.8, 0.8),
          end: const Offset(1, 1),
        );
  }

  Future<void> _deleteConversation(Conversation conversation) async {
    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Conversation'),
        content: Text('Are you sure you want to delete "${conversation.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      // TODO: Implement delete via service
      ref.invalidate(conversationsProvider);
    }
  }
}

/// Model mode selection chip.
class _ModelModeChip extends StatelessWidget {
  const _ModelModeChip({
    required this.mode,
    required this.isSelected,
    required this.onTap,
  });

  final ModelModeType mode;
  final bool isSelected;
  final VoidCallback onTap;

  IconData get _icon {
    switch (mode) {
      case ModelModeType.thinking:
        return Icons.psychology;
      case ModelModeType.fast:
        return Icons.bolt;
      case ModelModeType.coding:
        return Icons.code;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: AppConfig.microAnimationDuration,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? theme.colorScheme.primary
              : theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(20),
          border: isSelected
              ? null
              : Border.all(color: theme.colorScheme.outline.withOpacity(0.2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _icon,
              size: 18,
              color: isSelected
                  ? theme.colorScheme.onPrimary
                  : theme.colorScheme.onSurfaceVariant,
            ),
            const SizedBox(width: 8),
            Text(
              mode.displayName,
              style: AppTypography.labelMedium.copyWith(
                color: isSelected
                    ? theme.colorScheme.onPrimary
                    : theme.colorScheme.onSurfaceVariant,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
