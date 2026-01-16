# walteraRagIngestionVersionFinale

**ID**: `w5vLjSzwN1EAe1JD`
**Statut**: ✅ Actif
**Créé le**: 06/12/2025
**Dernière mise à jour**: 15/01/2026

---

## 📋 Description

Workflow d'ingestion RAG (Retrieval-Augmented Generation) qui scanne le NAS Synology, extrait le contenu des documents et les indexe dans Supabase Vector Store pour la recherche sémantique.

---

## 🎯 Objectif

Automatiser l'ingestion de documents depuis le NAS WALTERA vers la base vectorielle Supabase, en :
- Scannant récursivement les dossiers clients
- Extrayant le texte avec Apache Tika
- Classifiant les documents par type
- Enrichissant avec les métadonnées clients et IDCC
- Vectorisant avec Mistral Embeddings
- Détectant les modifications et orphelins

---

## 🔄 Triggers

### 1. **Manual Start** (Manuel)
- Déclenchement manuel pour tests ou re-synchronisation complète

### 2. **Schedule Trigger** (Programmé)
- **Fréquence**: Tous les jours à 2h du matin
- **Objectif**: Synchronisation automatique quotidienne

---

## 🏗️ Architecture du Workflow

### Phase 1 : Configuration et Authentification

#### **Node: Configuration**
```javascript
const CONFIG = {
  nas: {
    baseUrl: 'https://waltera.synology.me:5001',
    clientsPath: '//volume1/PORTEFEUILLE'
  },
  supabase: {
    url: 'https://syxsacbciqwrahjdixuc.supabase.co',
    serviceKey: '...'
  },
  processing: {
    batchSize: 20,
    supportedFormats: ['.pdf', '.txt', '.doc', '.docx']
  }
}
```

#### **Node: Synology Auth**
- Authentifie l'accès au NAS Synology
- Récupère un `sid` (Session ID)
- Compte utilisé : `Gared`

---

### Phase 2 : Scan du NAS

#### **Node: Scan NAS Recursive**

**Fonctionnalités** :
- Scan récursif jusqu'à 30 niveaux de profondeur
- Limite de 10 000 items par dossier
- Support de 30+ formats de fichiers

**Classification des documents** :
- `ccn` : Conventions collectives (mots-clés : ccn, idcc, convention, collective)
- `contractuel` : Contrats, avenants, conditions générales
- `financier` : Factures, cotisations, bordereaux
- `commercial` : Devis, offres, tarifs
- `paie` : Bulletins de paie, DSN
- `administratif` : RIB, KBIS, courriers
- `sinistre` : Déclarations, arrêts de travail
- `juridique` : Contentieux, litiges
- `technique` : Procédures, guides
- `autre` : Non classifié

**Extraction des métadonnées** :
```javascript
{
  id: "path_mtime_hash",
  file_id_stable: "stable_path_hash",
  path: "/PORTEFEUILLE/1 - Clients/G0001_ALTESSE/...",
  name: "contrat.pdf",
  ext: "pdf",
  size: 1024000,
  modified: "2025-01-15T10:00:00Z",
  client: "G0001_ALTESSE",
  category: "Clients",
  documentType: "contractuel",
  folder: "/PORTEFEUILLE/1 - Clients/G0001_ALTESSE",
  depth: 3
}
```

---

### Phase 3 : Enrichissement Client et IDCC

#### **Node: Résolution Client + IDCC**

**Stratégie v3.0** :
- Extraction du code client `GXXXX` depuis le chemin
- Matching avec la table `clients` via la colonne `code`
- Enrichissement avec les IDCC liés au client

**Cache clients** :
- Chargement unique de tous les clients en mémoire
- Indexation par `code` (GXXXX)
- Évite les requêtes répétées

**Données enrichies** :
```javascript
{
  client: "ALTESSE",
  client_id: "uuid",
  client_code: "G0001",
  client_idcc: [1000, 1486],
  client_idcc_labels: ["IDCC 1000", "IDCC 1486"],
  client_status: "active",
  has_idcc: true
}
```

**Statuts possibles** :
- `active` : Client trouvé avec code
- `not_found` : Client non trouvé en base
- `code_not_found` : Code détecté mais inconnu
- `no_code_in_path` : Pas de code GXXXX dans le chemin

---

### Phase 4 : Détection des Modifications

#### **Node: Skip Already Processed**

**Stratégie de détection** :
1. Récupération des documents existants par `client_code`
2. Indexation par `file_path` avec tous les `document.id` associés
3. Comparaison `mtime` et `size` pour détecter les modifications
4. Suppression des orphelins (fichiers supprimés du NAS)

**Cas traités** :
- ✅ **Nouveau fichier** : Ingestion complète
- 🔄 **Fichier modifié** : Suppression anciens chunks + réingestion
- 🗑️ **Fichier orphelin** : Suppression de tous les chunks

**Filtres** :
- Taille min : 100 octets
- Taille max : 50 MB

---

### Phase 5 : Traitement par Batch

#### **Node: Loop Over Items**
- **Taille de batch** : 40 fichiers
- **Mode** : Sans reset (traitement séquentiel)

---

### Phase 6 : Téléchargement et Validation

#### **Node: Download file from NAS**
- Télécharge le fichier binaire depuis le NAS
- Utilise le `sid` d'authentification
- Timeout : 900 secondes (15 min)

#### **Node: Validate Downloaded Files**
- Vérifie la présence des données binaires
- Filtre les téléchargements échoués

#### **Node: Mise à jour nom et format fichier**
- Associe le MIME type correct selon l'extension
- Map de 30+ formats supportés

---

### Phase 7 : Extraction de Texte

#### **Node: HTTP to Tika**
- **Service** : Apache Tika (conteneur Docker)
- **URL** : `http://tika:9998/rmeta/text`
- **Format** : JSON
- **Timeout** : 600 secondes (10 min)

**Extraction** :
- Texte brut depuis PDF, DOCX, XLSX, etc.
- Support OCR pour PDF scannés
- Extraction de métadonnées (auteur, date création, etc.)

#### **Node: Code (Extraction + Fusion)**
- Filtre les ressources embarquées (images)
- Fusionne texte extrait + métadonnées originales
- Gère les cas sans texte extractible

#### **Node: Harmonize**
- Nettoyage Unicode et caractères spéciaux
- Validation JSON-safe
- Détection de PDF scannés sans texte
- Gestion des contenus trop courts (< 10 caractères)

---

### Phase 8 : Suppression avant Update

#### **Node: Delete before update**
- Supprime les anciens documents pour les fichiers modifiés
- Traite les `_existing_doc_ids` par batch de 50
- Évite les doublons dans la base vectorielle

---

### Phase 9 : Vectorisation et Stockage

#### **Node: Default Data Loader**
- Prépare le document pour l'ingestion
- Ajoute toutes les métadonnées (20+ champs)

**Métadonnées complètes** :
```javascript
{
  file_id, file_path, client_name, category, document_type,
  client_id, client_status, client_idcc, client_idcc_labels,
  has_idcc, source_type, ingestion_date, client_code,
  file_mtime, file_size
}
```

#### **Node: Embeddings Mistral Cloud**
- Modèle : `mistral-embed`
- Génère les vecteurs d'embedding pour la recherche sémantique

#### **Node: Supabase Vector Store**
- **Table** : `documents`
- **Mode** : Insert
- **Batch size** : 5 documents
- **RPC function** : `match_documents`
- Stocke contenu + embeddings + métadonnées

---

### Phase 10 : Notification

#### **Node: Compte avant envoi email**
- Vérifie que TOUS les fichiers sont traités
- Ne déclenche l'email que si `totalProcessed >= totalToProcess`

#### **Node: Send a message (Gmail)**
- **Destinataire** : jb@gared.fr
- **Sujet** : "WALTERA - Ingestion terminée"
- **Déclenchement** : Uniquement si traitement complet

---

## 📊 Statistiques et Logs

**Console logs** :
```
╔════════════════════════════════════════════════════════════════╗
║  RÉSOLUTION CLIENT + IDCC v3.0 (via code GXXXX)                ║
╚════════════════════════════════════════════════════════════════╝
📥 145 fichiers à enrichir

✅ 2549 clients chargés en cache
   Codes: G0001, G0002, G0003, G0004, G0005...

📊 STATISTIQUES:
   ✅ Résolus: 120
   ❌ Non résolus: 15
   ⚠️  Sans code: 10

⚠️  CODES INCONNUS (à ajouter dans Supabase):
   G9999, G8888
```

---

## 🔧 Configuration Technique

### Supabase
- **URL** : `https://syxsacbciqwrahjdixuc.supabase.co`
- **Table documents** : Stockage vectoriel avec pgvector
- **Table clients** : Référentiel clients avec IDCC

### NAS Synology
- **URL** : `https://waltera.synology.me:5001`
- **API** : SYNO.FileStation
- **Authentification** : Session-based (sid)

### Apache Tika
- **URL** : `http://tika:9998`
- **Mode** : Conteneur Docker interne

### Mistral AI
- **Modèle embedding** : `mistral-embed`
- **Dimension** : 1024

---

## 🚨 Gestion des Erreurs

### Cas gérés
1. **Téléchargement échoué** : Skip + log
2. **Extraction Tika échouée** : Skip + log
3. **Texte non extractible** : Placeholder `[Document scanné sans texte extractible]`
4. **Client non trouvé** : Marqué `client_status: not_found`
5. **Timeout NAS** : Retry automatique

### Limites
- Max 10 000 items par dossier (log warning)
- Profondeur max : 30 niveaux
- Taille fichier : 100 octets - 50 MB

---

## 📈 Performance

- **Batch size** : 40 fichiers en parallèle
- **Embedding batch** : 5 documents
- **Durée moyenne** : ~2-3 heures pour 5 000 documents
- **Taille base** : ~10 000 documents indexés

---

## 🔐 Sécurité

- Service Key Supabase en variable environnement
- Authentification NAS par session temporaire
- Validation des extensions de fichiers
- Filtrage des ressources embarquées

---

## 🔗 Intégrations

- **Supabase** : Stockage vectoriel
- **Synology NAS** : Source de documents
- **Apache Tika** : Extraction de texte
- **Mistral AI** : Génération d'embeddings
- **Gmail** : Notifications

---

## 📝 Notes Importantes

1. **Code client obligatoire** : Les dossiers doivent suivre le pattern `GXXXX_NOM`
2. **IDCC dynamiques** : Chaque client peut avoir plusieurs IDCC
3. **Détection incrémentale** : Seuls les fichiers nouveaux/modifiés sont traités
4. **Orphelins automatiques** : Suppression des documents dont le fichier source n'existe plus
5. **Classification robuste** : 9 types de documents + fallback "autre"

---

## 🛠️ Maintenance

### Ajouter un format de fichier
Modifier le node **Configuration** :
```javascript
supportedFormats: ['.pdf', '.txt', '.doc', '.docx', '.nouveau']
```

### Ajouter un type de document
Modifier le node **Scan NAS Recursive**, section `DOC_PATTERNS` :
```javascript
nouveau_type: {
  roots: ['mot1', 'mot2'],
  combos: [['combinaison', 'mots']],
  pathKeywords: ['dossier']
}
```

### Changer le dossier scanné
Modifier le node **Scan NAS Recursive**, variable `SCAN_PATH` :
```javascript
const SCAN_PATH = '/PORTEFEUILLE/1 - Clients'; // Tous les clients
const SCAN_PATH = '/PORTEFEUILLE/1 - Clients/G0001_ALTESSE'; // Un seul client
```

---

## 🎯 Roadmap

- [ ] Support des images (OCR avancé)
- [ ] Chunking intelligent par section
- [ ] Détection de doublons sémantiques
- [ ] Dashboard de monitoring en temps réel
- [ ] API REST pour ingestion manuelle
