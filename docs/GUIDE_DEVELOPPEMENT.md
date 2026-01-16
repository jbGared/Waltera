# Guide de développement - WALTERA

## Installation et configuration

### Prérequis

- **Node.js** : v18 ou supérieur
- **npm** : v9 ou supérieur
- **Git** : Pour le versionnement
- **Compte Supabase** : Pour accéder à la base de données
- **Compte Firebase** : Pour le déploiement (optionnel)

### Installation initiale

```bash
# Cloner le repository
git clone https://github.com/votre-org/waltera.git
cd waltera

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Configurer les variables d'environnement
# Éditer .env et ajouter vos clés Supabase
```

### Configuration des variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Firebase (optionnel, pour le déploiement)
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_PROJECT_ID=waltera-xxx
```

---

## Commandes de développement

### Développement local

```bash
# Démarrer le serveur de développement
npm run dev

# L'application sera accessible sur http://localhost:5173
```

### Build de production

```bash
# Créer un build optimisé
npm run build

# Prévisualiser le build localement
npm run preview
```

### Linting et formatage

```bash
# Vérifier le code
npm run lint

# Formater le code (si configuré)
npm run format
```

---

## Structure du projet

```
waltera/
├── docs/                      # Documentation
│   ├── NOTE_DE_SYNTHESE.md
│   ├── ARCHITECTURE.md
│   ├── SUPABASE_GUIDE.md
│   ├── GUIDE_DEVELOPPEMENT.md
│   └── REGLES_METIER.md
├── public/                    # Fichiers statiques
├── src/
│   ├── components/
│   │   ├── tarificateur/     # Composants métier
│   │   └── ui/               # Composants UI (shadcn)
│   ├── lib/
│   │   ├── supabase.ts       # Client Supabase
│   │   ├── types/            # Types TypeScript
│   │   └── utils.ts          # Utilitaires
│   ├── pages/
│   │   └── Tarificateur.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env                       # Variables d'environnement (non commité)
├── .env.example              # Exemple de variables
├── .gitignore
├── CLAUDE.md                 # Instructions pour Claude
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## Conventions de code

### TypeScript

```typescript
// ✅ Bon : typage explicite des interfaces
interface Beneficiaire {
  type: 'assure' | 'conjoint' | 'enfant';
  dateNaissance: Date;
}

// ❌ Éviter : types any
const data: any = { ... };

// ✅ Bon : types stricts
const data: DevisInput = { ... };
```

### Composants React

```typescript
// ✅ Bon : composant fonctionnel avec props typées
interface BeneficiaireSectionProps {
  beneficiaires: Beneficiaire[];
  onUpdate: (beneficiaires: Beneficiaire[]) => void;
}

export function BeneficiairesSection({ beneficiaires, onUpdate }: BeneficiaireSectionProps) {
  // ...
}

// ❌ Éviter : composants sans types
export function BeneficiairesSection(props) {
  // ...
}
```

### Naming conventions

```typescript
// Variables et fonctions : camelCase
const userName = 'John';
function calculateAge() { }

// Composants React : PascalCase
function TarificateurForm() { }

// Constantes : UPPER_SNAKE_CASE
const MAX_BENEFICIAIRES = 10;
const API_URL = 'https://api.example.com';

// Types/Interfaces : PascalCase
interface DevisInput { }
type GammeType = 'SANTE_SENIORS' | 'SANTE_SENIORS_PLUS' | 'TNS_FORMULES';
```

### Organisation des imports

```typescript
// 1. Imports React
import { useState, useEffect } from 'react';

// 2. Imports externes
import { supabase } from '@/lib/supabase';

// 3. Imports de composants
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. Imports de types
import type { Beneficiaire, DevisInput } from '@/lib/types';

// 5. Imports de styles (si nécessaire)
import './styles.css';
```

---

## Workflow Git

### Branches

```bash
# Branche principale
main (ou master)

# Branches de développement
feature/nom-de-la-fonctionnalite
fix/nom-du-bug
refactor/nom-du-refactoring
```

### Commits

Utiliser la convention **Conventional Commits** :

```bash
# Format
<type>(<scope>): <description>

# Types
feat:     Nouvelle fonctionnalité
fix:      Correction de bug
docs:     Documentation
style:    Formatage, points-virgules manquants, etc.
refactor: Refactoring de code
test:     Ajout de tests
chore:    Tâches de maintenance

# Exemples
git commit -m "feat(tarificateur): ajout du renfort hospitalisation"
git commit -m "fix(beneficiaires): correction calcul âge enfants"
git commit -m "docs: mise à jour du README"
```

### Workflow typique

```bash
# 1. Créer une nouvelle branche
git checkout -b feature/nouvelle-fonctionnalite

# 2. Faire vos modifications
# ...

# 3. Ajouter les fichiers modifiés
git add .

# 4. Commiter avec un message descriptif
git commit -m "feat: description de la fonctionnalité"

# 5. Pousser vers le repository
git push origin feature/nouvelle-fonctionnalite

# 6. Créer une Pull Request sur GitHub/GitLab
```

---

## Ajout de nouvelles fonctionnalités

### 1. Ajouter un nouveau composant UI (shadcn)

```bash
# Installer un nouveau composant shadcn
npx shadcn@latest add dialog

# Le composant sera ajouté dans src/components/ui/dialog.tsx
```

### 2. Créer un nouveau composant métier

```typescript
// src/components/tarificateur/NouveauComposant.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NouveauComposantProps {
  // Définir les props
}

export function NouveauComposant({ ...props }: NouveauComposantProps) {
  // État local
  const [state, setState] = useState();

  // Logique du composant

  return (
    <Card>
      <CardHeader>
        <CardTitle>Titre</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Contenu */}
      </CardContent>
    </Card>
  );
}
```

### 3. Ajouter une nouvelle requête Supabase

```typescript
// src/lib/queries/nouvelles-queries.ts
import { supabase } from '@/lib/supabase';

export async function getNouvellesDonnees() {
  const { data, error } = await supabase
    .from('ma_table')
    .select('*')
    .eq('condition', 'valeur');

  if (error) {
    console.error('Erreur:', error);
    return null;
  }

  return data;
}
```

---

## Tests (à implémenter)

### Configuration Vitest

```bash
# Installer Vitest et React Testing Library
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### Exemple de test unitaire

```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { calculateAge } from './utils';

describe('calculateAge', () => {
  it('should calculate age correctly', () => {
    const birthDate = new Date('1990-01-01');
    const referenceDate = new Date('2025-01-01');

    const age = calculateAge(birthDate, referenceDate);

    expect(age).toBe(35);
  });

  it('should handle leap years', () => {
    const birthDate = new Date('2000-02-29');
    const referenceDate = new Date('2025-02-28');

    const age = calculateAge(birthDate, referenceDate);

    expect(age).toBe(24);  // Pas encore anniversaire
  });
});
```

### Exemple de test de composant

```typescript
// src/components/tarificateur/BeneficiairesSection.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BeneficiairesSection } from './BeneficiairesSection';

describe('BeneficiairesSection', () => {
  it('should render without beneficiaires', () => {
    render(
      <BeneficiairesSection
        beneficiaires={[]}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByText(/bénéficiaires/i)).toBeInTheDocument();
  });

  it('should call onUpdate when adding a beneficiary', () => {
    const mockUpdate = vi.fn();

    render(
      <BeneficiairesSection
        beneficiaires={[]}}
        onUpdate={mockUpdate}
      />
    );

    const addButton = screen.getByText(/ajouter/i);
    fireEvent.click(addButton);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });
});
```

---

## Débogage

### Console Supabase

```typescript
// Activer les logs Supabase
const { data, error } = await supabase
  .from('tarifs_sante')
  .select('*')
  .eq('gamme', 'SANTE_SENIORS');

console.log('Données récupérées:', data);
console.log('Erreur éventuelle:', error);
```

### React DevTools

```bash
# Installer l'extension React DevTools
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/...
# Firefox: https://addons.mozilla.org/fr/firefox/addon/react-devtools/
```

### Vite logs

```bash
# Démarrer avec logs détaillés
npm run dev -- --debug

# Logs réseau
npm run dev -- --logLevel info
```

---

## Déploiement

### Firebase Hosting

```bash
# 1. Installer Firebase CLI
npm install -g firebase-tools

# 2. Se connecter à Firebase
firebase login

# 3. Initialiser le projet (première fois uniquement)
firebase init hosting

# 4. Build de production
npm run build

# 5. Déployer
firebase deploy --only hosting

# 6. URL de production
# https://waltera-xxx.web.app
```

### Vérifications avant déploiement

```bash
# ✅ Tests passent (quand implémentés)
npm run test

# ✅ Build réussit sans erreur
npm run build

# ✅ Aucune erreur TypeScript
npx tsc --noEmit

# ✅ Variables d'environnement configurées
# Vérifier .env et Firebase config
```

---

## Ressources utiles

### Documentation externe

- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com/docs)
- [Firebase](https://firebase.google.com/docs)

### Documentation interne

- `CLAUDE.md` : Instructions techniques détaillées
- `docs/NOTE_DE_SYNTHESE.md` : Vue d'ensemble du projet
- `docs/ARCHITECTURE.md` : Architecture technique
- `docs/SUPABASE_GUIDE.md` : Guide Supabase
- `docs/REGLES_METIER.md` : Règles métier

---

## FAQ

### Comment ajouter un nouveau composant shadcn ?

```bash
npx shadcn@latest add [nom-du-composant]
```

### Comment régénérer les types Supabase ?

```bash
npx supabase gen types typescript --project-id xxxxx > src/lib/types/supabase.ts
```

### Comment déboguer une requête Supabase lente ?

1. Vérifier les index dans le Dashboard Supabase
2. Utiliser EXPLAIN ANALYZE dans l'éditeur SQL
3. Limiter les colonnes sélectionnées avec `.select('col1, col2')`

### Comment gérer les erreurs Supabase ?

```typescript
const { data, error } = await supabase.from('table').select();

if (error) {
  console.error('Erreur Supabase:', error.message);
  // Afficher un message à l'utilisateur
  return;
}

// Traiter les données
```

---

## Contribution

### Checklist avant une Pull Request

- [ ] Le code compile sans erreur TypeScript
- [ ] Le code suit les conventions de nommage
- [ ] Les imports sont organisés correctement
- [ ] Les composants sont correctement typés
- [ ] Le commit suit la convention Conventional Commits
- [ ] La documentation est mise à jour si nécessaire
- [ ] Les tests passent (quand implémentés)

---

**Version** : 1.0
**Date** : Décembre 2025
