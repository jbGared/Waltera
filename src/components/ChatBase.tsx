/**
 * Composant de chat générique réutilisable
 * Unifie ChatContrats et ChatConventions
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useChat, type UseChatOptions } from '@/hooks/useChat';

export interface ChatConfig {
  /** Titre principal du chat */
  title: string;
  /** Description sous le titre */
  description: string;
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
}

interface ChatBaseProps {
  config: ChatConfig;
  chatOptions?: UseChatOptions;
}

export default function ChatBase({ config, chatOptions }: ChatBaseProps) {
  const {
    messages,
    input,
    setInput,
    isLoading,
    messagesEndRef,
    handleSendMessage,
    handleSuggestionClick,
  } = useChat(chatOptions);

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-[#407b85] mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au Dashboard
          </Link>
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${iconBgColor} bg-opacity-10`}>
              <span className="text-3xl">{icon}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600">{description}</p>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        {showWarning && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">{warningTitle}</h3>
              <p className="text-sm text-yellow-700">{warningMessage}</p>
            </div>
          </div>
        )}

        {/* Chat Container */}
        <Card className="h-[600px] flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 mx-auto text-[#407b85] mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {emptyStateMessage}
                  </h3>
                  <p className="text-gray-600 mb-6">{description}</p>

                  {/* Suggestions */}
                  <div className="max-w-2xl mx-auto">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Suggestions :
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="p-3 text-left text-sm bg-white border border-gray-200 rounded-lg hover:border-[#407b85] hover:bg-[#407b85]/5 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-[#407b85] text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                        <Loader2 className="w-5 h-5 animate-spin text-[#407b85]" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder={placeholder}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="bg-[#407b85] hover:bg-[#407b85]/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
