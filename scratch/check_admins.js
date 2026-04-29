import { supabase } from "./api/src/lib/supabase.js";

async function checkAdmins() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'admin');
  
  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }

  console.log("Admin Profiles found:", profiles.length);
  profiles.forEach(p => {
    console.log(`- ${p.email} (Status: ${p.status}, ID: ${p.id})`);
  });

  const { data: allUsers, error: usersErr } = await supabase
    .from('profiles')
    .select('email, role, status');
  
  console.log("\nAll Profiles:");
  allUsers.forEach(p => {
    console.log(`- ${p.email} [${p.role}] (Status: ${p.status})`);
  });
}

checkAdmins();
