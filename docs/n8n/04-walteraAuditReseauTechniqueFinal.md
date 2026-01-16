# walteraAuditReseauTechniqueFinal

**ID**: `pqf5wkWfJa7E7XC7`
**Statut**: ✅ Actif
**Créé le**: 30/09/2025
**Dernière mise à jour**: 15/01/2026

---

## 📋 Description

Workflow d'audit technique de l'infrastructure réseau NAS Synology. Analyse les performances, quotas, droits d'accès et génère un rapport technique avec recommandations d'optimisation via Gamma.

---

## 🎯 Objectif

Auditer l'infrastructure technique du NAS pour :
- Analyser l'utilisation des ressources (CPU, RAM, disque)
- Vérifier les quotas et l'espace disponible
- Auditer les droits d'accès et permissions
- Détecter les goulots d'étranglement de performance
- Générer un rapport technique avec recommandations

---

## 🔄 Triggers

### 1. **Webhook** (HTTP)
- **Méthode** : GET/POST
- **Path** : À définir
- **Response Mode** : Via "Respond to Webhook"

### 2. **Manual Trigger** (Manuel)
- Pour lancer des audits techniques manuels

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
- **Objectif** : Récupérer tous les partages réseau avec métadonnées techniques

**Données récupérées** :
- Nom du partage
- Taille totale allouée
- Espace utilisé
- Espace disponible
- Droits d'accès (lecture/écriture)
- Quotas configurés

---

### Phase 3 : Filtrage PORTEFEUILLE

#### **Node: Split Shares**
- **Type** : Split Out
- **Action** : Divise les résultats en items individuels

#### **Node: Filter PORTEFEUILLE**
- **Type** : If
- **Condition** : `share.name === "PORTEFEUILLE"`
- **Objectif** : Isoler le partage principal

---

### Phase 4 : Analyse Technique

#### **Node: getDirectories**
- **Type** : Code (JavaScript)
- **Fonction** : Analyse technique des répertoires

**Métriques collectées** :
- Nombre d'inodes utilisés
- Profondeur d'arborescence (impact sur les performances)
- Dossiers avec > 10 000 fichiers (risque de lenteur)
- Permissions UNIX (rwxrwxrwx)
- Propriétaires et groupes

#### **Node: getFiles**
- **Type** : Code (JavaScript)
- **Fonction** : Analyse technique des fichiers

**Métriques collectées** :
- Distribution des tailles de fichiers
- Types MIME réels (vs extensions)
- Fichiers fragmentés (si API disponible)
- Taux de compression (fichiers compressibles non compressés)
- Fichiers corrompus (détection par en-têtes)

---

### Phase 5 : Analyse de Performance

#### **Node: Analyze Structure**
- **Type** : Code (JavaScript)
- **Fonction** : Analyse de performance système

**Métriques calculées** :

### Stockage
- Taux d'utilisation du disque
- Espace récupérable (fichiers temp, caches)
- Prévision de saturation (tendance)
- Fragmentation (si mesurable)

### Performance
- Nombre de fichiers/dossier (optimal < 1000)
- Profondeur d'arborescence (optimal < 5)
- Taille moyenne des fichiers
- Ratio petits/gros fichiers

### Quotas
- Quotas par utilisateur
- Dépassements de quotas
- Recommandations d'ajustement

### Permissions
- Permissions incohérentes
- Fichiers sans propriétaire
- Permissions trop permissives (777)

---

### Phase 6 : Génération de Prompt Technique

#### **Node: promptGamma**
- **Type** : Code (JavaScript)
- **Fonction** : Génère un prompt technique pour Gamma

**Contenu du prompt** :
```
AUDIT TECHNIQUE INFRASTRUCTURE NAS - WALTERA

## MÉTRIQUES SYSTÈME
- Espace utilisé : X GB / Y GB (Z%)
- Taux de saturation : X mois restants
- Nombre total d'inodes : X / Y (Z%)

## PERFORMANCE
- Dossiers > 1000 fichiers : X (impact: lenteur)
- Profondeur max : X niveaux (optimal: < 5)
- Fichiers fragmentés : X%

## QUOTAS
- Utilisateurs au quota : X
- Espace récupérable : Y GB

## SÉCURITÉ
- Fichiers permissions 777 : X
- Fichiers sans propriétaire : Y

## RECOMMANDATIONS TECHNIQUES
1. Augmenter le quota de [utilisateur] de X GB
2. Archiver les fichiers de plus de 2 ans (récupère Y GB)
3. Corriger les permissions trop permissives
4. Défragmenter le volume (si nécessaire)
```

---

### Phase 7 : Appel API Gamma

#### **Node: HTTP Request (Gamma)**
- **Type** : HTTP Request
- **URL** : `https://public-api.gamma.app/v0.2/generations`
- **Méthode** : POST
- **Fonction** : Génère un rapport technique visuel

**Paramètres** :
- `inputText` : Prompt technique
- `format` : "document"
- `language` : "fr"
- `tone` : "technical"

---

### Phase 8 : Compilation du Rapport Technique

#### **Node: Generate Report**
- **Type** : Code (JavaScript)
- **Fonction** : Agrège les données techniques

**Structure du rapport** :
```json
{
  "audit_date": "2025-01-15T10:00:00Z",
  "nas_info": {
    "hostname": "waltera.synology.me",
    "model": "DS920+",
    "dsm_version": "7.2"
  },
  "storage": {
    "total_gb": 4000,
    "used_gb": 2500,
    "free_gb": 1500,
    "used_percent": 62.5,
    "estimated_full_date": "2025-08-15"
  },
  "performance": {
    "total_files": 10000,
    "total_directories": 2000,
    "avg_files_per_directory": 5,
    "max_depth": 8,
    "slow_directories": 5,
    "fragmentation_percent": 12
  },
  "quotas": {
    "enabled": true,
    "users_at_limit": 3,
    "total_quota_used_percent": 78
  },
  "security": {
    "world_writable_files": 45,
    "orphan_files": 12,
    "suspicious_permissions": 23
  },
  "recommendations": [
    {
      "type": "STORAGE",
      "priority": "high",
      "action": "Archive old files to free 200 GB"
    },
    {
      "type": "PERFORMANCE",
      "priority": "medium",
      "action": "Reorganize 5 directories with > 1000 files"
    }
  ],
  "gamma_url": "https://gamma.app/docs/technical-audit-xyz789"
}
```

---

### Phase 9 : Réponse

#### **Node: Merge Data**
- **Type** : Merge
- **Fonction** : Combine toutes les données techniques

#### **Node: Respond to Webhook**
- **Type** : Respond to Webhook
- **Fonction** : Retourne le rapport technique complet

---

## 📊 Métriques Techniques Auditées

### 1. Stockage
- ✅ Capacité totale et utilisée
- ✅ Taux de croissance (si historique disponible)
- ✅ Projection de saturation
- ✅ Espace récupérable (fichiers temp, logs, caches)

### 2. Performance
- ✅ Distribution des fichiers par taille
- ✅ Dossiers surchargés (> 1000 fichiers)
- ✅ Profondeur d'arborescence
- ✅ Fichiers fragmentés (si API disponible)

### 3. Quotas
- ✅ Quotas par utilisateur/groupe
- ✅ Dépassements actuels
- ✅ Tendances d'utilisation
- ✅ Recommandations d'ajustement

### 4. Sécurité
- ✅ Permissions trop permissives (777, 666)
- ✅ Fichiers sans propriétaire (orphelins)
- ✅ Groupes d'accès incohérents
- ✅ Fichiers sensibles non protégés

### 5. Inodes
- ✅ Nombre d'inodes utilisés
- ✅ Limite système
- ✅ Risque de saturation

---

## 🔧 Configuration Technique

### NAS Synology
- **URL** : `https://waltera.synology.me:5001`
- **API** : SYNO.FileStation + SYNO.Core.System
- **Partage cible** : `PORTEFEUILLE`

### Seuils d'Alerte
```javascript
const THRESHOLDS = {
  storage_warning: 70,     // % d'utilisation
  storage_critical: 85,    // % d'utilisation
  files_per_dir_max: 1000, // Nombre de fichiers
  max_depth_recommended: 5, // Profondeur
  permission_suspicious: 0o777, // Permissions
  inode_warning: 80        // % d'utilisation
};
```

---

## 📝 Exemple de Rapport Technique

```json
{
  "audit_date": "2025-01-15T14:30:00Z",
  "execution_time": "52s",
  "storage": {
    "total_tb": 4.0,
    "used_tb": 2.5,
    "free_tb": 1.5,
    "used_percent": 62.5,
    "growth_gb_per_month": 85,
    "estimated_full_date": "2025-08-15",
    "status": "warning"
  },
  "performance": {
    "total_files": 9847,
    "total_directories": 1843,
    "avg_depth": 3.2,
    "max_depth": 8,
    "slow_directories": [
      {
        "path": "/PORTEFEUILLE/1 - Clients/G0045_TECHNOCORP",
        "files_count": 1523,
        "recommendation": "Split into subdirectories"
      }
    ],
    "status": "ok"
  },
  "quotas": {
    "enabled": true,
    "users": [
      {
        "name": "Gared",
        "quota_gb": 500,
        "used_gb": 485,
        "used_percent": 97,
        "status": "critical"
      }
    ]
  },
  "security_issues": [
    {
      "severity": "high",
      "type": "WORLD_WRITABLE",
      "count": 45,
      "sample_path": "/PORTEFEUILLE/temp/unsecure.pdf"
    }
  ],
  "recommendations": [
    {
      "priority": "critical",
      "category": "STORAGE",
      "action": "Plan storage expansion - full in 7 months",
      "impact": "System will be full"
    },
    {
      "priority": "high",
      "category": "SECURITY",
      "action": "Fix 45 world-writable files",
      "impact": "Security vulnerability"
    },
    {
      "priority": "medium",
      "category": "PERFORMANCE",
      "action": "Reorganize 5 directories with > 1000 files",
      "impact": "Improved access speed"
    }
  ],
  "gamma_url": "https://gamma.app/docs/tech-audit-xyz789"
}
```

---

## 🚨 Alertes Techniques

### Critiques (🔴)
1. **STORAGE_CRITICAL** : Espace disque > 85%
2. **QUOTA_EXCEEDED** : Utilisateur dépassant son quota
3. **INODE_EXHAUSTION** : Inodes > 90%
4. **WORLD_WRITABLE** : Fichiers avec permissions 777

### Avertissements (🟠)
1. **STORAGE_WARNING** : Espace disque > 70%
2. **SLOW_DIRECTORY** : Dossier avec > 1000 fichiers
3. **DEEP_NESTING** : Profondeur > 7 niveaux
4. **ORPHAN_FILES** : Fichiers sans propriétaire

### Informations (🔵)
1. **FRAGMENTATION** : Taux de fragmentation > 20%
2. **OLD_TEMP_FILES** : Fichiers temp > 30 jours
3. **OVERSIZED_LOGS** : Logs > 1 GB

---

## 🔐 Sécurité

- Audit en lecture seule
- Authentification NAS requise
- Logs d'audit techniques conservés
- Données sensibles de permissions anonymisées dans le rapport

---

## 📈 Performance

- **Durée moyenne** : 45-90 secondes
- **Dossiers scannés** : ~2000
- **Fichiers analysés** : ~10 000
- **Appels API NAS** : ~50
- **Temps Gamma** : +30 secondes

---

## 🔗 Intégrations

- **Synology NAS** : Source de métriques système
- **Gamma API** : Génération de rapport visuel
- **Webhook** : Déclenchement et réponse

---

## 🛠️ Maintenance

### Ajouter un seuil d'alerte
Modifier le node **Analyze Structure** :
```javascript
const THRESHOLDS = {
  ...existingThresholds,
  new_threshold: 50
};
```

### Changer la priorité d'une recommandation
```javascript
if (storage.used_percent > 90) {
  recommendations.push({
    priority: 'critical',  // 'low', 'medium', 'high', 'critical'
    category: 'STORAGE',
    action: 'Urgent storage expansion needed'
  });
}
```

---

## 🎯 Cas d'Usage

1. **Audit mensuel** : Vérifier la santé technique du NAS
2. **Planification capacité** : Prévoir les besoins en stockage
3. **Optimisation performance** : Identifier les goulots d'étranglement
4. **Audit sécurité** : Détecter les vulnérabilités de permissions
5. **Troubleshooting** : Diagnostiquer les problèmes de lenteur

---

## 🔄 Différence avec walteraAuditReseauClientsFinal

**walteraAuditReseauClientsFinal** : Focus sur les **dossiers clients** (conformité métier)
- Analyse la structure métier
- Vérifie les conventions de nommage
- Détecte les fichiers mal classés
- Recommandations organisationnelles

**walteraAuditReseauTechniqueFinal** : Focus sur l'**infrastructure technique**
- Analyse les ressources système
- Vérifie les performances et quotas
- Détecte les problèmes de sécurité
- Recommandations techniques et d'optimisation

---

## 📞 Support

**Webhook URL** : À compléter après configuration
**Logs n8n** : Vérifier les exécutions dans l'interface n8n
**API Synology** : https://global.download.synology.com/download/Document/Software/DeveloperGuide/

---

## 🎯 Améliorations Possibles

- [ ] Historique des audits (tendances)
- [ ] Dashboard Grafana en temps réel
- [ ] Alertes Slack/Email automatiques
- [ ] Comparaison avec audit précédent
- [ ] Prévision ML de saturation
- [ ] API REST pour audit programmé
- [ ] Export CSV des métriques
- [ ] Intégration avec outils de monitoring (Prometheus, etc.)
