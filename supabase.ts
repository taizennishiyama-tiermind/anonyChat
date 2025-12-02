import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type ChannelLike = {
  on: (...args: unknown[]) => ChannelLike;
  subscribe: (callback?: (status: string) => void) => ChannelLike;
};

type SafeSupabase = SupabaseClient & {
  isConfigured: boolean;
};

const buildNoopQuery = <T,>() => {
  const response = { data: [] as T[], error: null };
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    insert: async () => response,
    then: (resolve: (value: typeof response) => void, reject?: (reason?: unknown) => void) =>
      Promise.resolve(response).then(resolve, reject),
  };
  return builder;
};

const buildNoopChannel = (): ChannelLike => ({
  on: () => buildNoopChannel(),
  subscribe: (callback) => {
    callback?.('SUBSCRIBED');
    return buildNoopChannel();
  },
});

const buildSafeClient = (): SafeSupabase => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase 環境変数が未設定のため、ローカルプレビュー用のモッククライアントを利用します。');

    const noopClient = {
      from: () => buildNoopQuery<any>(),
      channel: () => buildNoopChannel(),
      removeChannel: () => {},
      // Additional methods used by the Supabase client are stubbed as no-ops
      auth: {
        getSession: async () => ({ data: null, error: null }),
      },
    } as unknown as SupabaseClient;

    return Object.assign(noopClient, { isConfigured: false });
  }

  const client = createClient(supabaseUrl, supabaseAnonKey);
  return Object.assign(client, { isConfigured: true });
};

export const supabase: SafeSupabase = buildSafeClient();
export const isSupabaseConfigured = supabase.isConfigured;
