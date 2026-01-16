import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Search, Database, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import type { CcnImported } from '@/services/ccnService';

interface CcnImportedListProps {
  importedCcn: CcnImported[];
  onDeactivate?: (idcc: string) => Promise<void>;
}

export default function CcnImportedList({
  importedCcn,
  onDeactivate,
}: CcnImportedListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ccnToDelete, setCcnToDelete] = useState<CcnImported | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredCcn = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return importedCcn.filter(
      (ccn) =>
        ccn.idcc.toLowerCase().includes(query) ||
        ccn.label.toLowerCase().includes(query)
    );
  }, [importedCcn, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: importedCcn.length,
      active: importedCcn.filter((ccn) => ccn.status === 'active').length,
      importing: importedCcn.filter((ccn) => ccn.status === 'importing').length,
      error: importedCcn.filter((ccn) => ccn.status === 'error').length,
      totalDocuments: importedCcn.reduce((sum, ccn) => sum + (ccn.documentCount || 0), 0),
      totalChunks: importedCcn.reduce((sum, ccn) => sum + ccn.chunkCount, 0),
    };
  }, [importedCcn]);

  const handleDeleteClick = (ccn: CcnImported) => {
    setCcnToDelete(ccn);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (ccnToDelete && onDeactivate) {
      setIsDeleting(true);
      try {
        await onDeactivate(ccnToDelete.idcc);
      } finally {
        setIsDeleting(false);
        setDeleteDialogOpen(false);
        setCcnToDelete(null);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'importing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Actif
          </Badge>
        );
      case 'importing':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Import en cours
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Erreur
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="hover-lift shadow-md hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-green-500/5 to-transparent border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Database className="h-5 w-5 text-green-600" />
              CCN Importées
              <Badge variant="outline" className="ml-2">
                {filteredCcn.length}
              </Badge>
            </CardTitle>
          </div>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par IDCC ou titre..."
              className="pl-9"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-green-600">{stats.active}</div>
              <div className="text-xs text-gray-600">Actives</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-blue-600">{stats.importing}</div>
              <div className="text-xs text-gray-600">Import</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-purple-600">{stats.totalDocuments}</div>
              <div className="text-xs text-gray-600">Documents</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-gray-600">{stats.totalChunks}</div>
              <div className="text-xs text-gray-600">Chunks</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            {filteredCcn.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">
                  {searchQuery
                    ? 'Aucune CCN trouvée avec ces critères'
                    : 'Aucune CCN importée. Importez-en depuis la liste de gauche.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="w-[100px]">IDCC</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead className="text-center w-[100px]">Documents</TableHead>
                    <TableHead className="text-center w-[120px]">Statut</TableHead>
                    {onDeactivate && <TableHead className="text-center w-[80px]">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCcn.map((ccn) => (
                    <TableRow
                      key={ccn.idcc}
                      className="hover:bg-green-50/50 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(ccn.status)}
                          <span className="font-mono text-green-600 font-semibold">
                            {ccn.idcc}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm" title={ccn.label}>
                          {ccn.label}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="font-mono"
                          title={`${ccn.chunkCount} chunks`}
                        >
                          {ccn.documentCount || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(ccn.status)}
                      </TableCell>
                      {onDeactivate && (
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(ccn)}
                            className="hover:bg-red-50 hover:text-red-600"
                            disabled={ccn.status === 'importing'}
                            title={`Supprimer la CCN ${ccn.idcc}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="p-4 bg-gray-50 border-t text-sm text-gray-600">
            <span>
              <strong>{filteredCcn.length}</strong> CCN importée
              {filteredCcn.length > 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

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
                    <strong>{ccnToDelete?.documentCount || 0} document(s)</strong> ({ccnToDelete?.chunkCount || 0} chunks) de la base de données
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
    </>
  );
}
