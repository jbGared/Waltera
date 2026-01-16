/**
 * Composant de gestion des CCN - Vue unifiée
 * Affiche côte à côte :
 * - Gauche : CCN en base de données
 * - Droite : CCN disponibles en ligne (non importées)
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  Search,
  Database,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';

interface CCNData {
  idcc: string;
  label?: string;
  libelle?: string;
  chunk_count: number;
  document_count?: number;
}

interface CCNReferentiel {
  idcc: string;
  label: string;
  kalicont_id: string | null;
  active: boolean | null;
}

export default function CCNManagementTab() {
  const [ccnInDB, setCcnInDB] = useState<CCNData[]>([]);
  const [ccnAvailable, setCcnAvailable] = useState<CCNReferentiel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDB, setSearchDB] = useState('');
  const [searchAvailable, setSearchAvailable] = useState('');
  const [importing, setImporting] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      let ccnList: CCNData[] = [];

      // Utiliser RPC pour agréger directement en SQL (plus performant)
      const { data: ccnAggregated, error: rpcError } = await supabase
        .rpc('get_ccn_document_counts');

      if (rpcError) {
        console.warn('RPC get_ccn_summary non disponible, utilisation méthode alternative:', rpcError);

        // Fallback : récupérer tous les chunks avec pagination
        let allChunks: any[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        console.log('[CCN] Début récupération chunks avec pagination...');

        while (hasMore) {
          const { data: chunksPage, error: chunksError } = await supabase
            .from('ccn')
            .select('metadata')
            .range(from, from + pageSize - 1) as any;

          if (chunksError) {
            console.error('Erreur récupération chunks:', chunksError);
            toast.error('Erreur lors de la récupération des CCN en base');
            break;
          }

          if (chunksPage && chunksPage.length > 0) {
            allChunks = allChunks.concat(chunksPage);
            from += pageSize;
            hasMore = chunksPage.length === pageSize;
            console.log(`[CCN] Récupéré ${allChunks.length} chunks...`);
          } else {
            hasMore = false;
          }
        }

        console.log(`[CCN] Total chunks récupérés: ${allChunks.length}`);

        // Extraire et dédoublonner les IDCC depuis les metadata
        const ccnMap = new Map<string, { idcc: string; titre: string; libelle?: string; count: number }>();

        allChunks.forEach((chunk: any) => {
          if (chunk.metadata?.idcc) {
            const idcc = chunk.metadata.idcc;
            const titre = chunk.metadata.titre || `Convention collective ${idcc}`;
            const libelle = chunk.metadata.libelle || chunk.metadata.nom_convention || '';

            if (ccnMap.has(idcc)) {
              const existing = ccnMap.get(idcc)!;
              existing.count++;
              // Mettre à jour le libellé s'il est plus long (plus complet)
              if (libelle && libelle.length > (existing.libelle?.length || 0)) {
                existing.libelle = libelle;
              }
            } else {
              ccnMap.set(idcc, { idcc, titre, libelle, count: 1 });
            }
          }
        });

        // Convertir en tableau et trier par IDCC
        ccnList = Array.from(ccnMap.values())
          .map(({ idcc, titre, libelle, count }) => ({
            idcc,
            titre,
            libelle,
            chunk_count: count,
          }))
          .sort((a, b) => a.idcc.localeCompare(b.idcc));

        console.log(`[CCN] CCN uniques trouvées: ${ccnList.length}`);
      } else {
        // Utiliser les données agrégées du RPC
        ccnList = ccnAggregated || [];
      }

      setCcnInDB(ccnList);

      // Récupérer le référentiel complet
      const { data: refData, error: refError } = await supabase
        .from('idcc_ref')
        .select('idcc, label, kalicont_id, active')
        .order('idcc', { ascending: true });

      if (refError) {
        console.error('Erreur récupération référentiel:', refError);
        toast.error('Erreur lors de la récupération du référentiel');
      } else {
        // Filtrer pour ne garder que les CCN non importées
        const importedIDCCs = ccnList.map((ccn) => ccn.idcc);
        const availableCCN = (refData || []).filter(
          (ccn: CCNReferentiel) => !importedIDCCs.includes(ccn.idcc)
        );
        setCcnAvailable(availableCCN);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      toast.error('Une erreur inattendue est survenue');
    } finally {
      setLoading(false);
    }
  }

  async function handleImportCCN(ccn: CCNReferentiel) {
    try {
      setImporting(ccn.idcc);

      // Activer la CCN dans idcc_ref
      const { error: updateError } = await supabase
        .from('idcc_ref')
        .update({ active: true })
        .eq('idcc', ccn.idcc);

      if (updateError) {
        console.error('Erreur activation:', updateError);
        toast.error(`Erreur lors de l'activation: ${updateError.message}`);
        return;
      }

      toast.success(
        `CCN ${ccn.idcc} activée`,
        {
          description: `${ccn.label} - Prête pour l'import automatique`,
        }
      );

      // Rafraîchir les données
      setTimeout(() => {
        fetchData();
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast.error('Une erreur est survenue lors de l\'import');
    } finally {
      setImporting(null);
    }
  }


  // Filtrage
  const filteredDB = ccnInDB.filter(
    (ccn) =>
      ccn.idcc.toLowerCase().includes(searchDB.toLowerCase()) ||
      ccn.label || ''.toLowerCase().includes(searchDB.toLowerCase())
  );

  const filteredAvailable = ccnAvailable.filter(
    (ccn) =>
      ccn.idcc.toLowerCase().includes(searchAvailable.toLowerCase()) ||
      ccn.label || ''.toLowerCase().includes(searchAvailable.toLowerCase())
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
        <Card className="hover-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full animate-shimmer" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full animate-shimmer" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Colonne de gauche : CCN en base */}
      <Card className="hover-lift shadow-md hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-green-500/5 to-transparent border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Database className="h-5 w-5 text-green-600" />
              CCN en Base de Données
              <Badge variant="outline" className="ml-2">
                {ccnInDB.length}
              </Badge>
            </CardTitle>
          </div>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchDB}
              onChange={(e) => setSearchDB(e.target.value)}
              placeholder="Rechercher par IDCC ou titre..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            {filteredDB.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">
                  {searchDB
                    ? 'Aucune CCN trouvée avec ces critères'
                    : 'Aucune CCN importée. Importez-en depuis la colonne de droite.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="w-[100px]">IDCC</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Libellé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDB.map((ccn, index) => (
                    <TableRow key={`${ccn.idcc}-${index}`} className="hover:bg-green-50/50 transition-colors">
                      <TableCell className="font-medium">
                        <span className="font-mono text-green-600 font-semibold">{ccn.idcc}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm" title={ccn.label || ''}>
                          {ccn.label || ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600" title={ccn.libelle}>
                          {ccn.libelle || '-'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="p-4 bg-gray-50 border-t text-sm text-gray-600">
            <span>
              <strong>{filteredDB.length}</strong> CCN{filteredDB.length > 1 ? 's' : ''} en base
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Colonne de droite : CCN disponibles */}
      <Card className="hover-lift shadow-md hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Globe className="h-5 w-5 text-blue-600" />
              CCN Disponibles en Ligne
              <Badge variant="outline" className="ml-2">
                {ccnAvailable.length}
              </Badge>
            </CardTitle>
          </div>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchAvailable}
              onChange={(e) => setSearchAvailable(e.target.value)}
              placeholder="Rechercher par IDCC ou titre..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            {filteredAvailable.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Globe className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">
                  {searchAvailable
                    ? 'Aucune CCN disponible avec ces critères'
                    : 'Toutes les CCN disponibles ont été importées !'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="w-[100px]">IDCC</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead className="text-center w-[120px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAvailable.map((ccn) => (
                    <TableRow key={ccn.idcc} className="hover:bg-blue-50/50 transition-colors">
                      <TableCell className="font-medium">
                        <span className="font-mono text-blue-600 font-semibold">{ccn.idcc}</span>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm" title={ccn.label || ''}>
                          {ccn.label || ''}
                        </div>
                        {ccn.kalicont_id && (
                          <div className="text-xs text-gray-500 mt-1">
                            KALI: {ccn.kalicont_id}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          onClick={() => handleImportCCN(ccn)}
                          disabled={importing === ccn.idcc}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 hover-scale"
                        >
                          {importing === ccn.idcc ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                              Import...
                            </>
                          ) : (
                            <>
                              <Download className="h-3 w-3 mr-1" />
                              Importer
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="p-4 bg-gray-50 border-t text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>
                <strong>{filteredAvailable.length}</strong> CCN disponible{filteredAvailable.length > 1 ? 's' : ''}
              </span>
              <span className="text-blue-600 font-medium">Cliquez pour importer</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
