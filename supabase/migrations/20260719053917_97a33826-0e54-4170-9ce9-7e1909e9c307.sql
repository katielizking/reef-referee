
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  body_markdown text NOT NULL,
  cover_image_url text,
  author_name text,
  tags text[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published blog posts readable by everyone"
  ON public.blog_posts FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE TABLE public.aquarium_shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  address text,
  suburb text,
  state text,
  postcode text,
  lat numeric,
  lng numeric,
  website text,
  phone text,
  specialties text[] NOT NULL DEFAULT '{}',
  description text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.aquarium_shops TO anon, authenticated;
GRANT ALL ON public.aquarium_shops TO service_role;
ALTER TABLE public.aquarium_shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aquarium shops readable by everyone"
  ON public.aquarium_shops FOR SELECT
  TO anon, authenticated
  USING (true);
