/**
 * Exemples d'utilisation du calculateur de tarifs WALTERA
 *
 * Ce fichier contient des exemples d'utilisation du module tarificateur
 * pour différents cas d'usage typiques.
 *
 * NOTE: Ces exemples utilisent l'ancien calculateur in-memory
 * Les tarifs sont maintenant dans Supabase - voir calculatorSupabase.ts
 * TODO: Migrer ces exemples vers calculatorSupabase
 */

import { calculerDevis } from './calculator';
import type { DevisInput, TarifsData } from './types';
// import tarifs from '@/data/tarifs_waltera_v2.json';
const tarifs = {} as TarifsData; // Placeholder pour éviter erreur TS

/**
 * Exemple 1: Senior seul à Paris
 */
export function exempleGarcon() {
  const input: DevisInput = {
    gamme: "SANTE_SENIORS",
    codePostal: "75001",
    dateEffet: new Date("2025-02-01"),
    assure: {
      dateNaissance: new Date("1958-03-15") // 66 ans
    },
    option: 4,
    surcomplementaire: false,
    commission: 10
  };

  try {
    const devis = calculerDevis(input, tarifs as any);

    console.log('=== Devis Senior seul à Paris ===');
    console.log(`Produit: ${devis.produit}`);
    console.log(`Zone: ${devis.zone}`);
    console.log(`Tarif mensuel: ${devis.tarifMensuel}€\n`);

    console.log('Détails:');
    devis.details.forEach(detail => {
      console.log(`  ${detail.beneficiaire} (${detail.age} ans)`);
      console.log(`    - Tarif de base: ${detail.tarifBase}€`);
      console.log(`    - Total: ${detail.total}€`);
    });

    return devis;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

/**
 * Exemple 2: Famille TNS à Lyon avec surcomplémentaire
 */
export function exempleFamilleTNS() {
  const input: DevisInput = {
    gamme: "TNS_FORMULES",
    codePostal: "69001",
    dateEffet: new Date("2025-02-01"),
    assure: {
      dateNaissance: new Date("1983-06-20"), // 41 ans
      estSeul: false
    },
    conjoint: {
      dateNaissance: new Date("1985-09-10") // 39 ans
    },
    enfants: [
      { dateNaissance: new Date("2013-04-05") }, // 11 ans
      { dateNaissance: new Date("2017-11-22") }  // 7 ans
    ],
    option: 3,
    surcomplementaire: true,
    commission: 15
  };

  try {
    const devis = calculerDevis(input, tarifs as any);

    console.log('\n=== Devis Famille TNS à Lyon ===');
    console.log(`Produit: ${devis.produit}`);
    console.log(`Zone: ${devis.zone}`);
    console.log(`Tarif mensuel: ${devis.tarifMensuel}€\n`);

    console.log('Détails:');
    devis.details.forEach(detail => {
      console.log(`  ${detail.beneficiaire} (${detail.age} ans)`);
      console.log(`    - Tarif de base: ${detail.tarifBase}€`);
      console.log(`    - Surcomplémentaire: ${detail.tarifSurco}€`);
      console.log(`    - Total: ${detail.total}€`);
    });

    return devis;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

/**
 * Exemple 3: Couple Senior Plus en Alsace-Moselle avec renfort hospi
 */
export function exempleCoupleSeniorPlus() {
  const input: DevisInput = {
    gamme: "SANTE_SENIORS_PLUS",
    codePostal: "67000",
    dateEffet: new Date("2025-02-01"),
    assure: {
      dateNaissance: new Date("1953-01-10") // 72 ans
    },
    conjoint: {
      dateNaissance: new Date("1955-05-25") // 69 ans
    },
    option: 5,
    surcomplementaire: true,
    renfortHospi: true,
    commission: 20
  };

  try {
    const devis = calculerDevis(input, tarifs as any);

    console.log('\n=== Devis Couple Senior Plus Alsace-Moselle ===');
    console.log(`Produit: ${devis.produit}`);
    console.log(`Zone: ${devis.zone}`);
    console.log(`Tarif mensuel: ${devis.tarifMensuel}€\n`);

    console.log('Détails:');
    devis.details.forEach(detail => {
      console.log(`  ${detail.beneficiaire} (${detail.age} ans)`);
      console.log(`    - Tarif de base: ${detail.tarifBase}€`);
      console.log(`    - Surcomplémentaire: ${detail.tarifSurco}€`);
      console.log(`    - Renfort hospi: ${detail.tarifRenfort}€`);
      console.log(`    - Total: ${detail.total}€`);
    });

    return devis;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

/**
 * Exemple 4: TNS seul (sans conjoint ni enfants)
 */
export function exempleTNSSeul() {
  const input: DevisInput = {
    gamme: "TNS_FORMULES",
    codePostal: "44000",
    dateEffet: new Date("2025-02-01"),
    assure: {
      dateNaissance: new Date("1990-06-15"), // 34 ans
      estSeul: true // Qualité "Assuré seul"
    },
    option: 2,
    surcomplementaire: false,
    commission: 10
  };

  try {
    const devis = calculerDevis(input, tarifs as any);

    console.log('\n=== Devis TNS Seul ===');
    console.log(`Produit: ${devis.produit}`);
    console.log(`Zone: ${devis.zone}`);
    console.log(`Tarif mensuel: ${devis.tarifMensuel}€\n`);

    console.log('Détails:');
    devis.details.forEach(detail => {
      console.log(`  ${detail.beneficiaire} (${detail.age} ans)`);
      console.log(`    - Tarif de base: ${detail.tarifBase}€`);
      console.log(`    - Total: ${detail.total}€`);
    });

    return devis;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Exécuter les exemples si ce fichier est lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  exempleGarcon();
  exempleFamilleTNS();
  exempleCoupleSeniorPlus();
  exempleTNSSeul();
}
