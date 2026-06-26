import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useMusicStore } from '@store/musicStore';
import { queueService } from '@services/queue';
import { metadataService } from '@services/metadata';
import {
  Heart,
  Mic2,
  ListMusic,
  Moon,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  ChevronDown,
} from 'lucide-react-native';
import { SleepTimerModal, LyricsModal, SongCard } from '@components/index';
import { colors, shadows } from '../theme/colors';
import { BlurView } from '@react-native-community/blur';

const { width, height } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const PlayerScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const {
    tracks,
    playback,
    queue,
    playTrack,
    setPlayback,
    patchPlayback,
    toggleFavorite,
    sleepTimer,
    setCurrentTrackId,
    setIsPlaying,
    setCurrentTime,
    setRepeatMode,
  } = useMusicStore();

  const currentTrackId = playback.currentTrackId;
  const isPlaying = playback.status === 'playing';
  const currentTime = playback.positionMs;

  const [showQueue, setShowQueue] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const queueTranslateY = useSharedValue(height);
  const artworkScale = useSharedValue(1);

  const toggleShuffle = async () => {
    const newQueue = await queueService.toggleShuffle();
    // update store queue for UI responsiveness
    useMusicStore.getState().setQueue(newQueue);
  };

  const setRepeatModeLocal = (mode: 'off' | 'one' | 'all') => {
    // propagate to queue and playback
    setRepeatMode(mode);
  };

  const _setCurrentTime = (time: number) => {
    patchPlayback({ positionMs: time });
  };

  const currentTrack = tracks.find(t => t.id === currentTrackId);
  const duration = currentTrack?.durationMs || 0;

  useEffect(() => {
    if (isPlaying) {
      artworkScale.value = withSpring(1.02, { damping: 12, stiffness: 100 });
    } else {
      artworkScale.value = withSpring(0.95, { damping: 12, stiffness: 100 });
    }
  }, [isPlaying, artworkScale]);

  const toggleQueue = () => {
    if (showQueue) {
      queueTranslateY.value = withSpring(height, { damping: 20, stiffness: 90 });
      setTimeout(() => setShowQueue(false), 300);
    } else {
      setShowQueue(true);
      queueTranslateY.value = withSpring(0, { damping: 20, stiffness: 90 });
    }
  };

  const queueStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: queueTranslateY.value }],
    };
  });

  const artworkStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: artworkScale.value }],
    };
  });

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  const handleNextTrack = useCallback(() => {
    const nextIndex = queueService.getNextTrackIndex();
    if (nextIndex !== null) {
      const nextTrackId = queue.trackIds[nextIndex];
      setCurrentTrackId(nextTrackId);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  }, [queue, setCurrentTrackId, setCurrentTime, setIsPlaying]);

  const handlePreviousTrack = useCallback(() => {
    if (currentTime > 3) {
      setCurrentTime(0);
    } else {
      const prevIndex = queueService.getPreviousTrackIndex();
      if (prevIndex !== null) {
        const prevTrackId = queue.trackIds[prevIndex];
        setCurrentTrackId(prevTrackId);
        setCurrentTime(0);
      }
    }
  }, [currentTime, setCurrentTime, queue, setCurrentTrackId]);

  const handleSeek = useCallback((value: number) => {
    setCurrentTime(value);
  }, [setCurrentTime]);

  const handleToggleFavorite = useCallback(() => {
    if (currentTrackId && currentTrack) {
      toggleFavorite(currentTrackId, !currentTrack.isFavorite);
    }
  }, [currentTrackId, toggleFavorite, currentTrack]);

  const handleRepeatMode = useCallback(() => {
    const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all'];
    const currentMode = queue.repeatMode;
    const currentIndex = modes.indexOf(currentMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatModeLocal(nextMode);
  }, [queue.repeatMode, setRepeatModeLocal]);

  if (!currentTrack) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No track selected</Text>
      </View>
    );
  }

  // Generate a pseudo-dynamic gradient based on track title length just for variation
  const hue = (currentTrack.title.length * 15) % 360;
  const topColor = `hsl(${hue}, 40%, 15%)`;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[topColor, colors.background.primary]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <ChevronDown color={colors.text.primary} size={28} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSubtitle}>PLAYING FROM ALBUM</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{currentTrack.albumTitle || currentTrack.artistName}</Text>
          </View>
          <TouchableOpacity style={styles.headerButton}>
            {/* Options button placeholder */}
          </TouchableOpacity>
        </View>

        {/* Artwork */}
        <View style={styles.artworkContainer}>
          <Animated.View style={[styles.artworkWrapper, artworkStyle, shadows.glow]}>
            {currentTrack.artworkUri ? (
              <Image 
              source={{ uri: currentTrack?.artworkUri || '' }} 
              style={styles.artwork} 
            />) : (
              <View style={[styles.artwork, styles.placeholderArtwork]}>
                <Text style={styles.placeholderText}>♪</Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* Track Info & Actions */}
        <View style={styles.infoActionsContainer}>
          <View style={styles.infoContainer}>
            <Text style={styles.title} numberOfLines={1}>{currentTrack?.title || 'No track playing'}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentTrack?.artistName || 'Unknown Artist'}</Text>
          </View>
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
            <Heart 
              color={currentTrack.isFavorite ? colors.brand.primary : colors.text.primary} 
              size={28} 
              fill={currentTrack.isFavorite ? colors.brand.primary : 'transparent'} 
            />
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration / 1000}
            value={currentTime}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor={colors.text.primary}
            maximumTrackTintColor={colors.glass.medium}
            thumbTintColor={colors.text.primary}
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{metadataService.formatDuration(currentTime * 1000)}</Text>
            <Text style={styles.timeText}>{metadataService.formatDuration(duration)}</Text>
          </View>
        </View>

        {/* Main Controls */}
        <View style={styles.mainControls}>
          <TouchableOpacity onPress={() => toggleShuffle()} style={styles.controlButton}>
            <Shuffle color={queue.shuffleEnabled ? colors.brand.primary : colors.text.secondary} size={24} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePreviousTrack} style={styles.controlButton}>
            <SkipBack color={colors.text.primary} size={36} fill={colors.text.primary} />
          </TouchableOpacity>

          <AnimatedTouchableOpacity
            onPress={handlePlayPause}
            style={[styles.playButtonWrapper, shadows.glow]}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.brand.primary, '#158C3E']}
              style={styles.playButton}
            >
              {isPlaying ? (
                <Pause color={colors.background.primary} size={32} fill={colors.background.primary} />
              ) : (
                <Play color={colors.background.primary} size={32} fill={colors.background.primary} style={{ marginLeft: 4 }} />
              )}
            </LinearGradient>
          </AnimatedTouchableOpacity>

          <TouchableOpacity onPress={handleNextTrack} style={styles.controlButton}>
            <SkipForward color={colors.text.primary} size={36} fill={colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRepeatMode} style={styles.controlButton}>
            {queue.repeatMode === 'one' ? (
              <Repeat1 color={colors.brand.primary} size={24} />
            ) : (
              <Repeat color={queue.repeatMode === 'all' ? colors.brand.primary : colors.text.secondary} size={24} />
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity onPress={() => setShowSleepTimer(true)} style={styles.bottomActionButton}>
            <Moon color={sleepTimer.active ? colors.brand.primary : colors.text.secondary} size={22} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowLyrics(true)} style={styles.bottomActionButton}>
            <Mic2 color={colors.text.secondary} size={22} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleQueue} style={styles.bottomActionButton}>
            <ListMusic color={colors.text.primary} size={22} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Queue Modal overlay */}
      {showQueue && (
        <Animated.View style={[styles.queueContainer, queueStyle]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={25}
            reducedTransparencyFallbackColor={colors.background.primary}
          />
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.queueHeader}>
              <Text style={styles.queueTitle}>Up Next</Text>
              <TouchableOpacity onPress={toggleQueue} style={styles.queueCloseButton}>
                <ChevronDown color={colors.text.primary} size={32} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.queueList}>
              {queue.trackIds.map((trackId, index) => {
                const track = tracks.find(t => t.id === trackId);
                if (!track) return null;
                return (
                  <SongCard
                    key={track.id}
                    track={track}
                    isPlaying={currentTrackId === track.id && isPlaying}
                    onPress={() => playTrack(track)}
                  />
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* Sleep Timer Modal */}
      <SleepTimerModal 
        visible={showSleepTimer} 
        onClose={() => setShowSleepTimer(false)} 
      />

      {/* Lyrics Modal */}
      <LyricsModal 
        visible={showLyrics} 
        onClose={() => setShowLyrics(false)} 
        track={currentTrack} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  emptyText: {
    fontSize: 18,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: '50%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 60,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 20,
  },
  artworkWrapper: {
    width: width - 60,
    height: width - 60,
    borderRadius: 16,
    backgroundColor: colors.background.elevated,
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  placeholderArtwork: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 80,
    color: colors.text.secondary,
  },
  infoActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  infoContainer: {
    flex: 1,
    paddingRight: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  artist: {
    fontSize: 18,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  favoriteButton: {
    padding: 10,
  },
  progressContainer: {
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  controlButton: {
    padding: 10,
  },
  playButtonWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  playButton: {
    flex: 1,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: 30,
  },
  bottomActionButton: {
    padding: 10,
  },
  queueContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  queueTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  queueCloseButton: {
    padding: 8,
  },
  queueList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glass.light,
  },
  queueItemActive: {
    backgroundColor: colors.glass.light,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginHorizontal: -10,
    borderBottomWidth: 0,
  },
  queueItemNumber: {
    width: 30,
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  playingIndicator: {
    width: 30,
    alignItems: 'flex-start',
  },
  queueItemInfo: {
    flex: 1,
  },
  queueItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  queueItemTitleActive: {
    color: colors.brand.primary,
  },
  queueItemArtist: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});

export default PlayerScreen;
