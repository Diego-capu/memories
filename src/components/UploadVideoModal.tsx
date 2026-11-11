import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  X,
  Check,
  AlertCircle,
  Loader2,
  KeyRound,
  ExternalLink,
  Info,
} from 'lucide-react';
import { parseVideoUrl, type ParsedVideoInfo } from '../utils/videoParser';
import { VIDEO_CATEGORIES, type SquadVideo } from '../data/videos';
import { isSupabaseConfigured, addVideoToSupabase } from '../lib/supabase';

interface UploadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoAdded: (video: SquadVideo) => void;
}

export const UploadVideoModal: React.FC<UploadVideoModalProps> = ({
  isOpen,
  onClose,
  onVideoAdded,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [tag, setTag] = useState<string>('Momentos');
  const [pin, setPin] = useState(() => {
    try {
      return sessionStorage.getItem('squad_music_pin') || '';
    } catch {
      return '';
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Live URL parsing
  const parsedInfo: ParsedVideoInfo | null = useMemo(() => {
    return parseVideoUrl(url);
  }, [url]);

  const resetForm = () => {
    setUrl('');
    setTitle('');
    setAuthor('');
    setTag('Momentos');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!parsedInfo) {
      setErrorMsg('Por favor ingresa un enlace válido de YouTube o Google Drive.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Por favor ingresa un título para el video o clip.');
      return;
    }

    // PIN Verification
    const env = import.meta.env as Record<string, string | undefined>;
    const expectedPin = (env.VITE_MUSIC_PIN || env.MUSIC_PIN || '2026').trim();

    if (pin.trim() !== expectedPin) {
      setErrorMsg('PIN incorrecto. Pide el código de acceso al Squad para agregar clips.');
      return;
    }

    try {
      sessionStorage.setItem('squad_music_pin', pin.trim());
    } catch {
      // ignore
    }

    setIsSubmitting(true);

    try {
      const cleanTitle = title.trim();
      const cleanAuthor = author.trim() || 'Squad';

      if (isSupabaseConfigured) {
        const remote = await addVideoToSupabase({
          title: cleanTitle,
          author: cleanAuthor,
          videoUrl: parsedInfo.directUrl,
          platform: parsedInfo.platform,
          embedUrl: parsedInfo.embedUrl,
          thumbnailUrl: parsedInfo.thumbnailUrl,
          tag,
        });

        if (remote) {
          const newVideo: SquadVideo = {
            id: remote.id,
            title: remote.title,
            author: remote.author,
            originalUrl: remote.video_url,
            embedUrl: remote.embed_url,
            platform: remote.platform,
            thumbnailUrl: remote.thumbnail_url,
            tag: remote.tag,
            createdAt: remote.created_at,
            isRemote: true,
          };

          setSuccessMsg('¡Clip agregado a la sala de cine del Squad!');
          setTimeout(() => {
            onVideoAdded(newVideo);
            resetForm();
            onClose();
          }, 900);
        }
      } else {
        // Fallback for session
        const localVideo: SquadVideo = {
          id: `local-video-${Date.now()}`,
          title: cleanTitle,
          author: `${cleanAuthor} (Sesión actual)`,
          originalUrl: parsedInfo.directUrl,
          embedUrl: parsedInfo.embedUrl,
          platform: parsedInfo.platform,
          thumbnailUrl: parsedInfo.thumbnailUrl,
          tag,
          createdAt: new Date().toISOString(),
          isRemote: false,
        };

        setSuccessMsg('¡Clip añadido a la sala para esta sesión!');
        setTimeout(() => {
          onVideoAdded(localVideo);
          resetForm();
          onClose();
        }, 800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el video.';
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
            className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg rounded-3xl bg-white/95 dark:bg-[#0b1424]/95 backdrop-blur-2xl border border-sky-200/80 dark:border-white/12 p-5 sm:p-6 shadow-2xl shadow-sky-950/20 dark:shadow-black/80 z-10 max-h-[90vh] overflow-y-auto scrollbar-thin"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-500/30 flex items-center justify-center text-[#0284c7] dark:text-[#38bdf8]">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                    Compartir clip o video
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    YouTube o Google Drive • Cine del Squad
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {/* URL Input with Live Detection */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Enlace del video <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="https://www.youtube.com/watch?v=... o Google Drive"
                    required
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8] transition-all"
                  />
                </div>

                {/* Live Platform Badge & Thumbnail Preview */}
                <div className="mt-1.5 flex items-center justify-between text-xs">
                  {parsedInfo ? (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          parsedInfo.platform === 'youtube'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        {parsedInfo.platform === 'youtube' ? 'YouTube detectado' : 'Google Drive detectado'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Soporta YouTube (normal, corto o shorts) y enlaces de Google Drive.
                    </span>
                  )}
                </div>
              </div>

              {/* YouTube Thumbnail Preview Card */}
              {parsedInfo?.thumbnailUrl && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 aspect-video max-h-36 bg-black/40 flex items-center justify-center">
                  <img
                    src={parsedInfo.thumbnailUrl}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5">
                    <span className="text-[11px] text-white/90 font-medium truncate">
                      Vista previa de miniatura
                    </span>
                  </div>
                </div>
              )}

              {/* Google Drive Tip Banner */}
              {parsedInfo?.platform === 'drive' && (
                <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-start gap-2 text-xs text-sky-800 dark:text-sky-200">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#0284c7] dark:text-[#38bdf8]" />
                  <span>
                    <strong>Importante para Google Drive:</strong> En Google Drive, haz clic derecho en el video &gt; <em>Compartir</em> y asegúrate de que esté configurado como <strong>&quot;Cualquier persona con el enlace puede ver&quot;</strong>.
                  </span>
                </div>
              )}

              {/* Title input */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Título del video o clip <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Anécdota épica en Roblox / Partida de madrugada"
                  required
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8] transition-all"
                />
              </div>

              {/* Author input & Category Selector (2 columns on sm) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Quién grabó el clip <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Ej. Diego, Yaei, Squad"
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-[#0f1a2c] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8] transition-all cursor-pointer"
                  >
                    {VIDEO_CATEGORIES.filter((c) => c !== 'Todos').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Squad Security PIN */}
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
                  Solo amigos del Squad con el PIN pueden agregar clips a la sala.
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
                  disabled={isSubmitting || !parsedInfo}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38bdf8] dark:hover:bg-sky-300 text-white dark:text-slate-950 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Agregar clip</span>
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
