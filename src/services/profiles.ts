import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  receive_ccn_alerts: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Récupérer le profil de l'utilisateur connecté
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Erreur récupération profil:', error);
    return null;
  }

  return data;
}

/**
 * Mettre à jour le profil de l'utilisateur connecté
 */
export async function updateCurrentProfile(updates: Partial<Omit<Profile, 'id' | 'email' | 'created_at' | 'updated_at'>>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { error } = await supabase
    .from('profiles')
    .update(updates as unknown as never)
    .eq('id', user.id);

  if (error) {
    console.error('Erreur mise à jour profil:', error);
    return false;
  }

  return true;
}

/**
 * Récupérer tous les profils (admin uniquement)
 */
export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur récupération profils:', error);
    return [];
  }

  return data || [];
}

/**
 * Vérifier si l'utilisateur actuel est admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.role === 'admin';
}

/**
 * Mettre à jour un profil par son ID (admin uniquement)
 */
export async function updateProfileById(
  profileId: string,
  updates: Partial<Omit<Profile, 'id' | 'email' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update(updates as unknown as never)
    .eq('id', profileId);

  if (error) {
    console.error('Erreur mise à jour profil:', error);
    return false;
  }

  return true;
}

/**
 * Uploader un avatar pour un utilisateur spécifique (admin uniquement)
 * @param userId - L'ID de l'utilisateur
 * @param file - Le fichier image à uploader
 * @param currentAvatarUrl - L'URL actuelle de l'avatar (pour suppression)
 * @returns L'URL publique de l'avatar ou null en cas d'erreur
 */
export async function uploadAvatarForUser(
  userId: string,
  file: File,
  currentAvatarUrl?: string | null
): Promise<string | null> {
  // Vérifier le type de fichier
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    console.error('Type de fichier non autorisé:', file.type);
    return null;
  }

  // Vérifier la taille (2MB max)
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    console.error('Fichier trop volumineux:', file.size);
    return null;
  }

  // Générer un nom de fichier unique
  const fileExt = file.name.split('.').pop();
  const timestamp = Date.now();
  const fileName = `avatar-${timestamp}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  try {
    // Supprimer l'ancien avatar s'il existe
    if (currentAvatarUrl) {
      const oldPath = currentAvatarUrl.split('/avatars/')[1];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }
    }

    // Uploader le nouveau fichier
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erreur upload avatar:', uploadError);
      return null;
    }

    // Générer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Mettre à jour le profil avec la nouvelle URL
    const updateSuccess = await updateProfileById(userId, { avatar_url: publicUrl });

    if (!updateSuccess) {
      console.error('Erreur mise à jour profil avec avatar_url');
      return null;
    }

    return publicUrl;
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return null;
  }
}

/**
 * Supprimer l'avatar d'un utilisateur spécifique (admin uniquement)
 */
export async function deleteAvatarForUser(
  userId: string,
  currentAvatarUrl: string
): Promise<boolean> {
  try {
    const filePath = currentAvatarUrl.split('/avatars/')[1];

    if (filePath) {
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (deleteError) {
        console.error('Erreur suppression avatar:', deleteError);
        return false;
      }
    }

    // Mettre à jour le profil pour retirer l'URL
    return await updateProfileById(userId, { avatar_url: null });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return false;
  }
}

/**
 * Uploader un avatar pour l'utilisateur connecté
 * @param file - Le fichier image à uploader
 * @returns L'URL publique de l'avatar ou null en cas d'erreur
 */
export async function uploadAvatar(file: File): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('Utilisateur non authentifié');
    return null;
  }

  // Vérifier le type de fichier
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    console.error('Type de fichier non autorisé:', file.type);
    return null;
  }

  // Vérifier la taille (2MB max)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    console.error('Fichier trop volumineux:', file.size);
    return null;
  }

  // Générer un nom de fichier unique avec l'extension d'origine
  const fileExt = file.name.split('.').pop();
  const timestamp = Date.now();
  const fileName = `avatar-${timestamp}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  try {
    // Supprimer l'ancien avatar s'il existe
    const currentProfile = await getCurrentProfile();
    if (currentProfile?.avatar_url) {
      const oldPath = currentProfile.avatar_url.split('/avatars/')[1];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }
    }

    // Uploader le nouveau fichier
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erreur upload avatar:', uploadError);
      return null;
    }

    // Générer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Mettre à jour le profil avec la nouvelle URL
    const updateSuccess = await updateCurrentProfile({ avatar_url: publicUrl });

    if (!updateSuccess) {
      console.error('Erreur mise à jour profil avec avatar_url');
      return null;
    }

    return publicUrl;
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return null;
  }
}

/**
 * Supprimer l'avatar de l'utilisateur connecté
 * @returns true si succès, false sinon
 */
export async function deleteAvatar(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('Utilisateur non authentifié');
    return false;
  }

  try {
    const currentProfile = await getCurrentProfile();

    if (!currentProfile?.avatar_url) {
      return true; // Pas d'avatar à supprimer
    }

    // Extraire le chemin du fichier depuis l'URL
    const filePath = currentProfile.avatar_url.split('/avatars/')[1];

    if (filePath) {
      // Supprimer le fichier du storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (deleteError) {
        console.error('Erreur suppression avatar:', deleteError);
        return false;
      }
    }

    // Mettre à jour le profil pour retirer l'URL
    const updateSuccess = await updateCurrentProfile({ avatar_url: null });

    return updateSuccess;
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return false;
  }
}
