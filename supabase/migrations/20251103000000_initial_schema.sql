-- ============================================================================
-- WALTERA - Migration Schema from base44 to Supabase
-- ============================================================================
-- Description: Complete database schema for Waltera AI Assistant platform
-- Date: 2025-11-03
-- Version: 1.0.0
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: profiles
-- ============================================================================
-- Purpose: Extends auth.users with application-specific user data
-- Replaces: base44.auth user metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- TABLE: conversations
-- ============================================================================
-- Purpose: Stores chat conversations with AI assistants
-- Replaces: base44.entities.Conversation
-- ============================================================================

CREATE TYPE service_type AS ENUM ('rag_contrats', 'conventions', 'analyse_fichiers');
CREATE TYPE conversation_status AS ENUM ('active', 'archived', 'deleted');

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Conversation metadata
  title TEXT NOT NULL DEFAULT 'Nouvelle conversation',
  session_id TEXT UNIQUE NOT NULL,
  service_type service_type NOT NULL DEFAULT 'rag_contrats',
  status conversation_status NOT NULL DEFAULT 'active',
  
  -- Messages stored as JSONB for flexibility
  messages JSONB DEFAULT '[]'::JSONB NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON public.conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_service_type ON public.conversations(service_type);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at DESC);

-- GIN index for JSONB messages search
CREATE INDEX IF NOT EXISTS idx_conversations_messages ON public.conversations USING GIN (messages);

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_conversations
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- TABLE: analysis_reports
-- ============================================================================
-- Purpose: Stores file network analysis reports
-- New table for analysis results
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analysis_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Report data
  title TEXT NOT NULL DEFAULT 'Analyse de fichiers',
  report_data JSONB NOT NULL,
  
  -- Metadata
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_id ON public.analysis_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_created_at ON public.analysis_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_status ON public.analysis_reports(status);

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_analysis_reports
  BEFORE UPDATE ON public.analysis_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: profiles
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Public profiles are viewable by authenticated users (optional, comment out if not needed)
-- CREATE POLICY "Authenticated users can view all profiles"
--   ON public.profiles
--   FOR SELECT
--   TO authenticated
--   USING (true);

-- ============================================================================
-- RLS POLICIES: conversations
-- ============================================================================

-- Users can view their own conversations
CREATE POLICY "Users can view own conversations"
  ON public.conversations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own conversations
CREATE POLICY "Users can insert own conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations"
  ON public.conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
  ON public.conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES: analysis_reports
-- ============================================================================

-- Users can view their own analysis reports
CREATE POLICY "Users can view own analysis reports"
  ON public.analysis_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own analysis reports
CREATE POLICY "Users can insert own analysis reports"
  ON public.analysis_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own analysis reports
CREATE POLICY "Users can update own analysis reports"
  ON public.analysis_reports
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own analysis reports
CREATE POLICY "Users can delete own analysis reports"
  ON public.analysis_reports
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get conversation count for a user
CREATE OR REPLACE FUNCTION public.get_user_conversation_count(
  p_user_id UUID,
  p_service_type service_type DEFAULT NULL
)
RETURNS INTEGER AS $$
BEGIN
  IF p_service_type IS NULL THEN
    RETURN (
      SELECT COUNT(*)::INTEGER
      FROM public.conversations
      WHERE user_id = p_user_id
        AND status = 'active'
    );
  ELSE
    RETURN (
      SELECT COUNT(*)::INTEGER
      FROM public.conversations
      WHERE user_id = p_user_id
        AND service_type = p_service_type
        AND status = 'active'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get today's conversation count
CREATE OR REPLACE FUNCTION public.get_today_conversation_count(
  p_user_id UUID
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.conversations
    WHERE user_id = p_user_id
      AND created_at >= CURRENT_DATE
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STORAGE BUCKETS (for file uploads)
-- ============================================================================

-- Create storage buckets for user files
-- Note: These need to be created via Supabase Dashboard or API
-- Documented here for reference

-- Bucket: user-uploads (public files)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('user-uploads', 'user-uploads', true);

-- Bucket: user-documents (private files)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('user-documents', 'user-documents', false);

-- Storage policies will be added in Phase 2

-- ============================================================================
-- INITIAL DATA MIGRATION HELPERS
-- ============================================================================

-- Function to migrate a conversation from base44 format
CREATE OR REPLACE FUNCTION public.migrate_conversation(
  p_user_id UUID,
  p_title TEXT,
  p_session_id TEXT,
  p_service_type TEXT,
  p_messages JSONB,
  p_status TEXT DEFAULT 'active',
  p_created_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_service_type service_type;
  v_status conversation_status;
BEGIN
  -- Cast service type
  v_service_type := p_service_type::service_type;
  v_status := p_status::conversation_status;
  
  -- Insert conversation
  INSERT INTO public.conversations (
    user_id,
    title,
    session_id,
    service_type,
    messages,
    status,
    created_at
  ) VALUES (
    p_user_id,
    p_title,
    p_session_id,
    v_service_type,
    p_messages,
    v_status,
    p_created_at
  )
  RETURNING id INTO v_conversation_id;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS (Optional - for analytics)
-- ============================================================================

-- View: User statistics
CREATE OR REPLACE VIEW public.user_stats AS
SELECT
  u.id AS user_id,
  p.full_name,
  p.email,
  COUNT(DISTINCT c.id) AS total_conversations,
  COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= CURRENT_DATE) AS today_conversations,
  COUNT(DISTINCT c.id) FILTER (WHERE c.service_type = 'rag_contrats') AS rag_conversations,
  COUNT(DISTINCT c.id) FILTER (WHERE c.service_type = 'conventions') AS conventions_conversations,
  COUNT(DISTINCT c.id) FILTER (WHERE c.service_type = 'analyse_fichiers') AS analyse_conversations,
  MAX(c.created_at) AS last_conversation_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.conversations c ON c.user_id = u.id AND c.status = 'active'
GROUP BY u.id, p.full_name, p.email;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users';
COMMENT ON TABLE public.conversations IS 'Chat conversations with AI assistants';
COMMENT ON TABLE public.analysis_reports IS 'File network analysis reports';

COMMENT ON COLUMN public.conversations.messages IS 'JSONB array of message objects: [{role, content, timestamp}]';
COMMENT ON COLUMN public.conversations.session_id IS 'Unique session identifier for RAG context';
COMMENT ON COLUMN public.conversations.metadata IS 'Additional metadata (flexible JSONB)';

-- ============================================================================
-- GRANTS (Permissions)
-- ============================================================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant access to tables for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analysis_reports TO authenticated;

-- Grant access to sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- END OF MIGRATION SCHEMA
-- ============================================================================
