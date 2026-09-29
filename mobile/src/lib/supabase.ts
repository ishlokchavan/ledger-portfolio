import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Same Supabase project the web app (index.html) talks to — the anon key is
// safe to ship in the client; every table is behind Row Level Security.
const SUPABASE_URL = 'https://nrdqdgkotnuwnbrujrdu.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZHFkZ2tvdG51d25icnVqcmR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MDgwNjQsImV4cCI6MjEwNjE4NDA2NH0.XEIGKzp7jqSkHpP2ULo4v-jlyS93fmu8XVE-jfpEYWw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
