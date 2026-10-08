import React from 'react';
import { createPortal } from 'react-dom';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Share, PlusSquare, Smartphone, CheckCircle2, X, DownloadCloud, Sparkles, WifiOff } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isIOS, isInstalled, install } = usePWAInstall();

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 transition-opacity animate-classic">
      <div 
        className="w-full max-w-md rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[85dvh] overflow-y-auto"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-600/25 text-white">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                تثبيت حقيبة الطالب الذكية
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">تطبيق ويب تقدمي فائق السرعة (PWA)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Benefits */}
        <div className="my-5 grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 flex items-center gap-2.5">
            <WifiOff className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">يعمل بدون إنترنت</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">أيقونة شاشة أصلية</span>
          </div>
        </div>

        {isInstalled ? (
          <div className="py-4 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-500 mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">التطبيق مثبت بالفعل على جهازك!</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">يمكنك فتحه مباشرة من الشاشة الرئيسية في أي وقت حتى بدون شبكة.</p>
          </div>
        ) : isInstallable ? (
          /* Chromium / Android direct install button */
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              يمكنك تثبيت التطبيق بنقرة واحدة ليظهر مباشرة في شاشة هاتفك مع باقي التطبيقات.
            </p>
            <button
              onClick={async () => {
                const installed = await install();
                if (installed) onClose();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <DownloadCloud className="w-5 h-5" />
              تثبيت التطبيق الآن على الجهاز
            </button>
          </div>
        ) : (
          /* iOS Safari Step-by-Step Instructions */
          <div className="space-y-4">
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl p-3.5 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
              {isIOS ? '📱 خطوات إضافة التطبيق لشاشة الآيفون عبر Safari:' : '💡 لتثبيت التطبيق على شاشتك الرئيسية:'}
            </div>

            <ol className="space-y-2.5">
              <li className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  اضغط على زر <strong className="text-sky-600 dark:text-sky-400 inline-flex items-center gap-1 mx-1"><Share className="w-3.5 h-3.5 inline" /> المشاركة (Share)</strong> في شريط متصفح سفاري بالأسفل.
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  اسحب الخيارات للأسفل واختر <strong className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 mx-1"><PlusSquare className="w-3.5 h-3.5 inline" /> إضافة إلى الشاشة الرئيسية</strong>.
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  اضغط على <strong className="text-indigo-600 dark:text-white mx-1">"إضافة" (Add)</strong> في أعلى الزاوية. سيظهر التطبيق كأيقونة مستقلة فوراً!
                </div>
              </li>
            </ol>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
        >
          حسناً، إغلاق
        </button>
      </div>
    </div>,
    document.body
  );
};
