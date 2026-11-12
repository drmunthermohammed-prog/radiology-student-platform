import React from 'react';

interface TelegramToastProps {
  show: boolean;
  message?: string;
}

export const TelegramToast: React.FC<TelegramToastProps> = ({
  show,
  message = 'تم بنجاح',
}) => {
  if (!show) return null;

  return (
    <div className="fixed top-14 inset-x-0 z-50 flex justify-center pointer-events-none px-4 animate-classic">
      <div
        className="pointer-events-auto py-2 px-5 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white border border-slate-700/60 shadow-lg text-xs font-bold transition-all duration-300 backdrop-blur-xl text-center"
        dir="rtl"
      >
        <span className="tracking-tight">{message}</span>
      </div>
    </div>
  );
};
