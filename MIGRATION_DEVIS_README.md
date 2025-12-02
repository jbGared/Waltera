# Migration : Table demandes_devis avec consentement RGPD

## Contexte

Cette migration crée la table `demandes_devis` pour stocker les demandes de devis de complémentaire santé avec le **consentement RGPD** et sa date.

## ⚠️ Action requise

La migration doit être appliquée manuellement via le dashboard Supabase.

## Étapes pour appliquer la migration

### Option 1 : Via le Dashboard Supabase (Recommandé)

1. **Ouvrir l'éditeur SQL**
   - Aller sur : https://supabase.com/dashboard/project/djxbhqoswgmgogefqlra/editor/sql
   - Ou : Dashboard > SQL Editor > New Query

2. **Copier le contenu du fichier**
   ```bash
   cat supabase/migrations/20251202000000_demandes_devis.sql
   ```

3. **Coller dans l'éditeur SQL** et cliquer sur **RUN**

4. **Vérifier la création**
   - Aller dans "Table Editor"
   - Vérifier que la table `demandes_devis` apparaît

### Option 2 : Via psql (si configuré)

```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" \
  -f supabase/migrations/20251202000000_demandes_devis.sql
```

## Structure de la table

La table `demandes_devis` contient :

### Informations du client
- `prenom` (TEXT)
- `nom` (TEXT)
- `email` (TEXT)
- `adresse` (TEXT)
- `code_postal` (TEXT)

### ✅ Consentement RGPD (NOUVEAU)
- **`rgpd_consent`** (BOOLEAN) - Consentement explicite
- **`rgpd_consent_date`** (TIMESTAMPTZ) - Date et heure du consentement

### Données du devis
- `gamme` (TEXT)
- `date_effet` (DATE)
- `option_choisie` (INTEGER 1-6)
- `surcomplementaire` (BOOLEAN)
- `renfort_hospi` (BOOLEAN)
- `commission` (INTEGER 10/15/20)

### Résultat du calcul
- `tarif_mensuel` (DECIMAL)
- `produit` (TEXT)
- `zone` (TEXT)

### Données complémentaires (JSONB)
- `beneficiaires` - Liste des bénéficiaires avec leurs informations
- `details_calcul` - Détails du calcul tarifaire par bénéficiaire

### Métadonnées
- `statut` (nouveau, en_cours, souscrit, refuse, archive)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

## Fonctionnalités

### Enregistrement automatique

Le formulaire enregistre automatiquement les devis **après calcul** si toutes les conditions sont remplies :
- Prénom, nom, email renseignés
- Adresse complète
- Consentement RGPD accepté ✅
- Tarif calculé > 0

### Sécurité (RLS)

- **INSERT** : Accessible publiquement (pour le formulaire)
- **SELECT/UPDATE/DELETE** : Réservé aux utilisateurs authentifiés (admin)

## Vérification

Après avoir appliqué la migration, vérifier dans Supabase :

```sql
-- Vérifier la table
SELECT * FROM demandes_devis LIMIT 1;

-- Vérifier les colonnes RGPD
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'demandes_devis'
  AND column_name LIKE 'rgpd%';
```

## Code correspondant

### Fonction d'enregistrement
Fichier : `src/services/tarificateur/supabase.ts`
- `enregistrerDemandeDevis()` : Enregistre les données avec consentement RGPD

### Utilisation dans le formulaire
Fichier : `src/components/DevisForm.tsx`
- Appelée automatiquement après `calculerDevisSupabase()`
- Enregistre uniquement si toutes les infos sont complètes

## Support

En cas de problème :
1. Vérifier les erreurs dans la console Supabase
2. Vérifier que la fonction `handle_updated_at()` existe (migration initiale)
3. Contacter l'équipe technique
