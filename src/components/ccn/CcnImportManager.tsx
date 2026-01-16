import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, RefreshCw, Info } from 'lucide-react';
import { useCcnImport } from '@/hooks/useCcnImport';
import { useAuth } from '@/hooks/useAuth';
import CcnAvailableList from './CcnAvailableList';
import CcnImportedList from './CcnImportedList';
import { WEBHOOKS } from '@/constants';

export default function CcnImportManager() {
  const { user } = useAuth();
  const {
    availableCcn,
    importedCcn,
    selectedIdcc,
    isLoading,
    isImporting,
    searchQuery,
    setSearchQuery,
    toggleSelection,
    selectAll,
    clearSelection,
    importSelected,
    deactivate,
    refresh,
  } = useCcnImport();

  const handleImport = async () => {
    if (!user?.email) {
      console.error('Email utilisateur non disponible');
      return;
    }

    await importSelected(user.email, WEBHOOKS.CCN_IMPORT);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Card d'info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>

        {/* Grille de listes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="hover-lift">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Card d'information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Info className="h-5 w-5" />
            Importer de nouvelles Conventions Collectives
          </CardTitle>
          <CardDescription className="text-blue-700">
            Gérez l'import des conventions collectives depuis le référentiel national
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>1.</strong> Sélectionnez une ou plusieurs CCN dans la liste de gauche
          </p>
          <p>
            <strong>2.</strong> Cliquez sur "Importer la sélection" pour déclencher l'import
          </p>
          <p>
            <strong>3.</strong> L'import peut prendre plusieurs minutes. Les CCN apparaîtront dans la liste de droite avec un statut "Import en cours"
          </p>
          <p className="text-xs mt-4 text-blue-600">
            Une fois l'import terminé, les CCN seront automatiquement disponibles pour consultation via l'assistant IA.
          </p>
        </CardContent>
      </Card>

      {/* Boutons d'action */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">{importedCcn.length}</span> CCN importées •
          <span className="font-medium">{availableCcn.length}</span> disponibles
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isImporting}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isImporting ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedIdcc.length === 0 || isImporting}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Import en cours...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Importer la sélection ({selectedIdcc.length})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Grille de listes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des CCN disponibles */}
        <CcnAvailableList
          availableCcn={availableCcn}
          selectedIdcc={selectedIdcc}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleSelection={toggleSelection}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
        />

        {/* Liste des CCN importées */}
        <CcnImportedList
          importedCcn={importedCcn}
          onDeactivate={deactivate}
        />
      </div>
    </div>
  );
}
