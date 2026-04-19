import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rivhxipmopkyvyivwarg.supabase.co'
// Use the Supabase "Publishable key" (a.k.a. anon key) in client-side code.
// If you ever copy a server/service role key here, it would be a serious security issue.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdmh4aXBtb3BreXZ5aXZ3YXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDQ1MTMsImV4cCI6MjA5MTg4MDUxM30.-pbkMwTnXLN9Bl--bMK1gGCR0ZGZg_XkupbM1xF9dLU'

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
export { supabase }

