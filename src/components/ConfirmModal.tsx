import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'تأكيد الحذف',
  message = 'هل أنت متأكد من رغبتك في الحذف؟ لا يمكن التراجع عن هذه الخطوة بعد التأكيد.',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-classic">
      <div 
        className="w-full max-w-sm rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-white text-center"
        dir="rtl"
      >
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200/50 dark:border-rose-900/40 mx-auto flex items-center justify-center mb-3.5 shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
          {title}
        </h3>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-2.5 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition active:scale-95"
          >
            تراجع وإلغاء
          </button>
          
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>نعم، احذف</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
