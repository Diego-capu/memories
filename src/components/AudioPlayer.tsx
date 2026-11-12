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
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  ListMusic,
  Plus,
  Music,
  Trash2,
} from 'lucide-react';
import DiscCascadeCarousel, { type DiscCascadeItem } from './ui/disc-cascade-carousel';
import {
  BASE_PLAYLIST,
  remoteTrackToPlaylistTrack,
  type PlaylistTrack,
} from '../data/playlist';
import { fetchRemoteTracks, deleteTrackFromSupabase } from '../lib/supabase';
import { UploadTrackModal } from './UploadTrackModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

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
  className?: string;
  barClassName?: string;
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  onChange,
  ariaLabel,
  className = 'h-3',
  barClassName = 'h-1.5',
}) => {
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
      className={`relative w-full flex items-center cursor-pointer group touch-none ${className}`}
    >
      <div
        className={`relative w-full rounded-full bg-sky-950/10 dark:bg-white/15 overflow-visible ${barClassName}`}
      >
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

export const AudioPlayer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'disc' | 'list'>('disc');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<PlaylistTrack | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Dynamic Playlist state merging local + remote Supabase tracks
  const [tracks, setTracks] = useState<PlaylistTrack[]>(BASE_PLAYLIST);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Volume control state (persisted to localStorage)
  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('squad_music_volume');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) return parsed;
      }
    } catch {
      // fallback
    }
    return 0.8;
  });
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(volume);

  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const shouldPlayOnSwitchRef = useRef(false);

  const totalTracks = tracks.length;
  const currentTrack = tracks[activeIndex] ?? tracks[0];

  // Fetch Supabase tracks on mount
  useEffect(() => {
    let isMounted = true;
    fetchRemoteTracks().then((remoteRecords) => {
      if (!isMounted || remoteRecords.length === 0) return;
      const remoteTracks = remoteRecords.map((rec, i) =>
        remoteTrackToPlaylistTrack(rec, BASE_PLAYLIST.length + i),
      );
      setTracks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const freshRemotes = remoteTracks.filter((t) => !existingIds.has(t.id));
        if (freshRemotes.length === 0) return prev;
        return [...prev, ...freshRemotes];
      });
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const discItems: DiscCascadeItem[] = useMemo(
    () =>
      tracks.map((track) => ({
        title: track.title,
        src: track.coverImage,
        pattern: track.pattern,
        palette: track.palette,
        label: track.title,
        labelStyle: 'arc',
      })),
    [tracks],
  );

  // Keep audio volume and muted state in sync with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

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

  // Close popover on click outside or Escape key (unless upload modal is open)
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      if (isUploadModalOpen || isDeleteModalOpen) return;
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUploadModalOpen && !isDeleteModalOpen) setIsOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, isUploadModalOpen, isDeleteModalOpen]);

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

  // Volume slider handler
  const handleVolumeChange = useCallback((percentage: number) => {
    const normalized = Math.min(Math.max(percentage / 100, 0), 1);
    setVolume(normalized);
    if (normalized > 0) {
      setIsMuted(false);
      prevVolumeRef.current = normalized;
    } else {
      setIsMuted(true);
    }
    try {
      localStorage.setItem('squad_music_volume', String(normalized));
    } catch {
      // ignore
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted || volume === 0) {
      const restored = prevVolumeRef.current > 0 ? prevVolumeRef.current : 0.8;
      setVolume(restored);
      setIsMuted(false);
    } else {
      prevVolumeRef.current = volume;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const handleTrackUploaded = (newTrack: PlaylistTrack) => {
    setTracks((prev) => [...prev, newTrack]);
    // Switch to new track immediately and view in 3D disc mode
    shouldPlayOnSwitchRef.current = true;
    setActiveIndex(tracks.length);
    setViewMode('disc');
  };

  const openDeleteModal = (track: PlaylistTrack) => {
    setTrackToDelete(track);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteTrack = async () => {
    if (!trackToDelete) return;
    const targetId = trackToDelete.id;

    // Delete from Supabase if remote
    if (trackToDelete.isRemote) {
      await deleteTrackFromSupabase(targetId, trackToDelete.src);
    }

    // Remove from local tracks state
    const targetIdx = tracks.findIndex((t) => t.id === targetId);
    const nextTracks = tracks.filter((t) => t.id !== targetId);
    setTracks(nextTracks);

    // If the deleted track was the currently active track
    if (targetIdx === activeIndex) {
      if (nextTracks.length > 0) {
        const nextIdx = activeIndex >= nextTracks.length ? 0 : activeIndex;
        setActiveIndex(nextIdx);
        if (isPlaying) {
          shouldPlayOnSwitchRef.current = true;
        }
      } else {
        setIsPlaying(false);
      }
    } else if (targetIdx < activeIndex) {
      setActiveIndex((prev) => Math.max(0, prev - 1));
    }
  };

  if (totalTracks === 0) return null;

  const formattedIndex = `${String(activeIndex + 1).padStart(2, '0')} / ${String(totalTracks).padStart(2, '0')}`;

  const renderVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="w-3.5 h-3.5 text-slate-400" />;
    }
    if (volume <= 0.35) {
      return <Volume className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />;
    }
    if (volume <= 0.7) {
      return <Volume1 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />;
    }
    return <Volume2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />;
  };

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* Persistent HTMLAudioElement */}
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

      {/* Navbar Trigger Button */}
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

      {/* Popover Player */}
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
              {/* Soft ambient halo behind discs (only in disc mode) */}
              {viewMode === 'disc' && (
                <div
                  aria-hidden="true"
                  className="absolute top-2 inset-x-8 h-28 rounded-full bg-sky-400/20 dark:bg-sky-400/15 blur-2xl pointer-events-none"
                />
              )}

              {/* 3D CD Carousel View */}
              {viewMode === 'disc' && (
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
              )}

              {/* Main Player Card */}
              <div className="relative z-10 w-full rounded-3xl bg-white/95 dark:bg-[#091221]/95 backdrop-blur-2xl border border-sky-200/75 dark:border-white/12 p-4 shadow-xl shadow-sky-950/15 dark:shadow-black/70">
                {/* Header: Volume Control + View Mode Switcher */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {/* Volume Control with Continuous Slider */}
                  <div className="flex items-center gap-1.5" title={`Volumen: ${Math.round((isMuted ? 0 : volume) * 100)}%`}>
                    <button
                      type="button"
                      onClick={toggleMute}
                      title={isMuted ? 'Activar volumen' : 'Silenciar'}
                      aria-label={isMuted ? 'Activar volumen' : 'Silenciar'}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-sky-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      {renderVolumeIcon()}
                    </button>
                    <div className="w-14 sm:w-16">
                      <CustomSlider
                        value={isMuted ? 0 : volume * 100}
                        onChange={handleVolumeChange}
                        ariaLabel="Control de volumen"
                        className="h-2.5"
                        barClassName="h-1"
                      />
                    </div>
                  </div>

                  {/* View Mode Toggle Pill: Disco vs Lista */}
                  <div className="flex items-center p-0.5 rounded-full bg-sky-950/5 dark:bg-white/[0.06] border border-sky-200/60 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setViewMode('disc')}
                      aria-pressed={viewMode === 'disc'}
                      title="Ver carrusel 3D de discos"
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        viewMode === 'disc'
                          ? 'bg-white dark:bg-[#132238] text-[#0284c7] dark:text-[#38bdf8] shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      <Disc3 className="w-3 h-3" />
                      <span>Disco</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      aria-pressed={viewMode === 'list'}
                      title="Ver lista de canciones"
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-[#132238] text-[#0284c7] dark:text-[#38bdf8] shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      <ListMusic className="w-3 h-3" />
                      <span>Lista</span>
                      <span className="text-[10px] opacity-75 font-mono">({tracks.length})</span>
                    </button>
                  </div>
                </div>

                {/* Conditional View: 3D Disc Mode Meta OR Song List View */}
                {viewMode === 'disc' ? (
                  <>
                    {/* Counter pill + compact prev/next disc steppers */}
                    <div className="flex items-center justify-between mb-2">
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
                  </>
                ) : (
                  /* Dedicated Song List View */
                  <div className="flex flex-col mb-3">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <div className="flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-[#0284c7] dark:text-[#38bdf8]" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-white">
                          Playlist del Squad
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsUploadModalOpen(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#0284c7]/10 hover:bg-[#0284c7]/20 dark:bg-[#38bdf8]/15 dark:hover:bg-[#38bdf8]/25 text-[#0284c7] dark:text-[#38bdf8] border border-sky-300/60 dark:border-sky-500/30 transition-all cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Agregar</span>
                      </button>
                    </div>

                    {/* Scrollable Song List Container */}
                    <div className="max-h-[175px] overflow-y-auto pr-1 flex flex-col gap-1.5 scrollbar-thin">
                      {tracks.map((track, idx) => {
                        const isActive = idx === activeIndex;
                        return (
                          <div
                            key={track.id}
                            onClick={() => selectTrack(idx, true)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Reproducir ${track.title}`}
                            className={`group flex items-center justify-between p-2 rounded-2xl transition-all cursor-pointer border ${
                              isActive
                                ? 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-300/80 dark:border-sky-500/40 shadow-xs'
                                : 'bg-slate-50/50 hover:bg-slate-100/70 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] border-slate-200/50 dark:border-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {/* Track status / Equalizer icon */}
                              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                                {isActive && isPlaying ? (
                                  <div className="flex items-end gap-0.5 h-3.5 w-3.5">
                                    <span className="w-1 bg-[#0284c7] dark:bg-[#38bdf8] rounded-full animate-[bounce_0.6s_ease-in-out_infinite] h-2" />
                                    <span className="w-1 bg-[#0284c7] dark:bg-[#38bdf8] rounded-full animate-[bounce_0.8s_ease-in-out_infinite_0.15s] h-3.5" />
                                    <span className="w-1 bg-[#0284c7] dark:bg-[#38bdf8] rounded-full animate-[bounce_0.5s_ease-in-out_infinite_0.3s] h-2.5" />
                                  </div>
                                ) : (
                                  <span
                                    className={`text-[11px] font-mono ${
                                      isActive
                                        ? 'text-[#0284c7] dark:text-[#38bdf8] font-bold'
                                        : 'text-slate-400 dark:text-slate-500'
                                    }`}
                                  >
                                    {String(idx + 1).padStart(2, '0')}
                                  </span>
                                )}
                              </div>

                              {/* Disc mini palette preview badge */}
                              <div
                                className="w-5 h-5 rounded-full shrink-0 border border-white/20 shadow-2xs"
                                style={{
                                  background: `linear-gradient(135deg, ${track.palette[0]} 0%, ${track.palette[1]} 60%, ${track.palette[2]} 100%)`,
                                }}
                              />

                              {/* Title & Subtitle */}
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`text-xs font-medium truncate leading-tight ${
                                    isActive
                                      ? 'text-slate-900 dark:text-white font-semibold'
                                      : 'text-slate-700 dark:text-slate-200'
                                  }`}
                                >
                                  {track.title}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  {track.subtitle}
                                </p>
                              </div>
                            </div>

                            {/* Action buttons (Delete & Play) */}
                            <div className="shrink-0 flex items-center gap-1 pl-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteModal(track);
                                }}
                                title={`Eliminar "${track.title}"`}
                                aria-label={`Eliminar "${track.title}"`}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-all opacity-70 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>

                              {isActive ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePlay();
                                  }}
                                  className="w-6 h-6 rounded-full flex items-center justify-center bg-[#0284c7] dark:bg-[#38bdf8] text-white dark:text-slate-950 shadow-xs cursor-pointer"
                                >
                                  {isPlaying ? (
                                    <Pause className="w-3 h-3 fill-current" />
                                  ) : (
                                    <Play className="w-3 h-3 fill-current translate-x-[0.5px]" />
                                  )}
                                </button>
                              ) : (
                                <span className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-opacity opacity-0 group-hover:opacity-100">
                                  <Play className="w-3 h-3 fill-current" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Current track indicator in list view */}
                    <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="truncate max-w-[200px]">
                        Reproduciendo: <strong className="text-slate-800 dark:text-white">{currentTrack.title}</strong>
                      </span>
                      <span className="font-mono">{formatTime(currentTime)}</span>
                    </div>
                  </div>
                )}

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

      {/* Upload Track Modal for Community Songs (Supabase integration ready) */}
      <UploadTrackModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onTrackUploaded={handleTrackUploaded}
      />

      {/* PIN-Protected Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteTrack}
        title="Eliminar canción de la playlist"
        itemName={trackToDelete?.title ?? 'Canción'}
        itemType="canción"
      />
    </div>
  );
};
