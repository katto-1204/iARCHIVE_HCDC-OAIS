const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBypassAdmin() {
  const bypassId = 'da000000-0000-0000-0000-000000000001';
  const { data, error } = await supabase.from('profiles').select('*').eq('id', bypassId).single();
  
  if (error) {
    console.error("Bypass Admin profile NOT found:", error);
  } else {
    console.log("Bypass Admin profile found:", data);
  }
}

checkBypassAdmin();
