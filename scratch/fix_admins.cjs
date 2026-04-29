const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rolymutjvqysneipuaov.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbHltdXRqdnF5c25laXB1YW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ2NzgwMiwiZXhwIjoyMDkzMDQzODAyfQ.SsqAa6qVW67Wdwy-zVU5jx5brB-6Jq3xTq6KJ7ZLg5o";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log("Fixing accounts...");

  // 1. Find the old admin
  const { data: oldAdmin, error: oldErr } = await supabase.from('profiles').select('id').eq('email', 'admin@hcdc.edu.ph').single();
  if (oldAdmin) {
    console.log("Deleting old admin account:", oldAdmin.id);
    await supabase.auth.admin.deleteUser(oldAdmin.id);
    await supabase.from('profiles').delete().eq('id', oldAdmin.id);
  }

  // 2. Activate the new admin
  const { data: newAdmin, error: newErr } = await supabase.from('profiles').select('id').eq('email', 'iadmin@hcdc.edu.ph').single();
  if (newAdmin) {
    console.log("Activating new admin account:", newAdmin.id);
    const { error: updateErr } = await supabase.from('profiles').update({ status: 'active' }).eq('id', newAdmin.id);
    if (updateErr) console.error("Error activating:", updateErr);
    else console.log("Success! iadmin@hcdc.edu.ph is now active.");
  } else {
    console.error("Could not find iadmin@hcdc.edu.ph profile");
  }
}

fix();
