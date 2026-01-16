# Plan d'Action Après-Midi - Migration Edge Functions

**Date** : 15 janvier 2026
**Durée disponible** : ~3-4 heures
**Objectif** : Maximiser la valeur ajoutée pour WALTERA

---

## 🎯 Options Disponibles

Après analyse détaillée (voir [MIGRATION_ANALYSIS.md](./MIGRATION_ANALYSIS.md)), 4 options sont proposées :

| Option | Description | Durée | Impact | Priorité |
|--------|-------------|-------|--------|----------|
| **A** | Migration walteraApiGamma → Edge Function | 2-3h | 🟡 Moyen | **RECOMMANDÉE** |
| **B** | Optimisation Edge Functions existantes | 2-3h | 🟢 Élevé | Alternative |
| **C** | Documentation complète + formation | 2-3h | 🟡 Moyen | Alternative |
| **D** | Migration workflows CCN (06 et 07) → Edge Function | 6-8h | 🟢 Élevé | **Prochaine priorité** |

---

## 📋 OPTION A : Migration walteraApiGamma (RECOMMANDÉE)

### Pourquoi cette option ?

✅ **Avantages** :
- Amélioration UX significative (feedback temps réel)
- Complexité raisonnable (2-3h réalisable)
- Workflow API simple (polling Gamma)
- Démonstration concrète de la valeur des Edge Functions

❌ **Inconvénients** :
- Pas de gain de latence direct (latence = Gamma API)
- Usage occasionnel (génération présentations)

### Plan Détaillé (2h30)

#### Phase 1 : Analyse du Workflow Existant (15min)

- [ ] Lire la documentation workflow n8n : `docs/n8n/02-walteraApiGamma.md`
- [ ] Identifier les nodes critiques
- [ ] Noter les paramètres Gamma API (URL, auth, body)
- [ ] Comprendre la logique de polling (intervalle, timeout)

#### Phase 2 : Développement Edge Function (1h15)

**Fichier** : `supabase/functions/generation-gamma/index.ts`

**Structure** :

```typescript
// 1. Imports
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// 2. Interface types
interface GenerationRequest {
  prompt: string;
  numCards?: number;
}

interface GenerationResponse {
  generation_id: string;
}

interface StatusResponse {
  status: 'pending' | 'processing' | 'complete' | 'failed';
  url?: string;
  progress?: number;
}

// 3. Handler principal
Deno.serve(async (req: Request) => {
  // 3.1 CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 3.2 Parse body
  const { prompt, numCards = 8 } = await req.json();

  // 3.3 Validation
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Prompt requis' }), { status: 400 });
  }

  try {
    // 3.4 Créer génération Gamma
    const genResponse = await fetch('https://api.gamma.app/api/apps/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GAMMA_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: prompt,
        cards_num: numCards,
        mode: 'generate',
      }),
    });

    const { generation_id } = await genResponse.json();

    // 3.5 Polling avec SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let attempts = 0;
        const maxAttempts = 60; // 2 minutes max (2s * 60)

        while (attempts < maxAttempts) {
          const statusResponse = await fetch(
            `https://api.gamma.app/api/apps/${generation_id}`,
            {
              headers: {
                'Authorization': `Bearer ${Deno.env.get('GAMMA_API_KEY')}`,
              },
            }
          );

          const status: StatusResponse = await statusResponse.json();

          // Envoyer update SSE
          const message = `data: ${JSON.stringify({
            status: status.status,
            progress: status.progress || (attempts / maxAttempts) * 100,
          })}\n\n`;
          controller.enqueue(encoder.encode(message));

          // Si terminé
          if (status.status === 'complete') {
            const finalMessage = `data: ${JSON.stringify({
              status: 'complete',
              url: status.url,
            })}\n\ndata: [DONE]\n\n`;
            controller.enqueue(encoder.encode(finalMessage));
            controller.close();
            return;
          }

          // Si échec
          if (status.status === 'failed') {
            const errorMessage = `data: ${JSON.stringify({
              status: 'failed',
              error: 'Génération échouée',
            })}\n\n`;
            controller.enqueue(encoder.encode(errorMessage));
            controller.close();
            return;
          }

          // Attendre 2 secondes
          await new Promise((resolve) => setTimeout(resolve, 2000));
          attempts++;
        }

        // Timeout
        const timeoutMessage = `data: ${JSON.stringify({
          status: 'timeout',
          error: 'Timeout après 2 minutes',
        })}\n\n`;
        controller.enqueue(encoder.encode(timeoutMessage));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Erreur génération Gamma:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};
```

**Checklist développement** :
- [ ] Créer fichier `supabase/functions/generation-gamma/index.ts`
- [ ] Implémenter interfaces TypeScript
- [ ] Implémenter handler principal avec CORS
- [ ] Implémenter appel POST `/api/apps/generate`
- [ ] Implémenter polling avec GET `/api/apps/{id}`
- [ ] Implémenter streaming SSE
- [ ] Gérer timeout (2 minutes max)
- [ ] Gérer erreurs (try/catch)
- [ ] Ajouter logs console.log()

#### Phase 3 : Configuration et Tests Locaux (30min)

**Configuration** :

```bash
# 1. Créer .env.local
echo "GAMMA_API_KEY=votre_clé_gamma" > .env.local

# 2. Démarrer Supabase local
supabase start

# 3. Servir la fonction
supabase functions serve generation-gamma --env-file .env.local
```

**Tests** :

```bash
# Test 1 : Génération simple
curl -X POST http://localhost:54321/functions/v1/generation-gamma \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Présentation sur la prévoyance collective",
    "numCards": 5
  }'

# Vérifier stream SSE
# Attendre réponse complète (30-60s)
```

**Checklist tests** :
- [ ] Démarrer Supabase local
- [ ] Servir fonction avec .env.local
- [ ] Test prompt simple → vérifier SSE stream
- [ ] Test prompt complexe → vérifier status updates
- [ ] Test erreur (clé API invalide) → vérifier error handling
- [ ] Vérifier logs dans terminal

#### Phase 4 : Documentation (20min)

**Fichier** : `docs/supabase/edge-functions/generation-gamma.md`

**Structure** :
- Description
- Objectif
- Input/Output (interfaces TypeScript)
- Flux SSE (exemple)
- Tests
- Configuration

**Checklist documentation** :
- [ ] Créer fichier documentation
- [ ] Ajouter exemples curl
- [ ] Ajouter exemples SSE parsing côté client
- [ ] Ajouter section troubleshooting
- [ ] Mettre à jour README Edge Functions

#### Phase 5 : Déploiement Production (20min)

```bash
# 1. Configurer secret Gamma
supabase secrets set GAMMA_API_KEY=votre_clé_gamma

# 2. Déployer fonction
supabase functions deploy generation-gamma

# 3. Tester en production
curl -X POST https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/generation-gamma \
  -H "Authorization: Bearer ${USER_JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test déploiement production",
    "numCards": 3
  }'

# 4. Vérifier logs
supabase functions logs generation-gamma --tail
```

**Checklist déploiement** :
- [ ] Configurer secret GAMMA_API_KEY
- [ ] Déployer fonction
- [ ] Test production avec token utilisateur
- [ ] Vérifier logs Supabase Dashboard
- [ ] Vérifier métriques (latence, erreurs)
- [ ] Mettre à jour n8n README (workflow obsolète)

---

## 📋 OPTION B : Optimisation Edge Functions Existantes

### Pourquoi cette option ?

✅ **Avantages** :
- Amélioration directe de l'existant
- Impact élevé sur UX actuelle
- Pas de nouveau code (optimisation)

❌ **Inconvénients** :
- Pas de nouvelle fonctionnalité
- Moins "visible" pour démo client

### Plan Détaillé (2h30)

#### Phase 1 : Tests Complets recherche-contrats (1h)

**Objectif** : S'assurer que l'Edge Function fonctionne parfaitement

**Checklist** :
- [ ] **Test 1 : Question générale**
  ```bash
  curl -X POST .../recherche-contrats \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{"query": "Bonjour"}'
  # Attendu : Réponse conversationnelle sans recherche
  ```

- [ ] **Test 2 : Question avec client explicite**
  ```bash
  curl -X POST .../recherche-contrats \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{"query": "Garanties hospitalisation AMAHE"}'
  # Attendu : Recherche documents AMAHE + réponse
  ```

- [ ] **Test 3 : Question avec historique**
  ```bash
  curl -X POST .../recherche-contrats \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{
      "query": "Et les franchises ?",
      "history": [
        {"role": "user", "content": "Garanties AMAHE"},
        {"role": "assistant", "content": "Pour AMAHE..."}
      ]
    }'
  # Attendu : Détection client depuis historique
  ```

- [ ] **Test 4 : Client non trouvé**
  ```bash
  curl -X POST .../recherche-contrats \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{"query": "Client inexistant XYZ"}'
  # Attendu : Message clarification + liste clients
  ```

- [ ] **Test 5 : Aucun document trouvé**
  ```bash
  curl -X POST .../recherche-contrats \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{"query": "Recherche impossible sur AMAHE"}'
  # Attendu : Message informatif
  ```

- [ ] **Test 6 : Stress test (10 requêtes parallèles)**
  ```bash
  for i in {1..10}; do
    curl -X POST .../recherche-contrats \
      -H "Authorization: Bearer ${TOKEN}" \
      -d '{"query": "Test '$i'"}' &
  done
  wait
  # Vérifier : Toutes réponses OK, pas d'erreur
  ```

#### Phase 2 : Monitoring et Analytics (1h)

**Objectif** : Ajouter tracking pour métriques de succès

**Implémentations** :

1. **Tracking Posthog/Mixpanel** (30min)
   ```typescript
   // Ajouter dans recherche-contrats/index.ts

   import posthog from 'posthog-js';

   // Après authentification
   posthog.capture('recherche_contrats_start', {
     user_id: user.id,
     query_length: query.length,
     has_history: history.length > 0,
   });

   // Après classification
   posthog.capture('recherche_contrats_classification', {
     user_id: user.id,
     requires_documents: requiresDocuments,
     client_mentioned: clientMentioned,
   });

   // Après recherche vectorielle
   posthog.capture('recherche_contrats_search', {
     user_id: user.id,
     client_id: clientId,
     results_count: results.length,
     search_latency_ms: searchLatency,
   });

   // Après génération réponse
   posthog.capture('recherche_contrats_complete', {
     user_id: user.id,
     total_latency_ms: totalLatency,
     tokens_used: tokensUsed,
   });
   ```

2. **Dashboard Supabase** (30min)
   - Créer vue SQL pour métriques :
   ```sql
   CREATE VIEW v_edge_function_metrics AS
   SELECT
     DATE_TRUNC('hour', created_at) as hour,
     COUNT(*) as requests,
     AVG(latency_ms) as avg_latency,
     PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency,
     SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
   FROM edge_function_logs
   WHERE function_name = 'recherche-contrats'
   GROUP BY hour
   ORDER BY hour DESC;
   ```
   - Dashboard Grafana/Metabase (si disponible)

**Checklist monitoring** :
- [ ] Installer Posthog/Mixpanel SDK
- [ ] Ajouter tracking events (4 étapes)
- [ ] Créer vue SQL métriques
- [ ] Créer dashboard (Supabase/Grafana)
- [ ] Tester tracking avec requêtes test
- [ ] Documenter métriques disponibles

#### Phase 3 : Optimisations Performance (30min)

**1. Cache Embeddings Fréquents** (si Redis disponible)
```typescript
// Cache embeddings questions fréquentes
const cacheKey = `embedding:${hash(query)}`;
let embedding = await redis.get(cacheKey);

if (!embedding) {
  embedding = await generateEmbedding(query);
  await redis.set(cacheKey, embedding, { ex: 3600 }); // 1h cache
}
```

**2. Optimisation Prompts Mistral**
- Réduire tokens system prompt (actuellement ~500 tokens)
- Utiliser `max_tokens` plus précis
- Tester température 0.1 → 0.0 (plus déterministe)

**3. Parallel Requests**
```typescript
// Au lieu de séquentiel
const client = await findClient(term);
const embedding = await generateEmbedding(query);

// Parallèle
const [client, embedding] = await Promise.all([
  findClient(term),
  generateEmbedding(query),
]);
```

**Checklist optimisations** :
- [ ] Implémenter cache embeddings (si Redis)
- [ ] Réduire system prompt (testerlongueur)
- [ ] Paralléliser requêtes indépendantes
- [ ] Tester latence avant/après
- [ ] Documenter gains

---

## 📋 OPTION C : Documentation et Formation

### Pourquoi cette option ?

✅ **Avantages** :
- Transmission de connaissances
- Autonomie équipe WALTERA
- Documentation durable

❌ **Inconvénients** :
- Pas de nouveau code
- Impact indirect

### Plan Détaillé (2h30)

#### Phase 1 : Documentation Utilisateur (1h)

**Fichier** : `docs/GUIDE_UTILISATEUR.md`

**Contenu** :
- Introduction agent conversationnel
- Exemples de questions efficaces
- Exemples de conversations
- FAQ (questions fréquentes)
- Troubleshooting utilisateur

**Structure** :
```markdown
# Guide Utilisateur - Agent Conversationnel WALTERA

## 🎯 Qu'est-ce que l'agent conversationnel ?

L'agent conversationnel WALTERA vous permet d'interroger...

## 💬 Comment poser une question ?

### Questions Efficaces

✅ **Bons exemples** :
- "Quelles sont les garanties hospitalisation pour AMAHE ?"
- "Montant des franchises dans le contrat ALTESSE"
- "Conditions de résiliation CLIENT_X"

❌ **Exemples à éviter** :
- "Info" (trop vague)
- "Contrat" (quel client ? quelle info ?)
- "?" (pas de question)

### Questions avec Contexte

Vous pouvez poser des questions de suivi...

## 📚 FAQ

**Q: L'agent ne trouve pas mon client**
R: Assurez-vous d'utiliser le nom exact...

...
```

**Checklist** :
- [ ] Créer guide utilisateur complet
- [ ] Ajouter 10+ exemples de questions
- [ ] Ajouter FAQ (10+ questions)
- [ ] Ajouter screenshots (si interface web)
- [ ] Relecture et corrections

#### Phase 2 : Documentation Technique Avancée (1h)

**Fichier** : `docs/ARCHITECTURE_TECHNIQUE.md`

**Contenu** :
- Architecture complète (diagrammes)
- Flows détaillés (authentification, recherche, génération)
- Tables Supabase (schémas SQL)
- RPC Functions (code complet)
- Edge Functions (code annotés)
- Troubleshooting avancé

**Checklist** :
- [ ] Créer diagrammes architecture (draw.io/Excalidraw)
- [ ] Documenter tous les flows
- [ ] Exporter schémas SQL
- [ ] Annoter code Edge Functions
- [ ] Ajouter troubleshooting avancé
- [ ] Relecture et corrections

#### Phase 3 : Vidéos Démo (30min)

**Vidéo 1** : Démonstration agent conversationnel (10min)
- [ ] Enregistrer écran
- [ ] Démontrer questions variées
- [ ] Montrer streaming temps réel
- [ ] Expliquer réponses

**Vidéo 2** : Migration n8n → Edge Functions (15min)
- [ ] Comparer latence n8n vs Edge Functions
- [ ] Montrer logs Supabase
- [ ] Expliquer avantages
- [ ] Montrer code Edge Function

**Vidéo 3** : Best Practices (5min)
- [ ] Conseils questions efficaces
- [ ] Conseils maintenance
- [ ] Conseils monitoring

---

## 📋 OPTION D : Migration Workflows CCN (06 et 07) → Edge Function

### Pourquoi cette option ?

✅ **Avantages** :
- Même gains que recherche-contrats (latence -60%, streaming SSE)
- Unifie toute l'architecture RAG vers Edge Functions
- Haute fréquence d'utilisation (agents conversationnels actifs)
- Pattern de migration déjà éprouvé avec recherche-contrats

❌ **Inconvénients** :
- Durée longue (6-8h minimum)
- Complexité haute (agent + outils + mémoire)
- Pas réalisable en une seule après-midi

### Plan Détaillé (6-8h)

**Note** : Cette option nécessite **AU MOINS une journée complète** et ne peut pas être réalisée cet après-midi. Elle est documentée pour planification future.

#### Phase 1 : Analyse des Workflows Existants (1h)

- [ ] Lire documentation complète workflows 06 et 07
- [ ] Identifier similitudes et différences
- [ ] Extraire les 3 outils communs (trouver_idcc, recherche_ccn, detailDocument)
- [ ] Comprendre système de mémoire conversationnelle
- [ ] Analyser prompts system (Mistral vs OpenAI)

#### Phase 2 : Architecture Edge Function Unifiée (30min)

**Décision** : 1 Edge Function avec paramètre `model` ou 2 Edge Functions séparées ?

**Recommandation** : 1 Edge Function unifiée `recherche-ccn`

**Structure** :
```typescript
interface SearchCCNRequest {
  query: string;
  sessionId?: string;
  model?: "mistral" | "openai"; // Défaut : mistral
  history?: Message[];
}
```

**Avantages** :
- Code mutualisé pour les 3 outils
- Maintenance simplifiée
- Possibilité de basculer entre modèles

#### Phase 3 : Développement Core (3-4h)

**Fichier** : `supabase/functions/recherche-ccn/index.ts`

**Implémentation des 3 outils** :

1. **Tool: trouver_idcc** (30min)
```typescript
async function trouverIdcc(
  supabase: SupabaseClient,
  libelle: string
): Promise<{ idcc: string; label: string }[]> {
  const { data, error } = await supabase
    .from('idcc_ref')
    .select('*')
    .ilike('label', `%${libelle}%`);

  return data || [];
}
```

2. **Tool: recherche_ccn** (1h)
```typescript
async function rechercheCCN(
  query: string,
  idcc: string,
  topK: number = 15
): Promise<SearchResult[]> {
  // 1. Générer embedding
  const embedding = await generateEmbedding(query);

  // 2. Recherche vectorielle
  const { data } = await supabase.rpc('match_ccn', {
    query_embedding: embedding,
    filter: { idcc },
    match_count: topK
  });

  return data;
}
```

3. **Tool: detailDocument** (30min)
```typescript
async function detailDocument(
  supabase: SupabaseClient,
  kaliId: string
): Promise<DocumentDetail | null> {
  const { data } = await supabase
    .from('ccn')
    .select('*')
    .eq('metadata->>kali_id', kaliId)
    .single();

  return data;
}
```

**Implémentation Agent LangChain** (1-1.5h)
- System prompt adapté
- Appel LLM (Mistral ou OpenAI selon paramètre)
- Tool calling
- Génération réponse avec streaming SSE

**Système de Mémoire Conversationnelle** (30min)
- Table `chat_memory_ccn`
- Context window : 3 messages
- Index par `sessionId`

#### Phase 4 : Tests Complets (1.5h)

- [ ] Test 1 : Question simple IDCC 1000
- [ ] Test 2 : Question avec client non trouvé
- [ ] Test 3 : Conversation avec historique
- [ ] Test 4 : Comparaison Mistral vs OpenAI
- [ ] Test 5 : Stress test (10 requêtes parallèles)
- [ ] Test 6 : Vérification mémoire conversationnelle

#### Phase 5 : Documentation (1h)

**Fichier** : `docs/supabase/edge-functions/recherche-ccn.md`

**Contenu** :
- Description complète
- Input/Output formats
- Exemples d'utilisation (Mistral et OpenAI)
- Comparaison avec workflows n8n
- Migration guide

#### Phase 6 : Déploiement et Migration (1h)

```bash
# 1. Configurer secrets
supabase secrets set MISTRAL_API_KEY=...
supabase secrets set OPENAI_API_KEY=...

# 2. Déployer fonction
supabase functions deploy recherche-ccn

# 3. Tests production
curl -X POST .../recherche-ccn \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"query": "Salaire minimum IDCC 1000", "model": "mistral"}'

# 4. Marquer workflows n8n obsolètes
```

**Checklist déploiement** :
- [ ] Configurer secrets API (Mistral + OpenAI)
- [ ] Déployer fonction
- [ ] Tests production (2 modèles)
- [ ] Vérifier logs et métriques
- [ ] Mettre à jour documentation n8n
- [ ] Communiquer au client WALTERA

---

### Estimation Réaliste

**Durée minimale** : 6-8 heures (1 journée complète)

**Risques** :
- Complexité agent LangChain en pur TypeScript
- Abstraction multi-providers (Mistral + OpenAI)
- Tests exhaustifs (2 modèles)
- Gestion mémoire conversationnelle

**Recommandation** : **Planifier sur 2 jours** pour avoir de la marge

---

## 🎯 Recommandation Finale

### Ordre de Priorité

**Pour cet après-midi (3-4h disponibles)** :

1. **OPTION A** : Migration walteraApiGamma
   - **Raison** : Amélioration UX concrète + démonstration valeur Edge Functions
   - **Impact** : Moyen-Élevé
   - **Faisabilité** : 100% en 2h30

2. **OPTION B** : Optimisation Edge Functions existantes
   - **Raison** : Amélioration directe UX actuelle + métriques
   - **Impact** : Élevé
   - **Faisabilité** : 100% en 2h30

3. **OPTION C** : Documentation et Formation
   - **Raison** : Transmission connaissances + autonomie équipe
   - **Impact** : Moyen (indirect)
   - **Faisabilité** : 100% en 2h30

**Pour les prochains jours (6-8h nécessaires)** :

4. **OPTION D** : Migration workflows CCN (06 et 07)
   - **Raison** : Unifie toute l'architecture RAG + gains performance significatifs
   - **Impact** : Très Élevé
   - **Faisabilité** : 0% en une après-midi (nécessite 1-2 jours)

### Mon Conseil pour CET APRÈS-MIDI : **OPTION A**

**Justification** :
- Démontre concrètement la valeur des Edge Functions
- Amélioration UX visible (feedback temps réel)
- Complexité réalisable en 2h30
- Peut être présenté au client WALTERA comme nouveau livrable
- Suit la dynamique de migration déjà initiée

**Si temps restant après OPTION A** : Faire OPTION B (Phase 1 : Tests)

---

## ✅ Checklist Pré-Migration

Avant de commencer, vérifier :

- [ ] Accès Supabase CLI : `supabase --version`
- [ ] Projet lié : `supabase link --project-ref syxsacbciqwrahjdixuc`
- [ ] Clé API Gamma disponible
- [ ] Token utilisateur test disponible
- [ ] Documentation workflows n8n lue
- [ ] Temps disponible confirmé (2-3h)

---

## 📞 Support

En cas de blocage :
- Documentation Supabase : https://supabase.com/docs/guides/functions
- Documentation Deno : https://deno.com/deploy/docs
- Documentation Gamma API : https://gamma.app/docs/api

---

**Document créé par** : Claude Code + GARED
**Date** : 15 janvier 2026
**Validité** : 15 janvier 2026 (après-midi)
