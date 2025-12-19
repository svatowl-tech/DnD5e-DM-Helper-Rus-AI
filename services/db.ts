
import { SavedImage, MapData } from "../types";

const DB_NAME = 'dmc_database';
const DB_VERSION = 3; // Incremented for maps store
const STORE_IMAGES = 'images';
const STORE_AUDIO = 'audio';
const STORE_MAPS = 'maps';

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
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MAPS)) {
        db.createObjectStore(STORE_MAPS, { keyPath: 'locationId' });
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

// Image Helpers
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

// Audio Helpers
export const saveAudioToDB = async (id: string, file: File): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_AUDIO], 'readwrite');
        const store = transaction.objectStore(STORE_AUDIO);
        const request = store.put({ id, file, timestamp: Date.now() });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getAudioFromDB = async (id: string): Promise<File | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_AUDIO], 'readonly');
        const store = transaction.objectStore(STORE_AUDIO);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result?.file || null);
        request.onerror = () => reject(request.error);
    });
};

export const deleteAudioFromDB = async (id: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_AUDIO], 'readwrite');
        const store = transaction.objectStore(STORE_AUDIO);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Map Helpers
export const saveMapToDB = async (locationId: string, mapData: MapData): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_MAPS], 'readwrite');
        const store = transaction.objectStore(STORE_MAPS);
        const request = store.put({ locationId, ...mapData, timestamp: Date.now() });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getMapFromDB = async (locationId: string): Promise<MapData | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_MAPS], 'readonly');
        const store = transaction.objectStore(STORE_MAPS);
        const request = store.get(locationId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};

export const deleteMapFromDB = async (locationId: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_MAPS], 'readwrite');
        const store = transaction.objectStore(STORE_MAPS);
        const request = store.delete(locationId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
