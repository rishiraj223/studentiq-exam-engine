import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.COACHING_SUPABASE_URL, process.env.COACHING_SUPABASE_SERVICE_ROLE_KEY);

async function checkEmails() {
  const { data, error } = await supabase.from('coaching_centers').select('id, name, email');
  console.log("Coaching centers:", data);
}

checkEmails();
