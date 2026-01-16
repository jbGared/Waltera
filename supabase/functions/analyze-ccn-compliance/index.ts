import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const MISTRAL_API_KEY = Deno.env.get('MISTRAL_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// TYPES
// ============================================

interface ComplianceRequest {
  idcc: string;
  import_log_id?: string;
  client_id?: string;      // Optionnel: analyser un seul client
  max_clients?: number;    // Optionnel: limiter le nombre de clients (défaut: 3)
  offset?: number;         // Optionnel: décalage pour pagination (défaut: 0)
}

interface ComplianceIssue {
  severity: 'info' | 'warning' | 'critical';
  category: string;
  title: string;
  description: string;
  ccn_requirement?: string;
  contract_clause?: string;
  recommended_action?: string;
}

interface ClientAnalysisResult {
  client_id: string;
  client_name: string;
  issues: ComplianceIssue[];
}

interface CcnChunk {
  id: number;
  content: string;
  metadata: {
    idcc?: string;
    titre?: string;
    type_text?: string;
    ccn_label?: string;
  };
}

interface ContractChunk {
  id: number;
  content: string;
  metadata: {
    client_name?: string;
    client_idcc?: string[];
    document_type?: string;
    file_path?: string;
  };
}

// ============================================
// DATABASE QUERIES
// ============================================

async function getCcnChunks(supabase: SupabaseClient, idcc: string): Promise<CcnChunk[]> {
  const idccPadded = String(idcc).padStart(4, '0');

  // Les CCN sont dans la table 'ccn'
  const { data, error } = await supabase
    .from('ccn')
    .select('id, content, metadata')
    .or(`metadata->>idcc.eq.${idcc},metadata->>idcc.eq.${idccPadded}`)
    .limit(50);

  if (error) {
    console.error('[analyze-ccn-compliance] Erreur recuperation chunks CCN:', error);
    return [];
  }

  return data || [];
}

async function getClientsWithIdcc(supabase: SupabaseClient, idcc: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .contains('idcc', [idcc]);

  if (error) {
    console.error('[analyze-ccn-compliance] Erreur recherche clients:', error);
    return [];
  }

  return data || [];
}

async function getClientContractChunks(supabase: SupabaseClient, clientName: string, idcc: string): Promise<ContractChunk[]> {
  // Les documents contractuels sont dans la table 'documents'
  // client_idcc est un array JSON, on doit vérifier si l'IDCC est dedans
  const { data, error } = await supabase
    .from('documents')
    .select('id, content, metadata')
    .eq('metadata->>document_type', 'contractuel')
    .eq('metadata->>client_name', clientName)
    .not('is_deleted', 'eq', true)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error(`[analyze-ccn-compliance] Erreur recuperation contrats client ${clientName}:`, error);
    return [];
  }

  // Filtrer côté serveur les documents qui ont l'IDCC dans leur array client_idcc
  const filtered = (data || []).filter(doc => {
    const clientIdcc = doc.metadata?.client_idcc;
    if (Array.isArray(clientIdcc)) {
      return clientIdcc.includes(idcc) || clientIdcc.includes(idcc.padStart(4, '0'));
    }
    return false;
  });

  return filtered;
}

async function getCcnLabel(supabase: SupabaseClient, idcc: string): Promise<string | null> {
  const { data } = await supabase
    .from('idcc_ref')
    .select('label')
    .eq('idcc', idcc)
    .single();

  return data?.label || null;
}

// ============================================
// AI ANALYSIS WITH MISTRAL
// ============================================

async function analyzeWithMistral(
  ccnContent: string,
  contractContent: string,
  clientName: string,
  ccnLabel: string
): Promise<ComplianceIssue[]> {
  const systemPrompt = `Tu es un expert en droit du travail et en conformite des contrats d'assurance collective.
Tu analyses si les contrats d'un client respectent les exigences de sa convention collective (CCN).

Tu dois identifier les ecarts de conformite dans les categories suivantes:
- GARANTIES_INSUFFISANTES: Niveau de couverture inferieur aux minimums CCN
- CLAUSE_MANQUANTE: Clause obligatoire absente du contrat
- DELAI_NON_CONFORME: Delais de carence ou franchise non conformes
- BENEFICIAIRES_EXCLUS: Categories de beneficiaires non couvertes
- OPTION_OBLIGATOIRE: Option rendue obligatoire par la CCN mais non souscrite

Pour chaque probleme identifie, fournis:
- La severite: "critical" (non-conformite majeure), "warning" (ecart a corriger), "info" (amelioration possible)
- La categorie parmi celles listees
- Un titre court et clair
- Une description du probleme
- L'exigence CCN concernee
- La clause contractuelle analysee
- Une recommandation d'action

Reponds UNIQUEMENT en JSON valide avec le format:
{
  "issues": [
    {
      "severity": "warning",
      "category": "GARANTIES_INSUFFISANTES",
      "title": "Titre du probleme",
      "description": "Description detaillee",
      "ccn_requirement": "Texte de l'exigence CCN",
      "contract_clause": "Extrait du contrat",
      "recommended_action": "Action recommandee"
    }
  ]
}

Si tout est conforme ou si tu ne peux pas determiner de non-conformite, retourne: {"issues": []}`;

  const userPrompt = `Analyse la conformite des contrats du client "${clientName}" avec la convention collective "${ccnLabel}".

=== EXIGENCES DE LA CONVENTION COLLECTIVE ===
${ccnContent}

=== CONTRATS DU CLIENT ===
${contractContent}

Identifie les ecarts de conformite entre les exigences CCN et les garanties contractuelles.`;

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[analyze-ccn-compliance] Erreur Mistral:', errorText);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[analyze-ccn-compliance] Reponse Mistral vide');
      return [];
    }

    const parsed = JSON.parse(content);
    return parsed.issues || [];
  } catch (error) {
    console.error('[analyze-ccn-compliance] Erreur analyse Mistral:', error);
    return [];
  }
}

// ============================================
// SAVE COMPLIANCE ALERTS
// ============================================

async function saveComplianceAlerts(
  supabase: SupabaseClient,
  idcc: string,
  ccnLabel: string | null,
  clientId: string,
  clientName: string,
  issues: ComplianceIssue[],
  importLogId?: string,
  ccnChunkIds?: number[],
  contractChunkIds?: number[]
): Promise<number> {
  if (issues.length === 0) return 0;

  const alerts = issues.map(issue => ({
    import_log_id: importLogId || null,
    idcc,
    ccn_label: ccnLabel,
    client_id: clientId,
    client_name: clientName,
    severity: issue.severity,
    category: issue.category,
    title: issue.title,
    description: issue.description,
    ccn_requirement: issue.ccn_requirement || null,
    contract_clause: issue.contract_clause || null,
    recommended_action: issue.recommended_action || null,
    ccn_chunk_ids: ccnChunkIds || [],
    contract_chunk_ids: contractChunkIds || [],
    status: 'pending',
  }));

  const { error } = await supabase
    .from('ccn_compliance_alerts')
    .insert(alerts);

  if (error) {
    console.error('[analyze-ccn-compliance] Erreur sauvegarde alertes:', error);
    return 0;
  }

  return alerts.length;
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

async function analyzeCompliance(
  supabase: SupabaseClient,
  idcc: string,
  importLogId?: string,
  specificClientId?: string,
  maxClients: number = 3,
  offset: number = 0
): Promise<{ clients_analyzed: number; issues_found: number; total_clients: number; offset: number; results: ClientAnalysisResult[] }> {
  console.log(`[analyze-ccn-compliance] Debut analyse IDCC ${idcc}${specificClientId ? ` (client specifique: ${specificClientId})` : ` (max ${maxClients} clients, offset ${offset})`}`);

  // Get CCN chunks from 'ccn' table
  const ccnChunks = await getCcnChunks(supabase, idcc);
  if (ccnChunks.length === 0) {
    console.log(`[analyze-ccn-compliance] Aucun chunk CCN trouve pour IDCC ${idcc}`);
    return { clients_analyzed: 0, issues_found: 0, total_clients: 0, offset, results: [] };
  }

  const ccnLabel = await getCcnLabel(supabase, idcc);
  const ccnContent = ccnChunks.map(c => c.content).join('\n\n---\n\n');
  const ccnChunkIds = ccnChunks.map(c => c.id);

  console.log(`[analyze-ccn-compliance] ${ccnChunks.length} chunks CCN trouves pour IDCC ${idcc}`);

  // Get clients with this IDCC
  let clients: { id: string; name: string }[];

  if (specificClientId) {
    // Fetch specific client
    const { data, error } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', specificClientId)
      .contains('idcc', [idcc])
      .single();

    if (error || !data) {
      console.log(`[analyze-ccn-compliance] Client ${specificClientId} non trouve ou n'a pas l'IDCC ${idcc}`);
      return { clients_analyzed: 0, issues_found: 0, total_clients: 0, offset, results: [] };
    }
    clients = [data];
  } else {
    clients = await getClientsWithIdcc(supabase, idcc);
  }

  if (clients.length === 0) {
    console.log(`[analyze-ccn-compliance] Aucun client avec IDCC ${idcc}`);
    return { clients_analyzed: 0, issues_found: 0, total_clients: 0, offset, results: [] };
  }

  const totalClients = clients.length;
  console.log(`[analyze-ccn-compliance] ${totalClients} client(s) avec IDCC ${idcc}`);

  // Limit number of clients if not analyzing a specific one (with pagination)
  if (!specificClientId) {
    const startIndex = offset;
    const endIndex = offset + maxClients;
    console.log(`[analyze-ccn-compliance] Pagination: clients ${startIndex + 1} a ${Math.min(endIndex, clients.length)} sur ${clients.length}`);
    clients = clients.slice(startIndex, endIndex);
  }

  const results: ClientAnalysisResult[] = [];
  let totalIssues = 0;
  let clientsWithContracts = 0;

  for (const client of clients) {
    // Get client's contract chunks from 'documents' table
    console.log(`[analyze-ccn-compliance] Recherche contrats pour ${client.name}...`);
    const contractChunks = await getClientContractChunks(supabase, client.name, idcc);
    if (contractChunks.length === 0) {
      console.log(`[analyze-ccn-compliance] Aucun contrat trouve pour client ${client.name}`);
      continue;
    }

    clientsWithContracts++;
    const contractContent = contractChunks.map(c => c.content).join('\n\n---\n\n');
    const contractChunkIds = contractChunks.map(c => c.id);

    // Analyze with Mistral
    console.log(`[analyze-ccn-compliance] Appel Mistral pour ${client.name} (${contractChunks.length} chunks contrat, ${ccnContent.slice(0, 15000).length} chars CCN, ${contractContent.slice(0, 15000).length} chars contrat)`);
    const startTime = Date.now();
    const issues = await analyzeWithMistral(
      ccnContent.slice(0, 15000), // Limit content size
      contractContent.slice(0, 15000),
      client.name,
      ccnLabel || `Convention ${idcc}`
    );
    console.log(`[analyze-ccn-compliance] Mistral repondu en ${Date.now() - startTime}ms avec ${issues.length} issues`);

    // Save alerts
    if (issues.length > 0) {
      const savedCount = await saveComplianceAlerts(
        supabase,
        idcc,
        ccnLabel,
        client.id,
        client.name,
        issues,
        importLogId,
        ccnChunkIds,
        contractChunkIds
      );
      totalIssues += savedCount;
      console.log(`[analyze-ccn-compliance] ${savedCount} alerte(s) sauvegardee(s) pour ${client.name}`);
    }

    results.push({
      client_id: client.id,
      client_name: client.name,
      issues,
    });

    // Rate limiting (reduced)
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`[analyze-ccn-compliance] Analyse terminee: ${clientsWithContracts} clients avec contrats, ${totalIssues} alertes`);

  return {
    clients_analyzed: clientsWithContracts,
    issues_found: totalIssues,
    total_clients: totalClients,
    offset,
    results,
  };
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Methode non autorisee' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const body: ComplianceRequest = await req.json();
    const { idcc, import_log_id, client_id, max_clients, offset } = body;

    if (!idcc) {
      return new Response(
        JSON.stringify({ error: 'idcc requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const result = await analyzeCompliance(
      supabase,
      idcc,
      import_log_id,
      client_id,
      max_clients || 3,
      offset || 0
    );

    return new Response(
      JSON.stringify({
        success: true,
        idcc,
        clients_analyzed: result.clients_analyzed,
        total_clients: result.total_clients,
        offset: result.offset,
        issues_found: result.issues_found,
        details: result.results.map(r => ({
          client_name: r.client_name,
          issues_count: r.issues.length,
          issues: r.issues,
        })),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('[analyze-ccn-compliance] Erreur:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur interne' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
