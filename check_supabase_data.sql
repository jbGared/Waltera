-- Script de vérification des données Supabase pour le tarificateur WALTERA

-- 1. Compter les zones
SELECT
  'zones_sante' as table_name,
  COUNT(*) as total_rows
FROM zones_sante;

-- 2. Compter les zones par type
SELECT
  type_zone,
  COUNT(*) as count
FROM zones_sante
GROUP BY type_zone;

-- 3. Chercher Paris (département 75)
SELECT * FROM zones_sante
WHERE departement = '75';

-- 4. Chercher Eure (département 27)
SELECT * FROM zones_sante
WHERE departement = '27';

-- 5. Lister quelques exemples
SELECT * FROM zones_sante
LIMIT 10;

-- 6. Compter les tarifs
SELECT
  'tarifs_sante' as table_name,
  COUNT(*) as total_rows
FROM tarifs_sante;

-- 7. Vérifier un tarif pour Paris, SANTE_SENIORS
SELECT * FROM tarifs_sante
WHERE gamme = 'SANTE_SENIORS'
  AND zone = 'Z02'
  AND qualite = 'Assuré'
LIMIT 1;
