-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Integrations
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connected BOOLEAN DEFAULT FALSE,
  "lastSync" TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monitored Repositories
CREATE TABLE IF NOT EXISTS monitored_repositories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_full_name TEXT NOT NULL,
  repo_id TEXT,
  is_monitored BOOLEAN DEFAULT TRUE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ,
  UNIQUE(user_id, repo_full_name)
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  activity_type TEXT,
  title TEXT,
  description TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  repo_full_name TEXT,
  is_content_worthy BOOLEAN DEFAULT TRUE
);

-- Drafts
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  edited_content TEXT,
  status TEXT DEFAULT 'draft',
  writing_style TEXT,
  confidence_score NUMERIC,
  activity_summary TEXT,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled Posts
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  draft_id UUID REFERENCES drafts(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitored_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own integrations" ON integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own monitored repos" ON monitored_repositories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own activities" ON activities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own drafts" ON drafts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own scheduled posts" ON scheduled_posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid() = id);
