import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { HardDrive, PlayCircle, Database, Info, CheckCircle2, ChevronRight, FolderSync } from 'lucide-react-native';
import { colors, shadows } from '../theme/colors';
import { fileSystemService } from '../services/FileSystemService';

type StorageProfile = 'eco' | 'balanced' | 'studio';

const AnimatedSwitch = ({ value, onValueChange }: { value: boolean, onValueChange: (v: boolean) => void }) => {
  const translateX = useSharedValue(value ? 20 : 0);
  
  React.useEffect(() => {
    translateX.value = withSpring(value ? 20 : 0, { damping: 15, stiffness: 120 });
  }, [value, translateX]);

  const trackStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: value ? colors.brand.primary : colors.background.elevated,
    };
  });

  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onValueChange(!value)}>
      <Animated.View style={[styles.switchTrack, trackStyle]}>
        <Animated.View style={[styles.switchThumb, thumbStyle, shadows.soft]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation: _navigation }) => {
  const [storageProfile, setStorageProfile] = useState<StorageProfile>('balanced');
  const [backgroundPlayback, setBackgroundPlayback] = useState(true);
  const [lockScreenControls, setLockScreenControls] = useState(true);
  const [cacheImages, setCacheImages] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanLibrary = async () => {
    if (isScanning) return;
    setIsScanning(true);
    try {
      await fileSystemService.importLibrary();
    } catch (e) {
      console.warn('Scan failed', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleStorageProfileChange = (profile: StorageProfile) => {
    setStorageProfile(profile);
  };

  const renderStorageProfileOption = (profile: StorageProfile, label: string, description: string) => {
    const isActive = storageProfile === profile;
    return (
      <TouchableOpacity
        style={[
          styles.profileOption,
          isActive && styles.profileOptionActive,
        ]}
        onPress={() => handleStorageProfileChange(profile)}
        activeOpacity={0.8}
      >
        <View style={styles.profileOptionContent}>
          <Text style={[styles.profileOptionLabel, isActive && styles.profileOptionLabelActive]}>
            {label}
          </Text>
          <Text style={styles.profileOptionDescription}>{description}</Text>
        </View>
        {isActive && <CheckCircle2 color={colors.brand.primary} size={24} />}
      </TouchableOpacity>
    );
  };

  const renderSettingRow = (
    label: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    isLast: boolean = false
  ) => (
    <View style={[styles.settingRow, !isLast && styles.borderBottom]}>
      <View style={styles.settingRowContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <AnimatedSwitch value={value} onValueChange={onValueChange} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Storage Profile Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <HardDrive color={colors.text.primary} size={20} />
            <Text style={styles.sectionTitle}>Storage Profile</Text>
          </View>
          <View style={styles.card}>
            {renderStorageProfileOption('eco', 'Eco (96 kbps)', 'Maximum storage efficiency')}
            {renderStorageProfileOption('balanced', 'Balanced (192 kbps)', 'Recommended quality')}
            {renderStorageProfileOption('studio', 'Studio (320 kbps)', 'Highest audio fidelity')}
          </View>
        </View>

        {/* Playback Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <PlayCircle color={colors.text.primary} size={20} />
            <Text style={styles.sectionTitle}>Playback</Text>
          </View>
          <View style={styles.card}>
            {renderSettingRow('Background Playback', 'Continue playing when app is closed', backgroundPlayback, setBackgroundPlayback)}
            {renderSettingRow('Lock Screen Controls', 'Show controls on lock screen', lockScreenControls, setLockScreenControls, true)}
          </View>
        </View>

        {/* Library Management Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <FolderSync color={colors.text.primary} size={20} />
            <Text style={styles.sectionTitle}>Library</Text>
          </View>
          <View style={styles.card}>
            <TouchableOpacity 
              style={[styles.actionButton, isScanning && styles.actionButtonDisabled]} 
              onPress={handleScanLibrary}
              activeOpacity={0.8}
              disabled={isScanning}
            >
              <Text style={styles.actionButtonText}>
                {isScanning ? 'Scanning...' : 'Scan Local Device for Music'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cache Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Database color={colors.text.primary} size={20} />
            <Text style={styles.sectionTitle}>Storage & Cache</Text>
          </View>
          <View style={styles.card}>
            {renderSettingRow('Cache Album Artwork', 'Save artwork locally for faster loading', cacheImages, setCacheImages, true)}
            <TouchableOpacity style={styles.clearCacheButton} activeOpacity={0.8}>
              <Text style={styles.clearCacheButtonText}>Clear Local Cache</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Info color={colors.text.primary} size={20} />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          <View style={styles.card}>
            <View style={[styles.aboutRow, styles.borderBottom]}>
              <Text style={styles.aboutLabel}>App Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
            <View style={[styles.aboutRow, styles.borderBottom]}>
              <Text style={styles.aboutLabel}>Build Number</Text>
              <Text style={styles.aboutValue}>104</Text>
            </View>
            <TouchableOpacity style={[styles.aboutRow, styles.borderBottom]} activeOpacity={0.7}>
              <Text style={styles.linkButtonText}>Privacy Policy</Text>
              <ChevronRight color={colors.text.secondary} size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.aboutRow} activeOpacity={0.7}>
              <Text style={styles.linkButtonText}>Terms of Service</Text>
              <ChevronRight color={colors.text.secondary} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Harmony Player</Text>
          <Text style={styles.footerSubText}>Made with ♥</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text.primary,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: 8,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glass.light,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  profileOptionActive: {
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    borderColor: colors.brand.primary,
  },
  profileOptionContent: {
    flex: 1,
    marginRight: 12,
  },
  profileOptionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  profileOptionLabelActive: {
    color: colors.brand.primary,
  },
  profileOptionDescription: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glass.light,
  },
  settingRowContent: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.text.primary,
  },
  clearCacheButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
  },
  clearCacheButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.status.error,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  aboutLabel: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '500',
  },
  aboutValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  linkButtonText: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  footerSubText: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 4,
  },
});

export default SettingsScreen;
