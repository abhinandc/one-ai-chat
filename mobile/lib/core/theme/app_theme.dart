import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:oneedge_mobile/core/theme/app_colors.dart';
import 'package:oneedge_mobile/core/theme/app_typography.dart';

/// Application theme configuration.
///
/// Uses OKLCH color values from hardUIrules.md for consistent
/// theming across web and mobile platforms.
class AppTheme {
  const AppTheme._();

  // ==========================================================================
  // THEMES
  // ==========================================================================

  /// Light theme
  static ThemeData light() => _buildTheme(brightness: Brightness.light);

  /// Dark theme
  static ThemeData dark() => _buildTheme(brightness: Brightness.dark);

  // ==========================================================================
  // THEME BUILDER
  // ==========================================================================

  static ThemeData _buildTheme({required Brightness brightness}) {
    final isDark = brightness == Brightness.dark;

    // Select color palette based on brightness
    final colors = isDark ? AppColors.dark : AppColors.light;

    // Build color scheme
    final colorScheme = ColorScheme(
      brightness: brightness,
      primary: colors.primary,
      onPrimary: colors.primaryForeground,
      secondary: colors.secondary,
      onSecondary: colors.secondaryForeground,
      tertiary: colors.accent,
      onTertiary: colors.accentForeground,
      error: AppColors.error,
      onError: Colors.white,
      surface: colors.surface,
      onSurface: colors.textPrimary,
      surfaceContainerHighest: colors.surfaceVariant,
      onSurfaceVariant: colors.textSecondary,
      outline: colors.border,
      outlineVariant: colors.border,
    );

    // Build text theme
    final textTheme = _buildTextTheme(colors);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: colors.background,
      textTheme: textTheme,
      fontFamily: AppTypography.fontFamily,

      // AppBar
      appBarTheme: AppBarTheme(
        backgroundColor: colors.background,
        foregroundColor: colors.textPrimary,
        elevation: 0,
        centerTitle: true,
        systemOverlayStyle: isDark
            ? SystemUiOverlayStyle.light
            : SystemUiOverlayStyle.dark,
        titleTextStyle: AppTypography.titleMedium.copyWith(
          color: colors.textPrimary,
        ),
      ),

      // Bottom Navigation
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: colors.surface,
        selectedItemColor: colors.primary,
        unselectedItemColor: colors.textTertiary,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: AppTypography.labelSmall,
        unselectedLabelStyle: AppTypography.labelSmall,
      ),

      // Navigation Bar (Material 3)
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: colors.surface,
        indicatorColor: colors.primary.withOpacity(0.12),
        elevation: 0,
        height: 80,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppTypography.labelSmall.copyWith(
              color: colors.primary,
              fontWeight: FontWeight.w600,
            );
          }
          return AppTypography.labelSmall.copyWith(
            color: colors.textTertiary,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return IconThemeData(
              color: colors.primary,
              size: 24,
            );
          }
          return IconThemeData(
            color: colors.textTertiary,
            size: 24,
          );
        }),
      ),

      // Cards
      cardTheme: CardThemeData(
        color: colors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: colors.border),
        ),
        margin: EdgeInsets.zero,
      ),

      // Elevated Button
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: colors.primary,
          foregroundColor: colors.primaryForeground,
          elevation: 0,
          minimumSize: const Size(44, 44),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: AppTypography.labelLarge,
        ),
      ),

      // Text Button
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: colors.primary,
          minimumSize: const Size(44, 44),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: AppTypography.labelLarge,
        ),
      ),

      // Outlined Button
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: colors.textPrimary,
          minimumSize: const Size(44, 44),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          side: BorderSide(color: colors.border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: AppTypography.labelLarge,
        ),
      ),

      // Icon Button
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          minimumSize: const Size(44, 44),
          padding: const EdgeInsets.all(8),
        ),
      ),

      // Input Decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colors.surfaceVariant,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: colors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: colors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.error, width: 2),
        ),
        labelStyle: AppTypography.bodyMedium.copyWith(
          color: colors.textSecondary,
        ),
        hintStyle: AppTypography.bodyMedium.copyWith(
          color: colors.textTertiary,
        ),
        errorStyle: AppTypography.bodySmall.copyWith(
          color: AppColors.error,
        ),
      ),

      // Chip
      chipTheme: ChipThemeData(
        backgroundColor: colors.surfaceVariant,
        selectedColor: colors.primary.withOpacity(0.12),
        labelStyle: AppTypography.labelMedium.copyWith(
          color: colors.textPrimary,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        side: BorderSide(color: colors.border),
      ),

      // Divider
      dividerTheme: DividerThemeData(
        color: colors.border,
        thickness: 1,
        space: 1,
      ),

      // List Tile
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        minVerticalPadding: 8,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        titleTextStyle: AppTypography.titleMedium.copyWith(
          color: colors.textPrimary,
        ),
        subtitleTextStyle: AppTypography.bodySmall.copyWith(
          color: colors.textSecondary,
        ),
      ),

      // Snackbar
      snackBarTheme: SnackBarThemeData(
        backgroundColor: isDark ? colors.surface : colors.textPrimary,
        contentTextStyle: AppTypography.bodyMedium.copyWith(
          color: isDark ? colors.textPrimary : colors.surface,
        ),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),

      // Bottom Sheet
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: colors.surface,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
        dragHandleColor: colors.border,
        dragHandleSize: const Size(32, 4),
      ),

      // Dialog
      dialogTheme: DialogThemeData(
        backgroundColor: colors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        titleTextStyle: AppTypography.titleLarge.copyWith(
          color: colors.textPrimary,
        ),
        contentTextStyle: AppTypography.bodyMedium.copyWith(
          color: colors.textSecondary,
        ),
      ),

      // Progress Indicator
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: colors.primary,
        linearTrackColor: colors.surfaceVariant,
        circularTrackColor: colors.surfaceVariant,
      ),

      // Switch
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return colors.primary;
          }
          return colors.textTertiary;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return colors.primary.withOpacity(0.5);
          }
          return colors.surfaceVariant;
        }),
        trackOutlineColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return Colors.transparent;
          }
          return colors.border;
        }),
      ),

      // Slider
      sliderTheme: SliderThemeData(
        activeTrackColor: colors.primary,
        inactiveTrackColor: colors.surfaceVariant,
        thumbColor: colors.primary,
        overlayColor: colors.primary.withOpacity(0.12),
      ),
    );
  }

  static TextTheme _buildTextTheme(ColorPalette colors) {
    return TextTheme(
      displayLarge: AppTypography.displayLarge.copyWith(
        color: colors.textPrimary,
      ),
      displayMedium: AppTypography.displayMedium.copyWith(
        color: colors.textPrimary,
      ),
      displaySmall: AppTypography.displaySmall.copyWith(
        color: colors.textPrimary,
      ),
      headlineLarge: AppTypography.headlineLarge.copyWith(
        color: colors.textPrimary,
      ),
      headlineMedium: AppTypography.headlineMedium.copyWith(
        color: colors.textPrimary,
      ),
      headlineSmall: AppTypography.headlineSmall.copyWith(
        color: colors.textPrimary,
      ),
      titleLarge: AppTypography.titleLarge.copyWith(
        color: colors.textPrimary,
      ),
      titleMedium: AppTypography.titleMedium.copyWith(
        color: colors.textPrimary,
      ),
      titleSmall: AppTypography.titleSmall.copyWith(
        color: colors.textPrimary,
      ),
      bodyLarge: AppTypography.bodyLarge.copyWith(
        color: colors.textPrimary,
      ),
      bodyMedium: AppTypography.bodyMedium.copyWith(
        color: colors.textSecondary,
      ),
      bodySmall: AppTypography.bodySmall.copyWith(
        color: colors.textTertiary,
      ),
      labelLarge: AppTypography.labelLarge.copyWith(
        color: colors.textPrimary,
      ),
      labelMedium: AppTypography.labelMedium.copyWith(
        color: colors.textSecondary,
      ),
      labelSmall: AppTypography.labelSmall.copyWith(
        color: colors.textTertiary,
      ),
    );
  }
}
