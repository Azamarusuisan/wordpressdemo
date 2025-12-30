-- ============================================
-- Supabase RLS (Row Level Security) Setup
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- ============================================
-- IMPORTANT NOTES:
-- 1. This project uses Prisma with service_role key
--    which BYPASSES RLS for API routes.
-- 2. RLS is mainly for direct Supabase client access
--    and as an additional security layer.
-- 3. Table names match Prisma model names exactly
--    (PascalCase with quotes required)
-- ============================================

-- Enable RLS on all user data tables
ALTER TABLE "Page" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PageSection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GenerationRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InpaintHistory" ENABLE ROW LEVEL SECURITY;

-- GlobalConfig is admin-only, keep RLS disabled or restrict
-- ALTER TABLE "GlobalConfig" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Page Policies
-- ============================================
CREATE POLICY "Users can view their own pages"
ON "Page" FOR SELECT
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create their own pages"
ON "Page" FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own pages"
ON "Page" FOR UPDATE
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete their own pages"
ON "Page" FOR DELETE
USING (auth.uid()::text = "userId");

-- ============================================
-- PageSection Policies (via Page ownership)
-- ============================================
CREATE POLICY "Users can view sections of their pages"
ON "PageSection" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Page"
    WHERE "Page".id = "PageSection"."pageId"
    AND "Page"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can create sections for their pages"
ON "PageSection" FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Page"
    WHERE "Page".id = "PageSection"."pageId"
    AND "Page"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update sections of their pages"
ON "PageSection" FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "Page"
    WHERE "Page".id = "PageSection"."pageId"
    AND "Page"."userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can delete sections of their pages"
ON "PageSection" FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "Page"
    WHERE "Page".id = "PageSection"."pageId"
    AND "Page"."userId" = auth.uid()::text
  )
);

-- ============================================
-- MediaImage Policies
-- ============================================
CREATE POLICY "Users can view their own media"
ON "MediaImage" FOR SELECT
USING (auth.uid()::text = "userId" OR "userId" IS NULL);

CREATE POLICY "Users can create their own media"
ON "MediaImage" FOR INSERT
WITH CHECK (auth.uid()::text = "userId" OR "userId" IS NULL);

CREATE POLICY "Users can update their own media"
ON "MediaImage" FOR UPDATE
USING (auth.uid()::text = "userId" OR "userId" IS NULL);

CREATE POLICY "Users can delete their own media"
ON "MediaImage" FOR DELETE
USING (auth.uid()::text = "userId");

-- ============================================
-- GenerationRun Policies (API Usage Logs)
-- ============================================
CREATE POLICY "Users can view their own generation logs"
ON "GenerationRun" FOR SELECT
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create generation logs"
ON "GenerationRun" FOR INSERT
WITH CHECK (auth.uid()::text = "userId" OR "userId" IS NULL);

-- ============================================
-- UserSettings Policies
-- ============================================
CREATE POLICY "Users can view their own settings"
ON "UserSettings" FOR SELECT
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create their own settings"
ON "UserSettings" FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own settings"
ON "UserSettings" FOR UPDATE
USING (auth.uid()::text = "userId");

-- ============================================
-- InpaintHistory Policies
-- ============================================
CREATE POLICY "Users can view their own inpaint history"
ON "InpaintHistory" FOR SELECT
USING (auth.uid()::text = "userId" OR "userId" IS NULL);

CREATE POLICY "Users can create inpaint history"
ON "InpaintHistory" FOR INSERT
WITH CHECK (auth.uid()::text = "userId" OR "userId" IS NULL);

-- ============================================
-- Public Page Access (for /p/[slug] routes)
-- ============================================
-- Allow public read access to published pages
CREATE POLICY "Anyone can view published pages"
ON "Page" FOR SELECT
USING ("status" = 'published');

CREATE POLICY "Anyone can view sections of published pages"
ON "PageSection" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Page"
    WHERE "Page".id = "PageSection"."pageId"
    AND "Page"."status" = 'published'
  )
);

-- Allow public read access to images used in published pages
CREATE POLICY "Anyone can view images of published pages"
ON "MediaImage" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "PageSection"
    JOIN "Page" ON "Page".id = "PageSection"."pageId"
    WHERE "PageSection"."imageId" = "MediaImage".id
    AND "Page"."status" = 'published'
  )
);

-- ============================================
-- Service Role Bypass (for API routes)
-- ============================================
-- Note: API routes using Prisma with DATABASE_URL (service_role)
-- bypass RLS automatically. This is the intended behavior.
-- RLS policies are a secondary security layer.

-- ============================================
-- How to Apply:
-- ============================================
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
-- 4. Check for any errors
--
-- To verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--
-- To list all policies:
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
