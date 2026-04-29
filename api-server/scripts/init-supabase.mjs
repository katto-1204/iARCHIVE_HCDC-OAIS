import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  {
    name: 'categories',
    sql: `
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category_no INTEGER,
        parent_id TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'materials',
    sql: `
      CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        material_id TEXT UNIQUE,
        title TEXT NOT NULL,
        alt_title TEXT,
        creator TEXT,
        description TEXT,
        date TEXT,
        category_id TEXT REFERENCES categories(id),
        hierarchy_path TEXT,
        access TEXT DEFAULT 'public',
        format TEXT,
        file_size TEXT,
        pages INTEGER,
        language TEXT,
        publisher TEXT,
        contributor TEXT,
        subject TEXT,
        type TEXT,
        source TEXT,
        rights TEXT,
        relation TEXT,
        coverage TEXT,
        identifier TEXT,
        archival_history TEXT,
        custodial_history TEXT,
        accession_no TEXT,
        scope_content TEXT,
        arrangement TEXT,
        sha256 TEXT,
        scanner TEXT,
        resolution TEXT,
        physical_location TEXT,
        physical_condition TEXT,
        binding_type TEXT,
        level_of_description TEXT DEFAULT 'Item',
        extent_and_medium TEXT,
        reference_code TEXT,
        date_of_description TEXT,
        access_conditions TEXT,
        reproduction_conditions TEXT,
        terms_of_use TEXT,
        notes TEXT,
        points_of_access TEXT,
        location_of_originals TEXT,
        location_of_copies TEXT,
        related_units TEXT,
        publication_note TEXT,
        finding_aids TEXT,
        rules_or_conventions TEXT,
        archivist_note TEXT,
        cataloger TEXT,
        date_cataloged TEXT,
        sip_id TEXT,
        aip_id TEXT,
        ingest_date TEXT,
        ingest_by TEXT,
        fixity_status TEXT,
        preferred_citation TEXT,
        file_url TEXT,
        thumbnail_url TEXT,
        status TEXT DEFAULT 'pending',
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'announcements',
    sql: `
      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT DEFAULT 'General',
        is_active BOOLEAN DEFAULT TRUE,
        likes JSONB DEFAULT '[]',
        comments JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'feedbacks',
    sql: `
      CREATE TABLE IF NOT EXISTS feedbacks (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        name TEXT,
        email TEXT,
        status TEXT DEFAULT 'unread',
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'audit_logs',
    sql: `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        user_id TEXT,
        user_name TEXT,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  }
];

async function init() {
  console.log("Initializing Supabase Schema...");
  
  for (const table of tables) {
    console.log(`Checking/Creating table: ${table.name}...`);
    // Supabase JS doesn't support raw SQL easily without RPC or a specific extension.
    // However, I can try to use a simple SELECT to check if it exists, 
    // and if not, I'll advise the user to run the SQL in the dashboard.
    const { error } = await supabase.from(table.name).select('id').limit(1);
    if (error && error.code === 'PGRST116' || (error && error.message.includes('does not exist'))) {
      console.log(`Table ${table.name} does not exist. Please run the SQL in your Supabase SQL Editor:`);
      console.log(table.sql);
    } else {
      console.log(`Table ${table.name} confirmed.`);
    }
  }
  
  console.log("\nMigration complete or SQL provided above.");
}

init().catch(console.error);
