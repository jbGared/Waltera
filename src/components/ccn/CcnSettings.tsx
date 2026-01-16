import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { WEBHOOKS } from '@/constants';

interface CcnInDatabase {
  idcc: string;
  label: string;
  status: 'active' | 'importing' | 'error';
  nb_documents: number;
}

interface CcnAvailable {
  idcc: string;
  label: string;
}

interface CcnSettingsProps {
  onClose?: () => void;
}

export default function CcnSettings({}: CcnSettingsProps) {
  const { user } = useAuth();
  const [ccnInDatabase, setCcnInDatabase] = useState<CcnInDatabase[]>([]);
  const [allCcnAvailable, setAllCcnAvailable] = useState<CcnAvailable[]>([]);
  const [filteredCcn, setFilteredCcn] = useState<CcnAvailable[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCcn, setSelectedCcn] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importingIds, setImportingIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filtrer les CCN disponibles basé sur la recherche
    if (searchQuery.trim() === '') {
      setFilteredCcn(allCcnAvailable);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCcn(
        allCcnAvailable.filter(
          (ccn) =>
            ccn.idcc.toLowerCase().includes(query) ||
            ccn.label.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, allCcnAvailable]);

  async function loadData() {
    try {
      setIsLoading(true);

      // 1. Charger les CCN en base de données depuis idcc_ref
      const { data: idccData, error: idccError } = await supabase
        .from('idcc_ref')
        .select('idcc, label')
        .eq('active', true)
        .order('idcc', { ascending: true });

      if (idccError) throw idccError;

      // 2. Récupérer les statuts depuis la table ccn
      // @ts-ignore
      const { data: statusData } = await supabase
        .from('ccn')
        .select('idcc, status, nb_documents');

      const statusMap = new Map();
      if (statusData) {
        statusData.forEach((item: any) => {
          statusMap.set(item.idcc, {
            status: item.status === 'completed' ? 'active' : item.status === 'error' ? 'error' : 'importing',
            nb_documents: item.nb_documents || 0,
          });
        });
      }

      const inDb = (idccData || []).map((item: any) => {
        const statusInfo = statusMap.get(item.idcc);

        // Si pas de statusInfo, la CCN n'a pas encore été importée via le webhook
        // Donc on la considère comme "active" par défaut (ajoutée manuellement)
        // Sauf si elle est dans importingIds (import en cours)
        let status: 'active' | 'importing' | 'error' = 'active';
        let nb_documents = 0;

        if (statusInfo) {
          status = statusInfo.status;
          nb_documents = statusInfo.nb_documents;
        }

        return {
          idcc: item.idcc,
          label: item.label,
          status,
          nb_documents,
        };
      });

      setCcnInDatabase(inDb);

      // 3. Charger toutes les CCN disponibles depuis le JSON
      const response = await fetch('/data/all-ccn-france.json');
      const allCcn: CcnAvailable[] = await response.json();

      // 4. Filtrer pour exclure celles déjà en base
      const idccInDb = new Set(inDb.map((c) => c.idcc));
      const available = allCcn.filter((ccn) => !idccInDb.has(ccn.idcc));

      setAllCcnAvailable(available);
      setFilteredCcn(available);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des CCN');
    } finally {
      setIsLoading(false);
    }
  }

  function toggleCcnSelection(idcc: string) {
    setSelectedCcn((prev) =>
      prev.includes(idcc) ? prev.filter((id) => id !== idcc) : [...prev, idcc]
    );
  }

  async function handleImport() {
    if (selectedCcn.length === 0) {
      toast.error('Veuillez sélectionner au moins une CCN');
      return;
    }

    if (!user?.email) {
      toast.error('Email utilisateur non disponible');
      return;
    }

    try {
      setIsImporting(true);
      setImportingIds(selectedCcn);

      // 1. Ajouter les CCN à idcc_ref
      const records = selectedCcn.map((idcc) => {
        const ccn = allCcnAvailable.find((c) => c.idcc === idcc);
        return {
          idcc,
          label: ccn?.label || '',
          active: true,
        };
      });

      // @ts-ignore
      const { error: insertError } = await (supabase as any)
        .from('idcc_ref')
        .insert(records);

      if (insertError) throw insertError;

      // 2. Appeler le webhook n8n
      const response = await fetch(WEBHOOKS.CCN_IMPORT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idcc_list: selectedCcn,
          user_email: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      toast.success(
        `Import démarré pour ${selectedCcn.length} CCN`,
        {
          description: 'L\'import peut prendre 1 à 2 minutes. Vous serez notifié à la fin.',
          duration: 5000,
        }
      );

      // 3. Polling pour vérifier la fin de l'import
      pollImportStatus(selectedCcn);

      // 4. Vider la sélection
      setSelectedCcn([]);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast.error('Erreur lors du déclenchement de l\'import');
      setIsImporting(false);
      setImportingIds([]);
    }
  }

  async function pollImportStatus(idccList: string[]) {
    const checkStatus = async () => {
      try {
        // @ts-ignore
        const { data } = await supabase
          .from('ccn')
          .select('idcc, status')
          .in('idcc', idccList);

        if (data) {
          const completed = data.filter(
            (item: any) => item.status === 'completed'
          );

          if (completed.length === idccList.length) {
            // Tous les imports sont terminés
            setIsImporting(false);
            setImportingIds([]);

            toast.success(
              'Import terminé !',
              {
                description: `${completed.length} CCN maintenant disponibles pour consultation`,
                duration: 5000,
              }
            );

            // Recharger les données
            await loadData();
            return true;
          }
        }

        return false;
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
        return false;
      }
    };

    // Vérifier toutes les 10 secondes pendant 3 minutes max
    let attempts = 0;
    const maxAttempts = 18; // 3 minutes / 10 secondes

    const interval = setInterval(async () => {
      attempts++;
      const isDone = await checkStatus();

      if (isDone || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts && !isDone) {
          setIsImporting(false);
          setImportingIds([]);
          toast.warning(
            'Import en cours',
            {
              description: 'L\'import prend plus de temps que prévu. Vérifiez plus tard.',
            }
          );
        }
      }
    }, 10000);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Chargement des CCN...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section: CCN en base de données */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CCN en Base de Données</CardTitle>
          <CardDescription>
            {ccnInDatabase.length} convention{ccnInDatabase.length > 1 ? 's' : ''} collective{ccnInDatabase.length > 1 ? 's' : ''} disponible{ccnInDatabase.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            {ccnInDatabase.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Aucune CCN importée. Sélectionnez des CCN ci-dessous pour les importer.
              </div>
            ) : (
              <div className="space-y-2">
                {ccnInDatabase.map((ccn) => {
                  // Vérifier si cette CCN est réellement en cours d'import
                  const isCurrentlyImporting = importingIds.includes(ccn.idcc) || ccn.status === 'importing';

                  return (
                    <div
                      key={ccn.idcc}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-gray-900">
                            {ccn.idcc}
                          </span>
                          {isCurrentlyImporting ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Import en cours
                            </Badge>
                          ) : ccn.status === 'active' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Téléchargée
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{ccn.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Separator />

      {/* Section: CCN disponibles à l'import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Importer de Nouvelles CCN</CardTitle>
          <CardDescription>
            {allCcnAvailable.length} convention{allCcnAvailable.length > 1 ? 's' : ''} disponible{allCcnAvailable.length > 1 ? 's' : ''}
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par IDCC ou libellé..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] mb-4">
            {filteredCcn.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {searchQuery
                  ? 'Aucune CCN trouvée avec ces critères'
                  : 'Toutes les CCN ont été importées !'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCcn.map((ccn) => {
                  const isSelected = selectedCcn.includes(ccn.idcc);
                  const isCurrentlyImporting = importingIds.includes(ccn.idcc);

                  return (
                    <div
                      key={ccn.idcc}
                      className={`flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      } ${isCurrentlyImporting ? 'opacity-50 pointer-events-none' : ''}`}
                      onClick={() => !isCurrentlyImporting && toggleCcnSelection(ccn.idcc)}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isCurrentlyImporting}
                      />
                      <div className="flex-1">
                        <div className="font-mono text-sm font-semibold text-gray-900">
                          {ccn.idcc}
                        </div>
                        <div className="text-sm text-gray-600">{ccn.label}</div>
                      </div>
                      {isCurrentlyImporting && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {selectedCcn.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-gray-600">
                {selectedCcn.length} CCN sélectionnée{selectedCcn.length > 1 ? 's' : ''}
              </span>
              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Importer ({selectedCcn.length})
                  </>
                )}
              </Button>
            </div>
          )}

          {isImporting && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Import en cours...
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    L'import peut prendre 1 à 2 minutes. Vous serez notifié automatiquement à la fin.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
