/**
 * Context pour gérer le state du formulaire de devis
 * Centralise la logique et évite le prop drilling
 */

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { DevisOutput, Gamme } from '@/services/tarificateur';
import type { DevisFormData } from '@/services/devis';

interface DevisContextValue {
  // State
  formData: DevisFormData;
  devis: DevisOutput | null;
  isLoading: boolean;
  hasConjoint: boolean;

  // Actions
  setFormData: React.Dispatch<React.SetStateAction<DevisFormData>>;
  setDevis: React.Dispatch<React.SetStateAction<DevisOutput | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setHasConjoint: React.Dispatch<React.SetStateAction<boolean>>;

  // Helper methods
  updateField: <K extends keyof DevisFormData>(field: K, value: DevisFormData[K]) => void;
  addEnfant: () => void;
  removeEnfant: (index: number) => void;
  updateEnfant: (index: number, field: 'prenom' | 'nom' | 'dateNaissance', value: string) => void;
}

const DevisContext = createContext<DevisContextValue | undefined>(undefined);

export function useDevisContext() {
  const context = useContext(DevisContext);
  if (!context) {
    throw new Error('useDevisContext must be used within a DevisProvider');
  }
  return context;
}

interface DevisProviderProps {
  children: ReactNode;
}

export function DevisProvider({ children }: DevisProviderProps) {
  const [formData, setFormData] = useState<DevisFormData>({
    gamme: '' as Gamme,
    codePostal: '',
    dateEffet: new Date().toISOString().split('T')[0], // Date du jour par défaut
    assurePrenom: '',
    assureNom: '',
    assureNaissance: '',
    assureEmail: '',
    assureSeul: true,
    conjointPrenom: '',
    conjointNom: '',
    conjointNaissance: '',
    enfants: [],
    option: 3,
    surcomplementaire: false,
    renfortHospi: false,
    commission: 10,
    adresseComplete: '',
    rgpdConsent: false,
  });

  const [devis, setDevis] = useState<DevisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasConjoint, setHasConjoint] = useState(false);

  // Helper method pour mettre à jour un champ
  const updateField = useCallback(<K extends keyof DevisFormData>(
    field: K,
    value: DevisFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Ajouter un enfant
  const addEnfant = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      enfants: [...prev.enfants, { prenom: '', nom: '', dateNaissance: '' }],
    }));
  }, []);

  // Supprimer un enfant
  const removeEnfant = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      enfants: prev.enfants.filter((_, i) => i !== index),
    }));
  }, []);

  // Mettre à jour un enfant
  const updateEnfant = useCallback((
    index: number,
    field: 'prenom' | 'nom' | 'dateNaissance',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      enfants: prev.enfants.map((e, i) =>
        i === index ? { ...e, [field]: value } : e
      ),
    }));
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value: DevisContextValue = useMemo(
    () => ({
      formData,
      devis,
      isLoading,
      hasConjoint,
      setFormData,
      setDevis,
      setIsLoading,
      setHasConjoint,
      updateField,
      addEnfant,
      removeEnfant,
      updateEnfant,
    }),
    [
      formData,
      devis,
      isLoading,
      hasConjoint,
      updateField,
      addEnfant,
      removeEnfant,
      updateEnfant,
    ]
  );

  return <DevisContext.Provider value={value}>{children}</DevisContext.Provider>;
}
