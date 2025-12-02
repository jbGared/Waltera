# Implémentation du Calculateur de Tarifs WALTERA

## Résumé

Le module de calcul de tarifs pour les contrats de complémentaire santé individuelle a été implémenté avec succès.

## Fichiers créés

### Module principal
- `src/services/tarificateur/types.ts` - Types TypeScript
- `src/services/tarificateur/utils.ts` - Fonctions utilitaires
- `src/services/tarificateur/validator.ts` - Validations
- `src/services/tarificateur/calculator.ts` - Fonction de calcul principale
- `src/services/tarificateur/index.ts` - Exports du module

### Documentation et tests
- `src/services/tarificateur/README.md` - Documentation complète
- `src/services/tarificateur/example.ts` - Exemples d'utilisation
- `src/services/tarificateur/calculator.test.ts` - Tests de calcul (7 tests)
- `src/services/tarificateur/utils.test.ts` - Tests utilitaires (18 tests)

### Configuration
- `vitest.config.ts` - Configuration Vitest
- `package.json` - Scripts de test ajoutés

## Tests

**25 tests passent avec succès** :
- 7 tests pour la fonction `calculerDevis`
- 18 tests pour les fonctions utilitaires

```bash
npm run test        # Lancer les tests en mode watch
npm run test:ui     # Interface UI pour les tests
npm run test:run    # Exécuter les tests une fois
```

## Utilisation

### Import basique

```typescript
import { calculerDevis } from '@/services/tarificateur';
import type { DevisInput } from '@/services/tarificateur';
import tarifs from '@/data/tarifs_waltera_v2.json';

const input: DevisInput = {
  gamme: "SANTE_SENIORS",
  codePostal: "75001",
  dateEffet: new Date("2025-02-01"),
  assure: { dateNaissance: new Date("1958-03-15") },
  option: 4,
  surcomplementaire: false,
  commission: 10
};

const devis = calculerDevis(input, tarifs);
console.log(`Tarif: ${devis.tarifMensuel}€/mois`);
```

## Fonctionnalités implémentées

### Calcul de tarifs
- ✅ Support des 3 gammes (SANTE_SENIORS_PLUS, SANTE_SENIORS, TNS_FORMULES)
- ✅ Calcul de zone géographique automatique
- ✅ Calcul d'âge à la date d'effet
- ✅ Détermination des tranches d'âge tarifaires
- ✅ Support des 6 options
- ✅ Gestion de la surcomplémentaire (options 3-6)
- ✅ Renfort hospitalisation (SANTE_SENIORS_PLUS uniquement)
- ✅ Support des familles (conjoint + enfants)
- ✅ Qualité "Assuré seul" pour TNS

### Validations
- ✅ Validation du code postal (5 chiffres)
- ✅ Validation des dates
- ✅ Validation des règles métier (surco, renfort hospi, etc.)
- ✅ Messages d'erreur explicites

### Fonctions utilitaires
- ✅ `getZone(codePostal, gamme)` - Détermine la zone tarifaire
- ✅ `calculateAge(dateNaissance, dateEffet)` - Calcule l'âge
- ✅ `getAgeBracket(age, qualite, gamme)` - Détermine la tranche d'âge
- ✅ `getProduitName(gamme, commission)` - Génère le nom du produit
- ✅ `validateDevisInput(input)` - Valide les entrées

## Structure du résultat

```typescript
interface DevisOutput {
  tarifMensuel: number;        // Total mensuel en €
  produit: string;             // Nom du produit
  zone: string;                // Zone tarifaire (Z01, Z02, AM, etc.)
  details: BeneficiaireDetail[]; // Détail par bénéficiaire
}

interface BeneficiaireDetail {
  beneficiaire: string;        // "Assuré", "Conjoint", "Enfant 1", etc.
  age: number;                 // Âge à la date d'effet
  tarifBase: number;           // Tarif de base en €
  tarifSurco: number;          // Surcomplémentaire en €
  tarifRenfort: number;        // Renfort hospi en €
  total: number;               // Total pour ce bénéficiaire en €
}
```

## Cas de test validés

### Cas 1: Senior seul à Paris
- Gamme: SANTE_SENIORS
- Zone: Z02 (Paris)
- 1 bénéficiaire (66 ans)
- Option 4, sans surcomplémentaire
- ✅ Test passant

### Cas 2: Famille TNS à Lyon
- Gamme: TNS_FORMULES
- Zone: Z03 (Lyon)
- 4 bénéficiaires (assuré 41 ans, conjoint 39 ans, 2 enfants)
- Option 3, avec surcomplémentaire
- ✅ Test passant

### Cas 3: Couple Senior Plus Alsace-Moselle
- Gamme: SANTE_SENIORS_PLUS
- Zone: AM (Alsace-Moselle)
- 2 bénéficiaires (72 et 69 ans)
- Option 5, avec surcomplémentaire et renfort hospi
- ✅ Test passant

## Prochaines étapes recommandées

### 1. Créer l'interface utilisateur

Créer un formulaire React pour saisir les informations du devis :

```typescript
// Exemple de structure
<DevisForm
  onCalculate={(input) => {
    const devis = calculerDevis(input, tarifs);
    // Afficher le résultat
  }}
/>
```

### 2. Créer une page dédiée

Créer une route `/tarificateur` accessible depuis l'app et le site web :

```typescript
// src/pages/Tarificateur.tsx
import { calculerDevis } from '@/services/tarificateur';

export default function Tarificateur() {
  // Formulaire + affichage résultats
}
```

### 3. Persistance des devis

Optionnel : Sauvegarder les devis calculés dans Supabase pour historique.

### 4. Export PDF

Optionnel : Générer un PDF du devis pour l'envoi au client.

## Notes techniques

- Le fichier de tarifs (`tarifs_waltera_v2.json`) fait 2.4 Mo
- Les tarifs sont chargés en mémoire au moment de l'import
- Tous les calculs sont effectués côté client
- Aucune dépendance externe ajoutée (sauf Vitest pour les tests)
- TypeScript strict activé, tous les types sont correctement définis

## Performances

- Calcul instantané (< 1ms pour un devis simple)
- Tous les tests s'exécutent en < 50ms
- Import JSON optimisé par Vite

## Compatibilité

- Node.js : Compatible
- Navigateurs : Compatible (ES2020+)
- TypeScript : 5.6.3+
- React : Compatible pour intégration future
