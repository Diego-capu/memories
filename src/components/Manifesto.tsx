import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

export const Manifesto: React.FC = () => {
  return (
    <section
      id="manifiesto"
      className="relative py-28 md:py-36 px-6 overflow-hidden border-t border-b border-sky-100 dark:border-white/10 bg-[#f4f9fd] dark:bg-[#0a1222] transition-colors duration-300"
    >
      {/* Subtle soft sky ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-sky-400/[0.04] dark:bg-sky-400/[0.07] blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        {/* Label badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 dark:bg-white/10 border border-sky-200/80 dark:border-white/10 text-xs font-hand text-sky-800 dark:text-sky-300 shadow-xs mb-8"
        >
          <Quote className="w-3.5 h-3.5 text-[#0284c7] dark:text-[#38bdf8]" />
          <span>el pacto silencioso de la pandilla</span>
        </motion.div>

        {/* Big quote statement */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-3xl sm:text-5xl md:text-6xl text-slate-900 dark:text-white leading-[1.25] tracking-tight mb-8"
        >
          «No recordamos días enteros; recordamos fragmentos: las pláticas hasta las
          5 AM con Yaei, el spawn camp en Overwatch, la cabaña de cerezos en Minecraft y
          el chat de Discord explotando con cada risa.»
        </motion.h2>

        {/* Editorial description */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-2xl mx-auto text-base sm:text-lg text-slate-700 dark:text-slate-300 font-light leading-relaxed"
        >
          Desde Colombia hasta México, esta es una hermandad que creció entre llamadas de
          voz, lobbies de Roblox con Jhunrow, Zopas, Mich, Gabdiauva y Rango, anécdotas de madrugada y risas
          interminables. Las imágenes de este sitio son el testimonio real de que la distancia
          nunca pudo separarnos.
        </motion.p>

        {/* Decorative memory tags in handwritten font with soft sky styling */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 flex flex-wrap justify-center gap-3 text-sm font-hand text-sky-800 dark:text-sky-300"
        >
          <span className="px-3.5 py-1 rounded-md bg-white dark:bg-white/10 border border-sky-200/70 dark:border-white/10 shadow-xs">#ColombiaYMexico</span>
          <span className="px-3.5 py-1 rounded-md bg-white dark:bg-white/10 border border-sky-200/70 dark:border-white/10 shadow-xs">#NochesDePlaticas</span>
          <span className="px-3.5 py-1 rounded-md bg-white dark:bg-white/10 border border-sky-200/70 dark:border-white/10 shadow-xs">#DiezosSquad</span>
          <span className="px-3.5 py-1 rounded-md bg-white dark:bg-white/10 border border-sky-200/70 dark:border-white/10 shadow-xs">#MemoriasReales</span>
        </motion.div>
      </div>
    </section>
  );
};
