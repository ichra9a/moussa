// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://jqpejxvpzviyumfdczxg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcGVqeHZwenZpeXVtZmRjenhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3ODY1MjcsImV4cCI6MjA2NDM2MjUyN30.2zAPv62r6bpsid-0ntpFdiHEloTxUyqxskkq22vZyoo";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);