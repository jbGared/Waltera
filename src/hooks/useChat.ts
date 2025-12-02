/**
 * Hook pour gérer la logique de chat (messages, envoi, loading)
 */

import { useState, useRef, useEffect, useCallback } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UseChatOptions {
  /**
   * URL du webhook à appeler pour envoyer les messages
   */
  webhookUrl?: string;
  /**
   * Fonction custom pour gérer l'envoi de messages (alternative au webhook)
   */
  onSendMessage?: (text: string) => Promise<string>;
  /**
   * Délai pour simuler une réponse (mode demo)
   */
  simulateDelay?: number;
  /**
   * Message de réponse par défaut en mode simulation
   */
  simulateResponse?: string;
}

export function useChat(options: UseChatOptions = {}) {
  const {
    webhookUrl,
    onSendMessage,
    simulateDelay = 1000,
    simulateResponse = 'Cette fonctionnalité est en cours de configuration.',
  } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let responseContent: string;

      // Mode 1: Webhook URL fourni
      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: text,
            sessionId: 'web-' + Date.now(),
          }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la communication avec le service');
        }

        const data = await response.json();
        responseContent = data.response || data.answer || 'Désolé, je n\'ai pas pu traiter votre demande.';
      }
      // Mode 2: Fonction custom fournie
      else if (onSendMessage) {
        responseContent = await onSendMessage(text);
      }
      // Mode 3: Simulation (fallback)
      else {
        await new Promise(resolve => setTimeout(resolve, simulateDelay));
        responseContent = simulateResponse;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, webhookUrl, onSendMessage, simulateDelay, simulateResponse]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleSendMessage(suggestion);
  }, [handleSendMessage]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    messagesEndRef,
    handleSendMessage,
    handleSuggestionClick,
  };
}
