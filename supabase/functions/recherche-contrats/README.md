# Edge Function: recherche-contrats

## Vue d'ensemble

Cette Edge Function Supabase est le coeur du système RAG (Retrieval Augmented Generation) pour la recherche documentaire de WALTERA. Elle permet aux utilisateurs de poser des questions sur les contrats d'assurance de leurs clients.

**Version actuelle**: v31 (15 janvier 2026)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│                   useChatWithEdgeFunction.ts                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ POST /functions/v1/recherche-contrats
┌─────────────────────────────────────────────────────────────────┐
│                    Edge Function (Deno)                          │
│                                                                  │
│  1. Authentification (JWT Supabase)                              │
│  2. CLASSIFICATION LLM (v21 - Mistral Small)                     │
│     └── Retourne: { intent, client_name, document_type }         │
│  3. Routage selon intent:                                        │
│     ├── general_question → handleGeneralQuestion()               │
│     ├── client_list → handleClientListQuestion()                 │
│     └── document_search → RAG Pipeline                           │
│  4. Identification client via classification + SQL               │
│  5. Génération embedding (Mistral Embed)                         │
│  6. Recherche vectorielle (pgvector)                             │
│  7. Génération réponse (Mistral Large)                           │
│  8. Streaming SSE vers le client                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐       ┌──────────┐       ┌──────────┐
    │ Supabase │       │ Mistral  │       │ Mistral  │
    │    DB    │       │  Small   │       │  Large   │
    └──────────┘       │ (Classif)│       │ (RAG)    │
                       └──────────┘       └──────────┘
```

## Paramètres d'entrée

```typescript
interface SearchRequest {
  query: string;              // Question de l'utilisateur
  client_id?: string;         // UUID du client (optionnel)
  client_code?: string;       // Code client ex: "G0003" (optionnel)
  top_k?: number;             // Nombre de chunks (défaut: 15)
  history?: Message[];        // Historique de conversation
  response_length?: 'short' | 'medium' | 'long';  // Longueur réponse
}
```

## Fonctionnalités

### 1. Classification LLM intelligente (v21)

**NOUVEAU en v21** : Toute la détection d'intention est désormais gérée par un LLM (Mistral Small) au lieu de regex.

**Fonction**: `classifyQuery(query, history)`

**Retourne**:
```typescript
interface QueryClassification {
  intent: 'general_question' | 'client_list' | 'document_search';
  client_name: string | null;   // Nom/code du client détecté
  document_type: string | null; // Type de document détecté
  confidence: number;           // Score de confiance 0-1
}
```

**Avantages par rapport aux regex**:
- Comprend toutes les formulations (pas besoin de maintenir des patterns)
- Détecte le client même en langage naturel ("parlons de la fondation")
- Identifie le type de document dans la question
- Utilise l'historique de conversation pour le contexte

**Modèle utilisé**: `mistral-medium-latest` (équilibré qualité/vitesse)

### 2. Questions générales

Détecte et répond aux questions qui ne nécessitent pas de recherche documentaire:
- **Salutations d'ouverture**: "bonjour", "salut", "hello", "coucou"
- **Salutations de fermeture**: "merci", "au revoir", "bye", "bonne journée"
- **Phrases de clôture** (v31): "ce sera tout", "c'est tout", "rien d'autre", "non merci", "c'est bon", "je n'ai plus de questions", "c'est parfait"
- **Date/heure**: "quelle est la date du jour", "quel jour sommes-nous"
- **Questions sur l'assistant**: "qui es-tu", "que peux-tu faire"
- **Confirmations simples**: "ok", "d'accord", "compris", "parfait", "super"

**Fonction**: `handleGeneralQuestion()`

### 3. Liste des clients

Permet de lister les clients et prospects WALTERA depuis la table `clients` de Supabase.

**Fonction**: `handleClientListQuestion()`

**Questions supportées** (détection LLM, pas de patterns fixes):
- "quelle est la liste des clients"
- "quels sont les clients de Waltera"
- "qui sont les clients actuels"
- "combien de clients avons-nous"
- "liste des prospects"
- Toute formulation similaire...

**Table Supabase interrogée**: `clients`

**Données retournées par client**:
| Champ | Description | Exemple |
|-------|-------------|---------|
| `code` | Code client interne | G0003 |
| `name` | Nom de l'entreprise | Fondation des Amis de l'Atelier |
| `status` | Statut (client/prospect/inactive) | client |
| `idcc` | Numéros IDCC des conventions collectives | [1518, 2264] |
| `external_key` | Référence externe/numéro client | 12345 |
| `siren` | Numéro SIREN | 123456789 |

**IDCC (Identifiant Convention Collective)**: Les numéros IDCC correspondent aux conventions collectives nationales dont dépend le client. Exemple: IDCC 1518 = Animation, IDCC 2264 = Hospitalisation privée.

**Format de sortie** (groupé par statut, trié par code client v22):
```
### Clients actifs (X)
- **G0001** - Premier Client | IDCC: 1518
- **G0002** - Deuxième Client | IDCC: 2264, 3127
- **G0010** - Dixième Client | IDCC: 1501

### Prospects (Y)
- **P0001** - Entreprise Prospect | IDCC: 3127

### Clients inactifs (Z)
- **G0099** - Ancien Client
```

**Tri**: Les clients sont triés par numéro de code (G0001 < G0002 < G0010) grâce à `localeCompare` avec l'option `numeric: true`.

### 4. Identification automatique du client (v21)

Le système identifie le client via la classification LLM :

1. **Paramètres explicites**: `client_id` ou `client_code` fournis dans la requête
2. **Classification LLM**: Extrait `client_name` de la question + historique
3. **Recherche SQL**: Utilise `search_client()` pour trouver le client

**Exemple de classification**:
```
Requête: "Parlons de la fondation des amis de l'atelier"
Classification: { client_name: "fondation des amis de l'atelier", ... }
→ SQL search_client() → Client trouvé !
```

**Fonction SQL utilisée**: `search_client(search_term)`

```sql
-- Recherche par code exact, code partiel, ou nom (trigram)
SELECT client_id, client_code, client_name, match_score
FROM search_client('ALTESSE');
```

**Variations de codes**: La fonction `generateCodeVariations()` génère des variantes (G013 → G0013) pour la recherche floue.

### 4b. Rétention du contexte de conversation (v30)

**NOUVEAU en v30** : Le système maintient le contexte du client discuté lors de questions de suivi.

**Problème résolu** : Quand l'utilisateur posait une question sans mentionner le client, le système perdait le contexte :
```
User: "Parlons de la fondation des amis de l'atelier"
Assistant: "Pour le client **FONDATION DES AMIS DE L'ATELIER** (G0003)..."
User: "et y a t il des garanties de prévoyance aussi ?"
❌ Avant: "Je n'ai pas pu identifier de quel client vous parlez"
✅ Après (v30): Le système retrouve G0003 depuis l'historique
```

**Fonction**: `extractClientFromHistory(history: Message[])`

**Logique**:
1. Parcourt l'historique du message le plus récent au plus ancien
2. Cherche le **dernier** client mentionné (pas tous)
3. Priorité de recherche :
   - Code client dans format `client **NOM** (CODE)` des réponses assistant
   - Code client seul (G0001, G0003, etc.)
   - Nom de client dans les questions utilisateur
4. Retourne dès qu'un client est trouvé (arrêt immédiat)

### 5. Filtrage par type de document (v21)

**NOUVEAU en v21** : Le type de document est détecté par le LLM dans la classification initiale.

**Types valides**:
- `commercial` : propositions, devis, offres
- `contrat` : contrats, conditions générales, polices
- `avenant` : avenants, modifications
- `convention` : conventions collectives, CCN
- `sinistre` : déclarations de sinistres
- `facture` : factures, facturation
- `courrier` : courriers, correspondance

**Fallback**: Si aucun résultat avec le filtre, recherche sans filtre document_type.

### 6. Configuration longueur de réponse (v16+)

```javascript
const RESPONSE_LENGTH_CONFIG = {
  short:  { max_tokens: 500,  instruction: 'Réponse concise 2-3 phrases' },
  medium: { max_tokens: 1024, instruction: 'Réponse équilibrée' },
  long:   { max_tokens: 2048, instruction: 'Réponse détaillée' }
};
```

### 6. Recherche vectorielle

Utilise la fonction RPC `match_documents` avec pgvector:

```javascript
const rpcParams = {
  query_embedding: queryEmbedding,  // Vecteur 1024 dimensions (Mistral)
  match_count: top_k,               // Défaut: 15
  filter: {
    client_id: "...",
    client_code: "...",
    document_type: "..."            // Optionnel
  },
  match_threshold: 0.7              // Seuil similarité 70%
};
```

## Variables d'environnement requises

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
MISTRAL_API_KEY=xxx
```

## Problèmes corrigés (v19)

### CORRIGÉ: Détection client en minuscules
**Problème**: Quand l'utilisateur écrit "parlons de la fondation des amis de l'atelier" (minuscules), le système ne détectait pas le changement de client.

**Solution (v19)**: Ajout de `extractClientNameFromNaturalLanguage()` qui détecte les patterns comme "parlons de X", "concernant X", "pour X".

### CORRIGÉ: Recherche floue sur codes
**Problème**: "G013" ne trouvait pas "G0013".

**Solution (v19)**: Ajout de `generateCodeVariations()` qui génère des variantes de codes (G013 → G0013, G00013).

### CORRIGÉ: Emojis non souhaités
**Problème**: Mistral ajoutait des emojis dans les réponses.

**Solution (v19)**: Ajout de "N'utilise JAMAIS d'emojis dans tes réponses. Reste professionnel et sobre." dans tous les prompts système.

## Optimisations futures

### AMÉLIORATION: Performance
- Mettre en cache les embeddings de questions fréquentes
- Optimiser la recherche client avec un index full-text

### AMÉLIORATION: Qualité RAG
- Implémenter le reranking des chunks
- Ajouter le contexte du document complet (pas juste les chunks)
- Hybride search (keyword + semantic)

## Historique des versions

| Version | Date | Changements |
|---------|------|-------------|
| v31 | 15/01/2026 | **Phrases de clôture** - "ce sera tout", "c'est bon", "non merci" reconnus comme questions générales |
| v30 | 15/01/2026 | **Rétention du contexte conversation** - Le système retrouve le dernier client discuté dans l'historique |
| v29 | 15/01/2026 | **Extraction candidats client** - `extractClientCandidates()` extrait les noms de la requête |
| v28 | 15/01/2026 | Classification 100% regex (sans LLM) pour fiabilité et rapidité |
| v22 | 15/01/2026 | Liste clients triée par numéro (G0001 < G0002) + IDCC affiché |
| v21 | 15/01/2026 | Classification LLM (Mistral Medium) remplace tous les regex |
| v20 | 15/01/2026 | Fix pattern "qui sont les clients" |
| v19 | 15/01/2026 | Fix emojis, détection client langage naturel, recherche floue codes |
| v18 | 15/01/2026 | Liste des clients depuis la DB |
| v17 | 15/01/2026 | Questions générales (date, salutations) |
| v16 | 15/01/2026 | Filtrage document_type, response_length, top_k=15 |
| v15 | - | Recherche client depuis historique |
| v14 | - | Streaming SSE, identification client SQL |

## Tests manuels

```bash
# Test question générale
curl -X POST https://xxx.supabase.co/functions/v1/recherche-contrats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "quelle est la date du jour"}'

# Test liste clients
curl -X POST https://xxx.supabase.co/functions/v1/recherche-contrats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "quelle est la liste des clients"}'

# Test recherche documentaire
curl -X POST https://xxx.supabase.co/functions/v1/recherche-contrats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "quelles sont les garanties pour ALTESSE", "response_length": "medium"}'
```

## Fichiers liés

- `/src/hooks/useChatWithEdgeFunction.ts` - Hook React pour appeler cette fonction
- `/src/components/ChatBase.tsx` - Composant chat avec sélecteur de longueur
- `/src/pages/assistant/ChatRAG.tsx` - Page utilisant ce chat
