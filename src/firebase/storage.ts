import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './config';

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
      }, 60);
    });
  };

  // If Firebase Storage is live, try cloud upload first
  if (isFirebaseConfigured() && storage) {
    try {
      return await new Promise((resolve) => {
        const storageRef = ref(storage!, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(Math.round(progress));
          },
          (error) => {
            // If Storage requires Blaze upgrade or bucket is not active, fallback smoothly
            console.warn('Firebase Storage bucket not active or requires upgrade. Using local storage fallback:', error);
            resolve(readAsDataUrlFallback());
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (err) {
              resolve(readAsDataUrlFallback());
            }
          }
        );
      });
    } catch (err) {
      return readAsDataUrlFallback();
    }
  }

  // Fallback: Read file as Data URL locally
  return readAsDataUrlFallback();
}
