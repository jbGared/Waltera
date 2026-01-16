import type {
  DevisInput,
  DevisOutput,
  BeneficiaireDetail,
  Option,
} from './types';
import {
  getAgeBracket,
  calculateAge,
  getProduitName,
  getQualiteTNS,
} from './utils';
import { validateDevisInput } from './validator';
import {
  getZoneFromSupabase,
  getTarifsFromSupabase,
  tarifRowToEntry,
} from './supabase';

/**
 * Calcule un devis de complémentaire santé en utilisant Supabase
 * @throws {Error} Si les données sont invalides ou si les tarifs ne sont pas trouvés
 */
export async function calculerDevisSupabase(input: DevisInput): Promise<DevisOutput> {
  // 1. Valider les données d'entrée
  const validationErrors = validateDevisInput(input);
  if (validationErrors.length > 0) {
    throw new Error(
      'Données invalides:\n' +
      validationErrors.map(e => `- ${e.field}: ${e.message}`).join('\n')
    );
  }

  // 2. Déterminer le produit selon gamme + commission
  const produitName = getProduitName(input.gamme, input.commission);

  // 3. Déterminer la zone selon codePostal + gamme (depuis Supabase)
  const zone = await getZoneFromSupabase(input.codePostal, input.gamme);
  if (!zone) {
    throw new Error(`Zone non trouvée pour le code postal ${input.codePostal} et la gamme ${input.gamme}`);
  }

  // 4. Collecter tous les bénéficiaires et leurs attributs
  interface BeneficiaireInfo {
    type: string;
    qualite: string;
    age: number;
    ageBracket: string;
  }

  const beneficiaires: BeneficiaireInfo[] = [];

  // Déterminer si on a un conjoint et des enfants (pour TNS)
  const hasConjoint = !!input.conjoint;
  const hasEnfants = !!input.enfants && input.enfants.length > 0;

  // 4a. Assuré principal
  const ageAssure = calculateAge(input.assure.dateNaissance, input.dateEffet);
  const qualiteAssure = input.gamme === "TNS_FORMULES"
    ? getQualiteTNS(true, input.assure.estSeul || false, hasConjoint, hasEnfants)
    : "Assuré";
  const ageBracketAssure = getAgeBracket(ageAssure, qualiteAssure, input.gamme as any);

  beneficiaires.push({
    type: qualiteAssure,
    qualite: qualiteAssure,
    age: ageAssure,
    ageBracket: ageBracketAssure
  });

  // 4b. Conjoint
  if (input.conjoint) {
    const ageConjoint = calculateAge(input.conjoint.dateNaissance, input.dateEffet);
    const ageBracketConjoint = getAgeBracket(ageConjoint, "Conjoint", input.gamme as any);

    beneficiaires.push({
      type: "Conjoint",
      qualite: "Conjoint",
      age: ageConjoint,
      ageBracket: ageBracketConjoint
    });
  }

  // 4c. Enfants
  if (input.enfants) {
    for (let index = 0; index < input.enfants.length; index++) {
      const enfant = input.enfants[index];
      const ageEnfant = calculateAge(enfant.dateNaissance, input.dateEffet);
      const ageBracketEnfant = getAgeBracket(ageEnfant, "Enfant", input.gamme as any);

      beneficiaires.push({
        type: `Enfant ${index + 1}`,
        qualite: "Enfant",
        age: ageEnfant,
        ageBracket: ageBracketEnfant
      });
    }
  }

  // 5. Récupérer TOUS les tarifs en UNE SEULE requête batch
  const uniqueQualites = [...new Set(beneficiaires.map(b => b.qualite))];
  const uniqueAges = [...new Set(beneficiaires.map(b => b.ageBracket))];

  const tarifsRows = await getTarifsFromSupabase(
    input.gamme,
    produitName,
    zone,
    uniqueQualites,
    uniqueAges
  );

  // 6. Créer une map pour lookup O(1)
  const tarifsMap = new Map<string, ReturnType<typeof tarifRowToEntry>>();
  tarifsRows.forEach(row => {
    const key = `${row.qualite}_${row.age}`;
    tarifsMap.set(key, tarifRowToEntry(row));
  });

  // 7. Calculer les tarifs pour chaque bénéficiaire (sans requête DB)
  const details: BeneficiaireDetail[] = [];

  for (const benef of beneficiaires) {
    const key = `${benef.qualite}_${benef.ageBracket}`;
    const tarifEntry = tarifsMap.get(key);

    if (!tarifEntry) {
      throw new Error(
        `Tarif non trouvé pour: qualite="${benef.qualite}", age=${benef.ageBracket}`
      );
    }

    const tarifCalcule = calculerTarifFromEntry(
      tarifEntry,
      input.option,
      input.surcomplementaire,
      input.renfortHospi || false
    );

    details.push({
      beneficiaire: benef.type,
      age: benef.age,
      ...tarifCalcule
    });
  }

  // 8. Calculer le total
  const tarifMensuel = details.reduce((sum, detail) => sum + detail.total, 0);

  return {
    tarifMensuel: Math.round(tarifMensuel * 100) / 100, // Arrondir à 2 décimales
    produit: produitName,
    zone,
    details
  };
}

/**
 * Calcule le tarif à partir d'une TarifEntry (sans requête DB)
 */
function calculerTarifFromEntry(
  tarifEntry: ReturnType<typeof tarifRowToEntry>,
  option: Option,
  surcomplementaire: boolean,
  renfortHospi: boolean,
): Omit<BeneficiaireDetail, 'beneficiaire' | 'age'> {
  // 1. Tarif de base
  const tarifBase = tarifEntry.base[`option${option}` as keyof typeof tarifEntry.base];
  if (tarifBase === undefined || tarifBase === null) {
    throw new Error(`Option ${option} non trouvée dans les tarifs`);
  }

  // 2. Surcomplémentaire (option >= 3 uniquement)
  let tarifSurco = 0;
  if (surcomplementaire && option >= 3 && tarifEntry.surco) {
    tarifSurco = tarifEntry.surco[`option${option}` as keyof typeof tarifEntry.surco] || 0;
  }

  // 3. Renfort hospi
  let tarifRenfort = 0;
  if (renfortHospi && tarifEntry.renfort_hospi) {
    tarifRenfort = tarifEntry.renfort_hospi;
  }

  // 4. Total
  const total = tarifBase + tarifSurco + tarifRenfort;

  return {
    tarifBase: Math.round(tarifBase * 100) / 100,
    tarifSurco: Math.round(tarifSurco * 100) / 100,
    tarifRenfort: Math.round(tarifRenfort * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}
