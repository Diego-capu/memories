import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Compass, Sparkles, ZoomIn, X } from 'lucide-react';
import { CHAPTERS, type Chapter } from '../data/memories';

export const Chapters: React.FC = () => {
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  return (
    <section id="capitulos" className="py-24 md:py-32 px-6 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-20 md:mb-28">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 dark:bg-white/10 border border-sky-200/80 dark:border-white/10 text-sm text-sky-800 dark:text-sky-300 shadow-xs mb-4">
          <Compass className="w-4 h-4 text-[#0284c7] dark:text-[#38bdf8]" />
          <span>línea de tiempo</span>
        </div>
        <h2 className="text-4xl sm:text-5xl md:text-6xl text-slate-900 dark:text-white tracking-tight mb-4">
          Capítulos que Nos Marcaron
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg font-light">
          Cuatro momentos que resumen por qué este grupo de amigos es irrepetible.
        </p>
      </div>

      {/* Alternating rows */}
      <div className="flex flex-col gap-24 md:gap-36">
        {CHAPTERS.map((chapter, idx) => {
          const isReverse = idx % 2 !== 0;

          return (
            <div
              key={chapter.id}
              className={`flex flex-col items-center gap-12 lg:gap-20 ${
                isReverse ? 'lg:flex-row-reverse' : 'lg:flex-row'
              }`}
            >
              {/* Media Glass Card */}
              <motion.div
                initial={{ opacity: 0, x: isReverse ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                onClick={() => setSelectedChapter(chapter)}
                className="w-full lg:w-1/2 relative group cursor-pointer"
              >
                <div className="relative rounded-2xl md:rounded-3xl overflow-hidden liquid-glass p-3 transition-all duration-500 group-hover:border-sky-300 dark:group-hover:border-sky-400/50 group-hover:shadow-xl">
                  {/* Image container */}
                  <div className="relative aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden bg-stone-100 dark:bg-slate-900 flex items-center justify-center">
                    <img
                      src={chapter.imageUrl}
                      alt={chapter.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Image top badges */}
                    <div className="absolute top-4 inset-x-4 flex justify-between items-center text-xs">
                      <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-stone-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 shadow-sm">
                        <MapPin className="w-3 h-3 text-[#0284c7] dark:text-[#38bdf8]" />
                        {chapter.location}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-stone-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5 shadow-sm">
                        <Calendar className="w-3 h-3 text-stone-400 dark:text-slate-400" />
                        {chapter.date}
                      </span>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs shadow-md flex items-center gap-1.5">
                        <ZoomIn className="w-3.5 h-3.5 text-[#0284c7] dark:text-[#38bdf8]" />
                        <span>Abrir captura en grande</span>
                      </div>
                    </div>

                    {/* Bottom quote on image */}
                    <div className="absolute bottom-4 inset-x-4">
                      <p className="text-base sm:text-lg text-slate-900 dark:text-white bg-white/95 dark:bg-[#0b1526]/95 backdrop-blur-md p-3.5 rounded-xl border border-sky-100 dark:border-white/10 shadow-md">
                        {chapter.quote}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delicate soft sky ambient shadow behind card */}
                <div className="absolute -inset-2 bg-gradient-to-r from-sky-400/10 via-sky-200/20 to-transparent blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              </motion.div>

              {/* Story Content */}
              <motion.div
                initial={{ opacity: 0, x: isReverse ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
                className="w-full lg:w-1/2 flex flex-col items-start"
              >
                <div className="flex items-center gap-2 mb-3 text-xs tracking-widest text-[#0284c7] dark:text-[#38bdf8] uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-[#0284c7] dark:text-[#38bdf8]" />
                  <span>{chapter.tag}</span>
                </div>

                <h3 className="text-3xl sm:text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
                  {chapter.title}
                </h3>

                <p className="text-slate-700 dark:text-slate-300 text-base sm:text-lg font-light leading-relaxed mb-6">
                  {chapter.story}
                </p>

                <div className="flex items-center gap-3 text-base text-[#0284c7] dark:text-[#38bdf8]">
                  <span className="h-px w-8 bg-sky-200 dark:bg-sky-900/60" />
                  <span>guardado en la memoria colectiva</span>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Chapter Lightbox Modal */}
      <AnimatePresence>
        {selectedChapter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedChapter(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full rounded-3xl overflow-hidden bg-white dark:bg-[#0b1526] border border-sky-100 dark:border-white/10 shadow-2xl p-5 sm:p-7 cursor-default max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => setSelectedChapter(null)}
                className="absolute top-5 right-5 z-10 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="overflow-y-auto pr-1 flex-1 flex flex-col gap-5">
                <div className="rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/60 border border-sky-100 dark:border-white/10 flex items-center justify-center p-2 shadow-inner">
                  <img
                    src={selectedChapter.imageUrl}
                    alt={selectedChapter.title}
                    className="max-h-[55vh] w-auto object-contain rounded-xl"
                  />
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[#f8fbfe] dark:bg-[#0e1b30] border border-sky-100 dark:border-white/10 shadow-xs">
                  <div className="flex items-center gap-2 mb-2 text-xs text-[#0284c7] dark:text-[#38bdf8]">
                    <span>{selectedChapter.tag}</span>
                    <span>•</span>
                    <span>{selectedChapter.location}</span>
                    <span>•</span>
                    <span>{selectedChapter.date}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl text-slate-900 dark:text-white mb-2">
                    {selectedChapter.title}
                  </h3>
                  <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                    {selectedChapter.story}
                  </p>
                  <blockquote className="p-3 bg-white dark:bg-[#0b1526] rounded-xl border border-sky-100 dark:border-white/10 text-slate-800 dark:text-slate-200 text-base italic">
                    {selectedChapter.quote}
                  </blockquote>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
