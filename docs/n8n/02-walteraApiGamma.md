# walteraApiGamma

**ID**: `jcqumhvi8iHKnDqo`
**Statut**: ✅ Actif
**Créé le**: 24/09/2025
**Dernière mise à jour**: 15/01/2026

---

## 📋 Description

Workflow d'intégration avec l'API Gamma pour la génération automatique de présentations PowerPoint à partir de prompts textuels.

---

## 🎯 Objectif

Permettre la création automatisée de présentations professionnelles via l'API Gamma en :
- Recevant un prompt via webhook
- Déclenchant la génération d'une présentation
- Attendant la complétion du traitement
- Retournant le résultat final

---

## 🔄 Triggers

### 1. **Webhook** (HTTP POST)
- **Path de production** : `/webhook/promptGammaWaltera`
- **Path de test** : `/webhook-test/promptGammaWaltera`
- **Méthode** : POST
- **Response Mode** : Via node "Respond to Webhook"

**Format de la requête** :
```json
{
  "body": {
    "prompt": "Créer une présentation sur les avantages de la prévoyance collective"
  }
}
```

### 2. **Manual Trigger** (Manuel)
- Pour tests et exécutions manuelles

---

## 🏗️ Architecture du Workflow

### Phase 1 : Initialisation de la Génération

#### **Node: HTTP Request (Génération)**

**Configuration** :
- **Méthode** : POST
- **URL** : `https://public-api.gamma.app/v0.2/generations`
- **Authentication** : X-API-KEY

**Headers** :
```javascript
{
  "X-API-KEY": "sk-gamma-94UPAA6dGP1pcRpURiTK8dijnEKFm9YdYCpPOVY1rik"
}
```

**Body JSON** :
```json
{
  "imageOptions": {
    "source": "unsplash"
  },
  "inputText": "{{ $json.body.prompt }}",
  "textMode": "preserve",
  "format": "presentation",
  "numCards": 12,
  "exportAs": "pdf",
  "textOptions": {
    "tone": "professional",
    "audience": "customers",
    "language": "fr"
  }
}
```

**Paramètres clés** :
- `format`: `"presentation"` (présentation PowerPoint)
- `numCards`: `12` (nombre de slides)
- `exportAs`: `"pdf"` (format d'export)
- `textMode`: `"preserve"` (préserve le texte du prompt)
- `language`: `"fr"` (français)
- `tone`: `"professional"` (ton professionnel)
- `audience`: `"customers"` (audience cible)
- `imageOptions.source`: `"unsplash"` (images depuis Unsplash)

**Réponse** :
```json
{
  "generationId": "abc123def456",
  "status": "processing"
}
```

---

### Phase 2 : Attente de Complétion

#### **Node: Wait**
- **Durée** : 2 secondes
- **Type** : Wait node avec webhook ID
- Laisse le temps à Gamma de traiter la génération

---

### Phase 3 : Vérification du Statut

#### **Node: HTTP Request1 (Status Check)**

**Configuration** :
- **Méthode** : GET
- **URL** : `https://public-api.gamma.app/v0.2/generations/{{ $json.generationId }}`

**Headers** :
```javascript
{
  "X-API-KEY": "sk-gamma-94UPAA6dGP1pcRpURiTK8dijnEKFm9YdYCpPOVY1rik",
  "accept": "application/json"
}
```

**Réponse possible** :
```json
{
  "generationId": "abc123def456",
  "status": "completed",
  "downloadUrl": "https://gamma.app/download/abc123.pdf"
}
```

---

### Phase 4 : Condition de Complétion

#### **Node: If**

**Condition** :
```javascript
{{ $json.status }} equals "completed"
```

**Branchements** :
- ✅ **True** : Status = "completed" → Passe au node "Respond to Webhook"
- ❌ **False** : Status != "completed" → Retour au node "Wait"

**Comportement** :
- Loop jusqu'à ce que le status soit "completed"
- Vérifie toutes les 2 secondes

---

### Phase 5 : Réponse

#### **Node: Respond to Webhook**
- **Mode** : Retourne tous les items entrants
- **Status Code** : 200

**Réponse finale** :
```json
{
  "generationId": "abc123def456",
  "status": "completed",
  "downloadUrl": "https://gamma.app/download/abc123.pdf",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

---

## 📊 Flux de Données

```
Webhook (POST /promptGammaWaltera)
  ↓
[HTTP Request] → Initialise génération
  ↓
[Wait 2s]
  ↓
[HTTP Request1] → Check status
  ↓
[If] Status == "completed" ?
  ├─ Yes → [Respond to Webhook]
  └─ No → [Wait 2s] → Loop
```

---

## 🔧 Configuration Technique

### API Gamma
- **Base URL** : `https://public-api.gamma.app/v0.2`
- **API Key** : `sk-gamma-94UPAA6dGP1pcRpURiTK8dijnEKFm9YdYCpPOVY1rik`
- **Version** : v0.2

### Endpoints utilisés
1. **POST /generations** : Créer une nouvelle génération
2. **GET /generations/{generationId}** : Récupérer le statut

---

## 📝 Exemples d'Utilisation

### Exemple 1 : Génération Simple

**Requête** :
```bash
curl -X POST https://n8n.srv659987.hstgr.cloud/webhook/promptGammaWaltera \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Créer une présentation sur les avantages de la prévoyance collective pour les PME"
  }'
```

**Réponse** :
```json
{
  "generationId": "gen_abc123",
  "status": "completed",
  "downloadUrl": "https://gamma.app/docs/gen_abc123.pdf"
}
```

### Exemple 2 : Génération Thématique

**Requête** :
```json
{
  "prompt": "Présentation commerciale sur les garanties santé : hospitalisation, optique, dentaire. 12 slides avec exemples concrets et témoignages clients."
}
```

---

## ⚙️ Options Gamma Configurables

### Options d'Images
```json
{
  "imageOptions": {
    "source": "unsplash"  // ou "none", "custom"
  }
}
```

### Options de Texte
```json
{
  "textOptions": {
    "tone": "professional",     // ou "casual", "formal", "friendly"
    "audience": "customers",    // ou "investors", "employees", "general"
    "language": "fr"           // ou "en", "es", "de", etc.
  }
}
```

### Options de Format
- `format`: "presentation" (présentation) ou "document" (document)
- `numCards`: Nombre de slides (1-50)
- `exportAs`: "pdf", "pptx", "html"

---

## 🚨 Gestion des Erreurs

### Cas d'erreurs possibles

1. **API Key invalide**
   - Status : 401 Unauthorized
   - Action : Vérifier la clé API

2. **Timeout génération**
   - Si status reste "processing" > 5 minutes
   - Action : Loop infini (à améliorer avec max retries)

3. **Prompt vide**
   - Gamma retourne erreur
   - Action : Valider le prompt côté client

4. **Quota dépassé**
   - Status : 429 Too Many Requests
   - Action : Attendre ou upgrader le plan

---

## 🔐 Sécurité

### Points d'attention
- ⚠️ **API Key en clair** : Actuellement hardcodée dans le workflow
- ⚠️ **Webhook non authentifié** : Accessible publiquement

### Recommandations
1. Déplacer l'API Key dans les credentials n8n
2. Ajouter une authentification sur le webhook
3. Implémenter un rate limiting
4. Logger les appels pour audit

---

## 📈 Performance

- **Temps moyen de génération** : 30-60 secondes
- **Polling interval** : 2 secondes
- **Limite API Gamma** : Selon plan (vérifier quota)

---

## 🔗 Intégrations

- **Gamma API** : Génération de présentations
- **Unsplash** : Source d'images (via Gamma)
- **Webhook** : Déclenchement externe

---

## 🛠️ Maintenance

### Mettre à jour la clé API
1. Aller dans le node "HTTP Request"
2. Modifier le header `X-API-KEY`
3. Répéter pour "HTTP Request1"

### Changer le nombre de slides
Modifier dans le node "HTTP Request" :
```json
{
  "numCards": 20  // au lieu de 12
}
```

### Changer le format d'export
Modifier dans le node "HTTP Request" :
```json
{
  "exportAs": "pptx"  // au lieu de "pdf"
}
```

---

## 🎯 Améliorations Possibles

- [ ] Ajouter un compteur de retries max (éviter loop infini)
- [ ] Externaliser l'API Key dans les credentials
- [ ] Ajouter une authentification webhook
- [ ] Logger les générations dans Supabase
- [ ] Notification email en cas d'échec
- [ ] Support de templates Gamma personnalisés
- [ ] Validation du prompt avant envoi
- [ ] Cache des générations récentes

---

## 📞 Support

**Documentation API Gamma** : https://help.gamma.app/hc/en-us/articles/20693158901399-Public-API-

**Logs n8n** : Vérifier les exécutions dans l'interface n8n pour le debugging

---

## 📄 Webhook URLs

- **Production** : `https://n8n.srv659987.hstgr.cloud/webhook/promptGammaWaltera`
- **Test** : `https://n8n.srv659987.hstgr.cloud/webhook-test/promptGammaWaltera`
