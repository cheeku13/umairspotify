# Harmony Player

A flagship-quality, ultra-performant offline music player built with React Native. Engineered specifically to handle massive local music libraries (10,000+ tracks) effortlessly, Harmony Player provides a premium $50M startup experience with glassmorphism aesthetics, fluid micro-animations, and uncompromised speed.

## 🚀 Key Features

### ⚡ Unmatched Performance
- **Blazing Fast Database:** Powered by `react-native-quick-sqlite` using raw C++ JSI bindings, ensuring metadata queries run in <50ms even with massive collections.
- **FTS5 Search Engine:** Built-in Full-Text Search (FTS5) using SQLite Virtual Tables for instantaneous, typo-tolerant lookups across titles, artists, and albums.
- **In-Memory Folder Traversal:** An ultra-fast custom physical folder view that reconstructs your directory tree in-memory by analyzing indexed tracks, eliminating slow, blocking filesystem calls.
- **Synchronous Global State:** Relies on `Zustand` backed by `MMKV` for state persistence, offering 30x faster read/write speeds than AsyncStorage.

### 🎨 Premium User Experience
- **Fluid Glassmorphism UI:** Features heavy use of `@react-native-community/blur` for real-time backdrop filtering, providing a deep, layered feel.
- **Interactive Micro-Animations:** Built with `react-native-reanimated` for 60FPS fluid physics-based gestures, springing lists, and smooth shared element transitions.
- **Mini Player & Full Player:** A persistent, gesture-driven mini player that smoothly expands into a feature-rich modal with beautiful artwork scaling and immersive background gradients.

### 🎧 Flagship Player Features
- **Intelligent Smart Playlists:** Build dynamic playlists based on custom SQL-driven rules (e.g., "Recently Played", "Most Played", "Never Played") that update automatically.
- **Synchronized Lyrics:** Automatically parses local `.lrc` files side-by-side with your audio files (`song.mp3` -> `song.lrc`) and auto-scrolls to the active lyric line during playback.
- **Listening Insights:** A powerful analytics dashboard utilizing `play_history` to visualize your peak listening hours, daily activity, longest streaks, and top tracks/artists.
- **Sleep Timer:** Fully configurable sleep timer with an elegant "End of Track" functionality, allowing playback to pause naturally as the current song finishes.

## 🏗️ Technical Architecture

Harmony Player strictly follows a highly decoupled **Service-Repository Pattern** to maintain maintainability at scale:

### 1. Database Layer (Repositories)
A strictly typed data layer interacting with SQLite through abstract repositories (`BaseRepository`).
- `TrackRepository`: Handles complex aggregation and FTS5 search indexing.
- `StatsRepository`: Performs heavy lifting for analytical data, extracting insights via raw SQL instead of processing massive arrays in JavaScript.
- `PlaylistRepository`: Manages dynamic resolution of Smart Playlists on-the-fly.

### 2. Service Layer (Business Logic)
Singletons responsible for orchestrating core functionalities. Connected via an internal dependency injection `ServiceContainer`.
- `PlayerService`: Bridges JS with `react-native-track-player`. Handles lifecycle events, queue management, and sleep timer logic.
- `LyricsService`: Parses raw `.lrc` strings into chronologically sorted timestamps.
- `DatabaseService`: Acts as the unified proxy for UI components to query the repositories safely.

### 3. Global Event Bus
An `eventemitter3` instance acts as the central nervous system, decoupling state changes from UI renders. Essential for broadcasting events like `PlaybackStateChanged` or `SleepTimerUpdated`.

## 🛠️ Stack & Technologies

| Category | Technology |
| :--- | :--- |
| **Framework** | React Native (TypeScript) |
| **State Management** | Zustand |
| **Persistence** | react-native-mmkv |
| **Database** | react-native-quick-sqlite |
| **Audio Engine** | react-native-track-player (v4) |
| **Animations** | react-native-reanimated (v3) |
| **Navigation** | React Navigation (v6) |
| **File System** | react-native-fs |
| **Icons** | lucide-react-native |

## 📦 Project Structure

```text
src/
├── components/       # Reusable UI elements (SongCard, LyricsModal, etc.)
├── core/             # ServiceContainer, EventBus, Error boundaries
├── database/         # Schema definitions, SQLite connection
│   └── repositories/ # Data access objects (Track, Playlist, Stats)
├── hooks/            # Custom React hooks (useFolderTree, useDebounce)
├── navigation/       # React Navigation setup and Tab Navigators
├── screens/          # Top-level screen components
├── services/         # Core business logic singletons
├── store/            # Zustand global state slices
├── theme/            # Design system, color palettes, spacing
└── types/            # Global TypeScript interfaces
```

## 💻 Setup & Installation

### Prerequisites
- Node.js (v18+)
- Ruby (for CocoaPods, iOS only)
- Android Studio / Xcode (for local builds)

### Getting Started

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **iOS Setup (macOS only)**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Run the Application**
   - For Android:
     ```bash
     npm run android
     ```
   - For iOS:
     ```bash
     npm run ios
     ```

## 📱 Building the Android APK

### Option 1: GitHub Actions (Recommended — No Local SDK Required)

The project includes a CI workflow that automatically builds a debug-signed APK.

1. **Push to `main`** (or `master`), or open a Pull Request — the build triggers automatically.
2. Alternatively, go to **Actions → Build Android APK → Run workflow** to trigger manually.
3. Once the build completes (~10-15 minutes), download the APK from the **Artifacts** section of the workflow run.

The artifact is named **`harmony-player-debug-apk`** and contains `app-debug.apk`.

### Option 2: Local Build (Requires Android SDK)

If you have Android Studio or the Android SDK installed locally:

```bash
cd android
./gradlew assembleDebug
```

The APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Installing the APK on Android

#### Via ADB (USB Debugging)
```bash
# Ensure your device is connected and USB debugging is enabled
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

#### Via File Transfer (Sideloading)
1. Transfer `app-debug.apk` to your Android device (via USB, email, cloud storage, etc.)
2. On the device, open the file and tap **Install**
3. If prompted, enable **"Install from unknown sources"** in Settings → Security

### Expected APK Artifact Path
```
android/app/build/outputs/apk/debug/app-debug.apk
```

> **Note:** This is a debug-signed APK suitable for testing and development. For production releases, you'll need to generate a release keystore and configure signing in `android/app/build.gradle`.

## 🧪 Running Tests

```bash
npm test -- --runInBand
```

## 🔒 Offline-First Philosophy
Harmony Player guarantees your library stays yours. No cloud syncs, no telemetry, no mandatory accounts. Metadata is extracted natively, artwork is cached efficiently on-disk, and playback works seamlessly whether you're in an airplane or deep underground.

