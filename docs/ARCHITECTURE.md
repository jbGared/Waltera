# Architecture Technique - WALTERA

## Vue d'ensemble

L'application WALTERA est une SPA (Single Page Application) construite avec React et TypeScript, utilisant Supabase comme backend et Firebase pour l'hébergement.

## Stack technique

### Frontend
- **React 18** : Bibliothèque UI
- **TypeScript** : Typage statique
- **Vite** : Build tool et dev server
- **Tailwind CSS** : Framework CSS utility-first
- **shadcn/ui** : Composants UI basés sur Radix UI
- **Lucide React** : Icônes

### Backend
- **Supabase** :
  - PostgreSQL (base de données)
  - PostgREST (API REST auto-générée)
  - Authentification (futur)

### Déploiement
- **Firebase Hosting** : Hébergement statique
- **Firebase CLI** : Déploiement

---

## Architecture des données

### Schéma de la base de données

```sql
-- Table des tarifs (5868 lignes)
CREATE TABLE tarifs_sante (
  id SERIAL PRIMARY KEY,
  gamme TEXT NOT NULL,        -- 'SANTE_SENIORS_PLUS', 'SANTE_SENIORS', 'TNS_FORMULES'
  produit TEXT NOT NULL,      -- 'SANTE SENIOR PLUS 12191', etc.
  zone TEXT NOT NULL,         -- 'Z01', 'Z02', 'AM', 'Z01'-'Z05'
  qualite TEXT NOT NULL,      -- 'Assuré', 'Conjoint', 'Enfant', 'Assuré seul'
  age TEXT NOT NULL,          -- '0-59', '65', '100+', etc.
  option1 DECIMAL(10,2),
  option2 DECIMAL(10,2),
  option3 DECIMAL(10,2),
  option4 DECIMAL(10,2),
  option5 DECIMAL(10,2),
  option6 DECIMAL(10,2),
  surco_option3 DECIMAL(10,2),
  surco_option4 DECIMAL(10,2),
  surco_option5 DECIMAL(10,2),
  surco_option6 DECIMAL(10,2),
  renfort_hospi DECIMAL(10,2)
);

-- Table des zones (199 lignes)
CREATE TABLE zones_sante (
  id SERIAL PRIMARY KEY,
  type_zone TEXT NOT NULL,    -- 'SENIORS' ou 'TNS'
  code_zone TEXT NOT NULL,    -- 'Z01', 'Z02', 'AM', etc.
  departement TEXT NOT NULL   -- '01', '02', '75', etc.
);
```

### Index recommandés

```sql
-- Index composite pour recherche rapide des tarifs
CREATE INDEX idx_tarifs_lookup ON tarifs_sante(gamme, produit, zone, qualite, age);

-- Index pour recherche de zone
CREATE INDEX idx_zones_lookup ON zones_sante(type_zone, departement);
```

---

## Architecture Frontend

### Structure des dossiers

```
src/
├── components/
│   ├── tarificateur/              # Composants métier
│   │   ├── TarificateurForm.tsx   # Conteneur principal
│   │   ├── GammeSelection.tsx     # Sélection gamme/produit
│   │   ├── BeneficiairesSection.tsx  # Gestion bénéficiaires
│   │   ├── OptionsSection.tsx     # Options et garanties
│   │   └── RecapPanel.tsx         # Panneau récapitulatif
│   └── ui/                        # Composants génériques shadcn
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── accordion.tsx
│       └── ...
├── lib/
│   ├── supabase.ts               # Client Supabase
│   ├── types/
│   │   ├── supabase.ts          # Types générés Supabase
│   │   └── tarificateur.ts      # Types métier
│   └── utils.ts                  # Utilitaires (cn, etc.)
├── pages/
│   └── Tarificateur.tsx          # Page principale
└── main.tsx                      # Point d'entrée
```

### Flux de données

```
User Input (Form)
     ↓
TarificateurForm (State Management)
     ↓
Child Components (BeneficiairesSection, OptionsSection, etc.)
     ↓
Supabase Client (API Calls)
     ↓
PostgreSQL Database
     ↓
Calculation Logic
     ↓
RecapPanel (Display Results)
```

---

## Gestion de l'état

### État local React (useState)

Le composant `TarificateurForm` gère l'ensemble de l'état de l'application :

```typescript
// État principal
const [formData, setFormData] = useState({
  codePostal: '',
  dateEffet: new Date(),
  gamme: 'SANTE_SENIORS_PLUS',
  commission: 10,
  beneficiaires: [],
  option: 3,
  surcomplementaire: false,
  renfortHospi: false
});

// État du calcul
const [devis, setDevis] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

### Pas de state management global
Pour l'instant, pas de Redux/Zustand/Context API car :
- Application simple avec un seul formulaire
- Pas de navigation entre pages multiples
- État facilement gérable avec useState

---

## API et communication avec Supabase

### Configuration du client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Requêtes principales

#### 1. Récupération de la zone

```typescript
const { data, error } = await supabase
  .from('zones_sante')
  .select('code_zone')
  .eq('type_zone', typeZone)
  .eq('departement', dept)
  .single();
```

#### 2. Récupération des tarifs

```typescript
const { data, error } = await supabase
  .from('tarifs_sante')
  .select('*')
  .eq('gamme', gamme)
  .eq('produit', produit)
  .eq('zone', zone)
  .eq('qualite', qualite)
  .eq('age', ageBracket)
  .single();
```

#### 3. Optimisation avec requête groupée (futur)

```typescript
const { data, error } = await supabase
  .from('tarifs_sante')
  .select('*')
  .eq('gamme', gamme)
  .eq('produit', produit)
  .eq('zone', zone)
  .in('qualite', uniqueQualites)
  .in('age', uniqueAges);
```

---

## Sécurité

### Row Level Security (RLS)

```sql
-- Lecture seule pour les utilisateurs anonymes
ALTER TABLE tarifs_sante ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones_sante ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users" ON tarifs_sante
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to all users" ON zones_sante
  FOR SELECT USING (true);
```

### Variables d'environnement

```env
# .env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# .env.local (non commité)
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJyyy...  # Pour admin uniquement
```

---

## Performance

### Optimisations implémentées

1. **Vite** : Build ultra-rapide avec HMR
2. **Code splitting** : Lazy loading des composants (futur)
3. **Memoization** : React.memo sur composants lourds (futur)
4. **Index SQL** : Requêtes optimisées

### Métriques cibles

- **First Contentful Paint** : < 1.5s
- **Time to Interactive** : < 3s
- **Requête Supabase** : < 200ms

---

## Déploiement

### Firebase Hosting

```bash
# Installation
npm install -g firebase-tools

# Login
firebase login

# Initialisation
firebase init hosting

# Build
npm run build

# Déploiement
firebase deploy --only hosting
```

### Configuration Firebase

```json
// firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## Tests (futur)

### Stack de test recommandée

- **Vitest** : Test runner (compatible Vite)
- **React Testing Library** : Tests composants
- **MSW** : Mock des API
- **Playwright** : Tests E2E

### Exemple de test

```typescript
// BeneficiairesSection.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BeneficiairesSection } from './BeneficiairesSection';

describe('BeneficiairesSection', () => {
  it('should add a beneficiary when clicking "Ajouter"', () => {
    const onUpdate = vi.fn();
    render(<BeneficiairesSection beneficiaires={[]} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByText('Ajouter un bénéficiaire'));
    expect(onUpdate).toHaveBeenCalledWith([expect.objectContaining({
      type: 'assure'
    })]);
  });
});
```

---

## Monitoring et logs (futur)

### Outils recommandés

- **Sentry** : Error tracking
- **Google Analytics** : Analytics
- **Supabase Dashboard** : Monitoring SQL

---

## Diagrammes

### Architecture globale

```
┌─────────────────┐
│   Firebase      │
│   Hosting       │
│  (Static SPA)   │
└────────┬────────┘
         │
         │ HTTPS
         │
┌────────▼────────┐
│   React App     │
│  (TypeScript)   │
└────────┬────────┘
         │
         │ REST API
         │
┌────────▼────────┐
│   Supabase      │
│  (PostgreSQL)   │
└─────────────────┘
```

### Flux de calcul

```
1. User saisit code postal
         ↓
2. Lookup zone_sante → code_zone
         ↓
3. User ajoute bénéficiaires
         ↓
4. Pour chaque bénéficiaire:
   - Calcul âge
   - Détermination qualité
   - Lookup tarifs_sante
         ↓
5. Calcul total
         ↓
6. Affichage récapitulatif
```

---

**Version** : 1.0
**Date** : Décembre 2025
