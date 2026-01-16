import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Edit, X, Check, RotateCcw, Folder } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
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
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import MappingEditDialog from '@/components/mapping/MappingEditDialog';
import { useToast } from '@/hooks/use-toast';
import type { NasMapping, StatusFilter } from '@/types/mapping';

export default function Mapping() {
  const [mappings, setMappings] = useState<NasMapping[]>([]);
  const [filteredMappings, setFilteredMappings] = useState<NasMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editingMapping, setEditingMapping] = useState<NasMapping | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMappings();
  }, []);

  useEffect(() => {
    filterMappings();
  }, [mappings, statusFilter]);

  async function fetchMappings() {
    try {
      setLoading(true);

      const { data, error } = await (supabase as any)
        .from('nas_client_mapping')
        .select('*')
        .order('category', { nullsFirst: false })
        .order('folder_name');

      if (error) {
        console.error('Erreur Supabase:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les mappings.',
          variant: 'destructive',
        });
        return;
      }

      setMappings(data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des mappings:', err);
    } finally {
      setLoading(false);
    }
  }

  function filterMappings() {
    if (statusFilter === 'all') {
      setFilteredMappings(mappings);
    } else {
      setFilteredMappings(mappings.filter((m) => m.status === statusFilter));
    }
  }

  function handleEdit(mapping: NasMapping) {
    setEditingMapping(mapping);
    setDialogOpen(true);
  }

  async function handleQuickAction(id: string, status: string) {
    try {
      const { error } = await (supabase as any)
        .from('nas_client_mapping')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Statut mis à jour',
        description: `Le statut a été changé à "${getStatusLabel(status)}".`,
      });

      fetchMappings();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut.',
        variant: 'destructive',
      });
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'mapped':
        return 'Mappé';
      case 'ignored':
        return 'Ignoré';
      default:
        return status;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">
            En attente
          </Badge>
        );
      case 'mapped':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            Mappé
          </Badge>
        );
      case 'ignored':
        return <Badge variant="outline">Ignoré</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  function getCategoryBadge(category: string | null) {
    if (!category) return null;

    const colors = {
      Clients: 'bg-blue-500',
      Prospects: 'bg-purple-500',
      Partenaires: 'bg-cyan-500',
      Résiliations: 'bg-red-500',
    };

    const color = colors[category as keyof typeof colors] || 'bg-gray-500';

    return (
      <Badge className={`${color} hover:${color} text-white`}>{category}</Badge>
    );
  }

  function getStatusCounts() {
    return {
      all: mappings.length,
      pending: mappings.filter((m) => m.status === 'pending').length,
      mapped: mappings.filter((m) => m.status === 'mapped').length,
      ignored: mappings.filter((m) => m.status === 'ignored').length,
    };
  }

  const counts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
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
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-[#407b85] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Correspondance Dossiers NAS
          </h1>
          <p className="text-gray-600">
            Associez les dossiers du NAS aux clients et leurs IDCC
          </p>
        </div>

        {/* Filtres par statut */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <TabsList className="grid grid-cols-4 w-full max-w-md">
                <TabsTrigger value="all">
                  Tous ({counts.all})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  En attente ({counts.pending})
                </TabsTrigger>
                <TabsTrigger value="mapped">
                  Mappés ({counts.mapped})
                </TabsTrigger>
                <TabsTrigger value="ignored">
                  Ignorés ({counts.ignored})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Tableau des mappings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-[#407b85]" />
              Dossiers NAS
              <Badge variant="outline" className="ml-2">
                {filteredMappings.length} dossier(s)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMappings.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Aucun dossier trouvé avec ce filtre.
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Dossier NAS</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="w-[120px]">Catégorie</TableHead>
                      <TableHead>IDCC</TableHead>
                      <TableHead className="w-[120px]">Statut</TableHead>
                      <TableHead className="text-right w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMappings.map((mapping) => (
                      <TableRow key={mapping.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium font-mono text-sm">
                          {mapping.folder_name}
                        </TableCell>
                        <TableCell>
                          {mapping.client_name || (
                            <span className="text-gray-400 italic">Non défini</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {mapping.category ? getCategoryBadge(mapping.category) : '-'}
                        </TableCell>
                        <TableCell>
                          {mapping.idcc && mapping.idcc.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {mapping.idcc.map((idcc) => (
                                <Badge key={idcc} variant="outline" className="font-mono text-xs">
                                  {idcc}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Aucun</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(mapping.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(mapping)}
                              title="Éditer"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            {mapping.status !== 'mapped' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuickAction(mapping.id, 'mapped')}
                                title="Marquer comme mappé"
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}

                            {mapping.status !== 'ignored' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuickAction(mapping.id, 'ignored')}
                                title="Ignorer"
                                className="text-gray-600 hover:text-gray-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}

                            {mapping.status !== 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuickAction(mapping.id, 'pending')}
                                title="Réinitialiser"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />

      {/* Dialog d'édition */}
      <MappingEditDialog
        open={dialogOpen}
        mapping={editingMapping}
        onClose={() => {
          setDialogOpen(false);
          setEditingMapping(null);
        }}
        onSuccess={fetchMappings}
      />
    </div>
  );
}
