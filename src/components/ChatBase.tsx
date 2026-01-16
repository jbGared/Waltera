/**
 * Composant de chat générique réutilisable avec historique des conversations
 * Support du streaming et réponses JSON
 * Design style WhatsApp avec sidebar
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, AlertCircle, Smile, Menu, X, LucideIcon, AlignLeft, AlignCenter, AlignJustify } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import ConversationsList from '@/components/chat/ConversationsList';
import MessageBubble from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { ServiceIcon } from '@/components/chat/ServiceIcon';
import { useChatWithStreaming } from '@/hooks/useChatWithStreaming';
import { useChatWithEdgeFunction } from '@/hooks/useChatWithEdgeFunction';

export interface ChatConfig {
  /** Titre principal du chat */
  title: string;
  /** Description sous le titre */
  description: string;
  /** Type de service */
  serviceType: 'rag_contrats' | 'conventions' | 'analyse_fichiers';
  /** Emoji/icône affiché dans le header (peut être un string emoji ou une LucideIcon) */
  icon: string | LucideIcon;
  /** Couleur de fond de l'icône (hex color ou classe Tailwind) */
  iconBgColor: string;
  /** Placeholder du champ de saisie */
  placeholder: string;
  /** Liste des suggestions à afficher */
  suggestions: readonly string[];
  /** Message d'introduction quand le chat est vide */
  emptyStateMessage?: string;
  /** Afficher un warning banner ? */
  showWarning?: boolean;
  /** Titre du warning */
  warningTitle?: string;
  /** Message du warning */
  warningMessage?: string;
  /** URL du webhook (optionnel si useEdgeFunction=true) */
  webhookUrl?: string;
  /** Utiliser l'Edge Function au lieu du webhook */
  useEdgeFunction?: boolean;
  /** ID du client (pour filtrage dans Edge Function) */
  clientId?: string;
  /** Code du client (pour filtrage dans Edge Function) */
  clientCode?: string;
  /** Nombre de chunks à récupérer (Edge Function) */
  topK?: number;
  /** Élément React à afficher dans le header (boutons d'action, etc.) */
  headerActions?: React.ReactNode;
  /** Contenu personnalisé à afficher dans l'état vide (avant les suggestions) */
  emptyStateContent?: React.ReactNode;
  /** Afficher le sélecteur de longueur de réponse même sans useEdgeFunction */
  showResponseLengthSelector?: boolean;
}

/** Interface pour un hook de chat externe */
export interface ExternalChatHook {
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  input: string;
  setInput: (value: string | ((prev: string) => string)) => void;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  handleSendMessage: (messageText?: string) => Promise<void>;
  handleSuggestionClick: (suggestion: string) => void;
  loadConversation: (convId: string) => Promise<void>;
  startNewConversation: () => void;
  responseLength?: 'short' | 'medium' | 'long';
  setResponseLength?: (length: 'short' | 'medium' | 'long') => void;
}

interface ChatBaseProps {
  config: ChatConfig;
  /** Hook externe optionnel - si fourni, les hooks internes ne seront pas utilisés */
  externalHook?: ExternalChatHook;
  /** Callback quand une conversation est sélectionnée (null pour nouvelle conversation) */
  onConversationSelect?: (convId: string | null) => void;
  /** ID de la conversation sélectionnée (pour contrôle externe) */
  selectedConversationId?: string | null;
}

export default function ChatBase({ config, externalHook, onConversationSelect, selectedConversationId: externalSelectedConvId }: ChatBaseProps) {
  const [internalSelectedConvId, setInternalSelectedConvId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Gérer l'ID de conversation (interne ou externe)
  const selectedConversationId = externalSelectedConvId !== undefined ? externalSelectedConvId : internalSelectedConvId;
  const setSelectedConversationId = (convId: string | null) => {
    if (onConversationSelect) {
      onConversationSelect(convId);
    } else {
      setInternalSelectedConvId(convId);
    }
  };

  // Utiliser le hook externe si fourni, sinon utiliser les hooks internes
  const internalChatHook = config.useEdgeFunction
    ? useChatWithEdgeFunction({
        serviceType: config.serviceType,
        clientId: config.clientId,
        clientCode: config.clientCode,
        topK: config.topK,
        onConversationCreated: (id) => setSelectedConversationId(id),
      })
    : useChatWithStreaming({
        serviceType: config.serviceType,
        webhookUrl: config.webhookUrl || '',
        onConversationCreated: (id) => setSelectedConversationId(id),
      });

  // Utiliser le hook externe si fourni
  const chatHook = externalHook || internalChatHook;

  const {
    messages,
    input,
    setInput,
    isLoading,
    messagesEndRef,
    handleSendMessage,
    handleSuggestionClick,
    loadConversation,
    startNewConversation,
  } = chatHook;

  // Extraire responseLength et setResponseLength
  const responseLength = externalHook?.responseLength
    || (config.useEdgeFunction ? (internalChatHook as ReturnType<typeof useChatWithEdgeFunction>).responseLength : 'medium');
  const setResponseLength = externalHook?.setResponseLength
    || (config.useEdgeFunction ? (internalChatHook as ReturnType<typeof useChatWithEdgeFunction>).setResponseLength : undefined);

  // Focus automatique sur l'input après envoi
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const {
    title,
    description,
    icon,
    iconBgColor,
    placeholder,
    suggestions,
    emptyStateMessage = 'Commencez une conversation',
    showWarning = false,
    warningTitle = 'Service en cours de configuration',
    warningMessage = 'Ce service n\'est pas encore configuré.',
  } = config;

  const handleSelectConversation = async (convId: string) => {
    setSelectedConversationId(convId);
    await loadConversation(convId);
    setIsSidebarOpen(false); // Fermer la sidebar sur mobile après sélection
  };

  const handleNewConversation = () => {
    setSelectedConversationId(null);
    startNewConversation();
    setIsSidebarOpen(false); // Fermer la sidebar sur mobile
  };

  const handleEmojiSelect = (emoji: string) => {
    setInput(prev => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const commonEmojis = [
    '😊', '😂', '❤️', '👍', '👎', '🙏', '💪', '🎉',
    '✅', '❌', '⚠️', '📌', '💡', '🔥', '⭐', '👏'
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Layout principal avec sidebar */}
      <div className="flex gap-0 h-screen overflow-hidden relative">
          {/* Overlay mobile */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar des conversations - Overlay mobile, fixe desktop */}
          <div className={`
            fixed lg:relative top-0 lg:top-auto bottom-0 lg:bottom-auto left-0 z-50 lg:z-auto
            w-80 lg:w-80 h-screen lg:h-full flex-shrink-0
            bg-white shadow-xl lg:shadow-none border-r border-gray-200
            overflow-hidden flex flex-col
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            {/* Header de la sidebar avec bouton retour */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-2 py-1 -ml-2 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Retour</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(false)}
                className="h-8 w-8 lg:hidden"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-hidden">
              <ConversationsList
                serviceType={config.serviceType}
                selectedConversationId={selectedConversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
              />
            </div>
          </div>

          {/* Zone de chat principale */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden min-h-0">
            {/* Warning Banner */}
            {showWarning && (
              <div className="bg-yellow-50 border-b border-yellow-200 p-3 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 text-sm">{warningTitle}</h3>
                  <p className="text-xs text-yellow-700">{warningMessage}</p>
                </div>
              </div>
            )}

            {/* Header de la conversation */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  {/* Bouton menu burger - visible sur mobile uniquement */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden h-9 w-9 flex-shrink-0 text-gray-600 hover:text-gray-900"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>

                  {typeof icon === 'string' ? (
                    <div className="p-2 rounded-full bg-gray-200 flex-shrink-0" style={{ backgroundColor: iconBgColor.startsWith('#') ? iconBgColor + '33' : undefined }}>
                      <span className="text-lg">{icon}</span>
                    </div>
                  ) : (
                    <ServiceIcon icon={icon} color={iconBgColor.startsWith('#') ? iconBgColor : '#407b85'} size="sm" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-base truncate">
                      {title}
                    </h3>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      {description}
                    </p>
                  </div>
                </div>

                {/* Zone droite du header - Actions personnalisées uniquement */}
                {config.headerActions && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {config.headerActions}
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full px-4">
                  <div className="text-center max-w-md w-full">
                    <div className="bg-white rounded-full p-6 inline-block mb-4 shadow-sm">
                      <Sparkles className="w-12 h-12 text-[#407b85]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {emptyStateMessage}
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">{description}</p>

                    {/* Contenu personnalisé (ex: info IDCC sélectionné) */}
                    {config.emptyStateContent}

                    {/* Suggestions */}
                    <div className="space-y-3">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full p-3.5 text-left text-sm bg-white border border-gray-200 rounded-lg hover:border-[#407b85] hover:shadow-md transition-all"
                        >
                          <Sparkles className="w-4 h-4 inline mr-2 text-[#407b85]" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {/* Afficher le loader uniquement si en chargement ET pas de réponse assistant en cours */}
                  {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role !== 'assistant') && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-3 shadow-sm">
                        <TypingIndicator />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Zone de saisie */}
            <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
              {/* Sélecteur de longueur de réponse */}
              {(config.useEdgeFunction || config.showResponseLengthSelector || externalHook) && setResponseLength && (
                <div className="flex items-center justify-end gap-1 mb-2">
                  <span className="text-xs text-gray-500 mr-2">Longueur :</span>
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setResponseLength('short')}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all ${
                        responseLength === 'short'
                          ? 'bg-white text-[#407b85] shadow-sm font-medium'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Réponse courte (2-3 phrases)"
                    >
                      <AlignLeft className="w-3 h-3" />
                      <span className="hidden sm:inline">Court</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResponseLength('medium')}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all ${
                        responseLength === 'medium'
                          ? 'bg-white text-[#407b85] shadow-sm font-medium'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Réponse moyenne (équilibrée)"
                    >
                      <AlignCenter className="w-3 h-3" />
                      <span className="hidden sm:inline">Moyen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResponseLength('long')}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all ${
                        responseLength === 'long'
                          ? 'bg-white text-[#407b85] shadow-sm font-medium'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Réponse détaillée et complète"
                    >
                      <AlignJustify className="w-3 h-3" />
                      <span className="hidden sm:inline">Long</span>
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center bg-white border border-gray-200 rounded-lg pl-2 pr-2 py-1.5 shadow-sm">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:text-gray-700 h-10 w-10 flex-shrink-0"
                      type="button"
                    >
                      <Smile className="w-5 h-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="grid grid-cols-8 gap-1">
                      {commonEmojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => handleEmojiSelect(emoji)}
                          className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                          type="button"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={placeholder}
                  className="flex-1 border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[44px] max-h-[120px] px-3 py-3 text-base"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="bg-[#407b85] hover:bg-[#407b85]/90 rounded-full h-10 w-10 flex-shrink-0 ml-2"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
