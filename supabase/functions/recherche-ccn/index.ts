import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const MISTRAL_API_KEY = Deno.env.get('MISTRAL_API_KEY')!;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type ResponseLength = 'short' | 'medium' | 'long';

interface SearchCCNRequest {
  query: string;
  idcc?: string;
  top_k?: number;
  history?: Message[];
  response_length?: ResponseLength;
}

// Configuration de la longueur de reponse
const RESPONSE_LENGTH_CONFIG = {
  short: { max_tokens: 500, instruction: 'Reponds de maniere tres concise en 2-3 phrases maximum. Va droit au but.' },
  medium: { max_tokens: 1500, instruction: 'Reponds de maniere equilibree avec les details essentiels.' },
  long: { max_tokens: 3000, instruction: 'Reponds de maniere detaillee et complete, en developpant les points importants et en citant les sources.' }
};

// Hierarchie juridique des textes CCN
const TYPE_TEXT_PRIORITY: Record<string, number> = {
  'ARRETE_EXTENSION': 1,
  'ARRETE_AGREMENT': 1,
  'ARRETE': 1,
  'AVENANT': 2,
  'ACCORD_SALAIRES': 3,
  'ACCORD_PREVOYANCE': 3,
  'ACCORD_FORMATION': 3,
  'ACCORD_RETRAITE': 3,
  'ACCORD': 3,
  'ANNEXE': 4,
  'TEXTE_BASE': 5,
  'UNKNOWN': 6
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Arrete (force obligatoire)',
  2: 'Avenant (modification)',
  3: 'Accord thematique',
  4: 'Annexe',
  5: 'Texte de base',
  6: 'Autre'
};

/**
 * Interface pour la classification LLM
 */
interface QueryClassification {
  intent: 'general_question' | 'idcc_identification' | 'ccn_search';
  idcc: string | null;
  ccn_name: string | null;
  confidence: number;
}

/**
 * Pre-detection par mots-cles pour les cas evidents
 */
function preDetectIntent(query: string): QueryClassification | null {
  const q = query.toLowerCase().trim();

  // Patterns pour questions generales
  const generalPatterns = [
    /^(bonjour|salut|hello|coucou|bonsoir|hey)/i,
    /^(merci|au revoir|bye|a bientot)/i,
    /quelle?\s+(est\s+)?(la\s+)?date/i,
    /quel\s+jour/i,
    /qui\s+es[- ]tu/i,
    /que\s+(peux|sais)[- ]tu\s+faire/i,
  ];

  for (const pattern of generalPatterns) {
    if (pattern.test(q)) {
      console.log('[recherche-ccn] Pre-detection: general_question via pattern:', pattern);
      return { intent: 'general_question', idcc: null, ccn_name: null, confidence: 1.0 };
    }
  }

  // Detection d'IDCC explicite dans la question
  const idccMatch = q.match(/(?:idcc|ccn)\s*[:\s]?\s*(\d{3,4})/i) || q.match(/\b(\d{4})\b/);
  if (idccMatch) {
    const detectedIdcc = idccMatch[1].padStart(4, '0');
    console.log('[recherche-ccn] Pre-detection: IDCC trouve:', detectedIdcc);
    return { intent: 'ccn_search', idcc: detectedIdcc, ccn_name: null, confidence: 0.9 };
  }

  return null; // Pas de detection certaine, passer au LLM
}

/**
 * Classifie la requete utilisateur via Mistral
 */
async function classifyQuery(query: string, history: Message[]): Promise<QueryClassification> {
  console.log('[recherche-ccn] Classification de la requete...');

  // 1. Pre-detection par mots-cles
  const preDetected = preDetectIntent(query);
  if (preDetected) {
    return preDetected;
  }

  // 2. Utiliser le LLM pour classifier
  console.log('[recherche-ccn] Pre-detection non concluante, appel LLM...');

  const historyContext = history.length > 0
    ? `\nHistorique recent de la conversation:\n${history.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}`
    : '';

  const classificationPrompt = `CLASSIFIE cette requete concernant les conventions collectives en JSON.

Requete: "${query}"
${historyContext}

=== REGLES ===

1. Si la requete est une salutation ou question generale (date, qui es-tu) -> intent = "general_question"

2. Si la requete mentionne une CCN par son nom SANS question specifique -> intent = "idcc_identification"
   Exemples: "parlons de syntec", "CCN des avocats", "metallurgie"
   -> Extrais le nom dans ccn_name

3. Si la requete pose une question sur une CCN (avec ou sans IDCC mentionne) -> intent = "ccn_search"
   Exemples: "salaires dans la CCN 1486", "conges payes syntec", "preavis licenciement avocats"
   -> Extrais l'IDCC si mentionne, ou le nom de la CCN

REPONDS UNIQUEMENT ce JSON (pas de markdown):
{"intent":"...","idcc":null,"ccn_name":null,"confidence":0.X}`;

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: classificationPrompt }],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      console.error('[recherche-ccn] Erreur classification Mistral:', await response.text());
      return { intent: 'ccn_search', idcc: null, ccn_name: null, confidence: 0.5 };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    console.log('[recherche-ccn] Reponse classification brute:', content);

    const classification = JSON.parse(content) as QueryClassification;
    console.log('[recherche-ccn] Classification finale:', classification);
    return classification;

  } catch (error) {
    console.error('[recherche-ccn] Erreur classification:', error);
    return { intent: 'ccn_search', idcc: null, ccn_name: null, confidence: 0.5 };
  }
}

/**
 * Recherche l'IDCC depuis le nom de la CCN
 */
async function findIdccByName(
  supabase: ReturnType<typeof createClient>,
  ccnName: string
): Promise<{ idcc: string; label: string } | null> {
  console.log('[recherche-ccn] Recherche IDCC pour:', ccnName);

  const { data, error } = await supabase
    .from('idcc_ref')
    .select('idcc, label')
    .or(`label.ilike.%${ccnName}%,idcc.eq.${ccnName}`)
    .eq('active', true)
    .limit(1);

  if (error || !data || data.length === 0) {
    console.log('[recherche-ccn] IDCC non trouve pour:', ccnName);
    return null;
  }

  console.log('[recherche-ccn] IDCC trouve:', data[0]);
  return data[0];
}

/**
 * Genere une reponse pour les questions generales
 */
async function handleGeneralQuestion(
  query: string,
  responseConfig: { max_tokens: number; instruction: string }
): Promise<Response> {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Paris'
  });

  const systemPrompt = `Tu es un assistant expert en conventions collectives nationales (CCN) pour WALTERA, un courtier en assurance.

**Date du jour : ${currentDate}**

Tu peux repondre aux questions generales de maniere naturelle et professionnelle.

Si l'utilisateur te pose une question sur les CCN, invite-le a preciser le nom ou le numero IDCC de la convention collective concernee.

IMPORTANT: N'utilise JAMAIS d'emojis dans tes reponses. Reste professionnel et sobre.

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
    throw new Error(`Erreur Mistral: ${await mistralResponse.text()}`);
  }

  return streamMistralResponse(mistralResponse);
}

/**
 * Demande de clarification pour identifier l'IDCC
 */
async function handleIdccClarification(
  supabase: ReturnType<typeof createClient>,
  query: string,
  ccnName: string | null
): Promise<Response> {
  // Recuperer les CCN actives pour suggestion
  const { data: activeCcns } = await supabase
    .from('idcc_ref')
    .select('idcc, label')
    .eq('active', true)
    .order('label', { ascending: true })
    .limit(10);

  let clarificationMessage = '';

  if (ccnName) {
    // Recherche floue
    const { data: matchingCcns } = await supabase
      .from('idcc_ref')
      .select('idcc, label')
      .ilike('label', `%${ccnName}%`)
      .eq('active', true)
      .limit(5);

    if (matchingCcns && matchingCcns.length > 0) {
      clarificationMessage = `J'ai trouve plusieurs conventions collectives correspondant a "${ccnName}" :

${matchingCcns.map(c => `- **IDCC ${c.idcc}** : ${c.label}`).join('\n')}

Laquelle souhaitez-vous consulter ? Vous pouvez preciser le numero IDCC ou reformuler votre question.`;
    } else {
      clarificationMessage = `Je n'ai pas trouve de convention collective correspondant a "${ccnName}" dans notre base.

Voici les conventions collectives disponibles :

${(activeCcns || []).map(c => `- **IDCC ${c.idcc}** : ${c.label}`).join('\n')}

Veuillez preciser le numero IDCC ou le nom exact de la convention collective.`;
    }
  } else {
    clarificationMessage = `Pour vous aider, j'ai besoin de savoir quelle convention collective vous interesse.

Voici les conventions collectives disponibles dans notre base :

${(activeCcns || []).map(c => `- **IDCC ${c.idcc}** : ${c.label}`).join('\n')}

Vous pouvez me poser une question en precisant l'IDCC, par exemple :
- "Quels sont les conges payes dans l'IDCC 1486 ?"
- "Preavis de demission CCN Syntec"`;
  }

  return streamTextResponse(clarificationMessage);
}

/**
 * Stream une reponse texte simple
 */
function streamTextResponse(text: string): Response {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`)
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

/**
 * Stream la reponse Mistral
 */
function streamMistralResponse(mistralResponse: globalThis.Response): Response {
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
              } catch (_e) {
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
 * System prompt pour la recherche CCN
 */
function buildCCNSystemPrompt(
  context: string,
  idcc: string,
  ccnLabel: string,
  currentDate: string,
  responseConfig: { max_tokens: number; instruction: string }
): string {
  return `Tu es un assistant juridique expert en conventions collectives nationales (CCN) pour WALTERA.

**Date du jour : ${currentDate}**

Tu reponds actuellement pour la **CCN ${ccnLabel}** (IDCC ${idcc}).

## HIERARCHIE JURIDIQUE DES TEXTES (CRITIQUE)

Quand tu cites des informations, respecte TOUJOURS cette hierarchie de priorite :
1. **Arretes d'extension (P1)** - Force obligatoire maximale, rendent la CCN applicable a toutes les entreprises du secteur
2. **Avenants (P2)** - Modifient le texte de base, prevalent sur celui-ci
3. **Accords thematiques (P3)** - Completent sur des sujets precis (salaires, prevoyance, formation...)
4. **Annexes (P4)** - Classifications, grilles de salaires
5. **Texte de base (P5)** - Convention originale, s'applique en l'absence de texte de priorite superieure

## DOCUMENTS SOURCES

${context}

## REGLES DE REPONSE

1. **Priorite** : Cite TOUJOURS les textes de priorite superieure en premier
2. **Validite** : Ne cite QUE les textes en vigueur (pas les textes abroges)
3. **Precision** : Indique le type de texte et sa date si disponible
4. **Sources** : Cite le titre du document et le lien Legifrance si disponible
5. **Honnetete** : Si l'information n'est pas dans les documents, dis-le clairement

IMPORTANT: N'utilise JAMAIS d'emojis dans tes reponses. Reste professionnel et sobre.

${responseConfig.instruction}

Reponds UNIQUEMENT avec les documents fournis. Sois precis, juridiquement rigoureux et professionnel.`;
}

// Headers CORS communs
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // CORS preflight handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // 1. Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non authentifie' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Utilisateur non trouve' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 2. Parse request
    const body: SearchCCNRequest = await req.json();
    let { query, idcc, top_k = 15, history = [], response_length = 'medium' } = body;

    const responseConfig = RESPONSE_LENGTH_CONFIG[response_length];

    console.log('[recherche-ccn] Requete:', { query, idcc, top_k, response_length, historyLength: history.length });

    // 3. Classification de la requete
    const classification = await classifyQuery(query, history);
    console.log('[recherche-ccn] Classification:', classification);

    // 3.a Questions generales
    if (classification.intent === 'general_question') {
      console.log('[recherche-ccn] Intent: question generale');
      return await handleGeneralQuestion(query, responseConfig);
    }

    // 4. Creer le client Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 5. Identifier l'IDCC
    let resolvedIdcc = idcc || classification.idcc;
    let ccnLabel = '';

    // Si pas d'IDCC mais un nom de CCN, chercher l'IDCC
    if (!resolvedIdcc && classification.ccn_name) {
      const found = await findIdccByName(supabaseAdmin, classification.ccn_name);
      if (found) {
        resolvedIdcc = found.idcc;
        ccnLabel = found.label;
      }
    }

    // Si toujours pas d'IDCC, rechercher dans l'historique
    if (!resolvedIdcc && history.length > 0) {
      for (const msg of history.slice().reverse()) {
        const idccMatch = msg.content.match(/IDCC\s*(\d{3,4})/i);
        if (idccMatch) {
          resolvedIdcc = idccMatch[1].padStart(4, '0');
          console.log('[recherche-ccn] IDCC trouve dans historique:', resolvedIdcc);
          break;
        }
      }
    }

    // 6. Si identification seulement ou pas d'IDCC, demander clarification
    if (classification.intent === 'idcc_identification' || !resolvedIdcc) {
      console.log('[recherche-ccn] Demande de clarification IDCC');
      return await handleIdccClarification(supabaseAdmin, query, classification.ccn_name);
    }

    // 7. Recuperer le label de la CCN si pas encore fait
    if (!ccnLabel) {
      const { data: idccData } = await supabaseAdmin
        .from('idcc_ref')
        .select('label')
        .eq('idcc', resolvedIdcc)
        .single();
      ccnLabel = idccData?.label || `Convention IDCC ${resolvedIdcc}`;
    }

    console.log('[recherche-ccn] IDCC resolu:', resolvedIdcc, 'Label:', ccnLabel);

    // 8. Generer l'embedding de la query
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
      throw new Error(`Erreur Mistral Embed: ${await embeddingResponse.text()}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log('[recherche-ccn] Embedding genere, dimension:', queryEmbedding.length);

    // 9. Recherche vectorielle avec filtre IDCC
    const filter = { idcc: resolvedIdcc };

    console.log('[recherche-ccn] Recherche avec filtre:', filter);

    const { data: chunks, error: searchError } = await supabaseAdmin
      .rpc('match_ccn', {
        query_embedding: queryEmbedding,
        filter: filter,
        match_count: top_k,
        similarity_threshold: 0.5,
      });

    if (searchError) {
      console.error('[recherche-ccn] Erreur recherche vectorielle:', searchError);
      throw new Error(`Erreur recherche: ${searchError.message}`);
    }

    console.log('[recherche-ccn] Chunks trouves:', chunks?.length || 0);

    if (!chunks || chunks.length === 0) {
      return streamTextResponse(
        `Je n'ai trouve aucun document pour la CCN ${ccnLabel} (IDCC ${resolvedIdcc}) correspondant a votre recherche.\n\nVeuillez reformuler votre question ou verifier que cette CCN a bien ete importee dans notre base.`
      );
    }

    // 10. Regrouper et formater les chunks par document source
    const documentGroups = new Map<string, {
      titre: string;
      type_text: string;
      priority: number;
      etat_juridique: string;
      url_legifrance: string;
      date_debut: string;
      chunks: string[];
      max_similarity: number;
    }>();

    chunks.forEach((chunk: { content: string; metadata: Record<string, string>; similarity: number }) => {
      const metadata = chunk.metadata || {};
      const kaliId = metadata.kali_id || 'unknown';
      const typeText = metadata.type_text || 'UNKNOWN';
      const priority = TYPE_TEXT_PRIORITY[typeText] || 6;

      if (!documentGroups.has(kaliId)) {
        documentGroups.set(kaliId, {
          titre: metadata.titre || 'Document sans titre',
          type_text: typeText,
          priority: priority,
          etat_juridique: metadata.etat_juridique || 'N/A',
          url_legifrance: metadata.url_legifrance || '',
          date_debut: metadata.date_debut || metadata.date_signature || '',
          chunks: [],
          max_similarity: 0,
        });
      }

      const group = documentGroups.get(kaliId)!;
      group.chunks.push(chunk.content);
      group.max_similarity = Math.max(group.max_similarity, chunk.similarity || 0);
    });

    // Trier par priorite juridique puis par similarite
    const sortedDocuments = Array.from(documentGroups.entries())
      .sort((a, b) => {
        if (a[1].priority !== b[1].priority) {
          return a[1].priority - b[1].priority; // Priorite ASC
        }
        return b[1].max_similarity - a[1].max_similarity; // Similarite DESC
      });

    // Construire le contexte
    const context = sortedDocuments.map(([kaliId, doc], idx) => {
      const priorityLabel = PRIORITY_LABELS[doc.priority] || 'Autre';
      return `[Source ${idx + 1}: ${doc.titre}]
Type: ${doc.type_text} (${priorityLabel})
Etat: ${doc.etat_juridique}
Date: ${doc.date_debut || 'N/A'}
Pertinence: ${(doc.max_similarity * 100).toFixed(1)}%
${doc.url_legifrance ? `Lien: ${doc.url_legifrance}` : ''}

Contenu:
${doc.chunks.join('\n\n')}
`;
    }).join('\n---\n\n');

    console.log('[recherche-ccn] Documents sources:', sortedDocuments.length);

    // 11. Generer la reponse avec Mistral
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Paris'
    });

    const systemPrompt = buildCCNSystemPrompt(context, resolvedIdcc, ccnLabel, currentDate, responseConfig);

    const mistralMessages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: query }
    ];

    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: mistralMessages,
        temperature: 0.2,
        max_tokens: responseConfig.max_tokens,
        stream: true,
      }),
    });

    if (!mistralResponse.ok) {
      throw new Error(`Erreur Mistral Chat: ${await mistralResponse.text()}`);
    }

    console.log('[recherche-ccn] Debut du streaming Mistral...');

    return streamMistralResponse(mistralResponse);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[recherche-ccn] Erreur generale:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
