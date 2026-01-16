# Configuration RLS Supabase pour le Tarificateur

## 🔍 Diagnostic Effectué

### ✅ Données Présentes
- **zones_sante** : 199 lignes ✅
- **tarifs_sante** : 5868 lignes ✅
- **Paris (75)** : Trouvé → Z02 ✅
- **Eure (27)** : Trouvé → Z01 ✅

### ❌ Problème Identifié

Le message d'erreur "Zone non trouvée" alors que les données existent indique un **problème de permissions RLS** (Row Level Security).

Les requêtes depuis le frontend utilisent la clé `ANON` qui est bloquée par le RLS activé sur les tables.

---

## 🔧 Solution : Activer les Policies RLS

### Étape 1 : Ouvrir Supabase Dashboard

1. Allez sur : https://syxsacbciqwrahjdixuc.supabase.co
2. Connectez-vous
3. Cliquez sur **SQL Editor** dans le menu gauche

### Étape 2 : Exécuter le SQL

Copiez-collez et exécutez ce script SQL :

```sql
-- Configuration RLS pour les tables du tarificateur WALTERA

-- 1. Activer RLS sur zones_sante
ALTER TABLE zones_sante ENABLE ROW LEVEL SECURITY;

-- 2. Créer une policy pour permettre la lecture publique des zones
DROP POLICY IF EXISTS "Allow public read access to zones" ON zones_sante;
CREATE POLICY "Allow public read access to zones"
ON zones_sante
FOR SELECT
USING (true);

-- 3. Activer RLS sur tarifs_sante
ALTER TABLE tarifs_sante ENABLE ROW LEVEL SECURITY;

-- 4. Créer une policy pour permettre la lecture publique des tarifs
DROP POLICY IF EXISTS "Allow public read access to tarifs" ON tarifs_sante;
CREATE POLICY "Allow public read access to tarifs"
ON tarifs_sante
FOR SELECT
USING (true);
```

### Étape 3 : Vérifier

Cliquez sur **Run** (ou Ctrl+Enter)

Vous devriez voir :
```
Success. No rows returned
```

---

## 🎯 Alternative : Via l'Interface

Si vous préférez l'interface graphique :

### Pour `zones_sante`

1. Allez dans **Authentication** → **Policies**
2. Sélectionnez la table `zones_sante`
3. Cliquez sur **New Policy**
4. Sélectionnez **Enable read access for all users**
5. Policy name : "Allow public read access to zones"
6. Target roles : `public`, `anon`, `authenticated`
7. Policy definition : `true`
8. Cliquez **Review** puis **Save policy**

### Pour `tarifs_sante`

Répétez les mêmes étapes pour la table `tarifs_sante`.

---

## ✅ Après Configuration

Une fois les policies créées :

1. **Rafraîchissez** l'application : http://localhost:5173/tarificateur
2. **Remplissez le formulaire** :
   - Adresse : Paris ou autre
   - Date de naissance : n'importe quelle date
3. **Le calcul devrait fonctionner** ! 🎉

---

## 🧪 Test de Vérification

Pour vérifier que les policies fonctionnent, exécutez dans le terminal :

```bash
node test-supabase.mjs
```

Vous devriez voir :
```
✅ Connexion OK
✅ 199 lignes trouvées (zones)
✅ 5868 lignes trouvées (tarifs)
✅ Paris trouvé
✅ Eure trouvée
```

---

## 📝 Explication

### Pourquoi ce problème ?

Par défaut, Supabase active le **Row Level Security** (RLS) sur les tables pour protéger les données. Cela signifie que :

- ❌ Sans policy : Personne ne peut lire les données
- ✅ Avec policy `USING (true)` : Tout le monde peut lire (lecture seule)

### Est-ce sécurisé ?

Pour le tarificateur, **OUI** :
- Les tarifs sont publics (affichés aux clients)
- Les zones sont publiques (informations tarifaires)
- Pas de données sensibles
- Lecture seule (pas d'écriture)

---

## 🚀 Résultat Attendu

Après avoir configuré les policies RLS, le tarificateur devrait :

1. ✅ Trouver les zones correctement
2. ✅ Récupérer les tarifs depuis Supabase
3. ✅ Calculer le devis automatiquement
4. ✅ Afficher le résultat dans le container sticky

**Le problème "Zone non trouvée" devrait disparaître complètement !**

---

**Veuillez exécuter le SQL dans Supabase Dashboard, puis testez à nouveau le tarificateur.** 🎯
