# Edge Function: export-ccn

## Description

Export des conventions collectives en format Markdown. Genere un document structure avec table des matieres, hierarchie juridique des textes et metadonnees.

---

## Informations

| Attribut | Valeur |
|----------|--------|
| **Slug** | `export-ccn` |
| **Statut** | Production |
| **Authentification** | JWT requis |
| **Runtime** | Deno (Supabase Edge) |

---

## Fonctionnalites

- Export des CCN au format Markdown structure
- Table des matieres automatique
- Tri par hierarchie juridique des textes
- Filtrage automatique des textes abroges
- Generation de liens Legifrance
- Metadonnees (date, type, etat juridique)

---

## API

### Endpoint

```
POST /functions/v1/export-ccn
```

### Headers

| Header | Valeur | Requis |
|--------|--------|--------|
| `Authorization` | `Bearer {JWT_TOKEN}` | Oui |
| `Content-Type` | `application/json` | Oui |

### Body (JSON)

| Parametre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `idcc` | string | Oui | Code IDCC de la convention collective |
| `format` | string | Non | Format d'export : `markdown` (defaut) ou `pdf` |

### Exemple de Requete

```bash
curl -X POST "https://syxsacbciqwrahjdixuc.supabase.co/functions/v1/export-ccn" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"idcc": "1486", "format": "markdown"}'
```

### Reponse

**Headers** :
```
Content-Type: text/markdown; charset=utf-8
Content-Disposition: attachment; filename="CCN_1486_16_janvier_2026.md"
```

**Body** : Document Markdown structure

---

## Hierarchie Juridique

Les textes sont tries selon cette priorite (du plus au moins contraignant) :

| Priorite | Type | Description |
|----------|------|-------------|
| 1 | ARRETE_EXTENSION, ARRETE_AGREMENT, ARRETE | Force obligatoire maximale |
| 2 | AVENANT | Modifications du texte de base |
| 3 | ACCORD_SALAIRES, ACCORD_PREVOYANCE, ACCORD_FORMATION, ACCORD_RETRAITE, ACCORD | Accords thematiques |
| 4 | ANNEXE | Classifications, grilles |
| 5 | TEXTE_BASE | Convention originale |
| 6 | UNKNOWN | Autres textes |

---

## Structure du Document Exporte

```markdown
# Convention Collective Nationale
## IDCC 1486 - Bureaux etudes techniques

> Document genere le 16 janvier 2026 par WALTERA
> Source: Legifrance

---

## Table des matieres

### 1. Arretes (force obligatoire)
- [Arrete du 17 avril 2019...](#doc-1)
...

### 2. Avenants (modifications)
- [Avenant n42 du 5 mars 2024...](#doc-5)
...

---

# 1. Arretes (force obligatoire)

## 1. Arrete du 17 avril 2019... {#doc-1}

| Information | Valeur |
|-------------|--------|
| Type | ARRETE_EXTENSION |
| Etat | EN_VIGUEUR |
| Date debut | 2019-04-17 |
| Source | [Legifrance](https://...) |

### Contenu

[Texte complet de l'arrete...]

---
...
```

---

## Tables Supabase

### Lecture

| Table | Description |
|-------|-------------|
| `idcc_refs` | Reference des IDCC avec labels |
| `ccn_catalogue` | Catalogue des conventions collectives (content, metadata) |

---

## Filtrage des Textes

Les textes abroges sont automatiquement exclus de l'export :
- `ABROGE`
- `ABROGE_PARTIELLEMENT`

Seuls les textes en vigueur sont inclus dans le document final.

---

## Configuration

### Variables d'Environnement

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_ANON_KEY` | Cle anonyme Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Cle Service Role |

---

## Troubleshooting

### Erreur 401 (Non authentifie)

**Cause** : Token JWT manquant ou invalide.

**Solution** : Verifier le header Authorization avec un token valide.

### Erreur 404 (CCN non trouvee)

**Cause** : L'IDCC n'existe pas dans `idcc_ref` ou aucun chunk dans `ccn`.

**Solution** : Verifier que la CCN a bien ete importee.

### Document vide

**Cause** : Tous les textes sont abroges ou aucun chunk trouve.

**Solution** : Verifier les chunks dans la table `ccn` pour cet IDCC.

---

## Voir Aussi

- [import-ccn](./import-ccn.md) - Import des conventions collectives
- [recherche-ccn](./recherche-ccn.md) - Recherche dans les CCN

---

**Derniere mise a jour** : 16 janvier 2026
**Version** : 1.0.0
