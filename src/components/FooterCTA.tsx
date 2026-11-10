import React from 'react';
import confetti from 'canvas-confetti';
import { Send, Heart, ArrowUp } from 'lucide-react';

export const FooterCTA: React.FC = () => {
  const triggerCelebration = () => {
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.8 },
      // Soft sky blue palette (NO NEON)
      colors: ['#0284c7', '#38bdf8', '#7dd3fc', '#bae6fd', '#ffffff'],
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative pt-28 pb-12 overflow-hidden border-t border-sky-100 dark:border-white/10 bg-[#f4f9fd] dark:bg-[#070d18] transition-colors duration-300">
      {/* Background with video frame reflection */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <img
          src="/videos/frame_1.jpg"
          alt="Atmósfera del vagón de tren sobre el agua"
          className="w-full h-full object-cover opacity-10 dark:opacity-15 filter brightness-110 dark:brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f4f9fd] via-[#f4f9fd]/90 to-[#f4f9fd]/70 dark:from-[#070d18] dark:via-[#070d18]/90 dark:to-[#070d18]/70" />
      </div>

      <div className="max-w-5xl mx-auto px-6 text-center relative z-10 mb-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 dark:bg-white/10 border border-sky-200/80 dark:border-white/10 text-xs font-hand text-[#0284c7] dark:text-[#38bdf8] shadow-xs mb-8">
          <Heart className="w-3.5 h-3.5 text-[#0284c7] dark:text-[#38bdf8] fill-[#0284c7]/20 dark:fill-[#38bdf8]/20" />
          <span>por siempre y en cada partida</span>
        </div>

        {/* Big CTA Title */}
        <h2 className="text-4xl sm:text-6xl md:text-7xl text-slate-900 dark:text-white tracking-tight mb-6">
          El Próximo Capítulo Se Juega Esta Noche.
        </h2>

        <p className="max-w-xl mx-auto text-base sm:text-lg text-slate-700 dark:text-slate-300 font-light leading-relaxed mb-10">
          El canal de voz sigue abierto, los memes siguen llegando y la siguiente
          madrugada inolvidable está a solo un mensaje de distancia.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={triggerCelebration}
            className="flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#0284c7] text-white font-semibold text-sm hover:bg-[#0369a1] dark:bg-sky-600 dark:hover:bg-sky-500 transition-all shadow-md shadow-sky-600/25 dark:shadow-sky-950/50 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4 text-white" />
            <span>Celebrar Nuestra Amistad</span>
          </button>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 px-6 py-4 rounded-full liquid-glass border border-sky-200/80 dark:border-white/10 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
          >
            <ArrowUp className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span>Volver al Inicio</span>
          </button>
        </div>
      </div>

      {/* Giant Prism-style Watermark SVG in Soft Sky */}
      <div className="relative w-full overflow-hidden select-none pointer-events-none opacity-20 dark:opacity-10 my-6">
        <svg
          viewBox="0 0 1200 160"
          className="w-full h-auto text-sky-400 dark:text-sky-500 font-serif font-black tracking-widest fill-current"
        >
          <text
            x="50%"
            y="65%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[120px] uppercase font-serif"
          >
            DIEZOS & PANDILLA
          </text>
        </svg>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-6xl mx-auto px-6 pt-8 border-t border-sky-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <p className="font-mono">© 2026 DIEZOS, YAEI, NIGHTDARK, JHUNROW, ZOPAS, MICH, GABDIAUVA, RANGO & SQUAD.</p>
        <p className="font-hand text-sm text-[#0284c7] dark:text-[#38bdf8]">«momentos reales guardados en el corazón»</p>
      </div>
    </footer>
  );
};
