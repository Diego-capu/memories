import musicFiles from 'virtual:music-playlist';
import type { DiscPattern } from '../components/ui/disc-cascade-carousel';

export interface PlaylistTrack {
  id: string;
  filename: string;
  title: string;
  subtitle: string;
  src: string;
  pattern: DiscPattern;
  palette: [string, string, string];
  coverImage?: string;
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

const FALLBACK_PATTERNS: DiscPattern[] = [
  'horizon',
  'eclipse',
  'rings',
  'sunburst',
  'halftone',
  'mosaic',
  'stripes',
];

const FALLBACK_PALETTES: [string, string, string][] = [
  ['#bae6fd', '#0369a1', '#f8fafc'],
  ['#e2e8f0', '#1e293b', '#38bdf8'],
  ['#fce7f3', '#831843', '#7dd3fc'],
  ['#dbeafe', '#1d4ed8', '#e0f2fe'],
  ['#0f172a', '#1e293b', '#7dd3fc'],
];

const LOWERCASE_WORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', 'con', 'a']);

function formatFilenameToTitle(filename: string): string {
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
 * Automatically builds the playlist from all audio files inside `public/music/`.
 * Dropping a new `.mp3` into `public/music/` adds it cleanly to the carousel.
 */
export const PLAYLIST: PlaylistTrack[] = musicFiles
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
        pattern: override?.pattern ?? FALLBACK_PATTERNS[index % FALLBACK_PATTERNS.length],
        palette: override?.palette ?? FALLBACK_PALETTES[index % FALLBACK_PALETTES.length],
        coverImage: override?.coverImage,
      } satisfies PlaylistTrack,
    };
  })
  .sort((a, b) => a.order - b.order)
  .map((entry) => entry.track);
