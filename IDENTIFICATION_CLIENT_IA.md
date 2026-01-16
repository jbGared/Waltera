# Identification Automatique du Client via IA

## 🎯 Principe

L'utilisateur pose simplement sa question **sans avoir à sélectionner manuellement le client**. L'IA identifie automatiquement le client mentionné dans la question.

## ✨ Fonctionnement

### Workflow en 3 étapes

```
┌─────────────────────────────────────────────────────────┐
│ 1. User pose une question                               │
│    "Quelles sont les garanties pour ALTESSE ?"         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Edge Function - Identification IA                    │
│    • Récupère la liste des clients disponibles         │
│    • Utilise Mistral Small pour identifier le client   │
│    • Match par nom ou code (case-insensitive)          │
└─────────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────┴───────────────┐
        │                               │
   ✅ Identifié                    ❌ Non identifié
        │                               │
        ↓                               ↓
┌──────────────────┐          ┌──────────────────────┐
│ 3a. RAG Search   │          │ 3b. Clarification    │
│ • Filtre client  │          │ • Liste 10 clients   │
│ • Recherche docs │          │ • Demande précision  │
│ • Génère réponse │          │ • Reformuler         │
└──────────────────┘          └──────────────────────┘
```

## 🔧 Implémentation Technique

### Edge Function (`recherche-contrats`)

#### Étape 1 : Chargement des clients

```typescript
const { data: clientsData } = await supabaseAdmin
  .from('documents')
  .select('metadata')
  .not('metadata', 'is', null)
  .limit(1000);

// Extraire clients uniques
const clientsMap = new Map();
clientsData.forEach((doc) => {
  const { client_id, client_code, client_name } = doc.metadata;
  if (client_id && !clientsMap.has(client_id)) {
    clientsMap.set(client_id, { client_id, client_code, client_name });
  }
});

const clients = Array.from(clientsMap.values());
```

#### Étape 2 : Identification via Mistral Small

```typescript
const identificationPrompt = `Tu es un assistant qui identifie le client mentionné dans une question.

Liste des clients disponibles :
${clients.map(c => `- ${c.client_code}: ${c.client_name}`).join('\n')}

Question de l'utilisateur : "${query}"

Réponds UNIQUEMENT avec un JSON :
- Si identifié : {"identified": true, "client_code": "CODE", "confidence": 0.9}
- Si non identifié : {"identified": false, "reason": "aucun client mentionné"}`;

const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
  model: 'mistral-small-latest', // Rapide et économique
  messages: [{ role: 'user', content: identificationPrompt }],
  temperature: 0.1,
  max_tokens: 200,
});
```

#### Étape 3a : Client identifié → RAG normal

```typescript
if (identification.identified && identification.client_code) {
  const identifiedClient = clients.find(c =>
    c.client_code.toLowerCase() === identification.client_code.toLowerCase()
  );

  if (identifiedClient) {
    client_id = identifiedClient.client_id;
    client_code = identifiedClient.client_code;
    // → Continuer vers la recherche vectorielle
  }
}
```

#### Étape 3b : Client non identifié → Clarification

```typescript
if (!client_id && !client_code) {
  const clientsList = clients
    .sort((a, b) => a.client_name.localeCompare(b.client_name))
    .slice(0, 10);

  const clarificationMessage = `Je n'ai pas pu identifier de quel client vous parlez.

Voici quelques clients disponibles :
${clientsList.map(c => `• **${c.client_code}** - ${c.client_name}`).join('\n')}

Reformulez votre question en incluant le nom du client.`;

  // Retourner en streaming
  return stream(clarificationMessage);
}
```

## 📝 Exemples d'utilisation

### ✅ Questions avec client identifiable

| Question | Client identifié | Raison |
|----------|------------------|--------|
| "Garanties ALTESSE ?" | G0001 - ALTESSE | Nom exact |
| "Pour G0001, quelles sont les options ?" | G0001 - ALTESSE | Code exact |
| "Hospitalisation chez altesse" | G0001 - ALTESSE | Nom (case-insensitive) |
| "Client WALTERA, couverture dentaire ?" | G0042 - WALTERA | Nom dans contexte |

### ❌ Questions sans client identifiable

| Question | Réponse IA |
|----------|------------|
| "Quelles sont les garanties ?" | Liste des 10 premiers clients + demande de clarification |
| "Combien coûte l'hospitalisation ?" | Idem |
| "Informations sur le contrat" | Idem |

### 📋 Message de clarification

```
Je n'ai pas pu identifier de quel client vous parlez dans votre question.

Pourriez-vous préciser le client concerné ? Voici quelques clients disponibles :

• **G0001** - ALTESSE
• **G0002** - BOUYGUES CONSTRUCTION
• **G0003** - CARREFOUR
• **G0005** - DASSAULT SYSTEMES
• **G0007** - EIFFAGE
• **G0009** - FNAC DARTY
• **G0011** - GDF SUEZ
• **G0013** - INTERMARCHE
• **G0015** - JC DECAUX
• **G0017** - KERING

Reformulez votre question en incluant le nom ou le code du client, par exemple :
- "Pour le client ALTESSE, quelles sont les garanties ?"
- "Garanties hospitalisation pour G0001"
```

## 💰 Coûts

| Étape | Modèle | Coût estimé |
|-------|--------|-------------|
| Identification client | Mistral Small | ~$0.0002 |
| Embedding question | Mistral Embed | ~$0.0001 |
| Génération réponse | Mistral Large | ~$0.004 |
| **Total** | | **~$0.0043** |

**Bonus** : Pas de coût d'identification si le client est déjà spécifié dans la requête.

## 🚀 Avantages

### UX
- ✅ **Zéro friction** : Pas de dropdown à chercher
- ✅ **Langage naturel** : "Pour ALTESSE, montre-moi..."
- ✅ **Clarification intelligente** : Liste les clients si besoin
- ✅ **Tolérance** : Accepte variations de casse et formulations

### Technique
- ✅ **Performant** : Mistral Small est très rapide (~200ms)
- ✅ **Économique** : $0.0002 vs sélection manuelle gratuite
- ✅ **Robuste** : Fallback sur clarification si échec
- ✅ **Évolutif** : Supporte des centaines de clients

### Sécurité
- ✅ **Validation serveur** : L'identification se fait côté Edge Function
- ✅ **Filtrage obligatoire** : Impossible de bypass le système
- ✅ **Logs complets** : Toutes les identifications sont tracées

## 🎨 Variations acceptées

Le système accepte de nombreuses formulations :

```
✅ "ALTESSE"
✅ "altesse"
✅ "Altesse"
✅ "G0001"
✅ "g0001"
✅ "pour le client ALTESSE"
✅ "chez altesse"
✅ "client G0001"
✅ "contrat altesse"
```

## 🔍 Logs de debug

L'Edge Function log chaque étape :

```
[recherche-contrats] Requête initiale: { query: "Garanties ALTESSE ?", client_id: undefined, client_code: undefined }
[recherche-contrats] Client non spécifié, tentative d'identification...
[recherche-contrats] Clients disponibles: 42
[recherche-contrats] Réponse identification: {"identified": true, "client_code": "G0001", "confidence": 0.95}
[recherche-contrats] Client identifié: { client_id: "8f01a952-...", client_code: "G0001", client_name: "ALTESSE" }
[recherche-contrats] Client final: { client_id: "8f01a952-...", client_code: "G0001" }
[recherche-contrats] Embedding généré, dimension: 1024
[recherche-contrats] Paramètres RPC: { query_embedding: [...], match_count: 5, filter: { client_id: "8f01a952-..." } }
[recherche-contrats] Chunks trouvés: 5
```

## 🧪 Tests

### Test 1 : Client mentionné explicitement

**Input** :
```
"Quelles sont les garanties hospitalisation pour ALTESSE ?"
```

**Attendu** :
- Identification : ✅ G0001 - ALTESSE
- Recherche : Documents ALTESSE uniquement
- Réponse : Citations des contrats ALTESSE

### Test 2 : Client non mentionné

**Input** :
```
"Quelles sont les garanties ?"
```

**Attendu** :
- Identification : ❌ Aucun client
- Réponse : Message de clarification + liste des 10 clients

### Test 3 : Code client

**Input** :
```
"G0001 optique ?"
```

**Attendu** :
- Identification : ✅ G0001 - ALTESSE
- Recherche : Documents ALTESSE
- Réponse : Informations optique ALTESSE

## 📊 Métriques

À surveiller en production :

| Métrique | Cible |
|----------|-------|
| Taux d'identification réussie | > 80% |
| Temps d'identification | < 500ms |
| Faux positifs | < 5% |
| Demandes de clarification | < 20% |

## 🔄 Améliorations futures

### Court terme
- [ ] Cache des clients en mémoire (éviter query DB à chaque fois)
- [ ] Support des synonymes (ex: "Bouygues" → "Bouygues Construction")
- [ ] Mémorisation du client dans le contexte de conversation

### Moyen terme
- [ ] Multi-clients : "Compare ALTESSE et CARREFOUR"
- [ ] Historique : "Même client que la conversation précédente"
- [ ] Suggestions intelligentes basées sur l'historique utilisateur

### Long terme
- [ ] Fine-tuning d'un modèle dédié à l'identification
- [ ] Support des entités juridiques multiples par client
- [ ] Détection automatique du contexte (appel d'offres, sinistre, etc.)

## 🎉 Conclusion

Le système d'identification automatique offre une **expérience utilisateur naturelle** tout en maintenant une **sécurité et précision maximales**. L'utilisateur n'a plus besoin de chercher dans un dropdown : il pose simplement sa question en langage naturel !

**Exemples réels** :
- ❌ Avant : Sélectionner "G0001 - ALTESSE" → "Garanties ?"
- ✅ Après : "Garanties ALTESSE ?"
