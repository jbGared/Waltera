/**
 * Hook amélioré pour gérer les conversations avec historisation dans Supabase
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UseChatWithHistoryOptions {
  /** Type de service (pour filtrer les conversations) */
  serviceType: 'rag_contrats' | 'conventions' | 'analyse_fichiers';
  /** URL du webhook à appeler */
  webhookUrl?: string;
  /** Fonction custom pour gérer l'envoi */
  onSendMessage?: (text: string) => Promise<string>;
  /** Délai de simulation */
  simulateDelay?: number;
  /** Réponse simulée */
  simulateResponse?: string;
  /** Callback quand une nouvelle conversation est créée */
  onConversationCreated?: (conversationId: string) => void;
}

export function useChatWithHistory(options: UseChatWithHistoryOptions) {
  const {
    serviceType,
    webhookUrl,
    onSendMessage,
    simulateDelay = 1000,
    simulateResponse = 'Cette fonctionnalité est en cours de configuration.',
    onConversationCreated,
  } = options;

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Générer un titre automatique basé sur le premier message
  const generateTitle = (firstMessage: string): string => {
    const maxLength = 50;
    if (firstMessage.length <= maxLength) {
      return firstMessage;
    }
    return firstMessage.substring(0, maxLength) + '...';
  };

  // Créer une nouvelle conversation dans Supabase
  const createNewConversation = useCallback(async (firstMessage: string): Promise<string | null> => {
    try {
      console.log('[useChatWithHistory] Création d\'une nouvelle conversation...');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('[useChatWithHistory] Utilisateur non authentifié');
        alert('Vous devez être connecté pour créer une conversation');
        return null;
      }

      console.log('[useChatWithHistory] Utilisateur authentifié:', user.id);

      const title = generateTitle(firstMessage);
      const sessionId = `${serviceType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      console.log('[useChatWithHistory] Tentative d\'insertion:', {
        user_id: user.id,
        title,
        session_id: sessionId,
        service_type: serviceType,
      });

      const { data, error } = await supabase
        .from('conversations' as any)
        .insert({
          user_id: user.id,
          title,
          session_id: sessionId,
          service_type: serviceType,
          status: 'active',
          messages: [],
        } as any)
        .select()
        .single();

      if (error) {
        console.error('[useChatWithHistory] Erreur création conversation:', error);
        alert(`Erreur lors de la création de la conversation: ${error.message}`);
        return null;
      }

      console.log('[useChatWithHistory] Conversation créée avec succès:', data);

      if (onConversationCreated && data) {
        onConversationCreated((data as any).id);
      }

      return (data as any)?.id || null;
    } catch (err) {
      console.error('[useChatWithHistory] Erreur exception:', err);
      return null;
    }
  }, [serviceType, onConversationCreated]);

  // Sauvegarder les messages dans Supabase
  const saveMessages = useCallback(async (convId: string, newMessages: Message[]) => {
    try {
      console.log('[useChatWithHistory] Sauvegarde des messages pour la conversation:', convId);
      const messagesForDB = newMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
      }));

      // @ts-ignore - Types non mis à jour pour conversations
      const result = await supabase
        .from('conversations')
        // @ts-ignore
        .update({
          messages: messagesForDB,
          updated_at: new Date().toISOString(),
        })
        .eq('id', convId);

      if (result.error) {
        console.error('[useChatWithHistory] Erreur sauvegarde messages:', result.error);
      } else {
        console.log('[useChatWithHistory] Messages sauvegardés avec succès');
      }
    } catch (err) {
      console.error('[useChatWithHistory] Erreur exception:', err);
    }
  }, []);

  // Charger une conversation existante
  const loadConversation = useCallback(async (convId: string) => {
    try {
      const { data, error } = await (supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .single() as any);

      if (error) {
        console.error('Erreur chargement conversation:', error);
        return;
      }

      if (data && data.messages) {
        const loadedMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(loadedMessages);
      }

      setConversationId(convId);
    } catch (err) {
      console.error('Erreur:', err);
    }
  }, []);

  // Démarrer une nouvelle conversation
  const startNewConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setInput('');
  }, []);

  // Envoyer un message
  const handleSendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    // Créer une conversation si nécessaire
    let currentConvId = conversationId;
    if (!currentConvId) {
      currentConvId = await createNewConversation(text);
      if (currentConvId) {
        setConversationId(currentConvId);
      }
    }

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      let responseContent: string;

      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: text,
            sessionId: currentConvId || 'temp-' + Date.now(),
          }),
        });

        if (!response.ok) throw new Error('Erreur webhook');

        const data = await response.json();
        responseContent = data.response || data.answer || 'Désolé, je n\'ai pas pu traiter votre demande.';
      } else if (onSendMessage) {
        responseContent = await onSendMessage(text);
      } else {
        await new Promise(resolve => setTimeout(resolve, simulateDelay));
        responseContent = simulateResponse;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Sauvegarder dans Supabase
      if (currentConvId) {
        await saveMessages(currentConvId, finalMessages);
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
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
  }, [
    input,
    isLoading,
    conversationId,
    messages,
    webhookUrl,
    onSendMessage,
    simulateDelay,
    simulateResponse,
    createNewConversation,
    saveMessages,
  ]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleSendMessage(suggestion);
  }, [handleSendMessage]);

  return {
    conversationId,
    messages,
    input,
    setInput,
    isLoading,
    messagesEndRef,
    handleSendMessage,
    handleSuggestionClick,
    loadConversation,
    startNewConversation,
  };
}
