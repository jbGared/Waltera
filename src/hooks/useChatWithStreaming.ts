/**
 * Hook pour gérer les conversations avec streaming depuis n8n
 * Supporte les réponses en streaming Server-Sent Events (SSE)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UseChatWithStreamingOptions {
  /** Type de service (pour filtrer les conversations) */
  serviceType: 'rag_contrats' | 'conventions' | 'analyse_fichiers';
  /** URL du webhook à appeler */
  webhookUrl: string;
  /** Callback quand une nouvelle conversation est créée */
  onConversationCreated?: (conversationId: string) => void;
}

export function useChatWithStreaming(options: UseChatWithStreamingOptions) {
  const { serviceType, webhookUrl, onConversationCreated } = options;

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
        console.log('[useChatWithStreaming] Création d\'une nouvelle conversation...');
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.error('[useChatWithStreaming] Utilisateur non authentifié');
          alert('Vous devez être connecté pour créer une conversation');
          return null;
        }

        const title = generateTitle(firstMessage);
        const sessionId = `${serviceType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
          console.error('[useChatWithStreaming] Erreur création conversation:', error);
          alert(`Erreur lors de la création de la conversation: ${error.message}`);
          return null;
        }

        if (onConversationCreated && data) {
          onConversationCreated((data as any).id);
        }

        return (data as any)?.id || null;
      } catch (err) {
        console.error('[useChatWithStreaming] Erreur exception:', err);
        return null;
      }
    },
    [serviceType, onConversationCreated]
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
        console.error('[useChatWithStreaming] Erreur sauvegarde messages:', result.error);
      }
    } catch (err) {
      console.error('[useChatWithStreaming] Erreur exception:', err);
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

  // Envoyer un message avec streaming
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

        const payload = {
          chatInput: text,
          sessionId: currentConvId || 'temp-' + Date.now(),
        };

        console.log('[useChatWithStreaming] Envoi de la requête:', {
          url: webhookUrl,
          payload,
        });

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal,
        });

        console.log('[useChatWithStreaming] Réponse reçue:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        let responseContent = '';

        // Vérifier si c'est du JSON ou du streaming
        if (contentType?.includes('application/json')) {
          console.log('[useChatWithStreaming] Réponse JSON détectée');

          // Lire le texte brut d'abord pour vérifier
          const textResponse = await response.text();
          console.log('[useChatWithStreaming] Texte brut reçu:', textResponse.substring(0, 200));

          // Détecter si c'est du streaming n8n (JSON Lines avec type/content)
          if (textResponse.includes('"type":"item"') || textResponse.includes('"type":"begin"')) {
            console.log('[useChatWithStreaming] Format streaming n8n détecté (JSON Lines)');

            // Parser les lignes JSON
            const lines = textResponse.split('\n');
            let accumulatedContent = '';

            for (const line of lines) {
              if (!line.trim()) continue;

              try {
                const event = JSON.parse(line);
                if (event.type === 'item' && event.content) {
                  accumulatedContent += event.content;
                }
              } catch (e) {
                console.warn('[useChatWithStreaming] Erreur parsing ligne:', line);
              }
            }

            responseContent = accumulatedContent;

            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: responseContent,
              timestamp: new Date(),
            };
            setMessages([...updatedMessages, assistantMessage]);

            // Sauvegarder et sortir
            if (currentConvId && responseContent) {
              const finalMessages = [...updatedMessages, assistantMessage];
              await saveMessages(currentConvId, finalMessages);
            }
            return;
          }

          // Sinon, essayer de parser comme JSON standard
          let data;
          try {
            data = JSON.parse(textResponse);
          } catch (parseError) {
            // Si le parsing JSON échoue, afficher le texte brut
            console.log('[useChatWithStreaming] Échec parsing JSON, affichage texte brut');
            responseContent = textResponse;

            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: responseContent,
              timestamp: new Date(),
            };
            setMessages([...updatedMessages, assistantMessage]);

            // Sauvegarder et sortir
            if (currentConvId && responseContent) {
              const finalMessages = [...updatedMessages, assistantMessage];
              await saveMessages(currentConvId, finalMessages);
            }
            return;
          }

          console.log('[useChatWithStreaming] Données JSON:', data);

          // Gérer le cas où la réponse est un tableau (format n8n)
          if (Array.isArray(data) && data.length > 0) {
            const firstItem = data[0];
            responseContent = firstItem.output || firstItem.response || firstItem.text || firstItem.message || JSON.stringify(firstItem);
          } else {
            // Essayer plusieurs formats de réponse possibles
            responseContent = data.output || data.response || data.text || data.message || JSON.stringify(data);
          }

          // Créer le message assistant avec la réponse
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseContent,
            timestamp: new Date(),
          };

          setMessages([...updatedMessages, assistantMessage]);

          // Sauvegarder dans Supabase
          if (currentConvId && responseContent) {
            const finalMessages = [...updatedMessages, assistantMessage];
            await saveMessages(currentConvId, finalMessages);
          }
        } else {
          // Mode streaming
          console.log('[useChatWithStreaming] Mode streaming détecté');
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error('Pas de reader disponible');
          }

          let accumulatedContent = '';
          let buffer = '';
          let assistantMessageCreated = false;

          console.log('[useChatWithStreaming] Début du streaming...');

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log('[useChatWithStreaming] Streaming terminé');
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Parser les lignes JSON (format n8n streaming)
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Garder la dernière ligne incomplète dans le buffer

            for (const line of lines) {
              if (!line.trim()) continue;

              try {
                const event = JSON.parse(line);
                console.log('[useChatWithStreaming] Event:', event);

                // N8n envoie des événements avec type: "item" et content
                if (event.type === 'item' && event.content) {
                  accumulatedContent += event.content;

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
              } catch (parseError) {
                console.warn('[useChatWithStreaming] Erreur parsing ligne:', line);
              }
            }
          }

          responseContent = accumulatedContent;

          // Sauvegarder dans Supabase après le streaming
          if (currentConvId && responseContent) {
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: responseContent,
              timestamp: new Date(),
            };
            const finalMessages = [...updatedMessages, assistantMessage];
            await saveMessages(currentConvId, finalMessages);
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Requête annulée');
          return;
        }

        console.error('Erreur envoi message:', error);
        console.error('Message d\'erreur:', error?.message);
        console.error('Stack trace:', error?.stack);
        console.error('Type d\'erreur:', typeof error, error?.constructor?.name);

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Désolé, une erreur s'est produite: ${error?.message || 'Erreur inconnue'}. Veuillez réessayer.`,
          timestamp: new Date(),
        };

        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1] = errorMessage;
          return newMessages;
        });
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [input, isLoading, conversationId, messages, webhookUrl, createNewConversation, saveMessages]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSendMessage(suggestion);
    },
    [handleSendMessage]
  );

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
