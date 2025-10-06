-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create enum types
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE public.query_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'paused');
CREATE TYPE public.enrichment_status AS ENUM ('pending', 'in_progress', 'enriched', 'failed');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'in_progress', 'paused', 'completed', 'cancelled');
CREATE TYPE public.send_status AS ENUM ('queued', 'sending', 'sent', 'failed', 'bounced', 'opened', 'clicked');
CREATE TYPE public.social_platform AS ENUM ('instagram', 'facebook', 'youtube', 'blog', 'linkedin');
CREATE TYPE public.task_status AS ENUM ('pending', 'claimed', 'processing', 'completed', 'failed', 'retry');
CREATE TYPE public.task_type AS ENUM ('fetch_google_page', 'apify_enrich', 'send_email', 'generate_social');

-- Accounts table (tenant root)
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'member',
  email CITEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- Company Banners table
CREATE TABLE public.company_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_audience TEXT,
  value_proposition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- API Keys table (encrypted storage)
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  key_name TEXT,
  encrypted_key_ciphertext TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- SMTP Credentials table
CREATE TABLE public.smtp_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL,
  smtp_username TEXT NOT NULL,
  encrypted_password_ciphertext TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 100,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create indexes
CREATE INDEX idx_users_account_id ON public.users(account_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_companies_account_id ON public.companies(account_id);
CREATE INDEX idx_company_banners_company_id ON public.company_banners(company_id);
CREATE INDEX idx_company_banners_account_id ON public.company_banners(account_id);
CREATE INDEX idx_api_keys_account_id ON public.api_keys(account_id);
CREATE INDEX idx_smtp_credentials_account_id ON public.smtp_credentials(account_id);

-- Enable Row Level Security
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smtp_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts
CREATE POLICY "Users can view their own account"
  ON public.accounts FOR SELECT
  USING (id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own account"
  ON public.accounts FOR UPDATE
  USING (id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

-- RLS Policies for users
CREATE POLICY "Users can view users in their account"
  ON public.users FOR SELECT
  USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can view their own user record"
  ON public.users FOR SELECT
  USING (id = auth.uid());

-- RLS Policies for companies
CREATE POLICY "Users can view companies in their account"
  ON public.companies FOR SELECT
  USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can create companies in their account"
  ON public.companies FOR INSERT
  WITH CHECK (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update companies in their account"
  ON public.companies FOR UPDATE
  USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete companies in their account"
  ON public.companies FOR DELETE
  USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

-- RLS Policies for company_banners
CREATE POLICY "Users can view banners in their account"
  ON public.company_banners FOR SELECT
  USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can create banners in their account"
  ON public.company_banners FOR INSERT
  WITH CHECK (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update banners in their account"
  ON public.company_banners FOR UPDATE
  USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete banners in their account"
  ON public.company_banners FOR DELETE
  USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

-- RLS Policies for api_keys
CREATE POLICY "Users can view API keys in their account"
  ON public.api_keys FOR SELECT
  USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can create API keys in their account"
  ON public.api_keys FOR INSERT
  WITH CHECK (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update API keys in their account"
  ON public.api_keys FOR UPDATE
  USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete API keys in their account"
  ON public.api_keys FOR DELETE
  USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

-- RLS Policies for smtp_credentials
CREATE POLICY "Users can view SMTP credentials in their account"
  ON public.smtp_credentials FOR SELECT
  USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can create SMTP credentials in their account"
  ON public.smtp_credentials FOR INSERT
  WITH CHECK (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update SMTP credentials in their account"
  ON public.smtp_credentials FOR UPDATE
  USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete SMTP credentials in their account"
  ON public.smtp_credentials FOR DELETE
  USING (account_id IN (SELECT account_id FROM public.users WHERE id = auth.uid()));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_account_id UUID;
BEGIN
  -- Create a new account for this user
  INSERT INTO public.accounts (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  RETURNING id INTO new_account_id;
  
  -- Create user record
  INSERT INTO public.users (id, account_id, email, full_name, role)
  VALUES (
    NEW.id,
    new_account_id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'owner'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to create user record on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add update triggers
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_company_banners_updated_at BEFORE UPDATE ON public.company_banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_smtp_credentials_updated_at BEFORE UPDATE ON public.smtp_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();