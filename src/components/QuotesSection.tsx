import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquareQuote,
  ZoomIn,
  X,
  ArrowUpRight,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { QUOTES, type Quote } from '../data/memories';
import {
  fetchRemoteQuotes,
  saveQuoteToSupabase,
  deleteQuoteFromSupabase,
  type RemoteQuote,
} from '../lib/supabase';
import { QuoteModal } from './QuoteModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

export const QuotesSection: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    try {
      const cached = localStorage.getItem('squad_local_quotes');
      if (cached) return JSON.parse(cached);
    } catch {
      // fallback
    }
    return QUOTES;
  });
  const [activeImage, setActiveImage] = useState<Quote | null>(null);
  const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Sync with Supabase on mount
  useEffect(() => {
    let isMounted = true;
    fetchRemoteQuotes().then((remotes: RemoteQuote[]) => {
      if (!isMounted || remotes.length === 0) return;
      const mapped: Quote[] = remotes.map((r) => ({
        id: r.id,
        title: r.title,
        quote: r.quote,
        author: r.author,
        context: r.context,
        category: r.category,
        imageUrl: r.image_url,
        isRemote: true,
      }));

      setQuotes((prev) => {
        const remoteMap = new Map(mapped.map((q) => [q.id, q]));
        const merged = prev.map((q) => remoteMap.get(q.id) || q);
        mapped.forEach((q) => {
          if (!prev.some((p) => p.id === q.id)) {
            merged.push(q);
          }
        });
        try {
          localStorage.setItem('squad_local_quotes', JSON.stringify(merged));
        } catch {}
        return merged;
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenAdd = () => {
    setQuoteToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (quote: Quote, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setQuoteToEdit(quote);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (quote: Quote, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setQuoteToDelete(quote);
    setIsDeleteModalOpen(true);
  };

  const handleSaveQuote = async (saved: Quote, isEdit: boolean) => {
    await saveQuoteToSupabase(saved, isEdit);
    setQuotes((prev) => {
      const next = isEdit
        ? prev.map((q) => (q.id === saved.id ? saved : q))
        : [...prev, saved];
      try {
        localStorage.setItem('squad_local_quotes', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (activeImage?.id === saved.id) {
      setActiveImage(saved);
    }
  };

  const handleConfirmDelete = async () => {
    if (!quoteToDelete) return;
    await deleteQuoteFromSupabase(quoteToDelete.id);
    setQuotes((prev) => {
      const next = prev.filter((q) => q.id !== quoteToDelete.id);
      try {
        localStorage.setItem('squad_local_quotes', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (activeImage?.id === quoteToDelete.id) {
      setActiveImage(null);
    }
  };

  return (
    <section id="frases" className="py-24 md:py-32 px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 dark:bg-white/10 border border-sky-200/80 dark:border-white/10 text-sm text-sky-800 dark:text-sky-300 shadow-xs mb-4">
          <MessageSquareQuote className="w-4 h-4 text-[#0284c7] dark:text-[#38bdf8]" />
          <span>inside jokes & citas de madrugada</span>
        </div>
        <h2 className="text-4xl sm:text-5xl md:text-6xl text-slate-900 dark:text-white tracking-tight mb-4">
          Frases Que Quedaron Para Siempre
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg font-light mb-6">
          Toca cualquier tarjeta para abrir la captura original y revivir la historia completa.
        </p>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-[#0284c7] dark:text-[#38bdf8] border border-sky-300/40 dark:border-sky-500/30 font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar nueva frase</span>
        </button>
      </div>

      {/* Grid of Uniform Capture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {quotes.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            onClick={() => setActiveImage(item)}
            className="liquid-glass rounded-2xl p-4 sm:p-5 flex flex-col justify-between cursor-pointer border border-sky-100 dark:border-white/10 hover:border-sky-300 dark:hover:border-sky-400/50 hover:shadow-xl transition-all duration-300 group relative"
          >
            {/* Top Bar: Category & Tag + Action Buttons */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-[#0284c7] dark:text-[#38bdf8] border border-sky-200 dark:border-white/10 font-semibold text-xs">
                  {item.category}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#0284c7] dark:text-[#38bdf8]" />
                  {item.author}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => handleOpenEdit(item, e)}
                  title="Editar frase"
                  className="p-1 rounded-full hover:bg-[#0284c7] hover:text-white dark:hover:bg-[#38bdf8] dark:hover:text-slate-900 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleOpenDelete(item, e)}
                  title="Eliminar frase"
                  className="p-1 rounded-full hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Visual Capture Preview — Fixed Aspect Ratio */}
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-sky-100 dark:border-white/10 mb-4 group-hover:border-sky-300 dark:group-hover:border-sky-400/50 transition-colors">
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              {/* Hover overlay cue */}
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white text-xs shadow-md flex items-center gap-1.5 transform scale-90 group-hover:scale-100 transition-transform">
                  <ZoomIn className="w-3.5 h-3.5 text-[#0284c7] dark:text-[#38bdf8]" />
                  <span>Abrir captura y leer historia</span>
                </div>
              </div>
            </div>

            {/* Bottom Card Info — Balanced & Uniform */}
            <div>
              <h3 className="text-xl sm:text-2xl text-slate-900 dark:text-white group-hover:text-[#0284c7] dark:group-hover:text-[#38bdf8] transition-colors leading-tight mb-2">
                {item.title}
              </h3>

              <div className="pt-2.5 border-t border-sky-100 dark:border-white/10 flex items-center justify-between text-xs text-[#0284c7] dark:text-[#38bdf8] font-semibold">
                <span className="flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Ver captura e historia</span>
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal: Here is where the full quote and story appear when the image capture is opened */}
      <AnimatePresence>
        {activeImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full rounded-3xl overflow-hidden bg-white dark:bg-[#0b1526] border border-sky-100 dark:border-white/10 p-5 sm:p-7 cursor-default shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Action & Close Buttons */}
              <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(activeImage)}
                  className="p-2 rounded-full bg-slate-100 hover:bg-[#0284c7] hover:text-white dark:bg-white/10 dark:hover:bg-[#38bdf8] dark:hover:text-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors shadow-xs"
                  title="Editar frase"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDelete(activeImage)}
                  className="p-2 rounded-full bg-slate-100 hover:bg-red-600 hover:text-white dark:bg-white/10 dark:hover:bg-red-500 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 cursor-pointer transition-colors shadow-xs"
                  title="Eliminar frase"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImage(null)}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors shadow-xs"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Header */}
              <div className="mb-4 pr-24">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-[#0284c7] dark:text-[#38bdf8] border border-sky-200 dark:border-white/10 font-semibold">
                    {activeImage.category}
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-slate-600 dark:text-slate-300 text-xs">{activeImage.author}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl text-slate-900 dark:text-white leading-tight">
                  {activeImage.title}
                </h3>
              </div>

              {/* Scrollable Content: Capture + Full Text */}
              <div className="overflow-y-auto pr-1 flex-1 flex flex-col gap-5">
                {/* Full Capture Image */}
                <div className="rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/60 border border-sky-100 dark:border-white/10 p-2 flex items-center justify-center shadow-inner">
                  <img
                    src={activeImage.imageUrl}
                    alt={activeImage.title}
                    className="max-h-[50vh] w-auto object-contain rounded-xl"
                  />
                </div>

                {/* The Full Quote Text */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#f0f8ff] dark:bg-[#0e1b30] border border-sky-200/80 dark:border-white/10 shadow-xs">
                  <p className="text-xs uppercase tracking-wider text-[#0284c7] dark:text-[#38bdf8] mb-1.5 flex items-center gap-1.5 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-[#0284c7] dark:text-[#38bdf8]" />
                    <span>Lo que se dijo en ese momento:</span>
                  </p>
                  <blockquote className="text-xl sm:text-2xl text-slate-900 dark:text-white leading-relaxed">
                    {activeImage.quote}
                  </blockquote>
                </div>

                {/* The Full Context / Story */}
                <div className="px-1 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-white block mb-1">Contexto del momento:</strong>
                  {activeImage.context}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <QuoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveQuote}
        quoteToEdit={quoteToEdit}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setQuoteToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Frase"
        itemName={quoteToDelete?.title || 'esta frase'}
        itemType="frase"
      />
    </section>
  );
};
