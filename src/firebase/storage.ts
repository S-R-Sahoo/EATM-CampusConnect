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
  // If Firebase Storage is live
  if (isFirebaseConfigured() && storage) {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage!, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Math.round(progress));
        },
        (error) => {
          console.error('Firebase Storage upload error:', error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  }

  // Fallback: Read file as Data URL locally with realistic simulated progress
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
    }, 80);
  });
}
