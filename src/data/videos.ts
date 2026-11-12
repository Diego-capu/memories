import { parseVideoUrl, type VideoPlatform } from '../utils/videoParser';

export interface SquadVideo {
  id: string;
  title: string;
  author: string;
  originalUrl: string;
  embedUrl: string;
  platform: VideoPlatform;
  thumbnailUrl?: string;
  tag: string;
  createdAt: string;
  isRemote?: boolean;
}

export const VIDEO_CATEGORIES = [
  'Todos',
  'Roblox',
  'Discord',
  'Minecraft',
  'Momentos',
  'Música',
] as const;

export type VideoCategory = string;

const RAW_DEFAULT_VIDEOS = [
  {
    id: 'default-1',
    title: 'Hora de Aventura: El Viaje Inolvidable',
    author: 'Diezos',
    url: 'https://www.youtube.com/watch?v=F_fP_n5Z3zU',
    tag: 'Música',
    createdAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'default-2',
    title: 'Noches de Discord y Risas en el Refugio',
    author: 'Squad Memorias',
    url: 'https://www.youtube.com/watch?v=jW2m3sFh5C4',
    tag: 'Discord',
    createdAt: '2026-02-10T00:00:00.000Z',
  },
  {
    id: 'default-3',
    title: 'Steven Universe: Amar Como Tú (Clip Oficial)',
    author: 'Yaei',
    url: 'https://www.youtube.com/watch?v=k_j4Z1m_B0M',
    tag: 'Música',
    createdAt: '2026-03-01T00:00:00.000Z',
  },
];

export const DEFAULT_VIDEOS: SquadVideo[] = RAW_DEFAULT_VIDEOS.map((item) => {
  const parsed = parseVideoUrl(item.url);
  return {
    id: item.id,
    title: item.title,
    author: item.author,
    originalUrl: item.url,
    embedUrl: parsed?.embedUrl ?? 'https://www.youtube.com/embed/F_fP_n5Z3zU',
    platform: parsed?.platform ?? 'youtube',
    thumbnailUrl: parsed?.thumbnailUrl,
    tag: item.tag,
    createdAt: item.createdAt,
    isRemote: false,
  };
});
