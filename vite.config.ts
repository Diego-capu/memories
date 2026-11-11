import fs from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm']);
const VIRTUAL_MUSIC_ID = 'virtual:music-playlist';
const RESOLVED_VIRTUAL_MUSIC_ID = '\0' + VIRTUAL_MUSIC_ID;

/**
 * Scans `public/music` and exposes filenames via `virtual:music-playlist`.
 * Automatically triggers a client reload in dev when audio files are added or removed.
 */
function autoMusicPlaylistPlugin(): Plugin {
  const musicDir = path.resolve(process.cwd(), 'public', 'music');

  const scanFiles = (): string[] => {
    if (!fs.existsSync(musicDir)) return [];
    return fs
      .readdirSync(musicDir, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isFile() && AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase()),
      )
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  };

  return {
    name: 'auto-music-playlist',
    resolveId(id) {
      if (id === VIRTUAL_MUSIC_ID) return RESOLVED_VIRTUAL_MUSIC_ID;
      return null;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_MUSIC_ID) return null;
      const files = scanFiles();
      return `export default ${JSON.stringify(files)};`;
    },
    configureServer(server) {
      if (!fs.existsSync(musicDir)) {
        fs.mkdirSync(musicDir, { recursive: true });
      }
      server.watcher.add(musicDir);

      const handleMusicChange = (filePath: string) => {
        if (!filePath.startsWith(musicDir)) return;
        const ext = path.extname(filePath).toLowerCase();
        if (!AUDIO_EXTENSIONS.has(ext)) return;

        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MUSIC_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };

      server.watcher.on('add', handleMusicChange);
      server.watcher.on('unlink', handleMusicChange);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), autoMusicPlaylistPlugin()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'SUPABASE_'],
});
