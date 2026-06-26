import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { Track } from '@apptypes/index';
import { BlurView } from '@react-native-community/blur';
import { Play, Pause, ChevronUp } from 'lucide-react-native';
import { colors, shadows } from '../theme/colors';

interface MiniPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onExpand: () => void;
}

const WaveformBar = ({ isPlaying, delay = 0 }: { isPlaying: boolean; delay?: number }) => {
  const height = useSharedValue(4);

  useEffect(() => {
    if (isPlaying) {
      setTimeout(() => {
        height.value = withRepeat(
          withSequence(
            withTiming(12 + Math.random() * 8, { duration: 300 }),
            withTiming(4, { duration: 300 })
          ),
          -1,
          true
        );
      }, delay);
    } else {
      height.value = withTiming(4, { duration: 300 });
    }
  }, [isPlaying, delay, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.waveBar, animatedStyle]} />;
};

const MiniPlayer: React.FC<MiniPlayerProps> = ({
  track,
  isPlaying,
  onPlayPause,
  onExpand,
}) => {
  if (!track) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.container, shadows.soft]}
      onPress={onExpand}
      activeOpacity={0.9}
    >
      <View style={styles.blurContainer}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={20}
          reducedTransparencyFallbackColor={colors.background.card}
        />
        
        <View style={styles.content}>
          {/* Album Art */}
          <View style={styles.artworkContainer}>
            {track.artworkUri ? (
              <Image
                source={{ uri: track.artworkUri }}
                style={styles.artwork}
              />
            ) : (
              <View style={[styles.artwork, styles.placeholderArtwork]}>
                <Text style={styles.placeholderText}>♪</Text>
              </View>
            )}
            
            {/* Playing Indicator Overlay */}
            {isPlaying && (
              <View style={styles.waveformContainer}>
                <WaveformBar isPlaying={isPlaying} delay={0} />
                <WaveformBar isPlaying={isPlaying} delay={150} />
                <WaveformBar isPlaying={isPlaying} delay={300} />
              </View>
            )}
          </View>

          {/* Track Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {track.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {track.artistName}
            </Text>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={onPlayPause}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isPlaying ? (
                <Pause color={colors.text.primary} size={24} fill={colors.text.primary} />
              ) : (
                <Play color={colors.text.primary} size={24} fill={colors.text.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={onExpand}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronUp color={colors.text.secondary} size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 75, // Above the bottom tab bar (height 65 + 10 margin)
    left: 10,
    right: 10,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden', // Need this to keep blur view rounded, but shadow might be clipped.
  },
  blurContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.light,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  artworkContainer: {
    position: 'relative',
    marginRight: 12,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.brand.primary,
  },
  placeholderArtwork: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    color: colors.background.primary,
  },
  waveformContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass.dark,
    borderRadius: 10,
    gap: 3,
  },
  waveBar: {
    width: 3,
    backgroundColor: colors.brand.primary,
    borderRadius: 2,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  artist: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
  },
  controlButton: {
    padding: 8,
  },
});

export default MiniPlayer;
