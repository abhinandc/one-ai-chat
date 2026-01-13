import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:oneedge_mobile/core/theme/app_spacing.dart';

/// State of the Sia orb animation.
enum SiaOrbState {
  /// Idle state - subtle ambient animation
  idle,

  /// Listening state - user is speaking
  listening,

  /// Processing state - thinking
  processing,

  /// Speaking state - Sia is responding
  speaking,
}

/// Animated orb widget for Sia voice assistant.
///
/// Displays different animation states based on the current interaction mode.
/// Provides visual feedback for listening, processing, and speaking states.
class SiaOrb extends StatefulWidget {
  const SiaOrb({
    required this.state,
    this.size = 200,
    this.primaryColor,
    this.onTapDown,
    this.onTapUp,
    this.onTapCancel,
    super.key,
  });

  /// Current animation state
  final SiaOrbState state;

  /// Size of the orb (diameter)
  final double size;

  /// Primary color for the orb (defaults to theme primary)
  final Color? primaryColor;

  /// Callback when user starts pressing
  final VoidCallback? onTapDown;

  /// Callback when user releases
  final VoidCallback? onTapUp;

  /// Callback when tap is cancelled
  final VoidCallback? onTapCancel;

  @override
  State<SiaOrb> createState() => _SiaOrbState();
}

class _SiaOrbState extends State<SiaOrb> with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _waveController;
  late AnimationController _rotationController;

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
    _rotationController = AnimationController(
      duration: const Duration(milliseconds: 8000),
      vsync: this,
    );

    _updateAnimations();
  }

  @override
  void didUpdateWidget(SiaOrb oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.state != widget.state) {
      _updateAnimations();
    }
  }

  void _updateAnimations() {
    switch (widget.state) {
      case SiaOrbState.idle:
        _pulseController.stop();
        _waveController.stop();
        _rotationController.repeat();
      case SiaOrbState.listening:
        _pulseController.repeat();
        _waveController.repeat();
        _rotationController.stop();
      case SiaOrbState.processing:
        _pulseController.repeat();
        _waveController.stop();
        _rotationController.repeat();
      case SiaOrbState.speaking:
        _pulseController.stop();
        _waveController.repeat();
        _rotationController.stop();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _waveController.dispose();
    _rotationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = widget.primaryColor ?? theme.colorScheme.primary;
    final orbSize = widget.size;

    return GestureDetector(
      onTapDown: widget.onTapDown != null
          ? (_) {
              HapticFeedback.mediumImpact();
              widget.onTapDown!();
            }
          : null,
      onTapUp: widget.onTapUp != null
          ? (_) {
              widget.onTapUp!();
            }
          : null,
      onTapCancel: widget.onTapCancel,
      child: SizedBox(
        width: orbSize,
        height: orbSize,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Outer glow layer
            if (widget.state != SiaOrbState.idle) _buildOuterGlow(color, orbSize),

            // Wave rings
            if (widget.state == SiaOrbState.listening ||
                widget.state == SiaOrbState.speaking)
              _buildWaveRings(color, orbSize),

            // Gradient background orb
            _buildGradientOrb(color, orbSize),

            // Inner content
            _buildInnerContent(theme, color),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 600.ms).scale(
          begin: const Offset(0.8, 0.8),
          end: const Offset(1, 1),
        );
  }

  Widget _buildOuterGlow(Color color, double orbSize) {
    return AnimatedBuilder(
      animation: _pulseController,
      builder: (context, child) {
        return Container(
          width: orbSize * (1 + _pulseController.value * 0.2),
          height: orbSize * (1 + _pulseController.value * 0.2),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                color.withOpacity(0.3 * (1 - _pulseController.value)),
                color.withOpacity(0),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildWaveRings(Color color, double orbSize) {
    return AnimatedBuilder(
      animation: _waveController,
      builder: (context, child) {
        return Stack(
          alignment: Alignment.center,
          children: List.generate(3, (index) {
            final progress = (_waveController.value + index * 0.33) % 1.0;
            return Container(
              width: orbSize * (0.6 + progress * 0.5),
              height: orbSize * (0.6 + progress * 0.5),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: color.withOpacity(0.5 * (1 - progress)),
                  width: 2,
                ),
              ),
            );
          }),
        );
      },
    );
  }

  Widget _buildGradientOrb(Color color, double orbSize) {
    final innerSize = orbSize * 0.6;

    return AnimatedBuilder(
      animation: _rotationController,
      builder: (context, child) {
        return Transform.rotate(
          angle: widget.state == SiaOrbState.idle ||
                  widget.state == SiaOrbState.processing
              ? _rotationController.value * 2 * math.pi
              : 0,
          child: Container(
            width: innerSize,
            height: innerSize,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  color,
                  color.withOpacity(0.7),
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: color.withOpacity(0.4),
                  blurRadius: 30,
                  spreadRadius: 5,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildInnerContent(ThemeData theme, Color color) {
    switch (widget.state) {
      case SiaOrbState.idle:
        return Icon(
          Icons.mic,
          size: AppSpacing.iconXxl,
          color: theme.colorScheme.onPrimary,
        );

      case SiaOrbState.listening:
        return _WaveformIndicator(
          controller: _waveController,
          color: theme.colorScheme.onPrimary,
        );

      case SiaOrbState.processing:
        return SizedBox(
          width: AppSpacing.iconXl,
          height: AppSpacing.iconXl,
          child: CircularProgressIndicator(
            strokeWidth: 3,
            valueColor: AlwaysStoppedAnimation(theme.colorScheme.onPrimary),
          ),
        );

      case SiaOrbState.speaking:
        return _SpeakingIndicator(
          controller: _waveController,
          color: theme.colorScheme.onPrimary,
        );
    }
  }
}

/// Waveform bars for listening state.
class _WaveformIndicator extends StatelessWidget {
  const _WaveformIndicator({
    required this.controller,
    required this.color,
  });

  final AnimationController controller;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, child) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(5, (index) {
            final height = 12.0 +
                24 *
                    math.sin(
                      (controller.value * 2 * math.pi) + index * 0.5,
                    ).abs();
            return Container(
              width: 4,
              height: height,
              margin: const EdgeInsets.symmetric(horizontal: 2),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(2),
              ),
            );
          }),
        );
      },
    );
  }
}

/// Pulsing dots for speaking state.
class _SpeakingIndicator extends StatelessWidget {
  const _SpeakingIndicator({
    required this.controller,
    required this.color,
  });

  final AnimationController controller;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, child) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(3, (index) {
            final scale = 0.8 +
                0.4 *
                    math.sin(
                      (controller.value * 2 * math.pi) + index * 0.8,
                    ).abs();
            return Transform.scale(
              scale: scale,
              child: Container(
                width: 12,
                height: 12,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
              ),
            );
          }),
        );
      },
    );
  }
}

/// Mini Sia orb for compact displays.
class SiaOrbMini extends StatelessWidget {
  const SiaOrbMini({
    this.size = 48,
    this.isActive = false,
    this.onTap,
    super.key,
  });

  final double size;
  final bool isActive;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: onTap != null
          ? () {
              HapticFeedback.lightImpact();
              onTap!();
            }
          : null,
      child: Container(
        width: size,
        height: size,
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
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: theme.colorScheme.primary.withOpacity(0.4),
                    blurRadius: 12,
                    spreadRadius: 2,
                  ),
                ]
              : null,
        ),
        child: Center(
          child: Icon(
            isActive ? Icons.graphic_eq : Icons.mic,
            size: size * 0.5,
            color: theme.colorScheme.onPrimary,
          ),
        ),
      ),
    );
  }
}
