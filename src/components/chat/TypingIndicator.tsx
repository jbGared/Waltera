/**
 * Indicateur de frappe (typing indicator)
 * Trois points animés - style classique des applications de chat
 */

interface TypingIndicatorProps {
  color?: string;
}

export function TypingIndicator({ color = '#407b85' }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <span
        className="w-2.5 h-2.5 rounded-full opacity-80"
        style={{
          backgroundColor: color,
          animation: 'typing-bounce 1.4s ease-in-out infinite',
          animationDelay: '0ms'
        }}
      />
      <span
        className="w-2.5 h-2.5 rounded-full opacity-80"
        style={{
          backgroundColor: color,
          animation: 'typing-bounce 1.4s ease-in-out infinite',
          animationDelay: '200ms'
        }}
      />
      <span
        className="w-2.5 h-2.5 rounded-full opacity-80"
        style={{
          backgroundColor: color,
          animation: 'typing-bounce 1.4s ease-in-out infinite',
          animationDelay: '400ms'
        }}
      />
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default TypingIndicator;
