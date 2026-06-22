import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { SearchBar, SongCard, AlbumCard } from '@components/index';
import { useMusicStore } from '@store/musicStore';
import { Track } from '@appTypes/index';
import { databaseService } from '../services/database';
import { useDebounce } from '../hooks/useDebounce';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../theme/colors';
import { Play } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const DiscoverScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 180);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const {
    tracks,
    currentTrackId,
    isPlaying,
    toggleFavorite,
    setCurrentTrackId,
    setIsPlaying,
  } = useMusicStore();

  useEffect(() => {
    if (debouncedSearchText.trim().length === 0) {
      setFilteredTracks(tracks);
      setIsSearching(false);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const result = await databaseService.search(debouncedSearchText);
        setFilteredTracks(result.tracks);
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setIsSearching(false);
      }
    };

    void performSearch();
  }, [debouncedSearchText, tracks]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleTrackPress = useCallback((track: Track) => {
    void playTrack(track);
  }, [playTrack]);

  const suggestedAlbums = useMemo(() => {
    const uniqueAlbums = Array.from(new Set(tracks.map(t => t.albumId).filter(Boolean)));
    return tracks.filter(t => uniqueAlbums.includes(t.albumId)).slice(0, 10);
  }, [tracks]);

  const trendingAlbums = useMemo(() => {
    const uniqueAlbums = Array.from(new Set(tracks.map(t => t.album).filter(Boolean)));
    return uniqueAlbums.slice(0, 5).map(album => {
      const albumTracks = tracks.filter(t => t.album === album);
      return {
        id: album || 'unknown',
        title: album || 'Unknown Album',
        artist: albumTracks[0]?.artist || 'Various Artists',
        artworkUri: albumTracks[0]?.artworkUri || '',
        trackCount: albumTracks.length,
      };
    });
  }, [tracks]);

  const recentlyPlayed = tracks.slice(0, 5); // Mock recently played
  const heroTrack = tracks[0];

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchText ? 'No results found' : 'No tracks available'}
      </Text>
      <Text style={styles.emptySubText}>
        {searchText ? 'Try a different search' : 'Download tracks to get started'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Floating gradient background */}
      <LinearGradient
        colors={[colors.background.elevated, colors.background.primary]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brand.primary}
            />
          }
        >
          <SearchBar
            value={searchText}
            onChangeText={handleSearch}
            placeholder="Search songs, artists, albums..."
          />

          {searchText.length > 0 ? (
            // Search Results Mode
            <View style={styles.searchResults}>
              <Text style={styles.sectionTitle}>Top Results</Text>
              {filteredTracks.length > 0 ? (
                filteredTracks.map(item => (
                  <SongCard
                    key={item.id}
                    track={item}
                    isPlaying={playback.currentTrackId === item.id && playback.status === 'playing'}
                    onPress={() => handleTrackPress(item)}
                    onFavoritePress={() => toggleFavorite(item.id, !item.isFavorite)}
                    artworkUri={item.artworkUri || ''}
                  />
                ))
              ) : (
                renderEmptyState()
              )}
            </View>
          ) : (
            // Discover Mode
            <Animated.View entering={FadeInDown.duration(400)}>
              {/* Hero Section */}
              {heroTrack && (
                <View style={styles.heroContainer}>
                  <TouchableOpacity 
                    style={[styles.heroCard, shadows.glow]} 
                    activeOpacity={0.9}
                    onPress={() => handleTrackPress(heroTrack)}
                  >
                    <Image source={{ uri: heroTrack.artworkUri }} style={styles.heroArtwork} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      style={styles.heroOverlay}
                    >
                      <Text style={styles.heroSubtitle}>FEATURED ALBUM</Text>
                      <Text style={styles.heroTitle} numberOfLines={1}>{heroTrack.album}</Text>
                      <Text style={styles.heroArtist}>{heroTrack.artist}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* Recently Played */}
              {recentlyPlayed.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recently Played</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                    {recentlyPlayed.map((track) => (
                      <View key={track.id} style={{ width: 300, marginRight: -10 }}>
                        <SongCard
                          track={track}
                          isPlaying={playback.currentTrackId === track.id && playback.status === 'playing'}
                          onPress={() => handleTrackPress(track)}
                        />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Trending Albums */}
              {trendingAlbums.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Trending Albums</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                    {trendingAlbums.map((item) => (
                      <AlbumCard
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        artist={item.artist}
                        artwork={item.artworkUri || ''}
                        trackCount={item.trackCount}
                        onPress={() => {}}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Quick Mixes */}
              <View style={[styles.section, { paddingBottom: 100 }]}>
                <Text style={styles.sectionTitle}>Quick Mixes</Text>
                <View style={styles.mixGrid}>
                  {['Chill Vibes', 'Workout', 'Focus', 'Party'].map((mix, idx) => (
                    <TouchableOpacity key={idx} style={[styles.mixCard, shadows.soft]} activeOpacity={0.8}>
                      <LinearGradient
                        colors={[colors.background.elevated, colors.background.card]}
                        style={styles.mixGradient}
                      >
                        <Text style={styles.mixTitle}>{mix}</Text>
                        <View style={styles.mixPlayButton}>
                          <Play color={colors.background.primary} size={16} fill={colors.background.primary} style={{ marginLeft: 2 }} />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
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
  scrollContent: {
    paddingBottom: 20,
  },
  searchResults: {
    marginTop: 10,
  },
  emptyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  heroContainer: {
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  heroCard: {
    width: '100%',
    height: width * 0.7,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.background.elevated,
  },
  heroArtwork: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brand.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  heroArtist: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  mixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    gap: 12,
    justifyContent: 'center',
  },
  mixCard: {
    width: (width - 44) / 2,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mixGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  mixTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  mixPlayButton: {
    position: 'absolute',
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DiscoverScreen;
