import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Folder as FolderIcon, ChevronRight, Music2 } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useFolderTree } from '../hooks/useFolderTree';
import { SongCard } from './index';

interface Props {
  onPlayTrack: (trackId: string) => void;
}

const FolderList: React.FC<Props> = ({ onPlayTrack }) => {
  const { currentNode, breadcrumbs, navigateTo } = useFolderTree();

  const subfolders = Object.values(currentNode.subfolders).sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  const renderBreadcrumbs = () => (
    <View style={styles.breadcrumbContainer}>
      <FlatList
        data={breadcrumbs}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.path || 'root'}
        renderItem={({ item, index }) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <TouchableOpacity
              style={styles.breadcrumbItem}
              onPress={() => !isLast && navigateTo(item.path)}
              disabled={isLast}
            >
              <Text style={[styles.breadcrumbText, isLast && styles.breadcrumbTextActive]}>
                {item.name}
              </Text>
              {!isLast && <ChevronRight color={colors.text.secondary} size={16} />}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  const renderFolder = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.folderRow}
      onPress={() => navigateTo(item.fullPath)}
    >
      <View style={styles.folderIconContainer}>
        <FolderIcon color={colors.brand.primary} size={24} fill={colors.brand.primary + '20'} />
      </View>
      <View style={styles.folderInfo}>
        <Text style={styles.folderName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.folderMeta}>
          {Object.keys(item.subfolders).length > 0 ? `${Object.keys(item.subfolders).length} folders ` : ''}
          {item.tracks.length > 0 ? `${item.tracks.length} tracks` : ''}
        </Text>
      </View>
      <ChevronRight color={colors.text.secondary} size={20} />
    </TouchableOpacity>
  );

  // Combine folders and tracks for a single FlatList
  const listData = [
    ...subfolders.map(f => ({ type: 'folder', data: f })),
    ...currentNode.tracks.map(t => ({ type: 'track', data: t }))
  ];

  if (listData.length === 0) {
    return (
      <View style={styles.container}>
        {renderBreadcrumbs()}
        <View style={styles.emptyContainer}>
          <FolderIcon color={colors.text.secondary} size={48} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>Empty Folder</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderBreadcrumbs()}
      <FlatList
        data={listData}
        keyExtractor={(item, index) => `${item.type}-${item.type === 'folder' ? (item.data as any).fullPath : (item.data as any).id}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          if (item.type === 'folder') {
            return renderFolder({ item: item.data });
          } else {
            return (
              <SongCard
                track={item.data as any}
                onPress={() => onPlayTrack((item.data as any).id)}
              />
            );
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  breadcrumbContainer: {
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glass.light,
    marginBottom: 8,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: '100%',
  },
  breadcrumbText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
    marginRight: 4,
  },
  breadcrumbTextActive: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 100, // Space for mini player
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  folderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  folderMeta: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
});

export default FolderList;
