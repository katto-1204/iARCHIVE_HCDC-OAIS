-- iArchive HCDC-OAIS: Full Supabase Schema (Idempotent)
-- Run this in the Supabase SQL Editor

-- 1. Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_no INTEGER,
  description TEXT,
  level TEXT DEFAULT 'fonds',
  parent_id TEXT REFERENCES categories(id),
  is_featured BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student',
  user_category TEXT,
  institution TEXT,
  purpose TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Materials
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  material_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  alt_title TEXT,
  creator TEXT,
  description TEXT,
  date TEXT,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  hierarchy_path TEXT,
  access TEXT DEFAULT 'public',
  format TEXT,
  file_size TEXT,
  pages INTEGER,
  language TEXT DEFAULT 'English',
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
  status TEXT DEFAULT 'published',
  
  -- Chunking & Page Preview Metadata
  is_file_chunked BOOLEAN DEFAULT FALSE,
  chunks_count INTEGER DEFAULT 0,
  has_page_images BOOLEAN DEFAULT FALSE,
  page_count INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT DEFAULT 'General',
  is_active BOOLEAN DEFAULT TRUE,
  likes JSONB DEFAULT '[]',
  comments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  name TEXT,
  email TEXT,
  rating INTEGER,
  status TEXT DEFAULT 'unread',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Access Requests
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id TEXT REFERENCES materials(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  user_id UUID REFERENCES profiles(id),
  user_name TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Ingest Requests
CREATE TABLE IF NOT EXISTS ingest_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id TEXT,
  material_title TEXT NOT NULL,
  hierarchy_path TEXT,
  requested_by TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending'
);

-- 9. Material Chunks (for large files)
CREATE TABLE IF NOT EXISTS material_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Material Pages (for multi-page previews)
CREATE TABLE IF NOT EXISTS material_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id TEXT NOT NULL,
  page_index INTEGER NOT NULL,
  data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, institution, purpose, status)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'), 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    COALESCE(new.raw_user_meta_data->>'institution', 'HCDC'),
    COALESCE(new.raw_user_meta_data->>'purpose', ''),
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingest_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_pages ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON profiles;
DROP POLICY IF EXISTS "Public materials are viewable by everyone" ON materials;
DROP POLICY IF EXISTS "Admins can do everything on materials" ON materials;
DROP POLICY IF EXISTS "Public categories viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- Recreate policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profiles" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public materials are viewable by everyone" ON materials FOR SELECT USING (access = 'public' OR status = 'published');
CREATE POLICY "Admins can do everything on materials" ON materials FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Public categories viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
