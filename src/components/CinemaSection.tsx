import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Film,
  Play,
  Plus,
  ExternalLink,
  Sparkles,
  Video,
  User,
  Tag,
  Trash2,
} from 'lucide-react';
import {
  DEFAULT_VIDEOS,
  VIDEO_CATEGORIES,
  type SquadVideo,
  type VideoCategory,
} from '../data/videos';
import {
  fetchRemoteVideos,
  deleteVideoFromSupabase,
  type RemoteSquadVideo,
} from '../lib/supabase';
import { UploadVideoModal } from './UploadVideoModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

export const CinemaSection: React.FC = () => {
  const [videos, setVideos] = useState<SquadVideo[]>(DEFAULT_VIDEOS);
  const [activeVideoId, setActiveVideoId] = useState<string>(DEFAULT_VIDEOS[0]?.id ?? '');
  const [isPlayingMain, setIsPlayingMain] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory>('Todos');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<SquadVideo | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch Supabase remote videos on mount
  useEffect(() => {
    let isMounted = true;
    fetchRemoteVideos().then((remoteRecords: RemoteSquadVideo[]) => {
      if (!isMounted || remoteRecords.length === 0) return;
      const remoteVideos: SquadVideo[] = remoteRecords.map((r) => ({
        id: `remote-${r.id}`,
        title: r.title,
        author: r.author || 'Squad',
        originalUrl: r.video_url,
        embedUrl: r.embed_url,
        platform: r.platform,
        thumbnailUrl: r.thumbnail_url || undefined,
        tag: r.tag || 'Momentos',
        createdAt: r.created_at,
        isRemote: true,
      }));

      setVideos((prev) => {
        const existingIds = new Set(prev.map((v) => v.id));
        const fresh = remoteVideos.filter((v) => !existingIds.has(v.id));
        if (fresh.length === 0) return prev;
        return [...fresh, ...prev]; // newer community videos first
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Derive all available categories dynamically from defaults + video tags
  const availableCategories = useMemo(() => {
    const list: string[] = ['Todos'];
    const seen = new Set<string>(['todos']);

    VIDEO_CATEGORIES.forEach((cat) => {
      const lower = cat.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        list.push(cat);
      }
    });

    videos.forEach((v) => {
      if (v.tag && v.tag.trim()) {
        const clean = v.tag.trim();
        const lower = clean.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          list.push(clean);
        }
      }
    });

    return list;
  }, [videos]);

  const filteredVideos = useMemo(() => {
    if (selectedCategory === 'Todos') return videos;
    return videos.filter((v) => v.tag.toLowerCase() === selectedCategory.toLowerCase());
  }, [videos, selectedCategory]);

  const activeVideo = useMemo(() => {
    return videos.find((v) => v.id === activeVideoId) ?? videos[0] ?? DEFAULT_VIDEOS[0];
  }, [videos, activeVideoId]);

  const safeEmbedUrl = useMemo(() => {
    if (!activeVideo?.embedUrl) return '';
    return activeVideo.embedUrl.replace('youtube-nocookie.com', 'youtube.com');
  }, [activeVideo]);

  const handleSelectVideo = (video: SquadVideo) => {
    setActiveVideoId(video.id);
    setIsPlayingMain(true);
  };

  const handleVideoAdded = (newVideo: SquadVideo) => {
    setVideos((prev) => [newVideo, ...prev]);
    setActiveVideoId(newVideo.id);
    setIsPlayingMain(true);
    if (newVideo.tag) {
      setSelectedCategory(newVideo.tag);
    }
  };

  const openDeleteModal = (video: SquadVideo) => {
    setVideoToDelete(video);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteVideo = async () => {
    if (!videoToDelete) return;
    const targetId = videoToDelete.id;

    if (videoToDelete.isRemote) {
      await deleteVideoFromSupabase(targetId);
    }

    const nextVideos = videos.filter((v) => v.id !== targetId);
    setVideos(nextVideos);

    if (activeVideoId === targetId) {
      setActiveVideoId(nextVideos[0]?.id ?? '');
      setIsPlayingMain(false);
    }
  };

  return (
    <section id="cine" className="relative py-20 px-4 overflow-hidden">
      {/* Background ambient decorative glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-500/30 text-[#0284c7] dark:text-[#38bdf8] mb-3 shadow-xs">
              <Film className="w-3.5 h-3.5" />
              <span>Sala de Proyección</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Cine del Squad & Clips
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mt-1.5">
              Revive las mejores anécdotas, partidas en equipo y risas de madrugada compartidas desde YouTube o Google Drive.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2.5 rounded-2xl text-xs font-semibold bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38bdf8] dark:hover:bg-sky-300 text-white dark:text-slate-950 shadow-md shadow-sky-950/10 dark:shadow-sky-500/10 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Compartir clip</span>
          </button>
        </div>

        {/* Main Cinema Theater Player */}
        {activeVideo && (
          <div className="relative rounded-3xl overflow-hidden bg-slate-950/90 dark:bg-[#070e1b] border border-sky-200/70 dark:border-white/12 shadow-2xl shadow-sky-950/15 dark:shadow-black/70 mb-10">
            {/* Screen 16:9 container */}
            <div className="relative w-full aspect-video bg-black/80 flex items-center justify-center">
              {isPlayingMain ? (
                <iframe
                  src={safeEmbedUrl}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                /* Facade Poster before playback */
                <div
                  onClick={() => setIsPlayingMain(true)}
                  className="relative w-full h-full cursor-pointer group flex items-center justify-center overflow-hidden"
                >
                  {activeVideo.thumbnailUrl ? (
                    <img
                      src={activeVideo.thumbnailUrl}
                      alt={activeVideo.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-95 group-hover:scale-102 transition-all duration-500"
                    />
                  ) : (
                    /* Drive or fallback ambient gradient */
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2 text-sky-400/80">
                        <Video className="w-16 h-16 stroke-1" />
                        <span className="text-xs uppercase tracking-widest font-mono text-sky-300/70">
                          Google Drive Clip
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" />

                  {/* Pulsing Play Button */}
                  <motion.div
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0284c7]/90 hover:bg-[#0284c7] dark:bg-[#38bdf8]/90 dark:hover:bg-[#38bdf8] text-white dark:text-slate-950 flex items-center justify-center shadow-xl shadow-sky-500/30 backdrop-blur-md"
                  >
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current translate-x-0.5" />
                  </motion.div>

                  {/* Floating Title on Poster */}
                  <div className="absolute bottom-4 inset-x-4 sm:bottom-6 sm:inset-x-6 z-10 flex flex-col gap-1">
                    <span className="inline-flex items-center gap-1.5 self-start px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-black/60 text-sky-300 backdrop-blur-md border border-white/10">
                      <Sparkles className="w-3 h-3 text-sky-400" />
                      {activeVideo.tag}
                    </span>
                    <h3 className="text-lg sm:text-2xl font-bold text-white drop-shadow-md truncate">
                      {activeVideo.title}
                    </h3>
                  </div>
                </div>
              )}
            </div>

            {/* Active Video Info Bar */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/95 dark:bg-[#0b1526]/95 backdrop-blur-md border-t border-sky-100 dark:border-white/10">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase ${
                      activeVideo.platform === 'youtube'
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {activeVideo.platform === 'youtube' ? 'YouTube' : 'Google Drive'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{activeVideo.author}</span>
                  </span>
                </div>
                <h4 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                  {activeVideo.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openDeleteModal(activeVideo)}
                  title="Eliminar este clip"
                  aria-label={`Eliminar clip ${activeVideo.title}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>

                <a
                  href={activeVideo.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver en {activeVideo.platform === 'youtube' ? 'YouTube' : 'Drive'}</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {availableCategories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0284c7] text-white dark:bg-[#38bdf8] dark:text-slate-950 shadow-xs'
                    : 'bg-white/80 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-sky-100 dark:border-white/10'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Grid of Video Clip Cards */}
        {filteredVideos.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white/70 dark:bg-white/[0.03] border border-dashed border-slate-300 dark:border-white/15 text-slate-500">
            <Film className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay clips en esta categoría aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((video) => {
              const isSelected = video.id === activeVideo.id;
              return (
                <div
                  key={video.id}
                  onClick={() => handleSelectVideo(video)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Reproducir clip: ${video.title}`}
                  className={`group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all border ${
                    isSelected
                      ? 'ring-2 ring-[#0284c7] dark:ring-[#38bdf8] border-transparent shadow-lg shadow-sky-950/10'
                      : 'border-sky-100 dark:border-white/10 bg-white/80 dark:bg-[#0b1526]/80 hover:border-sky-300 dark:hover:border-sky-500/40 hover:shadow-md'
                  }`}
                >
                  {/* Thumbnail Card */}
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800 to-sky-950 flex items-center justify-center">
                        <Video className="w-8 h-8 text-sky-400/70" />
                      </div>
                    )}

                    {/* Platform Tag */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase backdrop-blur-md ${
                          video.platform === 'youtube'
                            ? 'bg-red-600/85 text-white'
                            : 'bg-emerald-600/85 text-white'
                        }`}
                      >
                        {video.platform === 'youtube' ? 'YouTube' : 'Drive'}
                      </span>
                    </div>

                    {/* Delete Button on Hover */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(video);
                      }}
                      title="Eliminar clip"
                      aria-label={`Eliminar clip ${video.title}`}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Play Hover Overlay */}
                    <div
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#0284c7] dark:bg-[#38bdf8] text-white dark:text-slate-950 flex items-center justify-center shadow-md">
                        <Play className="w-4 h-4 fill-current translate-x-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Card Meta */}
                  <div className="p-3 flex flex-col gap-1">
                    <h5 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#0284c7] dark:group-hover:text-[#38bdf8] transition-colors">
                      {video.title}
                    </h5>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      <span className="truncate max-w-[130px]">{video.author}</span>
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Tag className="w-3 h-3 opacity-60" />
                        {video.tag}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Video Modal */}
      <UploadVideoModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onVideoAdded={handleVideoAdded}
        availableCategories={availableCategories.filter((c) => c !== 'Todos')}
      />

      {/* Delete Video Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Eliminar clip del cine"
        itemName={videoToDelete?.title ?? 'Clip seleccionado'}
        itemType="video"
        onClose={() => {
          setIsDeleteModalOpen(false);
          setVideoToDelete(null);
        }}
        onConfirm={handleConfirmDeleteVideo}
      />
    </section>
  );
};
