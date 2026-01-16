import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileText, Plus } from 'lucide-react';
import CCNSelector from './CCNSelector';
import { useToast } from '@/hooks/use-toast';

interface CCNData {
  idcc: string;
  titre: string;
  nb_documents: number;
  derniere_maj: string;
}

export default function CCNList() {
  const [ccnList, setCcnList] = useState<CCNData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCCNData();
  }, []);

  async function fetchCCNData() {
    try {
      setLoading(true);
      setError(null);

      // Requête pour récupérer les CCN depuis la table documents
      const { data, error: queryError } = await supabase
        .from('documents')
        .select('metadata, created_at')
        .eq('metadata->>source', 'legifrance');

      if (queryError) {
        console.error('Erreur Supabase:', queryError);
        setError('Erreur lors de la récupération des données');
        return;
      }

      if (!data || data.length === 0) {
        setCcnList([]);
        return;
      }

      // Grouper par IDCC et calculer les statistiques
      const ccnMap = new Map<string, CCNData>();

      data.forEach((doc: any) => {
        const metadata = doc.metadata || {};
        const idcc = metadata.idcc || 'N/A';
        const titre = metadata.titre || 'Sans titre';
        const createdAt = doc.created_at;

        if (ccnMap.has(idcc)) {
          const existing = ccnMap.get(idcc)!;
          existing.nb_documents += 1;

          // Garder la date la plus récente
          if (new Date(createdAt) > new Date(existing.derniere_maj)) {
            existing.derniere_maj = createdAt;
          }
        } else {
          ccnMap.set(idcc, {
            idcc,
            titre,
            nb_documents: 1,
            derniere_maj: createdAt,
          });
        }
      });

      // Convertir en tableau et trier par IDCC
      const ccnArray = Array.from(ccnMap.values()).sort((a, b) => {
        if (a.idcc === 'N/A') return 1;
        if (b.idcc === 'N/A') return -1;
        return a.idcc.localeCompare(b.idcc, undefined, { numeric: true });
      });

      setCcnList(ccnArray);
    } catch (err) {
      console.error('Erreur lors de la récupération des CCN:', err);
      setError('Une erreur inattendue est survenue');
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(derniereMaj: string) {
    const now = new Date();
    const majDate = new Date(derniereMaj);
    const daysDiff = Math.floor((now.getTime() - majDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 7) {
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">À jour</Badge>;
    } else if (daysDiff <= 30) {
      return <Badge variant="secondary" className="bg-orange-500 hover:bg-orange-600 text-white">Attention</Badge>;
    } else {
      return <Badge variant="destructive">Ancienne</Badge>;
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  async function handleImportCCN(idcc: string, titre: string) {
    try {
      // TODO: Implémenter la logique d'import réelle
      // Pour l'instant, on simule juste un succès

      toast({
        title: 'Import initié',
        description: `L'import de la CCN ${idcc} - ${titre} a été démarré. Cela peut prendre quelques minutes.`,
      });

      // Rafraîchir la liste après quelques secondes
      setTimeout(() => {
        fetchCCNData();
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'import de la CCN.',
        variant: 'destructive',
      });
    }
  }

  // Extraire la liste des IDCC déjà importés
  const importedIDCCs = ccnList.map(ccn => ccn.idcc).filter(idcc => idcc !== 'N/A');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#407b85]" />
            Conventions Collectives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#407b85]" />
            Conventions Collectives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ccnList.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#407b85]" />
            Conventions Collectives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Aucune convention collective trouvée dans la base de données.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section d'ajout d'une nouvelle CCN */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Plus className="h-5 w-5" />
            Ajouter une convention collective
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CCNSelector
            importedIDCCs={importedIDCCs}
            onImport={handleImportCCN}
          />
        </CardContent>
      </Card>

      {/* Section liste des CCN importées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#407b85]" />
            Conventions Collectives Importées
            <Badge variant="outline" className="ml-2">
              {ccnList.length} CCN
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Code IDCC</TableHead>
                <TableHead>Titre de la CCN</TableHead>
                <TableHead className="text-center w-[150px]">Documents</TableHead>
                <TableHead className="w-[180px]">Dernière MAJ</TableHead>
                <TableHead className="text-center w-[120px]">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ccnList.map((ccn) => (
                <TableRow key={ccn.idcc}>
                  <TableCell className="font-medium">
                    {ccn.idcc === 'N/A' ? (
                      <span className="text-gray-400">N/A</span>
                    ) : (
                      <span className="font-mono text-[#407b85]">{ccn.idcc}</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={ccn.titre}>
                      {ccn.titre}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{ccn.nb_documents}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(ccn.derniere_maj)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(ccn.derniere_maj)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>
            Total : <strong>{ccnList.length}</strong> convention(s) collective(s) •{' '}
            <strong>{ccnList.reduce((sum, ccn) => sum + ccn.nb_documents, 0)}</strong> document(s)
          </p>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
