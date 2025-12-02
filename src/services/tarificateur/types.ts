// Types pour le calculateur de tarifs WALTERA

export interface TarifEntry {
  base: {
    option1: number;
    option2: number;
    option3: number;
    option4: number;
    option5: number;
    option6: number;
  };
  surco?: {
    option3: number;
    option4: number;
    option5: number;
    option6: number;
  };
  renfort_hospi?: number; // Uniquement SENIORS_PLUS
}

export interface ZoneData {
  [zone: string]: {
    [qualite: string]: {
      [age: string]: TarifEntry;
    };
  };
}

export interface TarifsData {
  SANTE_SENIORS_PLUS: Record<string, ZoneData>;
  SANTE_SENIORS: Record<string, ZoneData>;
  TNS_FORMULES: Record<string, ZoneData>;
  ZONES: {
    SENIORS_ZONES: Record<string, string[]>;
    TNS_ZONES: Record<string, string[]>;
  };
}

export type Gamme = "SANTE_SENIORS_PLUS" | "SANTE_SENIORS" | "TNS_FORMULES";
export type Option = 1 | 2 | 3 | 4 | 5 | 6;
export type Commission = 10 | 15 | 20;

export interface DevisInput {
  gamme: Gamme;
  codePostal: string;
  dateEffet: Date;
  assure: { dateNaissance: Date; estSeul?: boolean }; // estSeul pour TNS
  conjoint?: { dateNaissance: Date };
  enfants?: { dateNaissance: Date }[];
  option: Option;
  surcomplementaire: boolean;
  renfortHospi?: boolean; // SENIORS_PLUS uniquement
  commission: Commission;
}

export interface BeneficiaireDetail {
  beneficiaire: string;
  age: number;
  tarifBase: number;
  tarifSurco: number;
  tarifRenfort: number;
  total: number;
}

export interface DevisOutput {
  tarifMensuel: number;
  produit: string;
  zone: string;
  details: BeneficiaireDetail[];
}

export interface ValidationError {
  field: string;
  message: string;
}
