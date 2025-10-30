import { createClient } from '@supabase/supabase-js';
import { config } from 'src/config/env';

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseSecretKey,
);
