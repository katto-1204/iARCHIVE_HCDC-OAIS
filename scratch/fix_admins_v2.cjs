const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rolymutjvqysneipuaov.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbHltdXRqdnF5c25laXB1YW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ2NzgwMiwiZXhwIjoyMDkzMDQzODAyfQ.SsqAa6qVW67Wdwy-zVU5jx5brB-6Jq3xTq6KJ7ZLg5o";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log("Fixing accounts...");

  const targetEmail = 'admin@hcdc.edu.ph';
  
  // 1. Find the user in Auth
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
  const userToDelete = users.find(u => u.email === targetEmail);

  if (userToDelete) {
    console.log("Found user in Auth:", userToDelete.id);
    const { error: delErr } = await supabase.auth.admin.deleteUser(userToDelete.id);
    if (delErr) console.error("Error deleting from Auth:", delErr);
    else console.log("Deleted from Auth successfully.");
  } else {
    console.log("User not found in Auth.");
  }

  // 2. Find and delete from Profiles
  const { error: profileDelErr } = await supabase.from('profiles').delete().eq('email', targetEmail);
  if (profileDelErr) console.error("Error deleting from Profiles:", profileDelErr);
  else console.log("Deleted from Profiles successfully (if it existed).");

  // 3. Activate iadmin
  const { data: newAdmin } = await supabase.from('profiles').select('id').eq('email', 'iadmin@hcdc.edu.ph').single();
  if (newAdmin) {
    console.log("Activating iadmin:", newAdmin.id);
    await supabase.from('profiles').update({ status: 'active' }).eq('id', newAdmin.id);
    console.log("iadmin activated.");
  }
}

fix();
