import { createClient } from '@supabase/supabase-js';

// Default to env variables, or check localStorage for dynamic browser setup
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const storedUrl = localStorage.getItem('custom_supabase_url') || envUrl;
const storedKey = localStorage.getItem('custom_supabase_key') || envKey;

export const isSupabaseConfigured = Boolean(
  storedUrl && 
  storedKey && 
  storedUrl.startsWith('https://') &&
  storedKey.length > 20
);

export const supabase = isSupabaseConfigured
  ? createClient(storedUrl, storedKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export const saveSupabaseCredentials = (url, key) => {
  if (url && key) {
    localStorage.setItem('custom_supabase_url', url.trim());
    localStorage.setItem('custom_supabase_key', key.trim());
  } else {
    localStorage.removeItem('custom_supabase_url');
    localStorage.removeItem('custom_supabase_key');
  }
  window.location.reload();
};

export const getSupabaseConfig = () => {
  return {
    url: storedUrl,
    key: storedKey,
    isConfigured: isSupabaseConfigured,
  };
};
