# recherche-contrats (Edge Function)

**Fichier** : `supabase/functions/recherche-contrats/index.ts`
**Statut** : ✅ Production
**Runtime** : Deno Edge Runtime
**Dernière mise à jour** : 15 janvier 2026

---

## 📋 Description

Edge Function Supabase intelligente pour la recherche conversationnelle dans les documents clients avec RAG (Retrieval-Augmented Generation). Remplace les workflows n8n d'agents conversationnels par une solution plus rapide, scalable et maintenable.

---

## 🎯 Objectifs

1. **Recherche sémantique** : Trouve les documents pertinents via recherche vectorielle
2. **Identification automatique de client** : Détecte le client depuis la question ou l'historique
3. **Questions générales** : Gère les questions sans besoin de documents
4. **Streaming SSE** : Répond en temps réel avec Server-Sent Events
5. **Mémoire conversationnelle** : Maintient le contexte avec l'historique

---

## 🏗️ Architecture

### Flux de Traitement

```
1. Authentification (Supabase Auth)
    ↓
2. Classification de la question
    ├─ Question générale → Réponse directe Mistral
    └─ Question sur contrats → Continue
        ↓
3. Identification du client
    ├─ Depuis la question actuelle
    ├─ Depuis l'historique
    └─ Si échec → Demande clarification
        ↓
4. Génération embedding (Mistral Embed)
    ↓
5. Recherche vectorielle (match_documents)
    ├─ Filtre par client_id + client_code
    └─ Top K = 5 chunks
        ↓
6. Regroupement par document source
    ↓
7. Génération réponse (Mistral Large) + Streaming SSE
    ↓
8. Réponse au client
```

---

## 📥 Input

### Format de Requête

**Endpoint** : `POST /functions/v1/recherche-contrats`

**Headers** :
```http
Authorization: Bearer {USER_JWT_TOKEN}
Content-Type: application/json
```

**Body** :
```typescript
interface SearchRequest {
  query: string;              // Question de l'utilisateur
  client_id?: string;          // (Optionnel) UUID du client
  client_code?: string;        // (Optionnel) Code GXXXX
  top_k?: number;             // (Optionnel) Nombre de chunks (défaut: 5)
  history?: Message[];        // (Optionnel) Historique conversation
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}
```

### Exemples

#### Exemple 1 : Question avec Client Explicite
```json
{
  "query": "Quelles sont les garanties hospitalisation pour AMAHE ?"
}
```

#### Exemple 2 : Question avec Historique
```json
{
  "query": "Et les franchises ?",
  "history": [
    {
      "role": "user",
      "content": "Garanties AMAHE ?"
    },
    {
      "role": "assistant",
      "content": "Pour AMAHE, les garanties incluent..."
    }
  ]
}
```

#### Exemple 3 : Question Générale
```json
{
  "query": "Bonjour, que peux-tu faire ?"
}
```

---

## 📤 Output

### Format SSE (Server-Sent Events)

**Content-Type** : `text/event-stream`

**Format** :
```
data: {"text":"Bonjour"}

data: {"text":" je"}

data: {"text":" peux"}

data: [DONE]
```

### Parsing Côté Client

```typescript
const response = await fetch('/functions/v1/recherche-contrats', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: "..." })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data.text); // Afficher le texte
    }
  }
}
```

---

## 🧠 Logique Métier

### 1. Classification des Questions

**Patterns de Questions Générales** :
- Salutations : `bonjour`, `salut`, `hello`
- Méta : `qui es-tu`, `que peux-tu faire`, `aide`
- Politesse : `merci`, `au revoir`

→ **Action** : Réponse directe sans recherche documentaire

**Patterns de Questions Contrats** :
- Mots-clés : `contrat`, `garantie`, `couverture`, `assurance`
- Financier : `cotisation`, `prime`, `tarif`, `prix`
- Sinistres : `sinistre`, `indemnisation`, `remboursement`
- Clauses : `franchise`, `plafond`, `exclusion`

→ **Action** : Recherche vectorielle dans les documents

---

### 2. Identification du Client

**Stratégie 1 : Question Actuelle**
- Détection de termes capitalisés (ex: `AMAHE`, `ALTESSE`)
- Recherche fuzzy via RPC `search_client()`
- Seuil de confiance : 0.7

**Stratégie 2 : Historique Conversationnel**
- Parcours inverse de l'historique
- Extraction des termes capitalisés dans les réponses de l'assistant
- Exclusion de mots courants (`SASU`, `PARIS`, `FRANCE`, etc.)

**Fallback : Demande de Clarification**
- Liste des 10 premiers clients disponibles
- Message guidant l'utilisateur
- Exemples de reformulation

---

### 3. Recherche Vectorielle

**Modèle d'Embedding** : Mistral Embed (1024 dimensions)

**Fonction RPC** : `match_documents()`

**Filtres Appliqués** :
```sql
WHERE metadata->>'client_id' = '{client_id}'
  AND metadata->>'client_code' = '{client_code}'
  AND similarity >= 0.7
ORDER BY similarity DESC
LIMIT {top_k}
```

---

### 4. Regroupement par Document

**Logique** :
- Les chunks sont regroupés par `metadata.file_path`
- Calcul de `max_similarity` par document
- Tri des documents par pertinence décroissante

**Contexte Construit** :
```
[Source 1: Conditions_generales.pdf]
Pertinence: 92.3%

Extraits:
Chunk 1...
Chunk 2...

---

[Source 2: Avenant_2025.pdf]
Pertinence: 87.5%

Extraits:
Chunk 3...
```

---

### 5. Génération de Réponse

**Modèle LLM** : Mistral Large Latest

**Paramètres** :
- **Température** : 0.3 (précis, peu créatif)
- **Max Tokens** : 2048
- **Stream** : Activé

**System Prompt** :
```
Tu es un assistant expert en analyse de contrats d'assurance pour WALTERA.

Tu réponds actuellement pour le client **{client_name}** ({client_code}).

Tu as accès aux documents sources suivants :
{context}

IMPORTANT pour les citations :
- Cite tes sources en utilisant le nom du fichier
- Ne cite PAS "Document 1, 2, 3" mais le NOM RÉEL du fichier
- Plusieurs extraits peuvent provenir du même document source

Réponds UNIQUEMENT avec ces documents.
Sois précis, concis et professionnel.
```

---

## 🔧 Configuration

### Variables d'Environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `MISTRAL_API_KEY` | Clé API Mistral AI | ✅ |
| `SUPABASE_URL` | URL projet Supabase | ✅ |
| `SUPABASE_ANON_KEY` | Clé anonyme Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role | ✅ |

### Configuration Supabase

Ajouter dans le dashboard Supabase :
1. **Edge Functions > Secrets**
2. Ajouter les 4 variables ci-dessus

---

## 📊 Performance

### Métriques Typiques

| Étape | Temps Moyen |
|-------|-------------|
| Authentication | ~20ms |
| Classification | ~5ms |
| Client Resolution | ~50ms |
| Embedding Generation | ~200ms |
| Vector Search | ~100ms |
| LLM Streaming (first token) | ~500ms |
| **Total (premier token)** | **~875ms** |

**vs Workflows n8n** : ~2-5 secondes

→ **Gain : 2-5x plus rapide** ⚡

---

## 🚨 Gestion des Erreurs

### Erreurs Courantes

#### 1. Non Authentifié (401)
```json
{ "error": "Non authentifié" }
```
**Solution** : Fournir un JWT valide dans le header `Authorization`

#### 2. Client Non Identifié
**Réponse** : Message de clarification + liste clients
**Action** : Reformuler avec client explicite

#### 3. Aucun Document Trouvé
**Réponse** : Message informatif
```
Je n'ai trouvé aucun document correspondant pour {client_name}.

Vous pouvez :
- Reformuler votre question
- Vérifier que des documents ont été importés
- Poser une question sur un autre client
```

#### 4. Erreur Mistral API (500)
```json
{
  "error": "Erreur Mistral Embed: ...",
  "details": "..."
}
```
**Solution** : Vérifier `MISTRAL_API_KEY` et quotas

#### 5. Erreur Recherche Vectorielle (500)
```json
{
  "error": "Erreur lors de la recherche dans les documents",
  "details": "..."
}
```
**Solution** : Vérifier RPC `match_documents()` existe et table `documents` peuplée

---

## 🧪 Tests

### Test 1 : Question Générale

**Input** :
```bash
curl -X POST https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/recherche-contrats \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "Bonjour"}'
```

**Output Attendu** : Réponse conversationnelle sans recherche

---

### Test 2 : Question avec Client

**Input** :
```bash
curl -X POST https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/recherche-contrats \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "Garanties hospitalisation AMAHE"}'
```

**Output Attendu** : Réponse basée sur documents AMAHE

---

### Test 3 : Question avec Historique

**Input** :
```bash
curl -X POST https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/recherche-contrats \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Et les franchises ?",
    "history": [
      {"role": "user", "content": "Garanties AMAHE"},
      {"role": "assistant", "content": "Pour AMAHE, les garanties..."}
    ]
  }'
```

**Output Attendu** : Réponse contextuelle sur franchises AMAHE

---

## 🔐 Sécurité

### Authentification
- ✅ JWT requis (Supabase Auth)
- ✅ Vérification utilisateur via `getUser()`
- ✅ Service Role pour recherche vectorielle

### Autorisations
- 🔒 Row Level Security (RLS) sur `documents`
- 🔒 Filtrage par `client_id` + `client_code`
- 🔒 Pas d'accès cross-client

### Bonnes Pratiques
1. Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client
2. Logs détaillés pour debugging (console.log)
3. Timeout implicite via Deno (10 minutes max)

---

## 🔄 Différence avec Workflows n8n

| Critère | Edge Function | Workflows n8n |
|---------|---------------|---------------|
| **Latence** | ~875ms | ~2-5s |
| **Scalabilité** | Auto-scaling | Limité |
| **Coût** | Inclus Supabase | Serveur dédié |
| **Maintenance** | Code TypeScript | UI + JSON |
| **Testing** | Tests unitaires | Tests manuels |
| **Versioning** | Git natif | Export JSON |
| **Streaming** | SSE natif | Émulation |
| **Debugging** | Logs structurés | Exécutions n8n |

---

## 🎯 Cas d'Usage

### 1. Chatbot Web WALTERA
```typescript
// React component
const response = await fetch('/functions/v1/recherche-contrats', {
  method: 'POST',
  body: JSON.stringify({ query, history })
});

// Stream SSE
for await (const chunk of streamSSE(response)) {
  setMessages(prev => [...prev, chunk.text]);
}
```

### 2. API Mobile
```swift
// Swift (iOS)
let request = URLRequest(url: edgeFunctionURL)
request.httpMethod = "POST"
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

// Parse SSE stream
```

### 3. Slack Bot
```javascript
// Slack webhook → Edge Function → Slack response
app.event('message', async ({ event }) => {
  const response = await callEdgeFunction(event.text);
  await say(response);
});
```

---

## 🛠️ Maintenance

### Déploiement

```bash
# Déployer la fonction
supabase functions deploy recherche-contrats

# Avec secrets
supabase secrets set MISTRAL_API_KEY=sk-...
```

### Logs en Temps Réel

```bash
# Suivre les logs
supabase functions logs recherche-contrats --tail
```

### Mise à Jour

```bash
# Modifier le code
vim supabase/functions/recherche-contrats/index.ts

# Redéployer
supabase functions deploy recherche-contrats
```

---

## 🚀 Améliorations Possibles

- [ ] Cache Redis pour embeddings fréquents
- [ ] Feedback loop (👍/👎 sur réponses)
- [ ] Multi-langue (détection automatique)
- [ ] Analytics (temps réponse, satisfaction, etc.)
- [ ] Rate limiting par utilisateur
- [ ] Support fichiers audio/vidéo (transcription)
- [ ] Export conversations en PDF
- [ ] Suggestions de questions

---

## 📞 Support

**Logs** : Dashboard Supabase > Edge Functions > recherche-contrats > Logs
**Debugging** : `console.log()` apparaissent dans les logs
**Documentation Deno** : https://deno.com/deploy/docs
**Documentation Supabase** : https://supabase.com/docs/guides/functions

---

## 📄 Dépendances

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
```

**APIs Externes** :
- Mistral AI Embeddings (`mistral-embed`)
- Mistral AI Chat (`mistral-large-latest`)
- Supabase RPC (`match_documents`, `search_client`)

---

**Créé par** : GARED
**Pour** : WALTERA
**Dernière révision** : 15 janvier 2026
