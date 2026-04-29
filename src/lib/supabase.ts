import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

/** 환경변수가 모두 설정되어 있는지 여부 */
export const isSupabaseConfigured =
  typeof supabaseUrl === 'string' && supabaseUrl.startsWith('https://') &&
  typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 0

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
)
