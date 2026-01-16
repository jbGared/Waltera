import { FileText } from 'lucide-react';
import ChatBase, { type ChatConfig } from '@/components/ChatBase';
import { CHAT_SUGGESTIONS } from '@/constants';

const chatConfig: ChatConfig = {
  title: 'Contrats Clients',
  description: 'Posez vos questions sur les contrats et garanties',
  serviceType: 'rag_contrats',
  icon: FileText,
  iconBgColor: '#407b85',
  placeholder: 'Posez votre question (incluez le nom du client)...',
  suggestions: CHAT_SUGGESTIONS.contrats,
  emptyStateMessage: 'Commencez une conversation',
  // L'Edge Function identifie automatiquement le client depuis la question
  useEdgeFunction: true,
  topK: 20, // Augmenté à 20 chunks pour avoir plus de contexte
};

export default function ChatContrats() {
  return <ChatBase config={chatConfig} />;
}
