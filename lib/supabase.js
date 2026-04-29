import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://oracgtekoyjqacenrjog.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_E04vOUsAb0LyyFOsSpq5cQ_gEyaafUf'

export const supabase = createClient(supabaseUrl, supabaseKey)
