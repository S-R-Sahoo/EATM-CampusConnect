import { supabase, isSupabaseConfigured } from './client';

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

/**
 * Uploads a file to Supabase Storage in the canonical 'campus-uploads' bucket.
 * If Supabase Storage is configured and succeeds, returns the public URL.
 * If Supabase Storage throws an RLS/network exception, gracefully falls back to a Data URL
 * so profile updates and media never crash the user experience.
 */
export async function uploadFile(
  path: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const readAsDataUrlFallback = (): Promise<string> => {
    return new Promise((resolve) => {
      let current = 0;
      const interval = setInterval(() => {
        current += 25;
        if (onProgress) onProgress(Math.min(current, 100));
        if (current >= 100) {
          clearInterval(interval);
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      }, 40);
    });
  };

  // 1. Live Supabase Storage Upload
  if (isSupabaseConfigured() && supabase) {
    try {
      if (onProgress) onProgress(20);
      const cleanPath = path
        .replace(/^\/+/, '')
        .replace(/[^a-zA-Z0-9_\-./]/g, '_');

      if (onProgress) onProgress(40);

      const { data, error } = await supabase.storage
        .from('campus-uploads')
        .upload(cleanPath, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (onProgress) onProgress(80);

      if (error) {
        console.warn('⚠️ Supabase Storage upload note (RLS/policy):', error.message);
        // Fallback to Data URL if storage bucket RLS is restrictive
        return readAsDataUrlFallback();
      }

      if (data) {
        const { data: urlData } = supabase.storage
          .from('campus-uploads')
          .getPublicUrl(data.path);
        if (onProgress) onProgress(100);
        console.log('✅ File uploaded to Supabase Storage:', urlData.publicUrl);
        return urlData.publicUrl;
      }
    } catch (err: any) {
      console.warn('⚠️ Supabase upload exception, using resilient fallback:', err?.message || err);
      return readAsDataUrlFallback();
    }
  }

  // 2. Sandbox/Offline Fallback (when Supabase credentials are not configured)
  return readAsDataUrlFallback();
}
