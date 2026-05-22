// Supabase client for the Car Tracker.
// Config is loaded at runtime from window.APP_CONFIG (see config.example.js).
// The publishable key is designed for browser use — RLS policies in
// supabase/schema.sql are what actually protect user data.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const config = window.APP_CONFIG
if (!config?.SUPABASE_URL || !config?.SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing Supabase config. Copy config.example.js to config.local.js and fill in the values.'
  )
}

export const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY)
