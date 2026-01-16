import { supabase } from '@/integrations/supabase/client';

/**
 * Interface pour la réponse webhook Gamma
 */
export interface GammaWebhookResponse {
  generationId: string;
  status: 'completed' | 'failed';
  gammaUrl: string;
  exportUrl: string;
  credits: {
    deducted: number;
    remaining: number;
  };
}

/**
 * Interface pour une analyse réseau
 */
export interface AnalyseReseau {
  id: string;
  generation_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  gamma_url?: string;
  export_url?: string;
  credits_deducted: number;
  credits_remaining?: number;
  request_data?: any;
  response_data?: any;
  created_at: string;
  completed_at?: string;
  error_message?: string;
  metadata?: any;
}

/**
 * Enregistre une nouvelle analyse en base
 */
export async function createAnalyse(requestData?: any): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('analyses_reseau')
      .insert({
        generation_id: `temp_${Date.now()}`, // Temporaire, sera mis à jour avec la vraie ID
        status: 'running',
        request_data: requestData || {},
        credits_deducted: 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erreur lors de la création de l\'analyse:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Erreur lors de la création de l\'analyse:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Met à jour une analyse avec la réponse webhook
 */
export async function updateAnalyseWithWebhookResponse(
  analyseId: string,
  webhookResponse: GammaWebhookResponse
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('analyses_reseau')
      .update({
        generation_id: webhookResponse.generationId,
        status: webhookResponse.status === 'completed' ? 'completed' : 'failed',
        gamma_url: webhookResponse.gammaUrl,
        export_url: webhookResponse.exportUrl,
        credits_deducted: webhookResponse.credits.deducted,
        credits_remaining: webhookResponse.credits.remaining,
        response_data: JSON.parse(JSON.stringify(webhookResponse)),
        completed_at: new Date().toISOString(),
      })
      .eq('id', analyseId);

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'analyse:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'analyse:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Récupère toutes les analyses (historique)
 */
export async function getAllAnalyses(): Promise<{ success: boolean; data?: AnalyseReseau[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('analyses_reseau')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des analyses:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as AnalyseReseau[] };
  } catch (error) {
    console.error('Erreur lors de la récupération des analyses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Récupère les analyses terminées uniquement
 */
export async function getCompletedAnalyses(): Promise<{ success: boolean; data?: AnalyseReseau[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('analyses_reseau')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des analyses:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as AnalyseReseau[] };
  } catch (error) {
    console.error('Erreur lors de la récupération des analyses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Calcule le total des crédits consommés
 */
export async function getTotalCreditsConsumed(): Promise<{ success: boolean; total?: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('analyses_reseau')
      .select('credits_deducted')
      .eq('status', 'completed');

    if (error) {
      console.error('Erreur lors du calcul des crédits:', error);
      return { success: false, error: error.message };
    }

    const total = data.reduce((sum, analyse) => sum + (analyse.credits_deducted || 0), 0);
    return { success: true, total };
  } catch (error) {
    console.error('Erreur lors du calcul des crédits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Récupère les crédits disponibles depuis la dernière analyse
 */
export async function getLatestCreditsRemaining(): Promise<{ success: boolean; credits?: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('analyses_reseau')
      .select('credits_remaining')
      .not('credits_remaining', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Aucune donnée trouvée
        return { success: true, credits: undefined };
      }
      console.error('Erreur lors de la récupération des crédits:', error);
      return { success: false, error: error.message };
    }

    return { success: true, credits: data.credits_remaining ?? undefined };
  } catch (error) {
    console.error('Erreur lors de la récupération des crédits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}
