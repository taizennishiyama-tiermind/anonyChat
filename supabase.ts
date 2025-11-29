import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const randomId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Math.random().toString(16).slice(2)}`;
};

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('localStorage is not available; falling back to memory-only store.', error);
    return null;
  }
};

const storage = getStorage();

const storageKey = (table: string) => `mock-${table}`;

const memoryStore: Record<string, any[]> = {
  messages: storage ? JSON.parse(storage.getItem(storageKey('messages')) || '[]') : [],
  reactions: storage ? JSON.parse(storage.getItem(storageKey('reactions')) || '[]') : [],
  message_reactions: storage ? JSON.parse(storage.getItem(storageKey('message_reactions')) || '[]') : [],
};

const persist = (table: string) => {
  if (!storage) return;
  storage.setItem(storageKey(table), JSON.stringify(memoryStore[table] || []));
};

const createMockClient = () => {
  const from = (table: string) => {
    const filters: Array<{ field: string; value: unknown }> = [];
    let orderField: string | null = null;
    let ascending = true;

    const builder = {
      select: async () => {
        let data = [...(memoryStore[table] || [])];
        filters.forEach(({ field, value }) => {
          data = data.filter((row) => row[field] === value);
        });
        if (orderField) {
          data.sort((a, b) => {
            if (a[orderField] === b[orderField]) return 0;
            if (ascending) return a[orderField] > b[orderField] ? 1 : -1;
            return a[orderField] < b[orderField] ? 1 : -1;
          });
        }
        return { data, error: null } as const;
      },
      insert: async (rows: any[]) => {
        const normalized = rows.map((row) => ({
          ...row,
          id: row.id || randomId(),
          timestamp: row.timestamp || new Date().toISOString(),
        }));
        memoryStore[table] = [...(memoryStore[table] || []), ...normalized];
        persist(table);
        return { data: normalized, error: null } as const;
      },
      eq: (field: string, value: unknown) => {
        filters.push({ field, value });
        return builder;
      },
      order: (field: string, options?: { ascending?: boolean }) => {
        orderField = field;
        ascending = options?.ascending !== false;
        return builder;
      },
    };

    return builder;
  };

  const channel = () => {
    const channelObj = {
      on: () => channelObj,
      subscribe: (callback?: (status: string) => void) => {
        if (callback) {
          setTimeout(() => callback('SUBSCRIBED'), 0);
        }
        return { data: { subscription: { state: 'SUBSCRIBED' } } } as const;
      },
    };
    return channelObj;
  };

  const removeChannel = () => undefined;

  return { from, channel, removeChannel } as unknown as SupabaseClient;
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

if (!isSupabaseConfigured) {
  console.warn('Supabase環境変数が設定されていません。ローカルストレージに保存される簡易モードで動作します。');
}
