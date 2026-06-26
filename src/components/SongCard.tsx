import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Track } from '@apptypes/index';
import { Heart, Download } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface SongCardProps {
  track: Track;
  isPlaying?: boolean;
  onPress: () => void;
  onFavoritePress?: (trackId: string, favorite: boolean) => void;
  isImporting?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const SongCard: React.FC<SongCardProps> = ({
  track,
  isPlaying = false,
  onPress,
  onFavoritePress,
  isImporting = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  return (
    <AnimatedTouchableOpacity
      style={[styles.container, animatedStyle, isPlaying && styles.playingContainer]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.artworkContainer}>
          {track.artworkUri ? (
            <Image source={{ uri: track.artworkUri }} style={styles.artwork} />
          ) : (
            <View style={[styles.artwork, styles.placeholderArtwork]}>
              <Text style={styles.placeholderText}>♪</Text>
            </View>
          )}
          {isImporting && (
            <View style={styles.overlay}>
              <ActivityIndicator size="small" color={colors.brand.primary} />
            </View>
          )}
          {isPlaying && (
            <View style={styles.playingIndicator}>
              <View style={styles.playingBar1} />
              <View style={styles.playingBar2} />
              <View style={styles.playingBar3} />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.title, isPlaying && styles.playingTitle]} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {track.artistName}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {track.albumTitle} · {formatDuration(track.durationMs)}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          {!track.localFilePath && !isImporting && (
             <TouchableOpacity style={styles.actionButton}>
               <Download color={colors.text.secondary} size={20} />
             </TouchableOpacity>
          )}

          {onFavoritePress && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onFavoritePress(track.id, !track.isFavorite)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={track.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart 
                color={track.isFavorite ? colors.brand.primary : colors.text.secondary} 
                size={22} 
                fill={track.isFavorite ? colors.brand.primary : 'transparent'} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );
};

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.background.primary,
  },
  playingContainer: {
    backgroundColor: colors.background.card,
  },
  content: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  artworkContainer: {
    position: 'relative',
    marginRight: 14,
    width: 56,
    height: 56,
  },
  artwork: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.background.elevated,
  },
  placeholderArtwork: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 26,
    color: colors.text.secondary,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass.dark,
    borderRadius: 8,
  },
  playingIndicator: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass.dark,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 2,
  },
  playingBar1: { width: 3, height: 12, backgroundColor: colors.brand.primary, borderRadius: 2 },
  playingBar2: { width: 3, height: 20, backgroundColor: colors.brand.primary, borderRadius: 2 },
  playingBar3: { width: 3, height: 16, backgroundColor: colors.brand.primary, borderRadius: 2 },
  infoContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  playingTitle: {
    color: colors.brand.primary,
  },
  artist: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  meta: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
  },
});

export default SongCard;
