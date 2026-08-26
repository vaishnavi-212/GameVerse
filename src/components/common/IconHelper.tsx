import React from 'react';
import * as Icons from 'lucide-react';

interface IconHelperProps {
  name: string;
  className?: string;
  size?: number;
}

export const IconHelper: React.FC<IconHelperProps> = ({ name, className = 'w-5 h-5', size }) => {
  // Map icon name to Lucide icon component
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; size?: number }>>)[name] || Icons.Gamepad2;
  return <IconComponent className={className} size={size} />;
};
