import { supabase, isSupabaseConfigured } from './client';

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

/**
 * Uploads a file to Supabase Storage in the canonical 'campus-uploads' bucket.
 * Throws explicit errors when Supabase fails so the application does not fake success.
 */
export async function uploadFile(
  path: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  // 1. Supabase Live Storage
  if (isSupabaseConfigured() && supabase) {
    if (onProgress) onProgress(15);
    const cleanPath = path
      .replace(/^\/+/, '')
      .replace(/[^a-zA-Z0-9_\-./]/g, '_');

    if (onProgress) onProgress(35);

    const { data, error } = await supabase.storage
      .from('campus-uploads')
      .upload(cleanPath, file, {
        upsert: true,
        cacheControl: '3600'
      });

    if (onProgress) onProgress(80);

    if (error) {
      console.error('❌ Supabase storage upload error:', error.message, error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    if (data) {
      const { data: urlData } = supabase.storage
        .from('campus-uploads')
        .getPublicUrl(data.path);
      if (onProgress) onProgress(100);
      console.log('✅ File uploaded to Supabase Storage:', urlData.publicUrl);
      return urlData.publicUrl;
    }

    throw new Error('Storage upload failed: No data returned from Supabase Storage.');
  }

  // 2. Sandbox/Offline Fallback (only when Supabase credentials are not configured)
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
    }, 50);
  });
}
