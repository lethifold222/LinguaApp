
import { openDB, IDBPDatabase } from 'https://esm.sh/idb@8.0.2';

const DB_NAME = 'LinguistProCache';
const STORE_NAME = 'word_images';

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};

export const imagePersistence = {
  async get(wordId: string, isKid: boolean): Promise<string | null> {
    const db = await getDB();
    const key = `${wordId}_${isKid ? 'kid' : 'adult'}`;
    return db.get(STORE_NAME, key);
  },

  async set(wordId: string, isKid: boolean, base64: string): Promise<void> {
    const db = await getDB();
    const key = `${wordId}_${isKid ? 'kid' : 'adult'}`;
    await db.put(STORE_NAME, base64, key);
  }
};
