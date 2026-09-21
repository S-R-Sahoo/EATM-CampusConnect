import { supabase, isSupabaseConfigured } from './client';

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

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
      }, 50);
    });
  };

  // If Supabase Storage is live
  if (isSupabaseConfigured() && supabase) {
    try {
      if (onProgress) onProgress(25);
      const cleanPath = path.replace(/^\/+/, '');
      const { data, error } = await supabase.storage
        .from('campus-uploads')
        .upload(cleanPath, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (onProgress) onProgress(75);

      if (error) {
        console.warn('Supabase storage upload error, using local fallback:', error);
        return readAsDataUrlFallback();
      }

      if (data) {
        const { data: urlData } = supabase.storage
          .from('campus-uploads')
          .getPublicUrl(data.path);
        if (onProgress) onProgress(100);
        return urlData.publicUrl;
      }
    } catch (err) {
      console.warn('Supabase upload exception, using fallback:', err);
      return readAsDataUrlFallback();
    }
  }

  // Fallback: Read file as Data URL locally
  return readAsDataUrlFallback();
}
