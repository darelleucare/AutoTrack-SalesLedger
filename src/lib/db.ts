import { Sale, AppSettings, DEFAULT_SETTINGS } from '@/types/sales';

export interface Database {
  sales: Sale[];
  settings: AppSettings;
  auth: {
    authenticated: boolean;
  };
}

const DB_KEY = 'lowdb_app_db';

const defaultData: Database = {
  sales: [],
  settings: DEFAULT_SETTINGS,
  auth: {
    authenticated: false,
  },
};

class LowDbBrowser {
  data: Database;

  constructor(initialData: Database) {
    this.data = initialData;
  }

  async read(): Promise<void> {
    try {
      const stored = localStorage.getItem(DB_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
      } else {
        this.data = defaultData;
      }
    } catch {
      this.data = defaultData;
    }
  }

  async write(): Promise<void> {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to write to database:', error);
    }
  }
}

let db: LowDbBrowser | null = null;

export async function initDb(): Promise<LowDbBrowser> {
  if (db) {
    return db;
  }

  db = new LowDbBrowser(defaultData);
  await db.read();
  return db;
}

export function getDb(): LowDbBrowser {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export async function writeDb(): Promise<void> {
  if (db) {
    await db.write();
  }
}
