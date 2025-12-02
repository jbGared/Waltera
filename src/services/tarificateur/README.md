# Tarificateur Santé WALTERA

Module de calcul de tarifs pour les contrats de complémentaire santé individuelle WALTERA.

## Installation

Le module est disponible dans `src/services/tarificateur/`.

## Utilisation

### Import

```typescript
import { calculerDevis } from '@/services/tarificateur';
import type { DevisInput, DevisOutput } from '@/services/tarificateur';
import tarifs from '@/data/tarifs_waltera_v2.json';
```

### Exemple basique

```typescript
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
console.log(`Tarif mensuel: ${devis.tarifMensuel}€`);
```

### Exemple avec famille

```typescript
const input: DevisInput = {
  gamme: "TNS_FORMULES",
  codePostal: "69001",
  dateEffet: new Date("2025-02-01"),
  assure: {
    dateNaissance: new Date("1983-06-20"),
    estSeul: false
  },
  conjoint: {
    dateNaissance: new Date("1985-09-10")
  },
  enfants: [
    { dateNaissance: new Date("2013-04-05") },
    { dateNaissance: new Date("2017-11-22") }
  ],
  option: 3,
  surcomplementaire: true,
  commission: 15
};

const devis = calculerDevis(input, tarifs);
```

## Types

### DevisInput

```typescript
interface DevisInput {
  gamme: "SANTE_SENIORS_PLUS" | "SANTE_SENIORS" | "TNS_FORMULES";
  codePostal: string;
  dateEffet: Date;
  assure: { dateNaissance: Date; estSeul?: boolean };
  conjoint?: { dateNaissance: Date };
  enfants?: { dateNaissance: Date }[];
  option: 1 | 2 | 3 | 4 | 5 | 6;
  surcomplementaire: boolean;
  renfortHospi?: boolean;
  commission: 10 | 15 | 20;
}
```

### DevisOutput

```typescript
interface DevisOutput {
  tarifMensuel: number;
  produit: string;
  zone: string;
  details: BeneficiaireDetail[];
}

interface BeneficiaireDetail {
  beneficiaire: string;
  age: number;
  tarifBase: number;
  tarifSurco: number;
  tarifRenfort: number;
  total: number;
}
```

## Règles métier

### Gammes disponibles

- **SANTE_SENIORS_PLUS** : Gamme premium avec renfort hospitalisation
- **SANTE_SENIORS** : Gamme standard seniors
- **TNS_FORMULES** : Gamme pour travailleurs non salariés

### Options

6 options disponibles (1 = économique, 6 = premium)

### Surcomplémentaire

Disponible uniquement pour les options 3 à 6.

### Renfort Hospitalisation

Disponible uniquement pour la gamme SANTE_SENIORS_PLUS.

### Zones tarifaires

#### SENIORS / SENIORS_PLUS
- **AM** : Alsace-Moselle (57, 67, 68)
- **Z02** : Grandes villes (13, 20, 31, 33, 69, 75, 77, 78, 91, 92, 93, 94, 95, 99)
- **Z01** : Reste de la France

#### TNS
- **Z01 à Z05** : Définies dans le fichier de tarifs

### Commissions

Trois niveaux de commission disponibles : 10%, 15%, 20%

## Validations

Le module valide automatiquement :
- Format du code postal (5 chiffres)
- Surcomplémentaire uniquement si option >= 3
- Renfort hospi uniquement pour SANTE_SENIORS_PLUS
- "Assuré seul" (TNS) uniquement sans conjoint ni enfants
- Validité des dates

## Tests

```bash
# Exécuter les tests
npm run test

# Exécuter les tests avec l'interface UI
npm run test:ui

# Exécuter les tests une seule fois
npm run test:run
```

## Fonctions utilitaires

### getZone

Détermine la zone tarifaire d'un code postal.

```typescript
import { getZone } from '@/services/tarificateur';

const zone = getZone("75001", "SANTE_SENIORS", tarifs.ZONES);
// Retourne: "Z02"
```

### calculateAge

Calcule l'âge à une date donnée.

```typescript
import { calculateAge } from '@/services/tarificateur';

const age = calculateAge(
  new Date("1958-03-15"),
  new Date("2025-02-01")
);
// Retourne: 66
```

### validateDevisInput

Valide les données d'entrée.

```typescript
import { validateDevisInput } from '@/services/tarificateur';

const errors = validateDevisInput(input);
if (errors.length > 0) {
  console.error("Erreurs de validation:", errors);
}
```

## Gestion des erreurs

Le module lance une erreur (`throw Error`) dans les cas suivants :
- Données invalides (code postal, dates, etc.)
- Zone non trouvée
- Produit non trouvé dans les tarifs
- Âge ou qualité non trouvés dans la grille

Utilisez un bloc try-catch pour gérer les erreurs :

```typescript
try {
  const devis = calculerDevis(input, tarifs);
} catch (error) {
  console.error("Erreur lors du calcul:", error.message);
}
```

## Notes importantes

1. Les tarifs sont en €/mois TTC
2. Le total est arrondi à 2 décimales
3. Les droits ACPS (1.50€/mois) sont inclus dans les tarifs
4. Le droit d'entrée (10.00€) est un frais unique non inclus dans le calcul mensuel
