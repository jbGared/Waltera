# Edge Function: import-ccn

## Description

Import et synchronisation des conventions collectives depuis l'API Legifrance. Detecte les modifications, genere des alertes sur les mots-cles sensibles, et declenche l'analyse de conformite IA.

---

## Informations

| Attribut | Valeur |
|----------|--------|
| **Slug** | `import-ccn` |
| **Version** | 8 |
| **Statut** | Production |
| **Authentification** | Aucune (verify_jwt: false) |
| **Runtime** | Deno (Supabase Edge) |

---

## Fonctionnalites

- Import des textes CCN depuis l'API Legifrance (DILA/PISTE)
- Detection des modifications par comparaison de hash
- Chunking et vectorisation avec Mistral Embeddings
- Detection de mots-cles sensibles (garanties, cotisations, etc.)
- Generation automatique d'alertes
- Declenchement de l'analyse de conformite IA
- Envoi d'emails recapitulatifs

---

## API

### Endpoints

| Methode | Path | Description |
|---------|------|-------------|
| `POST /` | `/functions/v1/import-ccn` | Import d'un IDCC specifique |
| `POST /sync-all` | `/functions/v1/import-ccn/sync-all` | Synchronisation de tous les IDCC actifs |
| `GET /status` | `/functions/v1/import-ccn/status` | Statut du dernier import |

### Import d'un IDCC

```bash
curl -X POST "https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/import-ccn" \
  -H "Content-Type: application/json" \
  -d '{"idcc": "1486"}'
```

**Reponse** :
```json
{
  "success": true,
  "idcc": "1486",
  "label": "Bureaux etudes techniques",
  "chunks_created": 42,
  "alerts_count": 2,
  "compliance_analysis": {
    "ccns_analyzed": 1,
    "total_issues": 18
  }
}
```

### Synchronisation Globale

```bash
curl -X POST "https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/import-ccn/sync-all" \
  -H "Content-Type: application/json"
```

**Reponse** :
```json
{
  "success": true,
  "total_idcc": 14,
  "imported": 3,
  "skipped": 11,
  "errors": 0,
  "alerts_count": 5,
  "compliance_analysis": {
    "ccns_analyzed": 3,
    "total_issues": 47
  },
  "results": [...]
}
```

### Statut

```bash
curl "https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/import-ccn/status"
```

**Reponse** :
```json
{
  "status": "idle",
  "last_import": {
    "timestamp": "2026-01-16T10:30:00Z",
    "idcc_count": 14,
    "success_count": 14,
    "error_count": 0
  }
}
```

---

## Mots-Cles Sensibles

Les termes suivants declenchent une alerte lors de leur detection dans les textes importes :

| Categorie | Mots-cles |
|-----------|-----------|
| **Garanties** | capital deces, rente education, incapacite, invalidite |
| **Cotisations** | taux de cotisation, cotisation patronale, cotisation salariale |
| **Delais** | delai de carence, franchise, anciennete |
| **Beneficiaires** | ayants droit, conjoint, enfant a charge |
| **Portabilite** | maintien des garanties, portabilite |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      IMPORT CCN                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Authentification API Legifrance (OAuth2)                │
│     └─> Token PISTE (api.piste.gouv.fr)                     │
│                                                              │
│  2. Recuperation des textes CCN                             │
│     └─> GET /consult/kaliCont/{KALICONT_ID}                 │
│     └─> GET /consult/kaliText/{KALITEXTID}                  │
│                                                              │
│  3. Detection des modifications                             │
│     └─> Comparaison hash SHA-256                            │
│     └─> Skip si identique                                   │
│                                                              │
│  4. Chunking et Vectorisation                               │
│     └─> Decoupe en chunks de ~1000 tokens                   │
│     └─> Mistral Embeddings (1024 dimensions)                │
│                                                              │
│  5. Detection mots-cles sensibles                           │
│     └─> Scan des chunks                                     │
│     └─> Generation alertes                                  │
│                                                              │
│  6. Sauvegarde                                              │
│     └─> Table ccn (chunks + embeddings)                     │
│     └─> Table ccn_notifications (alertes)                   │
│     └─> Table ccn_import_logs (historique)                  │
│                                                              │
│  7. Analyse de conformite (optionnel)                       │
│     └─> Appel analyze-ccn-compliance                        │
│                                                              │
│  8. Notification email                                      │
│     └─> Appel send-ccn-alerts-email                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Tables Supabase

### Lecture

| Table | Description |
|-------|-------------|
| `idcc_ref` | Reference des IDCC actifs avec kalicont_id |
| `clients` | Liste des clients pour identifier les impacts |

### Ecriture

| Table | Description |
|-------|-------------|
| `ccn` | Chunks vectorises des CCN |
| `ccn_notifications` | Alertes de mots-cles detectes |
| `ccn_import_logs` | Historique des imports |
| `ccn_catalogue` | Mise a jour des stats (chunks_count) |

---

## Configuration

### Variables d'Environnement

| Variable | Description |
|----------|-------------|
| `LEGIFRANCE_CLIENT_ID` | Client ID OAuth API Legifrance |
| `LEGIFRANCE_CLIENT_SECRET` | Client Secret OAuth API Legifrance |
| `MISTRAL_API_KEY` | Cle API Mistral pour embeddings |
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Cle Service Role |

---

## Workflow N8N Associe

L'import CCN peut etre declenche par le workflow N8N `walteraImportCcnVersionFinale` :
- Execution quotidienne (CRON)
- Appel de l'endpoint `/sync-all`
- Gestion des erreurs et retry

---

## Troubleshooting

### Timeout (504)

**Cause** : Import de nombreux IDCC avec beaucoup de textes.

**Solution** : L'import est concu pour etre resilient. Relancer `/sync-all` reprendra la ou il s'est arrete (detection par hash).

### Erreur API Legifrance

**Cause** : Token expire ou probleme de connectivite.

**Solution** : Verifier les credentials et reessayer.

### Aucun chunk cree

**Cause** : Texte identique (hash non modifie) ou IDCC inexistant.

**Solution** : Verifier que l'IDCC a un `kalicont_id` valide dans `idcc_ref`.

---

## Voir Aussi

- [analyze-ccn-compliance](./analyze-ccn-compliance.md) - Analyse de conformite IA
- [send-ccn-alerts-email](./send-ccn-alerts-email.md) - Envoi des alertes
- [export-ccn](./export-ccn.md) - Export des CCN
- [recherche-ccn](./recherche-ccn.md) - Recherche dans les CCN

---

**Derniere mise a jour** : 16 janvier 2026
**Version** : 1.0.0
