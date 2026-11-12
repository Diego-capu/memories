import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  MapPin,
  Calendar,
  X,
  ZoomIn,
  ArrowUpRight,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { GALLERY, type GalleryPhoto } from '../data/memories';
import {
  fetchRemoteGallery,
  saveGalleryPhotoToSupabase,
  deleteGalleryPhotoFromSupabase,
  type RemoteGalleryPhoto,
} from '../lib/supabase';
import { GalleryModal } from './GalleryModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

const BASE_CATEGORIES = [
  { id: 'todos', label: 'Todos los Momentos' },
  { id: 'roblox', label: 'Roblox' },
  { id: 'gaming', label: 'Overwatch & LoL' },
  { id: 'chats', label: 'Chats & Memes' },
];

export const InteractiveGallery: React.FC = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(() => {
    try {
      const cached = localStorage.getItem('squad_local_gallery');
      if (cached) return JSON.parse(cached);
    } catch {
      // fallback
    }
    return GALLERY;
  });
  const [filter, setFilter] = useState<string>('todos');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [photoToEdit, setPhotoToEdit] = useState<GalleryPhoto | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<GalleryPhoto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Sync with Supabase on mount
  useEffect(() => {
    let isMounted = true;
    fetchRemoteGallery().then((remotes: RemoteGalleryPhoto[]) => {
      if (!isMounted || remotes.length === 0) return;
      const mapped: GalleryPhoto[] = remotes.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        location: r.location,
        date: r.date,
        imageUrl: r.image_url,
        caption: r.caption,
        aspect: r.aspect,
        isRemote: true,
      }));

      setPhotos((prev) => {
        const remoteMap = new Map(mapped.map((p) => [p.id, p]));
        const merged = prev.map((p) => remoteMap.get(p.id) || p);
        mapped.forEach((p) => {
          if (!prev.some((item) => item.id === p.id)) {
            merged.push(p);
          }
        });
        try {
          localStorage.setItem('squad_local_gallery', JSON.stringify(merged));
        } catch {}
        return merged;
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const list = [...BASE_CATEGORIES];
    photos.forEach((p) => {
      if (p.category && !list.some((c) => c.id === p.category)) {
        list.push({
          id: p.category,
          label: p.category.charAt(0).toUpperCase() + p.category.slice(1),
        });
      }
    });
    return list;
  }, [photos]);

  const filteredPhotos =
    filter === 'todos'
      ? photos
      : photos.filter((photo) => photo.category === filter);

  const handleOpenAdd = () => {
    setPhotoToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (photo: GalleryPhoto, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPhotoToEdit(photo);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (photo: GalleryPhoto, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPhotoToDelete(photo);
    setIsDeleteModalOpen(true);
  };

  const handleSavePhoto = async (saved: GalleryPhoto, isEdit: boolean) => {
    await saveGalleryPhotoToSupabase(saved, isEdit);
    setPhotos((prev) => {
      const next = isEdit
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [...prev, saved];
      try {
        localStorage.setItem('squad_local_gallery', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (selectedPhoto?.id === saved.id) {
      setSelectedPhoto(saved);
    }
  };

  const handleConfirmDelete = async () => {
    if (!photoToDelete) return;
    await deleteGalleryPhotoFromSupabase(photoToDelete.id);
    setPhotos((prev) => {
      const next = prev.filter((p) => p.id !== photoToDelete.id);
      try {
        localStorage.setItem('squad_local_gallery', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (selectedPhoto?.id === photoToDelete.id) {
      setSelectedPhoto(null);
    }
  };

  return (
    <section id="galeria" className="py-24 md:py-32 px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 dark:bg-white/10 border border-sky-200/80 dark:border-white/10 text-sm text-sky-800 dark:text-sky-300 shadow-xs mb-4">
          <Camera className="w-4 h-4 text-[#0284c7] dark:text-[#38bdf8]" />
          <span>álbum colectivo de capturas</span>
        </div>
        <h2 className="text-4xl sm:text-5xl md:text-6xl text-slate-900 dark:text-white tracking-tight mb-4">
          La Galería de Nuestras Partidas
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg font-light mb-6">
          Toca cualquier captura para abrirla en alta resolución y leer la historia de ese momento.
        </p>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-[#0284c7] dark:text-[#38bdf8] border border-sky-300/40 dark:border-sky-500/30 font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar nueva captura</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center items-center gap-2 mb-14">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-4 py-2 rounded-full text-sm transition-all cursor-pointer ${
              filter === cat.id
                ? 'bg-[#0284c7] text-white shadow-sm'
                : 'liquid-glass text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 border-sky-100 dark:border-white/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Uniform Photos Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {filteredPhotos.map((photo) => (
            <motion.div
              layout
              key={photo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35 }}
              onClick={() => setSelectedPhoto(photo)}
              className="group relative cursor-pointer rounded-2xl overflow-hidden liquid-glass p-3 hover:border-sky-300 dark:hover:border-sky-400/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Photo Container — Uniform Fixed Aspect Ratio */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Overlay with zoom icon */}
                <div className="absolute inset-0 bg-slate-900/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white text-xs shadow-md flex items-center gap-1.5 transform scale-90 group-hover:scale-100 transition-transform">
                    <ZoomIn className="w-3.5 h-3.5 text-[#0284c7] dark:text-[#38bdf8]" />
                    <span>Ver captura e historia</span>
                  </div>
                </div>

                {/* Top category badge & action buttons */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-none">
                  <span className="px-2.5 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-sky-200 dark:border-white/10 text-xs font-semibold text-[#0284c7] dark:text-[#38bdf8] shadow-xs pointer-events-auto">
                    {photo.category}
                  </span>
                  <div className="flex items-center gap-1 pointer-events-auto">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(photo, e)}
                      title="Editar captura"
                      className="p-1.5 rounded-full bg-white/90 hover:bg-[#0284c7] hover:text-white dark:bg-slate-900/90 dark:hover:bg-[#38bdf8] dark:hover:text-slate-900 text-slate-700 dark:text-slate-300 border border-stone-200/80 dark:border-white/10 backdrop-blur-md transition-colors cursor-pointer shadow-sm"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleOpenDelete(photo, e)}
                      title="Eliminar captura"
                      className="p-1.5 rounded-full bg-white/90 hover:bg-red-600 hover:text-white dark:bg-slate-900/90 dark:hover:bg-red-500 dark:hover:text-white text-slate-700 dark:text-slate-300 border border-stone-200/80 dark:border-white/10 backdrop-blur-md transition-colors cursor-pointer shadow-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Photo description — Clean & Balanced */}
              <div className="p-2 pt-3">
                <h3 className="text-xl text-slate-900 dark:text-white group-hover:text-[#0284c7] dark:group-hover:text-[#38bdf8] transition-colors line-clamp-1 leading-snug">
                  {photo.title}
                </h3>
                <div className="mt-2.5 pt-2 border-t border-sky-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-[#0284c7] dark:text-[#38bdf8]">
                    <MapPin className="w-3 h-3 text-[#0284c7] dark:text-[#38bdf8]" />
                    {photo.location}
                  </span>
                  <span className="flex items-center gap-1 text-[#0284c7] dark:text-[#38bdf8] font-semibold">
                    <span>Abrir</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full rounded-3xl overflow-hidden bg-white dark:bg-[#0b1526] border border-sky-100 dark:border-white/10 shadow-2xl p-5 sm:p-7 cursor-default max-h-[90vh] flex flex-col"
            >
              {/* Action buttons & Close button */}
              <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedPhoto)}
                  className="p-2 rounded-full bg-slate-100 hover:bg-[#0284c7] hover:text-white dark:bg-white/10 dark:hover:bg-[#38bdf8] dark:hover:text-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
                  title="Editar captura"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDelete(selectedPhoto)}
                  className="p-2 rounded-full bg-slate-100 hover:bg-red-600 hover:text-white dark:bg-white/10 dark:hover:bg-red-500 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer shadow-xs"
                  title="Eliminar captura"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto pr-1 flex-1 flex flex-col gap-5">
                {/* Large high-res image container */}
                <div className="rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/60 border border-sky-100 dark:border-white/10 flex items-center justify-center p-2 shadow-inner">
                  <img
                    src={selectedPhoto.imageUrl}
                    alt={selectedPhoto.title}
                    className="max-h-[55vh] w-auto object-contain rounded-xl"
                  />
                </div>

                {/* Details and Story Section */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#f0f8ff] dark:bg-[#0e1b30] border border-sky-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="max-w-xl">
                    <span className="inline-block text-xs uppercase text-[#0284c7] dark:text-[#38bdf8] font-semibold mb-1">
                      {selectedPhoto.category} // {selectedPhoto.location}
                    </span>
                    <h3 className="text-2xl sm:text-3xl text-slate-900 dark:text-white mb-2">
                      {selectedPhoto.title}
                    </h3>
                    <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedPhoto.caption}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-2 text-xs text-slate-600 dark:text-slate-300 shrink-0">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-white/10 border border-sky-200 dark:border-white/10 text-sky-800 dark:text-sky-300 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#0284c7] dark:text-[#38bdf8]" />
                      {selectedPhoto.date}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">guardado en disco</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <GalleryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePhoto}
        photoToEdit={photoToEdit}
        availableCategories={categories.filter((c) => c.id !== 'todos')}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPhotoToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Captura"
        itemName={photoToDelete?.title || 'esta captura'}
        itemType="captura"
      />
    </section>
  );
};
