const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rolymutjvqysneipuaov.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbHltdXRqdnF5c25laXB1YW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ2NzgwMiwiZXhwIjoyMDkzMDQzODAyfQ.SsqAa6qVW67Wdwy-zVU5jx5brB-6Jq3xTq6KJ7ZLg5o";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking profiles...");
  const { data: profiles, error } = await supabase.from('profiles').select('*');
  
  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }

  console.log(`Found ${profiles.length} profiles:`);
  profiles.forEach(p => {
    console.log(`- ${p.email} [${p.role}] (Status: ${p.status}, ID: ${p.id})`);
  });

  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error("Error fetching auth users:", authErr);
  } else {
    console.log(`\nFound ${authUsers.users.length} auth users:`);
    authUsers.users.forEach(u => {
      console.log(`- ${u.email} (ID: ${u.id}, Created: ${u.created_at})`);
    });
  }
}

check();
