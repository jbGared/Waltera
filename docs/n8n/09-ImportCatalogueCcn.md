# Import Catalogue CCN

**ID**: `ejeQoxCteHY0fAyS`
**Statut**: ⚠️ **Inactif** (à vérifier/corriger)
**Créé le**: Date inconnue
**Dernière mise à jour**: 15/01/2026

---

## 📋 Description

Workflow de synchronisation quotidienne du **catalogue complet** des Conventions Collectives Nationales disponibles en France depuis l'API Légifrance. Alimente une table de référence `ccn_catalogue` pour permettre au client de sélectionner les CCN à importer.

**⚠️ Ce workflow est actuellement INACTIF et nécessite probablement des corrections.**

---

## 🎯 Objectif

Maintenir à jour le catalogue exhaustif des CCN françaises pour permettre aux clients WALTERA de :
1. Consulter la liste complète des 650+ CCN disponibles
2. Sélectionner les CCN pertinentes pour leur activité
3. Déclencher l'import détaillé des CCN choisies

**Contexte France** :
- **~650 CCN** au total en France
- **~50 CCN principales** couvrent 80% des salariés
- Nouvelles CCN créées régulièrement
- CCN existantes peuvent être abrogées ou fusionnées

---

## 🔄 Triggers

### 1. **Start** (Manuel ou CRON)
- **Type** : Trigger manuel
- **Recommandation** : Ajouter un Schedule Trigger quotidien (ex: 3h du matin)
- **Fréquence suggérée** : Quotidienne ou hebdomadaire

---

## 🏗️ Architecture du Workflow

### Phase 1 : Récupération Liste Complète CCN

#### **Node: Légifrance - Liste Complète CCN**

**Type** : HTTP Request POST

**Endpoint** : `https://api.piste.gouv.fr/dila/legifrance/lf-engine-app/search`

**Méthode** : POST

**Headers** :
```json
{
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": "Bearer WDjQgVwAcxN5lK54MWyE41883Y0XVBhX23uSPYs7fkpCro8FwQtSBX"
}
```

**⚠️ PROBLÈME IDENTIFIÉ #1** : Token hardcodé dans le workflow au lieu d'utiliser OAuth2

**Body** :
```json
{
  "fond": "KALI_CONT",
  "recherche": {
    "champs": [],
    "filtres": [],
    "pageNumber": 1,
    "pageSize": 1000,
    "typePagination": "DEFAUT",
    "operateur": "ET"
  }
}
```

**Paramètres clés** :
- **`fond: "KALI_CONT"`** : Recherche dans le fonds KALI (conventions collectives)
- **`pageSize: 1000`** : Récupère jusqu'à 1000 CCN par page
- **`pageNumber: 1`** : Première page uniquement

**⚠️ PROBLÈME IDENTIFIÉ #2** : Pagination non gérée
- Si plus de 1000 CCN (cas actuel : ~650), pas de problème
- Mais si dépassement futur, certaines CCN ne seront pas récupérées

---

### Phase 2 : Extraction des Données

#### **Node: Extraire IDCC et Labels**

**Type** : Code JavaScript

**Fonctionnement** :
```javascript
// Extraire IDCC et libellés des CCN
const items = $input.all();
const ccnList = [];

items.forEach(item => {
  const results = item.json?.results || [];

  results.forEach(result => {
    try {
      // 1. Extraire le libellé
      const label = result.titles?.[0]?.title || null;

      // 2. Extraire l'IDCC depuis les sections
      let idcc = null;
      if (result.sections && result.sections.length > 0) {
        const section = result.sections[0];
        if (section.extracts && section.extracts.length > 0) {
          const extract = section.extracts[0];
          if (extract.values && extract.values.length > 0) {
            idcc = extract.values[0].replace(/<\/?mark>/g, '').trim();
          }
        }
      }

      // 3. Extraire le KALICONT
      const kaliContId = result.titles?.[0]?.id || result.titles?.[0]?.cid;

      // 4. Ajouter à la liste si IDCC et label valides
      if (idcc && label) {
        ccnList.push({
          idcc: idcc,
          label: label,
          kali_cont_id: kaliContId
        });
      }
    } catch (error) {
      // Erreur silencieuse
    }
  });
});

return ccnList.map(ccn => ({ json: ccn }));
```

**Données extraites** :
- **`idcc`** : Code IDCC (ex: "1000", "1486", "2098")
- **`label`** : Libellé de la CCN (ex: "Convention collective nationale des avocats")
- **`kali_cont_id`** : ID KALI du texte de base (ex: "KALICONT000005635812")

**⚠️ PROBLÈME IDENTIFIÉ #3** : Extraction fragile
- Dépend de la structure exacte de la réponse API Légifrance
- Si structure change, extraction échoue silencieusement
- Pas de validation des données extraites

---

### Phase 3 : Insertion en Base

#### **Node: Supabase - Insert CCN Catalogue**

**Type** : Supabase Node (UPSERT)

**Table cible** : `ccn_catalogue` (à créer si n'existe pas)

**Opération** : UPSERT (insert ou update si existe)

**⚠️ PROBLÈME IDENTIFIÉ #4** : Configuration incomplète
- Le node Supabase n'est pas configuré (pas de table, pas de credentials visibles)
- Besoin de spécifier la table `ccn_catalogue`
- Besoin de définir la clé unique (probablement `idcc`)

---

### Phase 4 : Node Non Connecté

#### **Node: Légifrance - List Conventions**

**Type** : HTTP Request POST (OAuth2)

**Statut** : ⚠️ **NON CONNECTÉ**

**Configuration** :
- Authentification OAuth2 (API PISTE Prod)
- Même endpoint et body que le premier node
- Batching configuré (10 items / 100ms)

**Note** : Ce node semble être une version améliorée avec OAuth2 mais n'est pas connecté au workflow. C'est probablement la bonne approche à utiliser.

---

## 🗄️ Schéma de Table Recommandé

### Table `ccn_catalogue`

```sql
CREATE TABLE public.ccn_catalogue (
  idcc TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  kali_cont_id TEXT,
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- 1-5 : CCN principales (top 50), 0 : autres
  employees_coverage INTEGER, -- Nombre de salariés couverts (optionnel)
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche full-text
CREATE INDEX idx_ccn_catalogue_label ON ccn_catalogue USING gin(to_tsvector('french', label));

-- Index pour priorité
CREATE INDEX idx_ccn_catalogue_priority ON ccn_catalogue(priority DESC);

-- Trigger mise à jour
CREATE OR REPLACE FUNCTION update_ccn_catalogue_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ccn_catalogue_timestamp
BEFORE UPDATE ON ccn_catalogue
FOR EACH ROW
EXECUTE FUNCTION update_ccn_catalogue_timestamp();
```

---

## 🚨 Problèmes Identifiés et Solutions

### Problème #1 : Token Hardcodé

**Problème** :
```javascript
"Authorization": "Bearer WDjQgVwAcxN5lK54MWyE41883Y0XVBhX23uSPYs7fkpCro8FwQtSBX"
```

**Impact** :
- Token peut expirer
- Pas de renouvellement automatique
- Risque de sécurité (token exposé)

**Solution** :
- Utiliser le node "Légifrance - List Conventions" (OAuth2)
- Supprimer le node avec token hardcodé
- OAuth2 gère le renouvellement automatique

---

### Problème #2 : Pagination Non Gérée

**Problème** :
```json
{
  "pageNumber": 1,
  "pageSize": 1000
}
```

**Impact** :
- Si plus de 1000 CCN (futur), certaines ne seront pas récupérées
- Pas de gestion multi-pages

**Solution** :
```javascript
// Pseudo-code
let pageNumber = 1;
let hasMorePages = true;
const allResults = [];

while (hasMorePages) {
  const response = await fetchPage(pageNumber);
  allResults.push(...response.results);

  hasMorePages = response.results.length === 1000;
  pageNumber++;
}
```

**Alternative n8n** : Utiliser un node "Loop Over Items" avec condition d'arrêt

---

### Problème #3 : Extraction Fragile

**Problème** :
```javascript
const idcc = extract.values[0].replace(/<\/?mark>/g, '').trim();
```

**Impact** :
- Si structure API change, extraction échoue
- Erreurs silencieuses (catch vide)
- Pas de logs pour debugging

**Solution** :
```javascript
try {
  // Extraction...
  if (idcc && label) {
    ccnList.push({ idcc, label, kali_cont_id });
  } else {
    console.log('⚠️ CCN ignorée (données incomplètes):', result);
  }
} catch (error) {
  console.error('❌ Erreur extraction CCN:', error, result);
  // Optionnel : Log dans Supabase pour monitoring
}
```

---

### Problème #4 : Configuration Supabase Incomplète

**Problème** :
- Node Supabase non configuré
- Table non spécifiée
- Clé unique non définie

**Solution** :
1. Créer la table `ccn_catalogue` (voir schéma ci-dessus)
2. Configurer le node Supabase :
   - **Operation** : UPSERT
   - **Table** : `ccn_catalogue`
   - **Unique Key** : `idcc`
   - **Columns** : `idcc`, `label`, `kali_cont_id`, `last_synced`

---

### Problème #5 : Pas de Trigger Quotidien

**Problème** :
- Workflow manuel uniquement
- Pas de synchronisation automatique

**Solution** :
Remplacer le node "Start" par un "Schedule Trigger" :
```javascript
{
  "rule": "0 3 * * *", // Tous les jours à 3h du matin
  "timezone": "Europe/Paris"
}
```

---

### Problème #6 : Pas de Gestion des CCN Abrogées

**Problème** :
- CCN abrogées restent actives dans la table
- Pas de détection des suppressions

**Solution** :
```javascript
// Après import
// 1. Marquer toutes les CCN comme "non synchronisées"
UPDATE ccn_catalogue SET last_synced = NULL;

// 2. Import des CCN (upsert avec last_synced = NOW())

// 3. Désactiver les CCN non synchronisées (abrogées)
UPDATE ccn_catalogue
SET active = false
WHERE last_synced IS NULL OR last_synced < NOW() - INTERVAL '1 day';
```

---

## 🔧 Workflow Corrigé Recommandé

### Architecture Améliorée

```
1. Schedule Trigger (3h du matin)
   ↓
2. Marquer CCN non synchronisées (Supabase)
   ↓
3. Loop Pagination
   ↓
   3.1. Légifrance API (OAuth2) → page N
   ↓
   3.2. Extraire IDCC/Labels (avec logs)
   ↓
   3.3. Upsert Supabase (batch)
   ↓
   3.4. Si page complète (1000 items) → page N+1
   ↓
4. Désactiver CCN non synchronisées
   ↓
5. Enrichir CCN principales (top 50 + priority)
   ↓
6. Email rapport (nombre CCN actives, nouvelles, abrogées)
```

---

## 📊 Données CCN France

### Statistiques

- **Total CCN** : ~650 conventions collectives nationales
- **CCN principales** : ~50 CCN couvrent 80% des salariés
- **Nouvelles CCN/an** : ~10-20 créations
- **Fusions/an** : ~5-10 fusions de CCN

### Top 50 CCN (Exemples)

| IDCC | Libellé | Salariés Couverts |
|------|---------|-------------------|
| 1090 | Services de l'automobile | ~500 000 |
| 1486 | Bureaux d'études techniques (Syntec) | ~450 000 |
| 1501 | Restauration rapide | ~400 000 |
| 1605 | Hôtellerie de plein air | ~50 000 |
| 2098 | Personnel des commerces de gros | ~350 000 |

**Note** : Ces chiffres sont indicatifs et évoluent régulièrement

---

## 🎯 Cas d'Usage

### 1. Interface de Sélection CCN

```typescript
// Frontend React
const { data: ccnCatalogue } = await supabase
  .from('ccn_catalogue')
  .select('*')
  .eq('active', true)
  .order('priority', { ascending: false })
  .order('label');

// Affichage avec sections
<Section title="CCN Principales (80% des salariés)">
  {ccnCatalogue.filter(c => c.priority > 0).map(ccn => (
    <CCNCard key={ccn.idcc} ccn={ccn} />
  ))}
</Section>

<Section title="Autres CCN">
  {ccnCatalogue.filter(c => c.priority === 0).map(ccn => (
    <CCNCard key={ccn.idcc} ccn={ccn} />
  ))}
</Section>
```

### 2. Recherche Full-Text

```sql
-- Recherche dans le catalogue
SELECT * FROM ccn_catalogue
WHERE to_tsvector('french', label) @@ plainto_tsquery('french', 'commerce')
AND active = true
ORDER BY priority DESC, label;
```

### 3. Import Déclenché par Sélection

```javascript
// Workflow : User sélectionne IDCC 1486
// → Déclenche walteraImportCcnVersionFinale avec IDCC 1486
// → Import complet du contenu de cette CCN
```

---

## 🔄 Différence avec walteraImportCcnVersionFinale

| Critère | Import Catalogue CCN | walteraImportCcnVersionFinale |
|---------|---------------------|------------------------------|
| **Objectif** | Liste complète CCN | Contenu détaillé CCN |
| **Données** | IDCC + Libellé + KALI ID | Textes complets + Embeddings |
| **Volumétrie** | 650 CCN (~1 KB chacune) | 1 CCN complète (~10-50 MB) |
| **Fréquence** | Quotidienne/Hebdomadaire | À la demande |
| **Endpoint** | `/search` (liste) | `/list/conventions` + `/consult` |
| **Table** | `ccn_catalogue` | `ccn` |
| **Durée** | < 1 minute | 30-60 minutes |

**Relation** :
1. **Import Catalogue** : Fournit la liste des CCN disponibles
2. **User** : Sélectionne les CCN pertinentes (ex: IDCC 1486, 2098, 1000)
3. **Import CCN** : Importe le contenu complet des CCN sélectionnées

---

## ✅ Plan de Correction

### Phase 1 : Corrections Urgentes (30min)

- [ ] Supprimer node avec token hardcodé
- [ ] Connecter node OAuth2 "Légifrance - List Conventions"
- [ ] Créer table `ccn_catalogue` dans Supabase
- [ ] Configurer node Supabase (table, upsert, clé unique)

### Phase 2 : Améliorations (1h)

- [ ] Ajouter Schedule Trigger (quotidien 3h)
- [ ] Gérer pagination (loop si pageSize = 1000)
- [ ] Améliorer extraction (logs + validation)
- [ ] Ajouter gestion CCN abrogées (active flag)

### Phase 3 : Enrichissement (1h)

- [ ] Identifier les 50 CCN principales (priority)
- [ ] Ajouter métadonnées (employees_coverage)
- [ ] Créer vue `v_ccn_catalogue_active`
- [ ] Email rapport de synchronisation

---

## 🚀 Recommandations

### À Court Terme

1. **Corriger et activer** ce workflow (1-2h de travail)
2. **Tester** avec l'API Légifrance en prod
3. **Valider** que les 650+ CCN sont bien récupérées
4. **Programmer** l'exécution quotidienne

### À Moyen Terme

1. **Enrichir** le catalogue avec données complémentaires :
   - Nombre de salariés couverts
   - Secteur d'activité
   - CCN principales (flag priority)
2. **Interface web** de sélection pour clients WALTERA
3. **Déclencher** automatiquement `walteraImportCcnVersionFinale` depuis l'interface

### À Long Terme

1. **Edge Function** pour recherche CCN (autocomplete)
2. **Dashboard** avec statistiques CCN (évolution, couverture)
3. **Notifications** lors de création/abrogation de CCN

---

## 💡 Alternative : Edge Function

### Pourquoi migrer vers Edge Function ?

**Avantages** :
- ✅ Code TypeScript plus maintenable
- ✅ Gestion pagination native
- ✅ Error handling robuste
- ✅ Peut être appelé depuis l'interface web
- ✅ Logs structurés

**Structure proposée** :
```typescript
// supabase/functions/sync-ccn-catalogue/index.ts

export async function handler(req: Request) {
  // 1. Authentification admin
  const user = await authenticateAdmin(req);

  // 2. Marquer CCN non synchronisées
  await markUnsyncedCCN();

  // 3. Pagination automatique
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const results = await fetchCCNPage(page);
    await upsertCCNBatch(results);
    hasMore = results.length === 1000;
    page++;
  }

  // 4. Désactiver CCN abrogées
  await deactivateAbrogatedCCN();

  // 5. Retour statistiques
  return { synced: totalSynced, new: newCCN, abrogated: abrogatedCCN };
}
```

**Priorité** : 🟡 **Moyenne** (après corrections n8n)

---

## 📚 Documentation Associée

- **Import CCN Détaillé** : [walteraImportCcnVersionFinale](./05-walteraImportCcnVersionFinale.md)
- **Agents CCN** : [walteraRagConsultationCcnVersionFinale](./06-walteraRagConsultationCcnVersionFinale.md), [CCN_Search_Tool](./07-CCN_Search_Tool.md)
- **API Légifrance** : https://api.piste.gouv.fr/dila/legifrance/lf-engine-app/

---

## 🎯 Conclusion

Ce workflow **Import Catalogue CCN** est essentiel pour :
1. Maintenir à jour la liste des 650+ CCN disponibles
2. Permettre aux clients de sélectionner les CCN pertinentes
3. Déclencher l'import détaillé des CCN choisies

**État actuel** : ⚠️ **Inactif et nécessite corrections**

**Priorité** : 🟡 **Moyenne** (après migration walteraApiGamma)

**Effort correction** : 1-2h (court terme) + 1-2h (enrichissements)

**ROI** : Élevé (fondamental pour la gestion CCN)

---

**Documentation créée par** : Claude Code + GARED
**Date** : 15 janvier 2026
**Version** : 1.0.0
