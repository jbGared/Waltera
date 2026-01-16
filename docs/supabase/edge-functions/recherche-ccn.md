# Edge Function: recherche-ccn

## Description

Agent conversationnel RAG (Retrieval Augmented Generation) pour la recherche semantique dans les conventions collectives. Utilise Mistral AI pour la classification des requetes, la vectorisation et la generation de reponses.

---

## Informations

| Attribut | Valeur |
|----------|--------|
| **Slug** | `recherche-ccn` |
| **Statut** | Production |
| **Authentification** | JWT requis |
| **Runtime** | Deno (Supabase Edge) |
| **Streaming** | SSE (Server-Sent Events) |

---

## Fonctionnalites

- Classification intelligente des requetes (question generale, identification IDCC, recherche CCN)
- Detection automatique de l'IDCC par nom ou numero
- Recherche semantique via embeddings Mistral
- Hierarchie juridique des textes (arretes > avenants > accords > annexes > texte de base)
- Historique de conversation pour contexte
- Longueur de reponse configurable (court/moyen/long)
- Streaming des reponses en temps reel

---

## API

### Endpoint

```
POST /functions/v1/recherche-ccn
```

### Headers

| Header | Valeur | Requis |
|--------|--------|--------|
| `Authorization` | `Bearer {JWT_TOKEN}` | Oui |
| `Content-Type` | `application/json` | Oui |

### Body (JSON)

| Parametre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `query` | string | Oui | Question de l'utilisateur |
| `idcc` | string | Non | Code IDCC pour filtrer la recherche |
| `top_k` | number | Non | Nombre de chunks a recuperer (defaut: 15) |
| `history` | Message[] | Non | Historique des messages precedents |
| `response_length` | string | Non | Longueur: `short`, `medium` (defaut), `long` |

### Types

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SearchCCNRequest {
  query: string;
  idcc?: string;
  top_k?: number;
  history?: Message[];
  response_length?: 'short' | 'medium' | 'long';
}
```

### Exemple de Requete

```bash
# Recherche simple
curl -X POST "https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/recherche-ccn" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Quels sont les delais de preavis pour demission ?",
    "idcc": "1486"
  }'

# Avec historique
curl -X POST "https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/recherche-ccn" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Et pour les cadres ?",
    "history": [
      {"role": "user", "content": "Delais de preavis demission IDCC 1486 ?"},
      {"role": "assistant", "content": "Dans la CCN Syntec..."}
    ],
    "response_length": "long"
  }'
```

### Reponse (Streaming SSE)

```
data: {"text":"Les"}
data: {"text":" delais"}
data: {"text":" de"}
data: {"text":" preavis"}
...
data: [DONE]
```

---

## Classification des Requetes

La fonction classifie automatiquement les requetes en 3 categories :

### 1. Question Generale (`general_question`)

Salutations, questions sur la date, questions sur l'assistant.

**Exemple** : "Bonjour", "Quelle date sommes-nous ?", "Qui es-tu ?"

**Comportement** : Reponse directe sans recherche vectorielle.

### 2. Identification IDCC (`idcc_identification`)

L'utilisateur mentionne une CCN sans poser de question specifique.

**Exemple** : "Parlons de Syntec", "CCN des avocats", "Metallurgie"

**Comportement** : Demande de clarification avec liste des CCN correspondantes.

### 3. Recherche CCN (`ccn_search`)

Question specifique sur une CCN.

**Exemple** : "Conges payes dans l'IDCC 1486", "Preavis de demission Syntec"

**Comportement** : Recherche vectorielle + generation de reponse IA.

---

## Hierarchie Juridique

Les documents sont tries par priorite juridique :

| Priorite | Type | Label |
|----------|------|-------|
| 1 | ARRETE_EXTENSION, ARRETE_AGREMENT, ARRETE | Arrete (force obligatoire) |
| 2 | AVENANT | Avenant (modification) |
| 3 | ACCORD_* | Accord thematique |
| 4 | ANNEXE | Annexe |
| 5 | TEXTE_BASE | Texte de base |
| 6 | UNKNOWN | Autre |

---

## Longueur de Reponse

| Mode | Max Tokens | Instruction |
|------|-----------|-------------|
| `short` | 500 | Reponse tres concise (2-3 phrases) |
| `medium` | 1500 | Reponse equilibree avec details essentiels |
| `long` | 3000 | Reponse detaillee avec sources citees |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      RECHERCHE CCN                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Authentification JWT                                     │
│     └─> Verification utilisateur Supabase                   │
│                                                              │
│  2. Classification de la requete                            │
│     └─> Pre-detection par patterns                          │
│     └─> Classification LLM (Mistral Small)                  │
│                                                              │
│  3. Resolution de l'IDCC                                    │
│     └─> IDCC explicite dans la requete                      │
│     └─> Recherche par nom de CCN                            │
│     └─> IDCC dans l'historique                              │
│                                                              │
│  4. Generation embedding query                              │
│     └─> Mistral Embeddings (1024 dimensions)                │
│                                                              │
│  5. Recherche vectorielle                                   │
│     └─> RPC match_ccn avec filtre IDCC                      │
│     └─> Tri par hierarchie juridique + similarite          │
│                                                              │
│  6. Generation reponse streaming                            │
│     └─> Mistral Large avec contexte                         │
│     └─> SSE (Server-Sent Events)                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Tables Supabase

### Lecture

| Table | Description |
|-------|-------------|
| `idcc_ref` | Reference des IDCC (idcc, label, active) |
| `ccn` | Chunks vectorises des CCN |

### RPC

| Fonction | Description |
|----------|-------------|
| `match_ccn` | Recherche vectorielle avec filtre IDCC et seuil de similarite |

---

## Configuration

### Variables d'Environnement

| Variable | Description |
|----------|-------------|
| `MISTRAL_API_KEY` | Cle API Mistral pour classification, embeddings et chat |
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_ANON_KEY` | Cle anonyme Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Cle Service Role |

---

## Performance

| Metrique | Valeur |
|----------|--------|
| Cold Start | ~50-100ms |
| Classification | ~200-500ms (LLM) ou ~5ms (pattern) |
| Embedding Generation | ~200ms |
| Vector Search | ~100ms |
| LLM First Token | ~500ms |
| **Total (premier token)** | **~1s** |

---

## Troubleshooting

### Erreur 401 (Non authentifie)

**Cause** : Token JWT manquant ou invalide.

**Solution** : Verifier le header Authorization.

### Aucun document trouve

**Cause** : IDCC non importe ou aucun chunk correspondant.

**Solution** : Verifier que la CCN a ete importee via `import-ccn`.

### Reponse lente

**Cause** : Embeddings + recherche vectorielle + generation LLM.

**Solution** : Utiliser `response_length: "short"` pour des reponses plus rapides.

### IDCC non reconnu

**Cause** : Nom de CCN ambigu ou IDCC inexistant.

**Solution** : Utiliser le code IDCC numerique ou verifier les CCN actives.

---

## Voir Aussi

- [import-ccn](./import-ccn.md) - Import des conventions collectives
- [export-ccn](./export-ccn.md) - Export des CCN
- [recherche-contrats](./recherche-contrats.md) - Recherche dans les contrats clients

---

**Derniere mise a jour** : 16 janvier 2026
**Version** : 1.0.0
