import React from 'react';

interface AnimatedWProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const AnimatedW: React.FC<AnimatedWProps> = ({
  size = 'md',
  color = '#407b85'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          viewBox="0 0 100 100"
          className="animate-pulse-scale"
          style={{ filter: 'drop-shadow(0 2px 8px rgba(64, 123, 133, 0.3))' }}
        >
          <text
            x="50"
            y="75"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="700"
            fontSize="80"
            fill={color}
            className="animate-float"
          >
            W
          </text>
        </svg>
      </div>
      <style>{`
        @keyframes pulse-scale {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        .animate-pulse-scale {
          animation: pulse-scale 2s ease-in-out infinite;
        }

        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
