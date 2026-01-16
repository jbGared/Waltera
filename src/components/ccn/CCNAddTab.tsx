import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Info } from 'lucide-react';
import CCNSelector from './CCNSelector';
import { useToast } from '@/hooks/use-toast';

interface CCNAddTabProps {
  onImportSuccess?: () => void;
}

export default function CCNAddTab({ onImportSuccess }: CCNAddTabProps) {
  const [importedIDCCs, setImportedIDCCs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchImportedIDCCs();
  }, []);

  async function fetchImportedIDCCs() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('ccn')
        .select('idcc') as any;

      if (error) {
        console.error('Erreur lors de la récupération des IDCC importés:', error);
        return;
      }

      if (!data) {
        setImportedIDCCs([]);
        return;
      }

      // Extraire les IDCC
      const idccs = data.map((ccn: any) => ccn.idcc);
      setImportedIDCCs(idccs);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleImportCCN(idcc: string, titre: string) {
    try {
      // Récupérer les infos complètes depuis le référentiel
      const { data: referentielData, error: refError } = await supabase
        .from('idcc_ref')
        .select('kalicont_id')
        .eq('idcc', idcc)
        .single();

      if (refError) {
        console.error('Erreur référentiel:', refError);
      }

      // Insérer la CCN dans idcc_ref si non existante
      const { error: insertError } = await supabase
        .from('idcc_ref')
        .upsert({
          idcc,
          label: titre,
          kalicont_id: referentielData?.kalicont_id || null,
          active: true,
        }, { onConflict: 'idcc' });

      if (insertError) {
        console.error('Erreur insertion:', insertError);
        toast({
          title: 'Erreur',
          description: `Erreur lors de l'ajout de la CCN: ${insertError.message}`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Import initié',
        description: `L'import de la CCN ${idcc} - ${titre} a été démarré. Cela peut prendre quelques minutes.`,
      });

      // TODO: Déclencher l'import réel des documents depuis Légifrance
      // Pour l'instant, on simule avec un timeout qui met à jour le statut

      // Rafraîchir la liste
      setTimeout(() => {
        fetchImportedIDCCs();
        if (onImportSuccess) {
          onImportSuccess();
        }
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'import de la CCN.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Carte d'information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Info className="h-5 w-5" />
            Comment ça marche ?
          </CardTitle>
          <CardDescription className="text-blue-700">
            Importez une convention collective depuis le référentiel national
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Étape 1 :</strong> Recherchez la convention collective par son code IDCC ou son titre dans la liste ci-dessous.
          </p>
          <p>
            <strong>Étape 2 :</strong> Sélectionnez la CCN souhaitée dans le menu déroulant.
          </p>
          <p>
            <strong>Étape 3 :</strong> Cliquez sur "Importer" pour lancer l'import des documents depuis Légifrance.
          </p>
          <p className="text-xs mt-4 text-blue-600">
            Les CCN déjà importées sont marquées d'un badge vert et ne peuvent pas être importées à nouveau.
          </p>
        </CardContent>
      </Card>

      {/* Carte de sélection et import */}
      <Card className="border-2 border-dashed border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Plus className="h-5 w-5" />
            Importer une convention collective
          </CardTitle>
          <CardDescription>
            Sélectionnez une CCN parmi le référentiel national ({importedIDCCs.length} déjà importées)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <span className="ml-3 text-gray-600">Chargement des données...</span>
            </div>
          ) : (
            <CCNSelector
              importedIDCCs={importedIDCCs}
              onImport={handleImportCCN}
            />
          )}
        </CardContent>
      </Card>

      {/* Statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statistiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{importedIDCCs.length}</div>
              <div className="text-sm text-gray-600 mt-1">CCN importées</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {/* Placeholder - à calculer depuis le référentiel */}
                ~85
              </div>
              <div className="text-sm text-gray-600 mt-1">CCN disponibles</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {importedIDCCs.length > 0
                  ? Math.round((importedIDCCs.length / 85) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Couverture</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
