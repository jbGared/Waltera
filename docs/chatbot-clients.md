# Chatbot Contrats Clients avec Streaming

## Vue d'ensemble

Le chatbot Contrats Clients permet d'interroger les données clients via une interface conversationnelle avec support du streaming en temps réel. Cette fonctionnalité remplace l'ancien système de chat et apporte le streaming des réponses pour une meilleure expérience utilisateur.

## Caractéristiques principales

### 1. Streaming en temps réel
- Les réponses sont affichées progressivement au fur et à mesure de leur génération
- Utilise Server-Sent Events (SSE) pour une expérience fluide
- Support de l'annulation de requête si nécessaire

### 2. Historique des conversations
- Toutes les conversations sont sauvegardées dans Supabase
- Possibilité de reprendre une conversation précédente
- Recherche dans l'historique des conversations
- Gestion de conversations multiples en parallèle

### 3. Interface utilisateur
- Design style WhatsApp avec sidebar de conversations
- Suggestions de questions pour démarrer
- Indicateurs de chargement et d'état
- Auto-scroll vers les nouveaux messages

## Architecture technique

### Composants principaux

#### 1. `ChatContrats.tsx` (Page)
Point d'entrée de la fonctionnalité, configure le chatbot avec :
- Titre : "Consultation Contrats Clients"
- Icône 📋 et couleur bleue
- Suggestions de questions sur les contrats
- URL du webhook n8n avec streaming

#### 2. `ChatBaseStreaming.tsx` (Composant)
Composant réutilisable qui gère :
- L'affichage de la conversation
- La sidebar avec l'historique
- Le champ de saisie et l'envoi de messages

#### 3. `useChatWithStreaming.ts` (Hook)
Hook custom qui gère :
- La communication avec le webhook n8n en streaming
- La création et mise à jour des conversations dans Supabase
- La gestion de l'état des messages
- Le chargement de l'historique

### Flux de données

```
User Input → useChatWithStreaming → Webhook n8n (streaming)
                ↓                          ↓
         Supabase (save)        Stream Response (chunks)
                                           ↓
                                   Update UI (real-time)
```

## Configuration

### Webhook n8n

URL : `https://n8n.srv659987.hstgr.cloud/webhook-test/walteraAiAgent`

**Format de la requête :**
```json
{
  "query": "Votre question",
  "sessionId": "recherche_clients-1234567890-abc123"
}
```

**Format de la réponse :**
- Streaming texte (Server-Sent Events)
- Encodage UTF-8
- Chunks de données envoyés progressivement

### Base de données Supabase

#### Table `conversations`
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  session_id TEXT UNIQUE,
  service_type service_type, -- 'recherche_clients'
  status conversation_status,
  messages JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### Migration du type de service

Pour activer le service de recherche clients, exécutez cette migration :

```sql
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'recherche_clients';
```

**Important :** Cette migration doit être appliquée manuellement dans la console Supabase ou via `supabase db push` avec Docker en cours d'exécution.

## Utilisation

### Accès à la page
Route : `/chat/contrats`
Card Dashboard : "Contrats Clients"

### Démarrer une conversation
1. Cliquer sur "Nouveau" dans la sidebar
2. Saisir une question ou cliquer sur une suggestion
3. La réponse s'affiche progressivement en streaming

### Reprendre une conversation
1. Cliquer sur une conversation dans la sidebar
2. L'historique complet se charge
3. Continuer la conversation

### Suggestions de questions

Les suggestions par défaut incluent :
- "Quelles sont les garanties de ce contrat ?"
- "Y a-t-il des exclusions particulières ?"
- "Quelle est la franchise applicable ?"
- "Comparer avec un autre contrat"

## Développement

### Ajouter de nouvelles suggestions

Modifier `/src/constants/index.ts` :
```typescript
export const CHAT_SUGGESTIONS = {
  contrats: [
    "Nouvelle suggestion...",
    // ... autres suggestions
  ]
};
```

### Modifier l'apparence

Le composant utilise les classes Tailwind avec la couleur bleue pour les contrats.

Pour personnaliser :
- Icône : modifier la prop `icon` dans `ChatContrats.tsx`
- Couleurs : modifier `iconBgColor` dans `ChatContrats.tsx`
- Couleurs globales : modifier les classes dans `ChatBaseStreaming.tsx`

### Debugging

Activer les logs de développement :
```typescript
// Dans useChatWithStreaming.ts
console.log('[useChatWithStreaming] État:', {
  conversationId,
  messagesCount: messages.length,
  isLoading
});
```

## Limitations connues

1. **Streaming uniquement** : Le hook ne supporte pas les réponses non-streaming
2. **Pas de retry automatique** : En cas d'erreur, l'utilisateur doit renvoyer manuellement
3. **Pas de typing indicators** : Pas d'indicateur "L'assistant est en train d'écrire..."
4. **Docker requis** : Pour appliquer les migrations localement

## Améliorations futures

- [ ] Support du markdown riche dans les réponses
- [ ] Export de conversations en PDF
- [ ] Partage de conversations
- [ ] Réactions aux messages
- [ ] Pièces jointes
- [ ] Commandes slash (/search, /history, etc.)
- [ ] Mode vocal (Speech-to-Text)

## Maintenance

### Vérifier les logs
```bash
# Logs Supabase
supabase logs --db-logs

# Logs n8n
# Accéder à l'interface n8n et consulter les exécutions
```

### Nettoyer les vieilles conversations
```sql
UPDATE conversations
SET status = 'archived'
WHERE updated_at < NOW() - INTERVAL '90 days'
  AND service_type = 'recherche_clients';
```

## Support

Pour toute question ou problème, consulter :
- Documentation Supabase : https://supabase.com/docs
- Documentation n8n : https://docs.n8n.io
- Issues GitHub du projet
