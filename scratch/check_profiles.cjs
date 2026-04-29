const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking profiles...");
  const { data: profiles, error } = await supabase.from('profiles').select('*');
  
  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${profiles.length} profiles:`);
  profiles.forEach(p => {
    console.log(`- ${p.email} [${p.role}] (Status: ${p.status}, ID: ${p.id})`);
  });
}

check();
