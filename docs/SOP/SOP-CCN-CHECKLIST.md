# CHECKLIST CCN - Points critiques

**Ce document est un récapitulatif des points essentiels de la SOP CCN.**
**Document de référence complet : [SOP-CCN-Conventions-Collectives.md](./SOP-CCN-Conventions-Collectives.md)**

---

## 4 Fonctionnalités à développer

### 1. Edge Function `recherche-ccn`
**Remplace** : Workflows N8N 06 et 07

**Points critiques** :
- [ ] Streaming SSE (comme `recherche-contrats`)
- [ ] Classification LLM des requêtes
- [ ] Identification auto de l'IDCC depuis la question
- [ ] **HIÉRARCHIE JURIDIQUE** : P1 Arrêtés > P2 Avenants > P3 Accords > P4 Annexes > P5 Texte base
- [ ] **EXCLURE les textes ABROGE** (seulement VIGUEUR, VIGUEUR_ETEN, VIGUEUR_NON_ETEN, VIGUEUR_DIFF)
- [ ] Tri : priorité juridique PUIS similarité sémantique

---

### 2. Notifications modifications CCN
**Workflow** : Extension du workflow 05 ou Edge Function dédiée

**Points critiques** :
- [ ] Détecter TOUTES les modifications (NEW, MODIFIED, ABROGATED)
- [ ] Filtrer pour notification UNIQUEMENT si :
  - CCN liée à un client WALTERA (via `client_idcc`)
  - ET contient un terme de la liste métier (~90 termes)
- [ ] Analyser l'impact sur les documents contractuels des clients
- [ ] Envoyer email avec : CCN, résumé, termes détectés, clients impactés, analyse d'impact

---

### 3. Page gestion CCN (`/ccn/gestion`)
**Remplace** : Page actuelle au design non satisfaisant

**Points critiques** :
- [ ] Section CCN actives (depuis `idcc_ref`)
- [ ] Catalogue complet depuis fichier DARES : `https://travail-emploi.gouv.fr/sites/travail-emploi/files/2025-12/Dares_donnes_Identifiant_convention_collective_Janvier26.xlsx`
- [ ] Import via webhook N8N 05
- [ ] Design moderne et épuré
- [ ] Recherche/filtrage

---

### 4. Export CCN complet
**Nouveau** : Téléchargement d'une CCN entière

**Points critiques** :
- [ ] Format PDF (priorité) et Markdown
- [ ] Structure respectant la hiérarchie juridique
- [ ] Table des matières
- [ ] Métadonnées (date, nb textes, source)

---

## Règles métier essentielles

### Hiérarchie juridique (CRITIQUE)
```
P1 - ARRETE_EXTENSION, ARRETE_AGREMENT
P2 - AVENANT
P3 - ACCORD_SALAIRES, ACCORD_PREVOYANCE, ACCORD_FORMATION, ACCORD_RETRAITE
P4 - ANNEXE
P5 - TEXTE_BASE
```

### États juridiques valides
```
VIGUEUR | VIGUEUR_ETEN | VIGUEUR_NON_ETEN | VIGUEUR_DIFF
```
**EXCLURE** : `ABROGE`

### Termes métier pour notifications (extrait)
```
mutuelle, prévoyance, garanties, cotisation, portabilité,
IJSS, incapacité, invalidité, rente, taux, répartition,
frais de santé, hospitalisation, optique, dentaire...
```
Liste complète : Section 8 du document principal

---

## Tables Supabase à utiliser

| Table | Usage |
|-------|-------|
| `ccn` | Documents CCN vectorisés |
| `idcc_ref` | Référentiel IDCC actifs |
| `client_idcc` | Liaison clients <-> IDCC |
| `ccn.changes` | Changelog modifications |
| `ccn.notifications` | Suivi notifications (à créer) |
| `ccn.catalogue` | Catalogue complet CCN (à créer) |

---

## RPC à utiliser/modifier

### `match_ccn`
```sql
-- Doit trier par :
-- 1. Priorité juridique (priority ASC)
-- 2. Similarité (similarity DESC)
-- ET filtrer par état juridique valide
```

---

## Tests de validation

| Fonctionnalité | Test critique |
|----------------|---------------|
| recherche-ccn | Arrêtés P1 apparaissent AVANT Texte de base P5 |
| recherche-ccn | Textes ABROGE JAMAIS dans les résultats |
| Notifications | Pas de notification si aucun terme métier |
| Notifications | Notification si terme + client lié |
| Page gestion | Catalogue charge depuis DARES |
| Export | PDF généré avec hiérarchie correcte |

---

*Checklist à consulter avant chaque développement CCN*
