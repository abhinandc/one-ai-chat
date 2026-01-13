import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:oneedge_mobile/core/config/app_config.dart';
import 'package:oneedge_mobile/core/di/providers.dart';
import 'package:oneedge_mobile/core/theme/app_colors.dart';
import 'package:oneedge_mobile/core/theme/app_typography.dart';

/// Extension to add UI properties to ModelModeType.
extension ModelModeTypeUI on ModelModeType {
  IconData get icon {
    switch (this) {
      case ModelModeType.thinking:
        return Icons.psychology;
      case ModelModeType.fast:
        return Icons.bolt;
      case ModelModeType.coding:
        return Icons.code;
    }
  }

  Color get color {
    switch (this) {
      case ModelModeType.thinking:
        return AppColors.claudeBrand;
      case ModelModeType.fast:
        return AppColors.gptBrand;
      case ModelModeType.coding:
        return const Color(0xFF8B5CF6); // Purple for coding
    }
  }
}

/// Model selector widget for chat screen.
///
/// Displays current model and allows switching between modes.
class ModelSelector extends StatelessWidget {
  const ModelSelector({
    required this.selectedModel,
    required this.selectedMode,
    required this.onModelChanged,
    required this.onModeChanged,
    super.key,
  });

  final String selectedModel;
  final ModelModeType selectedMode;
  final ValueChanged<String> onModelChanged;
  final ValueChanged<ModelModeType> onModeChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        _showModelSheet(context);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selectedMode.color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selectedMode.color.withOpacity(0.3),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              selectedMode.icon,
              size: 18,
              color: selectedMode.color,
            ),
            const SizedBox(width: 8),
            Text(
              selectedMode.displayName,
              style: AppTypography.labelMedium.copyWith(
                color: selectedMode.color,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              Icons.keyboard_arrow_down,
              size: 16,
              color: selectedMode.color,
            ),
          ],
        ),
      ),
    );
  }

  void _showModelSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _ModelSelectorSheet(
        selectedMode: selectedMode,
        selectedModel: selectedModel,
        onModeChanged: onModeChanged,
        onModelChanged: onModelChanged,
      ),
    );
  }
}

/// Model selector bottom sheet.
class _ModelSelectorSheet extends StatefulWidget {
  const _ModelSelectorSheet({
    required this.selectedMode,
    required this.selectedModel,
    required this.onModeChanged,
    required this.onModelChanged,
  });

  final ModelModeType selectedMode;
  final String selectedModel;
  final ValueChanged<ModelModeType> onModeChanged;
  final ValueChanged<String> onModelChanged;

  @override
  State<_ModelSelectorSheet> createState() => _ModelSelectorSheetState();
}

class _ModelSelectorSheetState extends State<_ModelSelectorSheet> {
  late ModelModeType _selectedMode;
  late String _selectedModel;
  bool _showAdvanced = false;

  @override
  void initState() {
    super.initState();
    _selectedMode = widget.selectedMode;
    _selectedModel = widget.selectedModel;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle bar
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: theme.colorScheme.onSurfaceVariant.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Title
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Select Mode',
                style: AppTypography.titleLarge.copyWith(
                  color: theme.colorScheme.onSurface,
                ),
              ),
            ),

            // Mode presets
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: ModelModeType.values.map((mode) {
                  final isSelected = mode == _selectedMode;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        setState(() {
                          _selectedMode = mode;
                          _selectedModel = mode.model;
                        });
                      },
                      child: AnimatedContainer(
                        duration: AppConfig.microAnimationDuration,
                        margin: EdgeInsets.only(
                          right: mode != ModelModeType.coding ? 8 : 0,
                        ),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? mode.color.withOpacity(0.15)
                              : theme.colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected
                                ? mode.color
                                : Colors.transparent,
                            width: 2,
                          ),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              mode.icon,
                              size: 28,
                              color: isSelected
                                  ? mode.color
                                  : theme.colorScheme.onSurfaceVariant,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              mode.displayName,
                              style: AppTypography.labelMedium.copyWith(
                                color: isSelected
                                    ? mode.color
                                    : theme.colorScheme.onSurface,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              mode.description,
                              style: AppTypography.labelSmall.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                              textAlign: TextAlign.center,
                              maxLines: 2,
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 16),

            // Advanced model selection
            GestureDetector(
              onTap: () {
                setState(() => _showAdvanced = !_showAdvanced);
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Advanced Options',
                      style: AppTypography.labelMedium.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    Icon(
                      _showAdvanced
                          ? Icons.keyboard_arrow_up
                          : Icons.keyboard_arrow_down,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ],
                ),
              ),
            ),

            if (_showAdvanced) ...[
              const SizedBox(height: 16),
              _buildAdvancedOptions(theme),
            ],

            const SizedBox(height: 16),

            // Apply button
            Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton(
                onPressed: () {
                  widget.onModeChanged(_selectedMode);
                  widget.onModelChanged(_selectedModel);
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
                child: const Text('Apply'),
              ),
            ),
          ],
        ),
      ),
    ).animate().slideY(begin: 0.1, end: 0, duration: 250.ms, curve: Curves.easeOut);
  }

  Widget _buildAdvancedOptions(ThemeData theme) {
    final models = [
      ('claude-3-opus', 'Claude 3 Opus', 'Most capable, complex reasoning'),
      ('claude-3-sonnet', 'Claude 3 Sonnet', 'Balanced performance'),
      ('claude-3-haiku', 'Claude 3 Haiku', 'Fast and efficient'),
      ('gpt-4o', 'GPT-4o', 'OpenAI flagship'),
      ('gpt-4o-mini', 'GPT-4o Mini', 'Fast, cost-effective'),
      ('gemini-pro', 'Gemini Pro', 'Google multimodal'),
    ];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Select Model',
            style: AppTypography.labelMedium.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          ...models.map((model) {
            final isSelected = model.$1 == _selectedModel;
            return ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              leading: Icon(
                _getModelIcon(model.$1),
                color: isSelected
                    ? _getModelColor(model.$1)
                    : theme.colorScheme.onSurfaceVariant,
              ),
              title: Text(
                model.$2,
                style: AppTypography.bodyMedium.copyWith(
                  color: theme.colorScheme.onSurface,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
              subtitle: Text(
                model.$3,
                style: AppTypography.labelSmall.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              trailing: isSelected
                  ? Icon(Icons.check, color: _getModelColor(model.$1))
                  : null,
              onTap: () {
                HapticFeedback.lightImpact();
                setState(() => _selectedModel = model.$1);
              },
            );
          }),
        ],
      ),
    ).animate().fadeIn(duration: 200.ms);
  }

  IconData _getModelIcon(String model) {
    if (model.contains('claude')) return Icons.auto_awesome;
    if (model.contains('gpt')) return Icons.bubble_chart;
    if (model.contains('gemini')) return Icons.diamond_outlined;
    return Icons.smart_toy;
  }

  Color _getModelColor(String model) {
    if (model.contains('claude')) return AppColors.claudeBrand;
    if (model.contains('gpt')) return AppColors.gptBrand;
    if (model.contains('gemini')) return AppColors.geminiBrand;
    return Colors.grey;
  }
}

/// Compact model chip for inline display.
class ModelChip extends StatelessWidget {
  const ModelChip({
    required this.model,
    this.onTap,
    super.key,
  });

  final String model;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final color = _getModelColor(model);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _getModelIcon(model),
              size: 12,
              color: color,
            ),
            const SizedBox(width: 4),
            Text(
              _getModelDisplayName(model),
              style: AppTypography.labelSmall.copyWith(
                color: color,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getModelIcon(String model) {
    if (model.contains('claude')) return Icons.auto_awesome;
    if (model.contains('gpt')) return Icons.bubble_chart;
    if (model.contains('gemini')) return Icons.diamond_outlined;
    return Icons.smart_toy;
  }

  Color _getModelColor(String model) {
    if (model.contains('claude')) return AppColors.claudeBrand;
    if (model.contains('gpt')) return AppColors.gptBrand;
    if (model.contains('gemini')) return AppColors.geminiBrand;
    return Colors.grey;
  }

  String _getModelDisplayName(String model) {
    if (model.contains('claude-3-opus')) return 'Opus';
    if (model.contains('claude-3-sonnet')) return 'Sonnet';
    if (model.contains('claude-3-haiku')) return 'Haiku';
    if (model.contains('gpt-4o-mini')) return 'GPT-4o Mini';
    if (model.contains('gpt-4o')) return 'GPT-4o';
    if (model.contains('gpt-4')) return 'GPT-4';
    if (model.contains('gemini')) return 'Gemini';
    return model.split('/').last;
  }
}
