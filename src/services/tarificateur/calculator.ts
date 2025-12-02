import type {
  DevisInput,
  DevisOutput,
  BeneficiaireDetail,
  TarifsData,
  TarifEntry,
  Option
} from './types';
import {
  getZone,
  getAgeBracket,
  calculateAge,
  getProduitName,
  getQualiteTNS,
  normalizeQualite
} from './utils';
import { validateDevisInput } from './validator';

/**
 * Calcule un devis de complémentaire santé
 * @throws {Error} Si les données sont invalides ou si les tarifs ne sont pas trouvés
 */
export function calculerDevis(input: DevisInput, tarifs: TarifsData): DevisOutput {
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

  // 3. Déterminer la zone selon codePostal + gamme
  const zone = getZone(input.codePostal, input.gamme, tarifs.ZONES);
  if (!zone) {
    throw new Error(`Zone non trouvée pour le code postal ${input.codePostal} et la gamme ${input.gamme}`);
  }

  // 4. Récupérer la grille tarifaire du produit
  const grilleProduit = tarifs[input.gamme][produitName];
  if (!grilleProduit) {
    throw new Error(`Produit non trouvé: ${produitName}`);
  }

  const grilleZone = grilleProduit[zone];
  if (!grilleZone) {
    throw new Error(`Zone ${zone} non trouvée pour le produit ${produitName}`);
  }

  // 5. Calculer le tarif pour chaque bénéficiaire
  const details: BeneficiaireDetail[] = [];

  // Déterminer si on a un conjoint et des enfants (pour TNS)
  const hasConjoint = !!input.conjoint;
  const hasEnfants = !!input.enfants && input.enfants.length > 0;

  // Assuré principal
  const ageAssure = calculateAge(input.assure.dateNaissance, input.dateEffet);
  const qualiteAssure = input.gamme === "TNS_FORMULES"
    ? getQualiteTNS(true, input.assure.estSeul || false, hasConjoint, hasEnfants)
    : "Assuré";

  const tarifAssure = calculerTarifBeneficiaire(
    qualiteAssure,
    ageAssure,
    input.option,
    input.surcomplementaire,
    input.renfortHospi || false,
    grilleZone,
    input.gamme
  );

  details.push({
    beneficiaire: qualiteAssure,
    age: ageAssure,
    ...tarifAssure
  });

  // Conjoint
  if (input.conjoint) {
    const ageConjoint = calculateAge(input.conjoint.dateNaissance, input.dateEffet);
    const tarifConjoint = calculerTarifBeneficiaire(
      "Conjoint",
      ageConjoint,
      input.option,
      input.surcomplementaire,
      input.renfortHospi || false,
      grilleZone,
      input.gamme
    );

    details.push({
      beneficiaire: "Conjoint",
      age: ageConjoint,
      ...tarifConjoint
    });
  }

  // Enfants
  if (input.enfants) {
    input.enfants.forEach((enfant, index) => {
      const ageEnfant = calculateAge(enfant.dateNaissance, input.dateEffet);
      const tarifEnfant = calculerTarifBeneficiaire(
        "Enfant",
        ageEnfant,
        input.option,
        input.surcomplementaire,
        input.renfortHospi || false,
        grilleZone,
        input.gamme
      );

      details.push({
        beneficiaire: `Enfant ${index + 1}`,
        age: ageEnfant,
        ...tarifEnfant
      });
    });
  }

  // 6. Calculer le total
  const tarifMensuel = details.reduce((sum, detail) => sum + detail.total, 0);

  return {
    tarifMensuel: Math.round(tarifMensuel * 100) / 100, // Arrondir à 2 décimales
    produit: produitName,
    zone,
    details
  };
}

/**
 * Calcule le tarif pour un bénéficiaire
 */
function calculerTarifBeneficiaire(
  qualite: string,
  age: number,
  option: Option,
  surcomplementaire: boolean,
  renfortHospi: boolean,
  grilleZone: any,
  gamme: string
): Omit<BeneficiaireDetail, 'beneficiaire' | 'age'> {
  // Déterminer la tranche d'âge
  const ageBracket = getAgeBracket(age, qualite, gamme as any);

  // Chercher le tarif dans la grille
  // Essayer d'abord avec la qualité exacte, puis avec normalisation
  let grilleQualite = grilleZone[qualite];

  if (!grilleQualite) {
    // Essayer avec normalisation (supprimer espaces)
    const qualiteNormalized = normalizeQualite(qualite);
    const qualitesDisponibles = Object.keys(grilleZone);
    const qualiteTrouvee = qualitesDisponibles.find(
      q => normalizeQualite(q) === qualiteNormalized
    );

    if (qualiteTrouvee) {
      grilleQualite = grilleZone[qualiteTrouvee];
    }
  }

  if (!grilleQualite) {
    throw new Error(
      `Qualité "${qualite}" non trouvée dans la grille. Qualités disponibles: ${Object.keys(grilleZone).join(', ')}`
    );
  }

  const tarifEntry: TarifEntry = grilleQualite[ageBracket];
  if (!tarifEntry) {
    throw new Error(
      `Tranche d'âge "${ageBracket}" non trouvée pour la qualité "${qualite}". Tranches disponibles: ${Object.keys(grilleQualite).join(', ')}`
    );
  }

  // Calculer le tarif de base
  const tarifBase = tarifEntry.base[`option${option}` as keyof typeof tarifEntry.base];
  if (tarifBase === undefined) {
    throw new Error(`Option ${option} non trouvée dans les tarifs`);
  }

  // Calculer la surcomplémentaire (uniquement si option >= 3)
  let tarifSurco = 0;
  if (surcomplementaire && option >= 3 && tarifEntry.surco) {
    tarifSurco = tarifEntry.surco[`option${option}` as keyof typeof tarifEntry.surco] || 0;
  }

  // Ajouter le renfort hospi (uniquement SENIORS_PLUS)
  let tarifRenfort = 0;
  if (renfortHospi && tarifEntry.renfort_hospi) {
    tarifRenfort = tarifEntry.renfort_hospi;
  }

  const total = tarifBase + tarifSurco + tarifRenfort;

  return {
    tarifBase: Math.round(tarifBase * 100) / 100,
    tarifSurco: Math.round(tarifSurco * 100) / 100,
    tarifRenfort: Math.round(tarifRenfort * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}
