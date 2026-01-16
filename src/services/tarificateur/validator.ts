import type { DevisInput, ValidationError } from './types';

/**
 * Valide les données d'entrée pour le calcul de devis
 */
export function validateDevisInput(input: DevisInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validation du code postal
  if (!input.codePostal || !/^\d{5}$/.test(input.codePostal)) {
    errors.push({
      field: 'codePostal',
      message: 'Le code postal doit contenir exactement 5 chiffres'
    });
  }

  // Validation de la surcomplémentaire (uniquement si option >= 3)
  if (input.surcomplementaire && input.option < 3) {
    errors.push({
      field: 'surcomplementaire',
      message: 'La surcomplémentaire est uniquement disponible pour les options 3 à 6'
    });
  }

  // Validation du renfort hospi (uniquement SANTE_SENIORS_PLUS)
  if (input.renfortHospi && input.gamme !== "SANTE_SENIORS_PLUS") {
    errors.push({
      field: 'renfortHospi',
      message: 'Le renfort hospitalisation est uniquement disponible pour la gamme SANTE_SENIORS_PLUS'
    });
  }

  // Validation TNS "Assuré seul" (uniquement si pas de conjoint ni enfants)
  if (input.gamme === "TNS_FORMULES" && input.assure.estSeul) {
    if (input.conjoint || (input.enfants && input.enfants.length > 0)) {
      errors.push({
        field: 'assure.estSeul',
        message: 'La qualité "Assuré seul" est uniquement valide sans conjoint ni enfants'
      });
    }
  }

  // Validation des dates
  if (!input.dateEffet || isNaN(input.dateEffet.getTime())) {
    errors.push({
      field: 'dateEffet',
      message: 'La date d\'effet est invalide'
    });
  }

  if (!input.assure.dateNaissance || isNaN(input.assure.dateNaissance.getTime())) {
    errors.push({
      field: 'assure.dateNaissance',
      message: 'La date de naissance de l\'assuré est invalide'
    });
  }

  if (input.conjoint && (!input.conjoint.dateNaissance || isNaN(input.conjoint.dateNaissance.getTime()))) {
    errors.push({
      field: 'conjoint.dateNaissance',
      message: 'La date de naissance du conjoint est invalide'
    });
  }

  if (input.enfants) {
    input.enfants.forEach((enfant, index) => {
      if (!enfant.dateNaissance || isNaN(enfant.dateNaissance.getTime())) {
        errors.push({
          field: `enfants[${index}].dateNaissance`,
          message: `La date de naissance de l'enfant ${index + 1} est invalide`
        });
      }
    });
  }

  // Validation que la date d'effet est postérieure aux dates de naissance
  if (input.dateEffet && input.assure.dateNaissance) {
    if (input.dateEffet < input.assure.dateNaissance) {
      errors.push({
        field: 'dateEffet',
        message: 'La date d\'effet doit être postérieure à la date de naissance de l\'assuré'
      });
    }
  }

  return errors;
}

/**
 * Vérifie si le code postal correspond à un département valide
 */
export function isValidDepartement(codePostal: string): boolean {
  const dept = codePostal.substring(0, 2);
  // Liste des départements français valides (01-95 + 2A/2B + DOM-TOM)
  const validDepts = [
    ...Array.from({ length: 95 }, (_, i) => (i + 1).toString().padStart(2, '0')),
    '2A', '2B', // Corse
    '97', '98', '99' // DOM-TOM
  ];

  return validDepts.includes(dept) || dept === '20'; // 20 pour Corse avant séparation
}
