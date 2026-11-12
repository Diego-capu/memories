import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const env = import.meta.env as Record<string, string | undefined>;

const supabaseUrl =
  env.VITE_SUPABASE_URL ||
  env.SUPABASE_URL ||
  env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  env.SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-id')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export interface RemotePlaylistTrack {
  id: string;
  title: string;
  subtitle: string;
  audio_url: string;
  pattern: string;
  palette: string[];
  created_at: string;
}

/**
 * Fetches community tracks from the `playlist_tracks` table in Supabase.
 * Returns empty array if Supabase is not configured or in case of error.
 */
export async function fetchRemoteTracks(): Promise<RemotePlaylistTrack[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('playlist_tracks')
      .select('id, title, subtitle, audio_url, pattern, palette, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching Supabase tracks:', error.message);
      return [];
    }

    return (data as RemotePlaylistTrack[]) ?? [];
  } catch (err) {
    console.warn('Network error fetching Supabase tracks:', err);
    return [];
  }
}

/**
 * Uploads an audio file to Supabase Storage and records metadata in `playlist_tracks`.
 */
export async function uploadTrackToSupabase({
  file,
  title,
  subtitle,
  pattern = 'horizon',
  palette = ['#7dd3fc', '#0284c7', '#fef08a'],
}: {
  file: File;
  title: string;
  subtitle?: string;
  pattern?: string;
  palette?: string[];
}): Promise<RemotePlaylistTrack | null> {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Por favor define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
    );
  }

  // 1. Sanitize file name and create a unique storage path
  const fileExt = file.name.split('.').pop()?.toLowerCase() ?? 'mp3';
  const cleanBase = file.name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);
  const uniqueKey = `${Date.now()}-${cleanBase}.${fileExt}`;
  const filePath = `uploads/${uniqueKey}`;

  // 2. Upload file to 'music' bucket
  const { error: uploadError } = await supabase.storage
    .from('music')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'audio/mpeg',
    });

  if (uploadError) {
    throw new Error(`Error subiendo archivo a Supabase Storage: ${uploadError.message}`);
  }

  // 3. Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('music').getPublicUrl(filePath);

  // 4. Insert row into `playlist_tracks`
  const { data: insertData, error: insertError } = await supabase
    .from('playlist_tracks')
    .insert([
      {
        title: title.trim(),
        subtitle: subtitle?.trim() || 'Aporte del Squad',
        audio_url: publicUrl,
        pattern,
        palette,
      },
    ])
    .select('id, title, subtitle, audio_url, pattern, palette, created_at')
    .single();

  if (insertError) {
    throw new Error(`Error guardando información de la canción: ${insertError.message}`);
  }

  return insertData as RemotePlaylistTrack;
}

export interface RemoteSquadVideo {
  id: string;
  title: string;
  author: string;
  video_url: string;
  platform: 'youtube' | 'drive';
  embed_url: string;
  thumbnail_url?: string;
  tag: string;
  created_at: string;
}

/**
 * Fetches community-shared video links from `squad_videos` in Supabase Postgres.
 */
export async function fetchRemoteVideos(): Promise<RemoteSquadVideo[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('squad_videos')
      .select('id, title, author, video_url, platform, embed_url, thumbnail_url, tag, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching squad videos from Supabase:', error.message);
      return [];
    }

    return (data as RemoteSquadVideo[]) ?? [];
  } catch (err) {
    console.warn('Network error fetching squad videos:', err);
    return [];
  }
}

/**
 * Inserts a video record into `squad_videos` in Supabase Postgres.
 */
export async function addVideoToSupabase({
  title,
  author,
  videoUrl,
  platform,
  embedUrl,
  thumbnailUrl,
  tag = 'Momentos',
}: {
  title: string;
  author?: string;
  videoUrl: string;
  platform: 'youtube' | 'drive';
  embedUrl: string;
  thumbnailUrl?: string;
  tag?: string;
}): Promise<RemoteSquadVideo | null> {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Por favor define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
    );
  }

  const { data, error } = await supabase
    .from('squad_videos')
    .insert([
      {
        title: title.trim(),
        author: author?.trim() || 'Squad',
        video_url: videoUrl.trim(),
        platform,
        embed_url: embedUrl.trim(),
        thumbnail_url: thumbnailUrl || null,
        tag: tag.trim() || 'Momentos',
      },
    ])
    .select('id, title, author, video_url, platform, embed_url, thumbnail_url, tag, created_at')
    .single();

  if (error) {
    throw new Error(`Error guardando video en Supabase: ${error.message}`);
  }

  return data as RemoteSquadVideo;
}

/**
 * Deletes a track from `playlist_tracks` and removes its audio file from Supabase Storage.
 */
export async function deleteTrackFromSupabase(
  trackId: string,
  audioUrl?: string,
): Promise<boolean> {
  if (!supabase) return true; // Handled locally if Supabase not configured

  // Strip remote- prefix if present to obtain the exact UUID
  const cleanId = trackId.replace(/^remote-/, '');

  try {
    const { error: dbError } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('id', cleanId);

    if (dbError) {
      console.warn('Error deleting track from Supabase database:', dbError.message);
      throw new Error(`Error en base de datos: ${dbError.message}`);
    }

    // If audio is in Supabase storage bucket 'music', delete the file
    if (audioUrl && audioUrl.includes('/storage/v1/object/public/music/')) {
      const match = audioUrl.split('/storage/v1/object/public/music/')[1];
      if (match) {
        const decodedPath = decodeURIComponent(match);
        const { error: storageError } = await supabase.storage
          .from('music')
          .remove([decodedPath]);

        if (storageError) {
          console.warn('Warning deleting storage file:', storageError.message);
        }
      }
    }

    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido al eliminar canción.';
    throw new Error(msg);
  }
}

/**
 * Deletes a video record from `squad_videos` in Supabase Postgres.
 */
export async function deleteVideoFromSupabase(videoId: string): Promise<boolean> {
  if (!supabase) return true; // Handled locally if Supabase not configured

  const cleanId = videoId.replace(/^remote-/, '');

  try {
    const { error } = await supabase
      .from('squad_videos')
      .delete()
      .eq('id', cleanId);

    if (error) {
      console.warn('Error deleting video from Supabase:', error.message);
      throw new Error(`Error al eliminar video: ${error.message}`);
    }

    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido al eliminar video.';
    throw new Error(msg);
  }
}

/* ==========================================================================
   CAPÍTULOS (Chapters) API
   ========================================================================== */

export interface RemoteChapter {
  id: string;
  tag: string;
  location: string;
  date: string;
  title: string;
  story: string;
  quote: string;
  image_url: string;
  created_at?: string;
}

export async function fetchRemoteChapters(): Promise<RemoteChapter[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('squad_chapters')
      .select('id, tag, location, date, title, story, quote, image_url, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching chapters from Supabase:', error.message);
      return [];
    }
    return (data as RemoteChapter[]) ?? [];
  } catch (err) {
    console.warn('Network error fetching chapters:', err);
    return [];
  }
}

export async function saveChapterToSupabase(
  chapter: {
    id: string;
    tag: string;
    location: string;
    date: string;
    title: string;
    story: string;
    quote: string;
    imageUrl: string;
  },
  isEdit = false,
): Promise<RemoteChapter | null> {
  if (!supabase) return null;
  const payload = {
    id: chapter.id,
    tag: chapter.tag.trim(),
    location: chapter.location.trim(),
    date: chapter.date.trim(),
    title: chapter.title.trim(),
    story: chapter.story.trim(),
    quote: chapter.quote.trim(),
    image_url: chapter.imageUrl.trim(),
  };

  if (isEdit) {
    const { data, error } = await supabase
      .from('squad_chapters')
      .update(payload)
      .eq('id', chapter.id)
      .select()
      .single();

    if (error) {
      // If it doesn't exist yet, insert with this id
      const { data: insertData, error: insertError } = await supabase
        .from('squad_chapters')
        .upsert([payload])
        .select()
        .single();
      if (insertError) throw new Error(`Error al actualizar capítulo: ${insertError.message}`);
      return insertData as RemoteChapter;
    }
    return data as RemoteChapter;
  }

  const { data, error } = await supabase
    .from('squad_chapters')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(`Error al crear capítulo: ${error.message}`);
  return data as RemoteChapter;
}

export async function deleteChapterFromSupabase(chapterId: string): Promise<boolean> {
  if (!supabase) return true;
  try {
    const { error } = await supabase
      .from('squad_chapters')
      .delete()
      .eq('id', chapterId);
    if (error) throw new Error(`Error al eliminar capítulo: ${error.message}`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar capítulo.';
    throw new Error(msg);
  }
}

/* ==========================================================================
   FRASES (Quotes) API
   ========================================================================== */

export interface RemoteQuote {
  id: string;
  title: string;
  quote: string;
  author: string;
  context: string;
  image_url: string;
  category: string;
  created_at?: string;
}

export async function fetchRemoteQuotes(): Promise<RemoteQuote[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('squad_quotes')
      .select('id, title, quote, author, context, image_url, category, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching quotes from Supabase:', error.message);
      return [];
    }
    return (data as RemoteQuote[]) ?? [];
  } catch (err) {
    console.warn('Network error fetching quotes:', err);
    return [];
  }
}

export async function saveQuoteToSupabase(
  quoteItem: {
    id: string;
    title: string;
    quote: string;
    author: string;
    context: string;
    imageUrl: string;
    category: string;
  },
  isEdit = false,
): Promise<RemoteQuote | null> {
  if (!supabase) return null;
  const payload = {
    id: quoteItem.id,
    title: quoteItem.title.trim(),
    quote: quoteItem.quote.trim(),
    author: quoteItem.author.trim(),
    context: quoteItem.context.trim(),
    image_url: quoteItem.imageUrl.trim(),
    category: quoteItem.category.trim(),
  };

  if (isEdit) {
    const { data, error } = await supabase
      .from('squad_quotes')
      .update(payload)
      .eq('id', quoteItem.id)
      .select()
      .single();

    if (error) {
      const { data: upsertData, error: upsertError } = await supabase
        .from('squad_quotes')
        .upsert([payload])
        .select()
        .single();
      if (upsertError) throw new Error(`Error al actualizar frase: ${upsertError.message}`);
      return upsertData as RemoteQuote;
    }
    return data as RemoteQuote;
  }

  const { data, error } = await supabase
    .from('squad_quotes')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(`Error al crear frase: ${error.message}`);
  return data as RemoteQuote;
}

export async function deleteQuoteFromSupabase(quoteId: string): Promise<boolean> {
  if (!supabase) return true;
  try {
    const { error } = await supabase
      .from('squad_quotes')
      .delete()
      .eq('id', quoteId);
    if (error) throw new Error(`Error al eliminar frase: ${error.message}`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar frase.';
    throw new Error(msg);
  }
}

/* ==========================================================================
   GALERÍA (Gallery) API
   ========================================================================== */

export interface RemoteGalleryPhoto {
  id: string;
  title: string;
  category: string;
  location: string;
  date: string;
  image_url: string;
  caption: string;
  aspect?: 'square' | 'portrait' | 'landscape';
  created_at?: string;
}

export async function fetchRemoteGallery(): Promise<RemoteGalleryPhoto[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('squad_gallery')
      .select('id, title, category, location, date, image_url, caption, aspect, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching gallery from Supabase:', error.message);
      return [];
    }
    return (data as RemoteGalleryPhoto[]) ?? [];
  } catch (err) {
    console.warn('Network error fetching gallery:', err);
    return [];
  }
}

export async function saveGalleryPhotoToSupabase(
  photo: {
    id: string;
    title: string;
    category: string;
    location: string;
    date: string;
    imageUrl: string;
    caption: string;
    aspect?: 'square' | 'portrait' | 'landscape';
  },
  isEdit = false,
): Promise<RemoteGalleryPhoto | null> {
  if (!supabase) return null;
  const payload = {
    id: photo.id,
    title: photo.title.trim(),
    category: photo.category.trim(),
    location: photo.location.trim(),
    date: photo.date.trim(),
    image_url: photo.imageUrl.trim(),
    caption: photo.caption.trim(),
    aspect: photo.aspect || 'landscape',
  };

  if (isEdit) {
    const { data, error } = await supabase
      .from('squad_gallery')
      .update(payload)
      .eq('id', photo.id)
      .select()
      .single();

    if (error) {
      const { data: upsertData, error: upsertError } = await supabase
        .from('squad_gallery')
        .upsert([payload])
        .select()
        .single();
      if (upsertError) throw new Error(`Error al actualizar captura: ${upsertError.message}`);
      return upsertData as RemoteGalleryPhoto;
    }
    return data as RemoteGalleryPhoto;
  }

  const { data, error } = await supabase
    .from('squad_gallery')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(`Error al crear captura: ${error.message}`);
  return data as RemoteGalleryPhoto;
}

export async function deleteGalleryPhotoFromSupabase(photoId: string): Promise<boolean> {
  if (!supabase) return true;
  try {
    const { error } = await supabase
      .from('squad_gallery')
      .delete()
      .eq('id', photoId);
    if (error) throw new Error(`Error al eliminar captura: ${error.message}`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar captura.';
    throw new Error(msg);
  }
}

/* ==========================================================================
   AVATARES (Roles / Apodos) API
   ========================================================================== */

export async function fetchRemoteAvatarRoles(): Promise<Record<string, string>> {
  if (!supabase) return {};
  try {
    const { data, error } = await supabase
      .from('squad_avatars')
      .select('id, role');

    if (error) {
      console.warn('Error fetching avatar roles from Supabase:', error.message);
      return {};
    }

    const mapping: Record<string, string> = {};
    if (Array.isArray(data)) {
      data.forEach((row: { id: string; role: string }) => {
        if (row.id && row.role) {
          mapping[row.id] = row.role;
        }
      });
    }
    return mapping;
  } catch (err) {
    console.warn('Network error fetching avatar roles:', err);
    return {};
  }
}

export async function updateAvatarRoleInSupabase(
  avatarId: string,
  role: string,
): Promise<boolean> {
  if (!supabase) return true;
  try {
    const payload = {
      id: avatarId,
      role: role.trim(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('squad_avatars')
      .upsert([payload], { onConflict: 'id' });

    if (error) {
      throw new Error(`Error al actualizar apodo: ${error.message}`);
    }
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al actualizar apodo.';
    throw new Error(msg);
  }
}

