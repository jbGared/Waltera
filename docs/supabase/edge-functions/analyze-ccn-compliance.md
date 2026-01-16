# Edge Function: analyze-ccn-compliance

## Description

Analyse automatique de conformite des contrats clients par rapport aux exigences des conventions collectives (CCN) en utilisant Mistral AI.

---

## Informations

| Attribut | Valeur |
|----------|--------|
| **Slug** | `analyze-ccn-compliance` |
| **Version** | 5 |
| **Statut** | Production |
| **Authentification** | JWT requis (Service Role recommande) |
| **Runtime** | Deno (Supabase Edge) |

---

## Fonctionnalites

- Analyse IA des ecarts de conformite entre CCN et contrats clients
- Detection automatique des non-conformites par categorie
- Pagination pour traiter de grands volumes de clients
- Sauvegarde des alertes en base de donnees
- Support de l'analyse par lot ou par client specifique

---

## API

### Endpoint

```
POST /functions/v1/analyze-ccn-compliance
```

### Headers

| Header | Valeur | Requis |
|--------|--------|--------|
| `Authorization` | `Bearer {SERVICE_ROLE_KEY}` | Oui |
| `Content-Type` | `application/json` | Oui |

### Body (JSON)

| Parametre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `idcc` | string | Oui | Code IDCC de la convention collective a analyser |
| `import_log_id` | string | Non | ID du log d'import pour lier les alertes |
| `client_id` | string | Non | ID d'un client specifique a analyser |
| `max_clients` | number | Non | Nombre max de clients a analyser (defaut: 3) |
| `offset` | number | Non | Decalage pour pagination (defaut: 0) |

### Exemple de Requete

```bash
# Analyser tous les clients IDCC 1486 (par lots de 3)
curl -X POST "https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/analyze-ccn-compliance" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "idcc": "1486",
    "max_clients": 3,
    "offset": 0
  }'

# Analyser un client specifique
curl -X POST "https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/analyze-ccn-compliance" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "idcc": "1486",
    "client_id": "abc123-..."
  }'
```

### Reponse

```json
{
  "success": true,
  "idcc": "1486",
  "clients_analyzed": 3,
  "total_clients": 9,
  "offset": 0,
  "issues_found": 18,
  "details": [
    {
      "client_name": "AMAHE",
      "issues_count": 6,
      "issues": [
        {
          "severity": "critical",
          "category": "GARANTIES_INSUFFISANTES",
          "title": "Capital deces insuffisant pour les non-cadres",
          "description": "Le contrat prevoit un capital deces de 500% uniquement pour les cadres...",
          "ccn_requirement": "Article 1er de l'annexe III...",
          "contract_clause": "Capital deces marie, pacse...",
          "recommended_action": "Etendre la garantie capital deces..."
        }
      ]
    }
  ]
}
```

---

## Categories d'Alertes

| Categorie | Description |
|-----------|-------------|
| `GARANTIES_INSUFFISANTES` | Niveau de couverture inferieur aux minimums CCN |
| `CLAUSE_MANQUANTE` | Clause obligatoire absente du contrat |
| `DELAI_NON_CONFORME` | Delais de carence ou franchise non conformes |
| `BENEFICIAIRES_EXCLUS` | Categories de beneficiaires non couvertes |
| `OPTION_OBLIGATOIRE` | Option rendue obligatoire par la CCN mais non souscrite |

## Niveaux de Severite

| Severite | Description | Badge |
|----------|-------------|-------|
| `critical` | Non-conformite majeure necessitant action immediate | Rouge |
| `warning` | Ecart a corriger rapidement | Orange |
| `info` | Amelioration possible, non bloquant | Bleu |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ANALYSE CONFORMITE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Recuperation chunks CCN (table: ccn)                    │
│     └─> Filtrage par IDCC                                   │
│                                                              │
│  2. Identification clients (table: clients)                 │
│     └─> Filtrage par IDCC dans array clients.idcc           │
│                                                              │
│  3. Recuperation contrats (table: documents)                │
│     └─> Filtrage par client_name + document_type            │
│     └─> Verification client_idcc dans metadata              │
│                                                              │
│  4. Analyse Mistral Large                                   │
│     └─> Comparaison CCN vs Contrat                          │
│     └─> Detection ecarts de conformite                      │
│     └─> Generation recommandations                          │
│                                                              │
│  5. Sauvegarde alertes (table: ccn_compliance_alerts)       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Tables Supabase

### Lecture

| Table | Colonnes | Description |
|-------|----------|-------------|
| `ccn` | id, content, metadata | Chunks des conventions collectives |
| `clients` | id, name, idcc | Liste des clients avec leurs IDCC |
| `documents` | id, content, metadata | Documents contractuels des clients |
| `idcc_ref` | idcc, label | Reference des labels CCN |

### Ecriture

| Table | Description |
|-------|-------------|
| `ccn_compliance_alerts` | Stockage des alertes de conformite detectees |

---

## Pagination pour Grands Volumes

Pour analyser de nombreux clients sans timeout, utilisez la pagination :

```bash
# Lot 1 : clients 1-3
curl -X POST ... -d '{"idcc": "1486", "max_clients": 3, "offset": 0}'

# Lot 2 : clients 4-6
curl -X POST ... -d '{"idcc": "1486", "max_clients": 3, "offset": 3}'

# Lot 3 : clients 7-9
curl -X POST ... -d '{"idcc": "1486", "max_clients": 3, "offset": 6}'
```

**Note** : Le timeout des Edge Functions est d'environ 2.5 minutes. Avec 3 clients et ~20 secondes par appel Mistral, un lot de 3 clients prend environ 1 minute.

---

## Integration avec le Workflow d'Import

L'analyse de conformite est automatiquement declenchee apres un import CCN :

1. L'Edge Function `import-ccn` importe les nouveaux textes CCN
2. Elle detecte les modifications de mots-cles sensibles
3. Elle declenche `analyze-ccn-compliance` pour les IDCC modifies
4. Les alertes sont sauvegardees et envoyees par email

---

## Configuration

### Variables d'Environnement

| Variable | Description |
|----------|-------------|
| `MISTRAL_API_KEY` | Cle API Mistral pour l'analyse IA |
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Cle Service Role pour acces admin |

---

## Deploiement

```bash
# Deployer la fonction
supabase functions deploy analyze-ccn-compliance

# Verifier les secrets
supabase secrets list

# Ajouter un secret si manquant
supabase secrets set MISTRAL_API_KEY=sk-xxx
```

---

## Troubleshooting

### Timeout (504)

**Cause** : Trop de clients a analyser dans un seul appel.

**Solution** : Reduire `max_clients` ou utiliser la pagination.

### Aucun chunk CCN trouve

**Cause** : L'IDCC n'existe pas dans la table `ccn`.

**Solution** : Verifier que l'import CCN a ete effectue pour cet IDCC.

### Aucun contrat trouve pour un client

**Cause** : Le client n'a pas de documents de type "contractuel" avec l'IDCC correspondant.

**Solution** : Verifier les documents du client dans la table `documents`.

---

## Voir Aussi

- [send-ccn-alerts-email](./send-ccn-alerts-email.md) - Envoi des alertes par email
- [import-ccn](./import-ccn.md) - Import des conventions collectives
- [recherche-ccn](./recherche-ccn.md) - Recherche dans les CCN

---

**Derniere mise a jour** : 16 janvier 2026
**Version** : 1.0.0
