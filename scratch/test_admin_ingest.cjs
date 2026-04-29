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

async function testAdminIngest() {
  const adminId = 'b879c68b-d398-4909-9572-1c4a2bca3b45'; // iarchive@hcdc.edu.ph
  
  const testMat = {
    id: 'test-' + Date.now(),
    material_id: '26iA019999999',
    title: 'Admin Test Ingest',
    status: 'published', // Admin status
    created_by: adminId,
    ingest_by: 'System Admin',
    cataloger: 'System Admin',
    category_id: 'college-engineering-technology',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log("Testing insert as admin...");
  const { data, error } = await supabase.from('materials').insert(testMat).select();

  if (error) {
    console.error("Insert FAILED:", error);
  } else {
    console.log("Insert SUCCESSFUL:", data);
    // Cleanup
    await supabase.from('materials').delete().eq('id', testMat.id);
  }
}

testAdminIngest();
