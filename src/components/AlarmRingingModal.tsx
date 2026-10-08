import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HomeworkReminder } from '../types';
import { SoundService } from '../services/soundService';
import { Bell, CheckCircle2, Clock, Volume2, X } from 'lucide-react';

interface AlarmRingingModalProps {
  reminder: HomeworkReminder | null;
  onDismiss: () => void;
  onComplete: () => void;
  onSnooze: (minutes: number) => void;
}

export const AlarmRingingModal: React.FC<AlarmRingingModalProps> = ({
  reminder,
  onDismiss,
  onComplete,
  onSnooze,
}) => {
  useEffect(() => {
    if (!reminder) return;

    // Trigger initial sound & vibration
    if (reminder.soundEnabled) {
      SoundService.playAlertSound(3);
    }
    SoundService.vibrate([400, 200, 400, 200, 500]);

    // Interval to repeat alert chime every 4 seconds while modal is ringing
    const soundInterval = setInterval(() => {
      if (reminder.soundEnabled) {
        SoundService.playAlertSound(2);
      }
      SoundService.vibrate([300, 150, 300]);
    }, 4500);

    return () => clearInterval(soundInterval);
  }, [reminder]);

  if (!reminder) return null;

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-classic" dir="rtl">
      <div className="w-full max-w-sm rounded-[32px] bg-gradient-to-b from-slate-900 to-indigo-950 border-2 border-amber-400/50 p-6 text-white text-center shadow-2xl relative overflow-hidden">
        {/* Pulsing ambient rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Close icon at top */}
        <button
          onClick={onDismiss}
          className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition"
          title="إغلاق التنبيه"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ringing Bell Icon with ripples */}
        <div className="relative mx-auto w-24 h-24 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-75" />
          <div className="absolute inset-2 rounded-full bg-amber-500/30 animate-pulse" />
          <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/40">
            <Bell className="w-8 h-8 animate-bounce text-slate-950" />
          </div>
        </div>

        {/* Badge & Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold mb-2">
          <Volume2 className="w-3.5 h-3.5" />
          <span>تنبيه موعد الواجب والمذاكرة 🔔</span>
        </div>

        <h2 className="text-xl font-black text-white mb-2 leading-snug drop-shadow-sm">
          {reminder.title}
        </h2>

        {reminder.subjectName && (
          <div className="inline-block px-3 py-0.5 rounded-xl bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-3">
            مادة: {reminder.subjectName}
          </div>
        )}

        {/* Time and Notes */}
        <div className="bg-white/10 rounded-2xl p-3 border border-white/10 mb-5 text-right space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              الموعد المحدد: {reminder.time}
            </span>
            <span className="text-[11px] text-slate-400">اليوم</span>
          </div>
          {reminder.notes && (
            <p className="text-xs text-amber-100/90 pt-1 border-t border-white/10 font-normal leading-relaxed">
              📝 {reminder.notes}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={onComplete}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>تم إنجاز الواجب وإيقاف التنبيه</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSnooze(5)}
              className="py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold border border-white/10 transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>تأجيل 5 دقائق</span>
            </button>

            <button
              onClick={onDismiss}
              className="py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-white/5 transition active:scale-95"
            >
              إيقاف التنبيه فقط
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
