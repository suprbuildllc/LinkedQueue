-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations (tenants)
CREATE TABLE template_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles
CREATE TABLE template_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memberships (multi-tenant join)
CREATE TABLE template_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES template_organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Enable RLS
ALTER TABLE template_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile"
  ON template_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON template_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Org members can view their organizations"
  ON template_organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM template_memberships
      WHERE template_memberships.organization_id = template_organizations.id
      AND template_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Org owners can manage memberships"
  ON template_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM template_memberships m2
      WHERE m2.organization_id = template_memberships.organization_id
      AND m2.user_id = auth.uid()
      AND m2.role = 'owner'
    )
  );
