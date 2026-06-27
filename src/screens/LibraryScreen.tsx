import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useMusicStore } from '@store/musicStore';
import { Track } from '@apptypes/index';
import { SongCard, SearchBar, AlbumCard, FolderList } from '@components/index';
import { databaseService } from '../services/database';
import { useDebounce } from '../hooks/useDebounce';
import { LayoutGrid, List, ArrowDownUp, Filter, Plus, Folder as FolderIcon } from 'lucide-react-native';
import { colors } from '../theme/colors';
import Animated, { FadeInDown } from 'react-native-reanimated';

type SortBy = 'dateAdded' | 'title' | 'artist' | 'duration';
type FilterBy = 'all' | 'favorites' | 'downloaded';

const { width } = Dimensions.get('window');

const LibraryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [sortBy, setSortBy] = useState<SortBy>('dateAdded');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 180);
  const [isGridMode, setIsGridMode] = useState(false);
  const [viewMode, setViewMode] = useState<'tracks' | 'folders'>('tracks');
  const [filteredAndSortedTracks, setFilteredAndSortedTracks] = useState<Track[]>([]);


  const {
    tracks,
    favorites,
    toggleFavorite,
    playTrack,
    playback,
  } = useMusicStore();

  const handleTrackPress = useCallback((track: Track) => {
    void playTrack(track);
  }, [playTrack]);

  useEffect(() => {
    let mounted = true;
    
    const loadLibrary = async () => {

      try {
        const result = await databaseService.searchLibraryTracks(
          debouncedSearchQuery,
          sortBy,
          filterBy
        );
        if (mounted) {
          setFilteredAndSortedTracks(result);
        }
      } catch (error) {
        console.error('Failed to load library tracks', error);
      }
    };
    
    void loadLibrary();
    
    return () => {
      mounted = false;
    };
  }, [debouncedSearchQuery, sortBy, filterBy, tracks]);

  const uniqueAlbums = useMemo(() => new Set(tracks.map(t => t.albumId).filter(Boolean)).size, [tracks]);
  const uniqueArtists = useMemo(() => new Set(tracks.map(t => t.artistId).filter(Boolean)).size, [tracks]);

  const renderFilterChip = (label: string, value: FilterBy) => (
    <TouchableOpacity
      style={[styles.chip, filterBy === value && styles.chipActive]}
      onPress={() => setFilterBy(value)}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, filterBy === value && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderSortChip = (label: string, value: SortBy) => (
    <TouchableOpacity
      style={[styles.chip, sortBy === value && styles.chipActive]}
      onPress={() => setSortBy(value)}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, sortBy === value && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = useCallback(
    ({ item }: { item: Track }) => {
      if (isGridMode) {
        return (
          <View style={styles.gridItem}>
            <AlbumCard
              id={item.id}
              title={item.title}
              artist={item.artistName}
              artwork={item.artworkUri || ''}
              trackCount={1}
              onPress={() => handleTrackPress(item)}
            />
          </View>
        );
      }
      return (
        <Animated.View entering={FadeInDown.duration(300)}>
          <SongCard
            track={item}
            isPlaying={playback.currentTrackId === item.id && playback.status === 'playing'}
            onPress={() => handleTrackPress(item)}
            onFavoritePress={() => toggleFavorite(item.id, !item.isFavorite)}
          />
        </Animated.View>
      );
    },
    [playback.currentTrackId, playback.status, handleTrackPress, toggleFavorite, isGridMode]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {filterBy === 'favorites' ? 'No favorites yet' : 'Library is empty'}
      </Text>
      <Text style={styles.emptySubText}>
        {filterBy === 'favorites'
          ? 'Mark songs as favorites to see them here'
          : 'Download tracks to build your library'}
      </Text>
    </View>
  );

  const renderListHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTopRow}>
        <Text style={styles.headerTitle}>My Library</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.headerActionButton, viewMode === 'folders' && styles.headerActionButtonActive]}
            onPress={() => setViewMode(viewMode === 'folders' ? 'tracks' : 'folders')}
          >
            <FolderIcon size={20} color={viewMode === 'folders' ? colors.brand.primary : colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => navigation.navigate('CreateSmartPlaylist')}
          >
            <Plus size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Statistics Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{tracks.length}</Text>
          <Text style={styles.statLabel}>Songs</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{favorites.length}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{uniqueAlbums}</Text>
          <Text style={styles.statLabel}>Albums</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{uniqueArtists}</Text>
          <Text style={styles.statLabel}>Artists</Text>
        </View>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Find in library..."
      />

      {/* Controls Row */}
      <View style={styles.controlsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.iconChip}>
            <Filter size={16} color={colors.text.secondary} />
          </View>
          {renderFilterChip('All', 'all')}
          {renderFilterChip('Favorites', 'favorites')}
          {renderFilterChip('Downloaded', 'downloaded')}
          
          <View style={[styles.iconChip, { marginLeft: 8 }]}>
            <ArrowDownUp size={16} color={colors.text.secondary} />
          </View>
          {renderSortChip('Date Added', 'dateAdded')}
          {renderSortChip('Title', 'title')}
          {renderSortChip('Artist', 'artist')}
        </ScrollView>

        <TouchableOpacity 
          style={styles.gridToggle} 
          onPress={() => setIsGridMode(!isGridMode)}
        >
          {isGridMode ? <List size={20} color={colors.text.primary} /> : <LayoutGrid size={20} color={colors.text.primary} />}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {viewMode === 'folders' ? (
        <View style={{ flex: 1 }}>
          {renderListHeader()}
          <FolderList onPlayTrack={(id) => {
            const track = tracks.find(t => t.id === id);
            if (track) handleTrackPress(track);
          }} />
        </View>
      ) : (
        <FlatList
          key={isGridMode ? 'grid' : 'list'}
          ListHeaderComponent={renderListHeader}
          data={filteredAndSortedTracks}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={renderEmptyState}
          numColumns={isGridMode ? 2 : 1}
          contentContainerStyle={[styles.listContent, isGridMode && styles.gridContent]}
          columnWrapperStyle={isGridMode ? styles.gridColumnWrapper : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  listContent: {
    paddingBottom: 100,
  },
  gridContent: {
    paddingHorizontal: 8,
  },
  gridColumnWrapper: {
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  gridItem: {
    width: (width - 32) / 2,
    alignItems: 'center',
  },
  headerContainer: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionButtonActive: {
    backgroundColor: colors.brand.primary + '20',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.background.card,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.glass.light,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.glass.light,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  filtersScroll: {
    flex: 1,
  },
  iconChip: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.elevated,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.glass.light,
  },
  chipActive: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.background.primary,
  },
  gridToggle: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: colors.background.card,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default LibraryScreen;
