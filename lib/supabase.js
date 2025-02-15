// /lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://svucjurmyzuhyirnvaay.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dWNqdXJteXp1aHlpcm52YWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2OTY1MTgsImV4cCI6MjA1NDI3MjUxOH0.DnBkVuslm99elL8kR34kZ-Q3T_bz--lLTC57vgMY1-0"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})