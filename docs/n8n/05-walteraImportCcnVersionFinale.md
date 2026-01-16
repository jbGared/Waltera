# walteraImportCcnVersionFinale

**ID**: `Pvs5uBlkgOhC8UOx`
**Statut**: ✅ Actif
**Créé le**: 10/12/2025
**Dernière mise à jour**: 15/01/2026

---

## 📋 Description

Workflow d'importation automatique des Conventions Collectives Nationales (CCN) depuis l'API Légifrance. Récupère, traite et vectorise les textes juridiques pour la recherche sémantique.

---

## 🎯 Objectif

Automatiser l'import et la mise à jour des CCN pour :
- Récupérer les textes en vigueur depuis Légifrance
- Extraire et nettoyer le contenu juridique
- Classer par priorité juridique (arrêtés > avenants > accords)
- Vectoriser avec Mistral Embeddings
- Stocker dans Supabase pour consultation RAG
- Gérer les mises à jour incrémentales

---

## 🔄 Triggers

### 1. **Webhook** (HTTP POST)
- **Path de production** : `/webhook/import-ccn`
- **Path de test** : `/webhook-test/import-ccn`
- **Méthode** : POST

**Format de la requête** :
```json
{
  "body": {
    "idcc_list": ["1000", "1486", "2098"],
    "user_email": "user@waltera.fr"
  }
}
```

### 2. **Manual Start** (Manuel)
- Pour imports manuels ou tests

### 3. **Schedule Trigger** (Programmé)
- **Fréquence** : Tous les jours à 2h du matin
- **Objectif** : Synchronisation automatique des CCN actives

---

## 🏗️ Architecture du Workflow

### Phase 1 : Préparation des IDCC

#### **Node: importCcn (Webhook)**
- Reçoit la liste des IDCC à importer
- Déclenche le workflow d'import

#### **Node: Code in JavaScript1**
- Parse la requête webhook
- Crée un item par IDCC

#### **Node: Légifrance - Consult KaliCont**
- **API** : Légifrance (OAuth2)
- **Endpoint** : `/consult/kaliCont`
- **Fonction** : Récupère le conteneur KALICONT de chaque IDCC
- **Batch** : 3 requêtes simultanées

#### **Node: Code in JavaScript**
- Parse les résultats KALICONT
- Extrait les métadonnées de base

---

### Phase 2 : Récupération des IDCC Actifs

#### **Node: Get many rows (Supabase)**
- **Table** : `idcc_ref`
- **Filtre** : `active = TRUE`
- **Données** : Liste des IDCC actifs à synchroniser

#### **Node: Filter IDCC avec KALICONT**
- Filtre les IDCC qui ont un `kalicont_id`
- Exclut les IDCC incomplets

---

### Phase 3 : Import des Textes de Base

#### **Node: Filtrer Textes Base Déjà Importés**
- Vérifie si le KALICONT est déjà en base
- Évite les doublons

#### **Node: Légifrance - Consult KaliCont1**
- Récupère le contenu complet du conteneur
- **API** : `/consult/kaliCont`
- **Batch** : 3 requêtes simultanées
- **Retry** : Automatique en cas d'échec

#### **Node: Traiter Texte de Base**
- Extrait le contenu textuel du conteneur
- Nettoie le HTML
- Crée les métadonnées
- Chunking si texte > 5000 caractères

**Métadonnées ajoutées** :
```javascript
{
  source: "ccn_legifrance",
  document_type: "ccn",
  idcc: "1000",
  kali_id: "KALICONT000005635407",
  titre: "Convention collective nationale des avocats",
  type_text: "TEXTE_BASE",
  priority: 5,
  nature: "convention",
  etat_juridique: "VIGUEUR",
  url_legifrance: "https://www.legifrance.gouv.fr/conv_coll/id/...",
  is_chunked: false,
  chunk_index: 0,
  total_chunks: 1,
  imported_at: "2025-01-15T10:00:00Z"
}
```

---

### Phase 4 : Import des Textes Attachés

#### **Node: Batch IDCC (15 par lot)**
- Traite les IDCC par batch de 15
- Gestion de la pagination

#### **Node: Légifrance - recuperationToken**
- Récupère le token OAuth2 Légifrance
- **Client ID** : `5daafd37-bc9b-43ee-8442-d69a8802b2ce`
- **Scope** : `openid`

#### **Node: Légifrance - List Conventions1**
- Recherche tous les textes d'une CCN
- **Pagination** : 100 textes par page
- **Filtres** : VIGUEUR, VIGUEUR_ETEN, VIGUEUR_NON_ETEN, VIGUEUR_DIFF

**Code de recherche** :
```javascript
{
  "fond": "KALI",
  "recherche": {
    "champs": [{
      "typeChamp": "IDCC",
      "criteres": [{
        "valeur": "1000",
        "typeRecherche": "TOUS_LES_MOTS_DANS_UN_CHAMP"
      }]
    }],
    "filtres": [{
      "facette": "LEGAL_STATUS",
      "valeurs": ["VIGUEUR", "VIGUEUR_ETEN"]
    }],
    "sort": "KALI_ID",
    "pageSize": 100
  }
}
```

**Gestion de la pagination** :
- Détection automatique du nombre total de résultats
- Loop sur toutes les pages
- Logs de progression

---

### Phase 5 : Classification et Filtrage

#### **Node: Normaliser Réponse**
- Classe les textes par type et priorité juridique

**Hiérarchie juridique** :
1. **Arrêtés** (P1) : Rendent obligatoire, étendent
   - ARRETE_EXTENSION
   - ARRETE_AGREMENT
2. **Avenants** (P2) : Modifient le texte de base
3. **Accords** (P3) : Compléments thématiques
   - ACCORD_SALAIRES
   - ACCORD_PREVOYANCE
   - ACCORD_FORMATION
   - ACCORD_RETRAITE
4. **Annexes** (P4) : Classifications, grilles
5. **Texte de base** (P5) : Convention originale

**Filtre KALICONT** :
- Exclut les conteneurs entiers (KALICONT)
- Ne garde que les textes unitaires (KALITEXT, KALIARTI)

#### **Node: Filtrer Textes Déjà Importés**
- Vérifie si le `kali_id` existe déjà en base
- Utilise la fonction RPC `get_existing_kali_ids`
- Évite les doublons

---

### Phase 6 : Traitement du Contenu

#### **Node: Batch Textes (30 par lot)**
- Traite les textes par batch de 30
- Sans reset (traitement continu)

#### **Node: Légifrance - Consult Texte**
- Récupère le contenu complet de chaque texte
- **API** : `/consult/kaliText`
- **Batch** : 15 requêtes simultanées
- **Retry** : Automatique

#### **Node: Traiter Contenu**
- Extrait le contenu textuel (articles, sections)
- Nettoie le HTML
- Résout les IDCC avec zéros initiaux (0413 → "0413")
- Enrichit avec le label CCN depuis `idcc_ref`
- Calcule le hash du contenu
- Ajoute les dates (signature, publication, début, fin)

**Extraction du contenu** :
```javascript
function extractContent(consultResult) {
  // Articles
  if (consultResult.articles) {
    articles.forEach(art => {
      parts.push(`\n### Article ${art.num}\n`);
      parts.push(art.content);
    });
  }

  // Sections
  if (consultResult.sections) {
    sections.forEach(section => {
      parts.push(`\n## ${section.title}\n`);
      parts.push(section.content);
    });
  }

  return parts.join('\n\n');
}
```

---

### Phase 7 : Vectorisation et Stockage

#### **Node: Default Data Loader**
- Prépare le document pour l'ingestion
- Structure : `{ content, metadata }`

#### **Node: Embeddings Mistral Cloud**
- **Modèle** : `mistral-embed`
- **Batch size** : 5 documents
- Génère les vecteurs d'embedding

#### **Node: Supabase Vector Store**
- **Table** : `ccn`
- **Mode** : Insert
- **RPC function** : `match_ccn`
- Stocke contenu + embeddings + métadonnées

---

### Phase 8 : Finalisation

#### **Node: Respond to Webhook**
- Retourne le statut de l'import
- Nombre de textes importés
- Erreurs éventuelles

---

## 📊 Statistiques et Logs

**Console logs (Normalisation)** :
```
╔════════════════════════════════════════════════════════╗
║  NORMALISATION DES RÉSULTATS LÉGIFRANCE                ║
╚════════════════════════════════════════════════════════╝
📥 15 réponses API reçues

📋 IDCC 1000: 523 textes en vigueur
   🔴 P1 [ARRETE_EXTENSION] Arrêté du 12/03/2024...
   🟠 P2 [AVENANT] Avenant n°45 du 15/01/2025...
   🟡 P3 [ACCORD_SALAIRES] Accord salaires 2025...
   🟢 P4 [ANNEXE] Annexe I - Classifications...
   🔵 P5 [TEXTE_BASE] Convention collective nationale...

╔════════════════════════════════════════════════════════╗
║  RÉSUMÉ NORMALISATION                                  ║
╚════════════════════════════════════════════════════════╝

📊 Répartition par type:
   - ARRETE_EXTENSION: 45
   - AVENANT: 123
   - ACCORD: 78
   - ACCORD_SALAIRES: 34
   - ANNEXE: 56
   - TEXTE_BASE: 1

🎯 Répartition par priorité:
   P1 (Arrêtés): 45
   P2 (Avenants): 123
   P3 (Accords): 112
   P4 (Annexes): 56
   P5 (Texte de base): 1

✅ Total: 337 textes à traiter
```

**Logs pagination** :
```
📋 IDCC 1000: 523 textes total → 6 pages (pageSize=100)
   → Page 1/6: 100 textes
   → Page 2/6: 100 textes
   → Page 3/6: 100 textes
   → Page 4/6: 100 textes
   → Page 5/6: 100 textes
   → Page 6/6: 23 textes (total accumulé: 523)
   ✅ IDCC 1000: 523 textes récupérés sur 523 annoncés
```

---

## 🔧 Configuration Technique

### API Légifrance
- **Base URL** : `https://api.piste.gouv.fr/dila/legifrance/lf-engine-app`
- **OAuth URL** : `https://oauth.piste.gouv.fr/api/oauth/token`
- **Client ID** : `5daafd37-bc9b-43ee-8442-d69a8802b2ce`
- **Scope** : `openid`

### Endpoints utilisés
1. **POST /search** : Recherche de textes par IDCC
2. **POST /consult/kaliText** : Consultation d'un texte unitaire
3. **POST /consult/kaliCont** : Consultation d'un conteneur CCN

### Supabase
- **Table `ccn`** : Stockage vectoriel des textes
- **Table `idcc_ref`** : Référentiel des IDCC actifs
- **RPC `get_existing_kali_ids`** : Vérification des doublons
- **RPC `match_ccn`** : Recherche sémantique

### Mistral AI
- **Modèle** : `mistral-embed`
- **Dimension** : 1024
- **API Key** : `TU46gE1YmkB76sR6xtOBiiT59ZoFnind`

---

## 📝 Exemples d'Utilisation

### Exemple 1 : Import de Nouvelles CCN

**Requête** :
```bash
curl -X POST https://n8n.srv659987.hstgr.cloud/webhook/import-ccn \
  -H "Content-Type: application/json" \
  -d '{
    "idcc_list": ["1000", "1486", "2098"],
    "user_email": "admin@waltera.fr"
  }'
```

**Réponse** :
```json
{
  "status": "success",
  "imported": {
    "1000": 523,
    "1486": 412,
    "2098": 289
  },
  "total_texts": 1224,
  "duration_seconds": 450
}
```

### Exemple 2 : Import Programmé

- **Trigger** : Schedule (2h du matin)
- **Action** : Import de tous les IDCC actifs de la table `idcc_ref`
- **Durée** : ~30-60 minutes pour 50 IDCC

---

## 🚨 Gestion des Erreurs

### Cas d'erreurs possibles

1. **Token OAuth expiré**
   - Renouvellement automatique via `recuperationToken`

2. **IDCC sans textes**
   - Log + skip
   - IDCC reste actif dans `idcc_ref`

3. **Timeout API Légifrance**
   - Retry automatique (jusqu'à 3 tentatives)

4. **Texte sans contenu**
   - Placeholder : `[Contenu non extractible]`

5. **Quota API dépassé**
   - Erreur 429
   - Nécessite intervention manuelle

6. **IDCC avec zéro initial (0413)**
   - Gestion spécifique : force en string
   - Match avec `idcc_ref` via casting

---

## 🔐 Sécurité

### Points d'attention
- ✅ OAuth2 avec token temporaire
- ✅ Service Key Supabase en dur (à externaliser)
- ✅ API Key Mistral en dur (à externaliser)
- ✅ Validation des IDCC avant import

### Recommandations
1. Déplacer les clés API dans les credentials n8n
2. Implémenter un rate limiting
3. Logger les imports pour audit
4. Vérifier les quotas API avant import massif

---

## 📈 Performance

- **Temps par IDCC** : 30-60 secondes
- **Batch IDCC** : 15 simultanés
- **Batch textes** : 30 simultanés
- **Batch API Légifrance** : 15 requêtes
- **Embedding batch** : 5 documents
- **Import complet (50 IDCC)** : ~30-60 minutes

---

## 🔗 Intégrations

- **API Légifrance** : Source de données juridiques
- **Supabase** : Stockage vectoriel
- **Mistral AI** : Génération d'embeddings
- **Webhook** : Déclenchement externe

---

## 🛠️ Maintenance

### Ajouter un nouvel IDCC
1. Insérer dans `idcc_ref` :
```sql
INSERT INTO idcc_ref (idcc, label, active, kalicont_id)
VALUES ('3109', 'CCN des avocats salariés', true, 'KALICONT000005635407');
```
2. Déclencher l'import via webhook ou attendre le schedule

### Mettre à jour une CCN existante
- L'import incrémental détecte automatiquement les nouveaux textes
- Les textes existants ne sont pas réimportés (vérification par `kali_id`)

### Réimporter une CCN complète
1. Supprimer les textes de la CCN :
```sql
DELETE FROM ccn WHERE metadata->>'idcc' = '1000';
```
2. Relancer l'import via webhook

---

## 🎯 Améliorations Possibles

- [ ] Détection de changements (hash du contenu)
- [ ] Notification email en fin d'import
- [ ] Dashboard de suivi des imports
- [ ] Historique des versions de textes
- [ ] Export JSON des CCN importées
- [ ] API REST pour import unitaire
- [ ] Gestion des IDCC obsolètes (marquage automatique)
- [ ] Vérification de la complétude (tous les textes importés ?)

---

## 📞 Support

**Documentation API Légifrance** : https://api.piste.gouv.fr/dila/legifrance/lf-engine-app/
**Webhook URL** : `https://n8n.srv659987.hstgr.cloud/webhook/import-ccn`

---

## 📄 Tables Supabase

### Table `idcc_ref`
```sql
CREATE TABLE idcc_ref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idcc TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  kalicont_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table `ccn`
```sql
CREATE TABLE ccn (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  embedding VECTOR(1024),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ccn_idcc ON ccn ((metadata->>'idcc'));
CREATE INDEX idx_ccn_kali_id ON ccn ((metadata->>'kali_id'));
CREATE INDEX idx_ccn_embedding ON ccn USING ivfflat (embedding vector_cosine_ops);
```

### RPC `get_existing_kali_ids`
```sql
CREATE OR REPLACE FUNCTION get_existing_kali_ids(kali_ids TEXT[])
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT metadata->>'kali_id'
    FROM ccn
    WHERE metadata->>'kali_id' = ANY(kali_ids)
  );
END;
$$;
```
