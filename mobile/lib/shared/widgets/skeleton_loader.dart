import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

/// Skeleton loading placeholder widget.
///
/// Used for elegant loading states per constitution guidelines.
class SkeletonLoader extends StatelessWidget {
  const SkeletonLoader({
    this.width,
    this.height = 16,
    this.borderRadius = 4,
    super.key,
  });

  /// Creates a circular skeleton (for avatars).
  const SkeletonLoader.circle({
    required double size,
    super.key,
  })  : width = size,
        height = size,
        borderRadius = 9999;

  /// Creates a text line skeleton.
  const SkeletonLoader.text({
    this.width,
    super.key,
  })  : height = 14,
        borderRadius = 4;

  /// Creates a title skeleton.
  const SkeletonLoader.title({
    this.width,
    super.key,
  })  : height = 20,
        borderRadius = 4;

  final double? width;
  final double height;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Shimmer.fromColors(
      baseColor: isDark
          ? theme.colorScheme.surfaceContainerHighest
          : theme.colorScheme.surfaceContainerHighest.withOpacity(0.5),
      highlightColor: isDark
          ? theme.colorScheme.surface
          : theme.colorScheme.surface.withOpacity(0.8),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

/// Skeleton for a conversation tile.
class ConversationTileSkeleton extends StatelessWidget {
  const ConversationTileSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SkeletonLoader(
            width: 40,
            height: 40,
            borderRadius: 10,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SkeletonLoader.title(width: 150),
                const SizedBox(height: 8),
                const SkeletonLoader.text(),
                const SizedBox(height: 4),
                SkeletonLoader.text(
                  width: MediaQuery.of(context).size.width * 0.5,
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    SkeletonLoader(width: 50, height: 16, borderRadius: 4),
                    SkeletonLoader(width: 40, height: 12),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Skeleton for chat messages.
class ChatMessageSkeleton extends StatelessWidget {
  const ChatMessageSkeleton({
    this.isUser = false,
    super.key,
  });

  final bool isUser;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            const SkeletonLoader.circle(size: 32),
            const SizedBox(width: 8),
          ],
          SkeletonLoader(
            width: width * (isUser ? 0.6 : 0.7),
            height: 60,
            borderRadius: 16,
          ),
        ],
      ),
    );
  }
}
