-- upvotes_rls.sql
-- Enable Row Level Security on upvotes table
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to see upvotes (needed for counting)
CREATE POLICY "Allow select for authenticated users"
ON public.upvotes
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow authenticated users to add their own upvotes
CREATE POLICY "Allow insert for authenticated users"
ON public.upvotes
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Allow authenticated users to delete their own upvotes
CREATE POLICY "Allow delete own upvotes"
ON public.upvotes
FOR DELETE
USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Prevent duplicate upvotes by creating a unique constraint
ALTER TABLE public.upvotes 
ADD CONSTRAINT unique_user_idea_upvote UNIQUE (user_id, idea_id);

-- Index for faster upvote counts per idea
CREATE INDEX IF NOT EXISTS idx_upvotes_idea_id ON public.upvotes (idea_id);

-- Index for faster user upvote checks
CREATE INDEX IF NOT EXISTS idx_upvotes_user_id ON public.upvotes (user_id);
