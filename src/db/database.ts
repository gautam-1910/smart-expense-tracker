import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

const SEED_CATEGORIES = [
  { id: 'food', name: 'Food', icon: 'restaurant', color: '#E67E22' },
  { id: 'transport', name: 'Transport', icon: 'car', color: '#2980B9' },
  { id: 'shopping', name: 'Shopping', icon: 'cart', color: '#8E44AD' },
  { id: 'bills', name: 'Bills', icon: 'receipt', color: '#D4A017' },
  { id: 'health', name: 'Health', icon: 'medical', color: '#16A085' },
  { id: 'entertainment', name: 'Entertainment', icon: 'game-controller', color: '#C0392B' },
  { id: 'others', name: 'Others', icon: 'ellipsis-horizontal', color: '#7F8C8D' },
] as const;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('expenses.db');
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      icon TEXT,
      color TEXT
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL,
      category TEXT,
      note TEXT,
      date TEXT,
      merchant TEXT
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY NOT NULL,
      category TEXT,
      monthlyLimit REAL
    );
  `);

  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM categories'
  );

  if ((row?.count ?? 0) === 0) {
    for (const category of SEED_CATEGORIES) {
      await db.runAsync(
        'INSERT INTO categories (id, name, icon, color) VALUES (?, ?, ?, ?)',
        category.id,
        category.name,
        category.icon,
        category.color
      );
    }
  }

  return db;
}
