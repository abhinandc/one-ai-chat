import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:oneedge_mobile/core/config/app_config.dart';
import 'package:oneedge_mobile/core/di/providers.dart';
import 'package:oneedge_mobile/core/routing/app_router.dart';
import 'package:oneedge_mobile/core/theme/app_colors.dart';
import 'package:oneedge_mobile/core/theme/app_spacing.dart';
import 'package:oneedge_mobile/core/theme/app_typography.dart';
import 'package:oneedge_mobile/shared/models/project.dart';
import 'package:oneedge_mobile/shared/widgets/skeleton_loader.dart';

/// Projects screen for conversation organization.
class ProjectsScreen extends ConsumerStatefulWidget {
  const ProjectsScreen({super.key});

  @override
  ConsumerState<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends ConsumerState<ProjectsScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final projectsAsync = ref.watch(projectsProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            _buildHeader(theme),

            // Projects grid
            Expanded(
              child: projectsAsync.when(
                data: (projects) => _buildProjectsGrid(theme, projects),
                loading: () => _buildLoadingSkeleton(),
                error: (error, stack) => _buildErrorState(theme, error),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: _buildCreateProjectFab(theme),
    );
  }

  Widget _buildHeader(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Projects',
            style: AppTypography.headlineMedium.copyWith(
              color: theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Organize your conversations',
            style: AppTypography.bodyMedium.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.1, end: 0),
    );
  }

  Widget _buildProjectsGrid(ThemeData theme, List<Project> projects) {
    if (projects.isEmpty) {
      return _buildEmptyState(theme);
    }

    return RefreshIndicator(
      onRefresh: () async {
        HapticFeedback.mediumImpact();
        ref.invalidate(projectsProvider);
      },
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.1,
        ),
        itemCount: projects.length,
        itemBuilder: (context, index) {
          final project = projects[index];
          return _ProjectCard(
            project: project,
            onTap: () => _openProject(project),
            onEdit: () => _editProject(project),
            onDelete: () => _deleteProject(project),
          )
              .animate()
              .fadeIn(
                duration: 300.ms,
                delay: Duration(milliseconds: 50 * index),
              )
              .scale(
                begin: const Offset(0.9, 0.9),
                end: const Offset(1, 1),
              );
        },
      ),
    );
  }

  Widget _buildLoadingSkeleton() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.1,
      ),
      itemCount: 4,
      itemBuilder: (context, index) {
        return const SkeletonLoader(
          height: double.infinity,
          borderRadius: 16,
        ).animate().fadeIn(
              duration: 300.ms,
              delay: Duration(milliseconds: 50 * index),
            );
      },
    );
  }

  Widget _buildErrorState(ThemeData theme, Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 48,
            color: AppColors.error,
          ),
          const SizedBox(height: 16),
          Text(
            'Something went wrong',
            style: AppTypography.titleMedium.copyWith(
              color: theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            error.toString(),
            style: AppTypography.bodySmall.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: () => ref.invalidate(projectsProvider),
            icon: const Icon(Icons.refresh),
            label: const Text('Try Again'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.folder_outlined,
            size: 64,
            color: theme.colorScheme.onSurfaceVariant.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No projects yet',
            style: AppTypography.titleMedium.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Create a project to organize your conversations',
            style: AppTypography.bodyMedium.copyWith(
              color: theme.colorScheme.onSurfaceVariant.withOpacity(0.7),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _showCreateProjectSheet,
            icon: const Icon(Icons.add),
            label: const Text('Create Project'),
          ),
        ],
      ).animate().fadeIn(duration: 400.ms).scale(begin: const Offset(0.9, 0.9)),
    );
  }

  Widget _buildCreateProjectFab(ThemeData theme) {
    return FloatingActionButton(
      onPressed: () {
        HapticFeedback.mediumImpact();
        _showCreateProjectSheet();
      },
      backgroundColor: theme.colorScheme.primary,
      foregroundColor: theme.colorScheme.onPrimary,
      child: const Icon(Icons.add),
    ).animate().fadeIn(duration: 400.ms, delay: 300.ms).scale(
          begin: const Offset(0.8, 0.8),
          end: const Offset(1, 1),
        );
  }

  void _openProject(Project project) {
    HapticFeedback.lightImpact();
    // TODO: Navigate to project detail view
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Opening ${project.name}...')),
    );
  }

  void _editProject(Project project) {
    HapticFeedback.lightImpact();
    _showEditProjectSheet(project);
  }

  void _deleteProject(Project project) {
    HapticFeedback.mediumImpact();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Project'),
        content: Text(
          'Are you sure you want to delete "${project.name}"? '
          'Conversations will be moved to uncategorized.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final user = ref.read(currentUserProvider);
              if (user == null) return;

              try {
                await ref.read(projectServiceProvider).deleteProject(
                      project.id,
                      user.email,
                    );
                ref.invalidate(projectsProvider);

                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Deleted "${project.name}"')),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: $e')),
                  );
                }
              }
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _showCreateProjectSheet() {
    final theme = Theme.of(context);
    final nameController = TextEditingController();
    String selectedColor = '#3B82F6';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Create Project',
                    style: AppTypography.titleLarge.copyWith(
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 24),
                  TextField(
                    controller: nameController,
                    autofocus: true,
                    decoration: const InputDecoration(
                      labelText: 'Project Name',
                      hintText: 'e.g., Work, Personal, Learning',
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Color',
                    style: AppTypography.labelMedium.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _ColorPicker(
                    selectedColor: selectedColor,
                    onColorSelected: (color) {
                      selectedColor = color;
                    },
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () async {
                      final name = nameController.text.trim();
                      if (name.isEmpty) return;

                      Navigator.pop(context);
                      final user = ref.read(currentUserProvider);
                      if (user == null) return;

                      try {
                        await ref.read(projectServiceProvider).createProject(
                              userEmail: user.email,
                              name: name,
                              color: selectedColor,
                            );
                        ref.invalidate(projectsProvider);

                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Created "$name"')),
                          );
                        }
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Error: $e')),
                          );
                        }
                      }
                    },
                    child: const Text('Create'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _showEditProjectSheet(Project project) {
    final theme = Theme.of(context);
    final nameController = TextEditingController(text: project.name);
    String selectedColor = project.color;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Edit Project',
                    style: AppTypography.titleLarge.copyWith(
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 24),
                  TextField(
                    controller: nameController,
                    autofocus: true,
                    decoration: const InputDecoration(
                      labelText: 'Project Name',
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Color',
                    style: AppTypography.labelMedium.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _ColorPicker(
                    selectedColor: selectedColor,
                    onColorSelected: (color) {
                      selectedColor = color;
                    },
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () async {
                      final name = nameController.text.trim();
                      if (name.isEmpty) return;

                      Navigator.pop(context);
                      final user = ref.read(currentUserProvider);
                      if (user == null) return;

                      try {
                        await ref.read(projectServiceProvider).updateProject(
                              id: project.id,
                              userEmail: user.email,
                              name: name,
                              color: selectedColor,
                            );
                        ref.invalidate(projectsProvider);

                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Updated "$name"')),
                          );
                        }
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Error: $e')),
                          );
                        }
                      }
                    },
                    child: const Text('Save'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Project card widget.
class _ProjectCard extends StatelessWidget {
  const _ProjectCard({
    required this.project,
    required this.onTap,
    required this.onEdit,
    required this.onDelete,
  });

  final Project project;
  final VoidCallback onTap;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = _parseColor(project.color);

    return GestureDetector(
      onTap: onTap,
      onLongPress: () => _showContextMenu(context),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: theme.colorScheme.outline.withOpacity(0.1),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Icon(
                  _getIcon(project.icon),
                  size: 22,
                  color: color,
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Name
            Text(
              project.name,
              style: AppTypography.titleSmall.copyWith(
                color: theme.colorScheme.onSurface,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),

            const SizedBox(height: 4),

            // Count
            Text(
              '${project.conversationCount} conversations',
              style: AppTypography.bodySmall.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),

            const Spacer(),

            // Color indicator
            Container(
              height: 4,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showContextMenu(BuildContext context) {
    HapticFeedback.mediumImpact();
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.edit_outlined),
                title: const Text('Edit'),
                onTap: () {
                  Navigator.pop(context);
                  onEdit();
                },
              ),
              ListTile(
                leading: Icon(Icons.delete_outline, color: AppColors.error),
                title: Text('Delete', style: TextStyle(color: AppColors.error)),
                onTap: () {
                  Navigator.pop(context);
                  onDelete();
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Color _parseColor(String hex) {
    final colorInt = int.tryParse(hex.replaceFirst('#', ''), radix: 16);
    if (colorInt == null) return Colors.blue;
    return Color(colorInt | 0xFF000000);
  }

  IconData _getIcon(String iconName) {
    switch (iconName) {
      case 'briefcase':
        return Icons.work_outline;
      case 'home':
        return Icons.home_outlined;
      case 'book':
        return Icons.menu_book_outlined;
      case 'code':
        return Icons.code;
      case 'star':
        return Icons.star_outline;
      case 'heart':
        return Icons.favorite_outline;
      default:
        return Icons.folder_outlined;
    }
  }
}

/// Color picker for project colors.
class _ColorPicker extends StatefulWidget {
  const _ColorPicker({
    required this.selectedColor,
    required this.onColorSelected,
  });

  final String selectedColor;
  final ValueChanged<String> onColorSelected;

  @override
  State<_ColorPicker> createState() => _ColorPickerState();
}

class _ColorPickerState extends State<_ColorPicker> {
  late String _selectedColor;

  static const List<String> _colors = [
    '#3B82F6', // Blue
    '#22C55E', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F97316', // Orange
    '#14B8A6', // Teal
  ];

  @override
  void initState() {
    super.initState();
    _selectedColor = widget.selectedColor;
  }

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: _colors.map((color) {
        final isSelected = color == _selectedColor;
        final parsedColor = Color(
          int.parse(color.replaceFirst('#', ''), radix: 16) | 0xFF000000,
        );

        return GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            setState(() => _selectedColor = color);
            widget.onColorSelected(color);
          },
          child: AnimatedContainer(
            duration: AppConfig.microAnimationDuration,
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: parsedColor,
              shape: BoxShape.circle,
              border: isSelected
                  ? Border.all(color: Colors.white, width: 3)
                  : null,
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: parsedColor.withOpacity(0.5),
                        blurRadius: 8,
                        spreadRadius: 2,
                      ),
                    ]
                  : null,
            ),
            child: isSelected
                ? const Icon(Icons.check, size: 18, color: Colors.white)
                : null,
          ),
        );
      }).toList(),
    );
  }
}
