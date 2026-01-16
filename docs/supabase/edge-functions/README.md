# Documentation Edge Functions Supabase WALTERA

Ce dossier contient la documentation complète de toutes les Edge Functions Supabase de l'application WALTERA.

---

## Table des Matieres

| # | Edge Function | Statut | Description | Documentation |
|---|--------------|--------|-------------|---------------|
| 01 | **recherche-contrats** | Production | RAG conversationnel pour recherche documentaire clients | [Voir](./recherche-contrats.md) |
| 02 | **recherche-ccn** | Production | RAG conversationnel pour recherche dans les CCN | [Voir](./recherche-ccn.md) |
| 03 | **import-ccn** | Production | Import et synchronisation des CCN depuis Legifrance | [Voir](./import-ccn.md) |
| 04 | **export-ccn** | Production | Export des CCN en format Markdown | [Voir](./export-ccn.md) |
| 05 | **analyze-ccn-compliance** | Production | Analyse IA de conformite CCN vs contrats | [Voir](./analyze-ccn-compliance.md) |
| 06 | **send-ccn-alerts-email** | Production | Envoi d'emails d'alertes CCN | [Voir](./send-ccn-alerts-email.md) |
| 07 | **send-otp-email** | Production | Envoi d'emails OTP pour authentification | [Voir](./send-otp-email.md) |

---

## 🎯 Architecture Edge Functions

### Pourquoi Edge Functions ?

Les Edge Functions Supabase ont remplacé les workflows n8n pour les agents conversationnels RAG. Cette migration apporte des avantages significatifs :

| Critère | Edge Functions | Workflows n8n |
|---------|---------------|---------------|
| **Latence** | ~875ms | ~2-5s |
| **Scalabilité** | Auto-scaling global | Limité au serveur |
| **Coût** | Inclus Supabase Pro | Serveur dédié Hostinger |
| **Maintenance** | Code TypeScript versionné | UI n8n + exports JSON |
| **Testing** | Tests unitaires natifs | Tests manuels |
| **Versioning** | Git natif | Export/Import JSON |
| **Streaming** | SSE natif | Émulation complexe |
| **Debugging** | Logs structurés + traces | Exécutions n8n |
| **Cold Start** | < 100ms | N/A |
| **Deployment** | CLI `supabase functions deploy` | UI n8n |

**Gain de performance** : **2-5x plus rapide** ⚡

---

## 🚀 Démarrage Rapide

### 1. Recherche Conversationnelle

Pour interroger les documents clients :

```bash
curl -X POST https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/recherche-contrats \
  -H "Authorization: Bearer ${USER_JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Quelles sont les garanties hospitalisation pour AMAHE ?",
    "history": []
  }'
```

**Réponse** : Stream SSE (Server-Sent Events)
```
data: {"text":"Les"}
data: {"text":" garanties"}
data: {"text":" hospitalisation"}
...
data: [DONE]
```

### 2. Question avec Historique

```bash
curl -X POST https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/recherche-contrats \
  -H "Authorization: Bearer ${USER_JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Et les franchises ?",
    "history": [
      {"role": "user", "content": "Garanties AMAHE ?"},
      {"role": "assistant", "content": "Pour AMAHE, les garanties incluent..."}
    ]
  }'
```

---

## 📊 Architecture Globale

### Flux de Données

```
┌─────────────────────────────────────────────────────────────┐
│                     SOURCES DE DONNÉES                       │
├─────────────────────────────────────────────────────────────┤
│ • NAS Synology (Documents clients)                          │
│ • API Légifrance (Conventions collectives)                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   WORKFLOWS D'INGESTION (n8n)                │
├─────────────────────────────────────────────────────────────┤
│ • walteraRagIngestionVersionFinale                          │
│ • walteraImportCcnVersionFinale                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              TRAITEMENT ET VECTORISATION                     │
├─────────────────────────────────────────────────────────────┤
│ • Apache Tika (Extraction texte)                            │
│ • Mistral Embeddings (Vectorisation)                        │
│ • Supabase Vector Store (Stockage)                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│               EDGE FUNCTIONS (7 fonctions)                   │
├─────────────────────────────────────────────────────────────┤
│ RECHERCHE (RAG + Streaming)                                 │
│ • recherche-contrats : Recherche docs clients               │
│ • recherche-ccn : Recherche conventions collectives         │
│                                                              │
│ CCN (Import/Export/Analyse)                                 │
│ • import-ccn : Import depuis API Legifrance                 │
│ • export-ccn : Export Markdown                              │
│ • analyze-ccn-compliance : Analyse conformite IA            │
│                                                              │
│ EMAILS (Resend)                                             │
│ • send-ccn-alerts-email : Alertes modifications CCN         │
│ • send-otp-email : Codes de verification                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      UTILISATEURS                            │
├─────────────────────────────────────────────────────────────┤
│ • Application React WALTERA                                 │
│ • API REST externe                                          │
│ • Webhooks                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Stack Technique

### Runtime
- **Deno** : JavaScript/TypeScript runtime sécurisé
- **Supabase Edge Runtime** : Plateforme d'hébergement global
- **Regions** : Auto-déployé dans toutes les régions Supabase

### LLM et Embeddings
- **Mistral AI** : `mistral-embed` (1024 dimensions), `mistral-large-latest`
- **Alternative** : OpenAI (pour futur)

### Base de Données
- **Supabase** : PostgreSQL + pgvector
- **Tables principales** : `documents`, `clients`, `client_codes`
- **RPC** : `match_documents`, `search_client`

### APIs Externes
- **Mistral AI** : Embeddings + Chat completion

---

## 📈 Métriques

### Performance Edge Functions

| Métrique | Valeur |
|----------|--------|
| **Cold Start** | ~50-100ms |
| **Authentication** | ~20ms |
| **Classification** | ~5ms |
| **Client Resolution** | ~50ms |
| **Embedding Generation** | ~200ms |
| **Vector Search** | ~100ms |
| **LLM First Token** | ~500ms |
| **Total (premier token)** | **~875ms** |

**Comparaison** :
- n8n workflows : 2-5 secondes
- **Gain** : 2-5x plus rapide ⚡

### Volumétrie
- **Requêtes/jour** : ~200-500
- **Latence P95** : < 2s
- **Taux d'erreur** : < 0.5%
- **Tokens/requête** : ~1000-2000 (Mistral)

---

## 🚨 Troubleshooting

### Edge Function ne répond pas

1. **Vérifier les logs** :
```bash
supabase functions logs recherche-contrats --tail
```

2. **Tester l'authentification** :
```bash
# Obtenir un token de test
curl -X POST https://syxsacbciqwrahjdixuc.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

3. **Vérifier les secrets** :
```bash
supabase secrets list
# Doit contenir: MISTRAL_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```

### Erreur "Non authentifié"

- Vérifier que le JWT est valide et non expiré
- Vérifier le header `Authorization: Bearer ${token}`
- Vérifier que l'utilisateur existe dans `auth.users`

### Erreur Mistral API

- Vérifier la clé API : `supabase secrets get MISTRAL_API_KEY`
- Vérifier les quotas Mistral : https://console.mistral.ai/
- Vérifier la connectivité réseau depuis Deno

### Aucun document trouvé

- Vérifier que les documents sont bien vectorisés : `SELECT COUNT(*) FROM documents;`
- Vérifier que le client existe : `SELECT * FROM clients WHERE name ILIKE '%CLIENT%';`
- Vérifier la RPC `match_documents` : `SELECT * FROM match_documents(...)`

---

## 🔐 Sécurité

### Authentification
- ✅ JWT requis (Supabase Auth)
- ✅ Vérification utilisateur via `getUser()`
- ✅ Service Role pour opérations admin

### Secrets Management
- ✅ Variables d'environnement via `supabase secrets`
- ✅ Jamais de clés dans le code
- ✅ Rotation régulière des clés API

### Row Level Security
- ✅ RLS activé sur `documents`
- ✅ Filtrage par `client_id`
- ✅ Pas d'accès cross-client

### Bonnes Pratiques
1. Timeout implicite (10 minutes max Deno)
2. Logs structurés pour debugging
3. Error handling robuste
4. Rate limiting (à implémenter)

---

## 🛠️ Développement Local

### Installation

```bash
# Installer Supabase CLI
brew install supabase/tap/supabase

# Se connecter
supabase login

# Link au projet
supabase link --project-ref syxsacbciqwrahjdixuc
```

### Développement

```bash
# Démarrer Supabase local
supabase start

# Servir la fonction en local
supabase functions serve recherche-contrats --env-file .env.local

# Tester en local
curl -X POST http://localhost:54321/functions/v1/recherche-contrats \
  -H "Authorization: Bearer ${LOCAL_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

### Deploiement

```bash
# Deployer une fonction specifique
supabase functions deploy recherche-contrats

# Deployer toutes les fonctions
supabase functions deploy recherche-contrats
supabase functions deploy recherche-ccn
supabase functions deploy import-ccn
supabase functions deploy export-ccn
supabase functions deploy analyze-ccn-compliance
supabase functions deploy send-ccn-alerts-email
supabase functions deploy send-otp-email

# Configurer les secrets
supabase secrets set MISTRAL_API_KEY=sk-xxx
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set LEGIFRANCE_CLIENT_ID=xxx
supabase secrets set LEGIFRANCE_CLIENT_SECRET=xxx

# Verifier le deploiement
supabase functions list
```

---

## 📝 Migration n8n → Edge Functions

### Workflows Migrés

| Workflow n8n | Edge Function | Statut | Gain |
|--------------|---------------|--------|------|
| walteraRagConsultationDocuments | recherche-contrats | ✅ Migré | Latence -70%, Coût -90% |

### Workflows Actifs (Prochaines Migrations Potentielles)

| Workflow n8n | Type | Statut | Priorité Migration |
|--------------|------|--------|-------------------|
| walteraRagConsultationCcnVersionFinale | Agent CCN (Mistral) | ✅ Actif | 🟡 Moyenne |
| CCN_Search_Tool | Agent CCN (OpenAI) | ✅ Actif | 🟡 Moyenne |

### Avantages de la Migration

1. **Performance** : 2-5x plus rapide
2. **Scalabilité** : Auto-scaling global
3. **Coût** : Pas de serveur n8n dédié
4. **Maintenance** : Code TypeScript versionné
5. **Testing** : Tests unitaires natifs
6. **Streaming** : SSE natif (pas d'émulation)

### Workflows à Migrer (Potentiel)

| Workflow n8n | Complexité | Priorité | Bénéfice |
|--------------|-----------|----------|----------|
| walteraRagIngestionVersionFinale | Haute | Basse | Moyenne (workflow batch OK pour n8n) |
| walteraImportCcnVersionFinale | Haute | Basse | Moyenne (CRON quotidien OK pour n8n) |
| walteraApiGamma | Moyenne | Moyenne | Haute (API externe, latence critique) |
| walteraAuditReseauClientsFinal | Moyenne | Basse | Faible (rapport ponctuel) |
| walteraAuditReseauTechniqueFinal | Moyenne | Basse | Faible (rapport ponctuel) |

**Recommandation** : Prioriser les workflows avec des besoins de latence faible et haute fréquence d'exécution.

---

## 🎯 Roadmap

### Q1 2026
- [x] Migration agents conversationnels (recherche-contrats)
- [ ] Monitoring avancé (traces, métriques)
- [ ] Tests automatisés (Deno tests)
- [ ] Cache Redis pour embeddings fréquents

### Q2 2026
- [ ] Migration API Gamma vers Edge Function
- [ ] Multi-langue (détection automatique)
- [ ] Rate limiting par utilisateur
- [ ] Analytics conversations

### Q3 2026
- [ ] Support audio/vidéo (transcription)
- [ ] Export conversations PDF
- [ ] Suggestions de questions
- [ ] Fine-tuning modèles

---

## 📞 Support

### Contacts
- **Email** : jb@gared.fr
- **Supabase Dashboard** : https://supabase.com/dashboard/project/syxsacbciqwrahjdixuc
- **Edge Functions** : https://supabase.com/dashboard/project/syxsacbciqwrahjdixuc/functions

### Ressources
- **Supabase Docs** : https://supabase.com/docs/guides/functions
- **Deno Docs** : https://deno.com/deploy/docs
- **Mistral AI Docs** : https://docs.mistral.ai
- **Edge Runtime** : https://edge-runtime.vercel.app/

---

## 📄 Licence

Documentation interne WALTERA - Tous droits réservés © 2025-2026

---

**Derniere mise a jour** : 16 janvier 2026
**Maintenue par** : Equipe Tech WALTERA
**Version** : 2.0.0
