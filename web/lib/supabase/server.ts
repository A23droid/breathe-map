import { createClient } from '@supabase/supabase-js'
import { getSupabaseEnv } from './env'

export function getSupabaseServerClient() {
  const { url, serviceRoleKey } = getSupabaseEnv()

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
