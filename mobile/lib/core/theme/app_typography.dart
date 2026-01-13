import 'package:flutter/material.dart';

/// Typography scale for OneEdge.
///
/// Follows Apple HIG principles for legibility and hierarchy.
abstract class AppTypography {
  AppTypography._();

  /// Font family
  static const String fontFamily = 'Inter';

  /// Fallback font family
  static const List<String> fontFamilyFallback = [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ];

  // ==========================================================================
  // DISPLAY STYLES
  // ==========================================================================

  /// Large display - Hero text, splash screens
  static const TextStyle displayLarge = TextStyle(
    fontFamily: fontFamily,
    fontSize: 57,
    fontWeight: FontWeight.w700,
    height: 1.12,
    letterSpacing: -0.25,
  );

  /// Medium display - Section headers
  static const TextStyle displayMedium = TextStyle(
    fontFamily: fontFamily,
    fontSize: 45,
    fontWeight: FontWeight.w600,
    height: 1.16,
    letterSpacing: 0,
  );

  /// Small display - Card titles
  static const TextStyle displaySmall = TextStyle(
    fontFamily: fontFamily,
    fontSize: 36,
    fontWeight: FontWeight.w600,
    height: 1.22,
    letterSpacing: 0,
  );

  // ==========================================================================
  // HEADLINE STYLES
  // ==========================================================================

  /// Large headline - Page titles
  static const TextStyle headlineLarge = TextStyle(
    fontFamily: fontFamily,
    fontSize: 32,
    fontWeight: FontWeight.w600,
    height: 1.25,
    letterSpacing: 0,
  );

  /// Medium headline - Section titles
  static const TextStyle headlineMedium = TextStyle(
    fontFamily: fontFamily,
    fontSize: 28,
    fontWeight: FontWeight.w600,
    height: 1.29,
    letterSpacing: 0,
  );

  /// Small headline - Subsection titles
  static const TextStyle headlineSmall = TextStyle(
    fontFamily: fontFamily,
    fontSize: 24,
    fontWeight: FontWeight.w600,
    height: 1.33,
    letterSpacing: 0,
  );

  // ==========================================================================
  // TITLE STYLES
  // ==========================================================================

  /// Large title - List item titles
  static const TextStyle titleLarge = TextStyle(
    fontFamily: fontFamily,
    fontSize: 22,
    fontWeight: FontWeight.w600,
    height: 1.27,
    letterSpacing: 0,
  );

  /// Medium title - Card headers
  static const TextStyle titleMedium = TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 1.5,
    letterSpacing: 0.15,
  );

  /// Small title - Metadata labels
  static const TextStyle titleSmall = TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 1.43,
    letterSpacing: 0.1,
  );

  // ==========================================================================
  // BODY STYLES
  // ==========================================================================

  /// Large body - Primary content
  static const TextStyle bodyLarge = TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.5,
    letterSpacing: 0.5,
  );

  /// Medium body - Secondary content
  static const TextStyle bodyMedium = TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.43,
    letterSpacing: 0.25,
  );

  /// Small body - Supporting text
  static const TextStyle bodySmall = TextStyle(
    fontFamily: fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.33,
    letterSpacing: 0.4,
  );

  // ==========================================================================
  // LABEL STYLES
  // ==========================================================================

  /// Large label - Buttons, tabs
  static const TextStyle labelLarge = TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    height: 1.43,
    letterSpacing: 0.1,
  );

  /// Medium label - Chips, badges
  static const TextStyle labelMedium = TextStyle(
    fontFamily: fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.w500,
    height: 1.33,
    letterSpacing: 0.5,
  );

  /// Small label - Captions
  static const TextStyle labelSmall = TextStyle(
    fontFamily: fontFamily,
    fontSize: 11,
    fontWeight: FontWeight.w500,
    height: 1.45,
    letterSpacing: 0.5,
  );

  // ==========================================================================
  // CHAT-SPECIFIC STYLES
  // ==========================================================================

  /// Chat message text
  static const TextStyle chatMessage = TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.5,
    letterSpacing: 0,
  );

  /// Chat code block (monospace)
  static const TextStyle chatCode = TextStyle(
    fontFamily: 'SF Mono',
    fontFamilyFallback: ['Menlo', 'Monaco', 'Consolas', 'monospace'],
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.5,
    letterSpacing: 0,
  );

  /// Chat timestamp
  static const TextStyle chatTimestamp = TextStyle(
    fontFamily: fontFamily,
    fontSize: 11,
    fontWeight: FontWeight.w400,
    height: 1.45,
    letterSpacing: 0.5,
  );

  // ==========================================================================
  // SIA VOICE STYLES
  // ==========================================================================

  /// Sia speaking indicator
  static const TextStyle siaSpeaking = TextStyle(
    fontFamily: fontFamily,
    fontSize: 18,
    fontWeight: FontWeight.w500,
    height: 1.4,
    letterSpacing: 0.15,
    fontStyle: FontStyle.italic,
  );

  /// Sia transcript
  static const TextStyle siaTranscript = TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.5,
    letterSpacing: 0,
  );
}
