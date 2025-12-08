import { Check, CheckCheck } from 'lucide-react';
import { Message } from '@/hooks/useChat';

interface MessageBubbleProps {
  message: Message;
  isRead?: boolean;
}

export default function MessageBubble({ message, isRead = true }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2 sm:mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] min-w-[100px] rounded-2xl px-3 sm:px-4 py-2 shadow-sm ${
          isUser
            ? 'bg-[#407b85] text-white rounded-br-md'
            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
        }`}
      >
        {/* Contenu du message */}
        <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Footer avec heure et statut */}
        <div className={`flex items-center justify-end gap-1 mt-1 ${isUser ? 'text-white/70' : 'text-gray-500'}`}>
          <span className="text-[10px] sm:text-[11px] font-normal">
            {formatTime(message.timestamp)}
          </span>

          {/* Double check pour les messages envoyés */}
          {isUser && (
            <span className="ml-1">
              {isRead ? (
                <CheckCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              ) : (
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
