import 'package:flutter/animation.dart';

/// Animation constants and curves for OneEdge mobile app.
///
/// Based on constitution guidelines for 60fps smooth animations.
abstract class AppAnimations {
  AppAnimations._();

  // ==========================================================================
  // DURATION CONSTANTS
  // Per constitution: 150-200ms for micro-interactions, 200-300ms for page transitions
  // ==========================================================================

  /// Micro-interaction duration (150ms) - for button presses, small UI changes
  static const Duration micro = Duration(milliseconds: 150);

  /// Short duration (200ms) - for fade in/out, small element animations
  static const Duration short = Duration(milliseconds: 200);

  /// Medium duration (250ms) - for modal appearances
  static const Duration medium = Duration(milliseconds: 250);

  /// Standard duration (300ms) - for page transitions
  static const Duration standard = Duration(milliseconds: 300);

  /// Long duration (400ms) - for complex animations
  static const Duration long = Duration(milliseconds: 400);

  /// Extra long duration (600ms) - for elaborate entrance animations
  static const Duration extraLong = Duration(milliseconds: 600);

  /// Skeleton shimmer cycle duration
  static const Duration shimmer = Duration(milliseconds: 1200);

  /// Typing indicator animation duration
  static const Duration typing = Duration(milliseconds: 600);

  /// Orb pulse animation duration
  static const Duration pulse = Duration(milliseconds: 1500);

  /// Wave ripple animation duration
  static const Duration wave = Duration(milliseconds: 2000);

  /// Rotation animation duration
  static const Duration rotation = Duration(milliseconds: 8000);

  // ==========================================================================
  // CURVES
  // ==========================================================================

  /// Default easing curve
  static const Curve defaultCurve = Curves.easeInOut;

  /// Entrance curve - for elements appearing
  static const Curve entranceCurve = Curves.easeOut;

  /// Exit curve - for elements disappearing
  static const Curve exitCurve = Curves.easeIn;

  /// Bounce curve - for playful animations
  static const Curve bounceCurve = Curves.elasticOut;

  /// Spring curve - for natural feeling animations
  static const Curve springCurve = Curves.easeOutBack;

  /// Decelerate curve - for drag releases
  static const Curve decelerateCurve = Curves.decelerate;

  // ==========================================================================
  // ANIMATION VALUES
  // ==========================================================================

  /// Scale down factor for press animations
  static const double pressScale = 0.95;

  /// Scale up factor for emphasis animations
  static const double emphasisScale = 1.05;

  /// Fade opacity start value
  static const double fadeStart = 0.0;

  /// Fade opacity end value
  static const double fadeEnd = 1.0;

  /// Slide offset start (from right)
  static const double slideXStart = 0.1;

  /// Slide offset start (from bottom)
  static const double slideYStart = 0.1;

  /// Stagger delay for list animations
  static const Duration staggerDelay = Duration(milliseconds: 50);
}
