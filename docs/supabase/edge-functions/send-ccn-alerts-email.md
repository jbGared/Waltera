# Edge Function: send-ccn-alerts-email

## Description

Envoi d'emails d'alertes CCN aux utilisateurs inscrits. Supporte deux types d'alertes :
- **Alertes de modifications** : Mots-cles sensibles detectes lors des imports CCN
- **Alertes de conformite** : Ecarts detectes par l'analyse IA entre CCN et contrats

---

## Informations

| Attribut | Valeur |
|----------|--------|
| **Slug** | `send-ccn-alerts-email` |
| **Version** | 3 |
| **Statut** | Production |
| **Authentification** | Aucune (verify_jwt: false) |
| **Runtime** | Deno (Supabase Edge) |
| **Service Email** | Resend |

---

## Fonctionnalites

- Envoi d'emails HTML responsive aux utilisateurs inscrits
- Support des alertes de modifications CCN (mots-cles)
- Support des alertes de conformite IA
- Listing des clients potentiellement impactes
- Mise a jour automatique du statut des alertes en base

---

## API

### Endpoint

```
POST /functions/v1/send-ccn-alerts-email
```

### Headers

| Header | Valeur | Requis |
|--------|--------|--------|
| `Content-Type` | `application/json` | Oui |

### Body (JSON)

| Parametre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `alerts` | CcnAlert[] | Non | Alertes de modifications CCN |
| `compliance_alerts` | ComplianceAlert[] | Non | Alertes de conformite IA |
| `import_date` | string | Oui | Date/heure de l'import (ISO 8601) |
| `import_id` | string | Non | ID du log d'import |

### Types

```typescript
interface CcnAlert {
  idcc: string;
  label: string;
  title: string;
  detected_terms: string[];
  summary?: string;
  impacted_clients?: string[];
}

interface ComplianceAlert {
  idcc: string;
  ccn_label: string;
  client_name: string;
  severity: 'info' | 'warning' | 'critical';
  category: string;
  title: string;
  description: string;
  recommended_action?: string;
}
```

### Exemple de Requete

```bash
curl -X POST "https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/send-ccn-alerts-email" \
  -H "Content-Type: application/json" \
  -d '{
    "alerts": [
      {
        "idcc": "1486",
        "label": "Bureaux etudes techniques",
        "title": "Modification des garanties prevoyance",
        "detected_terms": ["capital deces", "invalidite"],
        "summary": "Nouveaux minimums de garanties...",
        "impacted_clients": ["AMAHE", "GARED"]
      }
    ],
    "compliance_alerts": [
      {
        "idcc": "1486",
        "ccn_label": "Bureaux etudes techniques",
        "client_name": "AMAHE",
        "severity": "critical",
        "category": "GARANTIES_INSUFFISANTES",
        "title": "Capital deces insuffisant",
        "description": "Le contrat ne couvre pas les non-cadres...",
        "recommended_action": "Etendre la couverture..."
      }
    ],
    "import_date": "2026-01-16T10:30:00Z",
    "import_id": "abc123-..."
  }'
```

### Reponse

```json
{
  "success": true,
  "sent_count": 2,
  "total_users": 3,
  "keyword_alerts": 1,
  "compliance_alerts": 1,
  "results": [
    { "email": "jb@gared.fr", "success": true, "messageId": "xxx" },
    { "email": "user@waltera.fr", "success": true, "messageId": "yyy" },
    { "email": "other@waltera.fr", "success": false, "error": "..." }
  ]
}
```

---

## Destinataires

Les emails sont envoyes aux utilisateurs ayant `receive_ccn_alerts = true` (ou NULL) dans leur profil.

```sql
SELECT email, first_name
FROM profiles
WHERE receive_ccn_alerts IS NULL OR receive_ccn_alerts = true;
```

**Desabonnement** : Les utilisateurs peuvent desactiver les alertes dans leur profil WALTERA.

---

## Format de l'Email

### Structure HTML

L'email contient :
1. **En-tete** : Logo WALTERA + titre
2. **Resume** : Nombre total d'alertes + date d'import
3. **Section Modifications** (si alertes de mots-cles) :
   - Liste des CCN modifiees
   - Termes sensibles detectes
   - Clients potentiellement impactes
4. **Section Conformite** (si alertes IA) :
   - Liste des ecarts par client
   - Severite (badge colore)
   - Actions recommandees
5. **CTA** : Bouton vers le monitoring CCN
6. **Footer** : Lien de desabonnement

### Apercu

```
┌─────────────────────────────────────────────┐
│              WALTERA                         │
│         CONSEIL & ASSURANCES                │
├─────────────────────────────────────────────┤
│                                              │
│  [5 alertes]                                │
│  Rapport d'alertes CCN                      │
│  Import du vendredi 16 janvier 2026         │
│                                              │
├─────────────────────────────────────────────┤
│  MODIFICATIONS CONVENTIONS COLLECTIVES      │
│  ─────────────────────────────────────────  │
│  [IDCC 1486] Bureaux etudes techniques      │
│  Modification des garanties prevoyance      │
│  [capital deces] [invalidite]               │
│                                              │
│  Clients impactes: AMAHE, GARED            │
│                                              │
├─────────────────────────────────────────────┤
│  ANALYSE DE CONFORMITE AI                   │
│  ─────────────────────────────────────────  │
│  [CRITIQUE] AMAHE                           │
│  Capital deces insuffisant                  │
│  Le contrat ne couvre pas...                │
│                                              │
│  Action: Etendre la couverture...           │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│     [Voir le detail sur WALTERA]            │
│                                              │
└─────────────────────────────────────────────┘
```

---

## Tables Supabase

### Lecture

| Table | Description |
|-------|-------------|
| `profiles` | Liste des utilisateurs inscrits aux alertes |
| `ccn_compliance_alerts` | Alertes de conformite (si import_id fourni) |

### Mise a jour

| Table | Action |
|-------|--------|
| `ccn_notifications` | Passage status "pending" -> "sent" |
| `ccn_compliance_alerts` | Passage status "pending" -> "sent" |

---

## Configuration

### Variables d'Environnement

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Cle API Resend pour l'envoi d'emails |
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Cle Service Role |

### Email Expediteur

```
From: WALTERA Alertes <noreply@waltera.gared.fr>
```

---

## Integration

### Depuis import-ccn

Apres un import CCN avec des alertes detectees :

```javascript
// Dans import-ccn/index.ts
await fetch(`${SUPABASE_URL}/functions/v1/send-ccn-alerts-email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    alerts: keywordAlerts,
    compliance_alerts: complianceAlerts,
    import_date: new Date().toISOString(),
    import_id: logId
  })
});
```

### Depuis analyze-ccn-compliance

Les alertes de conformite sont sauvegardees en base puis envoyees :

1. `analyze-ccn-compliance` sauvegarde les alertes dans `ccn_compliance_alerts`
2. L'appelant recupere les alertes et appelle `send-ccn-alerts-email`

---

## Rate Limiting

Le service Resend a une limite de 2 requetes/seconde. En cas de nombreux destinataires, certains emails peuvent echouer avec l'erreur `429 rate_limit_exceeded`.

**Solution** : La fonction envoie les emails sequentiellement avec un delai implicite.

---

## Troubleshooting

### Erreur 429 (Rate Limit)

**Cause** : Trop d'emails envoyes en peu de temps.

**Solution** : Reessayer apres quelques secondes. Les emails non envoyes peuvent etre renvoyes.

### Aucun utilisateur inscrit

**Cause** : Tous les utilisateurs ont `receive_ccn_alerts = false`.

**Solution** : Verifier les profils utilisateurs dans la table `profiles`.

### Email non recu

1. Verifier les logs Supabase : `supabase functions logs send-ccn-alerts-email`
2. Verifier le statut dans la reponse API
3. Verifier les spams du destinataire
4. Verifier la configuration DNS du domaine expediteur

---

## Voir Aussi

- [analyze-ccn-compliance](./analyze-ccn-compliance.md) - Analyse de conformite IA
- [import-ccn](./import-ccn.md) - Import des conventions collectives

---

**Derniere mise a jour** : 16 janvier 2026
**Version** : 1.0.0
