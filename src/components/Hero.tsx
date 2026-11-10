import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export const Hero: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Guarantee browser autoplay by setting DOM muted and calling play()
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const headline = 'Noches de Pláticas, Partidas y Recuerdos que No Se Borran.';
  const words = headline.split(' ');

  const crew = ['Diezos', 'Yaei', 'NightDark', 'Jhunrow', 'Zopas', 'Mich', 'Gabdiauva', 'Rango'];

  return (
    <section
      id="inicio"
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{ isolation: 'isolate' }}
    >
      {/* 1. Full-bleed background video — integrated seamlessly into the page, NO player controls */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster="/videos/frame_1.jpg"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 z-0 h-full w-full object-cover object-center filter brightness-[0.98] contrast-[1.02]"
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      {/* Luminous light veil overlay so video blends into the soft daylight aesthetic */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-white/20 dark:bg-[#070d18]/60 backdrop-blur-[1px] transition-colors duration-300"
      />

      {/* Soft gradient transition at the bottom to smoothly connect into the canvas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-52 bg-gradient-to-t from-[#faf8f5] via-[#faf8f5]/85 to-transparent dark:from-[#070d18] dark:via-[#070d18]/85 dark:to-transparent transition-colors duration-300"
      />

      {/* 2. Hero Content Layer (z-10) matching 21st Prism's exact layout */}
      <div className="relative z-10 flex flex-1 flex-col items-center px-6 pt-32 sm:pt-40 text-center">
        {/* H1 Headline with Prism's large italic serif style */}
        <h1 className="mt-4 max-w-4xl font-serif text-5xl italic leading-[1.05] tracking-tight text-stone-900 dark:text-white md:text-7xl lg:text-[5.5rem]">
          <span className="inline-flex flex-wrap justify-center gap-x-[0.25em]">
            {words.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, filter: 'blur(6px)', y: 15 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.15 + i * 0.06,
                  ease: [0.25, 0.4, 0.25, 1],
                }}
                className={
                  word === 'Pláticas,' || word === 'Partidas' || word === 'Recuerdos'
                    ? 'text-[#0284c7] dark:text-[#38bdf8] underline decoration-sky-400/40 dark:decoration-sky-400/60 decoration-1 underline-offset-8'
                    : 'text-stone-900 dark:text-white'
                }
              >
                {word}
              </motion.span>
            ))}
          </span>
        </h1>

        {/* Subtitle — Reinforced in solid deep black for clear reading in light mode, soft white in dark mode */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-6 max-w-2xl text-base sm:text-lg font-medium leading-relaxed text-black dark:text-slate-200"
        >
          Como este tren sobre el agua que sigue avanzando sereno: llamadas de Discord
          de madrugada, lobbies de Roblox, el refugio de cerezos en Minecraft y una
          amistad sincera que borró cualquier distancia geográfica.
        </motion.p>

        {/* Handwritten note in Sky Blue */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="mt-2 font-hand text-xl text-[#0284c7] dark:text-[#38bdf8]"
        >
          «los mejores viajes son con las personas correctas»
        </motion.div>

        {/* Discord CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.95 }}
          className="mt-7"
        >
          <a
            href="https://discord.gg/cG4ThNMjf"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#0284c7] text-white font-semibold text-sm hover:bg-[#0369a1] dark:bg-sky-600 dark:hover:bg-sky-500 transition-all shadow-md shadow-sky-600/25 dark:shadow-sky-950/50 hover:scale-105 active:scale-95"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 text-white shrink-0"
            >
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span>Únete a Nuestro Discord</span>
            <ArrowUpRight className="w-4 h-4 text-white/90 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </motion.div>

        {/* 3. The Crew Partners Row anchored at the bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mt-auto flex flex-col items-center gap-4 pt-12 pb-10"
        >
          <ul className="flex flex-wrap items-center justify-center gap-x-10 sm:gap-x-14 gap-y-3">
            {crew.map((name) => (
              <li
                key={name}
                className="group flex flex-col items-center transition-colors"
              >
                <span className="font-serif text-2xl md:text-3xl tracking-tight text-stone-800 dark:text-slate-100 italic group-hover:text-[#0284c7] dark:group-hover:text-[#38bdf8] transition-colors">
                  {name}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
};
