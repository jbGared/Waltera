# Guide Technique Supabase - WALTERA

## Configuration Supabase

### Informations du projet

- **URL** : `https://xxxxx.supabase.co`
- **Clé anonyme** : Pour les requêtes client (lecture seule)
- **Clé service** : Pour l'administration (ne jamais exposer côté client)

### Variables d'environnement

```env
# .env (committé dans le repo - clé publique uniquement)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# .env.local (NON committé - pour développement)
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Schéma de base de données

### Table `tarifs_sante`

Contient tous les tarifs des produits santé (5 868 lignes).

```sql
CREATE TABLE tarifs_sante (
  id SERIAL PRIMARY KEY,

  -- Identification du produit
  gamme TEXT NOT NULL,        -- 'SANTE_SENIORS_PLUS', 'SANTE_SENIORS', 'TNS_FORMULES'
  produit TEXT NOT NULL,      -- Ex: 'SANTE SENIOR PLUS 12191'
  zone TEXT NOT NULL,         -- 'Z01', 'Z02', 'AM' (SENIORS) ou 'Z01'-'Z05' (TNS)

  -- Profil du bénéficiaire
  qualite TEXT NOT NULL,      -- 'Assuré', 'Conjoint', 'Enfant', 'Assuré seul'
  age TEXT NOT NULL,          -- '0-59', '60', '61', '100+', etc.

  -- Tarifs de base (6 options)
  option1 DECIMAL(10,2),
  option2 DECIMAL(10,2),
  option3 DECIMAL(10,2),
  option4 DECIMAL(10,2),
  option5 DECIMAL(10,2),
  option6 DECIMAL(10,2),

  -- Surcomplémentaire (options 3 à 6)
  surco_option3 DECIMAL(10,2),
  surco_option4 DECIMAL(10,2),
  surco_option5 DECIMAL(10,2),
  surco_option6 DECIMAL(10,2),

  -- Renfort hospitalisation (SANTE_SENIORS_PLUS uniquement)
  renfort_hospi DECIMAL(10,2)
);
```

#### Index recommandés

```sql
-- Index composite pour lookup rapide
CREATE INDEX idx_tarifs_lookup
ON tarifs_sante(gamme, produit, zone, qualite, age);

-- Index par gamme (pour analyses)
CREATE INDEX idx_tarifs_gamme ON tarifs_sante(gamme);
```

#### Contraintes métier

```sql
-- Vérification des valeurs de gamme
ALTER TABLE tarifs_sante
ADD CONSTRAINT check_gamme
CHECK (gamme IN ('SANTE_SENIORS_PLUS', 'SANTE_SENIORS', 'TNS_FORMULES'));

-- Vérification des valeurs de qualité
ALTER TABLE tarifs_sante
ADD CONSTRAINT check_qualite
CHECK (qualite IN ('Assuré', 'Conjoint', 'Enfant', 'Assuré seul'));
```

---

### Table `zones_sante`

Mapping entre départements et zones tarifaires (199 lignes).

```sql
CREATE TABLE zones_sante (
  id SERIAL PRIMARY KEY,

  -- Type de produit
  type_zone TEXT NOT NULL,    -- 'SENIORS' ou 'TNS'

  -- Zone et département
  code_zone TEXT NOT NULL,    -- 'Z01', 'Z02', 'AM', etc.
  departement TEXT NOT NULL   -- '01', '02', '75', '2A', '2B', etc.
);
```

#### Index recommandés

```sql
-- Index pour lookup rapide par département
CREATE INDEX idx_zones_lookup
ON zones_sante(type_zone, departement);

-- Index unique pour éviter les doublons
CREATE UNIQUE INDEX idx_zones_unique
ON zones_sante(type_zone, departement);
```

#### Exemple de données

| type_zone | code_zone | departement |
|-----------|-----------|-------------|
| SENIORS   | Z01       | 01          |
| SENIORS   | Z02       | 75          |
| SENIORS   | AM        | 67          |
| TNS       | Z03       | 69          |

---

## Row Level Security (RLS)

### Configuration actuelle

```sql
-- Activer RLS sur les tables
ALTER TABLE tarifs_sante ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones_sante ENABLE ROW LEVEL SECURITY;

-- Politique : lecture publique
CREATE POLICY "Allow public read access" ON tarifs_sante
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access" ON zones_sante
  FOR SELECT
  USING (true);

-- Politique : écriture restreinte (service role uniquement)
CREATE POLICY "Allow service role write access" ON tarifs_sante
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role write access" ON zones_sante
  FOR ALL
  USING (auth.role() = 'service_role');
```

### Vérification RLS

```sql
-- Tester en tant qu'utilisateur anonyme
SELECT COUNT(*) FROM tarifs_sante;  -- Devrait fonctionner

-- Tester l'insertion (devrait échouer avec anon key)
INSERT INTO tarifs_sante (gamme, produit, zone, qualite, age, option1)
VALUES ('TEST', 'TEST', 'TEST', 'TEST', 'TEST', 100.00);  -- Erreur attendue
```

---

## Requêtes courantes

### 1. Recherche de zone par code postal

```sql
-- Exemple : code postal 75001 → département 75
SELECT code_zone
FROM zones_sante
WHERE type_zone = 'SENIORS'
  AND departement = '75';

-- Résultat : Z02
```

**Code TypeScript correspondant :**

```typescript
async function getZone(codePostal: string, gamme: string): Promise<string | null> {
  const dept = codePostal.substring(0, 2);
  const typeZone = gamme === 'TNS_FORMULES' ? 'TNS' : 'SENIORS';

  const { data, error } = await supabase
    .from('zones_sante')
    .select('code_zone')
    .eq('type_zone', typeZone)
    .eq('departement', dept)
    .single();

  if (error) {
    console.error('Erreur zone:', error);
    return null;
  }

  return data.code_zone;
}
```

---

### 2. Recherche de tarif pour un bénéficiaire

```sql
-- Exemple : Senior 66 ans, Paris, option 4
SELECT *
FROM tarifs_sante
WHERE gamme = 'SANTE_SENIORS'
  AND produit = 'SANTE SENIOR 12141 RESPONSABLE'
  AND zone = 'Z02'
  AND qualite = 'Assuré'
  AND age = '66';
```

**Code TypeScript correspondant :**

```typescript
async function getTarif(
  gamme: string,
  produit: string,
  zone: string,
  qualite: string,
  age: string
) {
  const { data, error } = await supabase
    .from('tarifs_sante')
    .select('*')
    .eq('gamme', gamme)
    .eq('produit', produit)
    .eq('zone', zone)
    .eq('qualite', qualite)
    .eq('age', age)
    .single();

  if (error) {
    console.error('Erreur tarif:', error);
    return null;
  }

  return data;
}
```

---

### 3. Requête optimisée pour plusieurs bénéficiaires

```sql
-- Récupérer tous les tarifs d'une famille en une requête
SELECT *
FROM tarifs_sante
WHERE gamme = 'TNS_FORMULES'
  AND produit = 'CONTRASSUR TNS 12282 RESPONSABLE'
  AND zone = 'Z03'
  AND qualite IN ('Assuré', 'Conjoint', 'Enfant')
  AND age IN ('41', '39', '0-19');
```

**Code TypeScript correspondant :**

```typescript
async function getTarifsMultiples(
  gamme: string,
  produit: string,
  zone: string,
  qualites: string[],
  ages: string[]
) {
  const { data, error } = await supabase
    .from('tarifs_sante')
    .select('*')
    .eq('gamme', gamme)
    .eq('produit', produit)
    .eq('zone', zone)
    .in('qualite', qualites)
    .in('age', ages);

  if (error) {
    console.error('Erreur tarifs:', error);
    return null;
  }

  return data;
}
```

---

## Administration

### Import de données

```bash
# Via Supabase Dashboard
1. Aller dans Table Editor
2. Cliquer sur "Insert" > "Import data from CSV"
3. Sélectionner le fichier CSV
4. Mapper les colonnes
5. Importer

# Via SQL
psql -h db.xxxxx.supabase.co -U postgres -d postgres
\COPY tarifs_sante FROM 'tarifs.csv' WITH CSV HEADER;
```

### Export de données

```sql
-- Export CSV via Supabase CLI
supabase db dump -f tarifs_sante.sql --table tarifs_sante

-- Export CSV via psql
\COPY tarifs_sante TO 'tarifs_export.csv' WITH CSV HEADER;
```

### Backup

```bash
# Backup complet de la base
supabase db dump -f backup_$(date +%Y%m%d).sql

# Restauration
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f backup_20241207.sql
```

---

## Statistiques et analyses

### Requêtes d'analyse

```sql
-- Nombre de tarifs par gamme
SELECT gamme, COUNT(*)
FROM tarifs_sante
GROUP BY gamme;

-- Tarif moyen par option
SELECT
  'option1' as option, AVG(option1) as moyenne
FROM tarifs_sante
UNION ALL
SELECT 'option2', AVG(option2) FROM tarifs_sante
UNION ALL
SELECT 'option3', AVG(option3) FROM tarifs_sante;

-- Départements couverts
SELECT type_zone, COUNT(DISTINCT departement) as nb_depts
FROM zones_sante
GROUP BY type_zone;
```

---

## Performances

### Monitoring

```sql
-- Voir les requêtes lentes (via Supabase Dashboard)
-- Settings > Database > Query performance

-- Taille de la table
SELECT
  pg_size_pretty(pg_total_relation_size('tarifs_sante')) as size;

-- Utilisation des index
SELECT
  schemaname, tablename, indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE tablename IN ('tarifs_sante', 'zones_sante')
ORDER BY idx_scan DESC;
```

### Optimisations

1. **Index** : Créer des index sur les colonnes fréquemment requêtées
2. **Limit** : Toujours utiliser `.single()` ou `.limit()` pour éviter de récupérer trop de données
3. **Select** : Ne sélectionner que les colonnes nécessaires avec `.select('col1, col2')`
4. **Cache** : Mettre en cache les résultats de `zones_sante` (rarement modifiées)

---

## Types TypeScript

### Types générés automatiquement

```bash
# Générer les types depuis Supabase
npx supabase gen types typescript --project-id xxxxx > src/lib/types/supabase.ts
```

### Types métier

```typescript
// src/lib/types/tarificateur.ts
export interface TarifRow {
  id: number;
  gamme: string;
  produit: string;
  zone: string;
  qualite: string;
  age: string;
  option1: number | null;
  option2: number | null;
  option3: number | null;
  option4: number | null;
  option5: number | null;
  option6: number | null;
  surco_option3: number | null;
  surco_option4: number | null;
  surco_option5: number | null;
  surco_option6: number | null;
  renfort_hospi: number | null;
}

export interface ZoneRow {
  id: number;
  type_zone: string;
  code_zone: string;
  departement: string;
}
```

---

## Troubleshooting

### Erreur : "Row Level Security is enabled"

**Problème** : La requête échoue même avec la clé anonyme.

**Solution** : Vérifier que la politique RLS autorise bien les SELECT :

```sql
SELECT * FROM pg_policies WHERE tablename = 'tarifs_sante';
```

---

### Erreur : "No rows found"

**Problème** : `.single()` ne trouve aucune ligne.

**Solution** : Vérifier les filtres et utiliser `.maybeSingle()` si le résultat peut être vide :

```typescript
const { data, error } = await supabase
  .from('tarifs_sante')
  .select('*')
  .eq('gamme', gamme)
  .maybeSingle();  // Retourne null si pas de résultat
```

---

### Performances lentes

**Problème** : Les requêtes prennent plus de 1 seconde.

**Solution** : Vérifier les index et utiliser EXPLAIN ANALYZE :

```sql
EXPLAIN ANALYZE
SELECT * FROM tarifs_sante
WHERE gamme = 'SANTE_SENIORS' AND zone = 'Z02' AND age = '66';
```

---

**Version** : 1.0
**Date** : Décembre 2025
