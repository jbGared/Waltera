# SOP - Conventions Collectives Nationales (CCN)

**Version** : 1.0.0
**Date de création** : 15 janvier 2026
**Dernière mise à jour** : 15 janvier 2026
**Statut** : En cours de développement
**Référent** : WALTERA / GARED

---

## Table des matières

1. [Contexte et objectifs](#1-contexte-et-objectifs)
2. [Architecture actuelle](#2-architecture-actuelle)
3. [Fonctionnalité 1 : Edge Function recherche-ccn](#3-fonctionnalité-1--edge-function-recherche-ccn)
4. [Fonctionnalité 2 : Système de notifications CCN](#4-fonctionnalité-2--système-de-notifications-ccn)
5. [Fonctionnalité 3 : Page de gestion CCN](#5-fonctionnalité-3--page-de-gestion-ccn)
6. [Fonctionnalité 4 : Export/Téléchargement CCN](#6-fonctionnalité-4--exporttéléchargement-ccn)
7. [Base de données](#7-base-de-données)
8. [Termes métier pour notifications](#8-termes-métier-pour-notifications)
9. [Sources de données officielles](#9-sources-de-données-officielles)
10. [Critères de validation](#10-critères-de-validation)
11. [Historique des modifications](#11-historique-des-modifications)

---

## 1. Contexte et objectifs

### 1.1 Contexte

WALTERA est un courtier en assurance spécialisé en mutuelles, prévoyance et retraite. Les conventions collectives nationales (CCN) sont essentielles pour :
- Définir les obligations des employeurs en matière de couverture santé et prévoyance
- Identifier les garanties minimales obligatoires pour chaque branche professionnelle
- Suivre les évolutions réglementaires impactant les contrats des clients

### 1.2 Problématique actuelle

Les workflows N8N existants (06 et 07) pour la consultation des CCN donnent des résultats peu précis et ne répondent pas aux attentes de qualité de WALTERA.

### 1.3 Objectifs

1. **Améliorer la qualité des réponses** du chatbot CCN via une nouvelle Edge Function
2. **Automatiser la veille réglementaire** avec un système de notifications intelligent
3. **Moderniser l'interface de gestion** des CCN pour faciliter l'administration
4. **Permettre l'export** des textes CCN en documents consolidés

---

## 2. Architecture actuelle

### 2.1 Workflows N8N existants

| Workflow | ID | Fonction | Statut |
|----------|-------|----------|--------|
| 05 - walteraImportCcnVersionFinale | `Pvs5uBlkgOhC8UOx` | Import quotidien des CCN depuis Légifrance | Actif |
| 06 - walteraRagConsultationCcnVersionFinale | `WPLcLN9YdY5T95ge` | Chatbot CCN (Mistral) | **À remplacer** |
| 07 - CCN_Search_Tool | `OC6aMLO0ejfGIt8n` | Chatbot CCN (OpenAI) | **À remplacer** |

### 2.2 Tables Supabase existantes

```sql
-- Schéma public
- clients          -- Référentiel clients WALTERA
- client_idcc      -- Liaison clients <-> IDCC (N-N)
- idcc_ref         -- Référentiel des IDCC actifs

-- Schéma ccn
- ccn.watchlist    -- IDCC surveillés
- ccn.texts        -- Textes CCN (obsolète, utiliser table ccn)
- ccn.changes      -- Changelog des modifications

-- Table principale CCN (schéma public)
- ccn              -- Documents CCN vectorisés (embeddings Mistral 1024 dim)
```

### 2.3 API externes

| API | Usage | Authentification |
|-----|-------|------------------|
| Légifrance (PISTE) | Récupération textes CCN | OAuth2 Client Credentials |
| Mistral AI | Embeddings + LLM | API Key |

---

## 3. Fonctionnalité 1 : Edge Function recherche-ccn

### 3.1 Objectif

Créer une Edge Function Supabase `recherche-ccn` pour remplacer les workflows N8N 06 et 07, en s'inspirant de l'Edge Function `recherche-contrats` existante.

### 3.2 Spécifications fonctionnelles

#### 3.2.1 Entrées

```typescript
interface SearchCCNRequest {
  query: string;              // Question de l'utilisateur
  idcc?: string;              // Code IDCC (optionnel, ex: "1486")
  top_k?: number;             // Nombre de résultats (défaut: 15)
  history?: Message[];        // Historique conversationnel
  response_length?: 'short' | 'medium' | 'long';
}
```

#### 3.2.2 Flux de traitement

```
1. Authentification JWT Supabase
2. Classification LLM de la requête
   ├── general_question → Réponse directe
   ├── idcc_identification → Identification de la CCN
   └── ccn_search → Pipeline RAG
3. Identification IDCC (si non fourni)
   ├── Depuis la question (ex: "CCN des avocats")
   └── Depuis l'historique conversationnel
4. Génération embedding (Mistral Embed)
5. Recherche vectorielle avec filtre IDCC
6. Application de la hiérarchie juridique
7. Génération réponse (Mistral Large)
8. Streaming SSE
```

#### 3.2.3 Hiérarchie juridique des textes

**RÈGLE CRITIQUE** : Les textes doivent être triés et présentés selon leur priorité juridique.

| Priorité | Type | Description | Poids |
|----------|------|-------------|-------|
| P1 | ARRETE_EXTENSION | Arrêtés rendant obligatoire, étendant | 1 (plus haute) |
| P1 | ARRETE_AGREMENT | Arrêtés d'agrément | 1 |
| P2 | AVENANT | Modifications du texte de base | 2 |
| P3 | ACCORD_SALAIRES | Accords salariaux | 3 |
| P3 | ACCORD_PREVOYANCE | Accords prévoyance | 3 |
| P3 | ACCORD_FORMATION | Accords formation | 3 |
| P3 | ACCORD_RETRAITE | Accords retraite | 3 |
| P4 | ANNEXE | Classifications, grilles | 4 |
| P5 | TEXTE_BASE | Convention collective originale | 5 (plus basse) |

#### 3.2.4 États juridiques valides

Seuls les textes avec ces états doivent être considérés comme en vigueur :

- `VIGUEUR` : En vigueur
- `VIGUEUR_ETEN` : En vigueur étendu
- `VIGUEUR_NON_ETEN` : En vigueur non étendu
- `VIGUEUR_DIFF` : En vigueur différé

Les textes `ABROGE` (abrogés) doivent être exclus ou signalés.

#### 3.2.5 System Prompt de référence

```markdown
# ASSISTANT EXPERT EN CONVENTIONS COLLECTIVES

Tu es un assistant juridique expert en droit du travail français,
spécialisé dans les conventions collectives nationales (CCN).

## RÈGLES DE PRIORITÉ DES TEXTES

Quand tu cites des informations, respecte TOUJOURS cette hiérarchie :
1. **Arrêtés d'extension** (P1) - Force obligatoire maximale
2. **Avenants** (P2) - Modifient le texte de base
3. **Accords thématiques** (P3) - Complètent sur des sujets précis
4. **Annexes** (P4) - Classifications et grilles
5. **Texte de base** (P5) - Convention originale

## RÈGLES DE VALIDITÉ

- Vérifie TOUJOURS l'état juridique du texte (VIGUEUR, VIGUEUR_ETEN...)
- Les textes ABROGE sont obsolètes et ne doivent PAS être cités
- Indique la date d'effet si disponible
- En cas de conflit, le texte de priorité supérieure l'emporte

## FORMAT DE RÉPONSE

1. Réponds de manière précise et sourcée
2. Cite le type de texte et sa priorité
3. Indique l'IDCC concerné
4. Mentionne la date du texte si pertinente
5. Fournis le lien Légifrance si disponible

## IMPORTANT

- Ne fabrique JAMAIS d'information juridique
- En cas de doute, indique-le clairement
- N'utilise JAMAIS d'emojis - reste professionnel
```

### 3.3 Spécifications techniques

#### 3.3.1 Fonction RPC Supabase

```sql
CREATE OR REPLACE FUNCTION match_ccn(
  query_embedding VECTOR(1024),
  filter JSONB DEFAULT '{}',
  match_count INT DEFAULT 15,
  match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ccn.id,
    ccn.content,
    ccn.metadata,
    1 - (ccn.embedding <=> query_embedding) AS similarity
  FROM ccn
  WHERE
    1 - (ccn.embedding <=> query_embedding) > match_threshold
    AND (filter->>'idcc' IS NULL OR ccn.metadata->>'idcc' = filter->>'idcc')
    AND (ccn.metadata->>'etat_juridique' IN ('VIGUEUR', 'VIGUEUR_ETEN', 'VIGUEUR_NON_ETEN', 'VIGUEUR_DIFF'))
  ORDER BY
    (ccn.metadata->>'priority')::INT ASC,  -- Priorité juridique
    similarity DESC                         -- Puis pertinence sémantique
  LIMIT match_count;
END;
$$;
```

#### 3.3.2 Fichiers à créer

```
supabase/functions/recherche-ccn/
├── index.ts          # Edge Function principale
└── README.md         # Documentation
```

### 3.4 Critères d'acceptation

- [ ] Streaming SSE fonctionnel
- [ ] Classification LLM des requêtes
- [ ] Identification automatique de l'IDCC depuis la question
- [ ] Respect de la hiérarchie juridique dans les résultats
- [ ] Filtrage par état juridique (exclure ABROGE)
- [ ] Latence P50 < 1.5s
- [ ] Latence P95 < 3s
- [ ] Tests avec les 3 cas de la documentation (voir section Tests)

---

## 4. Fonctionnalité 2 : Système de notifications CCN

### 4.1 Objectif

Alerter WALTERA par email lorsqu'une modification de CCN impacte potentiellement les contrats de leurs clients.

### 4.2 Flux de détection et notification

```
┌─────────────────────────────────────────────────────────────────┐
│  WORKFLOW 05 - Import quotidien CCN (2h du matin)               │
│                                                                  │
│  1. Récupération des textes depuis Légifrance                   │
│  2. Détection des nouveaux textes / modifications               │
│  3. Stockage dans table ccn + ccn.changes                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  NOUVEAU - Analyse des modifications                             │
│                                                                  │
│  Pour chaque modification dans ccn.changes :                    │
│                                                                  │
│  1. Identifier l'IDCC concerné                                  │
│  2. Récupérer les clients liés (via client_idcc)                │
│  3. Si clients impactés :                                       │
│     a. Analyser le contenu pour les termes métier               │
│     b. Si terme trouvé → marquer pour notification              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (si notification requise)
┌─────────────────────────────────────────────────────────────────┐
│  ANALYSE D'IMPACT APPROFONDIE                                    │
│                                                                  │
│  Pour chaque client impacté :                                   │
│                                                                  │
│  1. Récupérer ses documents contractuels (table documents)      │
│  2. Analyser via LLM si la modification CCN impacte :           │
│     - Les garanties du contrat                                  │
│     - La rédaction des documents contractuels                   │
│  3. Générer un résumé d'impact                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  GÉNÉRATION ET ENVOI NOTIFICATION                                │
│                                                                  │
│  Email contenant :                                              │
│  - CCN modifiée (IDCC + nom)                                    │
│  - Type de modification (nouveau texte, avenant...)             │
│  - Résumé du contenu modifié                                    │
│  - Termes métier détectés                                       │
│  - Liste des clients impactés                                   │
│  - Analyse d'impact sur les documents contractuels              │
│  - Lien vers le texte sur Légifrance                            │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Règles de déclenchement

#### 4.3.1 Détection des modifications (TOUTES)

Le système DOIT détecter TOUTES les modifications des CCN surveillées :
- Nouveaux textes (NEW)
- Textes modifiés (MODIFIED)
- Textes abrogés (ABROGATED)

Ces modifications sont stockées dans `ccn.changes` par le workflow 05.

#### 4.3.2 Filtrage pour notification (TERMES MÉTIER)

Une notification est envoyée UNIQUEMENT si :

1. **Condition 1** : La CCN modifiée est liée à au moins un client WALTERA (via `client_idcc`)
2. **Condition 2** : Le contenu de la modification contient AU MOINS UN terme de la liste métier (voir section 8)

### 4.4 Structure de la notification email

```markdown
# Alerte CCN - Modification détectée

## Convention collective concernée
- **IDCC** : 1486
- **Nom** : Bureaux d'études techniques (Syntec)
- **Type de modification** : Nouvel avenant
- **Date de publication** : 15/01/2026

## Résumé de la modification
[Résumé généré par LLM du contenu modifié]

## Termes métier détectés
- Prévoyance
- Garanties incapacité
- Taux de cotisation

## Clients WALTERA impactés

### Client : AMAHE (G0005)
**Analyse d'impact** :
- Impact potentiel sur le contrat prévoyance
- Vérifier les garanties incapacité dans les conditions générales
- [Recommandations]

### Client : CHECK POINT SOFTWARE (G0012)
**Analyse d'impact** :
- [Analyse spécifique]

## Actions recommandées
1. Vérifier les contrats des clients concernés
2. Contacter les clients si mise à jour nécessaire
3. Mettre à jour les documents contractuels si requis

## Lien vers le texte
[Consulter sur Légifrance](https://www.legifrance.gouv.fr/conv_coll/id/KALITEXT...)

---
Notification générée automatiquement par WALTERA IA
```

### 4.5 Spécifications techniques

#### 4.5.1 Nouvelle table pour le suivi des notifications

```sql
CREATE TABLE ccn.notifications (
  id BIGSERIAL PRIMARY KEY,
  change_id BIGINT REFERENCES ccn.changes(id),
  idcc TEXT NOT NULL,
  kali_id TEXT NOT NULL,
  detected_terms TEXT[],           -- Termes métier détectés
  impacted_clients JSONB,          -- [{client_id, client_name, impact_analysis}]
  notification_status TEXT DEFAULT 'pending',  -- pending, sent, failed
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.5.2 Options d'implémentation

**Option A : Extension du workflow N8N 05**
- Ajouter les étapes d'analyse et notification au workflow existant
- Avantage : Tout centralisé dans un workflow
- Inconvénient : Workflow plus complexe

**Option B : Edge Function dédiée**
- Créer une Edge Function `analyse-modifications-ccn`
- Déclenchée par le workflow 05 après import
- Avantage : Séparation des responsabilités
- Inconvénient : Coordination entre composants

**Option C : Trigger Supabase**
- Trigger sur INSERT dans `ccn.changes`
- Appelle une Edge Function pour l'analyse
- Avantage : Automatique et découplé
- Inconvénient : Latence potentielle

**Recommandation** : Option B (Edge Function dédiée)

### 4.6 Critères d'acceptation

- [ ] Détection de toutes les modifications CCN (NEW, MODIFIED, ABROGATED)
- [ ] Identification correcte des clients impactés via `client_idcc`
- [ ] Filtrage par les termes métier de la liste
- [ ] Analyse d'impact sur les documents contractuels des clients
- [ ] Email de notification formaté et envoyé
- [ ] Log de toutes les notifications (envoyées ou non)
- [ ] Pas de faux positifs (notifications inutiles)

---

## 5. Fonctionnalité 3 : Page de gestion CCN

### 5.1 Objectif

Refondre la page `/ccn/gestion` pour permettre à WALTERA de gérer facilement les CCN surveillées.

### 5.2 Maquette fonctionnelle

```
┌─────────────────────────────────────────────────────────────────┐
│  GESTION DES CONVENTIONS COLLECTIVES                    [+ Ajouter]
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Rechercher une CCN...                              [Filtres] ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ CCN ACTIVES (15) ─────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  ☑ 1486 - Bureaux d'études techniques (Syntec)              │ │
│  │    └ 3 clients liés | 523 textes | Dernière MAJ: 15/01/2026 │ │
│  │    [Voir] [Exporter] [Désactiver]                           │ │
│  │                                                              │ │
│  │  ☑ 2098 - Commerces de gros                                 │ │
│  │    └ 2 clients liés | 289 textes | Dernière MAJ: 15/01/2026 │ │
│  │    [Voir] [Exporter] [Désactiver]                           │ │
│  │                                                              │ │
│  │  ... (liste scrollable)                                     │ │
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ CATALOGUE COMPLET (1012 CCN disponibles) ─────────────────┐ │
│  │                                                              │ │
│  │  Source: Ministère du Travail (DARES) - Janvier 2026        │ │
│  │  [Actualiser le catalogue]                                  │ │
│  │                                                              │ │
│  │  ☐ 0016 - Transports routiers                               │ │
│  │  ☐ 0029 - Hospitalisation privée                            │ │
│  │  ☐ 0044 - Industries chimiques                              │ │
│  │  ...                                                         │ │
│  │                                                              │ │
│  │  [Importer les CCN sélectionnées] (0 sélectionnées)        │ │
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Spécifications fonctionnelles

#### 5.3.1 Section "CCN Actives"

Affiche les CCN actuellement dans la base Supabase (`idcc_ref` avec `active = true`).

**Informations affichées par CCN** :
- Code IDCC
- Libellé de la convention
- Nombre de clients liés (depuis `client_idcc`)
- Nombre de textes importés (depuis `ccn`)
- Date de dernière mise à jour

**Actions disponibles** :
- **Voir** : Ouvre la page de consultation CCN filtrée sur cet IDCC
- **Exporter** : Télécharge tous les textes de la CCN (voir Fonctionnalité 4)
- **Désactiver** : Désactive la surveillance de cette CCN

#### 5.3.2 Section "Catalogue complet"

Affiche toutes les CCN disponibles en France (non encore importées).

**Source des données** : Fichier officiel du Ministère du Travail
- URL : `https://travail-emploi.gouv.fr/sites/travail-emploi/files/2025-12/Dares_donnes_Identifiant_convention_collective_Janvier26.xlsx`
- Mise à jour : Mensuelle

**Fonctionnalités** :
- Recherche par IDCC ou libellé
- Filtres par type (branche professionnelle, agricole, etc.)
- Sélection multiple pour import groupé
- Bouton "Importer les CCN sélectionnées"

#### 5.3.3 Import de nouvelles CCN

L'import déclenche le workflow N8N 05 via webhook :

```bash
POST https://n8n.srv659987.hstgr.cloud/webhook/import-ccn
Content-Type: application/json

{
  "idcc_list": ["0016", "0029", "0044"],
  "user_email": "admin@waltera.fr"
}
```

**Feedback utilisateur** :
- Indicateur de progression pendant l'import
- Notification de fin d'import (succès/erreur)
- Mise à jour automatique de la liste "CCN Actives"

### 5.4 Spécifications techniques

#### 5.4.1 Nouvelle table pour le catalogue

```sql
CREATE TABLE ccn.catalogue (
  idcc TEXT PRIMARY KEY,
  libelle TEXT NOT NULL,
  type_branche TEXT,              -- 'travail', 'agricole', 'special'
  date_creation DATE,
  date_derniere_maj DATE,
  nb_entreprises_estimees INT,    -- Estimation du nombre d'entreprises
  source TEXT DEFAULT 'dares',
  imported BOOLEAN DEFAULT false, -- True si déjà dans idcc_ref
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5.4.2 Synchronisation du catalogue

Edge Function ou script pour mettre à jour le catalogue :

```typescript
// Pseudo-code
async function syncCatalogue() {
  // 1. Télécharger le fichier XLSX du Ministère
  const xlsxUrl = 'https://travail-emploi.gouv.fr/sites/travail-emploi/files/2025-12/Dares_donnes_Identifiant_convention_collective_Janvier26.xlsx';

  // 2. Parser le fichier
  const ccnList = parseXLSX(xlsxUrl);

  // 3. Upsert dans ccn.catalogue
  for (const ccn of ccnList) {
    await supabase.from('ccn.catalogue').upsert({
      idcc: ccn.idcc,
      libelle: ccn.libelle,
      // ...
    });
  }

  // 4. Marquer les CCN déjà importées
  await supabase.rpc('mark_imported_ccn');
}
```

#### 5.4.3 Pages et composants React

```
src/pages/ccn/
├── CCNGestion.tsx          # Page principale de gestion
├── components/
│   ├── CCNActiveList.tsx   # Liste des CCN actives
│   ├── CCNCatalogue.tsx    # Catalogue complet
│   ├── CCNImportModal.tsx  # Modal d'import
│   └── CCNExportButton.tsx # Bouton d'export
```

### 5.5 Design

**Exigences** :
- Design moderne, épuré, dans l'air du temps
- Interface claire et intuitive
- Cohérent avec le reste de l'application WALTERA
- Responsive (desktop prioritaire)

**Suggestions** :
- Utiliser les composants existants de l'application
- Cards pour chaque CCN avec actions au survol
- Skeleton loading pendant le chargement
- Toasts pour les notifications de succès/erreur

### 5.6 Critères d'acceptation

- [ ] Affichage des CCN actives avec statistiques
- [ ] Catalogue complet depuis la source officielle
- [ ] Recherche et filtrage fonctionnels
- [ ] Import de nouvelles CCN via workflow N8N
- [ ] Feedback utilisateur pendant l'import
- [ ] Design moderne et épuré
- [ ] Temps de chargement < 2s

---

## 6. Fonctionnalité 4 : Export/Téléchargement CCN

### 6.1 Objectif

Permettre de télécharger l'intégralité des textes d'une CCN fusionnés en un seul document.

### 6.2 Formats supportés

| Format | Priorité | Description |
|--------|----------|-------------|
| **PDF** | Haute | Format idéal, professionnel, imprimable |
| Markdown | Moyenne | Format texte structuré, facile à générer |

### 6.3 Structure du document exporté

```markdown
# Convention Collective Nationale
## IDCC 1486 - Bureaux d'études techniques (Syntec)

**Date d'export** : 15/01/2026
**Nombre de textes** : 523
**Source** : Légifrance via WALTERA

---

## Table des matières

1. Arrêtés d'extension (45 textes)
2. Avenants (123 textes)
3. Accords thématiques (112 textes)
4. Annexes (56 textes)
5. Texte de base (1 texte)

---

# 1. Arrêtés d'extension

## Arrêté du 12/03/2024 portant extension...

**ID** : KALITEXT000049123456
**État** : VIGUEUR
**Date de signature** : 12/03/2024
**Lien** : https://www.legifrance.gouv.fr/conv_coll/id/KALITEXT000049123456

[Contenu complet du texte...]

---

## Arrêté du 15/01/2024 portant extension...

[...]

---

# 2. Avenants

## Avenant n°45 du 15/01/2025 relatif aux salaires

[...]

---

# 3. Accords thématiques

[...]

---

# 4. Annexes

[...]

---

# 5. Texte de base

## Convention collective nationale des bureaux d'études techniques

[Contenu complet du texte de base...]

---

*Document généré par WALTERA - https://waltera.fr*
```

### 6.4 Spécifications techniques

#### 6.4.1 Edge Function `export-ccn`

```typescript
interface ExportCCNRequest {
  idcc: string;                    // Code IDCC
  format: 'pdf' | 'markdown';      // Format de sortie
  include_abrogated?: boolean;     // Inclure textes abrogés (défaut: false)
}

interface ExportCCNResponse {
  success: boolean;
  download_url: string;            // URL temporaire de téléchargement
  filename: string;                // Nom du fichier
  file_size: number;               // Taille en octets
  text_count: number;              // Nombre de textes inclus
}
```

#### 6.4.2 Génération PDF

Options techniques :
1. **Puppeteer/Playwright** : Conversion HTML → PDF (qualité maximale)
2. **PDFKit** : Génération native (léger, rapide)
3. **Service externe** : API de conversion (ex: DocRaptor, Gotenberg)

**Recommandation** : Gotenberg (auto-hébergé ou service) pour qualité et flexibilité.

#### 6.4.3 Stockage temporaire

Les fichiers générés sont stockés dans Supabase Storage :

```
storage/
└── ccn-exports/
    └── ccn_1486_20260115_abc123.pdf
```

- TTL : 24 heures (suppression automatique)
- Accès : URL signée temporaire

### 6.5 Critères d'acceptation

- [ ] Export Markdown fonctionnel
- [ ] Export PDF fonctionnel
- [ ] Structure respectant la hiérarchie juridique
- [ ] Table des matières générée automatiquement
- [ ] Métadonnées incluses (date export, nombre textes, source)
- [ ] Téléchargement via URL temporaire
- [ ] Temps de génération < 30s pour 500 textes

---

## 7. Base de données

### 7.1 Schéma complet

```sql
-- ═══════════════════════════════════════════════════════════════
-- SCHÉMA PUBLIC
-- ═══════════════════════════════════════════════════════════════

-- Référentiel clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,                -- G0001, G0002...
  siren TEXT,
  siret TEXT,
  external_key TEXT UNIQUE,
  status TEXT DEFAULT 'client',    -- 'client', 'prospect', 'inactive'
  idcc TEXT[],                     -- Liste des IDCC (dénormalisé)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Référentiel IDCC actifs
CREATE TABLE idcc_ref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idcc TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  kalicont_id TEXT,                -- ID conteneur Légifrance
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Liaison clients <-> IDCC (N-N)
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

-- Documents CCN vectorisés
CREATE TABLE ccn (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  embedding VECTOR(1024),          -- Mistral Embed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_ccn_idcc ON ccn ((metadata->>'idcc'));
CREATE INDEX idx_ccn_kali_id ON ccn ((metadata->>'kali_id'));
CREATE INDEX idx_ccn_priority ON ccn ((metadata->>'priority'));
CREATE INDEX idx_ccn_embedding ON ccn USING ivfflat (embedding vector_cosine_ops);

-- ═══════════════════════════════════════════════════════════════
-- SCHÉMA CCN
-- ═══════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS ccn;

-- Catalogue complet des CCN (source DARES)
CREATE TABLE ccn.catalogue (
  idcc TEXT PRIMARY KEY,
  libelle TEXT NOT NULL,
  type_branche TEXT,               -- 'travail', 'agricole', 'special'
  date_creation DATE,
  nb_entreprises_estimees INT,
  source TEXT DEFAULT 'dares',
  imported BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Changelog des modifications
CREATE TABLE ccn.changes (
  id BIGSERIAL PRIMARY KEY,
  idcc TEXT NOT NULL,
  kali_id TEXT NOT NULL,
  change_type TEXT,                -- 'NEW', 'MODIFIED', 'ABROGATED'
  change_date TIMESTAMPTZ DEFAULT NOW(),
  previous_hash TEXT,
  new_hash TEXT,
  details JSONB
);

-- Notifications générées
CREATE TABLE ccn.notifications (
  id BIGSERIAL PRIMARY KEY,
  change_id BIGINT REFERENCES ccn.changes(id),
  idcc TEXT NOT NULL,
  kali_id TEXT NOT NULL,
  detected_terms TEXT[],
  impacted_clients JSONB,
  notification_status TEXT DEFAULT 'pending',
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- FONCTIONS RPC
-- ═══════════════════════════════════════════════════════════════

-- Recherche vectorielle CCN avec hiérarchie juridique
CREATE OR REPLACE FUNCTION match_ccn(
  query_embedding VECTOR(1024),
  filter JSONB DEFAULT '{}',
  match_count INT DEFAULT 15,
  match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.content,
    c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM ccn c
  WHERE
    1 - (c.embedding <=> query_embedding) > match_threshold
    AND (filter->>'idcc' IS NULL OR c.metadata->>'idcc' = filter->>'idcc')
    AND (c.metadata->>'etat_juridique' IS NULL
         OR c.metadata->>'etat_juridique' IN ('VIGUEUR', 'VIGUEUR_ETEN', 'VIGUEUR_NON_ETEN', 'VIGUEUR_DIFF'))
  ORDER BY
    COALESCE((c.metadata->>'priority')::INT, 5) ASC,
    similarity DESC
  LIMIT match_count;
END;
$$;

-- Vérification des kali_id existants (pour éviter doublons)
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

### 7.2 Métadonnées des documents CCN

```typescript
interface CCNMetadata {
  // Identification
  source: 'ccn_legifrance';
  document_type: 'ccn';
  idcc: string;                    // "1486"
  kali_id: string;                 // "KALITEXT000049123456"

  // Classification
  type_text: string;               // "TEXTE_BASE", "AVENANT", "ARRETE_EXTENSION"...
  priority: number;                // 1-5 (hiérarchie juridique)
  nature: string;                  // "convention", "accord", "arrete"

  // Informations juridiques
  titre: string;
  etat_juridique: string;          // "VIGUEUR", "ABROGE"...
  date_signature?: string;
  date_publication?: string;
  date_debut?: string;
  date_fin?: string;

  // Liens
  url_legifrance: string;

  // Technique
  is_chunked: boolean;
  chunk_index: number;
  total_chunks: number;
  hash_content: string;
  imported_at: string;
}
```

---

## 8. Termes métier pour notifications

### 8.1 Liste complète des termes

Les notifications sont déclenchées si le contenu de la modification CCN contient AU MOINS UN de ces termes :

#### Santé et Mutuelle
- Mutuelle
- Assurance santé
- Complémentaire santé
- Frais de santé
- Régime Frais de santé
- 100% santé
- Couverture
- Couverture obligatoire / facultative

#### Prévoyance
- Prévoyance
- Régimes de prévoyance
- Garanties incapacité, invalidité et décès
- Maladie
- Accident de travail
- Maladie, maternité, accident du travail
- Indemnisation des absences
- Maintien du salaire brut
- Maintien rémunération
- IJSS + RP
- Incapacité
- Invalidité

#### Garanties et prestations
- Garantie
- Garanties
- Remboursement
- Prestations
- Rentes
- Rente éducation
- Rente conjoint
- Rente de conjoint
- Rente temporaire
- Rente viagère
- Rente de survie handicap
- Double effet
- Frais d'obsèques

#### Cotisations et financement
- Cotisation
- Taux
- Répartition
- Répartition employeur / salarié
- Assiette
- PMSS
- Plafond mensuel de la Sécurité sociale
- Plancher
- Plafond
- Exonération

#### Structure et organisation
- Conventionnement
- Socle conventionnel
- Délai de carence
- Dispenses
- Portabilité
- Bénéficiaires
- Ayant droit
- Isolé
- Famille
- Conjoint
- Enfant à charge
- Gratuité à partir xx enfant
- Option / Optionnelle
- Facultatif / obligatoire

#### Organismes et gestion
- Organismes assureurs
- Recommandés
- Co recommandés
- Organisme
- Gestionnaire
- Collectif / collective

#### Catégories de personnel
- Personnel affilié à l'AGIRC
- Personnel non affilié à l'AGIRC
- Tranche 1
- Tranche 2
- Tranche A
- Tranche B
- Tranche C
- 1° / 2° / 3° catégorie
- Ancienneté

#### Hospitalisation et soins
- Chirurgicaux et d'hospitalisation
- Frais de séjour en hospitalisation médicale ou chirurgicale
- Honoraires
- La chambre particulière (y compris la maternité)
- Le lit d'accompagnant
- Forfait journalier d'hospitalisation
- Maternité

#### Soins courants
- Soins
- Soins médicaux et pharmacie
- Soins médicaux courants
- Actes de pratique médicale courante
- Consultations, visites
- Auxiliaires médicaux
- Actes d'imagerie hors échographie
- Actes d'échographie, Doppler
- Analyses, laboratoires
- Transport du malade
- Pharmacie
- Frais de soins

#### Optique
- Monture et verres
- Chirurgie réfractive
- Lentilles prises en charge ou non par la sécurité sociale

#### Dentaire
- Soins et prothèses dentaires
- L'orthodontie
- Les implants dentaires
- Parodontologie

#### Audiologie
- Audiologie
- Prothèses auditives

#### Médecine douce et prévention
- Médecine douce
- Ostéopathe, chiropracteur, homéopathe, diététicien, étiopathe, naturopathe, acupuncteur, psychomotricité
- Prévention
- Sevrage tabagique
- Vaccin
- Actions prévention

#### Retraite
- Retraite complémentaire

#### Bases de remboursement
- Base de remboursement BR
- SS : Sécurité sociale
- OPTAM / Non Optam
- OPTAM-CO / Non Optam-CO
- DPTAM / non DPTAM
- Conventionné / non conventionné
- Tableau des garanties

#### Spécificités régionales
- Alsace-Moselle / régime local

#### Solidarité
- HDS : Haut degré de solidarité / degré élevé de solidarité
- Fonds mutualisé de solidarité
- Conformément à la loi, 2 % des cotisations des régimes conventionnels de prévoyance et de frais de santé sont affectés aux prestations à caractère non directement contributif

#### Autres
- Salaire de référence
- Salaire mensuel
- Brut / net

### 8.2 Implémentation technique

```typescript
const TERMES_METIER: string[] = [
  // Liste complète ci-dessus
  'mutuelle',
  'assurance santé',
  'prévoyance',
  // ...
];

function containsTermeMetier(content: string): { found: boolean; terms: string[] } {
  const contentLower = content.toLowerCase();
  const foundTerms = TERMES_METIER.filter(terme =>
    contentLower.includes(terme.toLowerCase())
  );

  return {
    found: foundTerms.length > 0,
    terms: foundTerms
  };
}
```

---

## 9. Sources de données officielles

### 9.1 Catalogue des CCN

| Source | URL | Format | Mise à jour |
|--------|-----|--------|-------------|
| **Ministère du Travail (DARES)** | [Fichier XLSX](https://travail-emploi.gouv.fr/sites/travail-emploi/files/2025-12/Dares_donnes_Identifiant_convention_collective_Janvier26.xlsx) | XLSX | Mensuelle |
| Légifrance | [Liste IDCC](https://www.legifrance.gouv.fr/liste/idcc?init=true) | Web | Continue |

### 9.2 Textes des CCN

| Source | API | Authentification |
|--------|-----|------------------|
| **Légifrance (PISTE)** | REST API | OAuth2 Client Credentials |

**Endpoints principaux** :
- `POST /search` : Recherche de textes par IDCC
- `POST /consult/kaliText` : Consultation d'un texte unitaire
- `POST /consult/kaliCont` : Consultation d'un conteneur CCN

### 9.3 Statistiques

- **~1012 IDCC** référencés (Ministère du Travail)
- **~421 CCN** nationales et locales actives
- **80% des entreprises** couvertes par ~50 CCN principales

---

## 10. Critères de validation

### 10.1 Tests fonctionnels

#### Edge Function recherche-ccn

| Test | Entrée | Sortie attendue |
|------|--------|-----------------|
| Question simple | "Salaires dans la CCN des avocats" | Identification IDCC 1000, résultats triés par priorité |
| IDCC explicite | "Indemnités licenciement IDCC 1486" | Filtrage sur IDCC 1486 |
| Hiérarchie | "Congés payés Syntec" | Arrêtés P1 avant Texte de base P5 |
| État juridique | Requête quelconque | Pas de textes ABROGE dans les résultats |

#### Système de notifications

| Test | Scénario | Notification attendue |
|------|----------|----------------------|
| Terme présent | Modification avec "prévoyance" | Oui |
| Terme absent | Modification sans terme métier | Non |
| Client lié | Modification CCN avec client | Oui (si terme présent) |
| Pas de client | Modification CCN sans client | Non |

#### Page de gestion

| Test | Action | Résultat attendu |
|------|--------|------------------|
| Chargement | Accès à /ccn/gestion | Liste CCN actives + catalogue |
| Recherche | "avocat" dans le catalogue | CCN 1000 affichée |
| Import | Sélection + import CCN | Workflow N8N déclenché |
| Export | Clic sur "Exporter" | Téléchargement PDF/MD |

### 10.2 Tests de performance

| Métrique | Cible | Critique |
|----------|-------|----------|
| Latence recherche CCN P50 | < 1.5s | < 3s |
| Latence recherche CCN P95 | < 3s | < 5s |
| Temps génération export | < 30s | < 60s |
| Temps chargement page gestion | < 2s | < 5s |

### 10.3 Tests de sécurité

- [ ] Authentification JWT requise pour toutes les Edge Functions
- [ ] Pas d'exposition de clés API dans le code client
- [ ] Validation des entrées utilisateur (IDCC, query)
- [ ] Rate limiting sur les endpoints publics

---

## 11. Historique des modifications

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| 1.0.0 | 15/01/2026 | GARED | Création initiale du document |

---

## Annexes

### A. Références documentaires

- [Documentation workflow 05](/docs/n8n/05-walteraImportCcnVersionFinale.md)
- [Documentation workflow 06](/docs/n8n/06-walteraRagConsultationCcnVersionFinale.md)
- [Documentation workflow 07](/docs/n8n/07-CCN_Search_Tool.md)
- [Edge Function recherche-contrats](/supabase/functions/recherche-contrats/README.md)

### B. Contacts

- **Client** : WALTERA
- **Prestataire** : GARED
- **Support technique** : [À définir]

---

*Document généré pour servir de référence au développement des fonctionnalités CCN de WALTERA.*
