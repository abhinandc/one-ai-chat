import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:oneedge_mobile/core/config/app_config.dart';
import 'package:oneedge_mobile/core/di/providers.dart';
import 'package:oneedge_mobile/core/theme/app_spacing.dart';
import 'package:oneedge_mobile/core/theme/app_typography.dart';
import 'package:oneedge_mobile/shared/models/chat_message.dart';
import 'package:oneedge_mobile/shared/models/conversation.dart';
import 'package:oneedge_mobile/shared/services/ai_service.dart';
import 'package:oneedge_mobile/shared/widgets/skeleton_loader.dart';
import 'package:uuid/uuid.dart';

/// Chat screen for viewing and sending messages.
class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({
    this.conversationId,
    super.key,
  });

  final String? conversationId;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final _focusNode = FocusNode();

  List<ChatMessage> _messages = [];
  bool _isLoading = false;
  bool _isSending = false;
  StreamSubscription<String>? _streamSubscription;
  String _streamingContent = '';

  @override
  void initState() {
    super.initState();
    _loadConversation();
  }

  @override
  void dispose() {
    _streamSubscription?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _loadConversation() async {
    if (widget.conversationId == null) return;

    setState(() => _isLoading = true);

    try {
      final conversation =
          await ref.read(conversationProvider(widget.conversationId!).future);
      if (conversation != null && mounted) {
        setState(() {
          _messages = conversation.messages;
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty || _isSending) return;

    HapticFeedback.lightImpact();

    final userMessage = ChatMessage.user(
      id: const Uuid().v4(),
      content: content,
    );

    final currentMode = ref.read(modelModeProvider);

    setState(() {
      _messages = [..._messages, userMessage];
      _isSending = true;
      _streamingContent = '';
    });

    _messageController.clear();
    _scrollToBottom();

    final aiService = ref.read(aiServiceProvider);
    final assistantId = const Uuid().v4();

    // Check if AI service is configured
    if (!AIService.isConfigured) {
      // Fallback to simulated response
      await Future.delayed(const Duration(milliseconds: 500));

      final assistantMessage = ChatMessage.assistant(
        id: assistantId,
        content: 'AI service not configured. Please set API_PROXY_URL environment variable to connect to the AI API.',
        model: currentMode.model,
      );

      if (mounted) {
        setState(() {
          _messages = [..._messages, assistantMessage];
          _isSending = false;
        });
        _scrollToBottom();
      }
      return;
    }

    // Stream AI response
    try {
      final stream = aiService.streamChatCompletion(
        model: currentMode.model,
        messages: _messages,
        temperature: currentMode.temperature,
      );

      _streamSubscription = stream.listen(
        (chunk) {
          if (mounted) {
            setState(() {
              _streamingContent += chunk;
            });
            _scrollToBottom();
          }
        },
        onDone: () {
          if (mounted) {
            final assistantMessage = ChatMessage.assistant(
              id: assistantId,
              content: _streamingContent,
              model: currentMode.model,
            );

            setState(() {
              _messages = [..._messages, assistantMessage];
              _isSending = false;
              _streamingContent = '';
            });

            // Save conversation to Supabase
            _saveConversation();
          }
        },
        onError: (error) {
          if (mounted) {
            final assistantMessage = ChatMessage.assistant(
              id: assistantId,
              content: 'Error: $error',
              model: currentMode.model,
              error: error.toString(),
            );

            setState(() {
              _messages = [..._messages, assistantMessage];
              _isSending = false;
              _streamingContent = '';
            });
          }
        },
      );
    } catch (e) {
      if (mounted) {
        final assistantMessage = ChatMessage.assistant(
          id: assistantId,
          content: 'Error: $e',
          model: currentMode.model,
          error: e.toString(),
        );

        setState(() {
          _messages = [..._messages, assistantMessage];
          _isSending = false;
        });
      }
    }
  }

  Future<void> _saveConversation() async {
    final user = ref.read(currentUserProvider);
    if (user == null || _messages.isEmpty) return;

    try {
      final service = ref.read(conversationServiceProvider);

      if (widget.conversationId != null) {
        // Update existing conversation
        await service.updateConversation(
          id: widget.conversationId!,
          userEmail: user.email,
          messages: _messages,
        );
      } else {
        // Create new conversation
        final title = _generateTitle();
        await service.createConversation(
          userEmail: user.email,
          title: title,
          messages: _messages,
          settings: {
            'model': ref.read(modelModeProvider).model,
          },
        );
      }

      // Invalidate conversations list to refresh
      ref.invalidate(conversationsProvider);
    } catch (e) {
      // Silently fail - we don't want to interrupt the user
      debugPrint('Error saving conversation: $e');
    }
  }

  String _generateTitle() {
    // Generate title from first user message
    final firstUserMessage = _messages.firstWhere(
      (m) => m.isUser,
      orElse: () => ChatMessage.user(id: '', content: 'New Chat'),
    );

    final content = firstUserMessage.content;
    if (content.length <= 40) return content;
    return '${content.substring(0, 40)}...';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final currentMode = ref.watch(modelModeProvider);

    return Scaffold(
      appBar: _buildAppBar(theme, currentMode),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: _isLoading
                ? _buildLoadingState()
                : _messages.isEmpty
                    ? _buildEmptyState(theme)
                    : _buildMessagesList(theme),
          ),

          // Input area
          _buildInputArea(theme),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(ThemeData theme, ModelModeType currentMode) {
    return AppBar(
      leading: IconButton(
        icon: const Icon(Icons.arrow_back),
        onPressed: () {
          HapticFeedback.lightImpact();
          context.pop();
        },
      ),
      title: _buildModelSelector(theme, currentMode),
      actions: [
        IconButton(
          icon: const Icon(Icons.more_vert),
          onPressed: () {
            HapticFeedback.lightImpact();
            _showOptionsMenu(context);
          },
        ),
      ],
    );
  }

  Widget _buildModelSelector(ThemeData theme, ModelModeType currentMode) {
    return GestureDetector(
      onTap: () => _showModelPicker(context),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _getModeIcon(currentMode),
            size: 18,
            color: theme.colorScheme.primary,
          ),
          const SizedBox(width: 8),
          Text(
            currentMode.displayName,
            style: AppTypography.titleMedium.copyWith(
              color: theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(width: 4),
          Icon(
            Icons.keyboard_arrow_down,
            size: 20,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ],
      ),
    );
  }

  IconData _getModeIcon(ModelModeType mode) {
    switch (mode) {
      case ModelModeType.thinking:
        return Icons.psychology;
      case ModelModeType.fast:
        return Icons.bolt;
      case ModelModeType.coding:
        return Icons.code;
    }
  }

  Widget _buildLoadingState() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 4,
      itemBuilder: (context, index) {
        return ChatMessageSkeleton(isUser: index.isOdd);
      },
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    final currentMode = ref.watch(modelModeProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 60),
          // Logo/Icon
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  theme.colorScheme.primary,
                  theme.colorScheme.primary.withOpacity(0.7),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: theme.colorScheme.primary.withOpacity(0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Icon(
              Icons.auto_awesome,
              size: 36,
              color: theme.colorScheme.onPrimary,
            ),
          ).animate().fadeIn(duration: 400.ms).scale(
                begin: const Offset(0.8, 0.8),
                end: const Offset(1, 1),
                curve: Curves.easeOutBack,
              ),

          const SizedBox(height: 24),

          Text(
            'How can I help you today?',
            style: AppTypography.headlineSmall.copyWith(
              color: theme.colorScheme.onSurface,
              fontWeight: FontWeight.w600,
            ),
          ).animate().fadeIn(duration: 400.ms, delay: 100.ms),

          const SizedBox(height: 8),

          Text(
            'Using ${currentMode.displayName} mode',
            style: AppTypography.bodyMedium.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ).animate().fadeIn(duration: 400.ms, delay: 150.ms),

          const SizedBox(height: 32),

          // Suggested prompts
          ..._buildSuggestedPrompts(theme),
        ],
      ),
    );
  }

  List<Widget> _buildSuggestedPrompts(ThemeData theme) {
    final prompts = [
      (
        icon: Icons.lightbulb_outline,
        title: 'Brainstorm ideas',
        prompt: 'Help me brainstorm creative ideas for',
      ),
      (
        icon: Icons.code,
        title: 'Write code',
        prompt: 'Write a function that',
      ),
      (
        icon: Icons.edit_note,
        title: 'Draft content',
        prompt: 'Help me write a professional email about',
      ),
      (
        icon: Icons.psychology,
        title: 'Explain a concept',
        prompt: 'Explain to me how',
      ),
    ];

    return prompts.asMap().entries.map((entry) {
      final index = entry.key;
      final item = entry.value;

      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            _messageController.text = item.prompt;
            _focusNode.requestFocus();
          },
          borderRadius: BorderRadius.circular(12),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: theme.colorScheme.outline.withOpacity(0.2),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    item.icon,
                    size: 20,
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        style: AppTypography.labelLarge.copyWith(
                          color: theme.colorScheme.onSurface,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item.prompt,
                        style: AppTypography.bodySmall.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  size: 14,
                  color: theme.colorScheme.onSurfaceVariant.withOpacity(0.5),
                ),
              ],
            ),
          ),
        ),
      ).animate().fadeIn(
            duration: 300.ms,
            delay: Duration(milliseconds: 200 + (index * 50)),
          ).slideY(
            begin: 0.1,
            end: 0,
            duration: 300.ms,
            delay: Duration(milliseconds: 200 + (index * 50)),
          );
    }).toList();
  }

  Widget _buildMessagesList(ThemeData theme) {
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _messages.length + (_isSending ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == _messages.length && _isSending) {
          // Show streaming content or typing indicator
          if (_streamingContent.isNotEmpty) {
            return _buildStreamingMessage(theme);
          }
          return _buildTypingIndicator(theme);
        }

        final message = _messages[index];
        return _MessageBubble(
          message: message,
          showAvatar: !message.isUser,
        ).animate().fadeIn(duration: 200.ms).slideY(begin: 0.1, end: 0);
      },
    );
  }

  Widget _buildStreamingMessage(ThemeData theme) {
    final currentMode = ref.read(modelModeProvider);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Icon(
                Icons.auto_awesome,
                size: 16,
                color: theme.colorScheme.primary,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                  bottomLeft: Radius.circular(4),
                  bottomRight: Radius.circular(16),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _streamingContent,
                    style: AppTypography.chatMessage.copyWith(
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: theme.colorScheme.primary,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        currentMode.model,
                        style: AppTypography.labelSmall.copyWith(
                          color: theme.colorScheme.onSurfaceVariant.withOpacity(0.6),
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingIndicator(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Icon(
                Icons.auto_awesome,
                size: 16,
                color: theme.colorScheme.primary,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDot(theme, 0),
                const SizedBox(width: 4),
                _buildDot(theme, 1),
                const SizedBox(width: 4),
                _buildDot(theme, 2),
              ],
            ),
          ),
        ],
      ),
    ).animate(onPlay: (controller) => controller.repeat()).shimmer(
          duration: 1200.ms,
          color: theme.colorScheme.primary.withOpacity(0.3),
        );
  }

  Widget _buildDot(ThemeData theme, int index) {
    return Container(
      width: 6,
      height: 6,
      decoration: BoxDecoration(
        color: theme.colorScheme.onSurfaceVariant.withOpacity(0.5),
        shape: BoxShape.circle,
      ),
    )
        .animate(
          onPlay: (controller) => controller.repeat(),
          delay: Duration(milliseconds: index * 200),
        )
        .scale(
          begin: const Offset(1, 1),
          end: const Offset(1.3, 1.3),
          duration: 600.ms,
        )
        .then()
        .scale(
          begin: const Offset(1.3, 1.3),
          end: const Offset(1, 1),
          duration: 600.ms,
        );
  }

  Widget _buildInputArea(ThemeData theme) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.sm,
        AppSpacing.sm,
        AppSpacing.sm,
        MediaQuery.of(context).padding.bottom + AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border(
          top: BorderSide(
            color: theme.colorScheme.outline.withOpacity(0.1),
            width: 1,
          ),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Attachment button - 44pt minimum touch target
          SizedBox(
            width: AppSpacing.minTouchTarget,
            height: AppSpacing.minTouchTarget,
            child: IconButton(
              icon: const Icon(Icons.add_circle_outline),
              onPressed: () {
                HapticFeedback.lightImpact();
                // TODO: Implement attachments
              },
              color: theme.colorScheme.onSurfaceVariant,
              tooltip: 'Add attachment',
            ),
          ),

          // Text input
          Expanded(
            child: Container(
              constraints: BoxConstraints(
                maxHeight: 120,
                minHeight: AppSpacing.inputHeight,
              ),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(AppSpacing.radiusXxl),
              ),
              child: TextField(
                controller: _messageController,
                focusNode: _focusNode,
                maxLines: null,
                textInputAction: TextInputAction.newline,
                style: AppTypography.bodyMedium.copyWith(
                  color: theme.colorScheme.onSurface,
                ),
                decoration: InputDecoration(
                  hintText: 'Message...',
                  hintStyle: AppTypography.bodyMedium.copyWith(
                    color: theme.colorScheme.onSurfaceVariant.withOpacity(0.6),
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 12,
                  ),
                ),
                onChanged: (_) => setState(() {}),
              ),
            ),
          ),

          AppSpacing.gapH8,

          // Send/Stop/Mic button - 44pt minimum touch target
          AnimatedContainer(
            duration: AppConfig.microAnimationDuration,
            width: AppSpacing.minTouchTarget,
            height: AppSpacing.minTouchTarget,
            child: _isSending
                ? IconButton(
                    icon: Icon(
                      Icons.stop_rounded,
                      size: AppSpacing.iconMd,
                    ),
                    onPressed: _stopGeneration,
                    style: IconButton.styleFrom(
                      backgroundColor: theme.colorScheme.error,
                      foregroundColor: theme.colorScheme.onError,
                    ),
                    tooltip: 'Stop generating',
                  )
                : IconButton(
                    icon: Icon(
                      _messageController.text.trim().isEmpty
                          ? Icons.mic
                          : Icons.send,
                      size: AppSpacing.iconMd,
                    ),
                    onPressed: _messageController.text.trim().isEmpty
                        ? () {
                            HapticFeedback.lightImpact();
                            // TODO: Implement voice input
                          }
                        : _sendMessage,
                    style: IconButton.styleFrom(
                      backgroundColor: theme.colorScheme.primary,
                      foregroundColor: theme.colorScheme.onPrimary,
                    ),
                    tooltip: _messageController.text.trim().isEmpty
                        ? 'Voice input'
                        : 'Send message',
                  ),
          ),
        ],
      ),
    );
  }

  void _stopGeneration() {
    HapticFeedback.mediumImpact();
    _streamSubscription?.cancel();

    if (_streamingContent.isNotEmpty && mounted) {
      final currentMode = ref.read(modelModeProvider);
      final assistantMessage = ChatMessage.assistant(
        id: const Uuid().v4(),
        content: '$_streamingContent\n\n[Generation stopped]',
        model: currentMode.model,
      );

      setState(() {
        _messages = [..._messages, assistantMessage];
        _isSending = false;
        _streamingContent = '';
      });

      _saveConversation();
    } else if (mounted) {
      setState(() {
        _isSending = false;
        _streamingContent = '';
      });
    }
  }

  void _showModelPicker(BuildContext context) {
    final theme = Theme.of(context);

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
                  'Select Mode',
                  style: AppTypography.titleMedium.copyWith(
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ),
              const Divider(height: 1),
              ...ModelModeType.values.map((mode) {
                final isSelected = ref.read(modelModeProvider) == mode;
                return ListTile(
                  leading: Icon(
                    _getModeIcon(mode),
                    color: isSelected
                        ? theme.colorScheme.primary
                        : theme.colorScheme.onSurfaceVariant,
                  ),
                  title: Text(mode.displayName),
                  subtitle: Text(mode.description),
                  trailing: isSelected
                      ? Icon(Icons.check, color: theme.colorScheme.primary)
                      : null,
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

  void _showOptionsMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.folder_outlined),
                title: const Text('Move to Project'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Implement move to project
                },
              ),
              ListTile(
                leading: const Icon(Icons.share_outlined),
                title: const Text('Share'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Implement share
                },
              ),
              ListTile(
                leading: const Icon(Icons.push_pin_outlined),
                title: const Text('Pin Conversation'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Implement pin
                },
              ),
              ListTile(
                leading: const Icon(Icons.delete_outline),
                title: const Text('Delete'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Implement delete
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }
}

/// Chat message bubble widget.
class _MessageBubble extends StatelessWidget {
  const _MessageBubble({
    required this.message,
    this.showAvatar = true,
  });

  final ChatMessage message;
  final bool showAvatar;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isUser = message.isUser;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser && showAvatar) ...[
            _buildAvatar(theme),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isUser
                    ? theme.colorScheme.primary
                    : theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    message.content,
                    style: AppTypography.chatMessage.copyWith(
                      color: isUser
                          ? theme.colorScheme.onPrimary
                          : theme.colorScheme.onSurface,
                    ),
                  ),
                  if (message.model != null && !isUser) ...[
                    const SizedBox(height: 4),
                    Text(
                      message.model!,
                      style: AppTypography.labelSmall.copyWith(
                        color: theme.colorScheme.onSurfaceVariant.withOpacity(0.6),
                        fontSize: 10,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar(ThemeData theme) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Center(
        child: Icon(
          Icons.auto_awesome,
          size: 16,
          color: theme.colorScheme.primary,
        ),
      ),
    );
  }
}
