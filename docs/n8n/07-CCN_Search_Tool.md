# CCN_Search_Tool

**ID**: `OC6aMLO0ejfGIt8n`
**Statut**: ✅ Actif
**Créé le**: 18/12/2025
**Dernière mise à jour**: 15/01/2026

---

## 📋 Description

Agent conversationnel RAG avancé pour la consultation des Conventions Collectives, utilisant OpenAI GPT-4.1 Mini avec workflow exécutable pour recherche vectorielle personnalisée.

---

## 🎯 Objectif

Alternative à `walteraRagConsultationCcnVersionFinale` avec :
- Modèle OpenAI GPT-4.1 Mini (plus rapide, moins cher)
- Workflow exécutable pour recherche vectorielle
- Système de mémoire conversationnelle
- Outils Supabase et recherche vectorielle intégrée
- Prompt conversationnel plus flexible

---

## 🔄 Triggers

### 1. **Chat Trigger** (Chat public)
- **Type** : Trigger chat n8n
- **Accès** : Public (option `public: true`)
- **Format input** :
```json
{
  "inputs": {
    "chatInput": "Que dit la CCN des avocats sur les salaires ?"
  }
}
```

### 2. **Webhook1** (HTTP POST)
- **Path de production** : `/webhook/6ba88434-41e8-4bc3-8149-a26885409cc9`
- **Path de test** : `/webhook-test/6ba88434-41e8-4bc3-8149-a26885409cc9`
- **Méthode** : POST

**Format de la requête** :
```json
{
  "body": {
    "chatInput": "Congés payés dans le BTP ?",
    "sessionId": "user-789-session"
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
- **Modèle** : OpenAI GPT-4.1 Mini (température 0.1)
- **Mémoire** : PostgreSQL Chat Memory (3 derniers messages)

**System Prompt** :
```
# ASSISTANT CONVENTIONS COLLECTIVES

Tu es un assistant expert en droit du travail français,
spécialisé dans les conventions collectives (CCN).

## TES 3 OUTILS

1. **trouver_idcc** : Convertit un nom de CCN en code IDCC
2. **recherche_ccn** : Recherche sémantique dans les documents
3. **detailDocument** : Récupère le contenu complet d'un document

## RÈGLE ABSOLUE

**Après TOUTE question posée à l'utilisateur → STOP.
Tu termines ta réponse et attends.**

## FLUX EN 4 ÉTAPES

### ÉTAPE 1 : IDENTIFICATION CCN

**Si aucune CCN validée dans la conversation :**

1. Appelle `trouver_idcc` avec le terme mentionné
2. Selon le résultat :
   - **0 résultat** → "Je n'ai pas trouvé..." → **STOP**
   - **1 résultat** → "J'ai trouvé [CCN]. C'est bien ?" → **STOP**
   - **Plusieurs** → Liste + "Laquelle ?" → **STOP**

**Si CCN déjà validée** → Passe à l'étape 2

### ÉTAPE 2 : RECHERCHE

Utilise le tool `recherche_ccn`

### ÉTAPE 3 : LECTURE DOCUMENTS

Pour chaque résultat pertinent, appelle `detailDocument`

### ÉTAPE 4 : RÉPONSE

Structure ta réponse :
1. **Réponse** : Information claire
2. **Détails** : Chiffres, conditions
3. **Sources** : 📄 [Titre] (IDCC XXX)

## MÉMOIRE CONVERSATIONNELLE

- Conserve la CCN validée pour toute la conversation
- Ne redemande QUE si nouvelle CCN mentionnée
```

---

### Phase 3 : Outils de l'Agent

#### **Tool 1: trouver_idcc** (Supabase Tool)

Identique à `walteraRagConsultationCcnVersionFinale`.

**Requête** :
```sql
SELECT * FROM idcc_ref
WHERE label ILIKE '%{libelle}%';
```

---

#### **Tool 2: recherche_ccn** (Vector Store Supabase)

**Différence majeure avec walteraRagConsultationCcnVersionFinale** :
- Utilise le Vector Store LangChain intégré (pas de code custom)
- Mode : `retrieve-as-tool`
- Top K : 5 (au lieu de 15)

**Configuration** :
```javascript
{
  "mode": "retrieve-as-tool",
  "toolDescription": "Ici tu retrouves toutes les informations par recherche sémantique",
  "tableName": "ccn",
  "topK": 5,
  "options": {
    "queryName": "match_ccn"
  }
}
```

**Embeddings** :
- Mistral Cloud (`mistral-embed`)
- Dimension 1024

**Avantages** :
- Configuration plus simple
- Embeddings automatiques
- Pas de code JavaScript à maintenir

**Inconvénient** :
- Pas de filtre IDCC direct (l'agent doit gérer)

---

#### **Tool 3: detailDocument** (Supabase Tool)

Identique à `walteraRagConsultationCcnVersionFinale`.

---

### Phase 4 : Workflow Exécutable (Optionnel)

#### **Node: Trigger**
- **Type** : Execute Workflow Trigger
- **Fonction** : Permet d'appeler ce workflow depuis un autre workflow

#### **Node: Embedding**
- Génère l'embedding de la query via Mistral AI
- Alternative au Vector Store intégré

#### **Node: Search**
- Appel direct à la RPC `match_ccn`
- Filtrage manuel par IDCC

**Usage** :
- Workflow peut être exécuté comme sous-routine
- Utile pour intégrations complexes

---

### Phase 5 : Mémoire et Réponse

#### **Node: Postgres Chat Memory**
- Identique à `walteraRagConsultationCcnVersionFinale`
- Table `chat_memory`
- Context window : 3 messages

#### **Node: Respond to Webhook**
- Retourne la réponse formatée

---

## 🔧 Configuration Technique

### Modèle LLM
- **Provider** : OpenAI
- **Modèle** : `gpt-4.1-mini`
- **Température** : 0.1
- **Avantages** :
  - Plus rapide que Mistral Small
  - Moins cher
  - Excellent raisonnement
  - Support function calling natif

### Embeddings
- **Provider** : Mistral AI (réutilisé depuis walteraRagConsultationCcnVersionFinale)
- **Modèle** : `mistral-embed`
- **Dimension** : 1024

### Supabase
- **URL** : `https://syxsacbciqwrahjdixuc.supabase.co`
- **Tables** : `ccn`, `idcc_ref`, `chat_memory`
- **RPC** : `match_ccn`

---

## 📝 Exemples d'Utilisation

### Via Chat Trigger
```javascript
{
  "inputs": {
    "chatInput": "Préavis de démission dans la métallurgie ?"
  }
}
```

### Via Webhook
```bash
curl -X POST https://n8n.srv659987.hstgr.cloud/webhook/6ba88434-41e8-4bc3-8149-a26885409cc9 \
  -H "Content-Type: application/json" \
  -d '{
    "chatInput": "Salaire minimum IDCC 1486",
    "sessionId": "session-xyz"
  }'
```

### Via Execute Workflow (depuis un autre workflow)
```javascript
$execution.executeWorkflow(
  'CCN_Search_Tool',
  {
    query: "congés payés",
    idcc: "1000"
  }
);
```

---

## 🆚 Comparaison avec walteraRagConsultationCcnVersionFinale

| Caractéristique | walteraRagConsultationCcnVersionFinale | CCN_Search_Tool |
|-----------------|----------------------------------------|-----------------|
| **Modèle LLM** | Mistral Small | OpenAI GPT-4.1 Mini |
| **Coût** | €0.002/1K tokens | €0.0001/1K tokens |
| **Vitesse** | Moyen | Rapide |
| **Recherche vectorielle** | Code custom (15 résultats) | Vector Store intégré (5 résultats) |
| **Filtre IDCC** | Automatique dans l'outil | Géré par l'agent |
| **Workflow exécutable** | Non | Oui |
| **Prompt** | Strict (stop après question) | Flexible (conversationnel) |
| **Use case** | Production | Test / Alternative |

---

## 📈 Performance

- **Temps de réponse** : 1-3 secondes (plus rapide que Mistral)
- **Coût par requête** : ~10x moins cher
- **Recherche vectorielle** : < 500ms
- **Génération LLM** : 0.5-1.5 secondes

---

## 🚨 Gestion des Erreurs

Identique à `walteraRagConsultationCcnVersionFinale` :
1. IDCC non trouvé
2. Aucun résultat dans recherche
3. Document non trouvé
4. Timeout API
5. Session expirée

---

## 🔐 Sécurité

### Points d'attention
- ⚠️ **Chat public** : Accessible sans authentification
- ⚠️ **API Keys hardcodées** : OpenAI, Mistral, Supabase
- ✅ **Context window limité** : 3 messages

### Recommandations
1. Externaliser les API keys
2. Ajouter authentification
3. Rate limiting
4. Monitoring des coûts OpenAI

---

## 🛠️ Maintenance

### Changer le modèle OpenAI
Éditer le node **OpenAI Chat Model** :
```javascript
{
  "model": "gpt-4.1-mini",  // ou "gpt-4o", "gpt-4.1"
  "temperature": 0.1
}
```

### Ajuster le nombre de résultats
Éditer le node **recherche_ccn** > topK :
```javascript
{
  "topK": 10  // au lieu de 5
}
```

### Modifier le system prompt
Éditer le node **Agent RAG WALTERA** > Options > System Message

---

## 🎯 Cas d'Usage

### Quand utiliser CCN_Search_Tool ?
1. **Prototypage rapide** : Tests d'interface conversationnelle
2. **Optimisation coûts** : Réduire les frais d'API
3. **Performance** : Besoin de réponses ultra-rapides
4. **Intégration** : Appel depuis d'autres workflows n8n
5. **A/B Testing** : Comparer avec Mistral

### Quand utiliser walteraRagConsultationCcnVersionFinale ?
1. **Production stable** : Workflow principal validé
2. **Précision maximale** : Recherche avec filtre IDCC strict
3. **Plus de contexte** : 15 résultats au lieu de 5
4. **Conformité** : Mistral hébergé en Europe

---

## 🔗 Intégrations

- **OpenAI** : LLM GPT-4.1 Mini
- **Mistral AI** : Embeddings
- **Supabase** : Base vectorielle + Mémoire
- **n8n Execute Workflow** : Sous-routine réutilisable

---

## 🎯 Améliorations Possibles

- [ ] Basculer embeddings sur OpenAI (uniformiser le provider)
- [ ] Ajouter filtre IDCC dans Vector Store
- [ ] Dashboard de comparaison Mistral vs OpenAI
- [ ] Export des conversations pour fine-tuning
- [ ] Détection automatique de langue (FR/EN)
- [ ] Support multi-CCN (comparaison)
- [ ] Streaming de la réponse

---

## 📞 Support

**Webhook URL** : `https://n8n.srv659987.hstgr.cloud/webhook/6ba88434-41e8-4bc3-8149-a26885409cc9`
**Chat URL** : Via l'interface n8n (chat trigger)

---

## 💡 Notes Techniques

### Pourquoi OpenAI GPT-4.1 Mini ?
- **10x moins cher** que GPT-4
- **2x plus rapide** que Mistral Small
- **Excellent pour les tâches RAG** (retrieval-augmented generation)
- **Support natif des tools** OpenAI (function calling)

### Pourquoi garder Mistral Embeddings ?
- **Cohérence** avec la base vectorielle existante
- **Réutilisation** : Même modèle que l'ingestion
- **Performance** : Embeddings de qualité
- **Coût** : Embeddings peu coûteux

### Workflow Exécutable : Use Case
```javascript
// Depuis un autre workflow
const result = await $execution.executeWorkflow(
  'CCN_Search_Tool',
  {
    query: "congés payés avocats",
    idcc: "1000"
  }
);

// Traiter le résultat
const answer = result.data.message;
```

---

## 🚀 Roadmap

- [ ] Migration complète vers OpenAI (embeddings inclus)
- [ ] Support GPT-4o (vision pour documents PDF)
- [ ] Fine-tuning sur conversations WALTERA
- [ ] API REST dédiée (hors n8n)
- [ ] Frontend React avec streaming
