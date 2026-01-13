import 'package:flutter/widgets.dart';

/// Spacing constants for OneEdge mobile app.
///
/// Based on a 4px grid system per constitution guidelines.
/// Uses Apple HIG minimum touch target sizes (44x44pt).
abstract class AppSpacing {
  AppSpacing._();

  // ==========================================================================
  // BASE UNIT (4px grid system)
  // ==========================================================================

  /// Base spacing unit: 4px
  static const double unit = 4.0;

  // ==========================================================================
  // SPACING SCALE
  // ==========================================================================

  /// 4px
  static const double xs = 4.0;

  /// 8px
  static const double sm = 8.0;

  /// 12px
  static const double md = 12.0;

  /// 16px
  static const double lg = 16.0;

  /// 20px
  static const double xl = 20.0;

  /// 24px
  static const double xxl = 24.0;

  /// 32px
  static const double xxxl = 32.0;

  /// 48px
  static const double huge = 48.0;

  /// 64px
  static const double massive = 64.0;

  // ==========================================================================
  // TOUCH TARGETS (Apple HIG: 44pt minimum)
  // ==========================================================================

  /// Minimum touch target size (44pt per Apple HIG)
  static const double minTouchTarget = 44.0;

  /// Comfortable touch target size (48pt)
  static const double comfortableTouchTarget = 48.0;

  /// Large touch target size (56pt)
  static const double largeTouchTarget = 56.0;

  // ==========================================================================
  // BORDER RADIUS
  // ==========================================================================

  /// Extra small radius: 4px
  static const double radiusXs = 4.0;

  /// Small radius: 8px
  static const double radiusSm = 8.0;

  /// Medium radius: 12px
  static const double radiusMd = 12.0;

  /// Large radius: 16px
  static const double radiusLg = 16.0;

  /// Extra large radius: 20px
  static const double radiusXl = 20.0;

  /// XXL radius: 24px
  static const double radiusXxl = 24.0;

  /// Full/circular radius
  static const double radiusFull = 9999.0;

  // ==========================================================================
  // PAGE PADDING
  // ==========================================================================

  /// Horizontal page padding: 16px
  static const double pageHorizontal = 16.0;

  /// Vertical page padding: 16px
  static const double pageVertical = 16.0;

  /// Page padding insets
  static const EdgeInsets pagePadding = EdgeInsets.symmetric(
    horizontal: pageHorizontal,
    vertical: pageVertical,
  );

  // ==========================================================================
  // COMPONENT-SPECIFIC SPACING
  // ==========================================================================

  /// Card padding
  static const EdgeInsets cardPadding = EdgeInsets.all(16.0);

  /// List tile padding
  static const EdgeInsets listTilePadding = EdgeInsets.symmetric(
    horizontal: 16.0,
    vertical: 12.0,
  );

  /// Chat message padding
  static const EdgeInsets chatMessagePadding = EdgeInsets.symmetric(
    horizontal: 16.0,
    vertical: 12.0,
  );

  /// Chat bubble border radius
  static const double chatBubbleRadius = 20.0;

  /// Chat bubble tail radius
  static const double chatBubbleTailRadius = 4.0;

  /// Bottom navigation bar height
  static const double bottomNavHeight = 80.0;

  /// App bar height
  static const double appBarHeight = 56.0;

  /// Input field height
  static const double inputHeight = 48.0;

  /// FAB size
  static const double fabSize = 56.0;

  /// Avatar sizes
  static const double avatarSm = 32.0;
  static const double avatarMd = 40.0;
  static const double avatarLg = 56.0;
  static const double avatarXl = 80.0;

  /// Icon sizes
  static const double iconXs = 16.0;
  static const double iconSm = 20.0;
  static const double iconMd = 24.0;
  static const double iconLg = 28.0;
  static const double iconXl = 32.0;
  static const double iconXxl = 48.0;

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /// Create symmetric padding
  static EdgeInsets symmetric({double horizontal = 0, double vertical = 0}) {
    return EdgeInsets.symmetric(horizontal: horizontal, vertical: vertical);
  }

  /// Create padding from all sides
  static EdgeInsets all(double value) {
    return EdgeInsets.all(value);
  }

  /// Create padding with specific sides
  static EdgeInsets only({
    double left = 0,
    double top = 0,
    double right = 0,
    double bottom = 0,
  }) {
    return EdgeInsets.only(left: left, top: top, right: right, bottom: bottom);
  }

  /// Create a SizedBox with width spacing
  static SizedBox horizontalGap(double width) => SizedBox(width: width);

  /// Create a SizedBox with height spacing
  static SizedBox verticalGap(double height) => SizedBox(height: height);

  /// Predefined horizontal gaps
  static const SizedBox gapH4 = SizedBox(width: 4);
  static const SizedBox gapH8 = SizedBox(width: 8);
  static const SizedBox gapH12 = SizedBox(width: 12);
  static const SizedBox gapH16 = SizedBox(width: 16);
  static const SizedBox gapH20 = SizedBox(width: 20);
  static const SizedBox gapH24 = SizedBox(width: 24);
  static const SizedBox gapH32 = SizedBox(width: 32);

  /// Predefined vertical gaps
  static const SizedBox gapV4 = SizedBox(height: 4);
  static const SizedBox gapV8 = SizedBox(height: 8);
  static const SizedBox gapV12 = SizedBox(height: 12);
  static const SizedBox gapV16 = SizedBox(height: 16);
  static const SizedBox gapV20 = SizedBox(height: 20);
  static const SizedBox gapV24 = SizedBox(height: 24);
  static const SizedBox gapV32 = SizedBox(height: 32);
  static const SizedBox gapV48 = SizedBox(height: 48);
}
