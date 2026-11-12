import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck,
  X,
  KeyRound,
  Loader2,
  AlertCircle,
  Check,
  Sparkles,
} from 'lucide-react';

interface EditAvatarRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatar: {
    id: string;
    name: string;
    handle: string;
    role: string;
    avatarUrl: string;
  } | null;
  onSave: (avatarId: string, newRole: string) => Promise<void> | void;
}

export const EditAvatarRoleModal: React.FC<EditAvatarRoleModalProps> = ({
  isOpen,
  onClose,
  avatar,
  onSave,
}) => {
  const [role, setRole] = useState('');
  const [pin, setPin] = useState(() => {
    try {
      return sessionStorage.getItem('squad_music_pin') || '';
    } catch {
      return '';
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (avatar) {
      setRole(avatar.role || '');
    } else {
      setRole('');
    }
    setErrorMsg(null);
  }, [avatar, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!avatar) return;

    if (!role.trim()) {
      setErrorMsg('Por favor ingresa un apodo para el integrante.');
      return;
    }

    // Verify PIN
    const env = import.meta.env as Record<string, string | undefined>;
    const expectedPin = (env.VITE_MUSIC_PIN || env.MUSIC_PIN || '2026').trim();

    if (pin.trim() !== expectedPin) {
      setErrorMsg('PIN incorrecto. Ingresa el código del Squad para guardar cambios.');
      return;
    }

    try {
      sessionStorage.setItem('squad_music_pin', pin.trim());
    } catch {
      // ignore
    }

    setIsSubmitting(true);
    try {
      await onSave(avatar.id, role.trim());
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar el apodo.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof document === 'undefined' || !avatar) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && onClose()}
            className="fixed inset-0 bg-slate-950/65 dark:bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-3xl bg-white/95 dark:bg-[#0b1424]/95 backdrop-blur-2xl border border-sky-200/80 dark:border-white/12 p-5 sm:p-6 shadow-2xl z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-500/30 flex items-center justify-center text-[#0284c7] dark:text-[#38bdf8]">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                    Editar Apodo de {avatar.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {avatar.handle} • Alineación del Squad
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar Preview Chip */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/60 dark:border-white/10 mb-4">
              <div className="w-12 h-12 rounded-xl bg-sky-100/60 dark:bg-sky-900/40 p-1 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={avatar.avatarUrl}
                  alt={avatar.name}
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {avatar.name}
                </p>
                <p className="text-xs font-hand text-[#0284c7] dark:text-[#38bdf8] truncate">
                  Apodo actual: &laquo;{avatar.role}&raquo;
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nuevo Apodo o Título <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ej. Alas Negras & TV Show"
                    required
                    autoFocus
                    maxLength={38}
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8] font-hand"
                  />
                  <Sparkles className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Security PIN */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  PIN de seguridad del Squad <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Introduce el PIN de acceso"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38bdf8] font-mono tracking-widest"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !role.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38bdf8] dark:hover:bg-sky-300 text-white dark:text-slate-950 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Actualizar apodo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
