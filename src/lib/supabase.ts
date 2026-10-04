import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const rawServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Determines if valid Supabase credentials have been configured
export const isSupabaseConfigured: boolean = Boolean(
  rawUrl &&
  rawAnonKey &&
  typeof rawUrl === 'string' &&
  rawUrl.startsWith('http') &&
  !rawUrl.includes('your_supabase') &&
  !rawUrl.includes('placeholder')
);

// Fallbacks prevent createClient from crashing if .env is missing or incomplete
const supabaseUrl = isSupabaseConfigured ? rawUrl! : 'https://mock-supabase.local'
const supabaseAnonKey = isSupabaseConfigured ? rawAnonKey! : 'mock-anon-key'
const supabaseServiceRoleKey = isSupabaseConfigured ? (rawServiceRoleKey || rawAnonKey)! : 'mock-service-key'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: isSupabaseConfigured,
    persistSession: isSupabaseConfigured,
    detectSessionInUrl: isSupabaseConfigured
  }
})

// For admin operations (server-side only)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
