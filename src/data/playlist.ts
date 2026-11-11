import musicFiles from 'virtual:music-playlist';
import type { DiscPattern } from '../components/ui/disc-cascade-carousel';
import type { RemotePlaylistTrack } from '../lib/supabase';

export interface PlaylistTrack {
  id: string;
  filename: string;
  title: string;
  subtitle: string;
  src: string;
  pattern: DiscPattern;
  palette: [string, string, string];
  coverImage?: string;
  isRemote?: boolean;
}

interface TrackOverride {
  order?: number;
  title?: string;
  subtitle?: string;
  pattern?: DiscPattern;
  palette?: [string, string, string];
  coverImage?: string;
}

const KNOWN_TRACKS: Record<string, TrackOverride> = {
  'hora-de-aventura.mp3': {
    order: 1,
    title: 'Hora de Aventura',
    subtitle: 'Playlist del Squad • 2026',
    pattern: 'horizon',
    palette: ['#7dd3fc', '#0284c7', '#fef08a'],
  },
  'hora de aventura song.mp3': {
    order: 1,
    title: 'Hora de Aventura',
    subtitle: 'Playlist del Squad • 2026',
    pattern: 'horizon',
    palette: ['#7dd3fc', '#0284c7', '#fef08a'],
  },
  'amar como tu.mp3': {
    order: 2,
    title: 'Amar Como Tú',
    subtitle: 'Steven Universe',
    pattern: 'eclipse',
    palette: ['#fbcfe8', '#9d174d', '#bae6fd'],
  },
  'soy tu problema.mp3': {
    order: 3,
    title: 'Soy Tu Problema',
    subtitle: 'Hora de Aventura',
    pattern: 'rings',
    palette: ['#1e293b', '#334155', '#38bdf8'],
  },
};

export const AVAILABLE_PATTERNS: DiscPattern[] = [
  'horizon',
  'eclipse',
  'rings',
  'sunburst',
  'halftone',
  'mosaic',
  'stripes',
];

export const AVAILABLE_PALETTES: [string, string, string][] = [
  ['#bae6fd', '#0284c7', '#f8fafc'], // Sky Blue
  ['#fbcfe8', '#db2777', '#bae6fd'], // Rose / Sunset
  ['#fed7aa', '#ea580c', '#fef08a'], // Amber / Sun
  ['#bbf7d0', '#16a34a', '#e0f2fe'], // Emerald / Fresh
  ['#e9d5ff', '#9333ea', '#7dd3fc'], // Violet / Dream
  ['#e2e8f0', '#1e293b', '#38bdf8'], // Slate / Navy
];

const LOWERCASE_WORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', 'con', 'a']);

export function formatFilenameToTitle(filename: string): string {
  const withoutExt = filename.replace(/\.[^.]+$/, '');
  const clean = withoutExt.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return 'Pista sin título';

  return clean
    .split(' ')
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && LOWERCASE_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Automatically builds the base playlist from all audio files inside `public/music/`.
 */
export const BASE_PLAYLIST: PlaylistTrack[] = musicFiles
  .map((filename, index) => {
    const key = filename.toLowerCase();
    const override = KNOWN_TRACKS[key];
    return {
      order: override?.order ?? 100 + index,
      track: {
        id: filename.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        filename,
        title: override?.title ?? formatFilenameToTitle(filename),
        subtitle: override?.subtitle ?? 'Playlist del Squad',
        src: `/music/${encodeURIComponent(filename)}`,
        pattern: override?.pattern ?? AVAILABLE_PATTERNS[index % AVAILABLE_PATTERNS.length],
        palette: override?.palette ?? AVAILABLE_PALETTES[index % AVAILABLE_PALETTES.length],
        coverImage: override?.coverImage,
        isRemote: false,
      } satisfies PlaylistTrack,
    };
  })
  .sort((a, b) => a.order - b.order)
  .map((entry) => entry.track);

export const PLAYLIST: PlaylistTrack[] = BASE_PLAYLIST;

/**
 * Converts a Supabase `playlist_tracks` record into a frontend `PlaylistTrack`.
 */
export function remoteTrackToPlaylistTrack(
  remote: RemotePlaylistTrack,
  indexOffset = 0,
): PlaylistTrack {
  const pattern = (AVAILABLE_PATTERNS.includes(remote.pattern as DiscPattern)
    ? remote.pattern
    : AVAILABLE_PATTERNS[indexOffset % AVAILABLE_PATTERNS.length]) as DiscPattern;

  const palette: [string, string, string] =
    Array.isArray(remote.palette) && remote.palette.length === 3
      ? [remote.palette[0], remote.palette[1], remote.palette[2]]
      : AVAILABLE_PALETTES[indexOffset % AVAILABLE_PALETTES.length];

  return {
    id: `remote-${remote.id}`,
    filename: remote.title,
    title: remote.title,
    subtitle: remote.subtitle || 'Aporte del Squad',
    src: remote.audio_url,
    pattern,
    palette,
    isRemote: true,
  };
}
