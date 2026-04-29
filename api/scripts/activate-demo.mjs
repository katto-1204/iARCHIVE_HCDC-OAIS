import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Activating Demo Accounts in Database...");
  const users = [
    { id: 'da000000-0000-0000-0000-000000000001', email: 'admin@hcdc.edu.ph', name: 'System Administrator', role: 'admin', status: 'active' },
    { id: 'da000000-0000-0000-0000-000000000002', email: 'archivist@hcdc.edu.ph', name: 'Demo Archivist', role: 'archivist', status: 'active' },
    { id: 'da000000-0000-0000-0000-000000000003', email: 'student@hcdc.edu.ph', name: 'Demo Student', role: 'student', status: 'active' }
  ];

  for (const user of users) {
    const { error } = await supabase.from('profiles').upsert(user);
    if (error) console.error(`Failed for ${user.email}:`, error.message);
    else console.log(`✓ Activated ${user.email}`);
  }
}

run();
