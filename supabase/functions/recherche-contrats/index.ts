import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const MISTRAL_API_KEY = Deno.env.get('MISTRAL_API_KEY')!;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type ResponseLength = 'short' | 'medium' | 'long';

interface SearchRequest {
  query: string;
  client_id?: string;
  client_code?: string;
  top_k?: number;
  history?: Message[];
  response_length?: ResponseLength;
}

// Configuration de la longueur de réponse
const RESPONSE_LENGTH_CONFIG = {
  short: { max_tokens: 500, instruction: 'Réponds de manière très concise en 2-3 phrases maximum. Va droit au but.' },
  medium: { max_tokens: 1024, instruction: 'Réponds de manière équilibrée, ni trop courte ni trop longue.' },
  long: { max_tokens: 2048, instruction: 'Réponds de manière détaillée et complète, en développant les points importants.' }
};

// Types de documents valides pour le filtrage
const VALID_DOCUMENT_TYPES = ['commercial', 'contrat', 'avenant', 'convention', 'sinistre', 'facture', 'courrier'];

/**
 * Interface pour la classification LLM
 */
interface QueryClassification {
  intent: 'general_question' | 'client_list' | 'document_search';
  client_name: string | null;
  document_type: string | null;
  confidence: number;
}

/**
 * Classification 100% regex - SANS LLM (v28)
 * Plus fiable, plus rapide, plus prévisible
 * Le client est identifié par SQL fuzzy, pas par cette fonction
 */
function classifyQuery(query: string): QueryClassification {
  const q = query.toLowerCase().trim();
  console.log('[recherche-contrats] Classification regex v28:', q);

  // ============================================
  // 1. LISTE DES CLIENTS (PRIORITÉ ABSOLUE)
  // ============================================
  const clientListPatterns = [
    /liste\s+(des\s+)?clients/i,
    /quels?\s+(sont\s+)?(les\s+)?clients/i,
    /qui\s+sont\s+(les\s+)?clients/i,
    /clients?\s+(actuels?|de\s+waltera)/i,
    /combien\s+(de\s+|d[''])?clients/i,
    /nos\s+clients/i,
    /portefeuille\s+(clients?)?/i,
    /liste\s+(des\s+)?prospects?/i,
    /quels?\s+(sont\s+)?(les\s+)?prospects?/i,
    /donne[- ]?moi\s+(la\s+)?liste/i,
    /montre[- ]?moi\s+(les\s+)?clients/i,
    /affiche[- ]?(moi\s+)?(les\s+)?clients/i,
    /voir\s+(les\s+)?clients/i,
    /clients\s+waltera/i,
    /tous\s+(les\s+)?clients/i,
  ];

  for (const pattern of clientListPatterns) {
    if (pattern.test(q)) {
      console.log('[recherche-contrats] Intent: client_list');
      return { intent: 'client_list', client_name: null, document_type: null, confidence: 1.0 };
    }
  }

  // ============================================
  // 2. QUESTIONS GÉNÉRALES
  // ============================================
  const generalPatterns = [
    // Salutations d'ouverture
    /^(bonjour|salut|hello|coucou|bonsoir|hey|hi)\b/i,
    // Salutations de fermeture
    /^(merci|au revoir|bye|à bientôt|a bientot|bonne journée|bonne soirée)\b/i,
    // Phrases de clôture de conversation
    /ce\s+sera\s+tout/i,
    /c['']est\s+tout/i,
    /rien\s+d['']autre/i,
    /non\s+merci/i,
    /c['']est\s+bon/i,
    /je\s+n['']ai\s+(plus\s+)?(de\s+)?question/i,
    /pas\s+d['']autre[s]?\s+question/i,
    /c['']est\s+parfait/i,
    // Questions sur la date/heure
    /quelle?\s+(est\s+)?(la\s+)?date/i,
    /quel\s+jour/i,
    // Questions sur l'assistant
    /qui\s+es[- ]?tu/i,
    /que\s+(peux|sais)[- ]?tu\s+faire/i,
    /comment\s+(vas[- ]?tu|ça\s+va|ca\s+va)/i,
    // Confirmations simples
    /^(ok|d'accord|compris|merci bien|parfait|super|génial|genial|cool)\s*[?!.]?$/i,
  ];

  for (const pattern of generalPatterns) {
    if (pattern.test(q)) {
      console.log('[recherche-contrats] Intent: general_question');
      return { intent: 'general_question', client_name: null, document_type: null, confidence: 1.0 };
    }
  }

  // ============================================
  // 3. DÉTECTION DU TYPE DE DOCUMENT (optionnel)
  // ============================================
  let document_type: string | null = null;

  const docTypePatterns: [RegExp, string][] = [
    [/\b(contrats?|police)\b/i, 'contrat'],
    [/\bavenants?\b/i, 'avenant'],
    [/\b(conventions?\s+collective|ccn|idcc)\b/i, 'convention'],
    [/\b(sinistres?|déclaration)\b/i, 'sinistre'],
    [/\b(factures?|facturation)\b/i, 'facture'],
    [/\b(courriers?|correspondance|lettre)\b/i, 'courrier'],
    [/\b(devis|propositions?|offres?\s+commerciale|commercial)\b/i, 'commercial'],
  ];

  for (const [pattern, docType] of docTypePatterns) {
    if (pattern.test(q)) {
      document_type = docType;
      console.log('[recherche-contrats] Document type détecté:', docType);
      break;
    }
  }

  // ============================================
  // 4. PAR DÉFAUT: RECHERCHE DOCUMENTAIRE
  // ============================================
  console.log('[recherche-contrats] Intent: document_search (défaut)');
  return { intent: 'document_search', client_name: null, document_type, confidence: 1.0 };
}

/**
 * Formatte la date du jour en français
 */
function formatCurrentDate(): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Paris'
  };
  return new Date().toLocaleDateString('fr-FR', options);
}

/**
 * Extrait les candidats potentiels pour la recherche de client (v29)
 * Retourne une liste ordonnée de termes à tester avec search_client()
 */
function extractClientCandidates(query: string): string[] {
  const candidates: string[] = [];
  const q = query.trim();

  // 1. CODES CLIENTS (priorité absolue) - G0001, G001, etc.
  const codePattern = /\b([A-Z]\d{3,5})\b/gi;
  const codeMatches = q.match(codePattern);
  if (codeMatches) {
    candidates.push(...codeMatches.map(c => c.toUpperCase()));
  }

  // 2. MOTS APRÈS "client" / "pour" / "concernant" / "parlons de"
  const afterKeywordPatterns = [
    /(?:client|pour|concernant|parlons\s+d[eu]|à\s+propos\s+d[eu]|sur)\s+(?:le\s+client\s+)?([A-Za-zÀ-ÿ\s&'-]+?)(?:\s*[,?.!]|$)/gi,
  ];

  for (const pattern of afterKeywordPatterns) {
    let match;
    while ((match = pattern.exec(q)) !== null) {
      let extracted = match[1].trim();
      // Nettoyer: retirer "client", "le client", ou articles seuls au début
      extracted = extracted.replace(/^(le\s+)?client\s+/i, '').trim();
      extracted = extracted.replace(/^(la|le|les|l'|un|une|des)\s+/i, '').trim();
      if (extracted.length >= 3) {
        // Ajouter la phrase entière extraite
        candidates.push(extracted);
        // Ajouter aussi le premier mot seul s'il y en a plusieurs
        const words = extracted.split(/\s+/);
        if (words.length > 1 && words[0].length >= 3) {
          candidates.push(words[0]);
        }
      }
    }
  }

  // 3. MOTS EN MAJUSCULES (noms de sociétés)
  const upperCasePattern = /\b([A-Z]{2,}(?:\s*[&-]\s*[A-Z]+)?)\b/g;
  const upperMatches = q.match(upperCasePattern);
  if (upperMatches) {
    candidates.push(...upperMatches);
  }

  // 4. TOUS LES MOTS SIGNIFICATIFS (>= 4 caractères, pas stopwords)
  const stopWords = new Set([
    'pour', 'avec', 'dans', 'quel', 'quels', 'quelle', 'quelles', 'sont', 'est', 'cette',
    'votre', 'notre', 'leur', 'leurs', 'vous', 'nous', 'elle', 'elles', 'tout', 'tous',
    'toute', 'toutes', 'plus', 'moins', 'bien', 'très', 'aussi', 'comme', 'mais', 'donc',
    'ainsi', 'alors', 'depuis', 'entre', 'vers', 'chez', 'sans', 'sous', 'avant', 'après',
    'pendant', 'informations', 'information', 'renseignement', 'renseignements', 'détails',
    'contrat', 'contrats', 'garantie', 'garanties', 'assurance', 'assurances', 'document',
    'documents', 'dossier', 'dossiers', 'client', 'clients', 'parlons', 'concernant',
    'souhaiterais', 'voudrais', 'aimerais', 'pourriez', 'pouvez', 'merci', 'svp', 'please'
  ]);

  const words = q.split(/[\s,;:!?.]+/);
  for (const word of words) {
    const cleanWord = word.replace(/^['"«»]+|['"«»]+$/g, '').trim();
    if (cleanWord.length >= 4 && !stopWords.has(cleanWord.toLowerCase())) {
      candidates.push(cleanWord);
    }
  }

  // Dédupliquer et retourner
  const seen = new Set<string>();
  const uniqueCandidates: string[] = [];
  for (const c of candidates) {
    const normalized = c.toLowerCase().trim();
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      uniqueCandidates.push(c.trim());
    }
  }

  console.log('[recherche-contrats] Candidats extraits:', uniqueCandidates);
  return uniqueCandidates;
}

/**
 * Extrait le DERNIER client mentionné dans l'historique de conversation (v30)
 * Parcourt les messages du plus récent au plus ancien et s'arrête dès qu'un client est trouvé
 * @returns Les candidats du dernier client mentionné (priorité: code > nom)
 */
function extractClientFromHistory(history: Message[]): string[] {
  if (!history || history.length === 0) {
    return [];
  }

  // Parcourir l'historique du plus récent au plus ancien
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    const content = msg.content;
    const candidates: string[] = [];

    // 1. Pattern: "client **NOM** (CODE)" dans les réponses assistant (le plus fiable)
    // Ex: "Pour le client **FONDATION DES AMIS DE L'ATELIER** (G0003)"
    const clientBoldPattern = /client\s+\*\*([^*]+)\*\*(?:\s*\(([A-Z]\d{3,5})\))?/gi;
    let match;
    while ((match = clientBoldPattern.exec(content)) !== null) {
      if (match[2]) {
        // Code client trouvé - priorité absolue
        console.log('[recherche-contrats] Client trouvé dans historique (code):', match[2]);
        return [match[2]];
      }
      if (match[1]) {
        candidates.push(match[1].trim());
      }
    }

    // 2. Pattern: code client seul dans le texte (G0001, G0003, etc.)
    const codePattern = /\b([A-Z]\d{3,5})\b/g;
    while ((match = codePattern.exec(content)) !== null) {
      console.log('[recherche-contrats] Code client trouvé dans historique:', match[1]);
      return [match[1]];
    }

    // 3. Pour les messages utilisateur: extraire les candidats
    if (msg.role === 'user') {
      const extracted = extractClientCandidates(content);
      if (extracted.length > 0) {
        console.log('[recherche-contrats] Candidats du dernier message user:', extracted);
        return extracted;
      }
    }

    // Si on a trouvé un nom de client (sans code), le retourner
    if (candidates.length > 0) {
      console.log('[recherche-contrats] Nom client trouvé dans historique:', candidates);
      return candidates;
    }
  }

  console.log('[recherche-contrats] Aucun client trouvé dans l\'historique');
  return [];
}

/**
 * Génère des variations d'un code client pour recherche floue
 * Ex: "G013" → ["G013", "G0013", "G00013"]
 * Ex: "G0013" → ["G0013", "G013"]
 */
function generateCodeVariations(code: string): string[] {
  const variations: string[] = [code];

  // Pattern: Lettre(s) + chiffres
  const match = code.match(/^([A-Z]+)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const number = match[2];

    // Ajouter des zéros: G013 → G0013, G00013
    if (number.length < 4) {
      variations.push(prefix + '0' + number);
      variations.push(prefix + '00' + number);
    }

    // Retirer un zéro si présent: G0013 → G013
    if (number.startsWith('0')) {
      variations.push(prefix + number.substring(1));
    }

    // Format standard avec padding: G13 → G0013
    const paddedNumber = number.padStart(4, '0');
    if (!variations.includes(prefix + paddedNumber)) {
      variations.push(prefix + paddedNumber);
    }
  }

  console.log(`[recherche-contrats] Variations de code générées pour "${code}":`, variations);
  return [...new Set(variations)]; // Dédupliquer
}


/**
 * Génère une réponse pour les questions générales sans recherche documentaire
 */
async function handleGeneralQuestion(query: string, responseConfig: { max_tokens: number; instruction: string }): Promise<Response> {
  const currentDate = formatCurrentDate();

  const systemPrompt = `Tu es un assistant expert en assurance pour WALTERA, un courtier en assurance.

**Date du jour : ${currentDate}**

Tu peux répondre aux questions générales (date, heure, salutations, etc.) de manière naturelle et professionnelle.

Si l'utilisateur te pose une question sur les contrats, garanties, ou tout sujet lié à l'assurance, invite-le à préciser le nom du client concerné.

IMPORTANT: N'utilise JAMAIS d'emojis dans tes réponses. Reste professionnel et sobre.

${responseConfig.instruction}`;

  const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.5,
      max_tokens: responseConfig.max_tokens,
      stream: true,
    }),
  });

  if (!mistralResponse.ok) {
    const errorText = await mistralResponse.text();
    throw new Error(`Erreur Mistral: ${errorText}`);
  }

  // Stream la réponse
  const stream = new ReadableStream({
    async start(controller) {
      const reader = mistralResponse.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        controller.close();
        return;
      }

      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || line.trim() === 'data: [DONE]') continue;

            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.choices && data.choices[0]?.delta?.content) {
                  const text = data.choices[0].delta.content;
                  controller.enqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`)
                  );
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * Récupère et formate la liste des clients depuis Supabase
 */
async function handleClientListQuestion(query: string, responseConfig: { max_tokens: number; instruction: string }): Promise<Response> {
  const currentDate = formatCurrentDate();
  const queryLower = query.toLowerCase();

  // Créer le client Supabase Admin pour accéder à la table clients
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Déterminer si on veut filtrer par statut
  let statusFilter: string | null = null;
  if (queryLower.includes('prospect')) {
    statusFilter = 'prospect';
  } else if (queryLower.includes('inactif') || queryLower.includes('inactive')) {
    statusFilter = 'inactive';
  }

  // Récupérer les clients (tri par code client)
  let clientsQuery = supabaseAdmin
    .from('clients')
    .select('id, name, code, status, idcc, external_key, siren')
    .order('code', { ascending: true });

  if (statusFilter) {
    clientsQuery = clientsQuery.eq('status', statusFilter);
  }

  const { data: clients, error } = await clientsQuery;

  if (error) {
    console.error('[recherche-contrats] Erreur récupération clients:', error);
    throw new Error(`Erreur base de données: ${error.message}`);
  }

  // Fonction pour trier par numéro de code client (G0001 < G0002 < G0010)
  const sortByClientCode = (a: any, b: any) => {
    const codeA = a.code || 'Z9999';
    const codeB = b.code || 'Z9999';
    return codeA.localeCompare(codeB, undefined, { numeric: true });
  };

  // Formater la liste des clients
  const clientsCount = clients?.length || 0;
  const activeClients = (clients?.filter(c => c.status === 'client') || []).sort(sortByClientCode);
  const prospects = (clients?.filter(c => c.status === 'prospect') || []).sort(sortByClientCode);
  const inactiveClients = (clients?.filter(c => c.status === 'inactive') || []).sort(sortByClientCode);

  // Fonction pour formater un client : Nom (Code) | IDCC: xxx
  const formatClient = (c: any) => {
    const idccList = c.idcc && c.idcc.length > 0 ? ` | IDCC: ${c.idcc.join(', ')}` : '';
    return `- **${c.name}** (${c.code || 'N/A'})${idccList}`;
  };

  // Construire le contexte pour Mistral
  let clientsContext = `## Liste des clients WALTERA (${clientsCount} au total)\n\n`;

  if (activeClients.length > 0) {
    clientsContext += `### Clients actifs (${activeClients.length})\n`;
    clientsContext += activeClients.map(formatClient).join('\n');
    clientsContext += '\n\n';
  }

  if (prospects.length > 0) {
    clientsContext += `### Prospects (${prospects.length})\n`;
    clientsContext += prospects.map(formatClient).join('\n');
    clientsContext += '\n\n';
  }

  if (inactiveClients.length > 0) {
    clientsContext += `### Clients inactifs (${inactiveClients.length})\n`;
    clientsContext += inactiveClients.map(formatClient).join('\n');
  }

  const systemPrompt = `Tu es un assistant expert en assurance pour WALTERA, un courtier en assurance.

**Date du jour : ${currentDate}**

Voici les informations sur le portefeuille clients de WALTERA :

${clientsContext}

IMPORTANT: N'utilise JAMAIS d'emojis dans tes réponses. Reste professionnel et sobre.

Réponds à la question de l'utilisateur en utilisant ces informations. ${responseConfig.instruction}`;

  const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.3,
      max_tokens: responseConfig.max_tokens,
      stream: true,
    }),
  });

  if (!mistralResponse.ok) {
    const errorText = await mistralResponse.text();
    throw new Error(`Erreur Mistral: ${errorText}`);
  }

  // Stream la réponse
  const stream = new ReadableStream({
    async start(controller) {
      const reader = mistralResponse.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        controller.close();
        return;
      }

      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || line.trim() === 'data: [DONE]') continue;

            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.choices && data.choices[0]?.delta?.content) {
                  const text = data.choices[0].delta.content;
                  controller.enqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`)
                  );
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

Deno.serve(async (req: Request) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // 1. Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Utilisateur non trouvé' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse request
    const body: SearchRequest = await req.json();
    let { query, client_id, client_code, top_k = 15, history = [], response_length = 'medium' } = body;

    // Configuration de la réponse selon la longueur demandée
    const responseConfig = RESPONSE_LENGTH_CONFIG[response_length];

    console.log('[recherche-contrats] Requête initiale:', { query, client_id, client_code, top_k, response_length, historyLength: history.length });

    // 2.0. Classification 100% regex (v28 - sans LLM, plus fiable et rapide)
    const classification = classifyQuery(query);
    console.log('[recherche-contrats] Classification:', classification);

    // 2.0.a Gérer les questions générales
    if (classification.intent === 'general_question') {
      console.log('[recherche-contrats] Intent: question générale, réponse directe');
      return await handleGeneralQuestion(query, responseConfig);
    }

    // 2.0.b Gérer les questions sur la liste des clients
    if (classification.intent === 'client_list') {
      console.log('[recherche-contrats] Intent: liste clients, interrogation de la base');
      return await handleClientListQuestion(query, responseConfig);
    }

    // 2.0.c Intent: document_search - continuer avec le pipeline RAG
    console.log('[recherche-contrats] Intent: recherche documentaire');

    // 2.1. Créer le client Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2.2. Identifier le client via extraction + recherche fuzzy SQL (v30)
    // D'abord chercher dans la requête, puis fallback sur l'historique
    if (!client_id && !client_code) {
      console.log('[recherche-contrats] Extraction des candidats client...');

      // Étape 1: Chercher dans la requête courante
      let candidates = extractClientCandidates(query);
      let bestMatch: { client_id: string; client_code: string; client_name: string; match_score: number } | null = null;
      let searchedFromHistory = false;

      // Tester chaque candidat avec search_client()
      for (const candidate of candidates) {
        console.log('[recherche-contrats] Test candidat (requête):', candidate);

        const { data: fuzzyResults, error: fuzzyError } = await supabaseAdmin
          .rpc('search_client', { search_term: candidate });

        if (fuzzyError) {
          console.error('[recherche-contrats] Erreur search_client:', fuzzyError);
          continue;
        }

        if (fuzzyResults && fuzzyResults.length > 0) {
          const topResult = fuzzyResults[0];
          console.log('[recherche-contrats] Résultat pour', candidate, ':', topResult.client_name, 'score:', topResult.match_score);

          // Garder le meilleur match (score >= 0.5)
          if (topResult.match_score >= 0.5 && (!bestMatch || topResult.match_score > bestMatch.match_score)) {
            bestMatch = topResult;
            console.log('[recherche-contrats] Nouveau meilleur match:', bestMatch.client_name, 'score:', bestMatch.match_score);

            // Si score parfait (1.0), arrêter la recherche
            if (topResult.match_score >= 0.95) {
              console.log('[recherche-contrats] Score parfait, arrêt de la recherche');
              break;
            }
          }
        }
      }

      // Étape 2: Si aucun client trouvé dans la requête, chercher dans l'historique (v30)
      if (!bestMatch && history && history.length > 0) {
        console.log('[recherche-contrats] Aucun client dans la requête, recherche dans l\'historique...');
        const historyCandidates = extractClientFromHistory(history);
        searchedFromHistory = true;

        for (const candidate of historyCandidates) {
          console.log('[recherche-contrats] Test candidat (historique):', candidate);

          const { data: fuzzyResults, error: fuzzyError } = await supabaseAdmin
            .rpc('search_client', { search_term: candidate });

          if (fuzzyError) {
            console.error('[recherche-contrats] Erreur search_client:', fuzzyError);
            continue;
          }

          if (fuzzyResults && fuzzyResults.length > 0) {
            const topResult = fuzzyResults[0];
            console.log('[recherche-contrats] Résultat historique pour', candidate, ':', topResult.client_name, 'score:', topResult.match_score);

            // Garder le meilleur match (score >= 0.5)
            if (topResult.match_score >= 0.5 && (!bestMatch || topResult.match_score > bestMatch.match_score)) {
              bestMatch = topResult;
              console.log('[recherche-contrats] Client trouvé via historique:', bestMatch.client_name, 'score:', bestMatch.match_score);

              // Si score parfait, arrêter
              if (topResult.match_score >= 0.95) {
                console.log('[recherche-contrats] Score parfait depuis historique, arrêt');
                break;
              }
            }
          }
        }
      }

      // Appliquer le meilleur match trouvé
      if (bestMatch) {
        client_id = bestMatch.client_id;
        client_code = bestMatch.client_code;
        console.log('[recherche-contrats] Client identifié' + (searchedFromHistory && !candidates.length ? ' (via historique)' : '') + ':', {
          client_name: bestMatch.client_name,
          client_code: bestMatch.client_code,
          match_score: bestMatch.match_score
        });
      } else {
        console.log('[recherche-contrats] Aucun client trouvé (ni requête, ni historique)');
      }
    }

    // 2.3. Si toujours pas de client, demander clarification
    if (!client_id && !client_code) {
      console.log('[recherche-contrats] Client non identifié, demande de clarification');

      // Récupérer quelques clients pour suggestion
      const { data: sampleClientsData } = await supabaseAdmin
        .from('clients')
        .select('id, name, code')
        .eq('status', 'client')
        .order('name', { ascending: true })
        .limit(10);

      const clientsList = sampleClientsData || [];

      const clarificationMessage = `Je n'ai pas pu identifier de quel client vous parlez.

Pourriez-vous préciser le client concerné ? Voici quelques clients disponibles :

${clientsList.map(c => `- **${c.code}** - ${c.name}`).join('\n')}

Reformulez votre question en incluant le nom ou le code du client, par exemple :
- "Pour le client ALTESSE, quelles sont les garanties ?"
- "Garanties hospitalisation pour G0001"`;

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ text: clarificationMessage })}\n\n`)
          );
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    console.log('[recherche-contrats] Client final:', { client_id, client_code });

    // 2.4. Type de document depuis la classification regex
    const detectedDocumentType = classification.document_type;
    if (detectedDocumentType) {
      console.log('[recherche-contrats] Document type détecté:', detectedDocumentType);
    }

    // 3. Generate embedding with Mistral
    const embeddingResponse = await fetch('https://api.mistral.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-embed',
        input: [query],
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('[recherche-contrats] Erreur Mistral Embed:', errorText);
      throw new Error(`Erreur Mistral Embed: ${errorText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log('[recherche-contrats] Embedding généré, dimension:', queryEmbedding.length);

    // 4. Vector search with client filtering
    console.log('[recherche-contrats] Recherche avec filtres:', { client_id, client_code });

    // Construire le filtre JSONB
    const filter: any = {};
    if (client_id) {
      filter.client_id = client_id;
    }
    if (client_code) {
      filter.client_code = client_code;
    }
    if (detectedDocumentType) {
      filter.document_type = detectedDocumentType;
    }

    // Utiliser la fonction match_documents RPC avec la signature optimisée
    let rpcParams = {
      query_embedding: queryEmbedding,
      match_count: top_k,
      filter: filter,
      match_threshold: 0.7,  // Seuil de similarité à 70%
    };

    console.log('[recherche-contrats] Paramètres RPC:', rpcParams);

    let { data: chunks, error: searchError } = await supabaseAdmin
      .rpc('match_documents', rpcParams);

    if (searchError) {
      console.error('[recherche-contrats] Erreur recherche vectorielle:', searchError);
      console.error('[recherche-contrats] Message:', searchError.message);
      console.error('[recherche-contrats] Code:', searchError.code);

      // Message d'erreur détaillé
      return new Response(JSON.stringify({
        error: 'Erreur lors de la recherche dans les documents',
        details: searchError.message,
        hint: 'Vérifiez que la fonction match_documents existe et que la table documents contient des embeddings'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Fallback : si le filtrage par document_type ne donne aucun résultat, retenter sans ce filtre
    if ((!chunks || chunks.length === 0) && detectedDocumentType) {
      console.log('[recherche-contrats] Aucun résultat avec document_type, fallback sans ce filtre...');
      const filterWithoutDocType: any = {};
      if (client_id) filterWithoutDocType.client_id = client_id;
      if (client_code) filterWithoutDocType.client_code = client_code;

      const fallbackParams = {
        query_embedding: queryEmbedding,
        match_count: top_k,
        filter: filterWithoutDocType,
        match_threshold: 0.7,
      };

      const fallbackResult = await supabaseAdmin.rpc('match_documents', fallbackParams);
      if (!fallbackResult.error) {
        chunks = fallbackResult.data;
        console.log('[recherche-contrats] Chunks trouvés après fallback:', chunks?.length || 0);
      }
    }

    console.log('[recherche-contrats] Chunks trouvés:', chunks?.length || 0);

    if (!chunks || chunks.length === 0) {
      // Répondre avec un message indiquant qu'aucun document n'a été trouvé
      const stream = new ReadableStream({
        start(controller) {
          const message = "Je n'ai trouvé aucun document correspondant à votre recherche. Veuillez reformuler votre question ou vérifier que des documents ont bien été importés.";
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ text: message })}\n\n`)
          );
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 5. Regrouper les chunks par document source
    const documentGroups = new Map<string, any>();

    chunks?.forEach((chunk: any) => {
      const metadata = chunk.metadata || {};
      const filePath = metadata.file_path || 'Document inconnu';

      if (!documentGroups.has(filePath)) {
        documentGroups.set(filePath, {
          file_path: filePath,
          client_name: metadata.client_name || 'N/A',
          chunks: [],
          max_similarity: 0
        });
      }

      const group = documentGroups.get(filePath);
      group.chunks.push(chunk.content);
      group.max_similarity = Math.max(group.max_similarity, chunk.similarity || 0);
    });

    // Trier les documents par pertinence maximale
    const sortedDocuments = Array.from(documentGroups.values())
      .sort((a, b) => b.max_similarity - a.max_similarity);

    // Construire le contexte avec les documents sources
    const context = sortedDocuments.map((doc, idx) => {
      const fileName = doc.file_path.split('/').pop() || doc.file_path;
      return `[Source ${idx + 1}: ${fileName}]\nPertinence: ${(doc.max_similarity * 100).toFixed(1)}%\n\nExtraits:\n${doc.chunks.join('\n\n')}\n`;
    }).join('\n---\n\n');

    console.log('[recherche-contrats] Documents sources:', sortedDocuments.length, 'Chunks totaux:', chunks?.length || 0);

    // 6. Generate response with Mistral (streaming)
    const clientName = chunks?.[0]?.metadata?.client_name || '';
    const currentDate = formatCurrentDate();

    const systemPrompt = `Tu es un assistant expert en analyse de contrats d'assurance pour WALTERA.

**Date du jour : ${currentDate}**

${clientName ? `Tu réponds actuellement pour le client **${clientName}** (${client_code}).` : ''}

Tu as accès aux documents sources suivants :

${context}

IMPORTANT pour les citations :
- Cite tes sources en utilisant le nom du fichier (ex: "Conditions générales - SURCO.pdf")
- Ne cite PAS "Document 1, 2, 3" mais le NOM RÉEL du fichier
- Plusieurs extraits peuvent provenir du même document source

IMPORTANT: N'utilise JAMAIS d'emojis dans tes réponses. Reste professionnel et sobre.

${responseConfig.instruction}

Réponds UNIQUEMENT avec ces documents.
Sois précis et professionnel.
${clientName ? `Mentionne le client (${clientName}) dans ta réponse.` : ''}`;

    // Construire l'historique des messages pour Mistral
    const mistralMessages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: query }
    ];

    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest', // Le meilleur modèle Mistral pour la génération
        messages: mistralMessages,
        temperature: 0.3, // Réponses plus factuelles
        max_tokens: responseConfig.max_tokens,
        stream: true, // Activer le streaming
      }),
    });

    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      console.error('[recherche-contrats] Erreur Mistral Chat:', errorText);
      throw new Error(`Erreur Mistral Chat: ${errorText}`);
    }

    console.log('[recherche-contrats] Début du streaming Mistral...');

    // 7. Stream response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = mistralResponse.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          controller.close();
          return;
        }

        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || line.trim() === 'data: [DONE]') continue;

              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  // Mistral envoie le contenu dans choices[0].delta.content
                  if (data.choices && data.choices[0]?.delta?.content) {
                    const text = data.choices[0].delta.content;
                    controller.enqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`)
                    );
                  }
                } catch (e) {
                  console.error('[recherche-contrats] Erreur parsing SSE:', e);
                }
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error('[recherche-contrats] Erreur streaming:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('[recherche-contrats] Erreur générale:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
