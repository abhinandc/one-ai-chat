# OneEdge Mobile App

Enterprise AI Platform mobile application built with Flutter.

## Overview

OneEdge Mobile provides employees with access to multiple AI models through a ChatGPT-style interface, featuring:

- **Chat**: Conversation interface with model selection
- **Sia**: Voice assistant with ElevenLabs integration
- **Projects**: Organize conversations into folders
- **Profile**: Theme switching and preferences

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Flutter 3.x |
| State Management | Riverpod |
| Database | Supabase (shared with web) |
| Navigation | go_router |
| Voice | ElevenLabs SDK |
| Animations | flutter_animate |

## Getting Started

### Prerequisites

- Flutter SDK 3.2.0 or higher
- Dart SDK 3.2.0 or higher
- iOS: Xcode 15+
- Android: Android Studio + SDK

### Installation

```bash
# Install dependencies
flutter pub get

# Generate code (freezed, riverpod_generator, etc.)
flutter pub run build_runner build --delete-conflicting-outputs

# Run on device/emulator
flutter run
```

### Environment Configuration

Create a `.env` file or pass environment variables at build time:

```bash
flutter run --dart-define=SUPABASE_URL=your_url --dart-define=SUPABASE_ANON_KEY=your_key
```

Required environment variables:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `ELEVENLABS_API_KEY`: ElevenLabs API key (for Sia)
- `SIA_VOICE_ID`: ElevenLabs voice ID
- `API_PROXY_URL`: AI model API proxy URL

## Project Structure

```
lib/
├── core/
│   ├── config/          # App configuration
│   ├── theme/           # Theme and colors
│   ├── routing/         # Navigation
│   └── di/              # Dependency injection (providers)
├── features/
│   ├── auth/            # Authentication
│   │   ├── data/        # Repository
│   │   └── presentation/# Screens
│   ├── chat/            # Chat feature
│   │   ├── data/        # Repository
│   │   ├── domain/      # Models
│   │   └── presentation/# Screens
│   ├── sia/             # Voice assistant
│   ├── projects/        # Conversation organization
│   └── profile/         # User settings
├── shared/
│   ├── models/          # Shared data models
│   ├── services/        # Shared services
│   └── widgets/         # Reusable widgets
└── main.dart
```

## Features

### Authentication

- Google SSO via Supabase Auth
- Session persistence
- Same auth as web app

### Chat

- ChatGPT-style interface
- Model modes: Thinking, Fast, Coding
- Real-time streaming responses
- Conversation history
- Search and filtering

### Sia Voice Assistant

- Push-to-talk voice input
- ElevenLabs voice synthesis
- Persistent memory
- Quick actions

### Projects

- Create/edit/delete projects
- Color-coded organization
- Conversation assignment

### Themes

- Light/Dark mode
- Warm (gold/coral) theme
- Purple/Rose theme
- System theme following

## Design System

### Colors (OKLCH)

Warm Theme Primary: `oklch(0.874 0.087 73.746)` - Gold
Purple Theme Primary: `oklch(0.205 0.032 295.665)` - Deep purple

### Typography

Font: Inter (with system fallbacks)
Scale: Material Design 3 type scale

### Spacing

Base unit: 4px
Scale: 4, 8, 12, 16, 24, 32, 48, 64

### Touch Targets

Minimum: 44x44pt (Apple HIG compliance)

## Testing

```bash
# Unit tests
flutter test

# Integration tests
flutter test integration_test

# Coverage
flutter test --coverage
```

## Building

### iOS

```bash
flutter build ios --release
```

Distribute via TestFlight for internal testing.

### Android

```bash
flutter build apk --release
flutter build appbundle --release
```

Distribute via Managed Google Play for enterprise.

## Contributing

1. Follow the constitution in `/CLAUDE.md`
2. Write tests for new features
3. Ensure 60fps animations
4. Test on both iOS and Android
5. Test light and dark modes

## License

Proprietary - OneOrigin
