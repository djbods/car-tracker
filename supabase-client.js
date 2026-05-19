// Supabase client for the E39 Garage Tracker.
// The publishable key is designed for browser use — RLS policies in
// supabase/schema.sql are what actually protect user data.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://ehsppiujyidojejntemg.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_B1vZMD4g55RkhE6UV-s5wg_cIsd2Zkc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
