import RNFS from 'react-native-fs';
import { ImportCandidate } from '@apptypes/index';
import { metadataService, supportedExtensions } from './metadata';
import { databaseService } from './database';
import { appEventBus } from '../core/EventBus';

export class FileSystemService {
  /**
   * Recursively walk a directory and collect absolute file paths for supported audio files.
   */
  private async walkDirectory(dir: string, files: string[]): Promise<void> {
    try {
      const entries = await RNFS.readDir(dir);
      for (const entry of entries) {
        if (entry.isDirectory()) {
          await this.walkDirectory(entry.path, files);
        } else if (entry.isFile()) {
          const lower = entry.name.toLowerCase();
          const ext = lower.substring(lower.lastIndexOf('.'));
          if (supportedExtensions.has(ext)) {
            files.push(entry.path);
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to read directory: ${dir}`, e);
    }
  }

  /**
   * Build an ImportCandidate from a file path.
   */
  private async buildCandidate(filePath: string): Promise<ImportCandidate> {
    const stat = await RNFS.stat(filePath);
    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
    return {
      localFilePath: filePath,
      fileUri: `file://${filePath}`,
      fileName,
      fileSizeBytes: Number(stat.size),
      mimeType: 'audio/mpeg', // RNFS stat doesn't provide mime
      dateModified: new Date(stat.mtime as unknown as string | number).getTime() || Date.now(),
    } as ImportCandidate;
  }

  /**
   * Public entry point – scans a root directory, extracts metadata for each audio file,
   * constructs Track objects and upserts them into the DB.
   */
  async importLibrary(rootDir: string = RNFS.ExternalStorageDirectoryPath): Promise<void> {
    appEventBus.emit('LibraryImportStarted');
    
    const filePaths: string[] = [];
    await this.walkDirectory(rootDir, filePaths);
    
    const total = filePaths.length;
    appEventBus.emit('LibraryImportProgress', total > 0 ? 0 : 100);

    for (let i = 0; i < total; i += 1) {
      const path = filePaths[i];
      try {
        const candidate = await this.buildCandidate(path);
        const validation = metadataService.validateImportCandidate(candidate);
        
        if (validation.length === 0) {
          const meta = await metadataService.extractMetadata(path);
          const track = metadataService.buildTrack(candidate, meta);
          await databaseService.upsertTrack(track);
        } else {
          console.warn(`Skipping invalid file: ${path}`, validation);
        }
      } catch (e) {
        // Log but continue processing other files
        console.warn(`Failed to process file: ${path}`, e);
      }
      
      // Emit incremental progress      
      if (i % 10 === 0) {
        appEventBus.emit('LibraryImportProgress', Math.round(((i + 1) / total) * 100));
      }
    }
    
    appEventBus.emit('LibraryImportComplete', { totalProcessed: total });
  }
}

export const fileSystemService = new FileSystemService();
