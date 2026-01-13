import 'package:flutter/material.dart';

/// Abstract interface for color palette
abstract class ColorPalette {
  Color get primary;
  Color get primaryForeground;
  Color get secondary;
  Color get secondaryForeground;
  Color get accent;
  Color get accentForeground;
  Color get background;
  Color get foreground;
  Color get surface;
  Color get surfaceVariant;
  Color get card;
  Color get cardForeground;
  Color get popover;
  Color get popoverForeground;
  Color get textPrimary;
  Color get textSecondary;
  Color get textTertiary;
  Color get textDisabled;
  Color get border;
  Color get input;
  Color get muted;
  Color get mutedForeground;
  Color get destructive;
  Color get destructiveForeground;
  Color get ring;
  Color get chart1;
  Color get chart2;
  Color get chart3;
  Color get chart4;
  Color get chart5;
}

/// OneEdge color palette.
///
/// Colors are derived from OKLCH values specified in hardUIrules.md.
/// These colors follow the mobile app specifications exactly.
///
/// Theme 1 (Purple): hardUIrules.md lines 8-63
/// Theme 2 (Blue/Violet): hardUIrules.md lines 64-119
abstract class AppColors {
  AppColors._();

  // ==========================================================================
  // THEME 1: Purple Theme (Default)
  // From hardUIrules.md mobile app light theme lines 8-35
  // ==========================================================================

  /// Light Mode Colors (Theme 1 - Purple)
  static const ColorPalette light = _Theme1LightColors();

  /// Dark Mode Colors (Theme 1 - Purple)
  static const ColorPalette dark = _Theme1DarkColors();

  // ==========================================================================
  // THEME 2: Blue/Violet Theme
  // From hardUIrules.md "Mobile app dark theme colors" lines 64-119
  // ==========================================================================

  /// Light Mode Colors (Theme 2 - Blue/Violet)
  static const ColorPalette blueLight = _Theme2LightColors();

  /// Dark Mode Colors (Theme 2 - Blue/Violet)
  static const ColorPalette blueDark = _Theme2DarkColors();

  // ==========================================================================
  // COMMON COLORS
  // ==========================================================================

  /// Success color
  static const Color success = Color(0xFF22C55E);

  /// Warning color
  static const Color warning = Color(0xFFF59E0B);

  /// Error color
  static const Color error = Color(0xFFEF4444);

  /// Info color
  static const Color info = Color(0xFF3B82F6);

  // ==========================================================================
  // MODEL BRAND COLORS
  // ==========================================================================

  /// Claude (Anthropic)
  static const Color claudeBrand = Color(0xFFCC785C);

  /// GPT (OpenAI)
  static const Color gptBrand = Color(0xFF10A37F);

  /// Gemini (Google)
  static const Color geminiBrand = Color(0xFF4285F4);

  /// Llama (Meta)
  static const Color llamaBrand = Color(0xFF0668E1);
}

// =============================================================================
// THEME 1: Purple Theme - Light Mode
// hardUIrules.md lines 8-35
// =============================================================================

/// Light theme colors from hardUIrules.md Theme 1
/// Based on OKLCH mobile app light theme:
/// --background: oklch(0.979 0.008 298.426)
/// --primary: oklch(0.205 0.032 295.665)
class _Theme1LightColors implements ColorPalette {
  const _Theme1LightColors();

  // Primary: oklch(0.205 0.032 295.665) - Deep purple
  @override
  Color get primary => const Color(0xFF2D2639);

  // Primary foreground: oklch(0.926 0.038 289.658)
  @override
  Color get primaryForeground => const Color(0xFFE6DCF0);

  // Secondary: oklch(0.868 0.011 298.338) - Soft lavender
  @override
  Color get secondary => const Color(0xFFDBD4E3);

  @override
  Color get secondaryForeground => const Color(0xFF4D4758);

  // Accent: Same as secondary per hardUIrules
  @override
  Color get accent => const Color(0xFFDBD4E3);

  @override
  Color get accentForeground => const Color(0xFF4D4758);

  // Background: oklch(0.979 0.008 298.426)
  @override
  Color get background => const Color(0xFFFBFAFC);

  // Foreground: oklch(0.108 0.03 298.039)
  @override
  Color get foreground => const Color(0xFF1A1824);

  @override
  Color get surface => const Color(0xFFFBFAFC);

  @override
  Color get surfaceVariant => const Color(0xFFF5F3F7);

  // Card: oklch(0.979 0.008 298.426)
  @override
  Color get card => const Color(0xFFFBFAFC);

  @override
  Color get cardForeground => const Color(0xFF1A1824);

  // Popover: oklch(0.979 0.008 298.426)
  @override
  Color get popover => const Color(0xFFFBFAFC);

  @override
  Color get popoverForeground => const Color(0xFF1A1824);

  // Text: --foreground: oklch(0.108 0.03 298.039)
  @override
  Color get textPrimary => const Color(0xFF1A1824);

  // --muted-foreground: oklch(0.423 0.019 297.776)
  @override
  Color get textSecondary => const Color(0xFF635D6C);

  @override
  Color get textTertiary => const Color(0xFF8A8494);

  @override
  Color get textDisabled => const Color(0xFFBBB5C4);

  // Border: oklch(0.908 0.011 298.358)
  @override
  Color get border => const Color(0xFFE6DFF0);

  // Input: oklch(0.908 0.011 298.358)
  @override
  Color get input => const Color(0xFFE6DFF0);

  // Muted: oklch(0.946 0.012 298.351)
  @override
  Color get muted => const Color(0xFFEDE9F3);

  @override
  Color get mutedForeground => const Color(0xFF635D6C);

  // Destructive: oklch(0.324 0.124 30.924)
  @override
  Color get destructive => const Color(0xFF822326);

  // Destructive foreground: oklch(0.803 0.109 25.422)
  @override
  Color get destructiveForeground => const Color(0xFFE89B89);

  // Ring: oklch(0.205 0.032 295.665)
  @override
  Color get ring => const Color(0xFF2D2639);

  // Chart colors
  @override
  Color get chart1 => const Color(0xFF2D2639); // oklch(0.205 0.032 295.665)

  @override
  Color get chart2 => const Color(0xFFDBD4E3); // oklch(0.868 0.011 298.338)

  @override
  Color get chart3 => const Color(0xFFDBD4E3); // oklch(0.868 0.011 298.338)

  @override
  Color get chart4 => const Color(0xFFE4DFE9); // oklch(0.893 0.009 298.387)

  @override
  Color get chart5 => const Color(0xFF2C2538); // oklch(0.203 0.036 295.299)
}

// =============================================================================
// THEME 1: Purple Theme - Dark Mode
// hardUIrules.md lines 37-63
// =============================================================================

/// Dark theme colors from hardUIrules.md Theme 1
/// Based on OKLCH mobile app dark theme:
/// --background: oklch(0.125 0.011 6.981)
/// --primary: oklch(0.214 0.027 9.798)
class _Theme1DarkColors implements ColorPalette {
  const _Theme1DarkColors();

  // Primary: oklch(0.214 0.027 9.798) - Warm brownish
  @override
  Color get primary => const Color(0xFF3D2D2B);

  // Primary foreground: oklch(0.746 0.052 8.316)
  @override
  Color get primaryForeground => const Color(0xFFC1A59C);

  // Secondary: oklch(0.202 0.004 7.058)
  @override
  Color get secondary => const Color(0xFF332F2E);

  @override
  Color get secondaryForeground => const Color(0xFFB8B3B2);

  // Accent: Same as secondary
  @override
  Color get accent => const Color(0xFF332F2E);

  @override
  Color get accentForeground => const Color(0xFFB8B3B2);

  // Background: oklch(0.125 0.011 6.981)
  @override
  Color get background => const Color(0xFF201C1B);

  // Foreground: oklch(0.991 0.002 6.648)
  @override
  Color get foreground => const Color(0xFFFCFCFB);

  // Surface: Same as background
  @override
  Color get surface => const Color(0xFF201C1B);

  @override
  Color get surfaceVariant => const Color(0xFF363230);

  // Card: oklch(0.125 0.011 6.981)
  @override
  Color get card => const Color(0xFF201C1B);

  @override
  Color get cardForeground => const Color(0xFFFCFCFB);

  // Popover: oklch(0.125 0.011 6.981)
  @override
  Color get popover => const Color(0xFF201C1B);

  @override
  Color get popoverForeground => const Color(0xFFFCFCFB);

  // Text: --foreground: oklch(0.991 0.002 6.648)
  @override
  Color get textPrimary => const Color(0xFFFCFCFB);

  // --muted-foreground: oklch(0.741 0.013 7.049)
  @override
  Color get textSecondary => const Color(0xFFB4ADAC);

  @override
  Color get textTertiary => const Color(0xFF8A8382);

  @override
  Color get textDisabled => const Color(0xFF5C5856);

  // Border: oklch(0.23 0.014 8.085)
  @override
  Color get border => const Color(0xFF3D3432);

  // Input: oklch(0.23 0.014 8.085)
  @override
  Color get input => const Color(0xFF3D3432);

  // Muted: oklch(0.162 0.015 8.938)
  @override
  Color get muted => const Color(0xFF2B2424);

  @override
  Color get mutedForeground => const Color(0xFFB4ADAC);

  // Destructive: oklch(0.651 0.237 19.636)
  @override
  Color get destructive => const Color(0xFFF84B3F);

  @override
  Color get destructiveForeground => const Color(0xFFFFFFFF);

  // Ring: oklch(0.214 0.027 9.798)
  @override
  Color get ring => const Color(0xFF3D2D2B);

  // Chart colors
  @override
  Color get chart1 => const Color(0xFF3D2D2B); // oklch(0.214 0.027 9.798)

  @override
  Color get chart2 => const Color(0xFF332F2E); // oklch(0.202 0.004 7.058)

  @override
  Color get chart3 => const Color(0xFF332F2E); // oklch(0.202 0.004 7.058)

  @override
  Color get chart4 => const Color(0xFF3B3634); // oklch(0.235 0.005 7.107)

  @override
  Color get chart5 => const Color(0xFF3E2D2A); // oklch(0.213 0.03 10.179)
}

// =============================================================================
// THEME 2: Blue/Violet Theme - Light Mode
// hardUIrules.md lines 65-91
// =============================================================================

/// Light theme colors from hardUIrules.md Theme 2 (Blue/Violet)
/// Based on OKLCH:
/// --background: oklch(0.971 0.003 286.35)
/// --primary: oklch(0.603 0.218 257.42)
class _Theme2LightColors implements ColorPalette {
  const _Theme2LightColors();

  // Primary: oklch(0.603 0.218 257.42) - Bright blue
  @override
  Color get primary => const Color(0xFF3B82F6);

  // Primary foreground: oklch(1 0 180)
  @override
  Color get primaryForeground => const Color(0xFFFFFFFF);

  // Secondary: oklch(1 0 180) - Pure white
  @override
  Color get secondary => const Color(0xFFFFFFFF);

  @override
  Color get secondaryForeground => const Color(0xFF000000);

  // Accent: oklch(0.963 0.007 286.274)
  @override
  Color get accent => const Color(0xFFF5F4F8);

  @override
  Color get accentForeground => const Color(0xFF000000);

  // Background: oklch(0.971 0.003 286.35)
  @override
  Color get background => const Color(0xFFF8F7FB);

  // Foreground: oklch(0 0 0)
  @override
  Color get foreground => const Color(0xFF000000);

  @override
  Color get surface => const Color(0xFFFFFFFF);

  @override
  Color get surfaceVariant => const Color(0xFFF5F4F8);

  // Card: oklch(1 0 180)
  @override
  Color get card => const Color(0xFFFFFFFF);

  @override
  Color get cardForeground => const Color(0xFF000000);

  // Popover: oklch(1 0 180)
  @override
  Color get popover => const Color(0xFFFFFFFF);

  @override
  Color get popoverForeground => const Color(0xFF000000);

  @override
  Color get textPrimary => const Color(0xFF000000);

  // --muted-foreground: oklch(0 0 0)
  @override
  Color get textSecondary => const Color(0xFF000000);

  @override
  Color get textTertiary => const Color(0xFF525252);

  @override
  Color get textDisabled => const Color(0xFF9CA3AF);

  // Border: oklch(0.923 0.007 286.267)
  @override
  Color get border => const Color(0xFFE7E6EB);

  // Input: oklch(0.923 0.007 286.267)
  @override
  Color get input => const Color(0xFFE7E6EB);

  // Muted: oklch(0.923 0.007 286.267)
  @override
  Color get muted => const Color(0xFFE7E6EB);

  @override
  Color get mutedForeground => const Color(0xFF000000);

  // Destructive: oklch(0.663 0.224 28.292)
  @override
  Color get destructive => const Color(0xFFEF4444);

  @override
  Color get destructiveForeground => const Color(0xFFFFFFFF);

  // Ring: oklch(0.603 0.218 257.42)
  @override
  Color get ring => const Color(0xFF3B82F6);

  // Chart colors - Vibrant
  @override
  Color get chart1 => const Color(0xFF4ADE80); // oklch(0.73 0.194 147.443)

  @override
  Color get chart2 => const Color(0xFFFACC15); // oklch(0.865 0.177 90.382)

  @override
  Color get chart3 => const Color(0xFF8B5CF6); // oklch(0.659 0.172 263.904)

  @override
  Color get chart4 => const Color(0xFF6366F1); // oklch(0.529 0.191 278.337)

  @override
  Color get chart5 => const Color(0xFFF43F5E); // oklch(0.65 0.238 17.899)
}

// =============================================================================
// THEME 2: Blue/Violet Theme - Dark Mode
// hardUIrules.md lines 93-119
// =============================================================================

/// Dark theme colors from hardUIrules.md Theme 2 (Blue/Violet)
/// Based on OKLCH:
/// --background: oklch(0 0 0)
/// --primary: oklch(0.624 0.206 255.484)
class _Theme2DarkColors implements ColorPalette {
  const _Theme2DarkColors();

  // Primary: oklch(0.624 0.206 255.484) - Bright blue
  @override
  Color get primary => const Color(0xFF4F8EFA);

  // Primary foreground: oklch(1 0 180)
  @override
  Color get primaryForeground => const Color(0xFFFFFFFF);

  // Secondary: oklch(0.227 0.004 286.091)
  @override
  Color get secondary => const Color(0xFF38373E);

  @override
  Color get secondaryForeground => const Color(0xFFFFFFFF);

  // Accent: oklch(0.294 0.004 286.177)
  @override
  Color get accent => const Color(0xFF49484F);

  @override
  Color get accentForeground => const Color(0xFFFFFFFF);

  // Background: oklch(0 0 0)
  @override
  Color get background => const Color(0xFF000000);

  // Foreground: oklch(0.994 0 180)
  @override
  Color get foreground => const Color(0xFFFEFEFE);

  @override
  Color get surface => const Color(0xFF0A0A0A);

  @override
  Color get surfaceVariant => const Color(0xFF171717);

  // Card: oklch(0 0 0)
  @override
  Color get card => const Color(0xFF000000);

  @override
  Color get cardForeground => const Color(0xFFFFFFFF);

  // Popover: oklch(0.227 0.004 286.091)
  @override
  Color get popover => const Color(0xFF38373E);

  // Popover foreground: oklch(0.963 0.007 286.274)
  @override
  Color get popoverForeground => const Color(0xFFF5F4F8);

  @override
  Color get textPrimary => const Color(0xFFFEFEFE);

  // --muted-foreground: oklch(0.994 0 180)
  @override
  Color get textSecondary => const Color(0xFFFEFEFE);

  @override
  Color get textTertiary => const Color(0xFFA1A1AA);

  @override
  Color get textDisabled => const Color(0xFF52525B);

  // Border: oklch(0.201 0.002 286.221)
  @override
  Color get border => const Color(0xFF333238);

  // Input: oklch(0.201 0.002 286.221)
  @override
  Color get input => const Color(0xFF333238);

  // Muted: oklch(0.201 0.004 286.039)
  @override
  Color get muted => const Color(0xFF333238);

  @override
  Color get mutedForeground => const Color(0xFFFEFEFE);

  // Destructive: oklch(0.648 0.207 30.78)
  @override
  Color get destructive => const Color(0xFFF75B4C);

  @override
  Color get destructiveForeground => const Color(0xFFFFFFFF);

  // Ring: oklch(0.624 0.206 255.484)
  @override
  Color get ring => const Color(0xFF4F8EFA);

  // Chart colors - Vibrant
  @override
  Color get chart1 => const Color(0xFF6EE7B7); // oklch(0.77 0.224 144.965)

  @override
  Color get chart2 => const Color(0xFFFCD34D); // oklch(0.885 0.181 94.786)

  @override
  Color get chart3 => const Color(0xFFA5B4FC); // oklch(0.817 0.119 227.748)

  @override
  Color get chart4 => const Color(0xFF818CF8); // oklch(0.556 0.203 278.151)

  @override
  Color get chart5 => const Color(0xFFF43F5E); // oklch(0.65 0.238 17.899)
}
