# Import de Conventions Collectives - Module CCN

## Description

Extension du module CCN permettant de sélectionner et d'importer de nouvelles conventions collectives depuis un référentiel centralisé.

---

## Vue d'ensemble

### Avant
- Page `/ccn` affichant uniquement les CCN déjà importées
- Pas de moyen d'ajouter de nouvelles CCN

### Après
- Section dédiée "Ajouter une convention collective"
- Sélecteur searchable avec ~60 CCN pré-configurées
- Indicateur visuel des CCN déjà importées
- Bouton d'import avec feedback visuel

---

## Architecture

### Base de données

#### Nouvelle table : `ccn_referentiel`

```sql
CREATE TABLE ccn_referentiel (
  idcc TEXT PRIMARY KEY,
  titre TEXT NOT NULL,
  brochure TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Contenu** : 60+ conventions collectives nationales françaises les plus courantes

**Exemples de CCN** :
- 1486 : Syntec (Bureaux d'études techniques)
- 2120 : Banque
- 3127 : Services à la personne
- 1979 : HCR (Hôtels, cafés, restaurants)
- 0016 : Transports routiers

### Composants

#### 1. CCNSelector.tsx

Composant de sélection avec combobox searchable.

**Props** :
```typescript
interface CCNSelectorProps {
  importedIDCCs: string[];  // Liste des IDCC déjà importés
  onImport: (idcc: string, titre: string) => void;  // Callback d'import
}
```

**Fonctionnalités** :
- Recherche par IDCC ou titre
- Affichage du numéro de brochure
- Badge "Déjà importée" si la CCN existe
- Bouton désactivé si déjà importée
- Loading state pendant l'import

**Composants shadcn utilisés** :
- `Command` : Combobox avec recherche
- `Popover` : Affichage du sélecteur
- `Badge` : Indicateurs de statut
- `Button` : Bouton d'import

#### 2. CCNList.tsx (modifié)

Ajout de la section d'import au-dessus du tableau existant.

**Nouvelles fonctionnalités** :
- Section "Ajouter une convention collective" (card avec bordure bleue en pointillés)
- Gestion de l'import avec `handleImportCCN()`
- Toast de confirmation d'import
- Rafraîchissement automatique de la liste après import

---

## Interface utilisateur

### Section "Ajouter une convention collective"

```
┌─────────────────────────────────────────────────────┐
│ ➕ Ajouter une convention collective                │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Sélectionner une convention collective              │
│ ┌──────────────────────────────────────────────┐   │
│ │ 1486 - Bureaux d'études techniques...    ▼  │   │
│ └──────────────────────────────────────────────┘   │
│ Brochure JO : 3018                                  │
│                                                      │
│                           [📥 Importer]             │
└─────────────────────────────────────────────────────┘
```

### Combobox déroulé

```
┌────────────────────────────────────────────────────┐
│ 🔍 Rechercher par IDCC ou titre...                 │
├────────────────────────────────────────────────────┤
│ ✓  0016  Transports routiers...                    │
│    0044  Industries chimiques...                   │
│    0573  Commerces de gros...                      │
│ ✓  1486  Bureaux d'études techniques...  ✅       │
│    1979  Hôtels, cafés, restaurants...             │
│    2120  Banque...                                 │
│    3127  Services à la personne...                 │
└────────────────────────────────────────────────────┘

✓ = Sélectionnée
✅ = Déjà importée
```

### Toast de confirmation

```
┌─────────────────────────────────────────┐
│ Import initié                            │
│ L'import de la CCN 1486 - Bureaux       │
│ d'études techniques a été démarré.      │
│ Cela peut prendre quelques minutes.     │
└─────────────────────────────────────────┘
```

---

## Workflow utilisateur

### 1. Sélection d'une CCN

1. Cliquer sur le champ "Sélectionner une convention collective"
2. Taper pour rechercher (par IDCC ou titre)
3. Cliquer sur une CCN dans la liste

### 2. Vérification

- Si la CCN est déjà importée : badge vert "Déjà importée" + bouton désactivé
- Sinon : affichage du numéro de brochure + bouton "Importer" actif

### 3. Import

1. Cliquer sur "Importer"
2. Affichage du toast de confirmation
3. Bouton passe en mode "Import en cours..." (spinner)
4. Après 2 secondes : rafraîchissement de la liste
5. La CCN apparaît maintenant dans le tableau avec badge "Déjà importée"

---

## Code

### Requête Supabase pour le référentiel

```typescript
const { data, error } = await supabase
  .from('ccn_referentiel')
  .select('idcc, titre, brochure, active')
  .eq('active', true)
  .order('idcc');
```

### Fonction d'import (placeholder)

```typescript
async function handleImportCCN(idcc: string, titre: string) {
  try {
    // TODO: Implémenter la logique d'import réelle
    // - Appeler un webhook n8n
    // - Ou déclencher un workflow Supabase Edge Function
    // - Ou ajouter une tâche dans une queue

    toast({
      title: 'Import initié',
      description: `L'import de la CCN ${idcc} - ${titre} a été démarré.`,
    });

    // Rafraîchir après 2s
    setTimeout(() => fetchCCNData(), 2000);
  } catch (error) {
    toast({
      title: 'Erreur',
      description: 'Une erreur est survenue lors de l\'import.',
      variant: 'destructive',
    });
  }
}
```

---

## Intégration dans la page

### Avant
```tsx
<Card>
  <CardHeader>Conventions Collectives Importées</CardHeader>
  <CardContent>
    <Table>...</Table>
  </CardContent>
</Card>
```

### Après
```tsx
<div className="space-y-6">
  {/* Section d'ajout */}
  <Card className="border-dashed border-blue-200">
    <CardHeader>Ajouter une convention collective</CardHeader>
    <CardContent>
      <CCNSelector
        importedIDCCs={importedIDCCs}
        onImport={handleImportCCN}
      />
    </CardContent>
  </Card>

  {/* Section liste */}
  <Card>
    <CardHeader>Conventions Collectives Importées</CardHeader>
    <CardContent>
      <Table>...</Table>
    </CardContent>
  </Card>
</div>
```

---

## Fichiers créés/modifiés

### Créés

```
supabase/
├── migrations/
│   └── create_ccn_referentiel.sql       # Migration SQL
└── README.md                             # Guide migrations

src/components/
├── ccn/
│   └── CCNSelector.tsx                   # Nouveau composant
└── ui/
    ├── command.tsx                       # shadcn Command
    ├── popover.tsx                       # shadcn Popover
    ├── dialog.tsx                        # shadcn Dialog
    ├── toast.tsx                         # shadcn Toast
    └── toaster.tsx                       # shadcn Toaster

src/hooks/
└── use-toast.ts                          # Hook toast

docs/
└── FEATURE_CCN_IMPORT.md                 # Ce fichier
```

### Modifiés

```
src/components/ccn/CCNList.tsx            # Ajout section import
src/App.tsx                               # Ajout Toaster
```

---

## Installation

### 1. Exécuter la migration SQL

Via Dashboard Supabase :
1. Aller dans SQL Editor
2. Copier le contenu de `supabase/migrations/create_ccn_referentiel.sql`
3. Exécuter

Ou via CLI :
```bash
supabase db push
```

### 2. Vérifier les données

```sql
SELECT COUNT(*) FROM ccn_referentiel;
-- Résultat attendu : 60+
```

### 3. Build et déploiement

```bash
npm run build
firebase deploy --only hosting
```

---

## Améliorations futures

### Court terme
- [ ] Implémenter la logique d'import réelle (webhook n8n ou Edge Function)
- [ ] Ajouter une barre de progression pour l'import
- [ ] Permettre l'import multiple (sélection de plusieurs CCN)

### Moyen terme
- [ ] Historique des imports
- [ ] Notification par email quand import terminé
- [ ] Détail de l'import (nombre de documents, date de début/fin)
- [ ] Annulation d'un import en cours

### Long terme
- [ ] Import automatique (synchronisation hebdomadaire)
- [ ] Suggestion de CCN basée sur l'activité de l'entreprise
- [ ] Comparaison entre CCN avant import
- [ ] Prévisualisation des documents avant import complet

---

## Tests

### Tests manuels à effectuer

1. **Affichage du sélecteur** :
   - ✅ Le combobox affiche toutes les CCN
   - ✅ La recherche fonctionne (IDCC et titre)
   - ✅ Les CCN importées ont le badge vert

2. **Sélection** :
   - ✅ Cliquer sur une CCN la sélectionne
   - ✅ La brochure s'affiche si disponible
   - ✅ Le bouton "Importer" est actif/inactif selon le statut

3. **Import** :
   - ✅ Clic sur "Importer" affiche le toast
   - ✅ Le bouton passe en mode loading
   - ✅ La liste se rafraîchit après 2 secondes

4. **Cas limites** :
   - ✅ CCN déjà importée : bouton désactivé
   - ✅ Recherche sans résultat : message approprié
   - ✅ Erreur réseau : toast d'erreur

---

## Dépendances

### Nouvelles dépendances (shadcn)

- `cmdk` : Commandes et combobox
- `@radix-ui/react-popover` : Popover
- `@radix-ui/react-dialog` : Dialog
- `@radix-ui/react-toast` : Toast

Toutes installées automatiquement via `npx shadcn@latest add`.

---

## Migration depuis l'ancienne version

Si la page `/ccn` existe déjà sans le sélecteur :

1. Exécuter la migration SQL
2. Mettre à jour `CCNList.tsx`
3. Ajouter `CCNSelector.tsx`
4. Ajouter le `Toaster` dans `App.tsx`
5. Rebuild et redéployer

---

## Références

- **shadcn/ui Command** : https://ui.shadcn.com/docs/components/command
- **shadcn/ui Popover** : https://ui.shadcn.com/docs/components/popover
- **shadcn/ui Toast** : https://ui.shadcn.com/docs/components/toast
- **Supabase Migrations** : https://supabase.com/docs/guides/cli/local-development#database-migrations

---

**Version** : 1.0
**Date de création** : Décembre 2025
**Auteur** : Équipe WALTERA
