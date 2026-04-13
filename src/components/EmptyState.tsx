import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 border-2 border-dashed border-border rounded-card">
      <div className="w-16 h-16 rounded-full bg-background-tertiary flex items-center justify-center text-text-muted">
        <Icon size={32} />
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-text-muted max-w-sm">{description}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary mt-4"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
