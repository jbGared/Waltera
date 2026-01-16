#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://syxsacbciqwrahjdixuc.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eHNhY2JjaXF3cmFoamRpeHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA0NTc3OSwiZXhwIjoyMDczNjIxNzc5fQ.2_3iBqTlgwrTmeDLPU8NscvfLZIsCJ7aZnY8ltof5_4';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔄 Exécution de la migration profiles...\n');

async function executeMigration() {
  try {
    // 1. Supprimer l'ancienne table
    console.log('1️⃣ Suppression de l\'ancienne table profiles...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS public.profiles CASCADE;'
    });

    if (dropError && !dropError.message.includes('does not exist')) {
      console.log('⚠️  Fonction RPC non disponible, la table sera écrasée à la création');
    } else {
      console.log('✅ Table supprimée (ou n\'existait pas)');
    }

    // 2. Créer la table via l'API
    console.log('\n2️⃣ Création de la table profiles via API REST...');

    // Comme Supabase ne permet pas d'exécuter du DDL via l'API REST,
    // on doit le faire via le Dashboard
    console.log('\n📝 VEUILLEZ EXÉCUTER CE SQL DANS SUPABASE DASHBOARD :');
    console.log('='  .repeat(80));

    const sqlCommands = `
-- Supprimer l'ancienne table
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Créer la table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Trigger auto-création profil
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role, is_admin)
  VALUES (
    NEW.id, NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'role',
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false)
  );
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);
`.trim();

    console.log(sqlCommands);
    console.log('='  .repeat(80));

    console.log('\n📋 ÉTAPES :');
    console.log('1. Copiez le SQL ci-dessus');
    console.log('2. Ouvrez https://syxsacbciqwrahjdixuc.supabase.co');
    console.log('3. SQL Editor → New Query');
    console.log('4. Collez et cliquez Run');
    console.log('\n✅ Une fois fait, le frontend utilisera automatiquement la table profiles !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

executeMigration();
