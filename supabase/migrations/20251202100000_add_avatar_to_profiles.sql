-- Migration: Ajout de l'avatar utilisateur
-- Date: 2025-12-02
-- Description: Ajoute le champ avatar_url à la table profiles et configure le stockage des avatars

-- ================================================
-- 1. Ajouter le champ avatar_url à la table profiles
-- ================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN public.profiles.avatar_url IS 'URL de la photo de profil stockée dans Supabase Storage';

-- ================================================
-- 2. Créer le bucket de stockage pour les avatars
-- ================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- bucket public pour afficher les avatars
  2097152, -- 2MB max par fichier
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- 3. Configurer les politiques RLS pour le bucket avatars
-- ================================================

-- Politique : Tout le monde peut voir les avatars (bucket public)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Politique : Les utilisateurs peuvent uploader leur propre avatar
-- Format du chemin : avatars/{user_id}/{filename}
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique : Les utilisateurs peuvent mettre à jour leur propre avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique : Les utilisateurs peuvent supprimer leur propre avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ================================================
-- 4. Fonction pour nettoyer l'ancien avatar lors d'un upload
-- ================================================

CREATE OR REPLACE FUNCTION public.delete_old_avatar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_avatar_path TEXT;
BEGIN
  -- Si l'avatar_url a changé et n'est pas null
  IF OLD.avatar_url IS NOT NULL AND OLD.avatar_url != NEW.avatar_url THEN
    -- Extraire le chemin du fichier depuis l'URL
    -- Format: https://{project}.supabase.co/storage/v1/object/public/avatars/{user_id}/{filename}
    old_avatar_path := regexp_replace(OLD.avatar_url, '^.*/avatars/', '');

    -- Supprimer l'ancien fichier du bucket
    DELETE FROM storage.objects
    WHERE bucket_id = 'avatars'
      AND name = old_avatar_path;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger pour nettoyer automatiquement les anciens avatars
DROP TRIGGER IF EXISTS cleanup_old_avatar ON public.profiles;
CREATE TRIGGER cleanup_old_avatar
  BEFORE UPDATE OF avatar_url ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_old_avatar();

-- ================================================
-- 5. Index pour améliorer les performances
-- ================================================

CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url
ON public.profiles(avatar_url)
WHERE avatar_url IS NOT NULL;

-- ================================================
-- 6. Commentaires pour la documentation
-- ================================================

COMMENT ON TRIGGER cleanup_old_avatar ON public.profiles IS
'Supprime automatiquement l''ancien fichier avatar du storage lors d''un changement d''avatar';

COMMENT ON FUNCTION public.delete_old_avatar IS
'Fonction trigger pour nettoyer les anciens fichiers avatars du storage';
