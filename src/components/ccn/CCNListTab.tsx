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
import { AlertCircle, FileText } from 'lucide-react';

interface CCNData {
  id: string;
  idcc: string;
  titre: string;
  brochure: string | null;
  status: string;
  nb_documents: number;
  last_sync: string | null;
  import_date: string | null;
  created_at: string;
}

export default function CCNListTab() {
  const [ccnList, setCcnList] = useState<CCNData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCCNData();
  }, []);

  async function fetchCCNData() {
    try {
      setLoading(true);
      setError(null);

      // Requête pour récupérer les CCN depuis la table ccn
      const { data, error: queryError } = await (supabase
        .from('ccn')
        .select('*')
        .order('idcc', { ascending: true }) as any);

      if (queryError) {
        console.error('Erreur Supabase:', queryError);
        setError('Erreur lors de la récupération des données');
        return;
      }

      if (!data || data.length === 0) {
        setCcnList([]);
        return;
      }

      setCcnList(data);
    } catch (err) {
      console.error('Erreur lors de la récupération des CCN:', err);
      setError('Une erreur inattendue est survenue');
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string, lastSync: string | null) {
    // Badge basé sur le statut d'import
    if (status === 'completed') {
      if (!lastSync) {
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Importée</Badge>;
      }

      const now = new Date();
      const syncDate = new Date(lastSync);
      const daysDiff = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 7) {
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">À jour</Badge>;
      } else if (daysDiff <= 30) {
        return <Badge variant="secondary" className="bg-orange-500 hover:bg-orange-600 text-white">Attention</Badge>;
      } else {
        return <Badge variant="destructive">Ancienne</Badge>;
      }
    } else if (status === 'importing') {
      return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white">Import en cours</Badge>;
    } else if (status === 'error') {
      return <Badge variant="destructive">Erreur</Badge>;
    } else {
      return <Badge variant="outline">En attente</Badge>;
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#407b85]" />
            Conventions Collectives Importées
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
            Conventions Collectives Importées
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
            Conventions Collectives Importées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Aucune convention collective importée. Utilisez l'onglet "Ajouter une CCN" pour commencer.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
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
                <TableRow key={ccn.id}>
                  <TableCell className="font-medium">
                    <span className="font-mono text-[#407b85]">{ccn.idcc}</span>
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
                    {ccn.last_sync ? formatDate(ccn.last_sync) : formatDate(ccn.created_at)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(ccn.status, ccn.last_sync)}
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
  );
}
