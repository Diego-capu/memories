import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  X,
  Music,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import {
  formatFilenameToTitle,
  AVAILABLE_PATTERNS,
  AVAILABLE_PALETTES,
  remoteTrackToPlaylistTrack,
  extractSpotifyTrackId,
  type PlaylistTrack,
} from '../data/playlist';
import type { DiscPattern } from './ui/disc-cascade-carousel';
import {
  isSupabaseConfigured,
  uploadTrackToSupabase,
  uploadSpotifyTrackToSupabase,
} from '../lib/supabase';

interface UploadTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackUploaded: (track: PlaylistTrack) => void;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const SpotifyIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.497 17.307c-.218.358-.684.473-1.042.255-2.859-1.748-6.459-2.143-10.698-1.173-.41.094-.816-.164-.91-.574-.094-.41.164-.816.574-.91 4.636-1.06 8.608-.607 11.821 1.36.358.218.473.684.255 1.042zm1.467-3.262c-.276.448-.864.593-1.312.317-3.272-2.012-8.258-2.595-12.128-1.42-.505.153-1.042-.136-1.196-.641-.153-.505.136-1.042.641-1.196 4.417-1.341 9.907-.687 13.678 1.628.448.276.593.864.317 1.312zm.126-3.41c-3.924-2.33-10.386-2.544-14.135-1.405-.6.183-1.237-.16-1.42-.76-.183-.6.16-1.237.76-1.42 4.312-1.309 11.455-1.06 15.967 1.62.54.32.716 1.02.396 1.56-.32.54-1.02.716-1.56.396z" />
  </svg>
);

export const UploadTrackModal: React.FC<UploadTrackModalProps> = ({
  isOpen,
  onClose,
  onTrackUploaded,
}) => {
  const [mode, setMode] = useState<'upload' | 'spotify'>('upload');

  // File Upload State
  const [file, setFile] = useState<File | null>(null);

  // Spotify State
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isLoadingSpotify, setIsLoadingSpotify] = useState(false);
  const [spotifyThumbnail, setSpotifyThumbnail] = useState<string | null>(null);

  // Common Fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [pin, setPin] = useState(() => {
    try {
      return sessionStorage.getItem('squad_music_pin') || '';
    } catch {
      return '';
    }
  });
  const [selectedPattern, setSelectedPattern] = useState<DiscPattern>('horizon');
  const [selectedPaletteIdx, setSelectedPaletteIdx] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFile(null);
    setSpotifyUrl('');
    setSpotifyThumbnail(null);
    setTitle('');
    setSubtitle('');
    setSelectedPattern('horizon');
    setSelectedPaletteIdx(0);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const chosen = e.target.files?.[0];
    if (!chosen) return;

    if (chosen.size > MAX_FILE_SIZE) {
      setErrorMsg('El archivo supera los 25 MB. Por favor elige un archivo más liviano.');
      return;
    }

    setFile(chosen);
    if (!title.trim()) {
      setTitle(formatFilenameToTitle(chosen.name));
    }
  };

  const handleSpotifyUrlChange = async (url: string) => {
    setSpotifyUrl(url);
    setErrorMsg(null);

    const trackId = extractSpotifyTrackId(url.trim());
    if (!trackId) {
      setSpotifyThumbnail(null);
      return;
    }

    setIsLoadingSpotify(true);
    try {
      const res = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(url.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.title && !title.trim()) {
          setTitle(data.title);
        }
        if (!subtitle.trim()) {
          setSubtitle('Spotify • Playlist del Squad');
        }
        if (data.thumbnail_url) {
          setSpotifyThumbnail(data.thumbnail_url);
        }
      }
    } catch {
      // Fallback: silently continue without oembed preview
    } finally {
      setIsLoadingSpotify(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Verify Squad PIN
    const env = import.meta.env as Record<string, string | undefined>;
    const expectedPin = (env.VITE_MUSIC_PIN || env.MUSIC_PIN || '2026').trim();

    if (pin.trim() !== expectedPin) {
      setErrorMsg('PIN incorrecto. Pide el código de acceso al Squad para agregar canciones.');
      return;
    }

    try {
      sessionStorage.setItem('squad_music_pin', pin.trim());
    } catch {
      // ignore
    }

    const chosenPalette = AVAILABLE_PALETTES[selectedPaletteIdx] ?? AVAILABLE_PALETTES[0];

    // ==========================================
    // CASE 1: SPOTIFY TRACK LINK
    // ==========================================
    if (mode === 'spotify') {
      const cleanUrl = spotifyUrl.trim();
      const trackId = extractSpotifyTrackId(cleanUrl);

      if (!cleanUrl || !trackId) {
        setErrorMsg('Por favor introduce un enlace válido de Spotify (ej. https://open.spotify.com/track/...)');
        return;
      }

      const cleanTitle = title.trim() || 'Canción de Spotify';
      const cleanSubtitle = subtitle.trim() || 'Spotify • Playlist del Squad';

      setIsSubmitting(true);
      try {
        if (isSupabaseConfigured) {
          const remoteRecord = await uploadSpotifyTrackToSupabase({
            spotifyUrl: cleanUrl,
            title: cleanTitle,
            subtitle: cleanSubtitle,
            pattern: selectedPattern,
            palette: chosenPalette,
          });

          if (remoteRecord) {
            const newTrack = remoteTrackToPlaylistTrack(remoteRecord);
            setSuccessMsg('¡Canción de Spotify agregada a la playlist comunitaria!');
            setTimeout(() => {
              onTrackUploaded(newTrack);
              resetForm();
              onClose();
            }, 800);
          }
        } else {
          // Local session fallback
          const localTrack: PlaylistTrack = {
            id: `local-spotify-${Date.now()}`,
            filename: cleanTitle,
            title: cleanTitle,
            subtitle: `${cleanSubtitle} (Sesión actual)`,
            src: cleanUrl,
            pattern: selectedPattern,
            palette: chosenPalette,
            coverImage: spotifyThumbnail || undefined,
            isRemote: false,
            platform: 'spotify',
            spotifyId: trackId,
            spotifyUrl: cleanUrl,
          };

          setSuccessMsg('¡Canción de Spotify añadida para esta sesión!');
          setTimeout(() => {
            onTrackUploaded(localTrack);
            resetForm();
            onClose();
          }, 800);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al guardar la canción de Spotify.';
        setErrorMsg(msg);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ==========================================
    // CASE 2: MP3 FILE UPLOAD
    // ==========================================
    if (!file) {
      setErrorMsg('Por favor selecciona un archivo de audio (.mp3, .wav, .m4a).');
      return;
    }

    const cleanTitle = title.trim() || formatFilenameToTitle(file.name);
    const cleanSubtitle = subtitle.trim() || 'Aporte del Squad';

    setIsSubmitting(true);
    try {
      if (isSupabaseConfigured) {
        const remoteRecord = await uploadTrackToSupabase({
          file,
          title: cleanTitle,
          subtitle: cleanSubtitle,
          pattern: selectedPattern,
          palette: chosenPalette,
        });

        if (remoteRecord) {
          const newTrack = remoteTrackToPlaylistTrack(remoteRecord);
          setSuccessMsg('¡Canción agregada a la playlist comunitaria!');
          setTimeout(() => {
            onTrackUploaded(newTrack);
            resetForm();
            onClose();
          }, 900);
        }
      } else {
        const localUrl = URL.createObjectURL(file);
        const localTrack: PlaylistTrack = {
          id: `local-session-${Date.now()}`,
          filename: file.name,
          title: cleanTitle,
          subtitle: `${cleanSubtitle} (Sesión actual)`,
          src: localUrl,
          pattern: selectedPattern,
          palette: chosenPalette,
          isRemote: false,
          platform: 'upload',
        };

        setSuccessMsg('¡Canción añadida al reproductor para esta sesión!');
        setTimeout(() => {
          onTrackUploaded(localTrack);
          resetForm();
          onClose();
        }, 800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al subir la canción.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 dark:bg-black/70 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-3xl bg-white/95 dark:bg-[#0b1424]/95 backdrop-blur-2xl border border-sky-200/80 dark:border-white/12 p-5 sm:p-6 shadow-2xl shadow-sky-950/20 dark:shadow-black/80 z-10 max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-500/30 flex items-center justify-center text-[#0284c7] dark:text-[#38bdf8]">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                    Agregar canción
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Playlist comunitaria del Squad
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar modal"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 rounded-2xl bg-sky-950/5 dark:bg-white/[0.06] border border-sky-200/60 dark:border-white/10 mb-4">
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  mode === 'upload'
                    ? 'bg-white dark:bg-[#132238] text-[#0284c7] dark:text-[#38bdf8] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Subir Archivo MP3</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('spotify');
                  if (selectedPaletteIdx === 0) setSelectedPaletteIdx(1); // Default to Spotify green palette
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  mode === 'spotify'
                    ? 'bg-white dark:bg-[#132238] text-[#1db954] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <SpotifyIcon className="w-3.5 h-3.5 text-[#1db954]" />
                <span>Link de Spotify</span>
              </button>
            </div>

            {/* Supabase status notice if not configured */}
            {!isSupabaseConfigured && (
              <div className="mb-4 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>Modo local activo:</strong> La canción se reproducirá en esta sesión. Cuando conectes las credenciales de Supabase se guardará en la nube para todos.
                </span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {/* TAB 1: FILE UPLOAD */}
              {mode === 'upload' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/m4a,audio/aac"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full p-4 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
                      file
                        ? 'border-[#0284c7] dark:border-[#38bdf8] bg-sky-50/60 dark:bg-sky-950/30'
                        : 'border-slate-300 dark:border-white/15 hover:border-sky-400 dark:hover:border-sky-500/50 bg-slate-50/50 dark:bg-white/[0.02]'
                    }`}
                  >
                    <UploadCloud
                      className={`w-6 h-6 ${
                        file
                          ? 'text-[#0284c7] dark:text-[#38bdf8]'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    {file ? (
                      <>
                        <span className="text-xs font-medium text-slate-900 dark:text-white truncate max-w-[280px]">
                          {file.name}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • Haz clic para cambiar
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                          Selecciona o arrastra tu audio
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          MP3, WAV, M4A u OGG (máx. 25 MB)
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* TAB 2: SPOTIFY URL */}
              {mode === 'spotify' && (
                <div className="flex flex-col gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Enlace de Spotify <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={spotifyUrl}
                        onChange={(e) => handleSpotifyUrlChange(e.target.value)}
                        placeholder="https://open.spotify.com/track/..."
                        required={mode === 'spotify'}
                        className="w-full pl-9 pr-8 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1db954] transition-all"
                      />
                      <SpotifyIcon className="w-4 h-4 text-[#1db954] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      {isLoadingSpotify && (
                        <Loader2 className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Copia el enlace de la canción en Spotify (Compartir &rarr; Copiar enlace de la canción).
                    </p>
                  </div>

                  {/* Spotify Live Preview Card */}
                  {spotifyThumbnail && (
                    <div className="p-2.5 rounded-2xl bg-[#1db954]/10 border border-[#1db954]/25 flex items-center gap-3">
                      <img
                        src={spotifyThumbnail}
                        alt="Portada de Spotify"
                        className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-xs border border-white/20"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#1db954]/20 text-[#1db954] text-[10px] font-semibold mb-0.5">
                          <SpotifyIcon className="w-3 h-3" />
                          <span>Detectado en Spotify</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {title || 'Título de la pista'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {subtitle || 'Spotify'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Title input */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Título de la canción
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Mi Canción Favorita"
                  required
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8] transition-all"
                />
              </div>

              {/* Subtitle / Artist input */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dedicatoria o Artista <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ej. Dedicada por Diego • Squad 2026"
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8] transition-all"
                />
              </div>

              {/* 3D CD Visual Palette selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Estilo de disco 3D en el reproductor
                </label>
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {AVAILABLE_PALETTES.map((pal, idx) => (
                    <button
                      key={pal.join('-')}
                      type="button"
                      onClick={() => {
                        setSelectedPaletteIdx(idx);
                        setSelectedPattern(AVAILABLE_PATTERNS[idx % AVAILABLE_PATTERNS.length]);
                      }}
                      title={`Estilo ${idx + 1}`}
                      className={`relative w-8 h-8 rounded-full shrink-0 border transition-all cursor-pointer overflow-hidden ${
                        selectedPaletteIdx === idx
                          ? 'ring-2 ring-[#0284c7] dark:ring-[#38bdf8] scale-110 border-transparent shadow-xs'
                          : 'border-white/20 opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${pal[0]} 0%, ${pal[1]} 60%, ${pal[2]} 100%)`,
                      }}
                    >
                      {selectedPaletteIdx === idx && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Squad Security PIN input */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  PIN de seguridad del Squad <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Introduce el PIN de acceso"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8] transition-all font-mono tracking-widest"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Solo amigos del Squad con el PIN pueden publicar temas en la lista.
                </p>
              </div>

              {/* Feedback messages */}
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || (mode === 'upload' ? !file : !spotifyUrl.trim())}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    mode === 'spotify'
                      ? 'bg-[#1db954] hover:bg-[#1aa34a] dark:text-slate-950 font-semibold'
                      : 'bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38bdf8] dark:hover:bg-sky-300 dark:text-slate-950'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : mode === 'spotify' ? (
                    <>
                      <SpotifyIcon className="w-3.5 h-3.5" />
                      <span>Agregar desde Spotify</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Agregar canción</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};