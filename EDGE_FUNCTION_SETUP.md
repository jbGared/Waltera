# Configuration Edge Function: recherche-contrats

## ✅ Edge Function déployée avec succès !

**Nom:** `recherche-contrats`
**ID:** `682e280c-1b7a-4b28-a5ee-60a45ac6998e`
**Status:** ACTIVE
**Authentification JWT:** Activée

## 🔑 Configuration des secrets (IMPORTANT)

### Étape 1: Accéder au dashboard Supabase
1. Allez sur https://supabase.com/dashboard/project/syxsacbciqwrahjdixuc/settings/vault/secrets
2. Ou : Projet → Settings → Edge Functions → Manage secrets

### Étape 2: Secret configuré

#### ✅ MISTRAL_API_KEY (CONFIGURÉ)
- **Nom:** `MISTRAL_API_KEY`
- **Valeur:** `NxSdm98MjsiKIGUq7Nmwa5ErPVPxam8j`
- **Statut:** ✅ Déjà configuré dans Supabase
- **Usage:**
  - Génération d'embeddings (modèle `mistral-embed`)
  - Génération de réponses (modèle `mistral-large-latest`)

### Note: Variables automatiques
Les variables `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont automatiquement injectées par Supabase.

## 📡 URL de l'Edge Function

**Production:**
```
https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/recherche-contrats
```

## 🔧 Utilisation depuis le frontend

### Exemple de requête

```typescript
const response = await fetch(
  'https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/recherche-contrats',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
    },
    body: JSON.stringify({
      query: 'Quelles sont les garanties hospitalisation ?',
      client_id: '8f01a952-cd2a-4089-9138-2249833c67ab', // Optionnel
      client_code: 'G0001', // Optionnel
      top_k: 5, // Nombre de chunks à récupérer (défaut: 5)
    }),
  }
);

// Lecture du streaming
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  const lines = text.split('\\n').filter(line => line.trim());

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data.text); // Afficher le texte au fur et à mesure
    }
  }
}
```

## 🎯 Fonctionnalités implémentées

### ✅ Authentification
- JWT vérifié automatiquement par Supabase
- Utilisateur récupéré depuis le token

### ✅ Génération d'embeddings
- API Mistral Embed (`mistral-embed`)
- Génération d'embedding pour la question de l'utilisateur

### ✅ Recherche vectorielle
- Similarité cosinus avec pgvector
- Filtres optionnels par `client_id` ou `client_code`
- Exclusion des documents supprimés (`is_deleted = false`)
- Top K résultats configurable

### ✅ Génération de réponse
- Mistral Large Latest (modèle le plus performant de Mistral)
- Streaming en temps réel (SSE)
- Contexte construit depuis les chunks trouvés
- Citations des sources dans la réponse
- Température 0.3 pour des réponses factuelles

### ✅ CORS
- Headers CORS configurés pour autoriser les requêtes depuis le frontend

## 📊 Structure de la réponse

### Format des événements SSE
```
data: {"text": "Selon le document 1, les garanties..."}

data: {"text": " hospitalisation incluent..."}

data: {"text": " une chambre particulière."}
```

## 🐛 Debug

### Voir les logs de l'Edge Function
```bash
# Via CLI Supabase
supabase functions logs recherche-contrats --project-ref syxsacbciqwrahjdixuc

# Ou dans le dashboard
https://supabase.com/dashboard/project/syxsacbciqwrahjdixuc/logs/edge-functions
```

### Tester l'Edge Function
```bash
curl -X POST \
  https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/recherche-contrats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "Quelles sont les garanties ?",
    "top_k": 3
  }'
```

## 🚀 Intégration Frontend

### Hook React créé : `useChatWithEdgeFunction`

Un hook spécialisé a été créé dans `src/hooks/useChatWithEdgeFunction.ts` pour gérer :
- L'authentification via Supabase
- Les appels à l'Edge Function avec streaming SSE
- La gestion des conversations
- Le filtrage par client (optionnel)

### Configuration dans ChatContrats

Le composant `ChatContrats.tsx` a été mis à jour pour utiliser l'Edge Function :

```typescript
const chatConfig: ChatConfig = {
  title: 'Contrats Clients',
  description: 'Posez vos questions sur les contrats et garanties',
  serviceType: 'rag_contrats',
  icon: FileText,
  iconBgColor: '#407b85',
  placeholder: 'Posez votre question sur les contrats...',
  suggestions: CHAT_SUGGESTIONS.contrats,
  emptyStateMessage: 'Commencez une conversation',
  // Utiliser l'Edge Function au lieu du webhook n8n
  useEdgeFunction: true,
  topK: 5, // Nombre de chunks à récupérer
  // clientId et clientCode peuvent être ajoutés dynamiquement si nécessaire
};
```

### Filtrage par client (optionnel)

Pour filtrer les documents par client, ajoutez simplement les props `clientId` ou `clientCode` à la config :

```typescript
const chatConfig: ChatConfig = {
  // ... autres props
  useEdgeFunction: true,
  clientId: '8f01a952-cd2a-4089-9138-2249833c67ab', // UUID du client
  // OU
  clientCode: 'G0001', // Code client
  topK: 5,
};
```

## 🚀 Prochaines étapes

1. ✅ ~~Configurer les secrets dans Supabase Dashboard~~ → **À FAIRE MAINTENANT**
2. ✅ ~~Mettre à jour le frontend (`ChatContrats.tsx`)~~ → **FAIT**
3. 🧪 Tester avec une vraie question
4. 📈 Optimiser les prompts si nécessaire

## 📝 Notes techniques

### Recherche vectorielle
- Utilise l'opérateur `<=>` de pgvector pour la distance cosinus
- `1 - distance` = similarité (0 à 1)
- Plus la valeur est proche de 1, plus c'est similaire

### Filtrage par client
- Métadonnées JSONB indexées
- Filtre sur `metadata->>'client_id'` ou `metadata->>'client_code'`
- Permet d'isoler les documents d'un client spécifique

### Modèles utilisés
- **Embeddings:** Mistral Embed (1024 dimensions)
- **LLM:** Mistral Large Latest (32k context)

### Coûts estimés (par requête)
- Mistral Embed: ~$0.0001
- Mistral Large Latest: ~$0.004 (selon longueur réponse)
- **Total:** ~$0.005 par requête (2x moins cher qu'avec Claude !)
