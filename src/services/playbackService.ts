import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * Background playback service for react-native-track-player.
 * This runs in a separate JavaScript engine when the app is backgrounded.
 *
 * Registered in index.js via:
 *   TrackPlayer.registerPlaybackService(() => require('./src/services/playbackService').default);
 */
const playbackService = async () => {
  // Handle remote control events (headphones, lock screen, notification)

  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, (e) => TrackPlayer.seekTo(e.position));

  // Handle playback lifecycle events
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, (_e) => {
    // Queue finished — you may want to reset state, play next album, etc.
    // Update your Zustand store or emit EventBus event here.
  });

  TrackPlayer.addEventListener(Event.PlaybackTrackChanged, (_e) => {
    // Track changed — update current track in store, load lyrics, etc.
  });

  TrackPlayer.addEventListener(Event.PlaybackState, (_e) => {
    // Playback state changed (playing, paused, buffering, etc.)
    // Update your Zustand store's isPlaying state here.
  });

  TrackPlayer.addEventListener(Event.PlaybackError, (e) => {
    console.error('[HarmonyPlayer] Playback error:', e);
  });
};

export default playbackService;
