-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ai_key_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  provider text NOT NULL,
  uses_remaining integer NOT NULL DEFAULT 10,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_key_usage_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ai_user_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  provider text NOT NULL,
  encrypted_key text NOT NULL,
  uses_remaining integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_user_keys_pkey PRIMARY KEY (id)
);
CREATE TABLE public.bans (
  id integer NOT NULL DEFAULT nextval('bans_id_seq'::regclass),
  user_id uuid,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  CONSTRAINT bans_pkey PRIMARY KEY (id),
  CONSTRAINT bans_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.comments (
  id integer NOT NULL DEFAULT nextval('comments_id_seq'::regclass),
  idea_id bigint,
  user_id uuid,
  text text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_idea_id_fkey FOREIGN KEY (idea_id) REFERENCES public.ideas(id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.events (
  id integer NOT NULL DEFAULT nextval('events_id_seq'::regclass),
  user_id uuid,
  event_type text NOT NULL,
  data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.favorites (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  idea_id bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT favorites_idea_id_fkey FOREIGN KEY (idea_id) REFERENCES public.ideas(id)
);
CREATE TABLE public.ideas (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  tags ARRAY,
  title text,
  summary text,
  icon text,
  details text,
  user_id uuid,
  generated_by_ai boolean DEFAULT false,
  CONSTRAINT ideas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pitch_deck (
  id integer NOT NULL DEFAULT nextval('pitch_deck_id_seq'::regclass),
  idea_id bigint,
  slides jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT pitch_deck_pkey PRIMARY KEY (id),
  CONSTRAINT pitch_deck_idea_id_fkey FOREIGN KEY (idea_id) REFERENCES public.ideas(id),
  CONSTRAINT pitch_deck_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.plans (
  id integer NOT NULL DEFAULT nextval('plans_id_seq'::regclass),
  name text NOT NULL,
  features jsonb,
  price numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  plan text DEFAULT 'free'::text,
  subscription_id text,
  is_premium boolean DEFAULT false,
  role text DEFAULT 'user'::text,
  bio text,
  avatar_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.reports (
  id integer NOT NULL DEFAULT nextval('reports_id_seq'::regclass),
  reported_by uuid,
  idea_id bigint,
  reason text,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES auth.users(id),
  CONSTRAINT reports_idea_id_fkey FOREIGN KEY (idea_id) REFERENCES public.ideas(id)
);
CREATE TABLE public.upvotes (
  id integer NOT NULL DEFAULT nextval('upvotes_id_seq'::regclass),
  idea_id bigint,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT upvotes_pkey PRIMARY KEY (id),
  CONSTRAINT upvotes_idea_id_fkey FOREIGN KEY (idea_id) REFERENCES public.ideas(id),
  CONSTRAINT upvotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);