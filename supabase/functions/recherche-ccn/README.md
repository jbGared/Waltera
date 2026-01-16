# Edge Function: recherche-ccn

## Vue d'ensemble

Edge Function Supabase pour la recherche intelligente dans les Conventions Collectives Nationales (CCN). Remplace les workflows N8N 06 et 07 avec de meilleures performances et une hierarchie juridique respectee.

**Version**: 1.0.0
**Date**: 15 janvier 2026

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│                   useChatWithEdgeFunction.ts                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ POST /functions/v1/recherche-ccn
┌─────────────────────────────────────────────────────────────────┐
│                    Edge Function (Deno)                          │
│                                                                  │
│  1. Authentification (JWT Supabase)                              │
│  2. Classification LLM (Mistral Small)                           │
│     └── Retourne: { intent, idcc, ccn_name }                     │
│  3. Routage selon intent:                                        │
│     ├── general_question → Reponse directe                       │
│     ├── idcc_identification → Clarification                      │
│     └── ccn_search → Pipeline RAG                                │
│  4. Identification IDCC (param, LLM, historique)                 │
│  5. Generation embedding (Mistral Embed)                         │
│  6. Recherche vectorielle avec hierarchie juridique              │
│  7. Generation reponse (Mistral Large)                           │
│  8. Streaming SSE vers le client                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Parametres d'entree

```typescript
interface SearchCCNRequest {
  query: string;              // Question de l'utilisateur
  idcc?: string;              // Code IDCC (optionnel, ex: "1486")
  top_k?: number;             // Nombre de chunks (defaut: 15)
  history?: Message[];        // Historique de conversation
  response_length?: 'short' | 'medium' | 'long';
}
```

## Hierarchie juridique

L'Edge Function respecte la hierarchie juridique des textes CCN :

| Priorite | Types | Description |
|----------|-------|-------------|
| P1 | ARRETE_EXTENSION, ARRETE_AGREMENT | Force obligatoire maximale |
| P2 | AVENANT | Modifications du texte de base |
| P3 | ACCORD_SALAIRES, ACCORD_PREVOYANCE, ACCORD_FORMATION, ACCORD | Accords thematiques |
| P4 | ANNEXE | Classifications, grilles |
| P5 | TEXTE_BASE | Convention originale |

Les textes sont toujours tries par priorite juridique (P1 avant P2, etc.), puis par similarite semantique.

## Etats juridiques filtres

Seuls les textes en vigueur sont retournes :
- `VIGUEUR`
- `VIGUEUR_ETEN`
- `VIGUEUR_NON_ETEN`
- `VIGUEUR_DIFF`

Les textes `ABROGE` sont automatiquement exclus.

## Identification de l'IDCC

L'IDCC est identifie dans cet ordre de priorite :

1. **Parametre explicite** : `idcc` fourni dans la requete
2. **Detection dans la question** : "IDCC 1486", "CCN 1486"
3. **Classification LLM** : Extraction du nom de la CCN
4. **Historique** : Recherche dans les messages precedents

Si l'IDCC ne peut pas etre determine, une clarification est demandee avec la liste des CCN disponibles.

## Variables d'environnement

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
MISTRAL_API_KEY=xxx
```

## Fonction RPC utilisee

```sql
match_ccn(
  query_embedding VECTOR(1024),
  filter JSONB,           -- {"idcc": "1486"}
  match_count INT,        -- 15
  similarity_threshold FLOAT  -- 0.5
)
```

Cette fonction trie automatiquement par hierarchie juridique puis par similarite.

## Exemples d'utilisation

### Question avec IDCC explicite

```bash
curl -X POST https://xxx.supabase.co/functions/v1/recherche-ccn \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Quels sont les preavis de licenciement ?",
    "idcc": "1486"
  }'
```

### Question avec nom de CCN

```bash
curl -X POST https://xxx.supabase.co/functions/v1/recherche-ccn \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Conges payes dans la CCN Syntec"
  }'
```

### Conversation avec historique

```bash
curl -X POST https://xxx.supabase.co/functions/v1/recherche-ccn \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Et pour les cadres ?",
    "history": [
      {"role": "user", "content": "Preavis CCN 1486"},
      {"role": "assistant", "content": "Dans la CCN Syntec..."}
    ]
  }'
```

## Reponse

La reponse est streamee en format SSE (Server-Sent Events) :

```
data: {"text":"Dans"}
data: {"text":" la"}
data: {"text":" CCN"}
...
```

## Deploiement

```bash
supabase functions deploy recherche-ccn
```

## Tests

```bash
# Question generale
curl -X POST ... -d '{"query": "Bonjour"}'

# Recherche CCN
curl -X POST ... -d '{"query": "Salaires Syntec", "idcc": "1486"}'

# Verification hierarchie
# Les arretes (P1) doivent apparaitre avant le texte de base (P5)
```

## Fichiers lies

- `/src/hooks/useChatCCN.ts` - Hook React pour cette Edge Function
- `/src/pages/CCN.tsx` - Page de consultation CCN
- `/docs/SOP/SOP-CCN-Conventions-Collectives.md` - Documentation complete
