import { supabase } from '@/integrations/supabase/client';
import type { Gamme } from './types';

/**
 * Interface pour une ligne de la table tarifs_sante
 */
export interface TarifRow {
  id: number;
  gamme: string;
  produit: string;
  zone: string;
  qualite: string;
  age: string;
  option1: number | null;
  option2: number | null;
  option3: number | null;
  option4: number | null;
  option5: number | null;
  option6: number | null;
  surco_option3: number | null;
  surco_option4: number | null;
  surco_option5: number | null;
  surco_option6: number | null;
  renfort_hospi: number | null;
}

/**
 * Récupère la zone tarifaire à partir du code postal
 * Avec fallback sur les zones en dur pour SENIORS si Supabase ne retourne rien
 */
export async function getZoneFromSupabase(
  codePostal: string,
  gamme: Gamme
): Promise<string | null> {
  const dept = codePostal.substring(0, 2);
  const typeZone = gamme === 'TNS_FORMULES' ? 'TNS' : 'SENIORS';

  // Essayer d'abord avec Supabase
  const { data, error } = await supabase
    .from('zones_sante')
    .select('code_zone')
    .eq('type_zone', typeZone)
    .eq('departement', dept)
    .single();

  // Si trouvé dans Supabase, retourner
  if (data && !error) {
    return (data as any).code_zone;
  }

  // Fallback pour SENIORS / SENIORS_PLUS (zones en dur)
  if (gamme !== 'TNS_FORMULES') {
    // Alsace-Moselle
    if (['57', '67', '68'].includes(dept)) {
      return 'AM';
    }

    // Zone 2
    if (['13', '20', '31', '33', '69', '75', '77', '78', '91', '92', '93', '94', '95', '99'].includes(dept)) {
      return 'Z02';
    }

    // Zone 1 par défaut
    return 'Z01';
  }

  // Pour TNS, si pas dans Supabase, retourner null
  return null;
}

/**
 * Récupère un tarif spécifique depuis Supabase
 */
export async function getTarifFromSupabase(
  gamme: string,
  produit: string,
  zone: string,
  qualite: string,
  age: string
): Promise<TarifRow | null> {
  const { data, error } = await supabase
    .from('tarifs_sante')
    .select('*')
    .eq('gamme', gamme)
    .eq('produit', produit)
    .eq('zone', zone)
    .eq('qualite', qualite)
    .eq('age', age)
    .single();

  if (error) {
    // Erreur silencieuse - pas de log en production
    return null;
  }

  return data as TarifRow;
}

/**
 * Récupère plusieurs tarifs en une seule requête (optimisation)
 */
export async function getTarifsFromSupabase(
  gamme: string,
  produit: string,
  zone: string,
  qualites: string[],
  ages: string[]
): Promise<TarifRow[]> {
  const { data, error } = await supabase
    .from('tarifs_sante')
    .select('*')
    .eq('gamme', gamme)
    .eq('produit', produit)
    .eq('zone', zone)
    .in('qualite', qualites)
    .in('age', ages);

  if (error) {
    // Erreur silencieuse
    return [];
  }

  return (data || []) as TarifRow[];
}

/**
 * Transforme une ligne Supabase en TarifEntry
 */
export function tarifRowToEntry(row: TarifRow) {
  return {
    base: {
      option1: row.option1 || 0,
      option2: row.option2 || 0,
      option3: row.option3 || 0,
      option4: row.option4 || 0,
      option5: row.option5 || 0,
      option6: row.option6 || 0,
    },
    surco: {
      option3: row.surco_option3 || 0,
      option4: row.surco_option4 || 0,
      option5: row.surco_option5 || 0,
      option6: row.surco_option6 || 0,
    },
    renfort_hospi: row.renfort_hospi || undefined,
  };
}

/**
 * Interface pour l'enregistrement d'une demande de devis
 */
export interface DemandeDevisData {
  // Client
  prenom: string;
  nom: string;
  email: string;
  adresse: string;
  code_postal: string;

  // RGPD
  rgpd_consent: boolean;
  rgpd_consent_date?: Date;

  // Devis
  gamme: string;
  date_effet: Date;
  option_choisie: number;
  surcomplementaire: boolean;
  renfort_hospi?: boolean;
  commission: number;

  // Résultat
  tarif_mensuel: number;
  produit: string;
  zone: string;

  // Bénéficiaires (format JSONB)
  beneficiaires: Array<{
    type: 'assure' | 'conjoint' | 'enfant';
    prenom?: string;
    nom?: string;
    dateNaissance: string;
    age: number;
  }>;

  // Détails du calcul
  details_calcul: Array<{
    beneficiaire: string;
    age: number;
    tarifBase: number;
    tarifSurco: number;
    tarifRenfort: number;
    total: number;
  }>;
}

/**
 * Enregistre une demande de devis dans Supabase
 */
export async function enregistrerDemandeDevis(
  data: DemandeDevisData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Note: demandes_devis table may need to be created
    const { data: result, error } = await (supabase as any)
      .from('demandes_devis')
      .insert({
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        adresse: data.adresse,
        code_postal: data.code_postal,
        rgpd_consent: data.rgpd_consent,
        rgpd_consent_date: data.rgpd_consent_date || new Date(),
        gamme: data.gamme,
        date_effet: data.date_effet.toISOString().split('T')[0], // Format YYYY-MM-DD
        option_choisie: data.option_choisie,
        surcomplementaire: data.surcomplementaire,
        renfort_hospi: data.renfort_hospi || false,
        commission: data.commission,
        tarif_mensuel: data.tarif_mensuel,
        produit: data.produit,
        zone: data.zone,
        beneficiaires: data.beneficiaires,
        details_calcul: data.details_calcul,
        statut: 'nouveau',
      } as any)
      .select('id')
      .single();

    if (error) {
      console.error('Erreur lors de l\'enregistrement du devis:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: (result as any)?.id };
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du devis:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}
