# walteraRagConsultationCcnVersionFinale

**ID**: `WPLcLN9YdY5T95ge`
**Statut**: ✅ Actif
**Créé le**: 17/12/2025
**Dernière mise à jour**: 15/01/2026

---

## 📋 Description

Agent conversationnel RAG (Retrieval-Augmented Generation) intelligent pour la consultation des Conventions Collectives Nationales. Utilise Mistral Cloud et recherche vectorielle pour répondre aux questions juridiques.

---

## 🎯 Objectif

Fournir un assistant IA expert en CCN capable de :
- Répondre aux questions sur les conventions collectives
- Rechercher dans la base vectorielle CCN
- Consulter les détails complets des documents
- Maintenir un contexte conversationnel
- Identifier les IDCC depuis des noms de CCN

---

## 🔄 Triggers

### 1. **Chat Trigger** (Chat public)
- **Type** : Trigger chat n8n
- **Accès** : Public (option `public: true`)
- **Format input** :
```json
{
  "inputs": {
    "chatInput": "Quel est le salaire minimum dans la CCN des avocats ?"
  }
}
```

### 2. **Webhook1** (HTTP POST)
- **Path de production** : `/webhook/8cb780f1-ec43-4e4a-8470-559c8b27081f`
- **Path de test** : `/webhook-test/8cb780f1-ec43-4e4a-8470-559c8b27081f`
- **Méthode** : POST

**Format de la requête** :
```json
{
  "body": {
    "chatInput": "Indemnités de licenciement dans la CCN des bureaux d'études ?",
    "sessionId": "user-123-session"
  }
}
```

---

## 🏗️ Architecture du Workflow

### Phase 1 : Réception et Normalisation

#### **Node: When chat message received**
- Trigger chat public
- Reçoit `chatInput` de l'utilisateur

#### **Node: Webhook1**
- Trigger webhook pour intégrations externes
- Support de `sessionId` personnalisé

#### **Node: Edit Fields**
- Normalise les inputs (chat ou webhook)
- Extrait `chatInput` et `sessionId`

**Logique de sessionId** :
```javascript
sessionId = $json?.sessionId
         || $json.body?.sessionId
         || $json.query?.sessionId
         || 'default-' + $now.format('yyyy-MM-dd')
```

---

### Phase 2 : Agent RAG Principal

#### **Node: Agent RAG WALTERA**
- **Type** : Agent LangChain
- **Modèle** : Mistral Cloud (`mistral-small-latest`, température 0.1)
- **Mémoire** : PostgreSQL Chat Memory (3 derniers messages)

**System Prompt** :
```
# TU ES UN ASSISTANT CCN - RÈGLES STRICTES

# RÈGLE ABSOLUE : SI TU POSES UNE QUESTION → TU T'ARRÊTES

Dès que tu demandes quelque chose à l'utilisateur, tu TERMINES ta réponse.
Tu n'appelles PLUS AUCUN outil. Tu attends sa réponse.

# 3 OUTILS DISPONIBLES

- trouver_idcc : Convertit un nom en IDCC
- recherche_ccn : Cherche dans une CCN (besoin idcc + query)
- detailDocument : Lit un document (besoin kali_id)

# COMMENT RÉPONDRE

**CAS 1 : L'utilisateur dit juste un nom ou IDCC**

Exemples : "parlons des avocats", "IDCC 1000", "métallurgie"

Actions :
1. Si c'est un nom → Appelle trouver_idcc UNE fois
2. Réponds "Quelle information cherchez-vous sur [CCN] ?"
3. **TERMINE - N'APPELLE PLUS RIEN**

**CAS 2 : L'utilisateur donne IDCC + question**

Exemples : "indemnités licenciement IDCC 1000", "salaires avocats"

Actions :
1. Si besoin, appelle trouver_idcc pour obtenir l'IDCC
2. Appelle recherche_ccn(idcc, query)
3. Appelle detailDocument sur le meilleur résultat
4. Réponds avec les infos
5. **TERMINE**
```

---

### Phase 3 : Outils de l'Agent

#### **Tool 1: trouver_idcc** (Supabase Tool)

**Description** :
> Trouve le code IDCC à partir du nom ou libellé de la convention collective.
> Utilise cet outil quand l'utilisateur mentionne le nom d'une CCN sans donner l'IDCC.

**Paramètre** :
- `libelle` (string) : Nom ou mot-clé de la CCN

**Requête Supabase** :
```sql
SELECT * FROM idcc_ref
WHERE label ILIKE '%{libelle}%';
```

**Exemple** :
```
Input: libelle = "avocats"
Output: [
  { idcc: "1000", label: "Convention collective nationale des avocats" }
]
```

---

#### **Tool 2: recherche_ccn** (Code Tool)

**Description** :
> Recherche dans les conventions collectives avec filtre IDCC obligatoire.
> Tu DOIS identifier l'IDCC avant d'appeler cet outil.

**Paramètres** :
- `idcc` (string, requis) : Code IDCC à 4 chiffres (ex: "1000", "1486")
- `query` (string, requis) : Question reformulée avec mots-clés

**Fonctionnement** :
1. Génère l'embedding de la query via Mistral AI
2. Appelle la RPC Supabase `match_ccn` avec filtre IDCC
3. Retourne 15 chunks pertinents
4. Formate les résultats

**Code** :
```javascript
// 1. Embedding
const embeddingResponse = await this.helpers.httpRequest({
  method: 'POST',
  url: 'https://api.mistral.ai/v1/embeddings',
  headers: { 'Authorization': 'Bearer TU46gE1YmkB76sR6xtOBiiT59ZoFnind' },
  body: { model: 'mistral-embed', input: [query] }
});

const embedding = embeddingResponse.data[0].embedding;

// 2. Recherche vectorielle
const results = await this.helpers.httpRequest({
  method: 'POST',
  url: 'https://syxsacbciqwrahjdixuc.supabase.co/rest/v1/rpc/match_ccn',
  body: {
    query_embedding: embedding,
    filter: { idcc: String(idcc) },
    match_count: 15
  }
});

// 3. Formatage
const formatted = results.map(r => `
📄 ${r.metadata.titre}
🔑 ${r.metadata.kali_id}
⚖️ ${r.metadata.etat_juridique} | Priority: ${r.metadata.priority}
📅 ${r.metadata.date_debut || 'N/A'}
📝 ${r.content.substring(0, 200)}...
🔗 ${r.metadata.url_legifrance}
---
`).join('\n');
```

**Exemple** :
```
Input:
  idcc = "1000"
  query = "salaire minimum avocat débutant"

Output:
📄 Accord salaires 2025
🔑 KALITEXT000046789123
⚖️ VIGUEUR | Priority: 3
📅 2025-01-01
📝 Article 5 - Rémunération minimale
Les avocats débutants perçoivent une rémunération minimale...
🔗 https://www.legifrance.gouv.fr/conv_coll/id/KALITEXT000046789123
---
```

---

#### **Tool 3: detailDocument** (Supabase Tool)

**Description** :
> OUTIL OBLIGATOIRE après avoir utilisé recherche_ccn.
> Récupère le contenu COMPLET d'un document identifié.

**Paramètre** :
- `file_name` (string) : `kali_id` extrait des résultats de `recherche_ccn`

**Requête Supabase** :
```sql
SELECT * FROM ccn
WHERE metadata->>'file_path' ILIKE '%{file_name}%';
```

**Exemple** :
```
Input: file_name = "KALITEXT000046789123"
Output: {
  id: 12345,
  content: "[Contenu complet de l'article 5...]",
  metadata: { titre: "Accord salaires 2025", ... }
}
```

---

### Phase 4 : Mémoire Conversationnelle

#### **Node: Postgres Chat Memory**
- **Type** : PostgreSQL Chat Memory
- **Table** : `chat_memory`
- **Context Window** : 3 derniers messages
- **Index** : Par `sessionId`

**Schéma table** :
```sql
CREATE TABLE chat_memory (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,  -- 'user' ou 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_memory_session ON chat_memory(session_id);
```

---

### Phase 5 : Réponse

#### **Node: Respond to Webhook**
- Retourne la réponse de l'agent
- Format JSON avec message et métadonnées

**Réponse type** :
```json
{
  "message": "Le salaire minimum d'un avocat débutant est de 2 500€ brut mensuel selon l'accord salaires 2025.",
  "sources": [
    {
      "titre": "Accord salaires 2025",
      "kali_id": "KALITEXT000046789123",
      "url": "https://www.legifrance.gouv.fr/..."
    }
  ],
  "sessionId": "user-123-session"
}
```

---

## 📊 Flux Conversationnel

### Exemple 1 : Question Simple

**User** : "Parlons des avocats"

**Agent** :
1. Appelle `trouver_idcc(libelle="avocats")`
2. Trouve IDCC 1000
3. Répond : "J'ai trouvé la CCN des avocats (IDCC 1000). Quelle information cherchez-vous ?"
4. **STOP**

---

**User** : "Salaires"

**Agent** :
1. Contexte : IDCC 1000 déjà identifié (mémoire)
2. Appelle `recherche_ccn(idcc="1000", query="salaires")`
3. Reçoit 15 résultats
4. Appelle `detailDocument(file_name=meilleur_kali_id)`
5. Répond avec informations détaillées
6. **STOP**

---

### Exemple 2 : Question Directe

**User** : "Indemnités de licenciement IDCC 1486"

**Agent** :
1. Détecte IDCC 1486 dans la question
2. Appelle `recherche_ccn(idcc="1486", query="indemnités licenciement")`
3. Reçoit résultats
4. Appelle `detailDocument` sur les meilleurs résultats
5. Répond avec détails et calculs
6. **STOP**

---

## 🔧 Configuration Technique

### Modèle LLM
- **Provider** : Mistral AI
- **Modèle** : `mistral-small-latest`
- **Température** : 0.1 (précis, peu créatif)
- **Max tokens** : Par défaut

### Embeddings
- **Provider** : Mistral AI
- **Modèle** : `mistral-embed`
- **Dimension** : 1024
- **API Key** : `TU46gE1YmkB76sR6xtOBiiT59ZoFnind`

### Supabase
- **URL** : `https://syxsacbciqwrahjdixuc.supabase.co`
- **Tables** :
  - `ccn` : Documents vectorisés
  - `idcc_ref` : Référentiel IDCC
  - `chat_memory` : Historique conversations
- **RPC** : `match_ccn` (recherche vectorielle)

---

## 📝 Exemples d'Utilisation

### Via Chat Trigger
```javascript
{
  "inputs": {
    "chatInput": "Quel est le préavis de démission dans la métallurgie ?"
  }
}
```

### Via Webhook
```bash
curl -X POST https://n8n.srv659987.hstgr.cloud/webhook/8cb780f1-ec43-4e4a-8470-559c8b27081f \
  -H "Content-Type: application/json" \
  -d '{
    "chatInput": "Congés payés IDCC 2098",
    "sessionId": "user-456-session"
  }'
```

---

## 🚨 Gestion des Erreurs

### Cas d'erreurs possibles

1. **IDCC non trouvé**
   - `trouver_idcc` retourne vide
   - Agent demande précision

2. **Aucun résultat dans recherche_ccn**
   - Agent indique que l'information n'est pas disponible
   - Suggère de reformuler

3. **Document non trouvé**
   - `detailDocument` échoue
   - Agent se base sur les résultats partiels de `recherche_ccn`

4. **Timeout Mistral AI**
   - Retry automatique
   - Erreur si échec après 3 tentatives

5. **Session expirée**
   - Nouvelle session créée automatiquement
   - Pas de contexte conservé

---

## 🔐 Sécurité

### Points d'attention
- ⚠️ **Chat public** : Accessible sans authentification
- ⚠️ **API Keys hardcodées** : Mistral et Supabase
- ✅ **Context window limité** : Max 3 messages (RGPD-friendly)

### Recommandations
1. Ajouter authentification webhook
2. Externaliser les API keys
3. Rate limiting par session
4. Logger les conversations pour audit
5. Anonymiser les données dans `chat_memory`

---

## 📈 Performance

- **Temps de réponse moyen** : 2-5 secondes
- **Recherche vectorielle** : < 500ms
- **Génération LLM** : 1-3 secondes
- **Limite sessions simultanées** : Dépend du quota Mistral AI

---

## 🔗 Intégrations

- **Mistral AI** : LLM + Embeddings
- **Supabase** : Base vectorielle + Mémoire
- **n8n Chat Trigger** : Interface conversationnelle
- **Webhook** : Intégration externe

---

## 🛠️ Maintenance

### Modifier le system prompt
Éditer le node **Agent RAG WALTERA** > Options > System Message

### Changer le modèle LLM
Éditer le node **Mistral Cloud Chat Model** > Modèle

Options :
- `mistral-small-latest` (rapide, économique)
- `mistral-medium-latest` (équilibré)
- `mistral-large-latest` (le plus puissant)

### Ajuster la température
```javascript
options: {
  temperature: 0.1  // 0 = déterministe, 1 = créatif
}
```

### Augmenter la mémoire conversationnelle
Éditer le node **Postgres Chat Memory** > Context Window Length
```
contextWindowLength: 5  // au lieu de 3
```

---

## 🎯 Cas d'Usage

1. **Support client** : Répondre aux questions sur les CCN
2. **Consultation RH** : Aider les RH à appliquer les CCN
3. **Audit juridique** : Vérifier la conformité d'un contrat
4. **Formation** : Former les collaborateurs aux CCN
5. **Chatbot web** : Intégrer dans le site WALTERA

---

## 🔄 Différence avec CCN_Search_Tool

**walteraRagConsultationCcnVersionFinale** :
- Modèle Mistral Cloud
- Système de mémoire conversationnelle
- 3 outils (trouver_idcc, recherche_ccn, detailDocument)
- Prompt plus guidé (stop après question)

**CCN_Search_Tool** :
- Modèle OpenAI (gpt-4.1-mini)
- Mêmes outils
- Prompt plus flexible
- Recherche vectorielle directe (sans tool intermédiaire)

---

## 📞 Support

**Webhook URL** : `https://n8n.srv659987.hstgr.cloud/webhook/8cb780f1-ec43-4e4a-8470-559c8b27081f`
**Chat URL** : Via l'interface n8n (chat trigger)

---

## 🎯 Améliorations Possibles

- [ ] Support multi-CCN (comparer plusieurs CCN)
- [ ] Export PDF des réponses
- [ ] Historique de conversation dans l'interface
- [ ] Suggestions de questions
- [ ] Détection automatique de l'IDCC depuis le contexte utilisateur
- [ ] Intégration Stripe pour comptabiliser les tokens
- [ ] Analytics des questions fréquentes
- [ ] Amélioration du chunking (par article)
