import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background-primary/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative bg-background-secondary border border-border rounded-card w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-accent-green">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-background-tertiary rounded-standard transition-colors"
          >
            <X size={20} className="text-text-muted hover:text-text-primary" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
