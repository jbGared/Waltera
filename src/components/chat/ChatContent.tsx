/**
 * Contenu du chat sans Navbar/Footer
 * Pour intégration dans des pages avec tabs
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Smile, Menu, X, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import ConversationsList from '@/components/chat/ConversationsList';
import MessageBubble from '@/components/chat/MessageBubble';
import { AnimatedW } from '@/components/chat/AnimatedW';
import { ServiceIcon } from '@/components/chat/ServiceIcon';
import { useChatWithStreaming } from '@/hooks/useChatWithStreaming';

export interface ChatContentConfig {
  /** Type de service */
  serviceType: 'rag_contrats' | 'conventions' | 'analyse_fichiers';
  /** Emoji/icône affiché dans le header (peut être un string emoji ou une LucideIcon) */
  icon: string | LucideIcon;
  /** Couleur de fond de l'icône (hex color) */
  iconBgColor: string;
  /** Placeholder du champ de saisie */
  placeholder: string;
  /** Liste des suggestions à afficher */
  suggestions: readonly string[];
  /** Message d'introduction quand le chat est vide */
  emptyStateMessage?: string;
  /** URL du webhook */
  webhookUrl: string;
  /** Titre pour l'assistant */
  title: string;
  /** Description */
  description: string;
}

interface ChatContentProps {
  config: ChatContentConfig;
}

export default function ChatContent({ config }: ChatContentProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
  } = useChatWithStreaming({
    serviceType: config.serviceType,
    webhookUrl: config.webhookUrl,
    onConversationCreated: (id) => setSelectedConversationId(id),
  });

  // Focus automatique sur l'input après envoi
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const {
    icon,
    iconBgColor,
    placeholder,
    suggestions,
    emptyStateMessage = 'Commencez une conversation',
    title,
    description,
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
    <div className="flex gap-0 sm:gap-6 h-[calc(100vh-340px)] overflow-hidden relative">
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
        w-80 lg:w-80 h-screen lg:h-auto flex-shrink-0
        bg-white rounded-r-lg lg:rounded-lg shadow-xl lg:shadow-sm border-r lg:border border-gray-200
        overflow-hidden flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Bouton fermer sur mobile */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">Conversations</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="h-8 w-8"
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
      <div className="flex-1 flex flex-col bg-white sm:rounded-lg sm:shadow-sm sm:border sm:border-gray-200 overflow-hidden min-h-0">
        {/* Header de la conversation */}
        <div className="sticky top-0 z-10 bg-[#f0f2f5] border-b border-gray-300 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Bouton menu burger sur mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden h-9 w-9 flex-shrink-0 text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-5 h-5" />
              </Button>

              {typeof icon === 'string' ? (
                <div className="p-2 rounded-full bg-gray-200 flex-shrink-0" style={{ backgroundColor: iconBgColor + '33' }}>
                  <span className="text-lg">{icon}</span>
                </div>
              ) : (
                <ServiceIcon icon={icon} color={iconBgColor} size="sm" />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-base truncate">
                  {selectedConversationId ? `Assistant ${title}` : `Nouvelle conversation`}
                </h3>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {selectedConversationId ? 'En ligne' : 'Commencez à taper pour créer une conversation'}
                </p>
              </div>
            </div>
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
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
                    <AnimatedW size="sm" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Zone de saisie */}
        <div className="bg-[#f0f2f5] border-t border-gray-300 p-3 sm:p-4">
          <div className="flex items-center bg-white rounded-lg pl-2 pr-2 py-1.5 shadow-sm">
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
  );
}
