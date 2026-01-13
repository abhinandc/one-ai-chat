import 'package:flutter_test/flutter_test.dart';
import 'package:oneedge_mobile/shared/models/chat_message.dart';

void main() {
  group('ChatMessage', () {
    group('fromJson', () {
      test('parses user message correctly', () {
        final json = {
          'id': 'msg-1',
          'role': 'user',
          'content': 'Hello, world!',
          'timestamp': '2024-01-01T12:00:00.000Z',
        };

        final message = ChatMessage.fromJson(json);

        expect(message.id, 'msg-1');
        expect(message.role, MessageRole.user);
        expect(message.content, 'Hello, world!');
        expect(message.isUser, true);
        expect(message.isAssistant, false);
      });

      test('parses assistant message correctly', () {
        final json = {
          'id': 'msg-2',
          'role': 'assistant',
          'content': 'Hello! How can I help?',
          'model': 'gpt-4',
          'tokens': 150,
          'timestamp': '2024-01-01T12:00:01.000Z',
        };

        final message = ChatMessage.fromJson(json);

        expect(message.id, 'msg-2');
        expect(message.role, MessageRole.assistant);
        expect(message.content, 'Hello! How can I help?');
        expect(message.model, 'gpt-4');
        expect(message.tokens, 150);
        expect(message.isAssistant, true);
        expect(message.isUser, false);
      });

      test('parses system message correctly', () {
        final json = {
          'id': 'msg-3',
          'role': 'system',
          'content': 'You are a helpful assistant.',
          'timestamp': '2024-01-01T12:00:00.000Z',
        };

        final message = ChatMessage.fromJson(json);

        expect(message.role, MessageRole.system);
        expect(message.isSystem, true);
      });

      test('handles streaming message', () {
        final json = {
          'id': 'msg-4',
          'role': 'assistant',
          'content': 'Typing...',
          'isStreaming': true,
          'timestamp': '2024-01-01T12:00:00.000Z',
        };

        final message = ChatMessage.fromJson(json);

        expect(message.isStreaming, true);
      });

      test('handles error message', () {
        final json = {
          'id': 'msg-5',
          'role': 'assistant',
          'content': '',
          'error': 'API rate limit exceeded',
          'timestamp': '2024-01-01T12:00:00.000Z',
        };

        final message = ChatMessage.fromJson(json);

        expect(message.hasError, true);
        expect(message.error, 'API rate limit exceeded');
      });
    });

    group('factory constructors', () {
      test('ChatMessage.user creates user message', () {
        final message = ChatMessage.user(
          id: 'msg-1',
          content: 'Hello',
        );

        expect(message.role, MessageRole.user);
        expect(message.content, 'Hello');
        expect(message.isStreaming, false);
      });

      test('ChatMessage.assistant creates assistant message', () {
        final message = ChatMessage.assistant(
          id: 'msg-2',
          content: 'Hi there!',
          model: 'claude-3-opus',
          tokens: 50,
        );

        expect(message.role, MessageRole.assistant);
        expect(message.content, 'Hi there!');
        expect(message.model, 'claude-3-opus');
        expect(message.tokens, 50);
      });

      test('ChatMessage.system creates system message', () {
        final message = ChatMessage.system(
          id: 'msg-3',
          content: 'You are helpful.',
        );

        expect(message.role, MessageRole.system);
        expect(message.content, 'You are helpful.');
      });
    });

    group('toJson', () {
      test('serializes complete message', () {
        final message = ChatMessage(
          id: 'msg-1',
          role: MessageRole.assistant,
          content: 'Hello!',
          model: 'gpt-4',
          tokens: 100,
          isStreaming: false,
          timestamp: DateTime(2024, 1, 1, 12, 0, 0),
        );

        final json = message.toJson();

        expect(json['id'], 'msg-1');
        expect(json['role'], 'assistant');
        expect(json['content'], 'Hello!');
        expect(json['model'], 'gpt-4');
        expect(json['tokens'], 100);
        expect(json['isStreaming'], false);
      });

      test('excludes null fields', () {
        final message = ChatMessage.user(
          id: 'msg-1',
          content: 'Hello',
        );

        final json = message.toJson();

        expect(json.containsKey('model'), false);
        expect(json.containsKey('tokens'), false);
        expect(json.containsKey('error'), false);
      });
    });

    group('copyWith', () {
      test('creates copy with updated content', () {
        final original = ChatMessage.assistant(
          id: 'msg-1',
          content: 'Original',
          isStreaming: true,
        );

        final copy = original.copyWith(
          content: 'Updated',
          isStreaming: false,
        );

        expect(copy.id, original.id);
        expect(copy.content, 'Updated');
        expect(copy.isStreaming, false);
        expect(original.content, 'Original');
        expect(original.isStreaming, true);
      });
    });
  });

  group('MessageRole', () {
    test('fromString parses correctly', () {
      expect(MessageRole.fromString('user'), MessageRole.user);
      expect(MessageRole.fromString('assistant'), MessageRole.assistant);
      expect(MessageRole.fromString('system'), MessageRole.system);
      expect(MessageRole.fromString('USER'), MessageRole.user);
      expect(MessageRole.fromString('unknown'), MessageRole.user);
    });
  });
}
