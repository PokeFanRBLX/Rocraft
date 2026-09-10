/**
 * IndexedDB storage helper for user custom soundtrack in Rocraft
 */

const DB_NAME = 'rocraft_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'soundtracks';
const KEY = 'active_soundtrack';

interface StoredAudio {
  id: string;
  name: string;
  type: string;
  data: ArrayBuffer;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAudioTrackToStorage(file: File): Promise<{ name: string; blobUrl: string }> {
  const buffer = await file.arrayBuffer();
  const db = await openDB();

  const record: StoredAudio = {
    id: KEY,
    name: file.name,
    type: file.type || 'audio/mp3',
    data: buffer,
    updatedAt: Date.now()
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);

    req.onsuccess = () => {
      const blob = new Blob([record.data], { type: record.type });
      const blobUrl = URL.createObjectURL(blob);
      resolve({ name: record.name, blobUrl });
    };

    req.onerror = () => reject(req.error);
  });
}

export async function loadAudioTrackFromStorage(): Promise<{ name: string; blobUrl: string } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY);

      req.onsuccess = () => {
        const record = req.result as StoredAudio | undefined;
        if (!record || !record.data) {
          resolve(null);
          return;
        }
        const blob = new Blob([record.data], { type: record.type || 'audio/mp3' });
        const blobUrl = URL.createObjectURL(blob);
        resolve({ name: record.name, blobUrl });
      };

      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to load audio from storage', err);
    return null;
  }
}

export async function removeAudioTrackFromStorage(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to remove audio from storage', err);
  }
}
