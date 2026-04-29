const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rolymutjvqysneipuaov.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbHltdXRqdnF5c25laXB1YW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ2NzgwMiwiZXhwIjoyMDkzMDQzODAyfQ.SsqAa6qVW67Wdwy-zVU5jx5brB-6Jq3xTq6KJ7ZLg5o";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log("Fixing accounts with FK cleanup...");

  const targetEmail = 'admin@hcdc.edu.ph';
  
  // 1. Find the user
  const { data: profile } = await supabase.from('profiles').select('id').eq('email', targetEmail).single();
  
  if (profile) {
    const uid = profile.id;
    console.log("Cleaning up references for user:", uid);
    
    // Cleanup audit_logs
    await supabase.from('audit_logs').update({ user_id: null }).eq('user_id', uid);
    
    // Cleanup other tables if necessary (based on typical OAIS schema)
    // materials, access_requests, ingest_requests might also have user_id
    await supabase.from('materials').update({ uploaded_by: null }).eq('uploaded_by', uid);
    await supabase.from('access_requests').update({ user_id: null }).eq('user_id', uid);
    await supabase.from('ingest_requests').update({ archivist_id: null }).eq('archivist_id', uid);

    console.log("Deleting profile...");
    const { error: pErr } = await supabase.from('profiles').delete().eq('id', uid);
    if (pErr) console.error("Profile delete error:", pErr);
    
    console.log("Deleting auth user...");
    const { error: aErr } = await supabase.auth.admin.deleteUser(uid);
    if (aErr) console.error("Auth delete error:", aErr);
  }

  // 2. Activate iadmin
  const { data: newAdmin } = await supabase.from('profiles').select('id').eq('email', 'iadmin@hcdc.edu.ph').single();
  if (newAdmin) {
    console.log("Activating iadmin:", newAdmin.id);
    await supabase.from('profiles').update({ status: 'active' }).eq('id', newAdmin.id);
    console.log("iadmin activated.");
  }
}

fix();
