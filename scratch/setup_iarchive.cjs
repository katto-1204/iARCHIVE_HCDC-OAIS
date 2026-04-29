const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rolymutjvqysneipuaov.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbHltdXRqdnF5c25laXB1YW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ2NzgwMiwiZXhwIjoyMDkzMDQzODAyfQ.SsqAa6qVW67Wdwy-zVU5jx5brB-6Jq3xTq6KJ7ZLg5o";

const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log("Setting up admin account: iarchive@hcdc.edu.ph");

  // 1. Cleanup iadmin
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const iadmin = users.find(u => u.email === 'iadmin@hcdc.edu.ph');
  if (iadmin) {
    console.log("Cleaning up iadmin from Auth...");
    await supabase.auth.admin.deleteUser(iadmin.id);
  }

  // 2. Create iarchive
  console.log("Creating iarchive in Auth...");
  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email: 'iarchive@hcdc.edu.ph',
    password: 'admin123',
    email_confirm: true,
    user_metadata: {
      full_name: 'System Admin',
      role: 'admin',
    }
  });

  if (authErr) {
    console.error("Error creating iarchive in Auth:", authErr);
    // If it already exists, we'll try to update it
    if (authErr.message.includes("already exists")) {
       const existing = users.find(u => u.email === 'iarchive@hcdc.edu.ph');
       if (existing) {
         console.log("Updating existing iarchive password...");
         await supabase.auth.admin.updateUserById(existing.id, { password: 'admin123' });
       }
    }
  } else {
    console.log("iarchive created in Auth successfully.");
  }

  const uid = authUser?.user?.id || users.find(u => u.email === 'iarchive@hcdc.edu.ph')?.id;

  if (uid) {
    console.log("Upserting iarchive profile...");
    const { error: profErr } = await supabase.from('profiles').upsert({
      id: uid,
      email: 'iarchive@hcdc.edu.ph',
      name: 'System Admin',
      role: 'admin',
      status: 'active',
      institution: 'HCDC',
      updated_at: new Date().toISOString()
    });

    if (profErr) console.error("Error upserting profile:", profErr);
    else console.log("iarchive profile is now ACTIVE as ADMIN.");
  } else {
    console.error("Could not determine UID for iarchive");
  }
}

setup();
