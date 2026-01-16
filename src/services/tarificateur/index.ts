// Export principal du module tarificateur

export { calculerDevis } from './calculator';
export { calculerDevisSupabase } from './calculatorSupabase';
export { validateDevisInput, isValidDepartement } from './validator';
export {
  getZone,
  getAgeBracket,
  calculateAge,
  getProduitName,
  getQualiteTNS,
  normalizeQualite
} from './utils';
export {
  getZoneFromSupabase,
  getTarifFromSupabase,
  getTarifsFromSupabase,
  tarifRowToEntry,
} from './supabase';

export type {
  DevisInput,
  DevisOutput,
  BeneficiaireDetail,
  TarifsData,
  TarifEntry,
  ZoneData,
  Gamme,
  Option,
  Commission,
  ValidationError
} from './types';
export type { TarifRow } from './supabase';
