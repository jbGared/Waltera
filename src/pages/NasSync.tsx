import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Play, CheckCircle, AlertCircle, Clock, Loader2, FolderSync, Users, FileText, Folder, FolderOpen, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Client {
  id: string;
  name: string;
  code: string | null;
  status: string | null;
}

interface SyncJob {
  id: string;
  status: string;
  total_files: number;
  processed_files: number;
  new_files: number;
  modified_files: number;
  deleted_files: number;
  errors: string[];
  started_at: string;
  completed_at: string | null;
}

interface SyncResult {
  success: boolean;
  job_id?: string;
  client_code?: string;
  scan_path?: string;
  path?: string;
  status?: string;
  totalFiles?: number;
  processedFiles?: number;
  newFiles?: number;
  modifiedFiles?: number;
  deletedFiles?: number;
  scanned?: number;
  indexed?: number;
  errors?: string[];
  error?: string;
}

interface NasFolder {
  name: string;
  isdir: boolean;
}

export default function NasSync() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [recentJobs, setRecentJobs] = useState<SyncJob[]>([]);
  const { toast } = useToast();

  // NAS folder browser state
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [currentPath, setCurrentPath] = useState('/PORTEFEUILLE/1 - Clients');
  const [folders, setFolders] = useState<NasFolder[]>([]);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    loadClients();
    loadRecentJobs();
  }, []);

  async function loadClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, code, status')
        .order('code', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la liste des clients.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function loadRecentJobs() {
    try {
      const { data, error } = await (supabase as any)
        .from('nas_sync_jobs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentJobs(data || []);
    } catch (error) {
      console.error('Erreur chargement jobs:', error);
    }
  }

  async function browseNasFolders(path?: string) {
    setIsBrowsing(true);
    const browsePath = path || currentPath;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nas-sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'list_folders',
            path: browsePath,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setFolders(result.folders || []);
        setCurrentPath(browsePath);
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible de lister les dossiers.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur browse:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de se connecter au NAS.',
        variant: 'destructive',
      });
    } finally {
      setIsBrowsing(false);
    }
  }

  function navigateToFolder(folderName: string) {
    const newPath = `${currentPath}/${folderName}`;
    browseNasFolders(newPath);
  }

  function navigateUp() {
    const parts = currentPath.split('/');
    if (parts.length > 2) {
      parts.pop();
      browseNasFolders(parts.join('/'));
    }
  }

  async function updateClientNasPath(clientCode: string, newPath: string) {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ nas_folder_path: newPath })
        .eq('code', clientCode);

      if (error) throw error;

      toast({
        title: 'Chemin mis a jour',
        description: `Le chemin NAS du client ${clientCode} a ete mis a jour.`,
      });

      setFolderDialogOpen(false);
      loadClients();
    } catch (error) {
      console.error('Erreur mise a jour:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre a jour le chemin.',
        variant: 'destructive',
      });
    }
  }

  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  async function startSync() {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Get the client's NAS path if a specific client is selected
      let scanPath = '/PORTEFEUILLE/1 - Clients';
      if (selectedClient !== 'all') {
        const client = clients.find(c => c.code === selectedClient);
        if (client) {
          const { data } = await supabase
            .from('clients')
            .select('nas_folder_path')
            .eq('code', selectedClient)
            .single();
          if (data?.nas_folder_path) {
            scanPath = data.nas_folder_path;
          }
        }
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nas-sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'index_metadata',
            path: scanPath,
            max_files: 50,
          }),
        }
      );

      const result: SyncResult = await response.json();
      setSyncResult(result);

      if (result.success) {
        toast({
          title: 'Indexation terminee',
          description: `${result.scanned || 0} fichiers scannes, ${result.indexed || 0} nouveaux indexes.`,
        });
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Erreur lors de l\'indexation.',
          variant: 'destructive',
        });
      }

      // Recharger les jobs recents
      loadRecentJobs();
    } catch (error) {
      console.error('Erreur sync:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de lancer l\'indexation.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Termine</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" />Partiel</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500 hover:bg-blue-600"><Loader2 className="w-3 h-3 mr-1 animate-spin" />En cours</Badge>;
      case 'scanning':
        return <Badge className="bg-purple-500 hover:bg-purple-600"><FolderSync className="w-3 h-3 mr-1" />Scan</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erreur</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/admin"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Synchronisation NAS</h1>
          <p className="text-gray-600 mt-1">
            Synchronisez les documents du NAS vers la base de donnees vectorielle
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-500 mr-3" />
                <span className="text-2xl font-bold">{clients.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Dernier sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-purple-500 mr-3" />
                <span className="text-sm font-medium">
                  {recentJobs[0] ? formatDate(recentJobs[0].started_at) : 'Aucun'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {recentJobs[0] ? getStatusBadge(recentJobs[0].status) : <Badge variant="secondary">-</Badge>}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Indexer les fichiers NAS</CardTitle>
            <CardDescription>
              Scanne les dossiers du NAS et indexe les metadonnees des fichiers. Le traitement complet (extraction de texte et embeddings) sera effectue par n8n.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="client-select" className="mb-2 block">Client</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger id="client-select" className="w-full">
                    <SelectValue placeholder="Selectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-gray-500" />
                        Tous les clients
                      </span>
                    </SelectItem>
                    {clients.filter(c => c.code).map((client) => (
                      <SelectItem key={client.id} value={client.code!}>
                        <span className="flex items-center">
                          <span className="font-mono text-xs text-gray-500 mr-2">{client.code}</span>
                          {client.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={startSync}
                disabled={isSyncing || isLoading}
                className="min-w-[200px]"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Indexation...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Indexer les fichiers
                  </>
                )}
              </Button>

              <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFolderDialogOpen(true);
                      browseNasFolders();
                    }}
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Explorer NAS
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Explorer les dossiers NAS</DialogTitle>
                    <DialogDescription>
                      Naviguez dans les dossiers du NAS pour verifier les noms et chemins
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded text-sm font-mono overflow-x-auto">
                      <Folder className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <span className="truncate">{currentPath}</span>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Filtrer les dossiers..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={navigateUp}
                        disabled={isBrowsing || currentPath.split('/').length <= 2}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => browseNasFolders()}
                        disabled={isBrowsing}
                      >
                        {isBrowsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      </Button>
                    </div>

                    <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                      {isBrowsing ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                      ) : filteredFolders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          Aucun element trouve
                        </div>
                      ) : (
                        <div className="divide-y">
                          {filteredFolders.map((folder, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-3 hover:bg-gray-50 ${folder.isdir ? 'cursor-pointer' : ''}`}
                              onClick={() => folder.isdir && navigateToFolder(folder.name)}
                            >
                              <div className="flex items-center gap-3">
                                {folder.isdir ? (
                                  <Folder className="w-5 h-5 text-yellow-500" />
                                ) : (
                                  <FileText className="w-5 h-5 text-gray-400" />
                                )}
                                <span className={folder.isdir ? 'font-medium' : 'text-gray-600'}>
                                  {folder.name}
                                </span>
                              </div>
                              {folder.isdir && (
                                <div className="flex items-center gap-2">
                                  {selectedClient !== 'all' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateClientNasPath(selectedClient, `${currentPath}/${folder.name}`);
                                      }}
                                    >
                                      Utiliser pour {selectedClient}
                                    </Button>
                                  )}
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedClient !== 'all' && (
                      <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                        Client selectionne : <strong>{selectedClient}</strong>.
                        Cliquez sur "Utiliser pour {selectedClient}" pour mettre a jour le chemin NAS de ce client.
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={loadRecentJobs}
                disabled={isSyncing}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {syncResult && (
              <div className={`mt-4 p-4 rounded-lg ${syncResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start">
                  {syncResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${syncResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {syncResult.success ? 'Synchronisation terminee' : 'Erreur de synchronisation'}
                    </p>
                    {syncResult.success ? (
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Scannes:</span>{' '}
                          <span className="font-medium">{syncResult.scanned || syncResult.totalFiles || 0}</span>
                        </div>
                        <div>
                          <span className="text-green-600">Indexes:</span>{' '}
                          <span className="font-medium">{syncResult.indexed || syncResult.newFiles || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Chemin:</span>{' '}
                          <span className="font-mono text-xs">{syncResult.path || syncResult.scan_path || '-'}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-red-600 mt-1">{syncResult.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique des synchronisations</CardTitle>
            <CardDescription>
              Les 10 dernieres executions de synchronisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune synchronisation enregistree
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Traites</TableHead>
                    <TableHead className="text-right">Nouveaux</TableHead>
                    <TableHead className="text-right">Modifies</TableHead>
                    <TableHead className="text-right">Supprimes</TableHead>
                    <TableHead className="text-right">Erreurs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">
                        {formatDate(job.started_at)}
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-right">{job.total_files}</TableCell>
                      <TableCell className="text-right">{job.processed_files}</TableCell>
                      <TableCell className="text-right text-green-600">{job.new_files}</TableCell>
                      <TableCell className="text-right text-blue-600">{job.modified_files}</TableCell>
                      <TableCell className="text-right text-red-600">{job.deleted_files}</TableCell>
                      <TableCell className="text-right">
                        {job.errors && job.errors.length > 0 ? (
                          <Badge variant="destructive">{job.errors.length}</Badge>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
