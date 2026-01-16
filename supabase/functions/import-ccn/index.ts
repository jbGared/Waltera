import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

// ============================================
// CONFIGURATION
// ============================================

const LEGIFRANCE_OAUTH_URL = 'https://oauth.piste.gouv.fr/api/oauth/token';
const LEGIFRANCE_API_URL = 'https://api.piste.gouv.fr/dila/legifrance/lf-engine-app';
const LEGIFRANCE_CLIENT_ID = Deno.env.get('LEGIFRANCE_CLIENT_ID')!;
const LEGIFRANCE_CLIENT_SECRET = Deno.env.get('LEGIFRANCE_CLIENT_SECRET')!;
const MISTRAL_API_KEY = Deno.env.get('MISTRAL_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const API_DELAY_MS = 200;
const BATCH_SIZE = 10;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// ============================================
// TYPES
// ============================================

interface ImportRequest {
  idcc_list?: string[];
  force_update?: boolean;
}

interface ImportResult {
  idcc: string;
  ccn_label?: string;
  status: 'success' | 'error' | 'skipped';
  documents_found: number;
  documents_imported: number;
  chunks_created: number;
  sop_alerts: string[];
  sop_titles: string[];
  impacted_clients: string[];
  error?: string;
}

interface LegifranceText {
  kali_id: string;
  titre: string;
  type_text: string;
  nature: string;
  etat_juridique: string;
  date_publication?: string;
  url_legifrance: string;
}

interface SopKeyword {
  keyword: string;
  category: string;
}

interface CcnAlertForEmail {
  idcc: string;
  label: string;
  title: string;
  detected_terms: string[];
  summary?: string;
  impacted_clients?: string[];
}

// ============================================
// COMPLIANCE ANALYSIS
// ============================================

interface ComplianceAnalysisResult {
  idcc: string;
  clients_analyzed: number;
  issues_found: number;
}

async function runComplianceAnalysis(
  idcc: string,
  importLogId?: string
): Promise<ComplianceAnalysisResult | null> {
  try {
    console.log(`[import-ccn] Lancement analyse conformite pour IDCC ${idcc}...`);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-ccn-compliance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        idcc,
        import_log_id: importLogId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[import-ccn] Erreur analyse conformite IDCC ${idcc}:`, errorText);
      return null;
    }

    const result = await response.json();
    console.log(`[import-ccn] Analyse conformite IDCC ${idcc}: ${result.clients_analyzed} clients, ${result.issues_found} alertes`);

    return {
      idcc,
      clients_analyzed: result.clients_analyzed || 0,
      issues_found: result.issues_found || 0,
    };
  } catch (error) {
    console.error(`[import-ccn] Erreur appel analyse conformite IDCC ${idcc}:`, error);
    return null;
  }
}

async function runComplianceAnalysisForImports(
  results: ImportResult[],
  logId?: string
): Promise<ComplianceAnalysisResult[]> {
  // Only run compliance analysis for IDCCs that had successful imports
  const importedIdccs = results
    .filter(r => r.status === 'success' && r.documents_imported > 0)
    .map(r => r.idcc);

  if (importedIdccs.length === 0) {
    console.log('[import-ccn] Aucune CCN importee, pas d\'analyse de conformite');
    return [];
  }

  console.log(`[import-ccn] Analyse conformite pour ${importedIdccs.length} CCN(s): ${importedIdccs.join(', ')}`);

  const complianceResults: ComplianceAnalysisResult[] = [];

  for (const idcc of importedIdccs) {
    const result = await runComplianceAnalysis(idcc, logId || undefined);
    if (result) {
      complianceResults.push(result);
    }
    // Small delay between analyses to avoid overwhelming the API
    await delay(1000);
  }

  const totalIssues = complianceResults.reduce((sum, r) => sum + r.issues_found, 0);
  console.log(`[import-ccn] Analyse conformite terminee: ${totalIssues} alerte(s) creee(s)`);

  return complianceResults;
}

// ============================================
// EMAIL ALERTS
// ============================================

async function sendCcnAlertEmails(
  alerts: CcnAlertForEmail[],
  importId: string
): Promise<void> {
  if (alerts.length === 0) {
    console.log('[import-ccn] Aucune alerte a envoyer par email');
    return;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-ccn-alerts-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        alerts,
        import_date: new Date().toISOString(),
        import_id: importId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[import-ccn] Erreur envoi emails alertes:', errorText);
    } else {
      const result = await response.json();
      console.log(`[import-ccn] Emails alertes envoyes: ${result.sent_count}/${result.total_users} utilisateurs`);
    }
  } catch (error) {
    console.error('[import-ccn] Erreur appel fonction email:', error);
  }
}

// ============================================
// SOP DETECTION
// ============================================

async function getSensitiveKeywords(supabase: SupabaseClient): Promise<SopKeyword[]> {
  const { data, error } = await supabase
    .from('sop_keywords')
    .select('keyword, category')
    .eq('is_active', true);

  if (error) {
    console.error('[import-ccn] Erreur chargement mots-cles sensibles:', error);
    return [];
  }
  return data || [];
}

function detectSopTerms(content: string, keywords: SopKeyword[]): string[] {
  const contentLower = content.toLowerCase();
  const detected: string[] = [];

  for (const kw of keywords) {
    if (contentLower.includes(kw.keyword.toLowerCase())) {
      detected.push(kw.keyword);
    }
  }

  return detected;
}

async function getImpactedClients(supabase: SupabaseClient, idcc: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .contains('idcc', [idcc]);

  if (error) {
    console.error('[import-ccn] Erreur recherche clients impactes:', error);
    return [];
  }
  return data || [];
}

async function createCcnNotification(
  supabase: SupabaseClient,
  idcc: string,
  kaliId: string,
  titre: string,
  detectedTerms: string[],
  impactedClients: { id: string; name: string }[]
): Promise<void> {
  if (detectedTerms.length === 0) return;

  const { error } = await supabase.from('ccn_notifications').insert({
    change_kali_id: kaliId,
    idcc: idcc,
    notification_type: 'sop_alert',
    title: titre,
    summary: `Termes sensibles detectes: ${detectedTerms.join(', ')}`,
    detected_terms: detectedTerms,
    impacted_clients: impactedClients.map(c => c.name),
    impact_analysis: {
      clients_count: impactedClients.length,
      clients: impactedClients,
      terms_count: detectedTerms.length,
    },
    status: 'pending',
  });

  if (error) {
    console.error('[import-ccn] Erreur creation notification:', error);
  } else {
    console.log(`[import-ccn] Notification creee: IDCC ${idcc}, ${detectedTerms.length} termes, ${impactedClients.length} clients impactes`);
  }
}

// ============================================
// IMPORT LOGGING
// ============================================

async function createImportLog(supabase: SupabaseClient, triggerType: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_import_log', { p_trigger_type: triggerType });
  if (error) {
    console.error('[import-ccn] Erreur creation log import:', error);
    return null;
  }
  return data;
}

async function updateImportLog(
  supabase: SupabaseClient,
  logId: string,
  status: string,
  results: ImportResult[],
  errorMessage?: string
): Promise<void> {
  const totalSopAlerts = results.reduce((sum, r) => sum + r.sop_alerts.length, 0);

  const { error } = await supabase.rpc('update_import_log', {
    p_log_id: logId,
    p_status: status,
    p_total_ccn: results.length,
    p_docs_found: results.reduce((sum, r) => sum + r.documents_found, 0),
    p_docs_imported: results.reduce((sum, r) => sum + r.documents_imported, 0),
    p_chunks_created: results.reduce((sum, r) => sum + r.chunks_created, 0),
    p_errors: results.filter(r => r.status === 'error').length,
    p_sop_alerts: totalSopAlerts,
    p_details: results,
    p_error_message: errorMessage || null,
  });

  if (error) {
    console.error('[import-ccn] Erreur mise a jour log import:', error);
  }
}

// ============================================
// LEGIFRANCE API
// ============================================

let cachedToken: { token: string; expires_at: number } | null = null;

async function getLegifranceToken(): Promise<string> {
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.token;
  }

  if (!LEGIFRANCE_CLIENT_ID || !LEGIFRANCE_CLIENT_SECRET) {
    throw new Error('LEGIFRANCE_CLIENT_ID et LEGIFRANCE_CLIENT_SECRET doivent etre configures');
  }

  console.log('[import-ccn] Recuperation token Legifrance...');

  const response = await fetch(LEGIFRANCE_OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: LEGIFRANCE_CLIENT_ID,
      client_secret: LEGIFRANCE_CLIENT_SECRET,
      scope: 'openid',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur OAuth Legifrance: ${response.status} - ${error}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 300) * 1000,
  };

  return cachedToken.token;
}

async function searchLegifranceTexts(token: string, idcc: string): Promise<LegifranceText[]> {
  const idccClean = idcc.replace(/^0+/, '');
  const allTexts: LegifranceText[] = [];
  const pageSize = 100;
  let pageNumber = 1;
  let totalResults = 0;

  do {
    const response = await fetch(`${LEGIFRANCE_API_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        fond: 'KALI',
        recherche: {
          champs: [{
            typeChamp: 'IDCC',
            operateur: 'ET',
            criteres: [{ valeur: idccClean, typeRecherche: 'TOUS_LES_MOTS_DANS_UN_CHAMP', operateur: 'ET' }],
          }],
          filtres: [{ facette: 'LEGAL_STATUS', valeurs: ['VIGUEUR', 'VIGUEUR_ETEN', 'VIGUEUR_NON_ETEN', 'VIGUEUR_DIFF'] }],
          sort: 'KALI_ID',
          pageNumber,
          pageSize,
          typePagination: 'DEFAUT',
          operateur: 'ET',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur recherche Legifrance: ${response.status}`);
    }

    const data = await response.json();
    totalResults = data.totalResultNumber || 0;

    for (const result of (data.results || [])) {
      const kaliId = result.titles?.[0]?.id || result.titles?.[0]?.cid;
      if (!kaliId || kaliId.startsWith('KALICONT')) continue;

      allTexts.push({
        kali_id: kaliId,
        titre: result.titles?.[0]?.title || 'Sans titre',
        type_text: classifyText(result.nature || '', result.titles?.[0]?.title || ''),
        nature: result.nature || 'unknown',
        etat_juridique: result.etat || 'UNKNOWN',
        date_publication: result.datePublication,
        url_legifrance: `https://www.legifrance.gouv.fr/conv_coll/id/${kaliId}`,
      });
    }

    pageNumber++;
    await delay(API_DELAY_MS);
  } while (allTexts.length < totalResults && pageNumber <= 20);

  return allTexts;
}

async function consultLegifranceText(token: string, kaliId: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(`${LEGIFRANCE_API_URL}/consult/kaliText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id: kaliId }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}

async function consultLegifranceContainer(token: string, kalicontId: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(`${LEGIFRANCE_API_URL}/consult/kaliCont`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id: kalicontId }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}

// ============================================
// TEXT PROCESSING
// ============================================

function classifyText(nature: string, title: string): string {
  const titleLower = (title || '').toLowerCase();
  if (titleLower.includes('arrete') || titleLower.includes('arrêté')) return 'ARRETE';
  if (titleLower.includes('avenant') || nature.toLowerCase() === 'avenant') return 'AVENANT';
  if (nature.toLowerCase() === 'accord' || titleLower.includes('accord')) return 'ACCORD';
  if (titleLower.includes('annexe')) return 'ANNEXE';
  if (titleLower.includes('convention collective')) return 'TEXTE_BASE';
  return 'AUTRE';
}

function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(parseInt(d)))
    .replace(/&[a-zA-Z]+;/g, ' ')
    .replace(/[\r\n]+/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n')
    .trim();
}

function extractContent(consultResult: Record<string, unknown>): string {
  const parts: string[] = [];
  const articles = consultResult.articles as Array<{ num?: string; surtitre?: string; content?: string }> | undefined;
  if (articles) {
    for (const art of articles) {
      if (art.num) parts.push(`\n### Article ${art.num}\n`);
      if (art.surtitre) parts.push(`**${art.surtitre}**\n`);
      if (art.content) parts.push(art.content);
    }
  }
  if (parts.length === 0) {
    for (const field of ['resume', 'notice', 'nota', 'texte', 'contenu']) {
      const value = consultResult[field];
      if (value && typeof value === 'string') parts.push(value);
    }
  }
  return parts.join('\n\n');
}

function extractContainerContent(container: Record<string, unknown>): string {
  const parts: string[] = [];

  function processNode(node: Record<string, unknown>, depth: number = 1): void {
    const headerLevel = Math.min(depth + 1, 6);
    const title = node.title as string | undefined;
    if (title && depth <= 4) parts.push(`\n${'#'.repeat(headerLevel)} ${title}\n`);

    const content = node.content as string | undefined;
    if (content) parts.push(content);

    const articles = node.articles as Array<{ num?: string; content?: string; surtitre?: string }> | undefined;
    if (articles) {
      for (const article of articles) {
        if (article.num) parts.push(`\n${'#'.repeat(Math.min(headerLevel + 1, 6))} Article ${article.num}\n`);
        if (article.surtitre) parts.push(`**${article.surtitre}**\n`);
        if (article.content) parts.push(article.content);
      }
    }

    const sections = node.sections as Array<Record<string, unknown>> | undefined;
    if (sections) {
      for (const subSection of sections) processNode(subSection, depth + 1);
    }
  }

  const sections = container.sections as Array<Record<string, unknown>> | undefined;
  if (sections) {
    for (const section of sections) processNode(section, 1);
  }
  return parts.join('\n\n');
}

function chunkText(text: string, maxSize: number = 4000, overlap: number = 200): string[] {
  const words = text.split(/\s+/);
  if (words.length <= maxSize) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxSize - overlap) {
    const chunk = words.slice(i, i + maxSize).join(' ');
    if (chunk.length > 100) chunks.push(chunk);
  }
  return chunks.length > 0 ? chunks : [text];
}

// ============================================
// EMBEDDINGS
// ============================================

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch('https://api.mistral.ai/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MISTRAL_API_KEY}` },
    body: JSON.stringify({ model: 'mistral-embed', input: texts }),
  });
  if (!response.ok) throw new Error(`Erreur Mistral: ${response.status}`);
  const data = await response.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

// ============================================
// DATABASE
// ============================================

async function getExistingKaliIds(supabase: SupabaseClient, kaliIds: string[]): Promise<Set<string>> {
  const { data } = await supabase.rpc('get_existing_kali_ids', { kali_ids: kaliIds });
  return new Set(data || []);
}

async function getCcnLabel(supabase: SupabaseClient, idcc: string): Promise<string | null> {
  const { data } = await supabase.from('idcc_ref').select('label').eq('idcc', idcc).single();
  return data?.label || null;
}

async function insertDocuments(supabase: SupabaseClient, docs: Array<{ content: string; embedding: number[]; metadata: Record<string, unknown> }>): Promise<number> {
  if (docs.length === 0) return 0;
  const { error } = await supabase.from('ccn').insert(docs.map(d => ({ content: d.content, embedding: d.embedding, metadata: d.metadata })));
  if (error) throw error;
  return docs.length;
}

async function updateCatalogueStatus(supabase: SupabaseClient, idcc: string, isImported: boolean, chunksCount: number): Promise<void> {
  await supabase.from('ccn_catalogue').update({ is_imported: isImported, chunks_count: chunksCount, last_import_at: new Date().toISOString() }).eq('idcc', idcc);
}

// ============================================
// IMPORT LOGIC
// ============================================

async function importIdcc(
  supabase: SupabaseClient,
  token: string,
  idcc: string,
  sopKeywords: SopKeyword[],
  forceUpdate: boolean = false
): Promise<ImportResult> {
  const ccnLabel = await getCcnLabel(supabase, idcc);
  const result: ImportResult = { idcc, ccn_label: ccnLabel || undefined, status: 'success', documents_found: 0, documents_imported: 0, chunks_created: 0, sop_alerts: [], sop_titles: [], impacted_clients: [] };

  try {
    const texts = await searchLegifranceTexts(token, idcc);
    result.documents_found = texts.length;

    if (texts.length === 0) {
      result.status = 'skipped';
      return result;
    }

    const existingIds = forceUpdate ? new Set<string>() : await getExistingKaliIds(supabase, texts.map(t => t.kali_id));
    const newTexts = texts.filter(t => !existingIds.has(t.kali_id));

    if (newTexts.length === 0) {
      result.status = 'skipped';
      return result;
    }

    const documentsToInsert: Array<{ content: string; embedding: number[]; metadata: Record<string, unknown> }> = [];
    const impactedClients = await getImpactedClients(supabase, idcc);

    for (const text of newTexts) {
      await delay(API_DELAY_MS);
      const consultResult = await consultLegifranceText(token, text.kali_id);
      if (!consultResult) continue;

      const rawContent = extractContent(consultResult);
      const cleanedContent = cleanHtml(rawContent);
      if (cleanedContent.length < 50) continue;

      // Detection termes sensibles
      const detectedTerms = detectSopTerms(cleanedContent, sopKeywords);
      if (detectedTerms.length > 0) {
        result.sop_alerts.push(...detectedTerms);
        result.sop_titles.push(text.titre);
        // Store impacted client names for email
        if (result.impacted_clients.length === 0) {
          result.impacted_clients = impactedClients.map(c => c.name);
        }
        await createCcnNotification(supabase, idcc, text.kali_id, text.titre, detectedTerms, impactedClients);
      }

      const baseMetadata = {
        source: 'ccn_legifrance', document_type: 'ccn',
        idcc: String(idcc).padStart(4, '0'), ccn_label: ccnLabel,
        kali_id: text.kali_id, titre: text.titre,
        type_text: text.type_text, nature: text.nature,
        url_legifrance: text.url_legifrance,
        imported_at: new Date().toISOString(),
        sop_terms_detected: detectedTerms,
      };

      const chunks = chunkText(cleanedContent, 1000, 100);
      for (let i = 0; i < chunks.length; i++) {
        documentsToInsert.push({ content: chunks[i], embedding: [], metadata: { ...baseMetadata, chunk_index: i, total_chunks: chunks.length } });
      }
      result.documents_imported++;
    }

    for (let i = 0; i < documentsToInsert.length; i += BATCH_SIZE) {
      const batch = documentsToInsert.slice(i, i + BATCH_SIZE);
      const embeddings = await generateEmbeddings(batch.map(d => d.content));
      for (let j = 0; j < batch.length; j++) batch[j].embedding = embeddings[j];
      await delay(100);
    }

    result.chunks_created = await insertDocuments(supabase, documentsToInsert);
    await updateCatalogueStatus(supabase, idcc, true, result.chunks_created);

  } catch (error) {
    result.status = 'error';
    result.error = error instanceof Error ? error.message : 'Erreur inconnue';
  }
  return result;
}

async function importContainerForIdcc(
  supabase: SupabaseClient,
  token: string,
  idcc: string,
  kalicontId: string,
  sopKeywords: SopKeyword[],
  forceUpdate: boolean = false
): Promise<ImportResult> {
  const ccnLabel = await getCcnLabel(supabase, idcc);
  const result: ImportResult = { idcc, ccn_label: ccnLabel || undefined, status: 'success', documents_found: 1, documents_imported: 0, chunks_created: 0, sop_alerts: [], sop_titles: [], impacted_clients: [] };

  try {
    if (!forceUpdate) {
      const existing = await getExistingKaliIds(supabase, [kalicontId]);
      if (existing.has(kalicontId)) {
        result.status = 'skipped';
        return result;
      }
    }

    const container = await consultLegifranceContainer(token, kalicontId);
    if (!container) {
      result.status = 'error';
      result.error = 'Container non trouve';
      return result;
    }

    const rawContent = extractContainerContent(container);
    const cleanedContent = cleanHtml(rawContent);

    if (cleanedContent.length < 100) {
      result.status = 'skipped';
      return result;
    }

    // Detection termes sensibles
    const titre = (container.titre as string) || 'Convention collective';
    const detectedTerms = detectSopTerms(cleanedContent, sopKeywords);
    if (detectedTerms.length > 0) {
      result.sop_alerts.push(...detectedTerms);
      result.sop_titles.push(titre);
      const impactedClients = await getImpactedClients(supabase, idcc);
      result.impacted_clients = impactedClients.map(c => c.name);
      await createCcnNotification(supabase, idcc, kalicontId, titre, detectedTerms, impactedClients);
    }

    const baseMetadata = {
      source: 'ccn_legifrance', document_type: 'ccn',
      idcc: String(idcc).padStart(4, '0'), ccn_label: ccnLabel,
      kali_id: kalicontId, titre,
      type_text: 'TEXTE_BASE', nature: 'convention',
      url_legifrance: `https://www.legifrance.gouv.fr/conv_coll/id/${kalicontId}`,
      imported_at: new Date().toISOString(),
      sop_terms_detected: detectedTerms,
    };

    const chunks = chunkText(cleanedContent, 1000, 100);
    const documentsToInsert: Array<{ content: string; embedding: number[]; metadata: Record<string, unknown> }> = [];

    for (let i = 0; i < chunks.length; i++) {
      documentsToInsert.push({ content: chunks[i], embedding: [], metadata: { ...baseMetadata, chunk_index: i, total_chunks: chunks.length } });
    }

    for (let i = 0; i < documentsToInsert.length; i += BATCH_SIZE) {
      const batch = documentsToInsert.slice(i, i + BATCH_SIZE);
      const embeddings = await generateEmbeddings(batch.map(d => d.content));
      for (let j = 0; j < batch.length; j++) batch[j].embedding = embeddings[j];
      await delay(100);
    }

    result.chunks_created = await insertDocuments(supabase, documentsToInsert);
    result.documents_imported = 1;
    await updateCatalogueStatus(supabase, idcc, true, result.chunks_created);

  } catch (error) {
    result.status = 'error';
    result.error = error instanceof Error ? error.message : 'Erreur inconnue';
  }
  return result;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// COLLECT ALERTS FOR EMAIL
// ============================================

function collectAlertsForEmail(results: ImportResult[]): CcnAlertForEmail[] {
  const alerts: CcnAlertForEmail[] = [];

  for (const result of results) {
    if (result.sop_alerts.length > 0) {
      // Deduplicate terms for this IDCC
      const uniqueTerms = [...new Set(result.sop_alerts)];
      alerts.push({
        idcc: result.idcc,
        label: result.ccn_label || `Convention ${result.idcc}`,
        title: result.sop_titles[0] || 'Modification detectee',
        detected_terms: uniqueTerms,
        summary: `${uniqueTerms.length} terme(s) sensible(s) detecte(s) dans ${result.documents_imported} document(s)`,
        impacted_clients: result.impacted_clients,
      });
    }
  }

  return alerts;
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/import-ccn', '').replace(/^\/+/, '');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // GET /status
    if (req.method === 'GET' && path === 'status') {
      const { data: stats } = await supabase.from('ccn_catalogue').select('idcc, label, is_imported, chunks_count, last_import_at').order('idcc');
      const { count: totalChunks } = await supabase.from('ccn').select('id', { count: 'exact', head: true });
      const { data: recentLogs } = await supabase.from('ccn_import_logs').select('*').order('started_at', { ascending: false }).limit(10);
      const { data: pendingAlerts } = await supabase.from('ccn_notifications').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(20);
      const { data: sopKeywords } = await supabase.from('sop_keywords').select('keyword, category, is_active').order('keyword');

      return new Response(JSON.stringify({
        total_ccn: stats?.length || 0,
        imported_ccn: stats?.filter(s => s.is_imported).length || 0,
        total_chunks: totalChunks || 0,
        recent_imports: recentLogs || [],
        pending_alerts: pendingAlerts || [],
        sop_keywords: sopKeywords || [],
        catalogue: stats,
      }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // GET /cron-status
    if (req.method === 'GET' && path === 'cron-status') {
      const { data: cronJob } = await supabase.rpc('get_cron_job_status');
      const { data: recentLogs } = await supabase.from('ccn_import_logs').select('*').order('started_at', { ascending: false }).limit(5);

      return new Response(JSON.stringify({
        cron_job: cronJob,
        recent_executions: recentLogs || [],
      }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // POST /sync-all
    if (req.method === 'POST' && path === 'sync-all') {
      const logId = await createImportLog(supabase, 'cron');

      const { data: activeCcns } = await supabase.from('idcc_ref').select('idcc, kalicont_id').eq('active', true).not('kalicont_id', 'is', null);
      if (!activeCcns || activeCcns.length === 0) {
        if (logId) await updateImportLog(supabase, logId, 'success', []);
        return new Response(JSON.stringify({ message: 'Aucune CCN active' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const token = await getLegifranceToken();
      const sopKeywords = await getSensitiveKeywords(supabase);
      const results: ImportResult[] = [];

      for (const ccn of activeCcns) {
        const result = await importIdcc(supabase, token, ccn.idcc, sopKeywords, false);
        results.push(result);
      }

      if (logId) await updateImportLog(supabase, logId, 'success', results);

      // Send email alerts if there are SOP alerts
      const ccnAlertsForEmail = collectAlertsForEmail(results);
      if (ccnAlertsForEmail.length > 0 && logId) {
        await sendCcnAlertEmails(ccnAlertsForEmail, logId);
      }

      // Run AI compliance analysis for imported CCNs
      const complianceResults = await runComplianceAnalysisForImports(results, logId || undefined);

      return new Response(JSON.stringify({
        total: results.length,
        success: results.filter(r => r.status === 'success').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        errors: results.filter(r => r.status === 'error').length,
        sop_alerts: results.reduce((sum, r) => sum + r.sop_alerts.length, 0),
        emails_sent: ccnAlertsForEmail.length > 0,
        compliance_analysis: {
          ccns_analyzed: complianceResults.length,
          total_issues: complianceResults.reduce((sum, r) => sum + r.issues_found, 0),
        },
        results,
      }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // POST / - Import specific IDCCs
    if (req.method === 'POST' && (path === '' || path === '/')) {
      const body: ImportRequest = await req.json();
      const { idcc_list, force_update = false } = body;

      if (!idcc_list || !Array.isArray(idcc_list) || idcc_list.length === 0) {
        return new Response(JSON.stringify({ error: 'idcc_list requis' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const logId = await createImportLog(supabase, 'manual');
      const token = await getLegifranceToken();
      const sopKeywords = await getSensitiveKeywords(supabase);
      const results: ImportResult[] = [];

      for (const idcc of idcc_list) {
        const { data: catalogueEntry } = await supabase.from('ccn_catalogue').select('kali_cont_id').eq('idcc', idcc).single();
        if (!catalogueEntry?.kali_cont_id) {
          results.push({ idcc, status: 'error', documents_found: 0, documents_imported: 0, chunks_created: 0, sop_alerts: [], sop_titles: [], impacted_clients: [], error: 'KALICONT_ID non trouve' });
          continue;
        }

        let result = await importIdcc(supabase, token, idcc, sopKeywords, force_update);
        if (result.documents_found === 0) {
          result = await importContainerForIdcc(supabase, token, idcc, catalogueEntry.kali_cont_id, sopKeywords, force_update);
        }
        results.push(result);
      }

      if (logId) await updateImportLog(supabase, logId, 'success', results);

      // Send email alerts if there are SOP alerts
      const ccnAlertsForEmail2 = collectAlertsForEmail(results);
      if (ccnAlertsForEmail2.length > 0 && logId) {
        await sendCcnAlertEmails(ccnAlertsForEmail2, logId);
      }

      // Run AI compliance analysis for imported CCNs
      const complianceResults2 = await runComplianceAnalysisForImports(results, logId || undefined);

      return new Response(JSON.stringify({
        total: results.length,
        success: results.filter(r => r.status === 'success').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        errors: results.filter(r => r.status === 'error').length,
        sop_alerts: results.reduce((sum, r) => sum + r.sop_alerts.length, 0),
        emails_sent: ccnAlertsForEmail2.length > 0,
        compliance_analysis: {
          ccns_analyzed: complianceResults2.length,
          total_issues: complianceResults2.reduce((sum, r) => sum + r.issues_found, 0),
        },
        results,
      }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    return new Response(JSON.stringify({ error: 'Endpoint non trouve' }), { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

  } catch (error) {
    console.error('[import-ccn] Erreur:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur interne' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});
