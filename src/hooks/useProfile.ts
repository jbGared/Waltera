import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentProfile, updateCurrentProfile, type Profile } from '@/services/profiles';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    setIsLoading(true);
    const data = await getCurrentProfile();
    setProfile(data);
    setIsLoading(false);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    const success = await updateCurrentProfile(updates);
    if (success) {
      await loadProfile(); // Recharger les données
    }
    return success;
  };

  return {
    profile,
    isLoading,
    updateProfile,
    reload: loadProfile,
  };
}
