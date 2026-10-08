import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { HomeworkReminder } from '../types';
import { SoundService } from '../services/soundService';
import { VoiceInputButton } from './VoiceInputButton';
import { Bell, Clock, Calendar, Volume2, X, Check, BookOpen } from 'lucide-react';

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReminder: (reminder: Omit<HomeworkReminder, 'id' | 'createdAt' | 'isCompleted' | 'isDismissed'>) => void;
  availableSubjects?: string[];
}

const QUICK_TITLES = [
  'مراجعة بروتوكولات المفراس CT',
  'حفظ أطلس التشريح الشعاعي',
  'مذاكرة فيزياء الرنين MRI',
  'تسليم تقرير التدريب السريري بالمستشفى',
  'مسائل الجرعات والوقاية الإشعاعية',
  'كويز وضعيات الأشعة السينية X-Ray',
];

const QUICK_TIMES = [
  { label: '04:00 م', value: '16:00' },
  { label: '05:30 م', value: '17:30' },
  { label: '07:00 م', value: '19:00' },
  { label: '08:30 م', value: '20:30' },
  { label: '09:30 م', value: '21:30' },
];

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  isOpen,
  onClose,
  onAddReminder,
  availableSubjects = [],
}) => {
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getDefaultTimeStr = () => {
    const d = new Date();
    // Default to next hour
    d.setHours(d.getHours() + 1);
    const h = String(d.getHours()).padStart(2, '0');
    return `${h}:00`;
  };

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getTodayStr());
  const [time, setTime] = useState(getDefaultTimeStr());
  const [subjectName, setSubjectName] = useState('');
  const [notes, setNotes] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;

    // Ask for system notification permission if supported
    SoundService.requestNotificationPermission();

    onAddReminder({
      title: title.trim(),
      date,
      time,
      subjectName: subjectName.trim() || undefined,
      notes: notes.trim() || undefined,
      soundEnabled,
    });

    onClose();
    // Reset form
    setTitle('');
    setNotes('');
  };

  const handleTestSound = () => {
    SoundService.playTestChime();
  };

  const isToday = date === getTodayStr();
  const isTomorrow = date === getTomorrowStr();

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4" dir="rtl">
      <div className="w-full max-w-md max-h-[85dvh] rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl text-slate-900 dark:text-white animate-classic flex flex-col overflow-hidden">
        
        {/* Modal Header (Fixed at Top) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                تنبيه واجب ومذاكرة جديد ⏰
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                حدد الوقت واليوم وسيصلك تنبيه مع صوت الرنين
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center transition hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 pt-3">
          {/* Scrollable Form Fields */}
          <div className="flex-1 overflow-y-auto space-y-3.5 px-0.5 pb-2">
            {/* 1. Title / Homework */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  عنوان الواجب أو التنبيه *
                </label>
                <VoiceInputButton
                  compact
                  label="إملاء صوتي"
                  onTranscript={(txt) => setTitle((prev) => (prev ? `${prev} ${txt}` : txt))}
                />
              </div>
              <input
                type="text"
                placeholder="مثال: مراجعة تشريح الصدر الشعاعي (أو اضغط إملاء صوتي)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner font-medium"
                required
                autoFocus
              />
              {/* Quick Title Chips */}
              <div className="flex flex-wrap gap-1 mt-2">
                {QUICK_TITLES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTitle(t)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-400 font-semibold transition"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Day & Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>اليوم المحدد *</span>
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setDate(getTodayStr())}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                    isToday
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>اليوم</span>
                  {isToday && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setDate(getTomorrowStr())}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                    isTomorrow
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>غداً</span>
                  {isTomorrow && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2 text-xs tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition"
                required
              />
            </div>

            {/* 3. Time */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>الساعة والتوقيت *</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2 text-sm tabular-nums font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition text-center"
                required
              />
              {/* Quick Times */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_TIMES.map((qt) => (
                  <button
                    key={qt.value}
                    type="button"
                    onClick={() => setTime(qt.value)}
                    className={`text-[11px] px-2.5 py-1 rounded-xl tabular-nums transition ${
                      time === qt.value
                        ? 'bg-amber-600 text-white font-bold shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {qt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Subject (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>المادة الدراسية (اختياري)</span>
              </label>
              <input
                type="text"
                placeholder="مثال: التشريح الشعاعي، المفراس CT، فيزياء الإشعاع"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
              {availableSubjects.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {availableSubjects.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSubjectName(sub)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Notes */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  ملاحظات أو تفاصيل الواجب (اختياري)
                </label>
                <VoiceInputButton
                  compact
                  label="تحدث ليكتب"
                  onTranscript={(txt) => setNotes((prev) => (prev ? `${prev} ${txt}` : txt))}
                />
              </div>
              <textarea
                rows={2}
                placeholder="مثال: مراجعة معايير فحص الصدر وبروتوكول التصوير الشعاعي"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition resize-none"
              />
            </div>

            {/* 6. Sound Toggle & Preview */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    صوت رنين التنبيه
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400">
                    تشغيل نغمة وجرس تنبيه عند حلول الوقت
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-[11px] font-bold text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-600/40 shadow-2xs active:scale-95 transition"
                  title="سماع تجربة الصوت"
                >
                  🔊 تجربة
                </button>

                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    soundEnabled ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      soundEnabled ? '-translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Sticky Footer Buttons - Always Visible & Clickable */}
          <div className="flex gap-2.5 pt-3 mt-1 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs shadow-lg shadow-amber-600/25 transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Bell className="w-4 h-4" />
              <span>ضبط التنبيه الآن</span>
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
};
