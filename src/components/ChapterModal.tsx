import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  X,
  KeyRound,
  Loader2,
  AlertCircle,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import { type Chapter } from '../data/memories';

interface ChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterToEdit?: Chapter | null;
  onSave: (chapter: Chapter, isEdit: boolean) => Promise<void> | void;
}

export const ChapterModal: React.FC<ChapterModalProps> = ({
  isOpen,
  onClose,
  chapterToEdit,
  onSave,
}) => {
  const isEdit = Boolean(chapterToEdit);

  const [tag, setTag] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [quote, setQuote] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [pin, setPin] = useState(() => {
    try {
      return sessionStorage.getItem('squad_music_pin') || '';
    } catch {
      return '';
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (chapterToEdit) {
      setTag(chapterToEdit.tag || '');
      setLocation(chapterToEdit.location || '');
      setDate(chapterToEdit.date || '');
      setTitle(chapterToEdit.title || '');
      setStory(chapterToEdit.story || '');
      setQuote(chapterToEdit.quote || '');
      setImageUrl(chapterToEdit.imageUrl || '');
    } else {
      setTag('');
      setLocation('');
      setDate('');
      setTitle('');
      setStory('');
      setQuote('');
      setImageUrl('');
    }
    setErrorMsg(null);
  }, [chapterToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !story.trim()) {
      setErrorMsg('Por favor completa el título y la historia del capítulo.');
      return;
    }

    // Verify PIN
    const env = import.meta.env as Record<string, string | undefined>;
    const expectedPin = (env.VITE_MUSIC_PIN || env.MUSIC_PIN || '2026').trim();

    if (pin.trim() !== expectedPin) {
      setErrorMsg('PIN incorrecto. Ingresa el código del Squad para guardar cambios.');
      return;
    }

    try {
      sessionStorage.setItem('squad_music_pin', pin.trim());
    } catch {
      // ignore
    }

    setIsSubmitting(true);
    try {
      const chapterData: Chapter = {
        id: chapterToEdit?.id || `chapter-${Date.now()}`,
        tag: tag.trim() || 'Nuevo Capítulo',
        location: location.trim() || 'Discord // En línea',
        date: date.trim() || '2026',
        title: title.trim(),
        story: story.trim(),
        quote: quote.trim() ? (quote.startsWith('«') ? quote.trim() : `«${quote.trim()}»`) : '',
        imageUrl: imageUrl.trim() || '/images/Roblox_Zopas_May_Diezos_Selfie.png',
        isRemote: true,
      };

      await onSave(chapterData, isEdit);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el capítulo.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && onClose()}
            className="fixed inset-0 bg-slate-950/65 dark:bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg rounded-3xl bg-white/95 dark:bg-[#0b1424]/95 backdrop-blur-2xl border border-sky-200/80 dark:border-white/12 p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto scrollbar-thin"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-500/30 flex items-center justify-center text-[#0284c7] dark:text-[#38bdf8]">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                    {isEdit ? 'Editar Capítulo' : 'Agregar Nuevo Capítulo'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Línea de tiempo del Squad
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Etiqueta
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="Ej. Capítulo 05"
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fecha / Época
                  </label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="Ej. Mayo 2026"
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Ubicación o Contexto
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej. Roblox // Servidor de Siempre o Discord"
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Título del Capítulo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. El Gran Torneo de Medianoche"
                  required
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Historia / Relato <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  rows={3}
                  placeholder="Escribe la historia o anécdota de este capítulo..."
                  required
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Frase Destacada del Capítulo
                </label>
                <input
                  type="text"
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="Ej. «Esa noche nadie durmió hasta ganar.»"
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  URL de Imagen de Portada
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/images/... o https://..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8]"
                  />
                  <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {imageUrl && (
                  <div className="mt-2 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="Vista previa"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Security PIN */}
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
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8] font-mono tracking-widest"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Actions */}
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
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38bdf8] dark:hover:bg-sky-300 text-white dark:text-slate-950 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{isEdit ? 'Actualizar capítulo' : 'Guardar capítulo'}</span>
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
