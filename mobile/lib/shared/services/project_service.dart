import 'package:oneedge_mobile/shared/models/project.dart';
import 'package:oneedge_mobile/shared/services/supabase_service.dart';

/// Service for project (conversation_folders) CRUD operations.
///
/// Uses the conversation_folders table from Supabase, mapped to Project model.
class ProjectService {
  const ProjectService();

  /// Get the Supabase client.
  static get _client => SupabaseService.client;

  /// Fetch all projects for a user.
  Future<List<Project>> getProjects(String userEmail) async {
    final response = await _client
        .from('conversation_folders')
        .select()
        .eq('user_email', userEmail)
        .order('created_at', ascending: false);

    return (response as List)
        .map((json) => Project.fromFolderJson(json as Map<String, dynamic>))
        .toList();
  }

  /// Fetch a single project by ID.
  Future<Project?> getProject(String id, String userEmail) async {
    final response = await _client
        .from('conversation_folders')
        .select()
        .eq('id', id)
        .eq('user_email', userEmail)
        .maybeSingle();

    if (response == null) return null;
    return Project.fromFolderJson(response);
  }

  /// Create a new project.
  Future<Project> createProject({
    required String userEmail,
    required String name,
    String? description,
    String color = '#E5A84B',
    String icon = 'folder',
  }) async {
    final response = await _client
        .from('conversation_folders')
        .insert({
          'user_email': userEmail,
          'name': name,
          'color': 'bg-accent-${_getColorName(color)}',
        })
        .select()
        .single();

    return Project.fromFolderJson(response);
  }

  /// Update a project.
  Future<Project> updateProject({
    required String id,
    required String userEmail,
    String? name,
    String? color,
  }) async {
    final updates = <String, dynamic>{};

    if (name != null) updates['name'] = name;
    if (color != null) updates['color'] = 'bg-accent-${_getColorName(color)}';

    final response = await _client
        .from('conversation_folders')
        .update(updates)
        .eq('id', id)
        .eq('user_email', userEmail)
        .select()
        .single();

    return Project.fromFolderJson(response);
  }

  /// Delete a project.
  Future<void> deleteProject(String id, String userEmail) async {
    await _client
        .from('conversation_folders')
        .delete()
        .eq('id', id)
        .eq('user_email', userEmail);
  }

  /// Get conversations count for a project.
  Future<int> getConversationCount(String folderId, String userEmail) async {
    final response = await _client
        .from('conversations')
        .select('id')
        .eq('user_email', userEmail)
        .eq('folder_id', folderId);

    return (response as List).length;
  }

  /// Get projects with conversation counts.
  Future<List<Project>> getProjectsWithCounts(String userEmail) async {
    final projects = await getProjects(userEmail);
    final projectsWithCounts = <Project>[];

    for (final project in projects) {
      final count = await getConversationCount(project.id, userEmail);
      projectsWithCounts.add(project.copyWith(
        conversationIds: List.generate(count, (_) => ''),
      ));
    }

    return projectsWithCounts;
  }

  /// Convert hex color to color name.
  String _getColorName(String hex) {
    const colorMap = {
      '#3B82F6': 'blue',
      '#22C55E': 'green',
      '#F59E0B': 'yellow',
      '#EF4444': 'red',
      '#8B5CF6': 'purple',
      '#EC4899': 'pink',
      '#F97316': 'orange',
      '#14B8A6': 'teal',
      '#6366F1': 'indigo',
      '#06B6D4': 'cyan',
      '#E5A84B': 'yellow',
    };
    return colorMap[hex] ?? 'blue';
  }
}
