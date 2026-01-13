import 'package:flutter_test/flutter_test.dart';
import 'package:oneedge_mobile/shared/models/conversation.dart';
import 'package:oneedge_mobile/shared/models/chat_message.dart';

void main() {
  group('Conversation', () {
    group('fromJson', () {
      test('parses valid JSON correctly', () {
        final json = {
          'id': 'conv-123',
          'user_email': 'user@example.com',
          'title': 'Test Conversation',
          'messages': [
            {
              'id': 'msg-1',
              'role': 'user',
              'content': 'Hello',
              'timestamp': '2024-01-01T12:00:00.000Z',
            },
            {
              'id': 'msg-2',
              'role': 'assistant',
              'content': 'Hi there!',
              'model': 'gpt-4',
              'timestamp': '2024-01-01T12:00:01.000Z',
            },
          ],
          'folder_id': 'folder-1',
          'pinned': true,
          'shared': false,
          'unread': true,
          'tags': ['work', 'important'],
          'settings': {'model': 'gpt-4', 'temperature': 0.7},
          'created_at': '2024-01-01T10:00:00.000Z',
          'updated_at': '2024-01-01T12:00:01.000Z',
        };

        final conversation = Conversation.fromJson(json);

        expect(conversation.id, 'conv-123');
        expect(conversation.userEmail, 'user@example.com');
        expect(conversation.title, 'Test Conversation');
        expect(conversation.messages.length, 2);
        expect(conversation.messages[0].content, 'Hello');
        expect(conversation.messages[1].content, 'Hi there!');
        expect(conversation.folderId, 'folder-1');
        expect(conversation.pinned, true);
        expect(conversation.shared, false);
        expect(conversation.unread, true);
        expect(conversation.tags, ['work', 'important']);
        expect(conversation.model, 'gpt-4');
        expect(conversation.temperature, 0.7);
      });

      test('handles missing optional fields', () {
        final json = {
          'id': 'conv-123',
          'user_email': 'user@example.com',
          'title': 'Test',
          'messages': [],
          'settings': {},
          'created_at': '2024-01-01T10:00:00.000Z',
          'updated_at': '2024-01-01T10:00:00.000Z',
        };

        final conversation = Conversation.fromJson(json);

        expect(conversation.folderId, isNull);
        expect(conversation.pinned, false);
        expect(conversation.shared, false);
        expect(conversation.unread, false);
        expect(conversation.tags, isEmpty);
      });
    });

    group('toJson', () {
      test('converts to valid JSON', () {
        final conversation = Conversation(
          id: 'conv-123',
          userEmail: 'user@example.com',
          title: 'Test',
          messages: [
            ChatMessage.user(id: 'msg-1', content: 'Hello'),
          ],
          pinned: true,
          tags: ['test'],
          settings: {'model': 'gpt-4'},
          createdAt: DateTime(2024, 1, 1),
          updatedAt: DateTime(2024, 1, 1),
        );

        final json = conversation.toJson();

        expect(json['id'], 'conv-123');
        expect(json['user_email'], 'user@example.com');
        expect(json['title'], 'Test');
        expect(json['messages'], isA<List>());
        expect(json['pinned'], true);
        expect(json['tags'], ['test']);
      });
    });

    group('copyWith', () {
      test('creates copy with updated fields', () {
        final original = Conversation(
          id: 'conv-123',
          userEmail: 'user@example.com',
          title: 'Original',
          messages: [],
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        final copy = original.copyWith(
          title: 'Updated',
          pinned: true,
        );

        expect(copy.id, original.id);
        expect(copy.title, 'Updated');
        expect(copy.pinned, true);
        expect(original.title, 'Original');
        expect(original.pinned, false);
      });
    });

    group('lastMessage', () {
      test('returns null for empty messages', () {
        final conversation = Conversation(
          id: 'conv-123',
          userEmail: 'user@example.com',
          title: 'Test',
          messages: [],
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        expect(conversation.lastMessage, isNull);
      });

      test('returns last message', () {
        final conversation = Conversation(
          id: 'conv-123',
          userEmail: 'user@example.com',
          title: 'Test',
          messages: [
            ChatMessage.user(id: '1', content: 'First'),
            ChatMessage.assistant(id: '2', content: 'Second'),
            ChatMessage.user(id: '3', content: 'Third'),
          ],
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        expect(conversation.lastMessage?.content, 'Third');
      });
    });
  });
}
