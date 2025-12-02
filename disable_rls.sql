-- Désactiver complètement le RLS sur les tables du tarificateur

-- 1. Désactiver RLS sur zones_sante
ALTER TABLE zones_sante DISABLE ROW LEVEL SECURITY;

-- 2. Désactiver RLS sur tarifs_sante
ALTER TABLE tarifs_sante DISABLE ROW LEVEL SECURITY;

-- 3. Vérifier le statut RLS
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('zones_sante', 'tarifs_sante');
