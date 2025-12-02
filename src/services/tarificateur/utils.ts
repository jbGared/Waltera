import type { Gamme, Commission, TarifsData } from './types';

/**
 * Détermine la zone tarifaire en fonction du code postal et de la gamme
 */
export function getZone(
  codePostal: string,
  gamme: Gamme,
  zones: TarifsData["ZONES"]
): string | null {
  const dept = codePostal.substring(0, 2);

  if (gamme === "TNS_FORMULES") {
    for (const [zone, depts] of Object.entries(zones.TNS_ZONES)) {
      if (depts.includes(dept)) return zone;
    }
    return null;
  }

  // SENIORS / SENIORS_PLUS
  if (["57", "67", "68"].includes(dept)) return "AM";
  if (["13", "20", "31", "33", "69", "75", "77", "78", "91", "92", "93", "94", "95", "99"].includes(dept)) return "Z02";
  return "Z01";
}

/**
 * Détermine la tranche d'âge tarifaire
 */
export function getAgeBracket(age: number, qualite: string, gamme: Gamme): string {
  if (gamme === "TNS_FORMULES") {
    return age <= 19 ? "0-19" : age.toString();
  } else {
    // SENIORS / SENIORS_PLUS
    if (qualite === "Enfant") {
      return age <= 27 ? "0-27" : "28+";
    }
    // Pour âge >= 100, utiliser "100+"
    if (age >= 100) return "100+";
    return age < 60 ? "0-59" : age.toString();
  }
}

/**
 * Calcule l'âge à une date donnée
 */
export function calculateAge(dateNaissance: Date, dateEffet: Date): number {
  const age = dateEffet.getFullYear() - dateNaissance.getFullYear();
  const monthDiff = dateEffet.getMonth() - dateNaissance.getMonth();
  const dayDiff = dateEffet.getDate() - dateNaissance.getDate();

  // Ajuster si l'anniversaire n'est pas encore passé
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    return age - 1;
  }

  return age;
}

/**
 * Génère le nom du produit selon la gamme et la commission
 */
export function getProduitName(gamme: Gamme, commission: Commission): string {
  const suffix = commission === 10 ? "1" : commission === 15 ? "2" : "3";

  switch (gamme) {
    case "SANTE_SENIORS_PLUS":
      return `SANTE SENIOR PLUS 1219${suffix}`;
    case "SANTE_SENIORS":
      return `SANTE SENIOR 1214${suffix} RESPONSABLE`;
    case "TNS_FORMULES":
      return `CONTRASSUR TNS 1228${suffix} RESPONSABLE`;
  }
}

/**
 * Détermine la qualité du bénéficiaire pour TNS
 * Utilise "Assuré seul" si célibataire sans enfant, sinon "Assuré"
 */
export function getQualiteTNS(
  estAssure: boolean,
  estSeul: boolean,
  hasConjoint: boolean,
  hasEnfants: boolean
): string {
  if (estAssure) {
    if (estSeul && !hasConjoint && !hasEnfants) {
      return "Assuré seul";
    }
    return "Assuré";
  }
  return ""; // Sera déterminé par le contexte (Conjoint ou Enfant)
}

/**
 * Normalise le nom de la qualité (supprime les espaces trailing)
 */
export function normalizeQualite(qualite: string): string {
  return qualite.trim();
}
