# Upload d'Avatar Utilisateur - WALTERA

## Vue d'ensemble

Fonctionnalité d'upload de photo de profil pour les utilisateurs de WALTERA. Les avatars sont stockés dans Supabase Storage avec gestion automatique des anciens fichiers.

## Fonctionnalités

✅ Upload d'image (JPG, PNG, WEBP, GIF)
✅ Taille maximale : 2MB
✅ Prévisualisation avant upload
✅ Suppression d'avatar
✅ Nettoyage automatique des anciens fichiers
✅ Interface intuitive avec icône Camera
✅ Affichage d'initiales si pas d'avatar

## Architecture

### 1. Base de données

**Table `profiles`** - Nouveau champ ajouté :
```sql
avatar_url TEXT -- URL publique de l'avatar dans Supabase Storage
```

### 2. Supabase Storage

**Bucket `avatars`** :
- Type : Public (pour afficher les avatars)
- Taille max par fichier : 2MB
- Formats autorisés : JPG, PNG, WEBP, GIF
- Structure des chemins : `{user_id}/{filename}`

**Politiques RLS** :
- ✅ Lecture publique (tout le monde peut voir les avatars)
- ✅ Upload/Update/Delete : uniquement par le propriétaire

### 3. Composants

**`/src/components/AvatarUpload.tsx`**
- Composant React pour l'upload d'avatar
- Gère la sélection, prévisualisation, upload et suppression
- Validation côté client (type, taille)
- Gestion d'erreurs avec messages utilisateur

**`/src/pages/Profile.tsx`**
- Intégration du composant AvatarUpload
- Affichage de l'avatar ou des initiales

### 4. Services

**`/src/services/profiles.ts`**
- `uploadAvatar(file: File)` : Upload un avatar et met à jour le profil
- `deleteAvatar()` : Supprime l'avatar et nettoie le storage

**Logique de l'upload** :
1. Validation du fichier (type, taille)
2. Suppression de l'ancien avatar s'il existe
3. Upload du nouveau fichier avec nom unique
4. Génération de l'URL publique
5. Mise à jour du profil avec la nouvelle URL

## Installation

### Étape 1 : Appliquer la migration SQL

Deux options :

#### Option A : Via Supabase Dashboard (Recommandé)

1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet : `djxbhqoswgmgogefqlra`
3. Aller dans **SQL Editor**
4. Copier le contenu de `supabase/migrations/20251202100000_add_avatar_to_profiles.sql`
5. Coller et exécuter la requête
6. Vérifier que :
   - Le champ `avatar_url` a été ajouté à la table `profiles`
   - Le bucket `avatars` est créé dans **Storage**
   - Les politiques RLS sont actives

#### Option B : Via CLI Supabase (si configuré)

```bash
# Si Supabase CLI est installé et configuré
supabase db push

# Ou appliquer manuellement la migration
supabase db execute -f supabase/migrations/20251202100000_add_avatar_to_profiles.sql
```

### Étape 2 : Vérifier le bucket Storage

1. Dans Supabase Dashboard > **Storage**
2. Vérifier que le bucket `avatars` existe
3. Configuration du bucket :
   - Public : ✅ Oui
   - File size limit : 2MB
   - Allowed MIME types : image/jpeg, image/png, image/webp, image/gif

### Étape 3 : Vérifier les politiques RLS

1. Dans Supabase Dashboard > **Storage** > `avatars` > **Policies**
2. Vérifier que 4 politiques sont actives :
   - `Avatars are publicly accessible` (SELECT)
   - `Users can upload their own avatar` (INSERT)
   - `Users can update their own avatar` (UPDATE)
   - `Users can delete their own avatar` (DELETE)

### Étape 4 : Tester

1. Se connecter à l'application
2. Aller sur la page **Profil** (`/profile`)
3. Cliquer sur l'icône **Camera** sur l'avatar
4. Sélectionner une image (JPG, PNG, WEBP ou GIF < 2MB)
5. Vérifier que :
   - L'image est uploadée
   - L'avatar s'affiche correctement
   - L'URL est stockée dans `profiles.avatar_url`
   - Le fichier est dans le bucket `avatars`

## Utilisation

### Pour l'utilisateur

1. **Ajouter/Modifier une photo** :
   - Cliquer sur l'icône Camera (en bas à droite de l'avatar)
   - Sélectionner une image depuis son ordinateur
   - L'image s'uploade automatiquement
   - L'avatar se met à jour

2. **Supprimer une photo** :
   - Cliquer sur le bouton X rouge (en haut à droite de l'avatar)
   - L'avatar est supprimé et remplacé par les initiales

### Contraintes

- **Formats acceptés** : JPG, PNG, WEBP, GIF
- **Taille maximale** : 2MB
- **Nettoyage automatique** : L'ancien avatar est supprimé lors d'un nouvel upload

## Structure des fichiers

```
/Users/jbgared/app/waltera/
├── supabase/
│   └── migrations/
│       └── 20251202100000_add_avatar_to_profiles.sql  # Migration SQL
├── src/
│   ├── components/
│   │   └── AvatarUpload.tsx                           # Composant d'upload
│   ├── pages/
│   │   └── Profile.tsx                                # Page de profil
│   ├── services/
│   │   └── profiles.ts                                # Service d'upload/suppression
│   └── hooks/
│       └── useProfile.ts                              # Hook pour le profil
└── AVATAR_UPLOAD_README.md                            # Cette documentation
```

## Sécurité

### Validation côté client

- Vérification du type MIME (image/jpeg, image/png, image/webp, image/gif)
- Vérification de la taille (max 2MB)
- Messages d'erreur explicites

### Validation côté serveur (Supabase)

- Politiques RLS : seul le propriétaire peut uploader/modifier/supprimer son avatar
- Bucket configuré avec `allowed_mime_types` et `file_size_limit`
- Isolation des fichiers par user_id dans les chemins

### Nettoyage automatique

- Trigger SQL `cleanup_old_avatar` :
  - Détecte les changements de `avatar_url`
  - Supprime automatiquement l'ancien fichier du storage
  - Évite l'accumulation de fichiers orphelins

## Troubleshooting

### Erreur : "Type de fichier non autorisé"

**Cause** : Le fichier n'est pas une image ou le format n'est pas supporté

**Solution** : Utiliser JPG, PNG, WEBP ou GIF uniquement

### Erreur : "Fichier trop volumineux"

**Cause** : Le fichier dépasse 2MB

**Solution** : Compresser l'image avant upload

### Erreur : "Erreur lors de l'upload"

**Causes possibles** :
1. Bucket `avatars` n'existe pas
2. Politiques RLS mal configurées
3. Problème de connexion

**Solution** :
1. Vérifier que la migration a été appliquée
2. Vérifier les politiques dans Supabase Dashboard
3. Vérifier la console navigateur pour plus de détails

### L'avatar ne s'affiche pas

**Causes possibles** :
1. Le bucket n'est pas public
2. L'URL est incorrecte
3. Le fichier a été supprimé manuellement

**Solution** :
1. Vérifier que le bucket `avatars` est **public**
2. Vérifier l'URL dans `profiles.avatar_url`
3. Re-uploader l'avatar

### L'ancien avatar ne se supprime pas

**Cause** : Le trigger `cleanup_old_avatar` n'est pas actif

**Solution** :
1. Vérifier que la migration a été appliquée
2. Vérifier dans Supabase Dashboard > **Database** > **Triggers**
3. Ré-appliquer la migration si nécessaire

## URL Publique des avatars

Format de l'URL :
```
https://djxbhqoswgmgogefqlra.supabase.co/storage/v1/object/public/avatars/{user_id}/avatar-{timestamp}.{ext}
```

Exemple :
```
https://djxbhqoswgmgogefqlra.supabase.co/storage/v1/object/public/avatars/123e4567-e89b-12d3-a456-426614174000/avatar-1733126400000.jpg
```

## Performance

### Cache

- Les fichiers sont servis avec `Cache-Control: 3600` (1 heure)
- Permet de réduire la bande passante et d'améliorer les temps de chargement

### Nettoyage automatique

- Les anciens avatars sont supprimés automatiquement
- Évite l'accumulation de fichiers inutilisés
- Optimise l'espace de stockage

## Support

En cas de problème :

1. Vérifier les logs Supabase : **Dashboard > Logs > Storage Logs**
2. Vérifier la console navigateur (F12) pour les erreurs JavaScript
3. Vérifier que le bucket `avatars` existe et est configuré correctement
4. Vérifier que les politiques RLS sont actives

## Améliorations futures possibles

- [ ] Recadrage d'image avant upload
- [ ] Compression automatique des images
- [ ] Support de la webcam pour prendre une photo
- [ ] Miniatures générées automatiquement
- [ ] Rotation d'image
- [ ] Filtres et effets
