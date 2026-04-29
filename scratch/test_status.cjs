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

async function getTableDefinition() {
  const { data, error } = await supabase.rpc('get_table_definition', { table_name: 'materials' });
  // Since we don't have that RPC, let's just try to insert a record with 'published' status and see the error.
  
  const testMat = {
    id: 'test-status-' + Date.now(),
    material_id: 'REF-STATUS-' + Date.now(),
    title: 'Status Test',
    status: 'published',
    created_by: 'b879c68b-d398-4909-9572-1c4a2bca3b45'
  };

  const { error: err } = await supabase.from('materials').insert(testMat);
  if (err) {
    console.error("Insert with 'published' FAILED:", err);
  } else {
    console.log("Insert with 'published' SUCCESSFUL");
    await supabase.from('materials').delete().eq('id', testMat.id);
  }
}

getTableDefinition();
