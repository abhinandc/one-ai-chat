import 'package:flutter_test/flutter_test.dart';
import 'package:oneedge_mobile/shared/models/user.dart';

void main() {
  group('User', () {
    group('fromSupabaseAuth', () {
      test('parses complete user metadata', () {
        final json = {
          'id': 'user-123',
          'email': 'john.doe@example.com',
          'created_at': '2024-01-01T10:00:00.000Z',
          'user_metadata': {
            'full_name': 'John Doe',
            'given_name': 'John',
            'family_name': 'Doe',
            'avatar_url': 'https://example.com/avatar.jpg',
          },
        };

        final user = User.fromSupabaseAuth(json);

        expect(user.id, 'user-123');
        expect(user.email, 'john.doe@example.com');
        expect(user.name, 'John Doe');
        expect(user.givenName, 'John');
        expect(user.familyName, 'Doe');
        expect(user.avatarUrl, 'https://example.com/avatar.jpg');
      });

      test('handles missing metadata', () {
        final json = {
          'id': 'user-123',
          'email': 'test@example.com',
        };

        final user = User.fromSupabaseAuth(json);

        expect(user.id, 'user-123');
        expect(user.email, 'test@example.com');
        expect(user.name, isNull);
        expect(user.givenName, isNull);
        expect(user.familyName, isNull);
        expect(user.avatarUrl, isNull);
      });

      test('uses picture field as fallback for avatar', () {
        final json = {
          'id': 'user-123',
          'email': 'test@example.com',
          'user_metadata': {
            'picture': 'https://example.com/pic.jpg',
          },
        };

        final user = User.fromSupabaseAuth(json);

        expect(user.avatarUrl, 'https://example.com/pic.jpg');
      });

      test('uses name field as fallback for full_name', () {
        final json = {
          'id': 'user-123',
          'email': 'test@example.com',
          'user_metadata': {
            'name': 'Jane Smith',
          },
        };

        final user = User.fromSupabaseAuth(json);

        expect(user.name, 'Jane Smith');
      });
    });

    group('displayName', () {
      test('returns name when available', () {
        final user = User(
          id: '1',
          email: 'test@example.com',
          name: 'John Doe',
        );

        expect(user.displayName, 'John Doe');
      });

      test('returns given + family name when name is null', () {
        final user = User(
          id: '1',
          email: 'test@example.com',
          givenName: 'Jane',
          familyName: 'Smith',
        );

        expect(user.displayName, 'Jane Smith');
      });

      test('returns given name only when family is null', () {
        final user = User(
          id: '1',
          email: 'test@example.com',
          givenName: 'Jane',
        );

        expect(user.displayName, 'Jane');
      });

      test('returns email prefix when no name available', () {
        final user = User(
          id: '1',
          email: 'john.doe@example.com',
        );

        expect(user.displayName, 'john.doe');
      });
    });

    group('initials', () {
      test('returns initials from given and family name', () {
        final user = User(
          id: '1',
          email: 'test@example.com',
          givenName: 'John',
          familyName: 'Doe',
        );

        expect(user.initials, 'JD');
      });

      test('returns initials from full name', () {
        final user = User(
          id: '1',
          email: 'test@example.com',
          name: 'Jane Smith',
        );

        expect(user.initials, 'JS');
      });

      test('returns single initial from single name', () {
        final user = User(
          id: '1',
          email: 'test@example.com',
          name: 'Madonna',
        );

        expect(user.initials, 'M');
      });

      test('returns email initial when no name', () {
        final user = User(
          id: '1',
          email: 'john@example.com',
        );

        expect(user.initials, 'J');
      });
    });

    group('toJson', () {
      test('serializes complete user', () {
        final user = User(
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          givenName: 'Test',
          familyName: 'User',
          avatarUrl: 'https://example.com/avatar.jpg',
          createdAt: DateTime(2024, 1, 1),
        );

        final json = user.toJson();

        expect(json['id'], 'user-123');
        expect(json['email'], 'test@example.com');
        expect(json['name'], 'Test User');
        expect(json['given_name'], 'Test');
        expect(json['family_name'], 'User');
        expect(json['avatar_url'], 'https://example.com/avatar.jpg');
      });
    });

    group('copyWith', () {
      test('creates copy with updated fields', () {
        final original = User(
          id: 'user-123',
          email: 'test@example.com',
          name: 'Original',
        );

        final copy = original.copyWith(name: 'Updated');

        expect(copy.id, original.id);
        expect(copy.name, 'Updated');
        expect(original.name, 'Original');
      });
    });

    group('equality', () {
      test('equal users have same props', () {
        final user1 = User(
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test',
        );

        final user2 = User(
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test',
        );

        expect(user1, user2);
        expect(user1.hashCode, user2.hashCode);
      });

      test('different users are not equal', () {
        final user1 = User(
          id: 'user-123',
          email: 'test1@example.com',
        );

        final user2 = User(
          id: 'user-456',
          email: 'test2@example.com',
        );

        expect(user1, isNot(user2));
      });
    });
  });
}
