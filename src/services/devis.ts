/**
 * Service layer pour la gestion des devis
 * Extrait la logique métier du composant DevisForm
 */

import type { DevisInput, DevisOutput } from './tarificateur/types';
import type { DemandeDevisData } from './tarificateur/supabase';

/**
 * Type pour les bénéficiaires dans une demande de devis
 */
export type BeneficiaireData = {
  type: 'assure' | 'conjoint' | 'enfant';
  prenom: string;
  nom: string;
  dateNaissance: string;
  age: number;
};

/**
 * Type pour les données du formulaire
 */
export interface DevisFormData {
  gamme: 'SANTE_SENIORS_PLUS' | 'SANTE_SENIORS' | 'TNS_FORMULES';
  codePostal: string;
  dateEffet: string;
  assurePrenom: string;
  assureNom: string;
  assureNaissance: string;
  assureEmail: string;
  assureSeul: boolean;
  conjointPrenom: string;
  conjointNom: string;
  conjointNaissance: string;
  enfants: Array<{ prenom: string; nom: string; dateNaissance: string }>;
  option: 1 | 2 | 3 | 4 | 5 | 6;
  surcomplementaire: boolean;
  renfortHospi: boolean;
  commission: 10 | 15 | 20;
  adresseComplete: string;
  rgpdConsent: boolean;
}

/**
 * Vérifie si une date est complète (format YYYY-MM-DD)
 */
export function isDateComplete(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/**
 * Vérifie si le formulaire est prêt pour le calcul du devis
 */
export function isFormReadyForCalculation(
  formData: DevisFormData,
  hasConjoint: boolean
): boolean {
  // Champs obligatoires de base
  if (
    !formData.gamme ||
    formData.codePostal.length !== 5 ||
    !formData.dateEffet ||
    !isDateComplete(formData.assureNaissance) ||
    !formData.rgpdConsent
  ) {
    return false;
  }

  // Vérifier que la date du conjoint est complète si un conjoint est présent
  if (hasConjoint && !isDateComplete(formData.conjointNaissance)) {
    return false;
  }

  return true;
}

/**
 * Vérifie si le formulaire est prêt pour l'enregistrement
 */
export function isFormReadyForSave(
  formData: DevisFormData,
  tarifMensuel: number
): boolean {
  return !!(
    formData.assurePrenom &&
    formData.assureNom &&
    formData.assureEmail &&
    formData.adresseComplete &&
    tarifMensuel > 0
  );
}

/**
 * Construit l'objet DevisInput à partir des données du formulaire
 */
export function buildDevisInput(
  formData: DevisFormData,
  hasConjoint: boolean
): DevisInput {
  return {
    gamme: formData.gamme,
    codePostal: formData.codePostal,
    dateEffet: new Date(formData.dateEffet),
    assure: {
      dateNaissance: new Date(formData.assureNaissance),
      estSeul: formData.gamme === 'TNS_FORMULES' ? formData.assureSeul : undefined,
    },
    // Inclure le conjoint SEULEMENT si sa date est complète
    conjoint: hasConjoint && isDateComplete(formData.conjointNaissance)
      ? { dateNaissance: new Date(formData.conjointNaissance) }
      : undefined,
    // Inclure les enfants SEULEMENT si leurs dates sont complètes
    enfants: formData.enfants
      .filter(e => isDateComplete(e.dateNaissance))
      .map(e => ({ dateNaissance: new Date(e.dateNaissance) })),
    option: formData.option,
    surcomplementaire: formData.surcomplementaire,
    renfortHospi: formData.gamme === 'SANTE_SENIORS_PLUS' ? formData.renfortHospi : undefined,
    commission: formData.commission,
  };
}

/**
 * Construit la liste des bénéficiaires avec leurs informations complètes
 */
export function buildBeneficiairesData(
  formData: DevisFormData,
  devisResult: DevisOutput,
  hasConjoint: boolean
): BeneficiaireData[] {
  const beneficiaires: BeneficiaireData[] = [
    {
      type: 'assure',
      prenom: formData.assurePrenom,
      nom: formData.assureNom,
      dateNaissance: formData.assureNaissance,
      age: devisResult.details.find(d => d.beneficiaire.includes('Assuré'))?.age || 0,
    },
  ];

  // Ajouter le conjoint si présent et complet
  if (
    hasConjoint &&
    formData.conjointPrenom &&
    formData.conjointNom &&
    isDateComplete(formData.conjointNaissance)
  ) {
    beneficiaires.push({
      type: 'conjoint',
      prenom: formData.conjointPrenom,
      nom: formData.conjointNom,
      dateNaissance: formData.conjointNaissance,
      age: devisResult.details.find(d => d.beneficiaire === 'Conjoint')?.age || 0,
    });
  }

  // Ajouter les enfants avec informations complètes
  formData.enfants
    .filter(e => e.prenom && e.nom && isDateComplete(e.dateNaissance))
    .forEach(enfant => {
      beneficiaires.push({
        type: 'enfant',
        prenom: enfant.prenom,
        nom: enfant.nom,
        dateNaissance: enfant.dateNaissance,
        age: devisResult.details.find(d => d.beneficiaire === 'Enfant')?.age || 0,
      });
    });

  return beneficiaires;
}

/**
 * Construit l'objet DemandeDevisData pour l'enregistrement en base
 */
export function buildDemandeDevisData(
  formData: DevisFormData,
  devisResult: DevisOutput,
  beneficiaires: BeneficiaireData[]
): DemandeDevisData {
  return {
    prenom: formData.assurePrenom,
    nom: formData.assureNom,
    email: formData.assureEmail,
    adresse: formData.adresseComplete,
    code_postal: formData.codePostal,
    rgpd_consent: formData.rgpdConsent,
    rgpd_consent_date: new Date(),
    gamme: formData.gamme,
    date_effet: new Date(formData.dateEffet),
    option_choisie: formData.option,
    surcomplementaire: formData.surcomplementaire,
    renfort_hospi: formData.renfortHospi,
    commission: formData.commission,
    tarif_mensuel: devisResult.tarifMensuel,
    produit: devisResult.produit,
    zone: devisResult.zone,
    beneficiaires,
    details_calcul: devisResult.details,
  };
}
