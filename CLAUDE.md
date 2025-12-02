# CLAUDE.md - Calculateur Tarifs Santé WALTERA

## Contexte

Intégration d'un calculateur de tarifs de complémentaire santé individuelle pour WALTERA (courtier en assurance). Les données tarifaires sont stockées dans **Supabase**.

## Tables Supabase

### Table `tarifs_sante` (5868 lignes)

```sql
CREATE TABLE tarifs_sante (
  id SERIAL PRIMARY KEY,
  gamme TEXT NOT NULL,        -- 'SANTE_SENIORS_PLUS', 'SANTE_SENIORS', 'TNS_FORMULES'
  produit TEXT NOT NULL,      -- 'SANTE SENIOR PLUS 12191', etc.
  zone TEXT NOT NULL,         -- 'Z01', 'Z02', 'AM', etc.
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
```

### Table `zones_sante` (199 lignes)

```sql
CREATE TABLE zones_sante (
  id SERIAL PRIMARY KEY,
  type_zone TEXT NOT NULL,    -- 'SENIORS' ou 'TNS'
  code_zone TEXT NOT NULL,    -- 'Z01', 'Z02', 'AM', etc.
  departement TEXT NOT NULL   -- '01', '02', '75', etc.
);
```

## Règles métier

### Produits disponibles

| Gamme | Produits (par commission) | Zones |
|-------|---------------------------|-------|
| SANTE_SENIORS_PLUS | 12191 (10%), 12192 (15%), 12193 (20%) | Z01, Z02, AM |
| SANTE_SENIORS | 12141 (10%), 12142 (15%), 12143 (20%) | Z01, Z02, AM |
| TNS_FORMULES | 12281 (10%), 12282 (15%), 12283 (20%) | Z01-Z05 |

### Qualités des bénéficiaires

| Gamme | Qualités |
|-------|----------|
| SENIORS / SENIORS_PLUS | "Assuré", "Conjoint", "Enfant" |
| TNS | "Assuré seul", "Assuré", "Conjoint", "Enfant" |

**Règle TNS** : Utiliser "Assuré seul" si célibataire sans enfant, sinon "Assuré".

### Tranches d'âge

```typescript
function getAgeBracket(age: number, qualite: string, gamme: string): string {
  if (gamme === "TNS_FORMULES") {
    return age <= 19 ? "0-19" : age.toString();
  } else {
    // SENIORS / SENIORS_PLUS
    if (qualite === "Enfant") {
      return age <= 27 ? "0-27" : "28+";
    }
    return age < 60 ? "0-59" : age.toString();
  }
}
```

### Options et surcomplémentaire

- 6 options disponibles (1 = économique → 6 = premium)
- Surcomplémentaire : disponible uniquement options 3-6
- Renfort Hospi : uniquement SANTE_SENIORS_PLUS

## Implémentation Supabase

### Fonction de recherche de zone

```typescript
async function getZone(
  supabase: SupabaseClient,
  codePostal: string,
  gamme: string
): Promise<string | null> {
  const dept = codePostal.substring(0, 2);
  const typeZone = gamme === "TNS_FORMULES" ? "TNS" : "SENIORS";
  
  const { data, error } = await supabase
    .from('zones_sante')
    .select('code_zone')
    .eq('type_zone', typeZone)
    .eq('departement', dept)
    .single();
  
  if (error || !data) return null;
  return data.code_zone;
}
```

### Fonction de recherche de tarif

```typescript
async function getTarif(
  supabase: SupabaseClient,
  gamme: string,
  produit: string,
  zone: string,
  qualite: string,
  age: string
): Promise<TarifRow | null> {
  const { data, error } = await supabase
    .from('tarifs_sante')
    .select('*')
    .eq('gamme', gamme)
    .eq('produit', produit)
    .eq('zone', zone)
    .eq('qualite', qualite)
    .eq('age', age)
    .single();
  
  if (error || !data) return null;
  return data;
}
```

### Noms des produits

```typescript
function getProduitName(gamme: string, commission: number): string {
  const suffix = commission === 10 ? "1" : commission === 15 ? "2" : "3";
  
  switch (gamme) {
    case "SANTE_SENIORS_PLUS":
      return `SANTE SENIOR PLUS 1219${suffix}`;
    case "SANTE_SENIORS":
      return `SANTE SENIOR 1214${suffix} RESPONSABLE`;
    case "TNS_FORMULES":
      return `CONTRASSUR TNS 1228${suffix} RESPONSABLE`;
    default:
      throw new Error(`Gamme inconnue: ${gamme}`);
  }
}
```

### Calcul du tarif d'un bénéficiaire

```typescript
interface TarifResult {
  tarifBase: number;
  tarifSurco: number;
  tarifRenfort: number;
  total: number;
}

function calculerTarifBeneficiaire(
  row: TarifRow,
  option: number,
  withSurco: boolean,
  withRenfort: boolean
): TarifResult {
  const optionKey = `option${option}` as keyof TarifRow;
  const surcoKey = `surco_option${option}` as keyof TarifRow;
  
  const tarifBase = Number(row[optionKey]) || 0;
  
  let tarifSurco = 0;
  if (withSurco && option >= 3) {
    tarifSurco = Number(row[surcoKey]) || 0;
  }
  
  let tarifRenfort = 0;
  if (withRenfort && row.renfort_hospi) {
    tarifRenfort = Number(row.renfort_hospi);
  }
  
  return {
    tarifBase,
    tarifSurco,
    tarifRenfort,
    total: tarifBase + tarifSurco + tarifRenfort
  };
}
```

## Interface de calcul complet

```typescript
interface Beneficiaire {
  type: 'assure' | 'conjoint' | 'enfant';
  dateNaissance: Date;
}

interface DevisInput {
  gamme: 'SANTE_SENIORS_PLUS' | 'SANTE_SENIORS' | 'TNS_FORMULES';
  codePostal: string;
  dateEffet: Date;
  beneficiaires: Beneficiaire[];
  estSeul?: boolean;        // Pour TNS sans famille
  option: 1 | 2 | 3 | 4 | 5 | 6;
  surcomplementaire: boolean;
  renfortHospi?: boolean;   // SENIORS_PLUS uniquement
  commission: 10 | 15 | 20;
}

interface DevisDetail {
  type: string;
  age: number;
  tarifBase: number;
  tarifSurco: number;
  tarifRenfort: number;
  total: number;
}

interface DevisOutput {
  tarifMensuel: number;
  details: DevisDetail[];
}

async function calculerDevis(
  supabase: SupabaseClient,
  input: DevisInput
): Promise<DevisOutput> {
  // 1. Déterminer zone et produit
  const zone = await getZone(supabase, input.codePostal, input.gamme);
  if (!zone) throw new Error('Département non couvert');
  
  const produit = getProduitName(input.gamme, input.commission);
  
  // 2. Calculer pour chaque bénéficiaire
  const details: DevisDetail[] = [];
  
  for (const benef of input.beneficiaires) {
    // Calculer l'âge
    const age = calculateAge(benef.dateNaissance, input.dateEffet);
    
    // Déterminer la qualité
    let qualite: string;
    if (benef.type === 'assure') {
      qualite = (input.gamme === 'TNS_FORMULES' && input.estSeul) 
        ? 'Assuré seul' 
        : 'Assuré';
    } else if (benef.type === 'conjoint') {
      qualite = 'Conjoint';
    } else {
      qualite = 'Enfant';
    }
    
    // Déterminer la tranche d'âge
    const ageBracket = getAgeBracket(age, qualite, input.gamme);
    
    // Chercher le tarif
    const row = await getTarif(supabase, input.gamme, produit, zone, qualite, ageBracket);
    if (!row) throw new Error(`Tarif non trouvé pour ${qualite} ${age} ans`);
    
    // Calculer
    const result = calculerTarifBeneficiaire(
      row,
      input.option,
      input.surcomplementaire,
      input.renfortHospi && input.gamme === 'SANTE_SENIORS_PLUS'
    );
    
    details.push({
      type: qualite,
      age,
      ...result
    });
  }
  
  // 3. Total
  const tarifMensuel = details.reduce((sum, d) => sum + d.total, 0);
  
  return { tarifMensuel: Math.round(tarifMensuel * 100) / 100, details };
}

function calculateAge(dateNaissance: Date, dateEffet: Date): number {
  let age = dateEffet.getFullYear() - dateNaissance.getFullYear();
  const m = dateEffet.getMonth() - dateNaissance.getMonth();
  if (m < 0 || (m === 0 && dateEffet.getDate() < dateNaissance.getDate())) {
    age--;
  }
  return age;
}
```

## Tests

### Cas 1 : Senior seul Paris

```typescript
const input1: DevisInput = {
  gamme: 'SANTE_SENIORS',
  codePostal: '75001',  // → Z02
  dateEffet: new Date('2025-02-01'),
  beneficiaires: [{ type: 'assure', dateNaissance: new Date('1958-03-15') }], // 66 ans
  option: 4,
  surcomplementaire: false,
  commission: 10
};
// Requête : gamme=SANTE_SENIORS, produit=SANTE SENIOR 12141 RESPONSABLE, zone=Z02, qualite=Assuré, age=66
```

### Cas 2 : Famille TNS Lyon

```typescript
const input2: DevisInput = {
  gamme: 'TNS_FORMULES',
  codePostal: '69001',  // → Z03
  dateEffet: new Date('2025-02-01'),
  beneficiaires: [
    { type: 'assure', dateNaissance: new Date('1983-06-20') },  // 41 ans
    { type: 'conjoint', dateNaissance: new Date('1985-09-10') }, // 39 ans
    { type: 'enfant', dateNaissance: new Date('2013-04-05') },   // 11 ans → 0-19
    { type: 'enfant', dateNaissance: new Date('2017-11-22') }    // 7 ans → 0-19
  ],
  estSeul: false,
  option: 3,
  surcomplementaire: true,
  commission: 15
};
```

### Cas 3 : Senior Plus Alsace-Moselle

```typescript
const input3: DevisInput = {
  gamme: 'SANTE_SENIORS_PLUS',
  codePostal: '67000',  // → AM
  dateEffet: new Date('2025-02-01'),
  beneficiaires: [
    { type: 'assure', dateNaissance: new Date('1953-01-10') },  // 72 ans
    { type: 'conjoint', dateNaissance: new Date('1955-05-25') } // 69 ans
  ],
  option: 5,
  surcomplementaire: true,
  renfortHospi: true,
  commission: 20
};
```

## Validation

- [ ] Code postal : 5 chiffres, département existant dans `zones_sante`
- [ ] Surcomplémentaire : uniquement si option >= 3
- [ ] Renfort Hospi : uniquement si gamme = SANTE_SENIORS_PLUS
- [ ] TNS "Assuré seul" : uniquement si pas de conjoint ni enfants
- [ ] Âge max : utiliser "100+" si âge >= 100

## Optimisation

Pour éviter les requêtes multiples, utiliser une seule requête avec `in` :

```typescript
const ages = beneficiaires.map(b => getAgeBracket(...));
const qualites = beneficiaires.map(b => getQualite(...));

const { data } = await supabase
  .from('tarifs_sante')
  .select('*')
  .eq('gamme', gamme)
  .eq('produit', produit)
  .eq('zone', zone)
  .in('qualite', [...new Set(qualites)])
  .in('age', [...new Set(ages)]);
```

## Frais additionnels (informatif)

- Droits ACPS : 1.50 €/mois (inclus dans tarifs)
- Droit d'entrée : 10.00 € (unique, à la souscription)
