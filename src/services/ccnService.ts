import { supabase } from '@/integrations/supabase/client';

export interface CcnAvailable {
  idcc: string;
  label: string;
}

export interface CcnImported {
  idcc: string;
  label: string;
  kalicont_id: string | null;
  documentCount: number;
  chunkCount: number;
  status: 'active' | 'importing' | 'error';
  created_at?: string;
  updated_at?: string;
}

export interface ImportCcnRequest {
  idcc_list: string[];
  user_email: string;
}

export interface ImportCcnResponse {
  success: boolean;
  message?: string;
  imported_count?: number;
}

/**
 * Récupère toutes les CCN disponibles depuis ccn_catalogue
 * (celles qui ne sont pas encore importées)
 */
export async function getAvailableCcn(): Promise<CcnAvailable[]> {
  try {
    // Récupérer depuis ccn_catalogue les CCN non importées
    // @ts-ignore - ccn_catalogue table
    const { data, error } = await supabase
      .from('ccn_catalogue')
      .select('idcc, label')
      .eq('active', true)
      .eq('is_imported', false)
      .order('idcc', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des CCN disponibles:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des CCN disponibles:', error);
    throw error;
  }
}

/**
 * Récupère les CCN importées depuis ccn_catalogue avec le nombre de documents
 */
export async function getImportedCcn(): Promise<CcnImported[]> {
  try {
    // Récupérer depuis ccn_catalogue les CCN importées
    // @ts-ignore - ccn_catalogue table
    const { data: catalogueData, error: catalogueError } = await supabase
      .from('ccn_catalogue')
      .select('idcc, label, kali_cont_id, last_import_at')
      .eq('active', true)
      .eq('is_imported', true)
      .order('idcc', { ascending: true });

    if (catalogueError) {
      console.error('Erreur lors de la récupération des CCN importées:', catalogueError);
      throw catalogueError;
    }

    if (!catalogueData || catalogueData.length === 0) {
      return [];
    }

    // Récupérer les comptages de documents et chunks via la fonction RPC
    const { data: countsData, error: countsError } = await supabase
      .rpc('get_ccn_document_counts') as { data: { idcc: string; document_count: number; chunk_count: number }[] | null; error: any };

    // Créer une map des comptages
    const countsMap = new Map<string, { documentCount: number; chunkCount: number }>();
    if (countsData && !countsError) {
      countsData.forEach((item) => {
        countsMap.set(item.idcc, {
          documentCount: Number(item.document_count) || 0,
          chunkCount: Number(item.chunk_count) || 0,
        });
      });
    }

    // Mapper les données
    return catalogueData.map((item: any) => {
      const counts = countsMap.get(item.idcc) || { documentCount: 0, chunkCount: 0 };
      return {
        idcc: item.idcc,
        label: item.label,
        kalicont_id: item.kali_cont_id,
        documentCount: counts.documentCount,
        chunkCount: counts.chunkCount,
        status: 'active' as const,
        created_at: item.last_import_at,
        updated_at: item.last_import_at,
      };
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des CCN importées:', error);
    throw error;
  }
}

/**
 * Déclenche l'import de CCN via le webhook n8n
 */
export async function triggerCcnImport(
  idccList: string[],
  userEmail: string,
  webhookUrl: string
): Promise<ImportCcnResponse> {
  try {
    const requestBody: ImportCcnRequest = {
      idcc_list: idccList,
      user_email: userEmail,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || 'Import démarré avec succès',
      imported_count: idccList.length,
    };
  } catch (error) {
    console.error('Erreur lors du déclenchement de l\'import:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

export interface CcnProtectionStatus {
  is_in_use: boolean;
  client_count: number;
  client_names: string[] | null;
}

/**
 * Vérifie si une CCN est utilisée par des clients
 */
export async function checkCcnProtection(idcc: string): Promise<CcnProtectionStatus> {
  try {
    const { data, error } = await (supabase.rpc as any)('check_ccn_in_use', { p_idcc: idcc }) as {
      data: CcnProtectionStatus[] | null;
      error: any;
    };

    if (error) {
      console.error('Erreur lors de la vérification de protection:', error);
      return { is_in_use: false, client_count: 0, client_names: null };
    }

    if (data && data.length > 0) {
      return data[0];
    }

    return { is_in_use: false, client_count: 0, client_names: null };
  } catch (error) {
    console.error('Erreur lors de la vérification de protection:', error);
    return { is_in_use: false, client_count: 0, client_names: null };
  }
}

/**
 * Supprime une CCN importée
 * - Vérifie d'abord si la CCN est protégée (utilisée par des clients)
 * - Remet is_imported = false dans ccn_catalogue
 * - Supprime tous les chunks vectorisés dont metadata.idcc correspond
 */
export async function deleteCcn(idcc: string): Promise<void> {
  try {
    console.log(`[DELETE CCN] Début de la suppression de la CCN ${idcc}`);

    // 0. Vérifier si la CCN est protégée
    const protection = await checkCcnProtection(idcc);
    if (protection.is_in_use) {
      const clientList = protection.client_names?.join(', ') || 'clients';
      throw new Error(
        `Impossible de supprimer la CCN ${idcc} : elle est utilisée par ${protection.client_count} client(s) (${clientList})`
      );
    }

    // 1. Supprimer tous les chunks vectorisés où metadata->>idcc = idcc
    // @ts-ignore - ccn table schema with metadata
    const { data: deletedChunks, error: chunksError } = await supabase
      .from('ccn')
      .delete()
      .filter('metadata->>idcc', 'eq', idcc)
      .select('id');

    if (chunksError) {
      console.error('Erreur lors de la suppression des chunks vectorisés:', chunksError);
    } else {
      const count = deletedChunks?.length || 0;
      console.log(`[DELETE CCN] ${count} chunk(s) vectorisé(s) supprimé(s)`);
    }

    // 2. Remettre is_imported = false dans ccn_catalogue
    const { error: catalogueError } = await (supabase
      .from('ccn_catalogue') as any)
      .update({
        is_imported: false,
        chunks_count: 0,
        last_import_at: null
      })
      .eq('idcc', idcc);

    if (catalogueError) {
      console.error('Erreur lors de la mise à jour du catalogue:', catalogueError);
      throw catalogueError;
    }
    console.log(`[DELETE CCN] Catalogue mis à jour (is_imported = false)`);

    console.log(`[DELETE CCN] Suppression de la CCN ${idcc} terminée avec succès`);
  } catch (error) {
    console.error('Erreur lors de la suppression de la CCN:', error);
    throw error;
  }
}

/**
 * Vérifie le statut d'import d'une CCN
 */
export async function checkImportStatus(idcc: string): Promise<'completed' | 'importing' | 'not_found'> {
  try {
    const { data, error } = await (supabase
      .from('ccn_catalogue') as any)
      .select('is_imported')
      .eq('idcc', idcc)
      .single() as { data: { is_imported: boolean } | null; error: any };

    if (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      return 'not_found';
    }

    if (!data) {
      return 'not_found';
    }

    return data.is_imported ? 'completed' : 'not_found';
  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error);
    return 'not_found';
  }
}
