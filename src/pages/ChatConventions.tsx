import ChatBase, { type ChatConfig } from '@/components/ChatBase';
import { CHAT_SUGGESTIONS, WEBHOOKS } from '@/constants';

const chatConfig: ChatConfig = {
  title: 'Conventions Collectives',
  description: 'Consultez les informations des conventions collectives nationales',
  serviceType: 'conventions',
  icon: '📚',
  iconBgColor: 'bg-green-500',
  placeholder: 'Posez votre question sur les conventions collectives...',
  suggestions: CHAT_SUGGESTIONS.conventions,
  emptyStateMessage: 'Commencez une conversation',
  showWarning: !WEBHOOKS.CONVENTIONS,
  warningTitle: 'Service en cours de configuration',
  warningMessage: 'Le webhook n8n pour les conventions collectives n\'est pas encore configuré. Les réponses sont actuellement simulées en mode démonstration.',
  webhookUrl: WEBHOOKS.CONVENTIONS || 'https://n8n.srv659987.hstgr.cloud/webhook/placeholder',
};

export default function ChatConventions() {
  return <ChatBase config={chatConfig} />;
}
