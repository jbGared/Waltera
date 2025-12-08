import { useState } from 'react';
import { Send, Sparkles, Loader2, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ConversationsList from '@/components/chat/ConversationsList';
import MessageBubble from '@/components/chat/MessageBubble';
import { useChatWithHistory } from '@/hooks/useChatWithHistory';
import { CHAT_SUGGESTIONS, WEBHOOKS } from '@/constants';

export default function CCNConsultTab() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

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
  } = useChatWithHistory({
    serviceType: 'conventions',
    webhookUrl: WEBHOOKS.CONVENTIONS,
    onConversationCreated: (id) => setSelectedConversationId(id),
  });

  const handleSelectConversation = async (convId: string) => {
    setSelectedConversationId(convId);
    await loadConversation(convId);
  };

  const handleNewConversation = () => {
    setSelectedConversationId(null);
    startNewConversation();
  };

  const suggestions = CHAT_SUGGESTIONS.conventions;

  return (
    <div className="flex gap-4 h-[calc(100vh-340px)] bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Sidebar des conversations */}
      <div className="w-80 flex-shrink-0">
        <ConversationsList
          serviceType="conventions"
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />
      </div>

      {/* Zone de chat principale */}
      <div className="flex-1 flex flex-col bg-white border-l border-gray-200">
        {/* Header */}
        <div className="bg-[#f0f2f5] border-b border-gray-300 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-100">
              <span className="text-lg">📚</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {selectedConversationId ? 'Assistant CCN' : 'Nouvelle conversation - CCN'}
              </h3>
              <p className="text-xs text-gray-500">
                {selectedConversationId ? 'En ligne' : 'Commencez à taper pour créer une conversation'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="bg-white rounded-full p-6 inline-block mb-4 shadow-sm">
                  <Sparkles className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Interrogez les CCN
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Posez vos questions sur les conventions collectives importées
                </p>

                {/* Suggestions */}
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full p-3 text-left text-sm bg-white border border-gray-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all"
                    >
                      <Sparkles className="w-4 h-4 inline mr-2 text-purple-600" />
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
                <div className="flex justify-start mb-3">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Zone de saisie */}
        <div className="bg-[#f0f2f5] border-t border-gray-300 p-4">
          <div className="flex items-end gap-2 bg-white rounded-lg p-2 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <Smile className="w-5 h-5" />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Posez votre question sur les CCN..."
              className="flex-1 border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[120px]"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 rounded-full h-10 w-10 p-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
