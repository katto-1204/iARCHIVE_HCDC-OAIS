// Seed admin accounts + categories into Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ==========================================
// 1. SEED ADMIN ACCOUNTS
// ==========================================
const ADMIN_ACCOUNTS = [
  { email: 'admin@hcdc.edu.ph', password: 'admin123', name: 'Admin', role: 'admin', institution: 'HCDC' },
  { email: 'archivist@hcdc.edu.ph', password: 'admin123', name: 'Archivist', role: 'archivist', institution: 'HCDC' },
  { email: 'student@hcdc.edu.ph', password: 'admin123', name: 'Student', role: 'student', institution: 'HCDC' },
];

async function seedAccounts() {
  console.log('========== SEEDING ACCOUNTS ==========');
  for (const account of ADMIN_ACCOUNTS) {
    console.log(`\n→ Creating: ${account.email} (${account.role})...`);

    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: {
        full_name: account.name,
        role: account.role,
        institution: account.institution,
      },
    });

    if (error) {
      if (/already been registered/i.test(error.message)) {
        console.log(`  ⚠ Already exists. Updating profile to active...`);
        const { data: users } = await supabase.auth.admin.listUsers();
        const existing = users?.users?.find(u => u.email === account.email);
        if (existing) {
          // Force password update to admin123
          const { error: passErr } = await supabase.auth.admin.updateUserById(existing.id, {
            password: account.password
          });
          
          if (passErr) console.error(`  ✗ Password update failed for ${account.email}:`, passErr.message);
          else console.log(`  ✓ Password reset to ${account.password}.`);

          await supabase.from('profiles').upsert({
            id: existing.id,
            name: account.name,
            email: account.email,
            role: account.role,
            institution: account.institution,
            status: 'active',
            updated_at: new Date().toISOString(),
          });
          console.log(`  ✓ Profile updated to active & role: ${account.role}.`);
        }
      } else {
        console.error(`  ✗ Error: ${error.message}`);
      }
      continue;
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name: account.name,
        email: account.email,
        role: account.role,
        institution: account.institution,
        status: 'active',
        updated_at: new Date().toISOString(),
      });
      console.log(`  ✓ Created & activated! (ID: ${data.user.id})`);
    }
  }
}

// ==========================================
// 2. SEED CATEGORIES
// ==========================================
async function seedCategories() {
  console.log('\n========== SEEDING CATEGORIES ==========');

  // Read from the local categories.json
  const categoriesPath = path.resolve(__dirname, '../../categories.json');
  if (!fs.existsSync(categoriesPath)) {
    console.error('  ✗ categories.json not found at:', categoriesPath);
    return;
  }

  const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
  console.log(`  Found ${categories.length} categories to seed.\n`);

  // Sort so parents are inserted before children
  const sorted = [...categories].sort((a, b) => {
    if (!a.parentId && b.parentId) return -1;
    if (a.parentId && !b.parentId) return 1;
    return (a.categoryNo || 0) - (b.categoryNo || 0);
  });

  let success = 0;
  let skipped = 0;

  for (const cat of sorted) {
    const row = {
      id: cat.id,
      name: cat.name,
      description: cat.description || null,
      category_no: Math.floor(cat.categoryNo || 0),
      level: cat.level || 'fonds',
      parent_id: cat.parentId || null,
      is_featured: cat.is_featured || cat.isFeatured || false,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('categories').upsert(row);

    if (error) {
      console.log(`  ✗ ${cat.name}: ${error.message}`);
      skipped++;
    } else {
      console.log(`  ✓ ${cat.name} (${cat.level})`);
      success++;
    }
  }

  console.log(`\n  Results: ${success} inserted, ${skipped} skipped/failed`);
}

// ==========================================
// RUN ALL
// ==========================================
async function main() {
  await seedAccounts();
  await seedCategories();
  console.log('\n✅ All seeding complete!\n');
}

main().catch(console.error);
