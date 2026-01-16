# walteraAuditReseauClientsFinal

**ID**: `EPIlupw705qEdWXX`
**Statut**: ✅ Actif
**Créé le**: 24/09/2025
**Dernière mise à jour**: 15/01/2026

---

## 📋 Description

Workflow d'audit complet de l'arborescence réseau des dossiers clients sur le NAS Synology. Génère un rapport structuré avec analyse IA via Gamma pour identifier les incohérences et anomalies.

---

## 🎯 Objectif

Analyser automatiquement la structure des dossiers clients pour :
- Cartographier l'arborescence complète
- Identifier les fichiers orphelins ou mal classés
- Détecter les incohérences de nommage
- Générer un rapport d'audit avec recommandations
- Fournir une analyse IA via Gamma

---

## 🔄 Triggers

### 1. **Webhook** (HTTP)
- **Méthode** : GET/POST
- **Path** : À définir
- **Response Mode** : Via "Respond to Webhook"

### 2. **Manual Trigger** (Manuel)
- Pour lancer des audits manuels ou tests

---

## 🏗️ Architecture du Workflow

### Phase 1 : Authentification NAS

#### **Node: Login NAS**
- **Type** : HTTP Request
- **Méthode** : Authentification auprès du Synology NAS
- **Récupération** : Session ID (sid)
- **URL Base** : `https://waltera.synology.me:5001`

---

### Phase 2 : Liste des Partages

#### **Node: List Shares**
- **Type** : HTTP Request
- **API** : SYNO.FileStation.List
- **Objectif** : Récupérer la liste des partages réseau
- **Filtrage** : Recherche du partage "PORTEFEUILLE"

---

### Phase 3 : Filtrage PORTEFEUILLE

#### **Node: Split Shares**
- **Type** : Split Out
- **Action** : Divise les résultats en items individuels

#### **Node: Filter PORTEFEUILLE**
- **Type** : If
- **Condition** : `share.name === "PORTEFEUILLE"`
- **Objectif** : Isoler uniquement le partage des clients

---

### Phase 4 : Analyse de Structure

#### **Node: getDirectories**
- **Type** : Code (JavaScript)
- **Fonction** : Récupération récursive des dossiers
- **Analyse** :
  - Structure des dossiers clients
  - Profondeur d'arborescence
  - Conventions de nommage
  - Dossiers vides ou suspects

#### **Node: getFiles**
- **Type** : Code (JavaScript)
- **Fonction** : Inventaire des fichiers
- **Analyse** :
  - Types de fichiers (.pdf, .docx, .xlsx, etc.)
  - Tailles de fichiers
  - Dates de modification
  - Fichiers suspects (trop gros, trop vieux, extensions inhabituelles)

---

### Phase 5 : Analyse Détaillée

#### **Node: Analyze Structure**
- **Type** : Code (JavaScript)
- **Fonction** : Analyse structurelle avancée

**Métriques calculées** :
- Nombre total de clients
- Nombre de dossiers par client
- Profondeur maximale d'arborescence
- Distribution des types de fichiers
- Taille totale par client
- Dossiers vides
- Fichiers orphelins (hors structure standard)
- Anomalies de nommage

**Détection d'anomalies** :
- Dossiers clients sans code GXXXX
- Fichiers à la racine (non classés)
- Extensions de fichiers non autorisées
- Fichiers de plus de 100 MB
- Dossiers non conformes à la structure WALTERA

---

### Phase 6 : Génération de Prompt IA

#### **Node: promptGamma**
- **Type** : Code (JavaScript)
- **Fonction** : Génère un prompt structuré pour Gamma

**Contenu du prompt** :
```
AUDIT RÉSEAU PORTEFEUILLE CLIENTS - WALTERA

## MÉTRIQUES GLOBALES
- Nombre de clients : X
- Nombre total de fichiers : Y
- Taille totale : Z GB
- Profondeur max : N niveaux

## TOP 10 CLIENTS (par volume)
1. Client A : X fichiers, Y GB
2. Client B : X fichiers, Y GB
...

## ANOMALIES DÉTECTÉES
### Critiques
- X fichiers sans classification
- Y dossiers vides

### Mineures
- Noms de fichiers trop longs
- Extensions non standard

## RECOMMANDATIONS
1. Réorganiser les dossiers clients sans code
2. Archiver les dossiers vides
3. Standardiser les conventions de nommage
```

---

### Phase 7 : Appel API Gamma

#### **Node: HTTP Request (Gamma)**
- **Type** : HTTP Request
- **URL** : `https://public-api.gamma.app/v0.2/generations`
- **Méthode** : POST
- **Fonction** : Génère un rapport visuel via Gamma

**Paramètres** :
- `inputText` : Prompt généré précédemment
- `format` : "document"
- `language` : "fr"
- `tone` : "professional"

---

### Phase 8 : Compilation du Rapport

#### **Node: Generate Report**
- **Type** : Code (JavaScript)
- **Fonction** : Agrège toutes les données en un rapport final

**Structure du rapport** :
```json
{
  "audit_date": "2025-01-15T10:00:00Z",
  "summary": {
    "total_clients": 150,
    "total_files": 10000,
    "total_size_gb": 250,
    "total_anomalies": 23
  },
  "clients": [
    {
      "code": "G0001",
      "name": "ALTESSE",
      "files_count": 150,
      "size_gb": 2.5,
      "anomalies": []
    }
  ],
  "anomalies": [
    {
      "type": "MISSING_CODE",
      "severity": "critical",
      "path": "/PORTEFEUILLE/ClientSansCode",
      "recommendation": "Ajouter un code GXXXX"
    }
  ],
  "gamma_report_url": "https://gamma.app/docs/abc123"
}
```

---

### Phase 9 : Fusion et Réponse

#### **Node: Merge Data**
- **Type** : Merge
- **Fonction** : Combine toutes les données analysées

#### **Node: Respond to Webhook**
- **Type** : Respond to Webhook
- **Fonction** : Retourne le rapport complet au client

---

## 📊 Métriques Auditées

### Structure des Dossiers
- Conformité au pattern `GXXXX_NOM`
- Présence des sous-dossiers standards (Contrats, Factures, etc.)
- Profondeur d'arborescence (recommandé : < 5 niveaux)

### Fichiers
- Types de fichiers (PDF, DOCX, XLSX, etc.)
- Tailles moyennes et extrêmes
- Dates de dernière modification
- Fichiers dupliqués (même nom)

### Anomalies
- **Critiques** : Dossiers sans code, fichiers à la racine, extensions dangereuses
- **Mineures** : Noms trop longs, caractères spéciaux, espaces multiples

---

## 🔧 Configuration Technique

### NAS Synology
- **URL** : `https://waltera.synology.me:5001`
- **API** : SYNO.FileStation
- **Partage cible** : `PORTEFEUILLE`

### API Gamma
- **Endpoint** : `/v0.2/generations`
- **Format** : Document
- **Langue** : Français

---

## 📝 Exemple de Rapport

```json
{
  "audit_date": "2025-01-15T14:30:00Z",
  "execution_time": "45s",
  "summary": {
    "total_clients": 152,
    "total_directories": 1843,
    "total_files": 9847,
    "total_size_gb": 248.5,
    "total_anomalies": 18
  },
  "top_clients": [
    {
      "code": "G0045",
      "name": "TECHNOCORP",
      "files": 523,
      "size_gb": 12.3
    }
  ],
  "anomalies_summary": {
    "critical": 3,
    "warning": 8,
    "info": 7
  },
  "anomalies": [
    {
      "severity": "critical",
      "type": "MISSING_CLIENT_CODE",
      "path": "/PORTEFEUILLE/1 - Clients/ClientX",
      "message": "Dossier client sans code GXXXX"
    }
  ],
  "recommendations": [
    "Renommer 3 dossiers clients pour ajouter le code GXXXX",
    "Archiver 12 dossiers vides",
    "Déplacer 5 fichiers orphelins vers les bons dossiers clients"
  ],
  "gamma_url": "https://gamma.app/docs/audit-report-abc123"
}
```

---

## 🚨 Types d'Anomalies Détectées

### Critiques (🔴)
1. **MISSING_CLIENT_CODE** : Dossier client sans code GXXXX
2. **ROOT_FILES** : Fichiers à la racine du partage
3. **DANGEROUS_EXTENSION** : Extensions .exe, .bat, .sh
4. **OVERSIZED_FILE** : Fichiers > 100 MB

### Avertissements (🟠)
1. **EMPTY_DIRECTORY** : Dossier vide (> 30 jours)
2. **DEEP_NESTING** : Profondeur > 7 niveaux
3. **LONG_FILENAME** : Nom de fichier > 100 caractères
4. **SPECIAL_CHARS** : Caractères spéciaux dans les noms

### Informations (🔵)
1. **OLD_FILE** : Fichier non modifié depuis > 2 ans
2. **DUPLICATE_NAME** : Fichiers avec le même nom dans le même dossier
3. **UNUSUAL_EXTENSION** : Extension rare (.tmp, .bak, etc.)

---

## 🔐 Sécurité

- Authentification NAS requise
- Lecture seule (pas de modifications)
- Logs d'audit conservés
- Données sensibles anonymisées dans le rapport Gamma

---

## 📈 Performance

- **Durée moyenne** : 30-60 secondes pour 150 clients
- **Dossiers scannés** : ~2000
- **Fichiers inventoriés** : ~10 000
- **Temps Gamma** : +30 secondes

---

## 🔗 Intégrations

- **Synology NAS** : Source de données
- **Gamma API** : Génération de rapport visuel
- **Webhook** : Déclenchement et réponse

---

## 🛠️ Maintenance

### Ajouter une règle d'anomalie
Modifier le node **Analyze Structure** :
```javascript
if (file.size > 100 * 1024 * 1024) {
  anomalies.push({
    type: 'OVERSIZED_FILE',
    severity: 'critical',
    path: file.path,
    message: `Fichier trop gros : ${file.size_mb} MB`
  });
}
```

### Changer le seuil de taille
```javascript
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB
```

---

## 🎯 Cas d'Usage

1. **Audit mensuel** : Vérifier la conformité de l'arborescence
2. **Migration** : Préparer une migration vers un nouveau NAS
3. **Nettoyage** : Identifier les fichiers à archiver ou supprimer
4. **Onboarding client** : Vérifier la structure avant intégration RAG

---

## 🔄 Différence avec walteraAuditReseauTechniqueFinal

**walteraAuditReseauClientsFinal** : Focus sur les **dossiers clients** (conformité métier)
- Analyse les codes clients GXXXX
- Vérifie la structure par client
- Recommandations métier

**walteraAuditReseauTechniqueFinal** : Focus sur l'**infrastructure technique**
- Performance du NAS
- Quotas et espace disque
- Droits d'accès et permissions
- Recommandations techniques

---

## 📞 Support

**Webhook URL** : À compléter après configuration
**Logs n8n** : Vérifier les exécutions dans l'interface n8n

---

## 🎯 Améliorations Possibles

- [ ] Détection automatique de doublons (hash MD5)
- [ ] Export Excel du rapport
- [ ] Notifications Slack en cas d'anomalies critiques
- [ ] Historique des audits dans Supabase
- [ ] Comparaison avec audit précédent (delta)
- [ ] Suggestions de réorganisation automatique
