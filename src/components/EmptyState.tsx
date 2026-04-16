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
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 border-2 border-dashed border-border rounded-card animate-in fade-in zoom-in-95 duration-500">
      <div className="w-16 h-16 rounded-full bg-background-tertiary flex items-center justify-center text-text-muted/30 animate-pulse">
        <Icon size={32} />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-black uppercase tracking-widest text-text-primary/60">{title}</h3>
        <p className="text-[10px] text-text-muted max-w-sm uppercase tracking-wider font-medium leading-relaxed">{description}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary mt-4 text-[10px] font-black uppercase tracking-widest"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
