/**
 * Hook pour gérer les conversations avec l'Edge Function recherche-ccn
 * Utilise l'Edge Function recherche-ccn pour la recherche dans les CCN
 * avec streaming Server-Sent Events (SSE) et hiérarchie juridique
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type ResponseLength = 'short' | 'medium' | 'long';

export interface UseChatCCNOptions {
  /** IDCC de la convention collective (optionnel) */
  idcc?: string;
  /** Nombre de chunks à récupérer (défaut: 15) */
  topK?: number;
  /** Longueur de la réponse (défaut: 'medium') */
  defaultResponseLength?: ResponseLength;
  /** Callback quand une nouvelle conversation est créée */
  onConversationCreated?: (conversationId: string) => void;
}

export function useChatCCN(options: UseChatCCNOptions = {}) {
  const { idcc, topK = 15, defaultResponseLength = 'medium', onConversationCreated } = options;

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseLength, setResponseLength] = useState<ResponseLength>(defaultResponseLength);
  const [currentIdcc, setCurrentIdcc] = useState<string | undefined>(idcc);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
  const createNewConversation = useCallback(
    async (firstMessage: string): Promise<string | null> => {
      try {
        console.log('[useChatCCN] Création d\'une nouvelle conversation...');
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.error('[useChatCCN] Utilisateur non authentifié');
          alert('Vous devez être connecté pour créer une conversation');
          return null;
        }

        const title = generateTitle(firstMessage);
        const sessionId = `conventions-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const { data, error } = await supabase
          .from('conversations' as any)
          .insert({
            user_id: user.id,
            title,
            session_id: sessionId,
            service_type: 'conventions',
            status: 'active',
            messages: [],
          } as any)
          .select()
          .single();

        if (error) {
          console.error('[useChatCCN] Erreur création conversation:', error);
          alert(`Erreur lors de la création de la conversation: ${error.message}`);
          return null;
        }

        if (onConversationCreated && data) {
          onConversationCreated((data as any).id);
        }

        return (data as any)?.id || null;
      } catch (err) {
        console.error('[useChatCCN] Erreur exception:', err);
        return null;
      }
    },
    [onConversationCreated]
  );

  // Sauvegarder les messages dans Supabase
  const saveMessages = useCallback(async (convId: string, newMessages: Message[]) => {
    try {
      const messagesForDB = newMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
      }));

      const result = await supabase
        .from('conversations')
        // @ts-ignore
        .update({
          messages: messagesForDB,
          updated_at: new Date().toISOString(),
        })
        .eq('id', convId);

      if (result.error) {
        console.error('[useChatCCN] Erreur sauvegarde messages:', result.error);
      }
    } catch (err) {
      console.error('[useChatCCN] Erreur exception:', err);
    }
  }, []);

  // Charger une conversation existante
  const loadConversation = useCallback(async (convId: string) => {
    try {
      const { data, error } = (await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .single()) as any;

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

  // Envoyer un message avec streaming via Edge Function recherche-ccn
  const handleSendMessage = useCallback(
    async (messageText?: string) => {
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
        // Annuler toute requête précédente
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        // Récupérer le token d'authentification
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('Session non authentifiée');
        }

        // Construire le payload pour l'Edge Function recherche-ccn
        const payload: {
          query: string;
          top_k: number;
          response_length: ResponseLength;
          history: { role: string; content: string }[];
          idcc?: string;
        } = {
          query: text,
          top_k: topK,
          response_length: responseLength,
          // Envoyer l'historique des messages pour maintenir le contexte
          history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        };

        // Ajouter l'IDCC si spécifié
        if (currentIdcc) {
          payload.idcc = currentIdcc;
        }

        console.log('[useChatCCN] Appel Edge Function recherche-ccn:', payload);

        // Récupérer l'URL Supabase depuis les variables d'environnement
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

        // Appeler l'Edge Function recherche-ccn
        const response = await fetch(
          `${supabaseUrl}/functions/v1/recherche-ccn`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(payload),
            signal: abortControllerRef.current.signal,
          }
        );

        console.log('[useChatCCN] Réponse reçue:', {
          status: response.status,
          statusText: response.statusText,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
        }

        // Lire le streaming SSE
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Pas de reader disponible');
        }

        let accumulatedContent = '';
        let assistantMessageCreated = false;

        console.log('[useChatCCN] Début du streaming...');

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('[useChatCCN] Streaming terminé');
            break;
          }

          const chunk = decoder.decode(value, { stream: true });

          // Parser les lignes SSE (format: "data: {...}\n\n")
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6); // Enlever "data: "

              try {
                const data = JSON.parse(dataStr);

                if (data.text) {
                  accumulatedContent += data.text;

                  // Créer le message assistant lors du premier contenu
                  if (!assistantMessageCreated && accumulatedContent.trim()) {
                    assistantMessageCreated = true;
                    const assistantMessage: Message = {
                      id: (Date.now() + 1).toString(),
                      role: 'assistant',
                      content: accumulatedContent,
                      timestamp: new Date(),
                    };
                    setMessages([...updatedMessages, assistantMessage]);
                  } else if (assistantMessageCreated) {
                    // Mettre à jour le dernier message avec le contenu accumulé
                    setMessages((prevMessages) => {
                      const newMessages = [...prevMessages];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage && lastMessage.role === 'assistant') {
                        lastMessage.content = accumulatedContent;
                      }
                      return newMessages;
                    });
                  }
                }

                // Capturer l'IDCC détecté si retourné par l'Edge Function
                if (data.idcc && !currentIdcc) {
                  setCurrentIdcc(data.idcc);
                }
              } catch (parseError) {
                console.warn('[useChatCCN] Erreur parsing SSE:', line);
              }
            }
          }
        }

        // Sauvegarder dans Supabase après le streaming
        if (currentConvId && accumulatedContent) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: accumulatedContent,
            timestamp: new Date(),
          };
          const finalMessages = [...updatedMessages, assistantMessage];
          await saveMessages(currentConvId, finalMessages);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Requête annulée');
          return;
        }

        console.error('[useChatCCN] Erreur:', error);

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Désolé, une erreur s'est produite: ${error?.message || 'Erreur inconnue'}. Veuillez réessayer.`,
          timestamp: new Date(),
        };

        setMessages([...updatedMessages, errorMessage]);

        // Sauvegarder l'erreur aussi
        if (conversationId) {
          await saveMessages(conversationId, [...updatedMessages, errorMessage]);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [input, isLoading, conversationId, messages, topK, responseLength, currentIdcc, createNewConversation, saveMessages]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSendMessage(suggestion);
    },
    [handleSendMessage]
  );

  // Permettre de changer l'IDCC en cours de conversation
  const setIdcc = useCallback((newIdcc: string | undefined) => {
    setCurrentIdcc(newIdcc);
  }, []);

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
    responseLength,
    setResponseLength,
    currentIdcc,
    setIdcc,
  };
}
