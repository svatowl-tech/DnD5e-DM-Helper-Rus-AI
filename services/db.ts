
import { SavedImage } from "../types";

const DB_NAME = 'dmc_database';
const DB_VERSION = 1;
const STORE_IMAGES = 'images';

let dbPromise: Promise<IDBDatabase> | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
};

export const saveImageToDB = async (image: SavedImage): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_IMAGES], 'readwrite');
    const store = transaction.objectStore(STORE_IMAGES);
    const request = store.put(image);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllImagesFromDB = async (): Promise<SavedImage[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_IMAGES], 'readonly');
    const store = transaction.objectStore(STORE_IMAGES);
    const request = store.getAll();

    request.onsuccess = () => {
        // Sort by timestamp desc
        const results = request.result as SavedImage[];
        resolve(results.sort((a, b) => b.timestamp - a.timestamp));
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteImageFromDB = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_IMAGES], 'readwrite');
    const store = transaction.objectStore(STORE_IMAGES);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
