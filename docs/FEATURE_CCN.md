# Page CCN - Conventions Collectives

## Description

Nouvelle page `/ccn` dans le portail WALTERA permettant d'afficher et de consulter les conventions collectives (CCN) importées dans la base de données.

---

## Accès

### URL
`/ccn` (route protégée - nécessite authentification)

### Navigation
- Depuis le **Dashboard** : Carte d'accès rapide "Conventions Collectives"
- URL directe : `http://localhost:5173/ccn`

---

## Fonctionnalités

### 1. Affichage des CCN

La page affiche un tableau récapitulatif des conventions collectives avec :

| Colonne | Description |
|---------|-------------|
| **Code IDCC** | Identifiant de la convention collective (format monospace) |
| **Titre de la CCN** | Titre complet de la convention |
| **Documents** | Nombre de documents associés (badge) |
| **Dernière MAJ** | Date et heure de la dernière mise à jour |
| **Statut** | Badge coloré selon l'ancienneté |

### 2. Badges de statut

Le statut est calculé automatiquement en fonction de la date de dernière mise à jour :

- 🟢 **À jour** (vert) : ≤ 7 jours
- 🟠 **Attention** (orange) : 8-30 jours
- 🔴 **Ancienne** (rouge) : > 30 jours

### 3. Statistiques

En bas du tableau :
- Nombre total de CCN
- Nombre total de documents

---

## Source des données

### Table Supabase

La page interroge la table `documents` avec les critères suivants :

```sql
SELECT
  metadata->>'idcc' as idcc,
  metadata->>'titre' as titre,
  created_at
FROM documents
WHERE metadata->>'source' = 'legifrance'
```

### Regroupement

Les données sont ensuite regroupées côté client par `IDCC` pour calculer :
- Le nombre de documents par CCN
- La date de dernière mise à jour (MAX des `created_at`)

---

## Structure technique

### Fichiers créés

```
src/
├── pages/
│   └── CCN.tsx                     # Page principale
├── components/
│   └── ccn/
│       └── CCNList.tsx             # Composant de liste des CCN
└── components/ui/
    ├── table.tsx                   # Composant shadcn (nouveau)
    ├── badge.tsx                   # Composant shadcn (nouveau)
    └── skeleton.tsx                # Composant shadcn (nouveau)
```

### Composants utilisés

- **shadcn/ui** :
  - `Table` : Tableau responsive
  - `Badge` : Badges de statut et compteurs
  - `Skeleton` : Loading state
  - `Card` : Conteneur de la page
- **lucide-react** :
  - `FileText` : Icône principale
  - `AlertCircle` : Icône d'erreur
  - `ArrowLeft` : Retour au dashboard

---

## États de l'interface

### 1. Chargement (Loading)

Affiche 5 lignes de `Skeleton` pendant la récupération des données.

### 2. Erreur

Message d'erreur avec icône si la requête échoue :
```
⚠ Erreur lors de la récupération des données
```

### 3. Vide

Si aucune CCN n'est trouvée :
```
Aucune convention collective trouvée dans la base de données.
```

### 4. Données affichées

Tableau complet avec toutes les CCN triées par code IDCC.

---

## Design

### Couleurs

- **Primaire** : `#407b85` (couleur WALTERA)
- **Badge vert** : `bg-green-500`
- **Badge orange** : `bg-orange-500`
- **Badge rouge** : `variant="destructive"`

### Espacement

- Padding principal : `py-8`
- Gap colonnes : Adaptatif selon la largeur de l'écran
- Marges : Identiques au tarificateur

### Responsive

- Mobile : Tableau scrollable horizontalement
- Tablet : Colonnes adaptées
- Desktop : Affichage complet

---

## Exemple de données affichées

| Code IDCC | Titre de la CCN | Documents | Dernière MAJ | Statut |
|-----------|-----------------|-----------|--------------|--------|
| 0016 | Convention collective nationale de l'industrie textile | 12 | 05/12/2025 14:30 | 🟢 À jour |
| 0044 | Convention collective nationale de l'industrie chimique | 8 | 20/11/2025 09:15 | 🟠 Attention |
| 0573 | Commerces de gros | 24 | 15/10/2025 16:45 | 🔴 Ancienne |

---

## Code d'intégration

### Route ajoutée

```tsx
// src/pages/index.tsx
const CCN = lazy(() => import('./CCN'))

<Route path="/ccn" element={<ProtectedRoute><CCN /></ProtectedRoute>} />
```

### Constante ajoutée

```tsx
// src/constants/index.ts
export const ROUTES = {
  // ...
  CCN: '/ccn',
} as const;
```

### Carte Dashboard

```tsx
// src/pages/Dashboard.tsx
<Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group mt-6">
  <Link to={ROUTES.CCN}>
    <Button>Voir les CCN</Button>
  </Link>
</Card>
```

---

## Améliorations futures possibles

### Court terme
- [ ] Filtres par IDCC, titre
- [ ] Recherche full-text
- [ ] Tri par colonnes (IDCC, date, nombre de docs)
- [ ] Pagination si > 50 CCN

### Moyen terme
- [ ] Export CSV de la liste
- [ ] Détail d'une CCN (page dédiée)
- [ ] Graphiques de répartition
- [ ] Notifications de mises à jour

### Long terme
- [ ] Comparaison de CCN
- [ ] Historique des modifications
- [ ] Import/synchronisation automatique
- [ ] Alertes personnalisées

---

## Tests

### Tests manuels à effectuer

1. **Navigation** :
   - ✅ Accès depuis le Dashboard
   - ✅ URL directe `/ccn`
   - ✅ Bouton "Retour au Dashboard"

2. **Affichage** :
   - ✅ Loading state (skeletons)
   - ✅ Données affichées correctement
   - ✅ Badges de statut corrects
   - ✅ Formatage des dates

3. **Cas limites** :
   - ✅ Aucune CCN (message approprié)
   - ✅ Erreur Supabase (message d'erreur)
   - ✅ IDCC manquant (affiché comme "N/A")

4. **Responsive** :
   - ✅ Mobile (scroll horizontal)
   - ✅ Tablet
   - ✅ Desktop

---

## Dépendances

### Packages

- `@supabase/supabase-js` : Client Supabase
- `lucide-react` : Icônes
- `react-router-dom` : Navigation
- `@radix-ui/*` : Composants shadcn

### Variables d'environnement

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

---

## Troubleshooting

### Problème : "Erreur lors de la récupération des données"

**Causes possibles** :
1. Table `documents` vide ou inexistante
2. RLS (Row Level Security) bloque l'accès
3. Champ `metadata` mal formaté

**Solutions** :
```sql
-- Vérifier la table
SELECT COUNT(*) FROM documents WHERE metadata->>'source' = 'legifrance';

-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'documents';

-- Vérifier le format metadata
SELECT metadata FROM documents LIMIT 5;
```

---

### Problème : "Aucune CCN affichée"

**Vérifier** :
```sql
SELECT DISTINCT
  metadata->>'idcc',
  metadata->>'titre'
FROM documents
WHERE metadata->>'source' = 'legifrance';
```

Si aucun résultat, la table ne contient pas de documents Legifrance.

---

## Références

- **shadcn/ui Table** : https://ui.shadcn.com/docs/components/table
- **shadcn/ui Badge** : https://ui.shadcn.com/docs/components/badge
- **Supabase JSONB** : https://supabase.com/docs/guides/database/json

---

**Version** : 1.0
**Date de création** : Décembre 2025
**Auteur** : Équipe WALTERA
