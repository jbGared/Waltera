-- ============================================================================
-- WALTERA - Table pour les demandes de devis santé
-- ============================================================================
-- Description: Stockage des demandes de devis avec consentement RGPD
-- Date: 2025-12-02
-- Version: 1.0.0
-- ============================================================================

-- ============================================================================
-- TABLE: demandes_devis
-- ============================================================================
-- Purpose: Stores health insurance quote requests with RGPD consent
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.demandes_devis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Informations du client
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  adresse TEXT NOT NULL,
  code_postal TEXT NOT NULL,

  -- Consentement RGPD
  rgpd_consent BOOLEAN NOT NULL DEFAULT false,
  rgpd_consent_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Données du devis
  gamme TEXT NOT NULL CHECK (gamme IN ('SANTE_SENIORS_PLUS', 'SANTE_SENIORS', 'TNS_FORMULES')),
  date_effet DATE NOT NULL,
  option_choisie INTEGER NOT NULL CHECK (option_choisie BETWEEN 1 AND 6),
  surcomplementaire BOOLEAN NOT NULL DEFAULT false,
  renfort_hospi BOOLEAN DEFAULT false,
  commission INTEGER NOT NULL CHECK (commission IN (10, 15, 20)),

  -- Résultat du calcul
  tarif_mensuel DECIMAL(10,2) NOT NULL,
  produit TEXT NOT NULL,
  zone TEXT NOT NULL,

  -- Bénéficiaires (stockés en JSONB pour flexibilité)
  beneficiaires JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Détails du calcul (pour traçabilité)
  details_calcul JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Métadonnées
  statut TEXT DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'en_cours', 'souscrit', 'refuse', 'archive')),
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_demandes_devis_email ON public.demandes_devis(email);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_code_postal ON public.demandes_devis(code_postal);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_gamme ON public.demandes_devis(gamme);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_statut ON public.demandes_devis(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_created_at ON public.demandes_devis(created_at DESC);

-- GIN index for JSONB beneficiaires search
CREATE INDEX IF NOT EXISTS idx_demandes_devis_beneficiaires ON public.demandes_devis USING GIN (beneficiaires);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER set_updated_at_demandes_devis
  BEFORE UPDATE ON public.demandes_devis
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.demandes_devis ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (pour les formulaires publics)
CREATE POLICY "Anyone can insert demande devis"
  ON public.demandes_devis
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can view all (pour l'admin)
CREATE POLICY "Authenticated users can view all demandes"
  ON public.demandes_devis
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can update all (pour l'admin)
CREATE POLICY "Authenticated users can update demandes"
  ON public.demandes_devis
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Authenticated users can delete (pour l'admin)
CREATE POLICY "Authenticated users can delete demandes"
  ON public.demandes_devis
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant access to tables
GRANT SELECT, INSERT ON public.demandes_devis TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demandes_devis TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.demandes_devis IS 'Demandes de devis de complémentaire santé avec consentement RGPD';
COMMENT ON COLUMN public.demandes_devis.rgpd_consent IS 'Consentement explicite du client pour le traitement de ses données';
COMMENT ON COLUMN public.demandes_devis.rgpd_consent_date IS 'Date et heure du consentement RGPD';
COMMENT ON COLUMN public.demandes_devis.beneficiaires IS 'Liste des bénéficiaires du contrat (assuré, conjoint, enfants)';
COMMENT ON COLUMN public.demandes_devis.details_calcul IS 'Détails du calcul tarifaire par bénéficiaire pour traçabilité';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
