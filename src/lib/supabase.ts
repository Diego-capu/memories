import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

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
