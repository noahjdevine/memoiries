import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebase';
import { logger } from '../utils/logger';

export type UploadProgressCallback = (progress: number) => void;

const uriToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  return response.blob();
};

const uploadFile = async (
  path: string,
  localUri: string,
  contentType: string,
  onProgress?: UploadProgressCallback,
) => {
  const startTime = Date.now();
  logger.info('Upload started', { path, contentType });
  const blob = await uriToBlob(localUri);
  const fileRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(fileRef, blob, { contentType });

  return new Promise<{ downloadUrl: string; path: string }>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const progress = snapshot.totalBytes
            ? snapshot.bytesTransferred / snapshot.totalBytes
            : 0;
          onProgress(progress);
        }
      },
      (error) => {
        logger.error('Upload failed', { path, message: error.message });
        reject(error);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        const durationMs = Date.now() - startTime;
        logger.info('Upload completed', { path, durationMs });
        resolve({ downloadUrl, path });
      },
    );
  });
};

export const uploadPhoto = async (
  ownerId: string,
  itemId: string,
  localUri: string,
  index: number,
  onProgress?: UploadProgressCallback,
) => {
  const path = `users/${ownerId}/items/${itemId}/photos/photo-${index}.jpg`;
  return uploadFile(path, localUri, 'image/jpeg', onProgress);
};

export const uploadAudio = async (
  ownerId: string,
  itemId: string,
  localUri: string,
  mime: string,
  onProgress?: UploadProgressCallback,
) => {
  const extension = mime.includes('wav') ? 'wav' : 'm4a';
  const path = `users/${ownerId}/items/${itemId}/audio/audio.${extension}`;
  return uploadFile(path, localUri, mime, onProgress);
};
