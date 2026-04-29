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

async function checkTestArchivistMaterials() {
  const archivistId = 'c00699e9-82d9-429a-9116-6ede367846d0';
  const { data, error } = await supabase.from('materials').select('id, title, status').eq('created_by', archivistId);
  
  if (error) {
    console.error(error);
  } else {
    console.log("Materials created by testarchivist:", data);
  }
}

checkTestArchivistMaterials();
