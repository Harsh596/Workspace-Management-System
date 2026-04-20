import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function StatusNotice({ type = 'error', message, onClose }) {
  if (!message) return null;

  const config = {
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-500',
      icon: <AlertCircle size={16} />
    },
    success: {
      bg: 'bg-green/10',
      border: 'border-green/20',
      text: 'text-green',
      icon: <CheckCircle2 size={16} />
    }
  };

  const style = config[type] || config.error;

  return (
    <div className={`p-4 rounded border ${style.bg} ${style.border} ${style.text} flex justify-between items-start mb-4 animate-fade-in`}>
      <div className="flex gap-3">
        <div className="mt-0.5">{style.icon}</div>
        <div className="text-sm font-medium leading-relaxed">
          {message}
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="icon-btn border-none p-0 opacity-50 hover:opacity-100 transition-opacity">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
