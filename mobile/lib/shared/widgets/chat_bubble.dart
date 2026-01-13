import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:oneedge_mobile/core/theme/app_colors.dart';
import 'package:oneedge_mobile/core/theme/app_typography.dart';
import 'package:oneedge_mobile/shared/models/chat_message.dart';

/// Chat bubble widget for displaying messages.
///
/// Supports user and assistant messages with different styling.
class ChatBubble extends StatelessWidget {
  const ChatBubble({
    required this.message,
    this.showAvatar = true,
    this.showTimestamp = false,
    this.onLongPress,
    super.key,
  });

  final ChatMessage message;
  final bool showAvatar;
  final bool showTimestamp;
  final VoidCallback? onLongPress;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isUser = message.isUser;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser && showAvatar) ...[
            _buildAssistantAvatar(theme),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onLongPress: () {
                    HapticFeedback.mediumImpact();
                    _showMessageOptions(context);
                  },
                  child: Container(
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.75,
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: isUser
                          ? theme.colorScheme.primary
                          : theme.colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(20),
                        topRight: const Radius.circular(20),
                        bottomLeft: Radius.circular(isUser ? 20 : 4),
                        bottomRight: Radius.circular(isUser ? 4 : 20),
                      ),
                    ),
                    child: _buildMessageContent(theme, isUser),
                  ),
                ),
                if (showTimestamp || message.model != null)
                  _buildMessageMeta(theme, isUser),
              ],
            ),
          ),
          if (isUser && showAvatar) ...[
            const SizedBox(width: 8),
            _buildUserAvatar(theme),
          ],
        ],
      ),
    );
  }

  Widget _buildAssistantAvatar(ThemeData theme) {
    final modelColor = _getModelColor(message.model ?? 'assistant');

    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: modelColor.withOpacity(0.15),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Center(
        child: Icon(
          _getModelIcon(message.model ?? 'assistant'),
          size: 18,
          color: modelColor,
        ),
      ),
    );
  }

  Widget _buildUserAvatar(ThemeData theme) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.15),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Center(
        child: Icon(
          Icons.person,
          size: 18,
          color: theme.colorScheme.primary,
        ),
      ),
    );
  }

  Widget _buildMessageContent(ThemeData theme, bool isUser) {
    if (message.isStreaming) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            message.content.isEmpty ? 'Thinking...' : message.content,
            style: AppTypography.chatMessage.copyWith(
              color: isUser
                  ? theme.colorScheme.onPrimary
                  : theme.colorScheme.onSurface,
            ),
          ),
          if (message.content.isEmpty)
            const SizedBox(width: 8),
          if (message.content.isEmpty)
            _buildTypingIndicator(theme, isUser),
        ],
      );
    }

    if (message.hasError) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.error_outline,
            size: 16,
            color: AppColors.error,
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              message.error!,
              style: AppTypography.chatMessage.copyWith(
                color: AppColors.error,
              ),
            ),
          ),
        ],
      );
    }

    // Check if content contains code
    if (message.content.contains('```')) {
      return _buildMessageWithCode(theme, isUser);
    }

    return SelectableText(
      message.content,
      style: AppTypography.chatMessage.copyWith(
        color: isUser
            ? theme.colorScheme.onPrimary
            : theme.colorScheme.onSurface,
      ),
    );
  }

  Widget _buildMessageWithCode(ThemeData theme, bool isUser) {
    final parts = _parseCodeBlocks(message.content);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: parts.map((part) {
        if (part.isCode) {
          return Container(
            margin: const EdgeInsets.symmetric(vertical: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.brightness == Brightness.dark
                  ? Colors.black.withOpacity(0.3)
                  : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (part.language != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          part.language!,
                          style: AppTypography.labelSmall.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            Clipboard.setData(ClipboardData(text: part.content));
                            HapticFeedback.lightImpact();
                          },
                          child: Icon(
                            Icons.copy,
                            size: 16,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                SelectableText(
                  part.content,
                  style: AppTypography.chatCode.copyWith(
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ],
            ),
          );
        }
        return SelectableText(
          part.content,
          style: AppTypography.chatMessage.copyWith(
            color: isUser
                ? theme.colorScheme.onPrimary
                : theme.colorScheme.onSurface,
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTypingIndicator(ThemeData theme, bool isUser) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (index) {
        return Container(
          margin: const EdgeInsets.only(right: 4),
          child: Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: isUser
                  ? theme.colorScheme.onPrimary.withOpacity(0.6)
                  : theme.colorScheme.onSurface.withOpacity(0.4),
              shape: BoxShape.circle,
            ),
          )
              .animate(
                onPlay: (controller) => controller.repeat(),
              )
              .scaleXY(
                begin: 1,
                end: 0.6,
                duration: 600.ms,
                delay: Duration(milliseconds: index * 150),
              )
              .then()
              .scaleXY(
                begin: 0.6,
                end: 1,
                duration: 600.ms,
              ),
        );
      }),
    );
  }

  Widget _buildMessageMeta(ThemeData theme, bool isUser) {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (message.model != null && !isUser) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: _getModelColor(message.model!).withOpacity(0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                _getModelDisplayName(message.model!),
                style: AppTypography.labelSmall.copyWith(
                  color: _getModelColor(message.model!),
                  fontSize: 10,
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
          if (showTimestamp)
            Text(
              _formatTimestamp(message.timestamp),
              style: AppTypography.chatTimestamp.copyWith(
                color: theme.colorScheme.onSurfaceVariant.withOpacity(0.6),
              ),
            ),
          if (message.tokens != null && !isUser) ...[
            const SizedBox(width: 8),
            Text(
              '${message.tokens} tokens',
              style: AppTypography.chatTimestamp.copyWith(
                color: theme.colorScheme.onSurfaceVariant.withOpacity(0.6),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showMessageOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.copy),
                title: const Text('Copy'),
                onTap: () {
                  Clipboard.setData(ClipboardData(text: message.content));
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Copied to clipboard')),
                  );
                },
              ),
              if (message.isAssistant)
                ListTile(
                  leading: const Icon(Icons.refresh),
                  title: const Text('Regenerate'),
                  onTap: () {
                    Navigator.pop(context);
                    onLongPress?.call();
                  },
                ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
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
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}';
    } else {
      return '${timestamp.month}/${timestamp.day}';
    }
  }

  List<_MessagePart> _parseCodeBlocks(String content) {
    final parts = <_MessagePart>[];
    final codeBlockPattern = RegExp(r'```(\w*)\n?([\s\S]*?)```');

    int lastEnd = 0;
    for (final match in codeBlockPattern.allMatches(content)) {
      // Add text before code block
      if (match.start > lastEnd) {
        final text = content.substring(lastEnd, match.start).trim();
        if (text.isNotEmpty) {
          parts.add(_MessagePart(content: text, isCode: false));
        }
      }

      // Add code block
      final language = match.group(1)?.isNotEmpty == true ? match.group(1) : null;
      final code = match.group(2)?.trim() ?? '';
      if (code.isNotEmpty) {
        parts.add(_MessagePart(content: code, isCode: true, language: language));
      }

      lastEnd = match.end;
    }

    // Add remaining text
    if (lastEnd < content.length) {
      final text = content.substring(lastEnd).trim();
      if (text.isNotEmpty) {
        parts.add(_MessagePart(content: text, isCode: false));
      }
    }

    return parts.isEmpty ? [_MessagePart(content: content, isCode: false)] : parts;
  }
}

class _MessagePart {
  const _MessagePart({
    required this.content,
    required this.isCode,
    this.language,
  });

  final String content;
  final bool isCode;
  final String? language;
}
