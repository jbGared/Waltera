import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquarePlus, Search, Archive, Pencil, Check, X, MoreVertical, Trash2, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import ArchivedConversationsList from './ArchivedConversationsList';

interface Conversation {
  id: string;
  title: string;
  service_type: string;
  updated_at: string;
  messages: any[];
  status: string;
}

interface ConversationsListProps {
  serviceType: 'rag_contrats' | 'conventions' | 'analyse_fichiers';
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

export default function ConversationsList({
  serviceType,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [conversationToArchive, setConversationToArchive] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [showArchives, setShowArchives] = useState(false);

  useEffect(() => {
    fetchConversations(true); // Initial load avec loading

    // Configurer un polling pour rafraîchir automatiquement
    const interval = setInterval(() => {
      fetchConversations(false); // Refresh silencieux sans loading
    }, 5000); // Rafraîchir toutes les 5 secondes

    return () => clearInterval(interval);
  }, [serviceType]);

  async function fetchConversations(showLoading = true) {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_type', serviceType)
        .eq('status', 'active')
        .order('updated_at', { ascending: false }) as any);

      if (error) {
        console.error('Erreur lors de la récupération des conversations:', error);
        return;
      }

      setConversations(data || []);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Hier';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getLastMessagePreview = (messages: any[]) => {
    if (!messages || messages.length === 0) return 'Aucun message';
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content || '';
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  };

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleSaveEdit = async (convId: string) => {
    if (!editingTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: editingTitle.trim() })
        .eq('id', convId);

      if (error) {
        console.error('Erreur lors du renommage:', error);
        alert('Erreur lors du renommage de la conversation');
        return;
      }

      // Mettre à jour localement
      setConversations(prev =>
        prev.map((conv: any) =>
          conv.id === convId ? { ...conv, title: editingTitle.trim() } : conv
        )
      );

      setEditingId(null);
      setEditingTitle('');
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleOpenArchiveDialog = (convId: string) => {
    setConversationToArchive(convId);
    setArchiveDialogOpen(true);
  };

  const handleArchive = async () => {
    if (!conversationToArchive) return;

    try{
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'archived' })
        .eq('id', conversationToArchive);

      if (error) {
        console.error('Erreur lors de l\'archivage:', error);
        alert('Erreur lors de l\'archivage de la conversation');
        return;
      }

      // Retirer de la liste
      setConversations(prev => prev.filter((conv: any) => conv.id !== conversationToArchive));

      // Si c'était la conversation sélectionnée, déselectionner
      if (selectedConversationId === conversationToArchive) {
        onNewConversation();
      }

      setArchiveDialogOpen(false);
      setConversationToArchive(null);
    } catch (err) {
      console.error('Erreur:', err);
    }
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
    const allIds = new Set(filteredConversations.map(conv => conv.id));
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
        .update({ status: 'archived' })
        .in('id', conversationIds);

      if (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression des conversations');
        return;
      }

      // Retirer de la liste
      setConversations(prev => prev.filter(conv => !selectedConversations.has(conv.id)));

      // Si la conversation sélectionnée était dans la liste, déselectionner
      if (selectedConversationId && selectedConversations.has(selectedConversationId)) {
        onNewConversation();
      }

      setBulkDeleteDialogOpen(false);
      setSelectedConversations(new Set());
      setSelectionMode(false);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  // Si on affiche les archives, utiliser le composant dédié
  if (showArchives) {
    return (
      <ArchivedConversationsList
        serviceType={serviceType}
        onBack={() => setShowArchives(false)}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        {selectionMode ? (
          // Mode sélection
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectionMode}
                  className="h-8"
                >
                  <X className="h-4 w-4 mr-1" />
                  <span className="text-xs">Annuler</span>
                </Button>
                <span className="text-sm font-medium text-gray-900">
                  {selectedConversations.size} sélectionné(s)
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={selectedConversations.size === 0}
                className="h-8"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                <span className="text-xs">Supprimer</span>
              </Button>
            </div>
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
          </div>
        ) : (
          // Mode normal
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
              <div className="flex gap-2">
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
                <Button
                  onClick={onNewConversation}
                  size="sm"
                  className="bg-[#407b85] hover:bg-[#407b85]/90 h-8"
                  title="Nouvelle conversation"
                >
                  <MessageSquarePlus className="h-4 w-4 mr-1" />
                  <span className="text-xs">Nouveau</span>
                </Button>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="pl-9 bg-gray-50 border-gray-200"
              />
            </div>
          </>
        )}
      </div>

      {/* Liste des conversations */}
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
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquarePlus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">
              {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
            </p>
            <button
              onClick={onNewConversation}
              className="mt-2 text-[#407b85] hover:underline text-sm"
            >
              Créer une nouvelle conversation
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative py-3 pr-4 pl-2 hover:bg-gray-50 transition-colors border-l-4 ${
                  selectedConversationId === conv.id ? 'bg-[#407b85]/5 border-l-[#407b85]' : 'border-l-transparent'
                }`}
              >
                {editingId === conv.id ? (
                  // Mode édition
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(conv.id);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      className="flex-1 h-8 text-sm"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveEdit(conv.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  // Mode normal
                  <div className="flex items-center gap-2">
                    {/* Checkbox en mode sélection */}
                    {selectionMode ? (
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
                    ) : (
                      // Menu d'actions à gauche - caché par défaut
                      <div className={`flex-shrink-0 transition-all overflow-hidden ${
                        selectedConversationId === conv.id ? 'w-8' : 'w-0 group-hover:w-8'
                      }`}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(conv);
                              }}
                              className="cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Renommer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenArchiveDialog(conv.id);
                              }}
                              className="cursor-pointer text-orange-600 focus:text-orange-600"
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archiver
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}

                    {/* Contenu de la conversation */}
                    <div
                      onClick={() => selectionMode ? toggleConversationSelection(conv.id) : onSelectConversation(conv.id)}
                      className="cursor-pointer flex-1 min-w-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-medium truncate ${
                              selectedConversationId === conv.id ? 'text-[#407b85]' : 'text-gray-900'
                            }`}>
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer statistiques */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{conversations.length} conversation(s)</span>
          <button
            onClick={() => setShowArchives(true)}
            className="hover:text-[#407b85] flex items-center gap-1 transition-colors"
          >
            <Archive className="h-3 w-3" />
            Archives
          </button>
        </div>
      </div>

      {/* Dialog de confirmation d'archivage */}
      <ConfirmationDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Archiver la conversation"
        description="Êtes-vous sûr de vouloir archiver cette conversation ? Elle ne sera plus visible dans la liste."
        confirmText="Archiver"
        cancelText="Annuler"
        onConfirm={handleArchive}
        variant="destructive"
      />

      {/* Dialog de confirmation de suppression en masse */}
      <ConfirmationDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Supprimer les conversations sélectionnées"
        description={`Êtes-vous sûr de vouloir supprimer ${selectedConversations.size} conversation(s) ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleBulkDelete}
        variant="destructive"
      />
    </div>
  );
}
