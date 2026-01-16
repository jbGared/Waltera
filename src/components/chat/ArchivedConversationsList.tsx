import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Trash2, CheckSquare, Square, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface Conversation {
  id: string;
  title: string;
  service_type: string;
  updated_at: string;
  messages: any[];
  status: string;
}

interface ArchivedConversationsListProps {
  serviceType: 'rag_contrats' | 'conventions' | 'analyse_fichiers';
  onBack: () => void;
}

export default function ArchivedConversationsList({
  serviceType,
  onBack,
}: ArchivedConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  useEffect(() => {
    fetchArchivedConversations();
  }, [serviceType]);

  async function fetchArchivedConversations() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_type', serviceType)
        .eq('status', 'archived')
        .order('updated_at', { ascending: false }) as any);

      if (error) {
        console.error('Erreur lors de la récupération des conversations archivées:', error);
        return;
      }

      setConversations(data || []);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLastMessagePreview = (messages: any[]) => {
    if (!messages || messages.length === 0) return 'Aucun message';
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content || '';
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedConversations(new Set());
  };

  const toggleConversationSelection = (convId: string) => {
    const newSelection = new Set(selectedConversations);
    if (newSelection.has(convId)) {
      newSelection.delete(convId);
    } else {
      newSelection.add(convId);
    }
    setSelectedConversations(newSelection);
  };

  const selectAllConversations = () => {
    const allIds = new Set(conversations.map(conv => conv.id));
    setSelectedConversations(allIds);
  };

  const deselectAllConversations = () => {
    setSelectedConversations(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedConversations.size === 0) return;

    try {
      const conversationIds = Array.from(selectedConversations);

      const { error } = await supabase
        .from('conversations')
        .delete()
        .in('id', conversationIds);

      if (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression des conversations');
        return;
      }

      // Retirer de la liste
      setConversations(prev => prev.filter(conv => !selectedConversations.has(conv.id)));

      setDeleteDialogOpen(false);
      setSelectedConversations(new Set());
      setSelectionMode(false);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedConversations.size === 0) return;

    try {
      const conversationIds = Array.from(selectedConversations);

      const { error } = await supabase
        .from('conversations')
        .update({ status: 'active' })
        .in('id', conversationIds);

      if (error) {
        console.error('Erreur lors de la restauration:', error);
        alert('Erreur lors de la restauration des conversations');
        return;
      }

      // Retirer de la liste
      setConversations(prev => prev.filter(conv => !selectedConversations.has(conv.id)));

      setRestoreDialogOpen(false);
      setSelectedConversations(new Set());
      setSelectionMode(false);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        {selectionMode ? (
          // Mode sélection
          <div className="space-y-3">
            {/* Ligne 1 : Annuler + compteur */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectionMode}
                className="h-8 -ml-2"
              >
                <X className="h-4 w-4 mr-1" />
                <span className="text-xs">Annuler</span>
              </Button>
              <span className="text-sm font-semibold text-[#407b85]">
                {selectedConversations.size} sélectionné{selectedConversations.size > 1 ? 's' : ''}
              </span>
            </div>

            {/* Ligne 2 : Sélectionner tout / Désélectionner */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllConversations}
                className="flex-1 h-8 text-xs"
              >
                Tout sélectionner
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAllConversations}
                className="flex-1 h-8 text-xs"
                disabled={selectedConversations.size === 0}
              >
                Tout désélectionner
              </Button>
            </div>

            {/* Ligne 3 : Actions (Restaurer / Supprimer) */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRestoreDialogOpen(true)}
                disabled={selectedConversations.size === 0}
                className="flex-1 h-9 text-xs"
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Restaurer
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={selectedConversations.size === 0}
                className="flex-1 h-9 text-xs"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Supprimer
              </Button>
            </div>
          </div>
        ) : (
          // Mode normal
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span className="text-xs">Retour</span>
              </Button>
              <Button
                onClick={toggleSelectionMode}
                size="sm"
                variant="outline"
                className="h-8"
                title="Sélectionner plusieurs"
                disabled={conversations.length === 0}
              >
                <CheckSquare className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Conversations archivées</h2>
          </div>
        )}
      </div>

      {/* Liste des conversations archivées */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3 animate-fade-in">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Skeleton className="h-12 w-12 rounded-full animate-shimmer" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 animate-shimmer" style={{ animationDelay: '100ms' }} />
                  <Skeleton className="h-3 w-full animate-shimmer" style={{ animationDelay: '200ms' }} />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm">Aucune conversation archivée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="group relative py-3 pr-4 pl-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {/* Checkbox */}
                  <div className="flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleConversationSelection(conv.id);
                      }}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                      {selectedConversations.has(conv.id) ? (
                        <CheckSquare className="h-5 w-5 text-[#407b85]" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                  </div>

                  {/* Contenu de la conversation */}
                  <div
                    onClick={() => toggleConversationSelection(conv.id)}
                    className="cursor-pointer flex-1 min-w-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate text-gray-900">
                            {conv.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {getLastMessagePreview(conv.messages)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(conv.updated_at)}
                        </span>
                        {conv.messages && conv.messages.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {conv.messages.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer statistiques */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-center text-xs text-gray-600">
          <span>{conversations.length} conversation(s) archivée(s)</span>
        </div>
      </div>

      {/* Dialog de confirmation de suppression */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer définitivement les conversations"
        description={`Êtes-vous sûr de vouloir supprimer définitivement ${selectedConversations.size} conversation(s) ? Cette action est irréversible.`}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        onConfirm={handleBulkDelete}
        variant="destructive"
      />

      {/* Dialog de confirmation de restauration */}
      <ConfirmationDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        title="Restaurer les conversations"
        description={`Êtes-vous sûr de vouloir restaurer ${selectedConversations.size} conversation(s) ? Elles seront à nouveau visibles dans la liste principale.`}
        confirmText="Restaurer"
        cancelText="Annuler"
        onConfirm={handleBulkRestore}
        variant="default"
      />
    </div>
  );
}
