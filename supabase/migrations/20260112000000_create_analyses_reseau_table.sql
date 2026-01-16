-- Migration: Création de la table pour l'historique des analyses réseau
-- Description: Stocke l'historique des analyses de réseau de fichiers avec les crédits consommés

-- Table des analyses réseau
CREATE TABLE IF NOT EXISTS public.analyses_reseau (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifiant de génération Gamma
  generation_id TEXT NOT NULL UNIQUE,

  -- Statut de l'analyse
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),

  -- URLs générées
  gamma_url TEXT,
  export_url TEXT,

  -- Crédits
  credits_deducted INTEGER NOT NULL DEFAULT 0,
  credits_remaining INTEGER,

  -- Métadonnées de la requête
  request_data JSONB,

  -- Métadonnées de la réponse complète
  response_data JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Métadonnées supplémentaires
  error_message TEXT,
  metadata JSONB
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_analyses_reseau_status ON public.analyses_reseau(status);
CREATE INDEX IF NOT EXISTS idx_analyses_reseau_created_at ON public.analyses_reseau(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_reseau_generation_id ON public.analyses_reseau(generation_id);

-- RLS (Row Level Security)
ALTER TABLE public.analyses_reseau ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire (crédits globaux)
CREATE POLICY "Allow public read access"
  ON public.analyses_reseau
  FOR SELECT
  TO public
  USING (true);

-- Policy: Seuls les utilisateurs authentifiés peuvent créer
CREATE POLICY "Allow authenticated insert"
  ON public.analyses_reseau
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Seuls les utilisateurs authentifiés peuvent mettre à jour
CREATE POLICY "Allow authenticated update"
  ON public.analyses_reseau
  FOR UPDATE
  TO authenticated
  USING (true);

-- Commentaires pour la documentation
COMMENT ON TABLE public.analyses_reseau IS 'Historique des analyses de réseau de fichiers avec tracking des crédits Gamma';
COMMENT ON COLUMN public.analyses_reseau.generation_id IS 'ID unique de génération fourni par Gamma';
COMMENT ON COLUMN public.analyses_reseau.status IS 'Statut: pending, running, completed, failed';
COMMENT ON COLUMN public.analyses_reseau.gamma_url IS 'URL de la présentation Gamma interactive';
COMMENT ON COLUMN public.analyses_reseau.export_url IS 'URL du PDF exporté';
COMMENT ON COLUMN public.analyses_reseau.credits_deducted IS 'Nombre de crédits déduits pour cette analyse';
COMMENT ON COLUMN public.analyses_reseau.credits_remaining IS 'Crédits restants après cette analyse';
COMMENT ON COLUMN public.analyses_reseau.request_data IS 'Données de la requête initiale (JSONB)';
COMMENT ON COLUMN public.analyses_reseau.response_data IS 'Réponse complète du webhook (JSONB)';
