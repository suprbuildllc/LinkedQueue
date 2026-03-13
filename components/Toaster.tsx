import React from 'react';
import { AppNotification } from '../types';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToasterProps {
  notifications: AppNotification[];
  onRemove: (id: string) => void;
}

const Toaster: React.FC<ToasterProps> = ({ notifications, onRemove }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {notifications.map((n) => (
        <div 
          key={n.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-in slide-in-from-right-full duration-300 bg-white
            ${n.type === 'success' ? 'border-green-100' : 
              n.type === 'error' ? 'border-red-100' : 
              n.type === 'warning' ? 'border-amber-100' : 'border-blue-100'}`}
        >
          <div className={`mt-0.5
            ${n.type === 'success' ? 'text-green-500' : 
              n.type === 'error' ? 'text-red-500' : 
              n.type === 'warning' ? 'text-amber-500' : 'text-blue-500'}`}
          >
            {n.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {n.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {n.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
            {n.type === 'info' && <Info className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 leading-tight">{n.message}</p>
          </div>
          <button 
            onClick={() => onRemove(n.id)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toaster;