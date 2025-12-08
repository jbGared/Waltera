# Migrations Supabase - WALTERA

## Guide d'exécution des migrations

### Prérequis

- Accès au tableau de bord Supabase : https://supabase.com/dashboard
- Ou bien Supabase CLI installée : `npm install -g supabase`

---

## Ordre d'exécution des migrations

Les migrations peuvent être exécutées dans n'importe quel ordre car elles sont autonomes :

1. **`create_ccn_referentiel.sql`** (optionnel) - Référentiel des CCN
2. **`create_nas_client_mapping.sql`** - Mapping NAS/Clients/IDCC

> **Note** : Si `ccn_referentiel` existe, `nas_client_mapping` importera automatiquement les IDCC depuis cette table. Sinon, elle créera une liste réduite des CCN les plus courantes.

---

## Migration 1 : Référentiel des CCN (Optionnel)

### Fichier
`migrations/create_ccn_referentiel.sql`

### Description
Crée la table `ccn_referentiel` qui contient le référentiel des conventions collectives nationales françaises disponibles pour l'import.

### Contenu
- Table `ccn_referentiel` avec colonnes :
  - `idcc` : Code IDCC (clé primaire)
  - `titre` : Titre de la convention collective
  - `brochure` : Numéro de brochure JO
  - `active` : Indique si la CCN est active
  - `created_at`, `updated_at` : Timestamps

- Index pour la recherche full-text sur le titre
- Row Level Security (RLS) : lecture publique, écriture service role
- Données initiales : 60+ CCN les plus courantes

### Exécution via Dashboard Supabase

1. Se connecter à https://supabase.com/dashboard
2. Sélectionner le projet WALTERA
3. Aller dans **SQL Editor**
4. Créer une nouvelle query
5. Copier-coller le contenu du fichier `migrations/create_ccn_referentiel.sql`
6. Cliquer sur **Run** (ou Ctrl+Enter)
7. Vérifier le succès dans la console

### Exécution via CLI

```bash
# Depuis la racine du projet
supabase db push

# Ou exécuter manuellement
supabase db execute -f supabase/migrations/create_ccn_referentiel.sql
```

### Vérification

```sql
-- Vérifier que la table existe
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'ccn_referentiel';

-- Compter les CCN insérées
SELECT COUNT(*) FROM ccn_referentiel;
-- Résultat attendu : 60+

-- Afficher quelques CCN
SELECT idcc, titre
FROM ccn_referentiel
ORDER BY idcc
LIMIT 10;
```

### Rollback (si nécessaire)

```sql
-- Supprimer la table
DROP TABLE IF EXISTS ccn_referentiel CASCADE;
```

---

## Notes importantes

### Row Level Security (RLS)

La table `ccn_referentiel` a les politiques suivantes :
- **Lecture** : Tous les utilisateurs (authentifiés ou non)
- **Écriture** : Service role uniquement

Pour modifier les données, utiliser une clé service role ou le SQL Editor du dashboard.

### Ajout de nouvelles CCN

```sql
INSERT INTO ccn_referentiel (idcc, titre, brochure, active)
VALUES ('XXXX', 'Titre de la convention', 'YYYY', true);
```

### Désactivation d'une CCN

```sql
UPDATE ccn_referentiel
SET active = false
WHERE idcc = 'XXXX';
```

---

## Maintenance

### Mise à jour des données

Pour ajouter de nouvelles CCN au référentiel, créer une nouvelle migration :

```bash
# Créer un nouveau fichier de migration
supabase/migrations/YYYYMMDDHHMMSS_add_more_ccn.sql
```

Contenu du fichier :
```sql
INSERT INTO ccn_referentiel (idcc, titre, brochure) VALUES
  ('XXXX', 'Nouvelle CCN', 'YYYY')
ON CONFLICT (idcc) DO NOTHING;
```

### Sauvegarde

```bash
# Export de la table
supabase db dump -f backup_ccn_referentiel.sql --table ccn_referentiel
```

---

## Troubleshooting

### Erreur : "relation ccn_referentiel already exists"

La table existe déjà. Soit :
1. Supprimer la table et relancer la migration
2. Ou modifier la migration pour utiliser `CREATE TABLE IF NOT EXISTS`

### Erreur : "permission denied"

Vérifier que vous utilisez une clé avec les bonnes permissions (service_role) ou exécutez via le SQL Editor du dashboard Supabase.

### Aucune donnée insérée

Vérifier les logs d'erreur. Peut-être une contrainte de clé primaire (IDCC en doublon).

```sql
-- Vérifier les doublons potentiels
SELECT idcc, COUNT(*)
FROM ccn_referentiel
GROUP BY idcc
HAVING COUNT(*) > 1;
```

---

## Migration 2 : Mapping NAS/Clients/IDCC

### Fichier
`migrations/create_nas_client_mapping.sql`

### Description
Crée les tables pour gérer la correspondance entre les dossiers NAS et les clients avec leurs IDCC.

### Contenu
- Table `nas_client_mapping` pour stocker les mappings
- Table `idcc_ref` pour le référentiel des IDCC
- Triggers automatiques pour `updated_at` et `mapped_at`
- Vue `v_nas_mapping_summary` pour les statistiques
- Données initiales : 15 IDCC les plus courantes

### Exécution via Dashboard Supabase

1. Se connecter à https://supabase.com/dashboard
2. Sélectionner le projet WALTERA
3. Aller dans **SQL Editor**
4. Créer une nouvelle query
5. Copier-coller le contenu du fichier `migrations/create_nas_client_mapping.sql`
6. Cliquer sur **Run** (ou Ctrl+Enter)
7. Vérifier le succès dans la console

### Exécution via CLI

```bash
# Depuis la racine du projet
supabase db execute -f supabase/migrations/create_nas_client_mapping.sql
```

### Vérification

```sql
-- Vérifier que les tables existent
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('nas_client_mapping', 'idcc_ref');

-- Compter les IDCC
SELECT COUNT(*) FROM idcc_ref;
-- Résultat attendu : 15 ou plus (selon si ccn_referentiel existe)

-- Voir les IDCC disponibles
SELECT idcc, label
FROM idcc_ref
ORDER BY idcc
LIMIT 10;
```

### Rollback (si nécessaire)

```sql
-- Supprimer les tables
DROP VIEW IF EXISTS v_nas_mapping_summary CASCADE;
DROP TABLE IF EXISTS nas_client_mapping CASCADE;
DROP TABLE IF EXISTS idcc_ref CASCADE;
```

### Utilisation

#### Ajouter un mapping manuellement

```sql
INSERT INTO nas_client_mapping (folder_name, client_name, idcc, category, status)
VALUES ('ACME_Corp_2024', 'ACME Corporation', ARRAY['1486', '2120'], 'Clients', 'mapped');
```

#### Mettre à jour un mapping

```sql
UPDATE nas_client_mapping
SET client_name = 'ACME Corp',
    idcc = ARRAY['1486'],
    status = 'mapped'
WHERE folder_name = 'ACME_Corp_2024';
```

#### Voir les statistiques

```sql
SELECT * FROM v_nas_mapping_summary;
```

### Données de test

```sql
-- Insérer quelques mappings de test
INSERT INTO nas_client_mapping (folder_name, client_name, idcc, category, status, notes) VALUES
  ('Client_Alpha_2024', 'Alpha Solutions', ARRAY['1486'], 'Clients', 'mapped', 'Client principal Syntec'),
  ('Prospect_Beta', 'Beta Services', ARRAY['2120'], 'Prospects', 'pending', 'En cours de négociation'),
  ('Partenaire_Gamma', 'Gamma Partners', ARRAY['3127'], 'Partenaires', 'mapped', NULL),
  ('Ancien_Delta', 'Delta Corp', ARRAY['1979'], 'Résiliations', 'ignored', 'Contrat résilié en 2023'),
  ('Dossier_Epsilon', NULL, NULL, NULL, 'pending', 'À identifier')
ON CONFLICT (folder_name) DO NOTHING;
```

---

## Notes importantes

### Row Level Security (RLS)

#### ccn_referentiel
- **Lecture** : Tous les utilisateurs (authentifiés ou non)
- **Écriture** : Service role uniquement

#### nas_client_mapping et idcc_ref
- **Lecture** : Utilisateurs authentifiés uniquement
- **Écriture** : Utilisateurs authentifiés uniquement

### Synchronisation ccn_referentiel ↔ idcc_ref

Si vous avez les deux tables, vous pouvez synchroniser les IDCC :

```sql
-- Importer les nouveaux IDCC depuis ccn_referentiel
INSERT INTO idcc_ref (idcc, label)
SELECT idcc, titre
FROM ccn_referentiel
WHERE active = true
ON CONFLICT (idcc) DO UPDATE SET label = EXCLUDED.label;
```

---

**Date de création** : Décembre 2025
**Version** : 1.0
