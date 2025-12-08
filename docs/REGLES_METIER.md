# Règles métier - WALTERA Tarificateur Santé

## Introduction

Ce document détaille l'ensemble des règles métier applicables au calculateur de tarifs de complémentaires santé individuelles WALTERA.

---

## Gammes de produits

### 1. SANTE SENIORS PLUS (Haut de gamme)

**Caractéristiques :**
- Produit le plus complet
- Renfort hospitalisation disponible
- 3 niveaux de commission : 10%, 15%, 20%

**Codes produits :**
- `SANTE SENIOR PLUS 12191` (commission 10%)
- `SANTE SENIOR PLUS 12192` (commission 15%)
- `SANTE SENIOR PLUS 12193` (commission 20%)

**Zones tarifaires :**
- **Z01** : Départements de province (hors grandes villes)
- **Z02** : Grandes villes (Paris, Lyon, Marseille, etc.)
- **AM** : Alsace-Moselle (67, 68, 57)

**Bénéficiaires :**
- Assuré
- Conjoint
- Enfant(s)

---

### 2. SANTE SENIORS (Standard)

**Caractéristiques :**
- Produit standard
- Pas de renfort hospitalisation
- 3 niveaux de commission : 10%, 15%, 20%

**Codes produits :**
- `SANTE SENIOR 12141 RESPONSABLE` (commission 10%)
- `SANTE SENIOR 12142 RESPONSABLE` (commission 15%)
- `SANTE SENIOR 12143 RESPONSABLE` (commission 20%)

**Zones tarifaires :**
- **Z01** : Province
- **Z02** : Grandes villes
- **AM** : Alsace-Moselle

**Bénéficiaires :**
- Assuré
- Conjoint
- Enfant(s)

---

### 3. TNS FORMULES (Travailleurs Non Salariés)

**Caractéristiques :**
- Destiné aux TNS (artisans, commerçants, professions libérales)
- Pas de renfort hospitalisation
- 3 niveaux de commission : 10%, 15%, 20%

**Codes produits :**
- `CONTRASSUR TNS 12281 RESPONSABLE` (commission 10%)
- `CONTRASSUR TNS 12282 RESPONSABLE` (commission 15%)
- `CONTRASSUR TNS 12283 RESPONSABLE` (commission 20%)

**Zones tarifaires :**
- **Z01** à **Z05** (découpage plus fin que SENIORS)

**Bénéficiaires :**
- **Assuré seul** (si célibataire sans enfant)
- **Assuré** (si en couple ou avec enfants)
- Conjoint
- Enfant(s)

---

## Tranches d'âge

### Gammes SENIORS et SENIORS PLUS

#### Pour l'assuré et le conjoint
- **0-59 ans** : Tranche unique jusqu'à 59 ans
- **60 ans et +** : Tarif annuel (60, 61, 62, 63... jusqu'à 100+)

#### Pour les enfants
- **0-27 ans** : Tranche unique
- **28+ ans** : Tranche supérieure (enfants de plus de 28 ans)

**Exemple :**
```typescript
function getAgeBracketSeniors(age: number, qualite: string): string {
  if (qualite === 'Enfant') {
    return age <= 27 ? '0-27' : '28+';
  }
  return age < 60 ? '0-59' : age.toString();
}
```

---

### Gamme TNS

#### Pour tous les bénéficiaires (y compris enfants)
- **0-19 ans** : Tranche unique
- **20 ans et +** : Tarif annuel (20, 21, 22, 23... jusqu'à 100+)

**Exemple :**
```typescript
function getAgeBracketTNS(age: number): string {
  return age <= 19 ? '0-19' : age.toString();
}
```

---

## Qualité des bénéficiaires

### SENIORS et SENIORS PLUS

| Qualité  | Description                      | Nombre max |
|----------|----------------------------------|------------|
| Assuré   | Souscripteur principal           | 1          |
| Conjoint | Époux/épouse, concubin(e), PACS  | 1          |
| Enfant   | Enfant à charge (jusqu'à 28 ans) | Illimité   |

---

### TNS FORMULES

| Qualité      | Description                    | Condition                      |
|--------------|--------------------------------|--------------------------------|
| Assuré seul  | TNS célibataire sans enfant    | Aucun conjoint ni enfant       |
| Assuré       | TNS en couple ou avec enfants  | Au moins 1 conjoint ou enfant  |
| Conjoint     | Époux/épouse, concubin(e), PACS| -                              |
| Enfant       | Enfant à charge (jusqu'à 19 ans)| -                             |

**Règle importante :**
> Utiliser "Assuré seul" uniquement si le TNS n'a ni conjoint ni enfant.
> Sinon, utiliser "Assuré".

---

## Options de garanties

### Options disponibles (1 à 6)

| Option | Niveau      | Description                        |
|--------|-------------|------------------------------------|
| 1      | Économique  | Garanties minimales                |
| 2      | Confort     | Garanties intermédiaires           |
| 3      | Confort +   | Bonnes garanties                   |
| 4      | Premium     | Très bonnes garanties              |
| 5      | Premium +   | Garanties élevées                  |
| 6      | Excellence  | Garanties maximales                |

**Colonnes tarifaires :**
- `option1`, `option2`, `option3`, `option4`, `option5`, `option6`

---

### Surcomplémentaire

**Disponibilité :**
- Uniquement pour les options **3, 4, 5, 6**
- Non disponible pour options 1 et 2

**Colonnes tarifaires :**
- `surco_option3`, `surco_option4`, `surco_option5`, `surco_option6`

**Calcul :**
```typescript
if (surcomplementaire && option >= 3) {
  tarifTotal += row[`surco_option${option}`];
}
```

---

### Renfort Hospitalisation

**Disponibilité :**
- **Uniquement pour SANTE SENIORS PLUS**
- Non disponible pour SANTE SENIORS ni TNS

**Colonne tarifaire :**
- `renfort_hospi`

**Calcul :**
```typescript
if (renfortHospi && gamme === 'SANTE_SENIORS_PLUS') {
  tarifTotal += row.renfort_hospi;
}
```

---

## Zones géographiques

### Mapping département → zone

La zone tarifaire est déterminée par le **code postal** (2 premiers chiffres = département).

#### Zones SENIORS (Z01, Z02, AM)

**Z01 - Province :**
- Tous les départements hors Z02 et AM

**Z02 - Grandes villes :**
- 75 (Paris)
- 69 (Lyon)
- 13 (Marseille)
- 31 (Toulouse)
- 33 (Bordeaux)
- 44 (Nantes)
- 59 (Lille)
- 06 (Nice)
- 34 (Montpellier)
- 35 (Rennes)

**AM - Alsace-Moselle :**
- 67 (Bas-Rhin)
- 68 (Haut-Rhin)
- 57 (Moselle)

---

#### Zones TNS (Z01 à Z05)

Découpage plus fin avec 5 zones. Exemples :

- **Z01** : Départements ruraux (01, 02, 03, 04...)
- **Z02** : Départements semi-urbains
- **Z03** : Grandes métropoles régionales (69...)
- **Z04** : Très grandes villes
- **Z05** : Paris et petite couronne

> Consulter la table `zones_sante` pour le mapping exact.

---

## Calcul du tarif

### Formule générale

```
Tarif total = Tarif de base (option)
            + Surcomplémentaire (si activée et option ≥ 3)
            + Renfort Hospi (si activé et gamme = SENIORS PLUS)
```

### Algorithme de calcul

```typescript
async function calculerDevis(input: DevisInput): Promise<DevisOutput> {
  // 1. Déterminer la zone
  const zone = await getZone(input.codePostal, input.gamme);

  // 2. Déterminer le nom du produit
  const produit = getProduitName(input.gamme, input.commission);

  // 3. Pour chaque bénéficiaire
  const details = [];
  for (const benef of input.beneficiaires) {
    // a. Calculer l'âge à la date d'effet
    const age = calculateAge(benef.dateNaissance, input.dateEffet);

    // b. Déterminer la qualité
    const qualite = getQualite(benef.type, input.gamme, input.estSeul);

    // c. Déterminer la tranche d'âge
    const ageBracket = getAgeBracket(age, qualite, input.gamme);

    // d. Rechercher le tarif dans Supabase
    const row = await getTarif(input.gamme, produit, zone, qualite, ageBracket);

    // e. Calculer le tarif
    const tarifBase = row[`option${input.option}`];
    let tarifSurco = 0;
    let tarifRenfort = 0;

    if (input.surcomplementaire && input.option >= 3) {
      tarifSurco = row[`surco_option${input.option}`];
    }

    if (input.renfortHospi && input.gamme === 'SANTE_SENIORS_PLUS') {
      tarifRenfort = row.renfort_hospi;
    }

    const total = tarifBase + tarifSurco + tarifRenfort;

    details.push({ type: qualite, age, tarifBase, tarifSurco, tarifRenfort, total });
  }

  // 4. Somme totale
  const tarifMensuel = details.reduce((sum, d) => sum + d.total, 0);

  return { tarifMensuel, details };
}
```

---

## Calcul de l'âge

### Règle

L'âge est calculé à la **date d'effet du contrat**, pas à la date du jour.

### Algorithme

```typescript
function calculateAge(dateNaissance: Date, dateEffet: Date): number {
  let age = dateEffet.getFullYear() - dateNaissance.getFullYear();

  const monthDiff = dateEffet.getMonth() - dateNaissance.getMonth();
  const dayDiff = dateEffet.getDate() - dateNaissance.getDate();

  // Si l'anniversaire n'est pas encore passé, on enlève 1 an
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
}
```

**Exemples :**
- Date de naissance : 15/03/1958
- Date d'effet : 01/02/2025
- Âge = 2025 - 1958 - 1 = **66 ans** (anniversaire pas encore passé)

---

## Frais additionnels

### Droits ACPS

**Montant :** 1,50 € / mois

**Caractéristiques :**
- Déjà inclus dans les tarifs de la table `tarifs_sante`
- Pas de calcul supplémentaire à faire

---

### Droit d'entrée

**Montant :** 10,00 € (unique)

**Caractéristiques :**
- Payé une seule fois à la souscription
- Non mensuel
- Non inclus dans le tarif mensuel affiché

---

## Validations

### Code postal

```typescript
function validateCodePostal(codePostal: string): boolean {
  // Doit être 5 chiffres
  if (!/^\d{5}$/.test(codePostal)) {
    return false;
  }

  // Le département doit exister dans zones_sante
  const dept = codePostal.substring(0, 2);
  // Vérifier en base...

  return true;
}
```

**Cas particuliers :**
- Corse : 2A (20001-20199), 2B (20200-20999)
- Monaco : 98000 (considéré comme 06)
- DOM-TOM : non supportés actuellement

---

### Âge

**Règles :**
- Âge minimum : 0 an (nouveau-né)
- Âge maximum : 100+ ans (utiliser la tranche "100+")

**Validation enfant :**
- SENIORS : jusqu'à 28 ans inclus
- TNS : jusqu'à 19 ans inclus

```typescript
function validateAge(age: number, qualite: string, gamme: string): boolean {
  if (qualite === 'Enfant') {
    if (gamme === 'TNS_FORMULES') {
      return age <= 19;
    } else {
      return age <= 28;
    }
  }
  return age >= 0 && age <= 100;
}
```

---

### Options

**Règles :**
- Option : entre 1 et 6
- Surcomplémentaire : uniquement si option ≥ 3
- Renfort Hospi : uniquement si gamme = SANTE_SENIORS_PLUS

```typescript
function validateOptions(input: DevisInput): string[] {
  const errors = [];

  if (input.option < 1 || input.option > 6) {
    errors.push('Option invalide (doit être entre 1 et 6)');
  }

  if (input.surcomplementaire && input.option < 3) {
    errors.push('Surcomplémentaire disponible uniquement pour options 3-6');
  }

  if (input.renfortHospi && input.gamme !== 'SANTE_SENIORS_PLUS') {
    errors.push('Renfort Hospi disponible uniquement pour SANTE SENIORS PLUS');
  }

  return errors;
}
```

---

## Exemples de calculs

### Exemple 1 : Senior seul Paris

**Input :**
- Gamme : SANTE_SENIORS
- Code postal : 75001 → Zone Z02
- Commission : 10% → Produit "SANTE SENIOR 12141 RESPONSABLE"
- Date d'effet : 01/02/2025
- Assuré : né le 15/03/1958 → 66 ans
- Option : 4
- Surcomplémentaire : Non
- Renfort Hospi : Non

**Recherche :**
```sql
SELECT * FROM tarifs_sante
WHERE gamme = 'SANTE_SENIORS'
  AND produit = 'SANTE SENIOR 12141 RESPONSABLE'
  AND zone = 'Z02'
  AND qualite = 'Assuré'
  AND age = '66';
```

**Calcul :**
- Tarif base (option4) : 125,50 €
- Surco : 0 €
- Renfort : 0 €
- **Total : 125,50 € / mois**

---

### Exemple 2 : Famille TNS Lyon

**Input :**
- Gamme : TNS_FORMULES
- Code postal : 69001 → Zone Z03
- Commission : 15% → Produit "CONTRASSUR TNS 12282 RESPONSABLE"
- Date d'effet : 01/02/2025
- Assuré : né le 20/06/1983 → 41 ans
- Conjoint : né le 10/09/1985 → 39 ans
- Enfant 1 : né le 05/04/2013 → 11 ans → 0-19
- Enfant 2 : né le 22/11/2017 → 7 ans → 0-19
- Option : 3
- Surcomplémentaire : Oui
- Renfort Hospi : Non

**Calcul :**

| Bénéficiaire | Qualité  | Âge | Base | Surco | Total  |
|--------------|----------|-----|------|-------|--------|
| Assuré       | Assuré   | 41  | 85€  | 15€   | 100€   |
| Conjoint     | Conjoint | 39  | 80€  | 15€   | 95€    |
| Enfant 1     | Enfant   | 0-19| 25€  | 5€    | 30€    |
| Enfant 2     | Enfant   | 0-19| 25€  | 5€    | 30€    |

**Total : 255 € / mois**

---

### Exemple 3 : Senior Plus Alsace avec Renfort

**Input :**
- Gamme : SANTE_SENIORS_PLUS
- Code postal : 67000 → Zone AM
- Commission : 20% → Produit "SANTE SENIOR PLUS 12193"
- Date d'effet : 01/02/2025
- Assuré : né le 10/01/1953 → 72 ans
- Conjoint : né le 25/05/1955 → 69 ans
- Option : 5
- Surcomplémentaire : Oui
- Renfort Hospi : Oui

**Calcul :**

| Bénéficiaire | Qualité  | Âge | Base  | Surco | Renfort | Total  |
|--------------|----------|-----|-------|-------|---------|--------|
| Assuré       | Assuré   | 72  | 180€  | 30€   | 20€     | 230€   |
| Conjoint     | Conjoint | 69  | 165€  | 28€   | 20€     | 213€   |

**Total : 443 € / mois**

---

## Cas particuliers

### 1. TNS célibataire sans enfant

**Règle :** Utiliser la qualité "Assuré seul" au lieu de "Assuré"

```typescript
const qualite = (gamme === 'TNS_FORMULES' && estSeul)
  ? 'Assuré seul'
  : 'Assuré';
```

---

### 2. Enfant de plus de 28 ans (SENIORS)

**Règle :** Utiliser la tranche "28+"

```typescript
const ageBracket = (qualite === 'Enfant' && age > 27)
  ? '28+'
  : getAgeBracket(age, qualite, gamme);
```

---

### 3. Personne de 100 ans ou plus

**Règle :** Utiliser la tranche "100+"

```typescript
const ageBracket = age >= 100 ? '100+' : age.toString();
```

---

### 4. Alsace-Moselle (zone AM)

**Départements concernés :**
- 57 (Moselle)
- 67 (Bas-Rhin)
- 68 (Haut-Rhin)

**Particularité :** Tarifs différents (régime local de sécurité sociale)

---

## Glossaire

| Terme               | Définition                                                   |
|---------------------|--------------------------------------------------------------|
| Assuré              | Souscripteur principal du contrat                            |
| Conjoint            | Époux/épouse, concubin(e), personne pacsée                   |
| Enfant à charge     | Enfant de moins de 28 ans (SENIORS) ou 19 ans (TNS)         |
| Option              | Niveau de garantie (1 à 6)                                   |
| Surcomplémentaire   | Garantie additionnelle (options 3-6 uniquement)              |
| Renfort Hospi       | Garantie renforcée hospitalisation (SENIORS PLUS uniquement) |
| Zone tarifaire      | Découpage géographique pour la tarification                 |
| Tranche d'âge       | Fourchette d'âge pour la tarification (ex: 0-59, 60, 61...) |
| ACPS                | Association pour la Carte Professionnelle Santé              |
| TNS                 | Travailleur Non Salarié                                      |

---

**Version** : 1.0
**Date** : Décembre 2025
