-- Configuration RLS pour les tables du tarificateur WALTERA

-- 1. Activer RLS sur zones_sante
ALTER TABLE zones_sante ENABLE ROW LEVEL SECURITY;

-- 2. Créer une policy pour permettre la lecture publique des zones
DROP POLICY IF EXISTS "Allow public read access to zones" ON zones_sante;
CREATE POLICY "Allow public read access to zones"
ON zones_sante
FOR SELECT
USING (true);

-- 3. Activer RLS sur tarifs_sante
ALTER TABLE tarifs_sante ENABLE ROW LEVEL SECURITY;

-- 4. Créer une policy pour permettre la lecture publique des tarifs
DROP POLICY IF EXISTS "Allow public read access to tarifs" ON tarifs_sante;
CREATE POLICY "Allow public read access to tarifs"
ON tarifs_sante
FOR SELECT
USING (true);

-- 5. Vérifier les policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('zones_sante', 'tarifs_sante');
