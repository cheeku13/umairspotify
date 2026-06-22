import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ListeningInsights, TopItem } from '@appTypes/index';
import { databaseService } from '../services/database';
import { metadataService } from '../services/metadata';
import { colors, shadows } from '../theme/colors';
import { BarChart3, Clock, Music2, Users, Flame, Trophy } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_PADDING = 20;
const BAR_MAX_HEIGHT = 100;

const HOUR_LABELS = [
  '12a', '1a', '2a', '3a', '4a', '5a',
  '6a', '7a', '8a', '9a', '10a', '11a',
  '12p', '1p', '2p', '3p', '4p', '5p',
  '6p', '7p', '8p', '9p', '10p', '11p',
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const InsightsScreen: React.FC = () => {
  const [insights, setInsights] = useState<ListeningInsights | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadInsights = useCallback(async () => {
    try {
      const data = await databaseService.getListeningInsights();
      setInsights(data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  }, [loadInsights]);

  const formatListeningTime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const renderStatCard = (
    icon: React.ReactNode,
    label: string,
    value: string,
    gradientColors: string[],
    index: number,
  ) => (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={styles.statCard}
      key={label}
    >
      <LinearGradient
        colors={gradientColors}
        style={styles.statCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.statCardIcon, shadows.glow]}>{icon}</View>
        <Text style={styles.statCardValue}>{value}</Text>
        <Text style={styles.statCardLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );

  const renderTopItemRow = (item: TopItem, index: number, showPlays = true) => (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      style={styles.topItemRow}
      key={item.id}
    >
      <Text style={styles.topItemRank}>{index + 1}</Text>
      <View style={styles.topItemPlaceholder}>
        <Music2 color={colors.text.secondary} size={16} />
      </View>
      <View style={styles.topItemInfo}>
        <Text style={styles.topItemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.topItemMeta}>
          {showPlays ? `${item.playCount} plays` : ''}{showPlays && item.totalListeningMs > 0 ? ' · ' : ''}
          {item.totalListeningMs > 0 ? formatListeningTime(item.totalListeningMs) : ''}
        </Text>
      </View>
    </Animated.View>
  );

  const renderBarChart = (data: number[], labels: string[], showEvery = 1) => {
    const maxVal = Math.max(...data, 1);
    return (
      <View style={styles.barChartContainer}>
        <View style={styles.barChartBars}>
          {data.map((val, i) => {
            const barHeight = Math.max(2, (val / maxVal) * BAR_MAX_HEIGHT);
            const isMax = val === maxVal && val > 0;
            return (
              <View key={i} style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: isMax ? colors.brand.primary : colors.glass.medium,
                    },
                  ]}
                />
                {i % showEvery === 0 && (
                  <Text style={styles.barLabel}>{labels[i]}</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (!insights) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <BarChart3 color={colors.text.secondary} size={48} />
          <Text style={styles.loadingText}>Loading insights...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text.primary} />
        }
      >
        <Text style={styles.pageTitle}>Insights</Text>
        <Text style={styles.pageSubtitle}>Your listening activity at a glance</Text>

        {/* Summary Cards */}
        <View style={styles.statsGrid}>
          {renderStatCard(
            <Music2 color="#fff" size={22} />,
            'Tracks Played',
            insights.totalTracksPlayed.toLocaleString(),
            ['#6366f1', '#8b5cf6'],
            0,
          )}
          {renderStatCard(
            <Clock color="#fff" size={22} />,
            'Listening Time',
            formatListeningTime(insights.totalListeningMs),
            ['#ec4899', '#f43f5e'],
            1,
          )}
          {renderStatCard(
            <Users color="#fff" size={22} />,
            'Unique Artists',
            insights.uniqueArtistsPlayed.toLocaleString(),
            ['#14b8a6', '#06b6d4'],
            2,
          )}
          {renderStatCard(
            <Flame color="#fff" size={22} />,
            'Day Streak',
            `${insights.longestStreakDays}`,
            ['#f97316', '#eab308'],
            3,
          )}
        </View>

        {/* Plays by Hour */}
        <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Peak Listening Hours</Text>
          {renderBarChart(insights.playsByHour, HOUR_LABELS, 3)}
        </Animated.View>

        {/* Plays by Day */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Activity by Day</Text>
          {renderBarChart(insights.playsByDayOfWeek, DAY_LABELS, 1)}
        </Animated.View>

        {/* Top Tracks */}
        {insights.topTracks.length > 0 && (
          <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Trophy color={colors.brand.primary} size={20} />
              <Text style={styles.sectionTitle}>Top Tracks</Text>
            </View>
            {insights.topTracks.map((item, index) => renderTopItemRow(item, index))}
          </Animated.View>
        )}

        {/* Top Artists */}
        {insights.topArtists.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users color={colors.brand.primary} size={20} />
              <Text style={styles.sectionTitle}>Top Artists</Text>
            </View>
            {insights.topArtists.map((item, index) => renderTopItemRow(item, index))}
          </Animated.View>
        )}

        {/* Top Albums */}
        {insights.topAlbums.length > 0 && (
          <Animated.View entering={FadeInDown.delay(550).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Music2 color={colors.brand.primary} size={20} />
              <Text style={styles.sectionTitle}>Top Albums</Text>
            </View>
            {insights.topAlbums.map((item, index) => renderTopItemRow(item, index))}
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
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
    paddingHorizontal: CARD_PADDING,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: (width - CARD_PADDING * 2 - 12) / 2,
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.card,
  },
  statCardGradient: {
    padding: 18,
    borderRadius: 20,
    minHeight: 110,
    justifyContent: 'flex-end',
  },
  statCardIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    opacity: 0.7,
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  statCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  barChartContainer: {
    backgroundColor: colors.background.elevated,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glass.light,
  },
  barChartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: BAR_MAX_HEIGHT + 30,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: BAR_MAX_HEIGHT + 30,
  },
  bar: {
    width: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 9,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glass.light,
  },
  topItemRank: {
    width: 28,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  topItemPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  topItemMeta: {
    fontSize: 13,
    color: colors.text.secondary,
  },
});

export default InsightsScreen;
