# PROJET WALTERRA - Documentation Complète pour Claude Code

## Informations Générales

| Élément | Détail |
|---------|--------|
| **Client** | WALTERA |
| **Prestataire** | GARED |
| **Date de début** | 23 avril 2025 |
| **Budget total** | 11 000€ HT (9 350€ HT après réduction 15%) |
| **Facturation** | À la mise en production de chaque projet |

---

## Vue d'Ensemble des 3 Missions

| Mission | Description | Budget | Statut |
|---------|-------------|--------|--------|
| **Mission 1** | Audit réseau + Agent IA RAG | 3 000€ HT | En cours (audit terminé) |
| **Mission 2** | Intégration API CCN | 3 000€ HT | En cours |
| **Mission 3** | Tarificateur santé individuelle | 5 000€ HT | À venir |

---

## MISSION 1 : Audit Organisation Réseau et Intégration Agent IA

### Budget : 3 000€ HT

### Livrables

1. **Audit de l'arborescence réseau** ✅ TERMINÉ
   - Cartographie simplifiée du réseau
   - Axes d'optimisation identifiés
   - Rapport d'audit généré automatiquement

2. **Création base de données vectorielle (Supabase)** 🔄 EN COURS
   - Extension pgvector activée
   - Tables créées : `documents`, `document_metadata`, `sync_log`
   - Fonction de recherche vectorielle `match_documents()`

3. **Automatisation de l'intégration documents** 🔄 EN COURS
   - Workflow n8n d'ingestion depuis le NAS Synology
   - Synchronisation initiale + synchronisation récurrente quotidienne
   - Classification automatique des documents

4. **Agent IA personnalisé** ⏳ À FAIRE
   - Interface dédiée pour interroger la base documentaire
   - Recherche sémantique dans les documents clients

5. **Tests et documentation technique** ⏳ À FAIRE

### Infrastructure Technique

#### NAS Synology
```
URL: https://waltera.synology.me:5001
Répertoire racine: /volume1/PORTEFEUILLE
Dossier clients: /volume1/PORTEFEUILLE/1 - Clients
Volume total: ~5 Go de documents
```

#### Supabase
```
Project ID: syxsacbciqwrahjdixuc
URL: https://syxsacbciqwrahjdixuc.supabase.co
Extension: pgvector (embeddings 1536 dimensions)
```

#### Structure des Tables Supabase (Mission 1)

```sql
-- Table principale documents avec embeddings
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des métadonnées enrichies
CREATE TABLE document_metadata (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  client_name TEXT,
  client_id UUID REFERENCES clients(id),  -- Lien vers table clients
  document_type TEXT,  -- 'contractuel', 'ccn', 'financier', 'administratif', 'autre'
  file_size BIGINT,
  mime_type TEXT,
  last_modified TIMESTAMP,
  checksum TEXT,
  processing_status TEXT DEFAULT 'pending',
  idcc TEXT,  -- Pour les documents CCN
  kali_id TEXT,  -- ID Légifrance
  source_type TEXT DEFAULT 'nas',  -- 'nas' ou 'ccn'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table de suivi des synchronisations
CREATE TABLE sync_log (
  id SERIAL PRIMARY KEY,
  sync_start TIMESTAMP DEFAULT NOW(),
  sync_end TIMESTAMP,
  files_processed INTEGER DEFAULT 0,
  files_added INTEGER DEFAULT 0,
  files_updated INTEGER DEFAULT 0,
  files_failed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running',
  error_details JSONB
);

-- Fonction de recherche vectorielle
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 10,
  filter_client TEXT DEFAULT NULL,
  filter_type TEXT DEFAULT NULL
) RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
);
```

#### Workflow n8n - Ingestion NAS

**Nom du workflow:** `WALTERA RAG - Ingestion NAS`

**Étapes du workflow:**
1. Manual Trigger / Schedule Trigger
2. Configuration (paramètres NAS, Supabase, OpenAI)
3. Synology Auth (authentification API FileStation)
4. Scan NAS Recursive (scan récursif du répertoire PORTEFEUILLE)
5. Résolution Client + IDCC (extraction métadonnées depuis chemin)
6. Skip Already Processed (vérification checksum)
7. Download file from NAS
8. Validate Downloaded Files
9. Default Data Loader (extraction contenu)
10. Recursive Character Text Splitter (chunking)
11. OpenAI Embeddings (génération embeddings)
12. Supabase Vector Store (stockage)
13. Loop Over Items (itération sur les fichiers)
14. Email de rapport (notification fin de traitement)

**Formats supportés:** PDF, TXT, DOC, DOCX, XLS, XLSX, CSV

**Classification automatique des documents:**
- `contractuel` : fichiers contenant "contrat" ou "accord"
- `ccn` : fichiers contenant "CCN" ou "convention"
- `financier` : fichiers contenant "facture"
- `autre` : par défaut

---

## MISSION 2 : Intégration API CCN (Conventions Collectives Nationales)

### Budget : 3 000€ HT

### Livrables

1. **Recherche et paramétrage API CCN** ✅ TERMINÉ
   - API Légifrance via PISTE (OAuth2 Client Credentials)
   - Credentials configurés dans n8n

2. **Création agent IA pour comparaison CCN/documents clients** ⏳ À FAIRE
   - Analyse d'impact des modifications CCN sur les contrats
   - Détection automatique des clauses impactées

3. **Génération d'alertes email** ⏳ À FAIRE
   - Notifications détaillées sur les mises à jour à appliquer
   - Ciblage par client et IDCC

4. **Tests et documentation technique** ⏳ À FAIRE

### Architecture des Données CCN

#### Tables Clients et IDCC

```sql
-- Référentiel clients WALTERA
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  siren TEXT,
  siret TEXT,
  external_key TEXT UNIQUE,  -- slug basé sur le nom
  status TEXT DEFAULT 'client',  -- 'client', 'prospect', 'inactive'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Référentiel IDCC
CREATE TABLE idcc_ref (
  idcc TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Liaison client <-> IDCC (relation N-N)
CREATE TABLE client_idcc (
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  idcc TEXT REFERENCES idcc_ref(idcc) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'manual',
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (client_id, idcc)
);

-- Vue des IDCC actifs (pour les workflows)
CREATE VIEW v_idcc_active AS 
SELECT DISTINCT idcc FROM client_idcc WHERE idcc IN (
  SELECT idcc FROM idcc_ref WHERE active = true
);

-- Vue clients par IDCC  
CREATE VIEW v_idcc_clients AS
SELECT ir.idcc, ir.label, c.name as client_name, c.id as client_id
FROM idcc_ref ir
JOIN client_idcc ci ON ci.idcc = ir.idcc  
JOIN clients c ON c.id = ci.client_id;
```

#### Tables CCN (schéma dédié)

```sql
-- Schéma dédié CCN
CREATE SCHEMA IF NOT EXISTS ccn;

-- Table de surveillance des IDCC
CREATE TABLE ccn.watchlist (
  idcc TEXT PRIMARY KEY,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des textes CCN
CREATE TABLE ccn.texts (
  id BIGSERIAL PRIMARY KEY,
  idcc TEXT NOT NULL,
  kali_id TEXT NOT NULL UNIQUE,  -- ID texte KALI (ex. KALITEXT...)
  text_type TEXT,  -- 'TEXTE_BASE', 'AVENANT', 'ARRETE_EXTENSION'
  title TEXT,
  content TEXT,
  date_publication DATE,
  legal_status TEXT,
  hash_content TEXT,  -- Pour détecter les modifications
  embedding VECTOR(1536),  -- Pour recherche sémantique
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des modifications CCN (changelog)
CREATE TABLE ccn.changes (
  id BIGSERIAL PRIMARY KEY,
  idcc TEXT NOT NULL,
  kali_id TEXT NOT NULL,
  change_type TEXT,  -- 'NEW', 'MODIFIED', 'ABROGATED'
  change_date TIMESTAMPTZ DEFAULT NOW(),
  previous_hash TEXT,
  new_hash TEXT,
  details JSONB
);
```

### Données Clients/IDCC

**Statistiques:**
- 23+ clients (clients + prospects)
- 15 IDCC uniques
- Certains clients ont plusieurs IDCC (ex: FINARE)

**Exemples d'IDCC:**
- 1486 : Bureaux d'études techniques Syntec
- 2098 : Commerces de gros
- Et 13 autres...

### API Légifrance (PISTE)

**Authentification:** OAuth2 Client Credentials
**Mode:** Production (après test en Sandbox)

**Endpoints utilisés:**
- `/list/conventions` : Liste des conventions par IDCC
- `/list/boccTexts` : Textes publiés au BOCC (pour veille)
- `/consult/{kali_id}` : Contenu intégral d'un texte

### Workflows n8n Mission 2

#### Workflow 1 : Import Initial CCN

**Objectif:** Récupérer l'intégralité des textes initiaux pour tous les IDCC surveillés

**Étapes:**
1. Manual Trigger
2. GET `v_idcc_active` (liste des IDCC à importer)
3. Split In Batches (traitement par lot)
4. POST `/list/conventions` (récupérer liste textes par IDCC)
5. Pagination (si plus de 200 résultats)
6. Pour chaque texte: GET `/consult/{kali_id}`
7. Génération embeddings
8. UPSERT dans `ccn.texts`
9. Log des opérations

**Paramètres Légifrance:**
```json
{
  "pageSize": 200,
  "pageNumber": 1,
  "idcc": "1486",
  "textesBase": ["TEXTE_BASE"],
  "legalStatus": ["VIGUEUR", "VIGUEUR_DIFF", "ABROGE"],
  "sort": "DATE_PUBLI_DESC"
}
```

#### Workflow 2 : CRON Veille CCN

**Objectif:** Récupérer quotidiennement les modifications des CCN

**Fréquence:** Tous les jours à 06h30 (Europe/Paris)

**Étapes:**
1. Cron Trigger (06:30 daily)
2. GET `v_idcc_active`
3. Calcul fenêtre temporelle (J-8 → J)
4. POST `/list/boccTexts` (textes publiés dans l'intervalle)
5. Filtrage nouveaux/modifiés (comparaison hash)
6. Pour chaque modification: GET `/consult/{kali_id}`
7. UPSERT `ccn.texts` + INSERT `ccn.changes`
8. Notification email/Slack si modifications détectées

**Paramètres pour veille:**
```json
{
  "pageSize": 200,
  "idccs": ["1486", "2098"],
  "searchForTextsBocc": true,
  "searchForGlobalBocc": false,
  "intervalPublication": "08/01/2025 > 15/01/2025",
  "sortValue": "BOCC_SORT_DESC"
}
```

### Intégration Mission 1 + Mission 2

**Architecture unifiée:**
- Même base Supabase pour RAG documents NAS et textes CCN
- Différenciation par métadonnées `source_type`: `'nas'` ou `'ccn'`
- Agent IA capable de croiser les deux sources

**Métadonnées documents CCN:**
```json
{
  "source": "ccn_legifrance",
  "source_type": "ccn",
  "document_type": "ccn",
  "idcc": "1486",
  "kali_id": "KALITEXT000047546789",
  "text_type": "TEXTE_BASE",
  "clients_impacted": ["AMAHE", "CHECK POINT SOFTWARE", "..."]
}
```

**Cas d'usage agent IA unifié:**
- "Quels impacts de cette modification CCN sur les contrats du client AMAHE ?"
- "Trouve les clauses liées aux congés dans les documents de CLIENT_X"
- "Compare les obligations de la CCN 1486 avec le contrat signé"

---

## MISSION 3 : Tarificateur Santé Individuelle

### Budget : 5 000€ HT

### Livrables

1. **Paramétrage du tarif sur interface** ⏳ À FAIRE
   - Calcul dynamique des cotisations
   - Interface web ou formulaire

2. **Suivi des demandes** ⏳ À FAIRE
   - Intégration Google Sheets pour suivi

3. **Intégration éditique** ⏳ À FAIRE
   - Génération d'offres au format PDF
   - Templates personnalisés

4. **Envoi automatique par email** ⏳ À FAIRE
   - Workflow automatisé de communication

5. **Tests et documentation technique** ⏳ À FAIRE

### Spécifications Techniques (à définir)

Cette mission nécessite des précisions sur:
- Les critères de tarification (âge, situation familiale, niveau de couverture...)
- Les formules de calcul
- Les templates PDF à utiliser
- Les destinataires des emails

---

## Environnement Technique Global

### Stack Technologique

| Composant | Technologie | Usage |
|-----------|-------------|-------|
| Orchestration | n8n (auto-hébergé Hostinger) | Workflows automation |
| Base de données | Supabase (PostgreSQL + pgvector) | Stockage documents + embeddings |
| NAS | Synology (API FileStation) | Stockage fichiers sources |
| Embeddings | OpenAI text-embedding-3-small | Vectorisation documents |
| LLM | OpenAI GPT-4 | Agent conversationnel |
| API CCN | Légifrance (PISTE) | Données conventions collectives |

### Credentials à Configurer

```yaml
# n8n Credentials
- Synology NAS:
    URL: https://waltera.synology.me:5001
    Username: [CONFIDENTIEL]
    Password: [CONFIDENTIEL]

- Supabase:
    URL: https://syxsacbciqwrahjdixuc.supabase.co
    Service Role Key: [CONFIDENTIEL]

- OpenAI:
    API Key: [CONFIDENTIEL]

- Légifrance (OAuth2 Client Credentials):
    Token URL: [URL PISTE]
    Client ID: [CONFIDENTIEL]
    Client Secret: [CONFIDENTIEL]
```

### Fichiers de Configuration Disponibles

| Fichier | Description |
|---------|-------------|
| `walteraRagIngestionVersionFinale.json` | Workflow n8n complet pour ingestion NAS |
| `walteraAuditReseauClientsFinal.json` | Workflow n8n pour audit réseau |
| `legifranceResultats2.json` | Exemple de résultats API Légifrance |
| `actance.json` | Données de référence |
| `chatgpt.txt` | Historique conversation technique |
| `mission2Conversation1.txt` | Notes conversation Mission 2 |

---

## Points d'Attention et Recommandations

### Architecture RAG Unifiée

1. **Une seule base vectorielle** pour documents NAS et textes CCN
2. **Métadonnées différenciantes** pour filtrer par source
3. **ID client unique** (`client_id` UUID) pour lier documents et IDCC
4. **Checksums** pour détecter les modifications et éviter les doublons

### Bonnes Pratiques

1. **Chunking documents:**
   - Taille: 1000 tokens
   - Overlap: 200 tokens
   - Embeddings: OpenAI text-embedding-3-small (1536 dimensions)

2. **Synchronisation NAS:**
   - Synchronisation initiale complète
   - Puis synchronisation quotidienne incrémentale
   - Détection par checksum (MD5 du chemin + date modification)

3. **Veille CCN:**
   - Fenêtre glissante J-8 → J pour ne rien rater
   - Throttling 5-10 req/s vers Légifrance
   - Retry exponentiel sur erreurs 429/5xx

4. **Classification documents:**
   - Par nom de fichier + contenu
   - Types: contractuel, ccn, financier, administratif, autre
   - Extraction automatique du nom client depuis le chemin

### Prochaines Étapes Prioritaires

1. ✅ Terminer le workflow d'ingestion NAS
2. 🔄 Implémenter le workflow d'import initial CCN
3. 🔄 Créer le workflow CRON de veille CCN
4. ⏳ Développer l'agent IA unifié
5. ⏳ Créer l'interface de consultation
6. ⏳ Documenter et tester

---

## Contact et Support

**Projet:** WALTERA Automatisation IA
**Documentation mise à jour:** Janvier 2025
**Source:** Connaissances projet Claude.ai
