import ChatBase, { type ChatConfig } from '@/components/ChatBase';
import { CHAT_SUGGESTIONS, WEBHOOKS } from '@/constants';

const chatConfig: ChatConfig = {
  title: 'Consultation Contrats Clients',
  description: 'Posez vos questions sur les contrats et garanties',
  icon: '📋',
  iconBgColor: 'bg-blue-500',
  placeholder: 'Posez votre question sur les contrats...',
  suggestions: CHAT_SUGGESTIONS.contrats,
  emptyStateMessage: 'Commencez une conversation',
};

export default function ChatContrats() {
  return (
    <ChatBase
      config={chatConfig}
      chatOptions={{
        webhookUrl: WEBHOOKS.RAG_CONTRATS,
      }}
    />
  );
}
