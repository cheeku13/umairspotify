import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';
import { useMusicStore } from '@store/musicStore';
import { Track } from '@apptypes/index';
import { lyricsService, LyricLine } from '@services/lyrics';
import { colors } from '../theme/colors';
import { ChevronDown, Mic2 } from 'lucide-react-native';

const { height } = Dimensions.get('window');
const ITEM_HEIGHT = 44; // Approximate height per lyric line

interface Props {
  visible: boolean;
  onClose: () => void;
  track: Track;
}

const LyricsModal: React.FC<Props> = ({ visible, onClose, track }) => {
  const translateY = useSharedValue(height);
  const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
  const [loading, setLoading] = useState(false);
  const currentTime = useMusicStore(state => state.playback.positionMs);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
    } else {
      translateY.value = withSpring(height, { damping: 20, stiffness: 90 });
    }
  }, [visible, translateY]);

  useEffect(() => {
    const fetchLyrics = async () => {
      setLoading(true);
      const data = await lyricsService.getLyricsForTrack(track);
      setLyrics(data);
      setLoading(false);
    };

    if (visible) {
      fetchLyrics();
    }
  }, [visible, track]);

  // Find active line index
  let activeIndex = -1;
  if (lyrics && lyrics.length > 0) {
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].timeMs) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  useEffect(() => {
    if (visible && lyrics && activeIndex >= 0 && scrollViewRef.current) {
      // Try to center the active line
      const yOffset = Math.max(0, activeIndex * ITEM_HEIGHT - height / 2.5);
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
  }, [activeIndex, visible, lyrics]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible && translateY.value >= height) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="dark"
        blurAmount={30}
        reducedTransparencyFallbackColor={colors.background.primary}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ChevronDown color={colors.text.primary} size={32} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.messageText}>Loading lyrics...</Text>
          </View>
        ) : !lyrics || lyrics.length === 0 ? (
          <View style={styles.centerContainer}>
            <Mic2 color={colors.text.secondary} size={48} style={{ marginBottom: 16 }} />
            <Text style={styles.messageText}>No lyrics available</Text>
            <Text style={styles.subMessageText}>Add a .lrc file in the same directory</Text>
          </View>
        ) : (
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {lyrics.map((line, index) => {
              const isActive = index === activeIndex;
              const isPast = index < activeIndex;
              
              return (
                <View key={`${index}-${line.timeMs}`} style={styles.lineContainer}>
                  <Text 
                    style={[
                      styles.lyricText,
                      isActive && styles.activeLyricText,
                      isPast && styles.pastLyricText
                    ]}
                  >
                    {line.text || '♪'}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 150, // Between player screen and sleep timer modal
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 60,
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  messageText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subMessageText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingVertical: height / 2.5,
  },
  lineContainer: {
    minHeight: ITEM_HEIGHT,
    justifyContent: 'center',
  },
  lyricText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    opacity: 0.5,
  },
  activeLyricText: {
    fontSize: 28,
    opacity: 1,
    color: colors.brand.primary,
  },
  pastLyricText: {
    opacity: 0.2,
  },
});

export default LyricsModal;
