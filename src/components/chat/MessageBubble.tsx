import { Check, CheckCheck } from 'lucide-react';
import { Message } from '@/hooks/useChat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] min-w-[100px] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? 'bg-[#407b85] text-white rounded-br-md'
            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
        }`}
      >
        {/* Contenu du message avec support markdown pour l'assistant */}
        {isUser ? (
          <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        ) : (
          <div className="prose prose-sm max-w-none text-gray-900">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Style des titres
                h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 text-gray-900" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 text-gray-900" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-base font-semibold mb-1 text-gray-900" {...props} />,

                // Style des listes
                ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                li: ({ node, ...props }) => <li className="text-gray-900" {...props} />,

                // Style des paragraphes
                p: ({ node, ...props }) => <p className="mb-2 leading-relaxed text-gray-900" {...props} />,

                // Style du code
                code: ({ node, inline, ...props }: any) =>
                  inline ? (
                    <code className="bg-gray-100 text-[#407b85] px-1 py-0.5 rounded text-sm font-mono" {...props} />
                  ) : (
                    <code className="block bg-gray-100 text-gray-900 p-2 rounded text-sm font-mono overflow-x-auto" {...props} />
                  ),
                pre: ({ node, ...props }) => <pre className="bg-gray-100 p-3 rounded mb-2 overflow-x-auto" {...props} />,

                // Style des liens
                a: ({ node, ...props }) => (
                  <a
                    className="text-[#407b85] hover:underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  />
                ),

                // Style de strong et em
                strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
                em: ({ node, ...props }) => <em className="italic text-gray-800" {...props} />,

                // Style des citations
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-[#407b85] pl-3 italic text-gray-700 my-2" {...props} />
                ),

                // Style des tables
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto mb-2">
                    <table className="min-w-full border-collapse border border-gray-300" {...props} />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-semibold text-gray-900" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="border border-gray-300 px-2 py-1 text-gray-900" {...props} />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Footer avec heure et statut */}
        <div className={`flex items-center justify-end gap-1 mt-2 ${isUser ? 'text-white/70' : 'text-gray-500'}`}>
          <span className="text-xs font-normal">
            {formatTime(message.timestamp)}
          </span>

          {/* Double check pour les messages envoyés */}
          {isUser && (
            <span className="ml-1">
              {isRead ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
