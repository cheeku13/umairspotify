# System Documentation — Harmony Player (React Native)

> This document describes the system implemented in this repository: an offline-first music player (“Harmony Player”) built with React Native + TypeScript. It focuses on architecture, modules, data flow, and key technical decisions.

---

## 1. Overview

Harmony Player is an offline-first Android music player with a Spotify-like user experience. It is designed to efficiently handle large local music libraries (10,000+ tracks) by leaning on:

- A high-performance SQLite-backed data layer (`react-native-quick-sqlite`).
- Full-text search (FTS5) inside SQLite.
- A service/repository architecture for maintainability.
- A global state store (Zustand) and persisted settings.
- An audio engine (`react-native-track-player`) for playback.
- A React UI with screens/components, including a mini player and full player modal.

The repository includes:

- **React Native UI** under `src/`.
- **Database schema/migrations** under `database/`.
- **Native iOS bridge code** under `ios/`.
- **Native Android native modules** under `android/app/src/main/java/com/harmony/`.

---

## 2. Repository Structure

### Top-level files/directories

- `README.md` — high-level product description and setup.
- `package.json` — dependencies and scripts.
- `tsconfig.json` — TypeScript configuration.
- `index.js` — React Native entry (typical pattern).
- `jest.config.js`, `jest.setup.js` — test configuration.
- `__tests__/` — Jest tests.
- `database/` — SQLite schema, migrations, and DB file.
- `android/` — Android native modules.
- `ios/` — iOS native modules.
- `src/` — application code.

### `src/` layout

- `src/App.tsx`
- `src/components/*` — UI components (cards, modals, player UI)
- `src/core/*` — event bus, dependency injection container
- `src/database/*` — database initialization + schema/types + repositories
- `src/database/repositories/*` — data access layer (tracks, playlists, stats, etc.)
- `src/hooks/*` — custom hooks (debounce, folder tree)
- `src/navigation/*` — React Navigation setup
- `src/screens/*` — app screens
- `src/services/*` — service singletons implementing business logic
- `src/store/*` — Zustand store(s)
- `src/theme/*` — colors/theme tokens
- `src/types/*` — shared TypeScript interfaces/types
- `src/utils/*` — shared utilities

---

## 3. Architectural Pattern

Harmony Player follows a **Service-Repository pattern**:

1. **Repositories** (`src/database/repositories/*`)
   - Encapsulate SQL and database operations.
   - Provide strongly typed operations for the rest of the system.
   - Examples:
     - `TrackRepository` — track indexing/search and aggregated queries.
     - `StatsRepository` — analytics queries via SQL.
     - `PlaylistRepository` — playlist resolution and smart playlist logic.

2. **Services** (`src/services/*`)
   - Orchestrate workflows across repositories and other system modules.
   - Examples:
     - `PlayerService` (in `player.ts`) — queue + playback lifecycle.
     - `LyricsService` (in `lyrics.ts`) — parse `.lrc` and align to playback.
     - `SearchService` (in `SearchService.ts`) — higher-level search orchestration.
     - `DatabaseService` (in `database.ts`) — UI-safe database operations.

3. **Core wiring** (`src/core/*`)
   - `ServiceContainer` — dependency injection for services.
   - `EventBus` — decouples event emission from UI state updates.

This structure keeps UI components focused on rendering and interaction, while data-heavy and lifecycle-heavy logic stays centralized.

---

## 4. Database Layer

### 4.1 Schema & migrations

The database lives under `database/`:

- `database/schema.sql` — base schema.
- `database/migrations/*.sql` — incremental migrations:
  - `0001_base.sql`
  - `0002_playback_state_and_versioning.sql`
  - `0003_indexes_and_repairs.sql`
  - `0004_repair_triggers.sql`
- `database/harmony.db` — bundled/created DB file.

This supports:
- stable schema evolution,
- indexes/repairs,
- and triggers for maintaining integrity.

### 4.2 Database access

Key modules:
- `src/database/index.ts`
- `src/database/schema.ts`
- `src/database/repositories/sql.ts`

Repositories use raw SQL and typed wrappers for consistent usage.

### 4.3 Repositories overview

- `BaseRepository.ts`
  - Shared helpers for executing queries and mapping results.

- `TrackRepository.ts`
  - Stores track metadata and supports FTS5 search.
  - Likely handles indexing and advanced retrieval queries.

- `SearchRepository.ts`
  - Provides search-specific queries against FTS5 or indexed tables.

- `AlbumRepository.ts`, `ArtistRepository.ts`, `ArtworkRepository.ts`
  - Domain-specific read queries.

- `PlaylistRepository.ts`
  - Smart playlists and dynamic playlist resolution.

- `QueueRepository.ts`
  - Persistence/management of the current play queue.

- `SettingsRepository.ts`
  - Persisted settings.

- `StatsRepository.ts`
  - Analytical queries for Insights (play history, streaks, top tracks).

---

## 5. Playback Layer

Playback is implemented using `react-native-track-player`.

Key service/module:
- `src/services/player.ts`
  - Bridges app-level playback intentions (play/pause/skip/seek, queue updates) to the track player.
  - Manages queue state and events.

Related modules:
- `src/services/queue.ts`
  - Queue-specific orchestration.

- `src/store/musicStore.ts`
  - Zustand state used by UI components.

- `src/core/EventBus.ts`
  - Emits events like playback state changes.

---

## 6. Lyrics Layer

Harmony Player supports synchronized lyrics.

Key service/module:
- `src/services/lyrics.ts`
  - Parses local `.lrc` files.
  - Produces timestamped lyric data.

UI:
- `src/components/LyricsModal.tsx`
  - Displays lyrics and syncs active line to current playback time.

---

## 7. Search & Discovery

Search is designed to be fast and responsive:

- FTS5 is used in SQLite for full-text search.
- Search results are likely rendered via lists of songs/albums/artists.

Modules:
- `src/services/SearchService.ts`
- `src/database/repositories/SearchRepository.ts`
- UI components:
  - `src/components/SearchBar.tsx`
  - `src/screens/DiscoverScreen.tsx`
  - `src/screens/LibraryScreen.tsx`

---

## 8. Folder Tree / Library Indexing

A major performance advantage comes from minimizing expensive filesystem traversal.

Modules:
- `src/services/FileSystemService.ts`
  - Responsible for filesystem access and scanning.

- `src/hooks/useFolderTree.ts`
  - Creates in-memory representations used by UI.

- `src/database/repositories/TrackRepository.ts`
  - Stores indexed results that power the virtual folder representation.

UI:
- `src/components/FolderList.tsx`
  - Renders the virtualized folder tree.

---

## 9. UI Layer

### 9.1 Screens

- `DiscoverScreen.tsx`
- `LibraryScreen.tsx`
- `PlayerScreen.tsx`
- `InsightsScreen.tsx`
- `SettingsScreen.tsx`
- `CreateSmartPlaylistScreen.tsx`

These screens are orchestrated by navigation setup in:
- `src/navigation/AppNavigator.tsx`

### 9.2 Components

Notable components:

- `SongCard.tsx`
  - Renders track cards.

- `AlbumCard.tsx`
  - Renders album cards.

- `MiniPlayer.tsx`
  - Persistent player control surface.

- `LyricsModal.tsx`
  - Synchronized lyrics.

- `SleepTimerModal.tsx`
  - Configures and manages the sleep timer.

- `SleepTimerModal.tsx` and player services
  - Provide “end of track” pausing behavior.

- `SearchBar.tsx`
  - User entry for search queries.

---

## 10. State Management & Persistence

The app uses Zustand for global state and `react-native-mmkv` for fast persistence.

Key module:
- `src/store/musicStore.ts`

Supporting persistence:
- likely `SettingsRepository.ts` for durable settings.

---

## 11. Native Modules

This repo includes platform-specific code to support performance-critical tasks.

### 11.1 Android

- `android/app/src/main/java/com/harmony/HarmonyMetadataModule.kt`
- `android/app/src/main/java/com/harmony/HarmonyPackage.kt`

These are typical React Native native module hooks used for:
- metadata extraction,
- efficient scanning,
- and bridging to JS.

### 11.2 iOS

- `ios/HarmonyMetadata.m`
- `ios/HarmonyMetadata.swift`

These likely provide the iOS equivalent of metadata extraction for the same capabilities.

---

## 12. Testing

Tests live in `__tests__/`.

- `__tests__/database.test.ts`
  - Covers database behavior/queries.

Jest configuration:
- `jest.config.js`
- `jest.setup.js`

---

## 13. Build/Run Commands

From `package.json` scripts:

- Start Metro:
  - `npm run start`

- Android:
  - `npm run android`

- iOS:
  - `npm run ios`

- Tests:
  - `npm run test` (runs Jest)

- Lint:
  - `npm run lint`

- Type check:
  - `npm run type-check`

---

## 14. System Behavior Summary (End-to-End)

A typical app flow based on the implemented modules:

1. **App startup**
   - Initialize database (schema + migrations) and load persisted state.

2. **Library indexing**
   - Scan filesystem using `FileSystemService`.
   - Extract metadata (native modules), then write normalized records into SQLite.
   - Update FTS5 indexes.

3. **UI rendering**
   - Screens request data through `DatabaseService`.
   - Lists (tracks, albums, artists) and folder tree views use indexed records.

4. **Search**
   - `SearchService` queries the FTS5 index via `SearchRepository`.
   - UI updates quickly with results.

5. **Playback**
   - User selects a track; `PlayerService` builds/updates queue.
   - Track player triggers playback events; UI updates via Zustand/event bus.

6. **Lyrics**
   - When lyrics are available, `LyricsService` parses `.lrc`.
   - Lyrics modal syncs to playback time.

7. **Insights**
   - `StatsRepository` uses SQL to compute insights from `play_history`.

8. **Smart playlists**
   - Smart playlists are resolved dynamically through `PlaylistRepository`.

---

## 15. Notes on Performance

Design choices implied by the repository structure:

- Move heavy computation (search, aggregations, stats) into SQLite.
- Use FTS5 to avoid full JS filtering.
- Avoid slow directory traversal at render time (use in-memory folder tree derived from indexed data).
- Use Zustand + MMKV for fast global state persistence.
- Use native modules for metadata extraction/scanning.

---

## 16. Appendix: Key Files

Database:
- `database/schema.sql`
- `database/migrations/*`
- `src/database/index.ts`
- `src/database/repositories/*`

Playback/lyrics/services:
- `src/services/player.ts`
- `src/services/queue.ts`
- `src/services/lyrics.ts`
- `src/services/SearchService.ts`
- `src/services/FileSystemService.ts`

UI:
- `src/navigation/AppNavigator.tsx`
- `src/screens/*`
- `src/components/*`

Native:
- `android/app/src/main/java/com/harmony/*`
- `ios/HarmonyMetadata.*`

---

*End of document.*

