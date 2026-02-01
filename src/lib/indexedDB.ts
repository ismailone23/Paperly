const DB_NAME = "paperly_db";
const DB_VERSION = 1;
const STORE_NAME = "tool_data";

interface ToolData {
  activeTool: string;
  penColor: string;
  pencilColor: string;
  penWidth: number;
  pencilWidth: number;
  pageCount: number;
  currentPage: number;
  historyStep: number;
  history: ImageData[];
  pages: { [key: number]: ImageData };
}

interface IDBData {
  slug: string;
  data: ToolData;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "slug" });
        }
      };
    });
  }

  async save(slug: string, data: ToolData): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ slug, data });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async load(slug: string): Promise<ToolData | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(slug);

      request.onsuccess = () => {
        const result = request.result as IDBData | undefined;
        resolve(result?.data || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(slug: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(slug);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexedDBService = new IndexedDBService();
export type { ToolData };
