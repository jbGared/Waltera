/**
 * Composant de chat générique réutilisable avec historique des conversations
 * Support du streaming et réponses JSON
 * Design style WhatsApp avec sidebar
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, AlertCircle, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ConversationsList from '@/components/chat/ConversationsList';
import MessageBubble from '@/components/chat/MessageBubble';
import { useChatWithStreaming } from '@/hooks/useChatWithStreaming';

export interface ChatConfig {
  /** Titre principal du chat */
  title: string;
  /** Description sous le titre */
  description: string;
  /** Type de service */
  serviceType: 'rag_contrats' | 'conventions' | 'analyse_fichiers';
  /** Emoji/icône affiché dans le header */
  icon: string;
  /** Couleur du fond de l'icône (classe Tailwind) */
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
  /** URL du webhook */
  webhookUrl: string;
}

interface ChatBaseProps {
  config: ChatConfig;
}

export default function ChatBase({ config }: ChatBaseProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
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
  };

  const handleNewConversation = () => {
    setSelectedConversationId(null);
    startNewConversation();
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
        {/* Header */}
        <div className="mb-3 sm:mb-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-[#407b85] mb-2 sm:mb-3 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au Dashboard
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{title}</h1>
            <p className="text-sm sm:text-base text-gray-600">{description}</p>
          </div>
        </div>

        {/* Warning Banner */}
        {showWarning && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 text-sm">{warningTitle}</h3>
              <p className="text-xs text-yellow-700">{warningMessage}</p>
            </div>
          </div>
        )}

        {/* Layout principal avec sidebar */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-240px)] overflow-hidden">
          {/* Sidebar des conversations - Responsive */}
          <div className="w-full lg:w-80 flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-h-60 lg:max-h-none">
            <ConversationsList
              serviceType={config.serviceType}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
            />
          </div>

          {/* Zone de chat principale */}
          <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-0">
            {/* Header de la conversation */}
            <div className="bg-[#f0f2f5] border-b border-gray-300 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-full ${iconBgColor} bg-opacity-20 flex-shrink-0`}>
                    <span className="text-lg">{icon}</span>
                  </div>
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
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-3 shadow-sm">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
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
      </main>

      <Footer />
    </div>
  );
}
