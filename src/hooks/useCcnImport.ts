import { useState, useEffect, useCallback } from 'react';
import {
  getAvailableCcn,
  getImportedCcn,
  triggerCcnImport,
  deleteCcn,
  type CcnAvailable,
  type CcnImported,
} from '@/services/ccnService';
import { toast } from 'sonner';

export interface UseCcnImportReturn {
  // État
  availableCcn: CcnAvailable[];
  importedCcn: CcnImported[];
  selectedIdcc: string[];
  isLoading: boolean;
  isImporting: boolean;
  searchQuery: string;

  // Setters
  setSelectedIdcc: (idcc: string[]) => void;
  setSearchQuery: (query: string) => void;

  // Actions
  toggleSelection: (idcc: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  importSelected: (userEmail: string, webhookUrl: string) => Promise<void>;
  deactivate: (idcc: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook personnalisé pour gérer l'import de CCN
 */
export function useCcnImport(): UseCcnImportReturn {
  const [availableCcn, setAvailableCcn] = useState<CcnAvailable[]>([]);
  const [importedCcn, setImportedCcn] = useState<CcnImported[]>([]);
  const [selectedIdcc, setSelectedIdcc] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Charger les données initiales
   */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [available, imported] = await Promise.all([
        getAvailableCcn(),
        getImportedCcn(),
      ]);
      setAvailableCcn(available);
      setImportedCcn(imported);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des CCN');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Rafraîchir les données
   */
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  /**
   * Charger les données au montage du composant
   */
  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Polling pour vérifier les imports en cours
   */
  useEffect(() => {
    const importingCcn = importedCcn.filter((ccn) => ccn.status === 'importing');

    if (importingCcn.length === 0) {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const imported = await getImportedCcn();
        setImportedCcn(imported);

        // Vérifier si des imports sont terminés
        const nowCompleted = imported.filter(
          (ccn) =>
            importingCcn.some((importing) => importing.idcc === ccn.idcc) &&
            ccn.status === 'active'
        );

        if (nowCompleted.length > 0) {
          nowCompleted.forEach((ccn) => {
            toast.success(`Import terminé pour ${ccn.label}`, {
              description: `${ccn.chunkCount} chunks importés`,
            });
          });

          // Rafraîchir les CCN disponibles
          const available = await getAvailableCcn();
          setAvailableCcn(available);
        }
      } catch (error) {
        console.error('Erreur lors du polling:', error);
      }
    }, 30000); // Polling toutes les 30 secondes

    return () => clearInterval(intervalId);
  }, [importedCcn]);

  /**
   * Toggle la sélection d'un IDCC
   */
  const toggleSelection = useCallback((idcc: string) => {
    setSelectedIdcc((prev) =>
      prev.includes(idcc)
        ? prev.filter((id) => id !== idcc)
        : [...prev, idcc]
    );
  }, []);

  /**
   * Sélectionner toutes les CCN filtrées
   */
  const selectAll = useCallback(() => {
    const filtered = availableCcn.filter(
      (ccn) =>
        ccn.idcc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ccn.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSelectedIdcc(filtered.map((ccn) => ccn.idcc));
  }, [availableCcn, searchQuery]);

  /**
   * Désélectionner toutes les CCN
   */
  const clearSelection = useCallback(() => {
    setSelectedIdcc([]);
  }, []);

  /**
   * Importer les CCN sélectionnées
   * Note: On ne pré-enregistre plus dans idcc_ref - le workflow N8N
   * est responsable d'ajouter les CCN quand l'import réussit
   */
  const importSelected = useCallback(
    async (userEmail: string, webhookUrl: string) => {
      if (selectedIdcc.length === 0) {
        toast.error('Aucune CCN sélectionnée');
        return;
      }

      try {
        setIsImporting(true);

        // Déclencher l'import via le webhook n8n
        // Le workflow N8N est responsable d'ajouter à idcc_ref quand l'import réussit
        const result = await triggerCcnImport(selectedIdcc, userEmail, webhookUrl);

        if (result.success) {
          toast.success(`Import démarré pour ${selectedIdcc.length} CCN`, {
            description: 'L\'import peut prendre plusieurs minutes. Les CCN apparaîtront comme importées une fois terminé.',
          });

          // Vider la sélection
          setSelectedIdcc([]);
        } else {
          toast.error('Erreur lors de l\'import', {
            description: result.message,
          });
        }
      } catch (error) {
        console.error('Erreur lors de l\'import:', error);
        toast.error('Erreur lors de l\'import des CCN');
      } finally {
        setIsImporting(false);
        // Rafraîchir les données dans tous les cas
        await loadData();
      }
    },
    [selectedIdcc, loadData]
  );

  /**
   * Supprimer une CCN
   */
  const deactivate = useCallback(
    async (idcc: string) => {
      try {
        await deleteCcn(idcc);
        toast.success('CCN supprimée avec succès');
        await loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression de la CCN');
      }
    },
    [loadData]
  );

  return {
    availableCcn,
    importedCcn,
    selectedIdcc,
    isLoading,
    isImporting,
    searchQuery,
    setSelectedIdcc,
    setSearchQuery,
    toggleSelection,
    selectAll,
    clearSelection,
    importSelected,
    deactivate,
    refresh,
  };
}
