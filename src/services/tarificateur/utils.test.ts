import { describe, it, expect } from 'vitest';
import {
  getZone,
  getAgeBracket,
  calculateAge,
  getProduitName,
  getQualiteTNS,
  normalizeQualite
} from './utils';

describe('Utils - getZone', () => {
  const mockZones = {
    SENIORS_ZONES: {},
    TNS_ZONES: {
      Z01: ["01", "02", "03"],
      Z02: ["04", "05", "06"],
      Z03: ["69", "38"],
      Z04: ["13", "83"],
      Z05: ["75", "77", "78", "91", "92", "93", "94", "95"]
    }
  };

  it('devrait retourner AM pour Alsace-Moselle (SENIORS)', () => {
    expect(getZone("67000", "SANTE_SENIORS", mockZones)).toBe("AM");
    expect(getZone("68000", "SANTE_SENIORS", mockZones)).toBe("AM");
    expect(getZone("57000", "SANTE_SENIORS", mockZones)).toBe("AM");
  });

  it('devrait retourner Z02 pour les grandes villes (SENIORS)', () => {
    expect(getZone("75001", "SANTE_SENIORS", mockZones)).toBe("Z02");
    expect(getZone("69001", "SANTE_SENIORS", mockZones)).toBe("Z02");
    expect(getZone("13001", "SANTE_SENIORS", mockZones)).toBe("Z02");
    expect(getZone("33000", "SANTE_SENIORS", mockZones)).toBe("Z02");
  });

  it('devrait retourner Z01 pour les autres départements (SENIORS)', () => {
    expect(getZone("29000", "SANTE_SENIORS", mockZones)).toBe("Z01");
    expect(getZone("44000", "SANTE_SENIORS", mockZones)).toBe("Z01");
  });

  it('devrait utiliser TNS_ZONES pour TNS_FORMULES', () => {
    expect(getZone("69001", "TNS_FORMULES", mockZones)).toBe("Z03");
    expect(getZone("75001", "TNS_FORMULES", mockZones)).toBe("Z05");
    expect(getZone("13001", "TNS_FORMULES", mockZones)).toBe("Z04");
  });
});

describe('Utils - getAgeBracket', () => {
  it('devrait retourner la bonne tranche pour TNS', () => {
    expect(getAgeBracket(15, "Assuré", "TNS_FORMULES")).toBe("0-19");
    expect(getAgeBracket(19, "Assuré", "TNS_FORMULES")).toBe("0-19");
    expect(getAgeBracket(20, "Assuré", "TNS_FORMULES")).toBe("20");
    expect(getAgeBracket(45, "Assuré", "TNS_FORMULES")).toBe("45");
  });

  it('devrait retourner la bonne tranche pour SENIORS (Assuré/Conjoint)', () => {
    expect(getAgeBracket(40, "Assuré", "SANTE_SENIORS")).toBe("0-59");
    expect(getAgeBracket(59, "Assuré", "SANTE_SENIORS")).toBe("0-59");
    expect(getAgeBracket(60, "Assuré", "SANTE_SENIORS")).toBe("60");
    expect(getAgeBracket(72, "Assuré", "SANTE_SENIORS")).toBe("72");
  });

  it('devrait retourner la bonne tranche pour SENIORS (Enfant)', () => {
    expect(getAgeBracket(15, "Enfant", "SANTE_SENIORS")).toBe("0-27");
    expect(getAgeBracket(27, "Enfant", "SANTE_SENIORS")).toBe("0-27");
    expect(getAgeBracket(28, "Enfant", "SANTE_SENIORS")).toBe("28+");
    expect(getAgeBracket(30, "Enfant", "SANTE_SENIORS")).toBe("28+");
  });

  it('devrait gérer les âges >= 100', () => {
    expect(getAgeBracket(100, "Assuré", "SANTE_SENIORS")).toBe("100+");
    expect(getAgeBracket(105, "Assuré", "SANTE_SENIORS")).toBe("100+");
  });
});

describe('Utils - calculateAge', () => {
  it('devrait calculer correctement l\'âge', () => {
    const dateNaissance = new Date("1958-03-15");
    const dateEffet = new Date("2025-02-01");
    expect(calculateAge(dateNaissance, dateEffet)).toBe(66);
  });

  it('devrait prendre en compte l\'anniversaire non encore passé', () => {
    const dateNaissance = new Date("1958-03-15");
    const dateEffet = new Date("2025-03-10");
    expect(calculateAge(dateNaissance, dateEffet)).toBe(66);

    const dateEffet2 = new Date("2025-03-16");
    expect(calculateAge(dateNaissance, dateEffet2)).toBe(67);
  });
});

describe('Utils - getProduitName', () => {
  it('devrait retourner le bon nom pour SANTE_SENIORS_PLUS', () => {
    expect(getProduitName("SANTE_SENIORS_PLUS", 10)).toBe("SANTE SENIOR PLUS 12191");
    expect(getProduitName("SANTE_SENIORS_PLUS", 15)).toBe("SANTE SENIOR PLUS 12192");
    expect(getProduitName("SANTE_SENIORS_PLUS", 20)).toBe("SANTE SENIOR PLUS 12193");
  });

  it('devrait retourner le bon nom pour SANTE_SENIORS', () => {
    expect(getProduitName("SANTE_SENIORS", 10)).toBe("SANTE SENIOR 12141 RESPONSABLE");
    expect(getProduitName("SANTE_SENIORS", 15)).toBe("SANTE SENIOR 12142 RESPONSABLE");
    expect(getProduitName("SANTE_SENIORS", 20)).toBe("SANTE SENIOR 12143 RESPONSABLE");
  });

  it('devrait retourner le bon nom pour TNS_FORMULES', () => {
    expect(getProduitName("TNS_FORMULES", 10)).toBe("CONTRASSUR TNS 12281 RESPONSABLE");
    expect(getProduitName("TNS_FORMULES", 15)).toBe("CONTRASSUR TNS 12282 RESPONSABLE");
    expect(getProduitName("TNS_FORMULES", 20)).toBe("CONTRASSUR TNS 12283 RESPONSABLE");
  });
});

describe('Utils - getQualiteTNS', () => {
  it('devrait retourner "Assuré seul" si célibataire sans enfant', () => {
    expect(getQualiteTNS(true, true, false, false)).toBe("Assuré seul");
  });

  it('devrait retourner "Assuré" si en couple', () => {
    expect(getQualiteTNS(true, false, true, false)).toBe("Assuré");
  });

  it('devrait retourner "Assuré" si avec enfants', () => {
    expect(getQualiteTNS(true, false, false, true)).toBe("Assuré");
  });

  it('devrait retourner "" si pas assuré', () => {
    expect(getQualiteTNS(false, false, false, false)).toBe("");
  });
});

describe('Utils - normalizeQualite', () => {
  it('devrait supprimer les espaces trailing', () => {
    expect(normalizeQualite("Assuré ")).toBe("Assuré");
    expect(normalizeQualite("Conjoint  ")).toBe("Conjoint");
    expect(normalizeQualite("  Enfant  ")).toBe("Enfant");
  });
});
