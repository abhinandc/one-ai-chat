import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:oneedge_mobile/core/theme/app_spacing.dart';

/// Haptic feedback intensity levels.
enum HapticIntensity {
  /// Light impact - for subtle interactions
  light,

  /// Medium impact - for confirmations
  medium,

  /// Heavy impact - for important actions
  heavy,

  /// Selection changed
  selection,
}

/// A button wrapper that provides haptic feedback on tap.
///
/// Ensures 44pt minimum touch target per Apple HIG.
class HapticButton extends StatelessWidget {
  const HapticButton({
    required this.onTap,
    required this.child,
    this.hapticIntensity = HapticIntensity.light,
    this.minSize = AppSpacing.minTouchTarget,
    this.padding,
    this.enabled = true,
    super.key,
  });

  final VoidCallback onTap;
  final Widget child;
  final HapticIntensity hapticIntensity;
  final double minSize;
  final EdgeInsets? padding;
  final bool enabled;

  void _triggerHaptic() {
    switch (hapticIntensity) {
      case HapticIntensity.light:
        HapticFeedback.lightImpact();
      case HapticIntensity.medium:
        HapticFeedback.mediumImpact();
      case HapticIntensity.heavy:
        HapticFeedback.heavyImpact();
      case HapticIntensity.selection:
        HapticFeedback.selectionClick();
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled
          ? () {
              _triggerHaptic();
              onTap();
            }
          : null,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          minWidth: minSize,
          minHeight: minSize,
        ),
        child: Padding(
          padding: padding ?? EdgeInsets.zero,
          child: child,
        ),
      ),
    );
  }
}

/// An icon button with haptic feedback and 44pt minimum touch target.
class HapticIconButton extends StatelessWidget {
  const HapticIconButton({
    required this.icon,
    required this.onTap,
    this.size = 24,
    this.color,
    this.backgroundColor,
    this.hapticIntensity = HapticIntensity.light,
    this.tooltip,
    this.enabled = true,
    super.key,
  });

  final IconData icon;
  final VoidCallback onTap;
  final double size;
  final Color? color;
  final Color? backgroundColor;
  final HapticIntensity hapticIntensity;
  final String? tooltip;
  final bool enabled;

  void _triggerHaptic() {
    switch (hapticIntensity) {
      case HapticIntensity.light:
        HapticFeedback.lightImpact();
      case HapticIntensity.medium:
        HapticFeedback.mediumImpact();
      case HapticIntensity.heavy:
        HapticFeedback.heavyImpact();
      case HapticIntensity.selection:
        HapticFeedback.selectionClick();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    Widget button = GestureDetector(
      onTap: enabled
          ? () {
              _triggerHaptic();
              onTap();
            }
          : null,
      child: Container(
        width: AppSpacing.minTouchTarget,
        height: AppSpacing.minTouchTarget,
        decoration: backgroundColor != null
            ? BoxDecoration(
                color: backgroundColor,
                borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              )
            : null,
        child: Center(
          child: Icon(
            icon,
            size: size,
            color: enabled
                ? (color ?? theme.colorScheme.onSurface)
                : theme.colorScheme.onSurface.withOpacity(0.38),
          ),
        ),
      ),
    );

    if (tooltip != null) {
      button = Tooltip(
        message: tooltip!,
        child: button,
      );
    }

    return button;
  }
}

/// A tile with haptic feedback and proper touch targets.
class HapticTile extends StatelessWidget {
  const HapticTile({
    required this.onTap,
    required this.child,
    this.hapticIntensity = HapticIntensity.light,
    this.padding,
    this.borderRadius,
    this.backgroundColor,
    this.enabled = true,
    super.key,
  });

  final VoidCallback onTap;
  final Widget child;
  final HapticIntensity hapticIntensity;
  final EdgeInsets? padding;
  final BorderRadius? borderRadius;
  final Color? backgroundColor;
  final bool enabled;

  void _triggerHaptic() {
    switch (hapticIntensity) {
      case HapticIntensity.light:
        HapticFeedback.lightImpact();
      case HapticIntensity.medium:
        HapticFeedback.mediumImpact();
      case HapticIntensity.heavy:
        HapticFeedback.heavyImpact();
      case HapticIntensity.selection:
        HapticFeedback.selectionClick();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: backgroundColor ?? Colors.transparent,
      borderRadius: borderRadius ?? BorderRadius.circular(AppSpacing.radiusMd),
      child: InkWell(
        onTap: enabled
            ? () {
                _triggerHaptic();
                onTap();
              }
            : null,
        borderRadius:
            borderRadius ?? BorderRadius.circular(AppSpacing.radiusMd),
        child: ConstrainedBox(
          constraints: const BoxConstraints(
            minHeight: AppSpacing.minTouchTarget,
          ),
          child: Padding(
            padding: padding ?? AppSpacing.listTilePadding,
            child: child,
          ),
        ),
      ),
    );
  }
}

/// A scale animation wrapper for buttons that provides press feedback.
class PressableScale extends StatefulWidget {
  const PressableScale({
    required this.onTap,
    required this.child,
    this.hapticIntensity = HapticIntensity.light,
    this.scale = 0.95,
    this.duration = const Duration(milliseconds: 100),
    this.enabled = true,
    super.key,
  });

  final VoidCallback onTap;
  final Widget child;
  final HapticIntensity hapticIntensity;
  final double scale;
  final Duration duration;
  final bool enabled;

  @override
  State<PressableScale> createState() => _PressableScaleState();
}

class _PressableScaleState extends State<PressableScale> {
  bool _isPressed = false;

  void _triggerHaptic() {
    switch (widget.hapticIntensity) {
      case HapticIntensity.light:
        HapticFeedback.lightImpact();
      case HapticIntensity.medium:
        HapticFeedback.mediumImpact();
      case HapticIntensity.heavy:
        HapticFeedback.heavyImpact();
      case HapticIntensity.selection:
        HapticFeedback.selectionClick();
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: widget.enabled ? (_) => setState(() => _isPressed = true) : null,
      onTapUp: widget.enabled
          ? (_) {
              setState(() => _isPressed = false);
              _triggerHaptic();
              widget.onTap();
            }
          : null,
      onTapCancel:
          widget.enabled ? () => setState(() => _isPressed = false) : null,
      child: AnimatedScale(
        scale: _isPressed ? widget.scale : 1.0,
        duration: widget.duration,
        curve: Curves.easeInOut,
        child: widget.child,
      ),
    );
  }
}
