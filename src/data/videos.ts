import { type VideoPlatform } from '../utils/videoParser';

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

export const DEFAULT_VIDEOS: SquadVideo[] = [];

