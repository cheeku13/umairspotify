import { useMemo, useState, useCallback } from 'react';
import { Track } from '@apptypes/index';
import { useMusicStore } from '@store/musicStore';

export interface FolderNode {
  name: string;
  fullPath: string;
  tracks: Track[];
  subfolders: Record<string, FolderNode>;
  parentPath: string | null;
}

export function useFolderTree() {
  const tracks = useMusicStore(state => state.tracks);
  
  const rootNode = useMemo(() => {
    const root: FolderNode = {
      name: 'Root',
      fullPath: '',
      tracks: [],
      subfolders: {},
      parentPath: null,
    };

    tracks.forEach(track => {
      if (!track.localFilePath) return;

      // Normalize path to use forward slashes
      let path = track.localFilePath.replace(/\\/g, '/');
      
      // Remove file scheme if present
      if (path.startsWith('file://')) {
        path = path.substring(7);
      }

      // Split into parts, ignoring empty strings and the filename itself
      const parts = path.split('/').filter(p => p.length > 0);
      if (parts.length === 0) return;

      // The last part is the filename, we only want the directories
      const dirParts = parts.slice(0, -1);
      
      // If it's empty, it goes into Root directly
      if (dirParts.length === 0) {
        root.tracks.push(track);
        return;
      }

      // Traverse/Build the tree
      let currentNode = root;
      let currentPath = '';

      for (let i = 0; i < dirParts.length; i++) {
        const part = dirParts[i];
        currentPath += (currentPath.length > 0 ? '/' : '') + part;

        if (!currentNode.subfolders[part]) {
          currentNode.subfolders[part] = {
            name: part,
            fullPath: currentPath,
            tracks: [],
            subfolders: {},
            parentPath: currentNode.fullPath,
          };
        }
        
        currentNode = currentNode.subfolders[part];
      }

      // Add track to the deepest folder
      currentNode.tracks.push(track);
    });

    return root;
  }, [tracks]);

  // Current navigation state
  const [currentPath, setCurrentPath] = useState<string>('');

  const navigateTo = useCallback((path: string) => {
    setCurrentPath(path);
  }, []);

  const navigateUp = useCallback(() => {
    if (!currentPath) return; // Already at root
    const lastSlashIndex = currentPath.lastIndexOf('/');
    if (lastSlashIndex === -1) {
      setCurrentPath('');
    } else {
      setCurrentPath(currentPath.substring(0, lastSlashIndex));
    }
  }, [currentPath]);

  // Find the node corresponding to currentPath
  const currentNode = useMemo(() => {
    if (!currentPath) return rootNode;

    const parts = currentPath.split('/');
    let node = rootNode;
    
    for (const part of parts) {
      if (node.subfolders[part]) {
        node = node.subfolders[part];
      } else {
        // Path not found, fallback to root
        return rootNode;
      }
    }
    
    return node;
  }, [currentPath, rootNode]);

  // Generate breadcrumbs for UI
  const breadcrumbs = useMemo(() => {
    const crumbs = [{ name: 'Storage', path: '' }];
    if (!currentPath) return crumbs;

    const parts = currentPath.split('/');
    let pathAcc = '';
    
    for (const part of parts) {
      pathAcc += (pathAcc.length > 0 ? '/' : '') + part;
      crumbs.push({ name: part, path: pathAcc });
    }
    
    return crumbs;
  }, [currentPath]);

  return {
    rootNode,
    currentNode,
    currentPath,
    breadcrumbs,
    navigateTo,
    navigateUp,
  };
}
