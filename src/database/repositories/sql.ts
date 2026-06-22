export const trackSelectSql = `
  SELECT
    tracks.*,
    artwork_cache.cached_path AS artwork_uri,
    CASE WHEN favorites.track_id IS NULL THEN 0 ELSE 1 END AS is_favorite
  FROM tracks
  LEFT JOIN artwork_cache ON artwork_cache.id = tracks.artwork_cache_id
  LEFT JOIN favorites ON favorites.track_id = tracks.id
`;

export const albumSelectSql = `
  SELECT albums.*, artwork_cache.cached_path AS artwork_uri
  FROM albums
  LEFT JOIN artwork_cache ON artwork_cache.id = albums.artwork_cache_id
`;

export const artistSelectSql = `
  SELECT artists.*, artists.artwork_path AS artwork_uri
  FROM artists
`;
