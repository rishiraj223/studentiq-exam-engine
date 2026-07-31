import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Dropping NOT NULL constraint from correct_answer_index...');
  // Note: we have to use RPC or just raw fetch if we can't do DDL via standard JS client.
  // Actually, standard Supabase client cannot run DDL commands (ALTER TABLE).
  console.log("Can't run DDL from client.");
}

run();
