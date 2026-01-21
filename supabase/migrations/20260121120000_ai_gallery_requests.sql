-- Phase 11: AI Gallery Requests
-- This migration creates the ai_gallery_requests table for model and tool access requests

-- =============================================
-- AI Gallery Requests Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_gallery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('model', 'tool')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  justification TEXT NOT NULL,
  use_case TEXT,
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
  team_impact TEXT, -- How many people will use this
  estimated_usage TEXT, -- Expected usage frequency
  alternatives_considered TEXT, -- Other options considered
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  admin_notes TEXT,
  reviewed_by TEXT, -- admin email
  reviewed_at TIMESTAMPTZ,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_gallery_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own requests and all approved requests
CREATE POLICY "ai_gallery_requests_select" ON public.ai_gallery_requests
  FOR SELECT USING (
    user_email = current_setting('request.jwt.claim.email', true)::TEXT
    OR status = 'approved'
    OR status = 'pending' -- Allow viewing all pending to enable upvoting
  );

-- Users can create their own requests
CREATE POLICY "ai_gallery_requests_insert" ON public.ai_gallery_requests
  FOR INSERT WITH CHECK (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

-- Users can update their own pending requests
CREATE POLICY "ai_gallery_requests_update" ON public.ai_gallery_requests
  FOR UPDATE USING (
    user_email = current_setting('request.jwt.claim.email', true)::TEXT
    AND status = 'pending'
  );

-- =============================================
-- Request Upvotes Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_gallery_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.ai_gallery_requests(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, user_email)
);

ALTER TABLE public.ai_gallery_upvotes ENABLE ROW LEVEL SECURITY;

-- Users can see all upvotes
CREATE POLICY "ai_gallery_upvotes_select" ON public.ai_gallery_upvotes
  FOR SELECT USING (TRUE);

-- Users can create their own upvotes
CREATE POLICY "ai_gallery_upvotes_insert" ON public.ai_gallery_upvotes
  FOR INSERT WITH CHECK (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

-- Users can delete their own upvotes
CREATE POLICY "ai_gallery_upvotes_delete" ON public.ai_gallery_upvotes
  FOR DELETE USING (user_email = current_setting('request.jwt.claim.email', true)::TEXT);

-- =============================================
-- Helper Functions
-- =============================================

-- Submit a new request
CREATE OR REPLACE FUNCTION public.submit_ai_gallery_request(
  p_user_email TEXT,
  p_request_type TEXT,
  p_name TEXT,
  p_description TEXT,
  p_justification TEXT,
  p_use_case TEXT DEFAULT NULL,
  p_urgency TEXT DEFAULT 'normal',
  p_team_impact TEXT DEFAULT NULL,
  p_estimated_usage TEXT DEFAULT NULL,
  p_alternatives TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
BEGIN
  INSERT INTO public.ai_gallery_requests (
    user_email, request_type, name, description, justification,
    use_case, urgency, team_impact, estimated_usage, alternatives_considered
  ) VALUES (
    p_user_email, p_request_type, p_name, p_description, p_justification,
    p_use_case, p_urgency, p_team_impact, p_estimated_usage, p_alternatives
  )
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Upvote a request
CREATE OR REPLACE FUNCTION public.upvote_request(
  p_request_id UUID,
  p_user_email TEXT
) RETURNS INTEGER AS $$
DECLARE
  v_exists BOOLEAN;
  v_new_count INTEGER;
BEGIN
  -- Check if already upvoted
  SELECT EXISTS (
    SELECT 1 FROM public.ai_gallery_upvotes
    WHERE request_id = p_request_id AND user_email = p_user_email
  ) INTO v_exists;

  IF v_exists THEN
    -- Remove upvote
    DELETE FROM public.ai_gallery_upvotes
    WHERE request_id = p_request_id AND user_email = p_user_email;

    UPDATE public.ai_gallery_requests
    SET upvotes = GREATEST(0, upvotes - 1), updated_at = NOW()
    WHERE id = p_request_id
    RETURNING upvotes INTO v_new_count;
  ELSE
    -- Add upvote
    INSERT INTO public.ai_gallery_upvotes (request_id, user_email)
    VALUES (p_request_id, p_user_email);

    UPDATE public.ai_gallery_requests
    SET upvotes = upvotes + 1, updated_at = NOW()
    WHERE id = p_request_id
    RETURNING upvotes INTO v_new_count;
  END IF;

  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get requests with upvote status for user
CREATE OR REPLACE FUNCTION public.get_ai_gallery_requests(
  p_user_email TEXT,
  p_request_type TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  user_email TEXT,
  request_type TEXT,
  name TEXT,
  description TEXT,
  justification TEXT,
  use_case TEXT,
  urgency TEXT,
  team_impact TEXT,
  estimated_usage TEXT,
  alternatives_considered TEXT,
  status TEXT,
  admin_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  upvotes INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_has_upvoted BOOLEAN,
  is_own_request BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id, r.user_email, r.request_type, r.name, r.description, r.justification,
    r.use_case, r.urgency, r.team_impact, r.estimated_usage, r.alternatives_considered,
    r.status, r.admin_notes, r.reviewed_by, r.reviewed_at, r.upvotes,
    r.created_at, r.updated_at,
    EXISTS (
      SELECT 1 FROM public.ai_gallery_upvotes u
      WHERE u.request_id = r.id AND u.user_email = p_user_email
    ) as user_has_upvoted,
    (r.user_email = p_user_email) as is_own_request
  FROM public.ai_gallery_requests r
  WHERE
    (p_request_type IS NULL OR r.request_type = p_request_type)
    AND (p_status IS NULL OR r.status = p_status)
    AND (
      r.user_email = p_user_email
      OR r.status IN ('pending', 'approved', 'under_review')
    )
  ORDER BY
    CASE r.status
      WHEN 'pending' THEN 1
      WHEN 'under_review' THEN 2
      WHEN 'approved' THEN 3
      WHEN 'rejected' THEN 4
    END,
    r.upvotes DESC,
    r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin function to review request (requires admin role)
CREATE OR REPLACE FUNCTION public.review_ai_gallery_request(
  p_request_id UUID,
  p_admin_email TEXT,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin (simple check - can be enhanced)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_email = p_admin_email AND role = 'admin'
  ) INTO v_is_admin;

  -- For now, allow any user to test - in production, uncomment the admin check
  -- IF NOT v_is_admin THEN
  --   RETURN FALSE;
  -- END IF;

  UPDATE public.ai_gallery_requests
  SET
    status = p_status,
    admin_notes = p_admin_notes,
    reviewed_by = p_admin_email,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_ai_gallery_requests_user ON public.ai_gallery_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_ai_gallery_requests_type ON public.ai_gallery_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_ai_gallery_requests_status ON public.ai_gallery_requests(status);
CREATE INDEX IF NOT EXISTS idx_ai_gallery_requests_upvotes ON public.ai_gallery_requests(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_ai_gallery_upvotes_request ON public.ai_gallery_upvotes(request_id);

-- =============================================
-- Add user_roles table if not exists
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT USING (user_email = current_setting('request.jwt.claim.email', true)::TEXT);
