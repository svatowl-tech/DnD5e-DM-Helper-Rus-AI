
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContextType, ToastMessage, ToastType } from '../types';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`
                pointer-events-auto flex items-center gap-3 p-3 rounded-lg shadow-lg border animate-in slide-in-from-bottom-5 fade-in
                ${toast.type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' : 
                  toast.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' :
                  toast.type === 'warning' ? 'bg-yellow-900/90 border-yellow-500 text-yellow-100' :
                  'bg-gray-900/90 border-blue-500 text-blue-100'}
            `}
          >
            <div className="shrink-0">
                {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                {toast.type === 'info' && <Info className="w-5 h-5" />}
            </div>
            <div className="text-sm font-medium flex-1">{toast.message}</div>
            <button 
                onClick={() => removeToast(toast.id)}
                className="text-white/70 hover:text-white"
            >
                <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
