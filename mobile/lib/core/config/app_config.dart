/// Application-wide configuration constants.
class AppConfig {
  AppConfig._();

  /// App name
  static const String appName = 'OneEdge';

  /// App version
  static const String version = '1.0.0';

  /// Build number
  static const int buildNumber = 1;

  /// Default animation duration (150-200ms for micro-interactions per constitution)
  static const Duration microAnimationDuration = Duration(milliseconds: 150);

  /// Page transition duration (200-300ms per constitution)
  static const Duration pageTransitionDuration = Duration(milliseconds: 250);

  /// Modal/drawer animation duration (200ms per constitution)
  static const Duration modalAnimationDuration = Duration(milliseconds: 200);

  /// Minimum touch target size (44x44pt per Apple HIG / constitution)
  static const double minTouchTargetSize = 44.0;

  /// Base spacing unit (4px grid system per constitution)
  static const double spacingUnit = 4.0;

  /// Spacing scale
  static const double spacing1 = 4.0;
  static const double spacing2 = 8.0;
  static const double spacing3 = 12.0;
  static const double spacing4 = 16.0;
  static const double spacing6 = 24.0;
  static const double spacing8 = 32.0;
  static const double spacing12 = 48.0;
  static const double spacing16 = 64.0;

  /// Border radius
  static const double radiusSmall = 4.0;
  static const double radiusMedium = 8.0;
  static const double radiusLarge = 12.0;
  static const double radiusXLarge = 16.0;
  static const double radiusFull = 9999.0;

  /// AI Model Modes
  static const Map<String, ModelMode> modelModes = {
    'thinking': ModelMode(
      id: 'thinking',
      name: 'Thinking',
      description: 'Deep analysis, complex reasoning',
      model: 'claude-3-opus',
      temperature: 0.3,
      icon: 'brain',
    ),
    'fast': ModelMode(
      id: 'fast',
      name: 'Fast',
      description: 'Quick responses, casual chat',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      icon: 'zap',
    ),
    'coding': ModelMode(
      id: 'coding',
      name: 'Coding',
      description: 'Code generation, debugging',
      model: 'claude-3-sonnet',
      temperature: 0.2,
      icon: 'code',
    ),
  };
}

/// Model mode configuration.
class ModelMode {
  const ModelMode({
    required this.id,
    required this.name,
    required this.description,
    required this.model,
    required this.temperature,
    required this.icon,
  });

  final String id;
  final String name;
  final String description;
  final String model;
  final double temperature;
  final String icon;
}
