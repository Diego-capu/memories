import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, PhoneCall, Smile, Infinity, ShieldCheck } from 'lucide-react';
import { PILLARS } from '../data/memories';

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-5 h-5 text-[#0284c7] dark:text-[#38bdf8]" />,
  PhoneCall: <PhoneCall className="w-5 h-5 text-sky-700 dark:text-sky-300" />,
  Smile: <Smile className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
  Infinity: <Infinity className="w-5 h-5 text-slate-700 dark:text-slate-300" />,
};

const iconBgMap: Record<string, string> = {
  Sparkles: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200/80 dark:border-white/10',
  PhoneCall: 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-200/70 dark:border-white/10',
  Smile: 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-200/70 dark:border-white/10',
  Infinity: 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/10',
};

export const BentoGrid: React.FC = () => {
  return (
    <section id="pilares" className="py-24 md:py-32 px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 dark:bg-white/10 border border-sky-200/80 dark:border-white/10 text-xs font-hand text-sky-800 dark:text-sky-300 shadow-xs uppercase mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0284c7] dark:text-[#38bdf8]" />
          <span>los cimientos</span>
        </div>
        <h2 className="text-3xl sm:text-5xl md:text-6xl text-slate-900 dark:text-white tracking-tight mb-4">
          Lo Que Nos Mantiene Unidos
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-light">
          No hace falta decirlo en voz alta, pero estas cuatro reglas sostienen cada recuerdo.
        </p>
      </div>

      {/* Grid of 4 liquid glass cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PILLARS.map((pillar, i) => (
          <motion.div
            key={pillar.id}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="liquid-glass rounded-2xl p-6 sm:p-7 flex flex-col justify-between group transition-all duration-300 hover:border-sky-300 dark:group-hover:border-sky-400/50 hover:shadow-lg h-full"
          >
            <div>
              {/* Badge & Icon */}
              <div className="flex items-center justify-between mb-6">
                <div className={`p-2.5 rounded-xl border ${iconBgMap[pillar.icon]} group-hover:scale-110 transition-transform`}>
                  {iconMap[pillar.icon]}
                </div>
                <span className="text-xs text-[#0284c7] dark:text-[#38bdf8]">
                  {pillar.badge}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight mb-2 group-hover:text-[#0284c7] dark:group-hover:text-[#38bdf8] transition-colors">
                {pillar.title}
              </h3>

              {/* Description */}
              <p className="text-slate-600 dark:text-slate-300 text-base font-light leading-relaxed">
                {pillar.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
