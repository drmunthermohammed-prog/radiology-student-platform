import React from 'react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';
import { Sun, Moon, Download, WifiOff, Activity, Zap } from 'lucide-react';

interface HeaderProps {
  theme: 'dark' | 'light';
  userName: string;
  userClass?: string;
  onToggleTheme: () => void;
  onOpenPWAInstall: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  userName,
  userClass,
  onToggleTheme,
  onOpenPWAInstall,
}) => {
  const isOnline = useOnlineStatus();
  const { isInstalled } = usePWAInstall();

  const getTodayArabicDate = () => {
    try {
      return new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date());
    } catch {
      return 'اليوم الجامعي';
    }
  };

  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-40 w-full pt-safe border-b backdrop-blur-2xl transition-colors duration-300 px-4 pb-3 border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-slate-900/95 shadow-xs">
      {/* Offline Alert Bar */}
      {!isOnline && (
        <div className="mb-2 py-1 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between animate-classic">
          <div className="flex items-center gap-1.5 font-bold">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span>يعمل بدون إنترنت (محفوظ محلياً)</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between max-w-lg mx-auto">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-xs shrink-0">
            <Activity className="w-4 h-4 drop-shadow" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                تقنيات الأشعة
              </h1>
              {userClass && (
                <span className="text-[10px] text-cyan-700 dark:text-cyan-300 font-semibold">
                  · {userClass}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {getTodayArabicDate()}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Theme switcher with clear label & high contrast */}
          <button
            onClick={onToggleTheme}
            className="h-9 px-3 rounded-2xl flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300/80 dark:border-slate-700 transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer"
            title={isDark ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}
            aria-label="تبديل المظهر"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span>نهاري</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>ليلي</span>
              </>
            )}
          </button>

          {/* PWA Install Button */}
          {!isInstalled && (
            <button
              onClick={onOpenPWAInstall}
              className="h-9 px-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all duration-200 active:scale-95 cursor-pointer"
              title="تثبيت التطبيق على جهازك"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تثبيت</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
