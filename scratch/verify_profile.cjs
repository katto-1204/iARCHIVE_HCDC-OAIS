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

async function verifyProfile() {
  const adminEmail = 'iarchive@hcdc.edu.ph';
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('email', adminEmail).single();
  
  if (error) {
    console.error("Profile NOT found for", adminEmail, error);
  } else {
    console.log("Profile found:", profile);
  }
}

verifyProfile();
