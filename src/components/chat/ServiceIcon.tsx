import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ServiceIconProps {
  icon: LucideIcon;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ServiceIcon: React.FC<ServiceIconProps> = ({
  icon: Icon,
  color,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center shadow-sm ${className}`}
      style={{ backgroundColor: color }}
    >
      <Icon size={iconSizes[size]} className="text-white" strokeWidth={2} />
    </div>
  );
};
