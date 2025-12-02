import ChatBase, { type ChatConfig } from '@/components/ChatBase';
import { CHAT_SUGGESTIONS, WEBHOOKS } from '@/constants';

const chatConfig: ChatConfig = {
  title: 'Conventions Collectives',
  description: 'Consultez les informations des conventions collectives nationales',
  icon: '📚',
  iconBgColor: 'bg-green-500',
  placeholder: 'Posez votre question sur les conventions collectives...',
  suggestions: CHAT_SUGGESTIONS.conventions,
  emptyStateMessage: 'Commencez une conversation',
  showWarning: !WEBHOOKS.CONVENTIONS,
  warningTitle: 'Service en cours de configuration',
  warningMessage: 'Le webhook n8n pour les conventions collectives n\'est pas encore configuré. Les réponses sont actuellement simulées en mode démonstration.',
};

const simulateResponse = `Je suis désolé, le service d'analyse des conventions collectives n'est pas encore configuré.

Cette fonctionnalité permettra d'interroger la base de données des conventions collectives nationales et d'obtenir des informations sur :
- Les congés et jours fériés
- Les préavis de démission
- Les primes et indemnités obligatoires
- Les classifications professionnelles
- Les avantages sociaux

Le webhook n8n sera configuré prochainement pour activer ce service.`;

export default function ChatConventions() {
  return (
    <ChatBase
      config={chatConfig}
      chatOptions={{
        webhookUrl: WEBHOOKS.CONVENTIONS,
        simulateResponse,
      }}
    />
  );
}
