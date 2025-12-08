/**
 * Contenu du chat sans Navbar/Footer
 * Pour intégration dans des pages avec tabs
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import ConversationsList from '@/components/chat/ConversationsList';
import MessageBubble from '@/components/chat/MessageBubble';
import { useChatWithStreaming } from '@/hooks/useChatWithStreaming';

export interface ChatContentConfig {
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
    <div className="flex gap-6 h-[calc(100vh-340px)] overflow-hidden">
      {/* Sidebar des conversations - 320px fixe */}
      <div className="w-80 flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <ConversationsList
          serviceType={config.serviceType}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />
      </div>

      {/* Zone de chat principale */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header de la conversation */}
        <div className="bg-[#f0f2f5] border-b border-gray-300 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${iconBgColor} bg-opacity-20`}>
                <span className="text-lg">{icon}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedConversationId ? `Assistant ${title}` : `Nouvelle conversation - ${title}`}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedConversationId ? 'En ligne' : 'Commencez à taper pour créer une conversation'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="bg-white rounded-full p-6 inline-block mb-4 shadow-sm">
                  <Sparkles className="w-12 h-12 text-[#407b85]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {emptyStateMessage}
                </h3>
                <p className="text-sm text-gray-600 mb-6">{description}</p>

                {/* Suggestions */}
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full p-3 text-left text-sm bg-white border border-gray-200 rounded-lg hover:border-[#407b85] hover:shadow-md transition-all"
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
        <div className="bg-[#f0f2f5] border-t border-gray-300 p-4">
          <div className="flex items-center bg-white rounded-lg pl-1 pr-2 py-1 shadow-sm">
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
              className="flex-1 border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[120px] px-2 py-2.5"
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
