-- Table de correspondance entre dossiers NAS et clients/IDCC
-- Drop existing table if needed for clean migration
DROP TABLE IF EXISTS nas_client_mapping CASCADE;

CREATE TABLE nas_client_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Informations du dossier NAS
  folder_name TEXT UNIQUE NOT NULL,

  -- Informations client
  client_name TEXT,
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- IDCC associés (peut être multiple)
  idcc TEXT[],

  -- Catégorie du dossier
  category TEXT CHECK (category IN ('Clients', 'Prospects', 'Partenaires', 'Résiliations')),

  -- Statut du mapping
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'mapped', 'ignored')),

  -- Notes optionnelles
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  mapped_at TIMESTAMPTZ,
  mapped_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Index pour recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_nas_mapping_status ON nas_client_mapping(status);
CREATE INDEX IF NOT EXISTS idx_nas_mapping_category ON nas_client_mapping(category);
CREATE INDEX IF NOT EXISTS idx_nas_mapping_folder ON nas_client_mapping(folder_name);
CREATE INDEX IF NOT EXISTS idx_nas_mapping_client ON nas_client_mapping(client_name);

-- Index GIN pour recherche dans le tableau IDCC
CREATE INDEX IF NOT EXISTS idx_nas_mapping_idcc ON nas_client_mapping USING GIN(idcc);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_nas_mapping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_nas_mapping_timestamp
  BEFORE UPDATE ON nas_client_mapping
  FOR EACH ROW
  EXECUTE FUNCTION update_nas_mapping_updated_at();

-- Trigger pour mettre à jour mapped_at quand status devient 'mapped'
CREATE OR REPLACE FUNCTION update_nas_mapping_mapped_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'mapped' AND (OLD.status IS NULL OR OLD.status != 'mapped') THEN
    NEW.mapped_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_nas_mapping_mapped_timestamp
  BEFORE UPDATE ON nas_client_mapping
  FOR EACH ROW
  EXECUTE FUNCTION update_nas_mapping_mapped_at();

-- RLS : Lecture pour tous les utilisateurs authentifiés
ALTER TABLE nas_client_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access" ON nas_client_mapping
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Écriture pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated write access" ON nas_client_mapping
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Table de référence des IDCC
DROP TABLE IF EXISTS idcc_ref CASCADE;

CREATE TABLE idcc_ref (
  idcc TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index sur idcc_ref
CREATE INDEX IF NOT EXISTS idx_idcc_ref_active ON idcc_ref(active);

-- RLS pour idcc_ref
ALTER TABLE idcc_ref ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON idcc_ref
  FOR SELECT
  USING (true);

CREATE POLICY "Allow service role write access" ON idcc_ref
  FOR ALL
  USING (auth.role() = 'service_role');

-- Données initiales pour idcc_ref
-- Si ccn_referentiel existe, on importe depuis cette table
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ccn_referentiel') THEN
    INSERT INTO idcc_ref (idcc, label)
    SELECT idcc, titre
    FROM ccn_referentiel
    WHERE active = true
    ON CONFLICT (idcc) DO UPDATE SET label = EXCLUDED.label;
  ELSE
    -- Sinon, on insère les CCN les plus courantes manuellement
    INSERT INTO idcc_ref (idcc, label) VALUES
      ('1486', 'Bureaux d''études techniques, cabinets d''ingénieurs-conseils et sociétés de conseils (Syntec)'),
      ('2120', 'Banque'),
      ('3127', 'Entreprises de services à la personne'),
      ('1516', 'Organismes de formation'),
      ('1996', 'Pharmacie d''officine'),
      ('2264', 'Hospitalisation privée à but lucratif'),
      ('1147', 'Personnel des cabinets médicaux'),
      ('3043', 'Entreprises de propreté et services associés'),
      ('1501', 'Restauration rapide'),
      ('2941', 'Aide, accompagnement, soins et services à domicile'),
      ('1090', 'Services de l''automobile (commerce et réparation)'),
      ('0044', 'Industries chimiques et connexes'),
      ('0573', 'Commerces de gros'),
      ('1979', 'Hôtels, cafés, restaurants (HCR)'),
      ('0016', 'Transports routiers et activités auxiliaires du transport')
    ON CONFLICT (idcc) DO NOTHING;
  END IF;
END $$;

-- Vue pour avoir une vue d'ensemble des mappings
CREATE OR REPLACE VIEW v_nas_mapping_summary AS
SELECT
  status,
  category,
  COUNT(*) as count,
  COUNT(DISTINCT client_name) as unique_clients,
  ARRAY_AGG(DISTINCT idcc_item) FILTER (WHERE idcc_item IS NOT NULL) as all_idcc
FROM nas_client_mapping
LEFT JOIN LATERAL unnest(idcc) AS idcc_item ON true
GROUP BY status, category;

COMMENT ON TABLE nas_client_mapping IS 'Correspondance entre dossiers NAS et clients avec leurs IDCC';
COMMENT ON COLUMN nas_client_mapping.folder_name IS 'Nom du dossier sur le NAS (unique)';
COMMENT ON COLUMN nas_client_mapping.client_name IS 'Nom du client associé';
COMMENT ON COLUMN nas_client_mapping.client_id IS 'ID du client dans la table profiles (optionnel)';
COMMENT ON COLUMN nas_client_mapping.idcc IS 'Liste des codes IDCC (conventions collectives) associés';
COMMENT ON COLUMN nas_client_mapping.category IS 'Catégorie du dossier : Clients, Prospects, Partenaires, Résiliations';
COMMENT ON COLUMN nas_client_mapping.status IS 'Statut du mapping : pending (en attente), mapped (mappé), ignored (ignoré)';
COMMENT ON COLUMN nas_client_mapping.notes IS 'Notes libres pour le mapping';
COMMENT ON COLUMN nas_client_mapping.mapped_at IS 'Date à laquelle le statut est passé à mapped';
COMMENT ON COLUMN nas_client_mapping.mapped_by IS 'Utilisateur ayant effectué le mapping';
