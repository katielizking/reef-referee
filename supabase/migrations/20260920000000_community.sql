CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 180),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 10000),
  flair text NOT NULL CHECK (flair IN ('Question','Help','Tank check','Water parameters','Show my tank','Stocking ideas','Species talk','Gear','Shops','Tank ideas','Beginner','Build journal','Discussion')),
  author_handle text NOT NULL,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','hidden','deleted','locked')),
  score integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_posts_feed_idx ON public.community_posts (status, score DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS public.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_handle text NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','hidden','deleted')),
  score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_comments_post_idx ON public.community_comments (post_id, status, score DESC, created_at);

CREATE OR REPLACE FUNCTION public.sync_community_comment_count() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE community_posts SET comment_count = comment_count + 1, updated_at = now() WHERE id = NEW.post_id; RETURN NEW; END IF;
  IF TG_OP = 'DELETE' THEN UPDATE community_posts SET comment_count = GREATEST(comment_count - 1, 0), updated_at = now() WHERE id = OLD.post_id; RETURN OLD; END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS community_comment_count_trigger ON public.community_comments;
CREATE TRIGGER community_comment_count_trigger AFTER INSERT OR DELETE ON public.community_comments FOR EACH ROW EXECUTE FUNCTION public.sync_community_comment_count();

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Community posts are readable" ON public.community_posts FOR SELECT USING (status = 'published' OR user_id = auth.uid());
CREATE POLICY "Users can create their own community posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own community posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Community comments are readable" ON public.community_comments FOR SELECT USING (status = 'published' OR user_id = auth.uid());
CREATE POLICY "Users can create their own community comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own community comments" ON public.community_comments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.community_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.community_comments TO authenticated;
