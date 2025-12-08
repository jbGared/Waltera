-- ============================================================================
-- Table CCN - Conventions Collectives Importées/Surveillées par WALTERA
-- ============================================================================
-- Description: Stocke les CCN importées depuis Légifrance et surveillées
-- Date: 2025-12-07
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ccn (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identifiants CCN
  idcc TEXT UNIQUE NOT NULL,
  titre TEXT NOT NULL,
  brochure TEXT,

  -- Statut d'import
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'importing', 'completed', 'error')),
  import_date TIMESTAMPTZ,
  last_sync TIMESTAMPTZ,

  -- Statistiques
  nb_documents INTEGER DEFAULT 0,

  -- Métadonnées d'import
  import_source TEXT DEFAULT 'legifrance',
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_ccn_idcc ON public.ccn(idcc);
CREATE INDEX IF NOT EXISTS idx_ccn_status ON public.ccn(status);
CREATE INDEX IF NOT EXISTS idx_ccn_last_sync ON public.ccn(last_sync DESC);

-- Index de recherche full-text sur le titre
CREATE INDEX IF NOT EXISTS idx_ccn_titre_search ON public.ccn USING gin(to_tsvector('french', titre));

-- Trigger pour auto-update du updated_at
CREATE TRIGGER set_updated_at_ccn
  BEFORE UPDATE ON public.ccn
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.ccn ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated read access" ON public.ccn
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Écriture restreinte aux admins ou service role
CREATE POLICY "Allow admin write access" ON public.ccn
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- FONCTION : Synchroniser les statistiques depuis la table documents
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_ccn_documents_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le nombre de documents pour cette CCN
  UPDATE public.ccn
  SET
    nb_documents = (
      SELECT COUNT(*)
      FROM public.documents
      WHERE metadata->>'idcc' = NEW.idcc
        AND metadata->>'source' = 'legifrance'
    ),
    last_sync = NOW(),
    updated_at = NOW()
  WHERE idcc = NEW.idcc;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur la table documents pour maintenir les stats à jour
-- Note: Ce trigger nécessite que la table 'documents' existe
-- Si elle n'existe pas encore, commentez cette section
/*
CREATE TRIGGER trigger_sync_ccn_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW
  WHEN (NEW.metadata->>'source' = 'legifrance' AND NEW.metadata->>'idcc' IS NOT NULL)
  EXECUTE FUNCTION sync_ccn_documents_count();
*/

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE public.ccn IS 'Conventions collectives importées et surveillées par WALTERA';
COMMENT ON COLUMN public.ccn.idcc IS 'Identifiant de la convention collective (code IDCC)';
COMMENT ON COLUMN public.ccn.titre IS 'Titre complet de la convention collective';
COMMENT ON COLUMN public.ccn.brochure IS 'Numéro de brochure du Journal Officiel';
COMMENT ON COLUMN public.ccn.status IS 'Statut de l''import : pending, importing, completed, error';
COMMENT ON COLUMN public.ccn.import_date IS 'Date du premier import réussi';
COMMENT ON COLUMN public.ccn.last_sync IS 'Date de la dernière synchronisation des documents';
COMMENT ON COLUMN public.ccn.nb_documents IS 'Nombre de documents importés pour cette CCN';
COMMENT ON COLUMN public.ccn.import_source IS 'Source de l''import (legifrance par défaut)';
