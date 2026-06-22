import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { databaseService } from './services/database';
import { metadataService } from './services/metadata';
import { playerService } from './services/player';
import { queueService } from './services/queue';
import { useMusicStore } from './store/musicStore';

const App: React.FC = () => {
  const initialized = useMusicStore(state => state.initialized);
  const initializationError = useMusicStore(state => state.initializationError);
  const setInitialized = useMusicStore(state => state.setInitialized);
  const setInitializationError = useMusicStore(state => state.setInitializationError);
  const setLibrary = useMusicStore(state => state.setLibrary);
  const setLibrarySnapshot = useMusicStore(state => state.setLibrarySnapshot);
  const setQueue = useMusicStore(state => state.setQueue);
  const setPlayback = useMusicStore(state => state.setPlayback);
  const setSettings = useMusicStore(state => state.setSettings);

  useEffect(() => {
    let mounted = true;
    let unsubscribePlayback: (() => void) | null = null;

    const initialize = async (): Promise<void> => {
      try {
        await databaseService.initialize();
        metadataService.initialize();
        await playerService.initialize();
        const [queue, tracks, albums, artists, playlists, snapshot, settings] = await Promise.all([
          queueService.initialize(),
          databaseService.getTracks(),
          databaseService.getAlbums(),
          databaseService.getArtists(),
          databaseService.getPlaylists(),
          databaseService.getLibrarySnapshot(),
          databaseService.getSettings(),
        ]);

        if (!mounted) {
          return;
        }

        setQueue(queue);
        setLibrary(tracks, albums, artists, playlists);
        setLibrarySnapshot(snapshot);
        setSettings(settings);
        unsubscribePlayback = playerService.subscribe(setPlayback);
        setInitialized(true);
      } catch (error) {
        if (mounted) {
          setInitializationError(error instanceof Error ? error.message : 'Harmony Player failed to start');
        }
      }
    };

    void initialize();

    return () => {
      mounted = false;
      unsubscribePlayback?.();
    };
  }, [
    setInitialized,
    setInitializationError,
    setLibrary,
    setLibrarySnapshot,
    setPlayback,
    setQueue,
    setSettings,
  ]);

  if (initializationError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Harmony Player</Text>
        <Text style={styles.errorText}>{initializationError}</Text>
      </View>
    );
  }

  if (!initialized) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Harmony Player</Text>
        <ActivityIndicator color="#1DB954" size="large" />
      </View>
    );
  }

  return <AppNavigator />;
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    paddingHorizontal: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default App;
