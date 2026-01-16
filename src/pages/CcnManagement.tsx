import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Download, Database, Globe, CheckCircle2, Loader2, RefreshCw, FileText, AlertCircle, FileDown, Trash2, Shield, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { deleteCcn } from '@/services/ccnService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ROUTES } from '@/constants';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface CcnImported {
  idcc: string;
  label: string;
  documentCount: number;
  chunksCount: number;
  isActive: boolean;
  isProtected: boolean;
  protectionReason: string | null;
}

interface CcnCatalogue {
  idcc: string;
  label: string;
  kali_cont_id: string | null;
  brochure_numero: string | null;
  is_imported: boolean;
}

interface Stats {
  totalImported: number;
  totalChunks: number;
  totalCatalogue: number;
  percentageImported: number;
}

export default function CcnManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('imported');
  const [ccnImported, setCcnImported] = useState<CcnImported[]>([]);
  const [ccnCatalogue, setCcnCatalogue] = useState<CcnCatalogue[]>([]);
  const [stats, setStats] = useState<Stats>({ totalImported: 0, totalChunks: 0, totalCatalogue: 0, percentageImported: 0 });
  const [searchImported, setSearchImported] = useState('');
  const [searchCatalogue, setSearchCatalogue] = useState('');
  const [selectedForImport, setSelectedForImport] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [exportingIdcc, setExportingIdcc] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ccnToDelete, setCcnToDelete] = useState<CcnImported | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);

      // 1. Charger les CCN importées depuis ccn_catalogue
      // @ts-ignore - ccn_catalogue table
      const { data: importedData, error: importedError } = await supabase
        .from('ccn_catalogue')
        .select('idcc, label, kali_cont_id, is_protected, protection_reason')
        .eq('active', true)
        .eq('is_imported', true)
        .order('label', { ascending: true });

      if (importedError) throw importedError;

      // 2. Récupérer les comptages de documents et chunks via la fonction RPC
      const { data: countsData, error: countsError } = await supabase
        .rpc('get_ccn_document_counts') as { data: { idcc: string; document_count: number; chunk_count: number }[] | null; error: any };

      // Créer une map des comptages
      const countsMap = new Map<string, { documentCount: number; chunkCount: number }>();
      if (countsData && !countsError) {
        countsData.forEach((item) => {
          countsMap.set(item.idcc, {
            documentCount: Number(item.document_count) || 0,
            chunkCount: Number(item.chunk_count) || 0,
          });
        });
      }

      // 3. Mapper les données
      const importedList: CcnImported[] = (importedData || []).map((item: any) => {
        const counts = countsMap.get(item.idcc) || { documentCount: 0, chunkCount: 0 };
        return {
          idcc: item.idcc,
          label: item.label,
          documentCount: counts.documentCount,
          chunksCount: counts.chunkCount,
          isActive: true,
          isProtected: item.is_protected || false,
          protectionReason: item.protection_reason || null,
        };
      });

      // Calculer les totaux
      let totalDocuments = 0;
      importedList.forEach(ccn => {
        totalDocuments += ccn.documentCount;
      });

      setCcnImported(importedList);

      // 3. Charger le catalogue CCN
      const { data: catalogueData, error: catalogueError } = await supabase
        .from('ccn_catalogue')
        .select('idcc, label, kali_cont_id, brochure_numero, is_imported')
        .order('label', { ascending: true }) as { data: CcnCatalogue[] | null; error: any };

      if (catalogueError) {
        console.warn('Catalogue non disponible:', catalogueError);
        // Fallback vers le fichier JSON si le catalogue est vide
        try {
          const response = await fetch('/data/all-ccn-france.json');
          const jsonData: { idcc: string; label: string }[] = await response.json();

          const importedIdccs = new Set(importedList.map(c => c.idcc));
          const catalogueFromJson: CcnCatalogue[] = jsonData.map(item => ({
            idcc: item.idcc,
            label: item.label,
            kali_cont_id: null,
            brochure_numero: null,
            is_imported: importedIdccs.has(item.idcc),
          }));

          setCcnCatalogue(catalogueFromJson);

          setStats({
            totalImported: importedList.length,
            totalChunks: totalDocuments,
            totalCatalogue: jsonData.length,
            percentageImported: jsonData.length > 0 ? Math.round((importedList.length / jsonData.length) * 100) : 0,
          });
        } catch {
          setCcnCatalogue([]);
        }
      } else {
        const importedIdccs = new Set(importedList.map(c => c.idcc));
        const catalogueWithStatus: CcnCatalogue[] = (catalogueData || []).map(item => ({
          idcc: item.idcc,
          label: item.label,
          kali_cont_id: item.kali_cont_id,
          brochure_numero: item.brochure_numero,
          is_imported: importedIdccs.has(item.idcc),
        }));

        setCcnCatalogue(catalogueWithStatus);

        setStats({
          totalImported: importedList.length,
          totalChunks: totalDocuments,
          totalCatalogue: catalogueWithStatus.length,
          percentageImported: catalogueWithStatus.length > 0 ? Math.round((importedList.length / catalogueWithStatus.length) * 100) : 0,
        });
      }

    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des CCN');
    } finally {
      setIsLoading(false);
    }
  }

  function toggleSelection(idcc: string) {
    setSelectedForImport(prev =>
      prev.includes(idcc) ? prev.filter(id => id !== idcc) : [...prev, idcc]
    );
  }

  async function handleImport() {
    if (selectedForImport.length === 0) {
      toast.error('Veuillez sélectionner au moins une CCN');
      return;
    }

    if (!user?.email) {
      toast.error('Email utilisateur non disponible');
      return;
    }

    try {
      setIsImporting(true);

      // Appeler l'Edge Function Supabase pour déclencher l'import
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-ccn`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            idcc_list: selectedForImport,
            force_update: false,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors du déclenchement de l\'import');
      }

      const result = await response.json();

      const totalDocs = result.results?.reduce((sum: number, r: { documents_imported?: number }) => sum + (r.documents_imported || 0), 0) || 0;
      toast.success(`${totalDocs} document(s) importé(s)`);

      setSelectedForImport([]);
      await loadData();

    } catch (error) {
      console.error('Erreur import:', error);
      toast.error('Erreur lors de l\'import');
    } finally {
      setIsImporting(false);
    }
  }

  async function handleSyncCounts() {
    try {
      setIsSyncing(true);

      // Appeler la fonction de synchronisation
      const { data, error } = await (supabase.rpc as any)('sync_ccn_catalogue_counts');

      if (error) throw error;

      // Afficher les statistiques
      const stats = data as { total_checked: number; newly_imported: number; newly_removed: number } | null;

      if (stats) {
        const messages: string[] = [];
        if (stats.newly_imported > 0) messages.push(`${stats.newly_imported} nouvellement importée(s)`);
        if (stats.newly_removed > 0) messages.push(`${stats.newly_removed} retirée(s)`);

        toast.success('Synchronisation terminée', {
          description: messages.length > 0
            ? messages.join(', ')
            : `${stats.total_checked} CCN vérifiées, aucun changement`,
        });
      } else {
        toast.success('Synchronisation terminée');
      }

      await loadData();
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      toast.error('Erreur lors de la synchronisation', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleExport(idcc: string, format: 'markdown' | 'pdf' = 'markdown') {
    try {
      setExportingIdcc(idcc);

      // Recuperer la session pour l'authentification
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Vous devez etre connecte pour exporter');
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const response = await fetch(`${supabaseUrl}/functions/v1/export-ccn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ idcc, format }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      // Recuperer le contenu et le nom du fichier
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `CCN_${idcc}.md`;

      const blob = await response.blob();

      // Telecharger le fichier
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      const ccn = ccnImported.find(c => c.idcc === idcc);
      toast.success(`Export termine`, {
        description: `CCN ${idcc} - ${ccn?.label || ''}`,
      });
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error('Erreur lors de l\'export', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setExportingIdcc(null);
    }
  }

  function handleDeleteClick(ccn: CcnImported) {
    setCcnToDelete(ccn);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (!ccnToDelete) return;

    try {
      setIsDeleting(true);
      await deleteCcn(ccnToDelete.idcc);
      toast.success('CCN supprimée avec succès', {
        description: `${ccnToDelete.idcc} - ${ccnToDelete.label}`,
      });
      await loadData();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setCcnToDelete(null);
    }
  }

  // Filtrage
  const filteredImported = ccnImported.filter(ccn =>
    ccn.idcc.toLowerCase().includes(searchImported.toLowerCase()) ||
    ccn.label.toLowerCase().includes(searchImported.toLowerCase())
  );

  const filteredCatalogue = ccnCatalogue
    .filter(ccn => !ccn.is_imported)
    .filter(ccn =>
      ccn.idcc.toLowerCase().includes(searchCatalogue.toLowerCase()) ||
      ccn.label.toLowerCase().includes(searchCatalogue.toLowerCase())
    );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#407b85] mx-auto mb-4" />
            <p className="text-gray-600">Chargement des conventions collectives...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              to={ROUTES.CCN}
              className="inline-flex items-center text-sm text-gray-600 hover:text-[#407b85] mb-3 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la Consultation
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des CCN
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez les conventions collectives disponibles pour la consultation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={ROUTES.CCN_MONITORING}>
              <Button variant="outline" className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Monitoring
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleSyncCounts}
              disabled={isSyncing}
              className="flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Synchroniser
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-[#407b85]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">CCN Importées</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalImported}</p>
                </div>
                <Database className="h-10 w-10 text-[#407b85]/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Documents indexés</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalChunks.toLocaleString()}</p>
                </div>
                <FileText className="h-10 w-10 text-blue-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Catalogue total</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalCatalogue}</p>
                </div>
                <Globe className="h-10 w-10 text-purple-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Couverture</p>
                  <span className="text-sm font-medium text-green-600">{stats.percentageImported}%</span>
                </div>
                <Progress value={stats.percentageImported} className="h-2" />
                <p className="text-xs text-gray-400 mt-2">
                  {stats.totalImported} / {stats.totalCatalogue} CCN
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="imported" className="gap-2">
              <Database className="h-4 w-4" />
              Importées ({ccnImported.length})
            </TabsTrigger>
            <TabsTrigger value="catalogue" className="gap-2">
              <Globe className="h-4 w-4" />
              Catalogue ({filteredCatalogue.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: CCN Importées */}
          <TabsContent value="imported">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Conventions Collectives Importées</CardTitle>
                    <CardDescription>
                      CCN disponibles pour la consultation dans le chatbot
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={searchImported}
                      onChange={(e) => setSearchImported(e.target.value)}
                      placeholder="Rechercher..."
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredImported.length === 0 ? (
                  <div className="text-center py-12">
                    <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchImported ? 'Aucune CCN trouvée' : 'Aucune CCN importée'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Allez dans l'onglet Catalogue pour importer des CCN
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {filteredImported.map(ccn => (
                      <div
                        key={ccn.idcc}
                        className="flex items-center justify-between p-4 bg-white border rounded-lg hover:border-[#407b85]/30 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="bg-[#407b85]/10 rounded-lg p-2">
                            <FileText className="h-5 w-5 text-[#407b85]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-semibold text-[#407b85]">
                                {ccn.idcc}
                              </span>
                              {ccn.isActive && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                              {ccn.isProtected && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Protégée
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {ccn.label}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              {ccn.documentCount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">documents</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExport(ccn.idcc);
                            }}
                            disabled={exportingIdcc === ccn.idcc || ccn.documentCount === 0}
                            className="hover:bg-[#407b85]/10 hover:text-[#407b85] hover:border-[#407b85]"
                            title="Exporter en Markdown"
                          >
                            {exportingIdcc === ccn.idcc ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileDown className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(ccn);
                            }}
                            disabled={ccn.isProtected}
                            className={ccn.isProtected
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                            }
                            title={ccn.isProtected
                              ? `Impossible de supprimer : ${ccn.protectionReason || 'CCN protégée'}`
                              : "Supprimer cette CCN"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Catalogue */}
          <TabsContent value="catalogue">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Catalogue des CCN Françaises</CardTitle>
                    <CardDescription>
                      Sélectionnez les CCN à importer depuis le référentiel DARES
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={searchCatalogue}
                      onChange={(e) => setSearchCatalogue(e.target.value)}
                      placeholder="Rechercher..."
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredCatalogue.length === 0 ? (
                  <div className="text-center py-12">
                    <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchCatalogue ? 'Aucune CCN trouvée' : 'Toutes les CCN ont été importées !'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4">
                      {filteredCatalogue.map(ccn => {
                        const isSelected = selectedForImport.includes(ccn.idcc);
                        return (
                          <div
                            key={ccn.idcc}
                            onClick={() => toggleSelection(ccn.idcc)}
                            className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#407b85]/5 border-[#407b85] ring-1 ring-[#407b85]/20'
                                : 'bg-white hover:border-gray-300'
                            }`}
                          >
                            <Checkbox checked={isSelected} className="pointer-events-none" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-gray-700">
                                  {ccn.idcc}
                                </span>
                                {ccn.brochure_numero && (
                                  <Badge variant="outline" className="text-xs">
                                    Brochure {ccn.brochure_numero}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {ccn.label}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {selectedForImport.length > 0 && (
                      <div className="flex items-center justify-between pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[#407b85]">
                            {selectedForImport.length}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            CCN sélectionnée{selectedForImport.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <Button
                          onClick={handleImport}
                          disabled={isImporting}
                          className="bg-[#407b85] hover:bg-[#407b85]/90"
                        >
                          {isImporting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Import en cours...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Importer
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
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
                          L'import peut prendre plusieurs minutes. Les CCN seront disponibles dans l'onglet "Importées" une fois terminé.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Panel */}
            <Card className="mt-4 border-amber-200 bg-amber-50/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-900">
                      Comment fonctionne l'import ?
                    </p>
                    <ul className="text-sm text-amber-800 mt-2 space-y-1">
                      <li>1. Sélectionnez les CCN que vous souhaitez consulter</li>
                      <li>2. L'import récupère les textes depuis Légifrance</li>
                      <li>3. Les documents sont indexés pour la recherche sémantique</li>
                      <li>4. Vous pouvez ensuite poser des questions dans le chatbot CCN</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette CCN ?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Êtes-vous sûr de vouloir supprimer la CCN{' '}
                <strong className="text-red-600">{ccnToDelete?.idcc}</strong> -{' '}
                {ccnToDelete?.label} ?
              </p>
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                <p className="font-semibold text-red-800 mb-2">
                  Cette action est irréversible et supprimera :
                </p>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  <li>
                    <strong>{ccnToDelete?.documentCount || 0} document(s)</strong> ({ccnToDelete?.chunksCount || 0} chunks) de la base de données
                  </li>
                  <li>Le statut d'import (la CCN redeviendra disponible pour import)</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression en cours...
                </>
              ) : (
                'Oui, supprimer définitivement'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
