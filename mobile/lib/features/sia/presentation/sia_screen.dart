import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:oneedge_mobile/core/config/app_config.dart';
import 'package:oneedge_mobile/core/di/providers.dart';
import 'package:oneedge_mobile/core/theme/app_spacing.dart';
import 'package:oneedge_mobile/core/theme/app_typography.dart';
import 'package:oneedge_mobile/shared/services/ai_service.dart';
import 'package:oneedge_mobile/shared/services/sia_service.dart';
import 'package:oneedge_mobile/shared/services/elevenlabs_service.dart';
import 'package:oneedge_mobile/shared/services/speech_service.dart';
import 'package:oneedge_mobile/shared/services/sia_agent_service.dart';

/// Sia voice assistant screen.
///
/// Provides a voice-first interface for AI interactions.
class SiaScreen extends ConsumerStatefulWidget {
  const SiaScreen({super.key});

  @override
  ConsumerState<SiaScreen> createState() => _SiaScreenState();
}

class _SiaScreenState extends ConsumerState<SiaScreen>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _waveController;

  bool _isListening = false;
  bool _isSpeaking = false;
  bool _isProcessing = false;
  String _transcript = '';
  String _response = '';
  SiaMemory? _memory;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _waveController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );
    _loadMemory();
  }

  Future<void> _loadMemory() async {
    final memory = await ref.read(siaMemoryProvider.future);
    if (mounted) {
      setState(() {
        _memory = memory;
      });
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _waveController.dispose();
    super.dispose();
  }

  void _startListening() async {
    HapticFeedback.mediumImpact();

    final speechService = ref.read(speechServiceProvider);
    final speechAvailable = await ref.read(speechAvailableProvider.future);

    if (!speechAvailable) {
      // Fallback to demo if speech not available
      _showError('Speech recognition not available on this device. Using demo mode.');
      setState(() {
        _isListening = true;
        _transcript = '';
        _response = '';
      });
      _pulseController.repeat();
      _waveController.repeat();

      // Demo fallback
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted && _isListening) {
          _stopListening();
          _processQuery('What should I focus on today?');
        }
      });
      return;
    }

    setState(() {
      _isListening = true;
      _transcript = '';
      _response = '';
    });
    _pulseController.repeat();
    _waveController.repeat();

    try {
      await speechService.startListening(
        onResult: (text, isFinal) {
          if (mounted) {
            setState(() {
              _transcript = text;
            });

            if (isFinal && text.isNotEmpty) {
              _stopListening();
              _processQuery(text);
            }
          }
        },
        listenFor: const Duration(seconds: 30),
      );
    } catch (e) {
      _showError('Speech recognition error: $e');
      _stopListening();
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _stopListening() async {
    HapticFeedback.lightImpact();
    _pulseController.stop();
    _waveController.stop();

    // Stop speech recognition
    final speechService = ref.read(speechServiceProvider);
    await speechService.stopListening();

    setState(() {
      _isListening = false;
    });
  }

  Future<void> _processQuery(String query) async {
    setState(() {
      _transcript = query;
      _isProcessing = true;
    });

    final siaService = ref.read(siaServiceProvider);
    final user = ref.read(currentUserProvider);
    final siaAgentConfigured = ref.read(siaAgentConfiguredProvider);

    // If ElevenLabs Conversational Agent is configured, use it
    if (siaAgentConfigured) {
      try {
        final siaAgent = ref.read(siaAgentServiceProvider);

        setState(() {
          _isProcessing = false;
          _isSpeaking = true;
        });
        _waveController.repeat();

        // Use the conversational agent for full voice experience
        final response = await siaAgent.chat(query);

        if (mounted) {
          setState(() {
            _response = response;
          });

          // Update Sia's memory with the topic
          if (user != null) {
            await siaService.addRecentTopic(
              userId: user.id,
              topic: _extractTopic(query),
            );
            _loadMemory();
          }

          _waveController.stop();
          setState(() {
            _isSpeaking = false;
          });
        }
        return;
      } catch (e) {
        // Fall through to AI service fallback
        debugPrint('SiaAgent error: $e');
      }
    }

    // Fallback to AI service + TTS
    final aiService = ref.read(aiServiceProvider);

    // Generate system prompt with memory context
    String systemPrompt = '''You are Sia, a Strategic Intelligence Assistant.
You are warm, concise, and helpful. You remember context from previous conversations.
Keep responses brief and conversational - this is a voice interface.''';

    if (_memory != null) {
      systemPrompt = siaService.generateContextPrompt(_memory!);
    }

    // Check if AI service is configured
    if (!AIService.isConfigured) {
      await Future.delayed(const Duration(milliseconds: 500));
      setState(() {
        _isProcessing = false;
        _isSpeaking = true;
        _response = 'I would love to help, but I need to be connected to the AI service. Please configure the API_PROXY_URL.';
      });
      _waveController.repeat();

      // Use ElevenLabs TTS if configured
      final elevenLabsConfigured = ref.read(elevenLabsConfiguredProvider);
      if (elevenLabsConfigured) {
        try {
          final elevenLabs = ref.read(elevenLabsServiceProvider);
          await elevenLabs.speak(_response);
        } catch (_) {
          await Future.delayed(const Duration(seconds: 2));
        }
      } else {
        await Future.delayed(const Duration(seconds: 2));
      }

      if (mounted) {
        _waveController.stop();
        setState(() {
          _isSpeaking = false;
        });
      }
      return;
    }

    // Get AI response
    try {
      final response = await aiService.chatCompletion(
        model: 'claude-3-sonnet', // Use Sonnet for voice - good balance
        messages: [], // Just the query for Sia
        systemPrompt: systemPrompt,
        temperature: 0.7,
        maxTokens: 300, // Keep responses short for voice
      );

      if (mounted) {
        setState(() {
          _isProcessing = false;
          _isSpeaking = true;
          _response = response;
        });
        _waveController.repeat();

        // Update Sia's memory with the topic
        if (user != null) {
          await siaService.addRecentTopic(
            userId: user.id,
            topic: _extractTopic(query),
          );
          // Refresh memory
          _loadMemory();
        }

        // Use ElevenLabs TTS if configured, otherwise simulate speaking
        final elevenLabsConfigured = ref.read(elevenLabsConfiguredProvider);

        if (elevenLabsConfigured) {
          // Real ElevenLabs TTS
          try {
            final elevenLabs = ref.read(elevenLabsServiceProvider);
            await elevenLabs.speak(response);
          } catch (e) {
            // Fallback to simulated timing on error
            final speakDuration = Duration(
              milliseconds: (response.length / 15 * 100).clamp(1000, 5000).toInt(),
            );
            await Future.delayed(speakDuration);
          }
        } else {
          // Simulated speaking duration based on response length
          final speakDuration = Duration(
            milliseconds: (response.length / 15 * 100).clamp(1000, 5000).toInt(),
          );
          await Future.delayed(speakDuration);
        }

        if (mounted) {
          _waveController.stop();
          setState(() {
            _isSpeaking = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isProcessing = false;
          _isSpeaking = true;
          _response = 'I encountered an error. Please try again.';
        });
        _waveController.repeat();

        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          _waveController.stop();
          setState(() {
            _isSpeaking = false;
          });
        }
      }
    }
  }

  String _extractTopic(String query) {
    // Simple topic extraction - in production, use AI for this
    final words = query.toLowerCase().split(' ');
    final stopWords = {'what', 'is', 'the', 'a', 'an', 'how', 'can', 'i', 'you', 'do', 'should', 'my', 'me', 'today', 'like'};
    final topicWords = words.where((w) => !stopWords.contains(w)).take(3);
    return topicWords.join(' ');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Header
            _buildHeader(theme),

            // Main content area
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Sia orb
                    _buildSiaOrb(theme, size),

                    const SizedBox(height: 32),

                    // Status text
                    _buildStatusText(theme),

                    const SizedBox(height: 16),

                    // Transcript/Response
                    if (_transcript.isNotEmpty || _response.isNotEmpty)
                      _buildTranscriptArea(theme),
                  ],
                ),
              ),
            ),

            // Controls
            _buildControls(theme),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Sia',
                  style: AppTypography.headlineMedium.copyWith(
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Strategic Intelligence Assistant',
                  style: AppTypography.bodyMedium.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () {
              HapticFeedback.lightImpact();
              // TODO: Show conversation history
            },
            tooltip: 'History',
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              HapticFeedback.lightImpact();
              // TODO: Show Sia settings
            },
            tooltip: 'Settings',
          ),
        ],
      ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.1, end: 0),
    );
  }

  Widget _buildSiaOrb(ThemeData theme, Size size) {
    final orbSize = size.width * 0.5;

    return GestureDetector(
      onTapDown: (_) => _startListening(),
      onTapUp: (_) {
        if (_isListening) _stopListening();
      },
      onTapCancel: () {
        if (_isListening) _stopListening();
      },
      child: SizedBox(
        width: orbSize,
        height: orbSize,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Outer glow
            if (_isListening || _isSpeaking)
              AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  return Container(
                    width: orbSize * (1 + _pulseController.value * 0.2),
                    height: orbSize * (1 + _pulseController.value * 0.2),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          theme.colorScheme.primary
                              .withOpacity(0.3 * (1 - _pulseController.value)),
                          theme.colorScheme.primary.withOpacity(0),
                        ],
                      ),
                    ),
                  );
                },
              ),

            // Waveform rings
            if (_isListening || _isSpeaking)
              ...List.generate(3, (index) {
                return AnimatedBuilder(
                  animation: _waveController,
                  builder: (context, child) {
                    final progress =
                        (_waveController.value + index * 0.33) % 1.0;
                    return Container(
                      width: orbSize * (0.6 + progress * 0.5),
                      height: orbSize * (0.6 + progress * 0.5),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: theme.colorScheme.primary
                              .withOpacity(0.5 * (1 - progress)),
                          width: 2,
                        ),
                      ),
                    );
                  },
                );
              }),

            // Main orb
            Container(
              width: orbSize * 0.6,
              height: orbSize * 0.6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    theme.colorScheme.primary,
                    theme.colorScheme.primary.withOpacity(0.7),
                  ],
                ),
                boxShadow: [
                  BoxShadow(
                    color: theme.colorScheme.primary.withOpacity(0.4),
                    blurRadius: 30,
                    spreadRadius: 5,
                  ),
                ],
              ),
              child: Center(
                child: _isListening
                    ? _buildWaveformIndicator(theme)
                    : _isSpeaking
                        ? _buildSpeakingIndicator(theme)
                        : Icon(
                            Icons.mic,
                            size: 48,
                            color: theme.colorScheme.onPrimary,
                          ),
              ),
            ),
          ],
        ),
      ),
    )
        .animate()
        .fadeIn(duration: 600.ms)
        .scale(begin: const Offset(0.8, 0.8), end: const Offset(1, 1));
  }

  Widget _buildWaveformIndicator(ThemeData theme) {
    return AnimatedBuilder(
      animation: _waveController,
      builder: (context, child) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(5, (index) {
            final height = 12.0 +
                24 *
                    math.sin(
                      (_waveController.value * 2 * math.pi) + index * 0.5,
                    ).abs();
            return Container(
              width: 4,
              height: height,
              margin: const EdgeInsets.symmetric(horizontal: 2),
              decoration: BoxDecoration(
                color: theme.colorScheme.onPrimary,
                borderRadius: BorderRadius.circular(2),
              ),
            );
          }),
        );
      },
    );
  }

  Widget _buildSpeakingIndicator(ThemeData theme) {
    return AnimatedBuilder(
      animation: _waveController,
      builder: (context, child) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(3, (index) {
            final scale = 0.8 +
                0.4 *
                    math.sin(
                      (_waveController.value * 2 * math.pi) + index * 0.8,
                    ).abs();
            return Transform.scale(
              scale: scale,
              child: Container(
                width: 12,
                height: 12,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: theme.colorScheme.onPrimary,
                  shape: BoxShape.circle,
                ),
              ),
            );
          }),
        );
      },
    );
  }

  Widget _buildStatusText(ThemeData theme) {
    String statusText;
    if (_isListening) {
      statusText = 'Listening...';
    } else if (_isProcessing) {
      statusText = 'Thinking...';
    } else if (_isSpeaking) {
      statusText = 'Sia is speaking...';
    } else {
      statusText = 'Tap and hold to speak';
    }

    return Text(
      statusText,
      style: AppTypography.titleMedium.copyWith(
        color: theme.colorScheme.onSurfaceVariant,
      ),
    ).animate(target: _isListening || _isSpeaking || _isProcessing ? 1 : 0).shimmer(
          duration: 1500.ms,
          color: theme.colorScheme.primary.withOpacity(0.5),
        );
  }

  Widget _buildTranscriptArea(ThemeData theme) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_transcript.isNotEmpty) ...[
            Row(
              children: [
                Icon(
                  Icons.mic,
                  size: 14,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 4),
                Text(
                  'You',
                  style: AppTypography.labelSmall.copyWith(
                    color: theme.colorScheme.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              _transcript,
              style: AppTypography.bodyMedium.copyWith(
                color: theme.colorScheme.onSurface,
              ),
            ),
          ],
          if (_transcript.isNotEmpty && _response.isNotEmpty)
            const SizedBox(height: 12),
          if (_response.isNotEmpty) ...[
            Row(
              children: [
                Icon(
                  Icons.auto_awesome,
                  size: 14,
                  color: theme.colorScheme.secondary,
                ),
                const SizedBox(width: 4),
                Text(
                  'Sia',
                  style: AppTypography.labelSmall.copyWith(
                    color: theme.colorScheme.secondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              _response,
              style: AppTypography.bodyMedium.copyWith(
                color: theme.colorScheme.onSurface,
              ),
            ),
          ],
        ],
      ),
    ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _buildControls(ThemeData theme) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        24,
        16,
        24,
        MediaQuery.of(context).padding.bottom + 16,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // Keyboard input
          _ControlButton(
            icon: Icons.keyboard_outlined,
            label: 'Type',
            onTap: () {
              HapticFeedback.lightImpact();
              // TODO: Show keyboard input modal
            },
          ),

          // Quick actions
          _ControlButton(
            icon: Icons.flash_on_outlined,
            label: 'Quick',
            onTap: () {
              HapticFeedback.lightImpact();
              _showQuickActions(context);
            },
          ),

          // Mode switch
          _ControlButton(
            icon: Icons.tune_outlined,
            label: 'Mode',
            onTap: () {
              HapticFeedback.lightImpact();
              _showModePicker(context);
            },
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms, delay: 200.ms).slideY(begin: 0.2, end: 0);
  }

  void _showQuickActions(BuildContext context) {
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
                  'Quick Actions',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.summarize_outlined),
                title: const Text('Summarize my day'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Implement
                },
              ),
              ListTile(
                leading: const Icon(Icons.calendar_today_outlined),
                title: const Text("What's on my calendar?"),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Implement
                },
              ),
              ListTile(
                leading: const Icon(Icons.email_outlined),
                title: const Text('Check my emails'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Implement
                },
              ),
              ListTile(
                leading: const Icon(Icons.task_outlined),
                title: const Text('What should I focus on?'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Implement
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  void _showModePicker(BuildContext context) {
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
                  'Sia Mode',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.chat_outlined),
                title: const Text('Conversational'),
                subtitle: const Text('Natural back-and-forth dialogue'),
                onTap: () => Navigator.pop(context),
              ),
              ListTile(
                leading: const Icon(Icons.psychology_outlined),
                title: const Text('Focused'),
                subtitle: const Text('Deep thinking mode'),
                onTap: () => Navigator.pop(context),
              ),
              ListTile(
                leading: const Icon(Icons.flash_on_outlined),
                title: const Text('Quick'),
                subtitle: const Text('Fast, brief responses'),
                onTap: () => Navigator.pop(context),
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }
}

/// Control button widget.
///
/// Ensures 44pt minimum touch target per Apple HIG.
class _ControlButton extends StatelessWidget {
  const _ControlButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Button container - exceeds minimum 44pt touch target
          Container(
            width: AppSpacing.largeTouchTarget,
            height: AppSpacing.largeTouchTarget,
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            ),
            child: Center(
              child: Icon(
                icon,
                size: AppSpacing.iconMd,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          AppSpacing.gapV8,
          Text(
            label,
            style: AppTypography.labelSmall.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
