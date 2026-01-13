import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:oneedge_mobile/core/theme/app_colors.dart';
import 'package:oneedge_mobile/core/theme/app_typography.dart';
import 'package:oneedge_mobile/shared/models/conversation.dart';

/// Tile widget for displaying a conversation in a list.
class ConversationTile extends StatelessWidget {
  const ConversationTile({
    required this.conversation,
    required this.onTap,
    this.onDelete,
    super.key,
  });

  final Conversation conversation;
  final VoidCallback onTap;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final lastMessage = conversation.lastMessage;

    return Dismissible(
      key: Key(conversation.id),
      direction: onDelete != null
          ? DismissDirection.endToStart
          : DismissDirection.none,
      onDismissed: (_) => onDelete?.call(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: AppColors.error,
        child: const Icon(
          Icons.delete_outline,
          color: Colors.white,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Model indicator
              _buildModelIndicator(theme),
              const SizedBox(width: 12),

              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title row
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            conversation.title,
                            style: AppTypography.titleSmall.copyWith(
                              color: theme.colorScheme.onSurface,
                              fontWeight: conversation.unread
                                  ? FontWeight.w600
                                  : FontWeight.w500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (conversation.pinned)
                          Padding(
                            padding: const EdgeInsets.only(left: 4),
                            child: Icon(
                              Icons.push_pin,
                              size: 14,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),

                    // Last message preview
                    if (lastMessage != null)
                      Text(
                        lastMessage.content,
                        style: AppTypography.bodySmall.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),

                    const SizedBox(height: 8),

                    // Footer row
                    Row(
                      children: [
                        // Model name
                        if (conversation.model != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: _getModelColor(conversation.model!)
                                  .withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              _getModelDisplayName(conversation.model!),
                              style: AppTypography.labelSmall.copyWith(
                                color: _getModelColor(conversation.model!),
                                fontSize: 10,
                              ),
                            ),
                          ),

                        const Spacer(),

                        // Timestamp
                        Text(
                          _formatTimestamp(conversation.updatedAt),
                          style: AppTypography.labelSmall.copyWith(
                            color: theme.colorScheme.onSurfaceVariant
                                .withOpacity(0.6),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModelIndicator(ThemeData theme) {
    final model = conversation.model ?? 'gpt-4';
    final color = _getModelColor(model);

    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Center(
        child: Icon(
          _getModelIcon(model),
          size: 20,
          color: color,
        ),
      ),
    );
  }

  Color _getModelColor(String model) {
    if (model.contains('claude')) return AppColors.claudeBrand;
    if (model.contains('gpt')) return AppColors.gptBrand;
    if (model.contains('gemini')) return AppColors.geminiBrand;
    if (model.contains('llama')) return AppColors.llamaBrand;
    return Colors.grey;
  }

  IconData _getModelIcon(String model) {
    if (model.contains('claude')) return Icons.auto_awesome;
    if (model.contains('gpt')) return Icons.bubble_chart;
    if (model.contains('gemini')) return Icons.diamond_outlined;
    if (model.contains('llama')) return Icons.pets;
    return Icons.smart_toy;
  }

  String _getModelDisplayName(String model) {
    if (model.contains('claude-3-opus')) return 'Opus';
    if (model.contains('claude-3-sonnet')) return 'Sonnet';
    if (model.contains('claude-3-haiku')) return 'Haiku';
    if (model.contains('gpt-4o-mini')) return 'GPT-4o Mini';
    if (model.contains('gpt-4o')) return 'GPT-4o';
    if (model.contains('gpt-4')) return 'GPT-4';
    if (model.contains('gemini-pro')) return 'Gemini Pro';
    if (model.contains('gemini')) return 'Gemini';
    if (model.contains('llama')) return 'Llama';
    return model.split('/').last;
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return DateFormat('EEEE').format(timestamp);
    } else {
      return DateFormat('MMM d').format(timestamp);
    }
  }
}
