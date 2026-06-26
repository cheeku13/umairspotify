import RNFS from 'react-native-fs';
import { Track } from '@apptypes/index';

export interface LyricLine {
  timeMs: number;
  text: string;
}

class LyricsService {
  /**
   * Attempts to load and parse a .lrc file matching the track's filename.
   */
  async getLyricsForTrack(track: Track): Promise<LyricLine[] | null> {
    if (!track.localFilePath) return null;

    try {
      // Replace audio extension with .lrc
      const lastDotIndex = track.localFilePath.lastIndexOf('.');
      if (lastDotIndex === -1) return null;
      
      const lrcPath = track.localFilePath.substring(0, lastDotIndex) + '.lrc';
      
      const exists = await RNFS.exists(lrcPath);
      if (!exists) return null;

      const content = await RNFS.readFile(lrcPath, 'utf8');
      return this.parseLrc(content);
    } catch (error) {
      console.warn('Failed to load lyrics for track', track.id, error);
      return null;
    }
  }

  /**
   * Parses standard LRC format into an array of LyricLine objects.
   * e.g., [01:23.45] lyric text
   */
  parseLrc(lrcText: string): LyricLine[] {
    const lines = lrcText.split(/\r?\n/);
    const lyrics: LyricLine[] = [];
    const timeRegex = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g;

    for (const line of lines) {
      const match = line.match(timeRegex);
      if (!match) continue;

      // The text is whatever comes after the last timestamp
      const text = line.replace(timeRegex, '').trim();

      // LRC allows multiple timestamps for the same lyric line
      let m;
      // We must reset lastIndex since we are reusing the global regex
      timeRegex.lastIndex = 0;
      while ((m = timeRegex.exec(line)) !== null) {
        const minutes = parseInt(m[1], 10);
        const seconds = parseInt(m[2], 10);
        const hundredthsOrThousandths = m[3] || '0';
        
        let ms = 0;
        if (hundredthsOrThousandths.length === 2) {
          ms = parseInt(hundredthsOrThousandths, 10) * 10;
        } else if (hundredthsOrThousandths.length === 3) {
          ms = parseInt(hundredthsOrThousandths, 10);
        }

        const timeMs = (minutes * 60 + seconds) * 1000 + ms;
        
        lyrics.push({ timeMs, text });
      }
    }

    // Sort chronologically
    return lyrics.sort((a, b) => a.timeMs - b.timeMs);
  }
}

export const lyricsService = new LyricsService();
