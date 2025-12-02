# Guide d'installation - Upload d'Avatar

## 🚀 Installation Rapide (5 minutes)

### Étape 1 : Ajouter le champ avatar_url (1 min)

1. Ouvrir **Supabase Dashboard** :
   👉 https://supabase.com/dashboard/project/djxbhqoswgmgogefqlra/sql/new

2. Copier et exécuter cette requête SQL :

```sql
-- Ajouter le champ avatar_url à la table profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN public.profiles.avatar_url IS 'URL de la photo de profil';
```

3. Cliquer sur **RUN** ▶️

✅ Le champ `avatar_url` est maintenant ajouté à la table `profiles`

---

### Étape 2 : Créer le bucket Storage (2 min)

1. Aller dans **Storage** :
   👉 https://supabase.com/dashboard/project/djxbhqoswgmgogefqlra/storage/buckets

2. Cliquer sur **New bucket**

3. Remplir les informations :
   - **Name** : `avatars`
   - **Public bucket** : ✅ **Oui** (cocher)
   - **File size limit** : `2097152` (2MB)
   - **Allowed MIME types** : `image/jpeg, image/png, image/webp, image/gif`

4. Cliquer sur **Create bucket**

✅ Le bucket `avatars` est créé

---

### Étape 3 : Configurer les politiques RLS (2 min)

1. Dans le bucket **avatars**, cliquer sur **Policies**

2. Cliquer sur **New policy** 4 fois pour créer ces politiques :

#### Politique 1 : Lecture publique

```sql
-- Nom : Avatars are publicly accessible
-- Operation : SELECT
-- Policy definition :

bucket_id = 'avatars'
```

#### Politique 2 : Upload par propriétaire

```sql
-- Nom : Users can upload their own avatar
-- Operation : INSERT
-- Policy definition :

bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Politique 3 : Modification par propriétaire

```sql
-- Nom : Users can update their own avatar
-- Operation : UPDATE
-- Policy definition :

bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Politique 4 : Suppression par propriétaire

```sql
-- Nom : Users can delete their own avatar
-- Operation : DELETE
-- Policy definition :

bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
```

✅ Les 4 politiques RLS sont configurées

---

### Étape 4 : Fonction de nettoyage automatique (Optionnel, 1 min)

Pour supprimer automatiquement les anciens avatars :

1. Retourner dans **SQL Editor** :
   👉 https://supabase.com/dashboard/project/djxbhqoswgmgogefqlra/sql/new

2. Copier et exécuter cette requête :

```sql
-- Fonction pour nettoyer l'ancien avatar
CREATE OR REPLACE FUNCTION public.delete_old_avatar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_avatar_path TEXT;
BEGIN
  IF OLD.avatar_url IS NOT NULL AND OLD.avatar_url != NEW.avatar_url THEN
    old_avatar_path := regexp_replace(OLD.avatar_url, '^.*/avatars/', '');

    DELETE FROM storage.objects
    WHERE bucket_id = 'avatars' AND name = old_avatar_path;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger pour appeler la fonction
DROP TRIGGER IF EXISTS cleanup_old_avatar ON public.profiles;
CREATE TRIGGER cleanup_old_avatar
  BEFORE UPDATE OF avatar_url ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_old_avatar();
```

✅ Le nettoyage automatique est activé

---

## ✅ Installation terminée !

Vous pouvez maintenant :

1. Se connecter à l'application : http://localhost:5173/login
2. Aller sur la page **Profil** : http://localhost:5173/profile
3. Cliquer sur l'icône **Camera** pour uploader une photo

---

## 🧪 Test rapide

1. Aller sur `/profile`
2. Cliquer sur l'icône Camera (en bas à droite de l'avatar)
3. Sélectionner une image JPG/PNG (< 2MB)
4. L'image devrait s'afficher immédiatement

---

## 📋 Vérifications

### Vérifier que le champ avatar_url existe

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'avatar_url';
```

Résultat attendu : `avatar_url | text`

### Vérifier que le bucket existe

1. Aller dans Storage
2. Le bucket `avatars` doit être visible et **public**

### Vérifier les politiques RLS

1. Dans le bucket `avatars` > **Policies**
2. 4 politiques doivent être actives (SELECT, INSERT, UPDATE, DELETE)

---

## 🐛 Problèmes courants

### L'upload ne fonctionne pas

**Vérifier :**
- Le bucket `avatars` existe et est **public**
- Les 4 politiques RLS sont actives
- La taille du fichier < 2MB
- Le format est JPG, PNG, WEBP ou GIF

### L'avatar ne s'affiche pas

**Vérifier :**
- L'URL dans `profiles.avatar_url` est correcte
- Le bucket `avatars` est bien **public**
- Le fichier existe dans Storage

---

## 📖 Documentation complète

Pour plus de détails, consultez :
- `AVATAR_UPLOAD_README.md` : Documentation complète
- `supabase/migrations/20251202100000_add_avatar_to_profiles.sql` : Migration SQL complète
