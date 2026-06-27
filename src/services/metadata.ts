import { NativeModules } from 'react-native';
import { ExtractedMetadata, ImportCandidate, Track } from '@apptypes/index';

interface NativeMetadataBridge {
  extractMetadata: (filePath: string) => Promise<ExtractedMetadata>;
}

const bridge = (): NativeMetadataBridge => {
  const modules = NativeModules as Record<string, unknown>;
  const candidate = modules.HarmonyMetadata;
  if (!candidate || typeof candidate !== 'object') {
    throw new Error('HarmonyMetadata native module is not registered');
  }
  return candidate as NativeMetadataBridge;
};

export const supportedExtensions = new Set(['.mp3', '.flac', '.m4a', '.mp4', '.ogg', '.wav', '.aac']);

class MetadataService {
  private nativeBridge: NativeMetadataBridge | null = null;

  initialize(): void {
    this.nativeBridge = bridge();
  }

  sanitizeTitle(title: string): string {
    return title
      .replace(/\s*[[(]?official\s+(video|audio)[)\]]?\s*/gi, ' ')
      .replace(/\s*[[(]?lyric(s| video)?[)\]]?\s*/gi, ' ')
      .replace(/\s*[[(]?(hd|4k|visualizer|remastered)[)\]]?\s*/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  normalizeName(value: string): string {
    return value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  extractPrimaryArtist(artistString: string): string {
    const cleaned = artistString.trim();
    if (!cleaned) {
      return 'Unknown Artist';
    }
    return cleaned.split(/,|;|&|\sfeat\.?\s|\sft\.?\s/i)[0].trim() || 'Unknown Artist';
  }

  formatDuration(milliseconds: number): string {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  validateImportCandidate(candidate: ImportCandidate): string[] {
    const errors: string[] = [];
    if (!candidate.localFilePath || !this.isSafeAbsolutePath(candidate.localFilePath)) {
      errors.push('Invalid local file path');
    }
    if (!this.isSupportedAudioPath(candidate.localFilePath)) {
      errors.push('Unsupported audio format');
    }
    if (candidate.fileSizeBytes <= 0) {
      errors.push('Audio file is empty');
    }
    return errors;
  }

  validateTrackMetadata(track: Partial<Track>): string[] {
    const errors: string[] = [];
    if (!track.id) {
      errors.push('Missing track id');
    }
    if (!track.title?.trim()) {
      errors.push('Missing track title');
    }
    if (!track.artistName?.trim()) {
      errors.push('Missing artist name');
    }
    if (track.durationMs !== undefined && track.durationMs < 0) {
      errors.push('Duration must be non-negative');
    }
    if (track.localFilePath && !this.isSafeAbsolutePath(track.localFilePath)) {
      errors.push('Unsafe local file path');
    }
    return errors;
  }

  async scanAudioFiles(): Promise<ImportCandidate[]> {
    // This is now handled by FileSystemService directly
    return [];
  }

  async extractMetadata(filePath: string): Promise<ExtractedMetadata> {
    if (!this.isSafeAbsolutePath(filePath)) {
      throw new Error('Rejected unsafe media path');
    }
    if (!this.isSupportedAudioPath(filePath)) {
      throw new Error('Unsupported audio format');
    }
    const metadata = await this.requireBridge().extractMetadata(filePath);
    return {
      ...metadata,
      title: this.sanitizeTitle(metadata.title || 'Unknown Title') || 'Unknown Title',
      artistName: this.extractPrimaryArtist(metadata.artistName),
      albumTitle: this.sanitizeTitle(metadata.albumTitle || 'Unknown Album') || 'Unknown Album',
    };
  }

  buildTrack(candidate: ImportCandidate, metadata: ExtractedMetadata): Track {
    const timestamp = Date.now();
    const artistName = metadata.artistName || 'Unknown Artist';
    const albumTitle = metadata.albumTitle || 'Unknown Album';
    const title = metadata.title || candidate.fileName;
    const artistId = `artist-${this.normalizeName(artistName) || 'unknown'}`;
    const albumId = `album-${this.normalizeName(artistName)}-${this.normalizeName(albumTitle) || 'unknown'}`;
    const sourceId = `${candidate.localFilePath}:${candidate.fileSizeBytes}:${candidate.dateModified}`;

    return {
      id: `track-${this.hash(sourceId)}`,
      sourceId,
      fileUri: candidate.fileUri,
      localFilePath: candidate.localFilePath,
      fileName: candidate.fileName,
      fileSizeBytes: candidate.fileSizeBytes,
      mimeType: candidate.mimeType,
      title,
      sortTitle: this.toSortTitle(title),
      artistId,
      artistName,
      albumId,
      albumTitle,
      albumArtistName: metadata.albumArtistName,
      trackNumber: metadata.trackNumber,
      discNumber: metadata.discNumber,
      durationMs: metadata.durationMs,
      bitrate: metadata.bitrate,
      sampleRate: metadata.sampleRate,
      artworkCacheId: null,
      artworkUri: metadata.artworkPath,
      dateAdded: timestamp,
      dateModified: candidate.dateModified,
      lastPlayedAt: null,
      playCount: 0,
      importStatus: 'ready',
      isFavorite: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  private toSortTitle(title: string): string {
    return title.replace(/^(a|an|the)\s+/i, '').trim().toLowerCase();
  }

  private isSupportedAudioPath(filePath: string): boolean {
    const lastDot = filePath.lastIndexOf('.');
    return lastDot >= 0 && supportedExtensions.has(filePath.slice(lastDot).toLowerCase());
  }

  private isSafeAbsolutePath(filePath: string): boolean {
    if (!filePath.startsWith('/') && !/^[A-Za-z]:\\/.test(filePath)) {
      return false;
    }
    const normalized = filePath.replace(/\\/g, '/');
    return !normalized.split('/').includes('..') && !normalized.includes('\0');
  }

  private hash(value: string): string {
    let hash = 5381;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 33) ^ value.charCodeAt(index);
    }
    return (hash >>> 0).toString(16);
  }

  private requireBridge(): NativeMetadataBridge {
    if (!this.nativeBridge) {
      this.nativeBridge = bridge();
    }
    return this.nativeBridge;
  }
}

export const metadataService = new MetadataService();
