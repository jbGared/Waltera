import { describe, it, expect, beforeAll } from 'vitest';
import { calculerDevis } from './calculator';
import type { DevisInput, TarifsData } from './types';

// Importer les tarifs
let tarifs: TarifsData;

beforeAll(async () => {
  // NOTE: Ces tests utilisent l'ancien calculateur in-memory
  // Les tarifs sont maintenant dans Supabase - voir calculatorSupabase.ts
  // TODO: Migrer ces tests vers calculatorSupabase
  // const response = await import('../../data/tarifs_waltera_v2.json');
  // tarifs = response.default as TarifsData;
  tarifs = {} as TarifsData; // Placeholder pour éviter erreur TS
});

describe('Calculateur de tarifs - Cas de test', () => {
  describe('Cas 1: Senior seul Paris', () => {
    it('devrait calculer le tarif pour un senior seul à Paris', () => {
      const input: DevisInput = {
        gamme: "SANTE_SENIORS",
        codePostal: "75001", // → Z02
        dateEffet: new Date("2025-02-01"),
        assure: { dateNaissance: new Date("1958-03-15") }, // 66 ans
        option: 4,
        surcomplementaire: false,
        commission: 10
      };

      const result = calculerDevis(input, tarifs);

      expect(result).toBeDefined();
      expect(result.produit).toBe("SANTE SENIOR 12141 RESPONSABLE");
      expect(result.zone).toBe("Z02");
      expect(result.details).toHaveLength(1);
      expect(result.details[0].beneficiaire).toBe("Assuré");
      expect(result.details[0].age).toBe(66);
      expect(result.tarifMensuel).toBeGreaterThan(0);
      expect(result.tarifMensuel).toBe(result.details[0].total);
    });
  });

  describe('Cas 2: Famille TNS Lyon', () => {
    it('devrait calculer le tarif pour une famille TNS à Lyon avec surcomplémentaire', () => {
      const input: DevisInput = {
        gamme: "TNS_FORMULES",
        codePostal: "69001", // → Z03
        dateEffet: new Date("2025-02-01"),
        assure: { dateNaissance: new Date("1983-06-20"), estSeul: false }, // 41 ans
        conjoint: { dateNaissance: new Date("1985-09-10") }, // 39 ans
        enfants: [
          { dateNaissance: new Date("2013-04-05") }, // 11 ans
          { dateNaissance: new Date("2017-11-22") }  // 7 ans
        ],
        option: 3,
        surcomplementaire: true,
        commission: 15
      };

      const result = calculerDevis(input, tarifs);

      expect(result).toBeDefined();
      expect(result.produit).toBe("CONTRASSUR TNS 12282 RESPONSABLE");
      expect(result.zone).toBe("Z03");
      expect(result.details).toHaveLength(4);

      // Vérifier l'assuré
      expect(result.details[0].beneficiaire).toBe("Assuré");
      expect(result.details[0].age).toBe(41);
      expect(result.details[0].tarifSurco).toBeGreaterThan(0);

      // Vérifier le conjoint
      expect(result.details[1].beneficiaire).toBe("Conjoint");
      expect(result.details[1].age).toBe(39);
      expect(result.details[1].tarifSurco).toBeGreaterThan(0);

      // Vérifier les enfants
      expect(result.details[2].beneficiaire).toBe("Enfant 1");
      expect(result.details[2].age).toBe(11);

      expect(result.details[3].beneficiaire).toBe("Enfant 2");
      expect(result.details[3].age).toBe(7);

      // Le total doit être la somme des 4 bénéficiaires
      const totalCalcule = result.details.reduce((sum, d) => sum + d.total, 0);
      expect(result.tarifMensuel).toBeCloseTo(totalCalcule, 2);
    });
  });

  describe('Cas 3: Senior Plus Alsace-Moselle', () => {
    it('devrait calculer le tarif pour un couple senior plus en Alsace-Moselle avec surco et renfort hospi', () => {
      const input: DevisInput = {
        gamme: "SANTE_SENIORS_PLUS",
        codePostal: "67000", // → AM
        dateEffet: new Date("2025-02-01"),
        assure: { dateNaissance: new Date("1953-01-10") }, // 72 ans
        conjoint: { dateNaissance: new Date("1955-05-25") }, // 69 ans
        option: 5,
        surcomplementaire: true,
        renfortHospi: true,
        commission: 20
      };

      const result = calculerDevis(input, tarifs);

      expect(result).toBeDefined();
      expect(result.produit).toBe("SANTE SENIOR PLUS 12193");
      expect(result.zone).toBe("AM");
      expect(result.details).toHaveLength(2);

      // Vérifier l'assuré
      expect(result.details[0].beneficiaire).toBe("Assuré");
      expect(result.details[0].age).toBe(72);
      expect(result.details[0].tarifSurco).toBeGreaterThan(0);
      expect(result.details[0].tarifRenfort).toBeGreaterThan(0);

      // Vérifier le conjoint
      expect(result.details[1].beneficiaire).toBe("Conjoint");
      expect(result.details[1].age).toBe(69);
      expect(result.details[1].tarifSurco).toBeGreaterThan(0);
      expect(result.details[1].tarifRenfort).toBeGreaterThan(0);

      // Le total doit être la somme des 2 bénéficiaires
      const totalCalcule = result.details.reduce((sum, d) => sum + d.total, 0);
      expect(result.tarifMensuel).toBeCloseTo(totalCalcule, 2);
    });
  });
});

describe('Validations', () => {
  it('devrait rejeter un code postal invalide', () => {
    const input: DevisInput = {
      gamme: "SANTE_SENIORS",
      codePostal: "123", // Invalide
      dateEffet: new Date("2025-02-01"),
      assure: { dateNaissance: new Date("1958-03-15") },
      option: 4,
      surcomplementaire: false,
      commission: 10
    };

    expect(() => calculerDevis(input, tarifs)).toThrow();
  });

  it('devrait rejeter la surcomplémentaire si option < 3', () => {
    const input: DevisInput = {
      gamme: "SANTE_SENIORS",
      codePostal: "75001",
      dateEffet: new Date("2025-02-01"),
      assure: { dateNaissance: new Date("1958-03-15") },
      option: 2,
      surcomplementaire: true, // Invalide pour option 2
      commission: 10
    };

    expect(() => calculerDevis(input, tarifs)).toThrow(/surcomplémentaire/i);
  });

  it('devrait rejeter le renfort hospi si gamme != SANTE_SENIORS_PLUS', () => {
    const input: DevisInput = {
      gamme: "SANTE_SENIORS",
      codePostal: "75001",
      dateEffet: new Date("2025-02-01"),
      assure: { dateNaissance: new Date("1958-03-15") },
      option: 4,
      surcomplementaire: false,
      renfortHospi: true, // Invalide pour SANTE_SENIORS
      commission: 10
    };

    expect(() => calculerDevis(input, tarifs)).toThrow(/renfort/i);
  });

  it('devrait rejeter "Assuré seul" avec conjoint ou enfants', () => {
    const input: DevisInput = {
      gamme: "TNS_FORMULES",
      codePostal: "69001",
      dateEffet: new Date("2025-02-01"),
      assure: { dateNaissance: new Date("1983-06-20"), estSeul: true }, // Invalide
      conjoint: { dateNaissance: new Date("1985-09-10") },
      option: 3,
      surcomplementaire: false,
      commission: 15
    };

    expect(() => calculerDevis(input, tarifs)).toThrow(/Assuré seul/i);
  });
});
