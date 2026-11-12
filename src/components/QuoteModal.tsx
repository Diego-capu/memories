import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquareQuote,
  X,
  KeyRound,
  Loader2,
  AlertCircle,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import { type Quote } from '../data/memories';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteToEdit?: Quote | null;
  onSave: (quoteItem: Quote, isEdit: boolean) => Promise<void> | void;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({
  isOpen,
  onClose,
  quoteToEdit,
  onSave,
}) => {
  const isEdit = Boolean(quoteToEdit);

  const [title, setTitle] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [author, setAuthor] = useState('');
  const [context, setContext] = useState('');
  const [category, setCategory] = useState('');
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
    if (quoteToEdit) {
      setTitle(quoteToEdit.title || '');
      setQuoteText(quoteToEdit.quote || '');
      setAuthor(quoteToEdit.author || '');
      setContext(quoteToEdit.context || '');
      setCategory(quoteToEdit.category || '');
      setImageUrl(quoteToEdit.imageUrl || '');
    } else {
      setTitle('');
      setQuoteText('');
      setAuthor('');
      setContext('');
      setCategory('');
      setImageUrl('');
    }
    setErrorMsg(null);
  }, [quoteToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !quoteText.trim() || !author.trim()) {
      setErrorMsg('Por favor completa el título, la frase y el autor.');
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
      const formattedQuote = quoteText.trim().startsWith('«')
        ? quoteText.trim()
        : `«${quoteText.trim()}»`;

      const quoteData: Quote = {
        id: quoteToEdit?.id || `quote-${Date.now()}`,
        title: title.trim(),
        quote: formattedQuote,
        author: author.trim(),
        context: context.trim() || 'Momento memorable del Squad',
        category: category.trim() || 'Momentos',
        imageUrl: imageUrl.trim() || '/images/Roblox_Zopas_Banquillo_Diezos_Yaei.png',
        isRemote: true,
      };

      await onSave(quoteData, isEdit);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la frase.';
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
                  <MessageSquareQuote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                    {isEdit ? 'Editar Frase' : 'Agregar Nueva Frase'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Citas memorables & inside jokes del Squad
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
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Título de la Frase <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. La Confesión de la Babosa"
                  required
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Autor de la Frase <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Ej. Jhunrow, Zopas, Diezos"
                    required
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ej. Roblox Lore, Filosofía Gamer"
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Frase / Cita Literal <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  rows={3}
                  placeholder="Escribe la frase que quedó grabada para siempre..."
                  required
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Contexto de la Frase
                </label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Ej. En medio de una partida competitiva de madrugada"
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  URL de Captura de Pantalla
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
                      <span>{isEdit ? 'Actualizar frase' : 'Guardar frase'}</span>
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
