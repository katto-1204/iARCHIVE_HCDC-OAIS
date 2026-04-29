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

async function checkMaterial() {
  const { data, error } = await supabase.from('materials').select('id, title, category_id').eq('id', '6a8586cc-cf12-4df7-87b8-a97750fea600').single();
  if (error) console.error(error);
  else console.log("Archivist record category_id:", data.category_id);
}

checkMaterial();
