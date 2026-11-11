export type VideoPlatform = 'youtube' | 'drive';

export interface ParsedVideoInfo {
  platform: VideoPlatform;
  cleanId: string;
  embedUrl: string;
  thumbnailUrl?: string;
  directUrl: string;
}

/**
 * Extracts video ID and generates embed URLs for YouTube and Google Drive links.
 */
export function parseVideoUrl(rawUrl: string): ParsedVideoInfo | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = rawUrl.trim();

  // 1. YouTube Detection
  // Matches:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  const ytMatch = url.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
  );

  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      platform: 'youtube',
      cleanId: videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      directUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }

  // 2. Google Drive Detection
  // Matches:
  // - https://drive.google.com/file/d/FILE_ID/view...
  // - https://drive.google.com/file/d/FILE_ID/preview
  // - https://drive.google.com/open?id=FILE_ID
  // - https://drive.google.com/uc?id=FILE_ID
  const driveFileMatch = url.match(
    /(?:https?:\/\/)?drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]{20,})/i,
  );

  if (driveFileMatch && driveFileMatch[1]) {
    const fileId = driveFileMatch[1];
    return {
      platform: 'drive',
      cleanId: fileId,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      thumbnailUrl: undefined,
      directUrl: `https://drive.google.com/file/d/${fileId}/view`,
    };
  }

  return null;
}
