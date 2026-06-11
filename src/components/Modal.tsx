import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ModalAccent = 'copper' | 'jade' | 'violet' | 'none';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  accent?: ModalAccent;
}

const ACCENT_COLORS: Record<ModalAccent, string> = {
  copper: 'var(--copper-btn)',
  jade:   'var(--jade2)',
  violet: 'var(--accent-security)',
  none:   'var(--t1)',
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, accent = 'jade' }) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const titleColor = ACCENT_COLORS[accent];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm animate-in fade-in duration-150"
        style={{ background: 'rgba(12,11,9,0.75)' }}
        onClick={onClose}
      />
      
      {/* Content */}
      <div
        className="relative w-full max-w-md shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 @container"
        style={{
          background: 'var(--bg2)',
          border: '0.5px solid var(--b2)',
          borderRadius: 'var(--radius-card)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(180,150,100,0.06) inset',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '0.5px solid var(--b1)' }}
        >
          <h2
            className="text-xs font-black uppercase tracking-widest"
            style={{ color: titleColor }}
          >
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="flex items-center justify-center rounded transition-colors"
            style={{
              width: 24, height: 24,
              background: 'transparent',
              border: 'none',
              color: 'var(--t3)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--t1)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--t3)')}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
