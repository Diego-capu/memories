import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Disc3,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import DiscCascadeCarousel, { type DiscCascadeItem } from './ui/disc-cascade-carousel';
import { PLAYLIST } from '../data/playlist';

const formatTime = (seconds: number = 0): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

interface CustomSliderProps {
  value: number;
  onChange: (percentage: number) => void;
  ariaLabel?: string;
}

const CustomSlider: React.FC<CustomSliderProps> = ({ value, onChange, ariaLabel }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      onChange(Math.min(Math.max(pct, 0), 100));
    },
    [onChange],
  );

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel ?? 'Progreso de la canción'}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          onChange(Math.min(100, value + 5));
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          onChange(Math.max(0, value - 5));
        }
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        updateFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (!dragging) return;
        updateFromClientX(e.clientX);
      }}
      onPointerUp={(e) => {
        if (!dragging) return;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        setDragging(false);
      }}
      onPointerCancel={() => setDragging(false)}
      className="relative w-full h-3 flex items-center cursor-pointer group touch-none"
    >
      <div className="relative w-full h-1.5 rounded-full bg-sky-950/10 dark:bg-white/15 overflow-visible">
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-[#0284c7] dark:bg-[#38bdf8] transition-[width] duration-75"
          style={{ width: `${value}%` }}
        />
        <span
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#0284c7] dark:bg-[#38bdf8] ring-2 ring-white dark:ring-[#0b1526] shadow-xs transition-transform ${
            dragging ? 'scale-125' : 'scale-90 group-hover:scale-110'
          }`}
          style={{ left: `${value}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Minimalist navbar music player fusing @kedhareswer/disc-cascade-carousel
 * and @chetanverma16/audio-player inside a compact liquid-glass popover.
 */
export const AudioPlayer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const shouldPlayOnSwitchRef = useRef(false);

  const totalTracks = PLAYLIST.length;
  const currentTrack = PLAYLIST[activeIndex] ?? PLAYLIST[0];

  const discItems: DiscCascadeItem[] = useMemo(
    () =>
      PLAYLIST.map((track) => ({
        title: track.title,
        src: track.coverImage,
        pattern: track.pattern,
        palette: track.palette,
        label: track.title,
        labelStyle: 'arc',
      })),
    [],
  );

  // Sync audio source changes cleanly and auto-play when switching tracks
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    setProgress(0);
    setCurrentTime(0);
    setDuration(0);

    if (shouldPlayOnSwitchRef.current) {
      shouldPlayOnSwitchRef.current = false;
      audio.play().catch((err) => {
        console.warn('Audio playback warning:', err);
      });
    }
  }, [currentTrack]);

  // Keep mute state synced
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Close popover on click outside or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.warn('Playback error or blocked by autoplay policy:', err);
      });
    }
  }, [currentTrack, isPlaying]);

  const selectTrack = useCallback(
    (nextIdx: number, autoPlay: boolean) => {
      if (totalTracks <= 0) return;
      const wrapped = ((nextIdx % totalTracks) + totalTracks) % totalTracks;
      if (wrapped === activeIndex) {
        if (autoPlay && !isPlaying) togglePlay();
        return;
      }
      shouldPlayOnSwitchRef.current = autoPlay || isPlaying;
      setActiveIndex(wrapped);
    },
    [activeIndex, isPlaying, togglePlay, totalTracks],
  );

  const handleNext = useCallback(
    (autoPlay = true) => {
      if (totalTracks <= 1) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          if (autoPlay) audioRef.current.play().catch(() => {});
        }
        return;
      }
      if (isShuffle) {
        let rand = Math.floor(Math.random() * totalTracks);
        if (rand === activeIndex) rand = (activeIndex + 1) % totalTracks;
        selectTrack(rand, autoPlay);
      } else {
        selectTrack(activeIndex + 1, autoPlay);
      }
    },
    [activeIndex, isShuffle, selectTrack, totalTracks],
  );

  const handlePrev = useCallback(
    (autoPlay = true) => {
      if (totalTracks <= 1) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          if (autoPlay) audioRef.current.play().catch(() => {});
        }
        return;
      }
      selectTrack(activeIndex - 1, autoPlay);
    },
    [activeIndex, selectTrack, totalTracks],
  );

  const handleSeek = useCallback((pct: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const nextTime = (pct / 100) * audio.duration;
    if (Number.isFinite(nextTime)) {
      audio.currentTime = nextTime;
      setProgress(pct);
      setCurrentTime(nextTime);
    }
  }, []);

  const handleEnded = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isRepeat) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else {
      handleNext(true);
    }
  }, [handleNext, isRepeat]);

  if (totalTracks === 0) return null;

  const formattedIndex = `${String(activeIndex + 1).padStart(2, '0')} / ${String(totalTracks).padStart(2, '0')}`;

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* Persistent audio element stays mounted so playback continues when popover closes */}
      <audio
        ref={audioRef}
        src={currentTrack.src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={() => {
          if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }}
        onTimeUpdate={() => {
          const audio = audioRef.current;
          if (!audio) return;
          const dur = audio.duration;
          const pct = Number.isFinite(dur) && dur > 0 ? (audio.currentTime / dur) * 100 : 0;
          setProgress(pct);
          setCurrentTime(audio.currentTime);
          if (Number.isFinite(dur) && dur > 0) setDuration(dur);
        }}
        onEnded={handleEnded}
        className="hidden"
      />

      {/* Minimalist Navbar Trigger Button (replaces the old single-track music toggle) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={
          isPlaying
            ? `Reproduciendo: ${currentTrack.title} — Abrir reproductor`
            : 'Abrir reproductor de música'
        }
        aria-label={
          isPlaying
            ? `Reproduciendo ${currentTrack.title}. Abrir reproductor`
            : 'Abrir reproductor de música'
        }
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer backdrop-blur-md shadow-xs active:scale-95 ${
          isPlaying || isOpen
            ? 'bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-500/40 text-[#0284c7] dark:text-[#38bdf8] shadow-sm'
            : 'bg-white/70 hover:bg-white border border-sky-200/80 text-slate-600 hover:text-slate-900 dark:bg-white/10 dark:hover:bg-white/15 dark:border-white/10 dark:text-slate-300 dark:hover:text-white'
        }`}
      >
        <Disc3
          className={`w-4 h-4 transition-transform ${
            isPlaying ? 'animate-[spin_5s_linear_infinite]' : ''
          }`}
        />
      </button>

      {/* Compact Popover combining 3D CD Disc Cascade + Audio Player */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="Reproductor de música del squad"
            initial={{ opacity: 0, y: -8, scale: 0.96, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, scale: 0.96, filter: 'blur(8px)' }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-[72px] inset-x-4 mx-auto max-w-[352px] sm:inset-x-auto sm:mx-0 sm:max-w-none sm:w-[352px] sm:absolute sm:top-[calc(100%+14px)] sm:right-0 z-50 pointer-events-auto"
          >
            <div className="relative flex flex-col items-center">
              {/* Soft ambient halo behind discs */}
              <div
                aria-hidden="true"
                className="absolute top-2 inset-x-8 h-28 rounded-full bg-sky-400/20 dark:bg-sky-400/15 blur-2xl pointer-events-none"
              />

              {/* Top half: miniature @kedhareswer/disc-cascade-carousel */}
              <div className="relative z-0 w-full rounded-t-3xl overflow-visible -mb-7">
                <DiscCascadeCarousel
                  items={discItems}
                  index={activeIndex}
                  onIndexChange={(idx) => selectTrack(idx, isPlaying)}
                  onSelect={togglePlay}
                  isSpinning={isPlaying}
                  height="160px"
                  discSize="clamp(104px, 30vw, 118px)"
                  spacing={0.78}
                  rise={0.07}
                  depth={0.34}
                  yaw={14}
                  fan={-10}
                  tilt={-3}
                  roll={24}
                  spin={18}
                  loop
                />
              </div>

              {/* Bottom half: @chetanverma16/audio-player adapted to frosted glass */}
              <div className="relative z-10 w-full rounded-3xl bg-white/95 dark:bg-[#091221]/95 backdrop-blur-2xl border border-sky-200/75 dark:border-white/12 p-4 pt-4 shadow-xl shadow-sky-950/15 dark:shadow-black/70">
                {/* Counter pill + compact prev/next disc steppers */}
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => setIsMuted((m) => !m)}
                    title={isMuted ? 'Activar volumen' : 'Silenciar'}
                    aria-label={isMuted ? 'Activar volumen' : 'Silenciar'}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-sky-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono tracking-wider bg-sky-50/90 dark:bg-white/10 border border-sky-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200">
                    {formattedIndex}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handlePrev(isPlaying)}
                      aria-label="Disco anterior"
                      className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white/70 dark:bg-white/5 border border-sky-200/60 dark:border-white/10 hover:bg-sky-50 dark:hover:bg-white/15 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNext(isPlaying)}
                      aria-label="Disco siguiente"
                      className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white/70 dark:bg-white/5 border border-sky-200/60 dark:border-white/10 hover:bg-sky-50 dark:hover:bg-white/15 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Track Title & Subtitle */}
                <div className="text-center mb-2.5 px-2">
                  <h3 className="text-lg text-slate-900 dark:text-white font-semibold leading-tight truncate">
                    {currentTrack.title}
                  </h3>
                  <p className="text-xs text-[#0284c7] dark:text-[#38bdf8] truncate mt-0.5">
                    {currentTrack.subtitle}
                  </p>
                </div>

                {/* Progress Bar + Timestamps */}
                <div className="flex flex-col gap-0.5 mb-3">
                  <CustomSlider value={progress} onChange={handleSeek} />
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Pill Controls Dock (Shuffle, Prev, Play/Pause, Next, Repeat) */}
                <div className="flex items-center justify-center">
                  <div className="inline-flex items-center gap-1.5 rounded-2xl bg-sky-50/85 dark:bg-white/[0.06] border border-sky-200/70 dark:border-white/10 px-2.5 py-1.5 shadow-xs">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setIsShuffle((s) => !s)}
                      title="Aleatorio"
                      aria-label="Modo aleatorio"
                      aria-pressed={isShuffle}
                      className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                        isShuffle
                          ? 'bg-sky-500/15 text-[#0284c7] dark:text-[#38bdf8]'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10'
                      }`}
                    >
                      <Shuffle className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handlePrev(true)}
                      title="Anterior"
                      aria-label="Canción anterior"
                      className="h-8 w-8 rounded-full flex items-center justify-center text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <SkipBack className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={togglePlay}
                      title={isPlaying ? 'Pausar' : 'Reproducir'}
                      aria-label={isPlaying ? 'Pausar canción' : 'Reproducir canción'}
                      className="h-9 w-9 rounded-full flex items-center justify-center bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38bdf8] dark:hover:bg-sky-300 text-white dark:text-slate-950 shadow-sm transition-colors cursor-pointer"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current translate-x-[1px]" />
                      )}
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleNext(true)}
                      title="Siguiente"
                      aria-label="Siguiente canción"
                      className="h-8 w-8 rounded-full flex items-center justify-center text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <SkipForward className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setIsRepeat((r) => !r)}
                      title="Repetir"
                      aria-label="Repetir canción"
                      aria-pressed={isRepeat}
                      className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                        isRepeat
                          ? 'bg-sky-500/15 text-[#0284c7] dark:text-[#38bdf8]'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10'
                      }`}
                    >
                      <Repeat className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
