import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, withSpring, useSharedValue } from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';
import { useMusicStore } from '@store/musicStore';
import { playerService } from '@services/player';
import { colors } from '../theme/colors';
import { ChevronDown, Moon } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const SleepTimerModal: React.FC<Props> = ({ visible, onClose }) => {
  'use no memo';
  const translateY = useSharedValue(1000);
  const sleepTimer = useMusicStore(state => state.sleepTimer);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
    } else {
      translateY.value = withSpring(1000, { damping: 20, stiffness: 90 });
    }
  }, [visible, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleSetTimer = (minutes: number | null, endOfTrack: boolean = false) => {
    if (minutes === null && !endOfTrack) {
      playerService.clearSleepTimer();
    } else {
      playerService.setSleepTimer(minutes ? minutes * 60 * 1000 : null, endOfTrack);
    }
    onClose();
  };

  const getRemainingMinutes = () => {
    if (!sleepTimer.active || sleepTimer.stopAtEndOfTrack || !sleepTimer.endTime) return null;
    // eslint-disable-next-line react-hooks/purity
    const remainingMs = sleepTimer.endTime - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 60000));
  };

  const remainingMinutes = getRemainingMinutes();

  if (!visible && translateY.value >= 1000) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="dark"
        blurAmount={25}
        reducedTransparencyFallbackColor={colors.background.primary}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Sleep Timer</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ChevronDown color={colors.text.primary} size={32} />
          </TouchableOpacity>
        </View>

        <View style={styles.statusContainer}>
          <Moon color={sleepTimer.active ? colors.brand.primary : colors.text.secondary} size={48} />
          {sleepTimer.active ? (
            <Text style={styles.statusText}>
              {sleepTimer.stopAtEndOfTrack 
                ? 'Stops at end of track' 
                : `Stops in ${remainingMinutes} min${remainingMinutes === 1 ? '' : 's'}`}
            </Text>
          ) : (
            <Text style={styles.statusText}>Timer is off</Text>
          )}
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={[styles.optionButton, !sleepTimer.active && styles.activeOption]} 
            onPress={() => handleSetTimer(null)}
          >
            <Text style={[styles.optionText, !sleepTimer.active && styles.activeOptionText]}>Off</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.optionButton, sleepTimer.active && remainingMinutes === 15 && styles.activeOption]} 
            onPress={() => handleSetTimer(15)}
          >
            <Text style={[styles.optionText, sleepTimer.active && remainingMinutes === 15 && styles.activeOptionText]}>15 minutes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.optionButton, sleepTimer.active && remainingMinutes === 30 && styles.activeOption]} 
            onPress={() => handleSetTimer(30)}
          >
            <Text style={[styles.optionText, sleepTimer.active && remainingMinutes === 30 && styles.activeOptionText]}>30 minutes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.optionButton, sleepTimer.active && remainingMinutes === 45 && styles.activeOption]} 
            onPress={() => handleSetTimer(45)}
          >
            <Text style={[styles.optionText, sleepTimer.active && remainingMinutes === 45 && styles.activeOptionText]}>45 minutes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.optionButton, sleepTimer.active && remainingMinutes === 60 && styles.activeOption]} 
            onPress={() => handleSetTimer(60)}
          >
            <Text style={[styles.optionText, sleepTimer.active && remainingMinutes === 60 && styles.activeOptionText]}>1 hour</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.optionButton, sleepTimer.stopAtEndOfTrack && styles.activeOption]} 
            onPress={() => handleSetTimer(null, true)}
          >
            <Text style={[styles.optionText, sleepTimer.stopAtEndOfTrack && styles.activeOptionText]}>End of track</Text>
          </TouchableOpacity>
        </View>
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
    zIndex: 200,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 8,
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  statusText: {
    marginTop: 16,
    fontSize: 18,
    color: colors.text.primary,
    fontWeight: '600',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  optionButton: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glass.light,
    alignItems: 'center',
  },
  activeOption: {
    backgroundColor: colors.glass.light,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 18,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  activeOptionText: {
    color: colors.brand.primary,
    fontWeight: '700',
  },
});

export default SleepTimerModal;
