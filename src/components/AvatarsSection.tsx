import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Sparkles, UserCheck, Pencil } from 'lucide-react';
import {
  fetchRemoteAvatarRoles,
  updateAvatarRoleInSupabase,
} from '../lib/supabase';
import { EditAvatarRoleModal } from './EditAvatarRoleModal';

interface AvatarMember {
  id: string;
  name: string;
  handle: string;
  role: string;
  avatarUrl: string;
  robloxUrl: string;
}

const AVATAR_MEMBERS: AvatarMember[] = [
  {
    id: 'diezos',
    name: 'Diezos',
    handle: '@DIEZOS123',
    role: 'Fundador & Anfitrión',
    avatarUrl: '/images/avatars/diezos.png',
    robloxUrl: 'https://www.roblox.com/es/users/487466764/profile',
  },
  {
    id: 'yaei',
    name: 'Yaei',
    handle: '@Yaei',
    role: 'Noches de Pláticas',
    avatarUrl: '/images/avatars/yaei.png',
    robloxUrl: 'https://www.roblox.com/es/users/2460109619/profile',
  },
  {
    id: 'night',
    name: 'Night',
    handle: '@NightDark',
    role: 'Alas Negras & TV Show',
    avatarUrl: '/images/avatars/night.png',
    robloxUrl: 'https://www.roblox.com/es/users/277523408/profile',
  },
  {
    id: 'jhunrow',
    name: 'Jhunrow',
    handle: '@Jhunrow',
    role: 'El Enigma de la Nevera',
    avatarUrl: '/images/avatars/jhunrow.png',
    robloxUrl: 'https://www.roblox.com/es/users/1609046763/profile',
  },
  {
    id: 'zopas',
    name: 'Zopas',
    handle: '@Z0PaS',
    role: 'Fit Check & Ocurrencias',
    avatarUrl: '/images/avatars/zopas.png',
    robloxUrl: 'https://www.roblox.com/es/users/2755961641/profile',
  },
  {
    id: 'mich',
    name: 'Mich',
    handle: '@Mich',
    role: 'Banda Oficial del Squad',
    avatarUrl: '/images/avatars/mich.png',
    robloxUrl: 'https://www.roblox.com/es/users/412169346/profile',
  },
  {
    id: 'gavi',
    name: 'Gavi',
    handle: '@Gabdiauva',
    role: 'La Babosa de Jalea',
    avatarUrl: '/images/avatars/gavi.png',
    robloxUrl: 'https://www.roblox.com/es/users/2875101206/profile',
  },
  {
    id: 'rango',
    name: 'Rango',
    handle: '@Rango',
    role: 'Compañero de Batallas',
    avatarUrl: '/images/avatars/rango.png',
    robloxUrl: 'https://www.roblox.com/es/users/3080992354/profile',
  },
];

export const AvatarsSection: React.FC = () => {
  const [avatarRoles, setAvatarRoles] = useState<Record<string, string>>(() => {
    try {
      const cached = localStorage.getItem('squad_local_avatar_roles');
      if (cached) return JSON.parse(cached);
    } catch {
      // fallback
    }
    return {};
  });
  const [editingAvatar, setEditingAvatar] = useState<AvatarMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync with Supabase on mount
  useEffect(() => {
    let isMounted = true;
    fetchRemoteAvatarRoles().then((dict: Record<string, string>) => {
      if (!isMounted || Object.keys(dict).length === 0) return;

      setAvatarRoles((prev) => {
        const next = { ...prev, ...dict };
        try {
          localStorage.setItem('squad_local_avatar_roles', JSON.stringify(next));
        } catch {}
        return next;
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveRole = async (avatarId: string, newRole: string) => {
    await updateAvatarRoleInSupabase(avatarId, newRole);
    setAvatarRoles((prev) => {
      const next = { ...prev, [avatarId]: newRole };
      try {
        localStorage.setItem('squad_local_avatar_roles', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return (
    <section id="avatares" className="py-24 px-6 relative overflow-hidden">
      {/* Background ambient radial lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-sky-200/30 dark:bg-sky-900/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 dark:bg-white/10 border border-sky-200/80 dark:border-white/10 text-xs font-hand text-[#0284c7] dark:text-[#38bdf8] shadow-xs mb-4"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0284c7] dark:text-[#38bdf8]" />
            <span>alineación completa del squad</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl text-slate-900 dark:text-white tracking-tight mb-4"
          >
            Avatares & Perfiles de Roblox
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 dark:text-slate-300 font-light text-base sm:text-lg"
          >
            Los 8 integrantes reales con sus avatares sin fondo listos para la partida. Haz clic en cualquiera para visitar su perfil oficial en Roblox.
          </motion.p>
        </div>

        {/* Avatars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {AVATAR_MEMBERS.map((member, index) => {
            const currentRole = avatarRoles[member.id] || member.role;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group relative flex flex-col justify-between rounded-3xl bg-white/70 dark:bg-[#0b1526]/70 border border-sky-100/90 dark:border-white/10 p-5 shadow-xs hover:shadow-xl hover:shadow-sky-500/10 dark:hover:shadow-sky-500/5 hover:-translate-y-1.5 transition-all duration-300 backdrop-blur-md"
              >
                {/* Avatar Image Frame */}
                <div className="relative h-56 w-full rounded-2xl bg-gradient-to-b from-sky-100/60 via-sky-50/20 to-transparent dark:from-sky-950/40 dark:via-sky-900/10 dark:to-transparent flex items-center justify-center p-3 overflow-hidden border border-sky-100/50 dark:border-white/5 mb-4">
                  <img
                    src={member.avatarUrl}
                    alt={`Avatar de Roblox de ${member.name}`}
                    className="h-full w-auto object-contain filter drop-shadow-[0_8px_16px_rgba(2,132,199,0.2)] dark:drop-shadow-[0_8px_16px_rgba(56,189,248,0.2)] group-hover:scale-108 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Member Details */}
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-1.5">
                    <h3 className="font-serif text-2xl text-slate-900 dark:text-white font-medium tracking-tight">
                      {member.name}
                    </h3>
                    <UserCheck className="w-4 h-4 text-[#0284c7] dark:text-[#38bdf8]" />
                  </div>
                  <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                    {member.handle}
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-1.5">
                    <p className="font-hand text-sm text-[#0284c7] dark:text-[#38bdf8]">
                      «{currentRole}»
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAvatar({
                          ...member,
                          role: currentRole,
                        });
                        setIsModalOpen(true);
                      }}
                      title="Editar apodo"
                      className="p-1 rounded-full opacity-70 group-hover:opacity-100 hover:bg-sky-500/10 hover:text-[#0284c7] dark:hover:text-[#38bdf8] text-slate-400 dark:text-slate-500 transition-all cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Roblox Profile Link Button */}
                <a
                  href={member.robloxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-sky-500/10 hover:bg-[#0284c7] text-[#0284c7] hover:text-white dark:bg-white/5 dark:text-sky-300 dark:hover:bg-sky-500 dark:hover:text-white transition-all duration-200 border border-sky-200/60 dark:border-white/10 group-hover:border-[#0284c7] dark:group-hover:border-sky-500 cursor-pointer shadow-xs active:scale-95"
                >
                  <span>Ver perfil en Roblox</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Edit Avatar Role Modal */}
      <EditAvatarRoleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAvatar(null);
        }}
        avatar={editingAvatar}
        onSave={handleSaveRole}
      />
    </section>
  );
};
