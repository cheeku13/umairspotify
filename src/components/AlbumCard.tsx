import React from 'react';
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
  withSpring,
} from 'react-native-reanimated';
import { Play } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../theme/colors';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface AlbumCardProps {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  trackCount: number;
  onPress: () => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({
  id,
  title,
  artist,
  artwork,
  trackCount,
  onPress,
}) => {
  'use no memo';
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const onPressOut = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  return (
    <AnimatedTouchableOpacity
      style={[styles.container, animatedStyle, shadows.soft]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={0.9}
    >
      <View style={styles.artworkContainer}>
        {artwork ? (
          <Image
            source={{ uri: artwork }}
            style={styles.artwork}
          />
        ) : (
          <View style={[styles.artwork, styles.placeholderArtwork]}>
            <Text style={styles.placeholderText}>♪</Text>
          </View>
        )}
        
        {/* Play Button Overlay */}
        <View style={styles.playButtonWrapper}>
          <LinearGradient
            colors={[colors.brand.primary, '#158C3E']}
            style={styles.playButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Play color={colors.background.primary} size={20} fill={colors.background.primary} style={{ marginLeft: 3 }} />
          </LinearGradient>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {artist}
        </Text>
      </View>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 140,
    marginRight: 16,
    borderRadius: 12,
  },
  artworkContainer: {
    width: 140,
    height: 140,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: colors.background.elevated,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  placeholderArtwork: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
  },
  placeholderText: {
    fontSize: 48,
    color: colors.text.secondary,
  },
  playButtonWrapper: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  artist: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});

export default AlbumCard;
