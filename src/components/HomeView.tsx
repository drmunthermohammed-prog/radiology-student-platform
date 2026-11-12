import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AppState, DayOfWeek, HomeworkReminder } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { AddReminderModal } from './AddReminderModal';
import { 
  Calendar, Clock, Plus, MapPin, 
  Trash2, User, Edit2, Check, BookOpen, Sparkles, Compass,
  Bell, Volume2, CheckCircle2, Circle, AlertCircle, ArrowUpRight,
  Mic, MicOff, Copy, Layers, X
} from 'lucide-react';

interface HomeViewProps {
  state: AppState;
  onUpdateUserName: (name: string) => void;
  onUpdateProfile?: (name: string, stage: string) => void;
  onResetAllData?: () => void;
  onAddTodaySubject: (subject: { name: string; time: string; room?: string; instructor?: string }) => void;
  onDeleteScheduleItem: (id: string) => void;
  onAddReminder: (reminder: Omit<HomeworkReminder, 'id' | 'createdAt' | 'isCompleted' | 'isDismissed'>) => void;
  onToggleCompleteReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onTriggerTestAlarm?: (reminder: HomeworkReminder) => void;
  onAddVoiceNote?: (text: string, subjectName?: string) => void;
  onDeleteVoiceNote?: (id: string) => void;
}

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const STAGE_PRESETS = [
  { id: 'المرحلة الأولى', label: 'المرحلة الأولى', subtitle: 'أساسيات الإشعاع والتشريح والفسلجة', tag: 'Stage 1' },
  { id: 'المرحلة الثانية', label: 'المرحلة الثانية', subtitle: 'تقنيات الأشعة السينية والوقاية الإشعاعية', tag: 'Stage 2' },
  { id: 'المرحلة الثالثة', label: 'المرحلة الثالثة', subtitle: 'المفراس CT والرنين MRI والسونار', tag: 'Stage 3' },
  { id: 'المرحلة الرابعة', label: 'المرحلة الرابعة', subtitle: 'التصوير المتقدم وبحوث التخرج والمستشفيات', tag: 'Stage 4' },
];

const TIME_PRESETS = [
  '08:30 ص', '10:00 ص', '11:30 ص', '01:00 م', '02:30 م'
];

const STAGE_SUBJECT_RECOMMENDATIONS: Record<string, string[]> = {
  'المرحلة الأولى': [
    'فيزياء الإشعاع',
    'التشريح البشري العام',
    'الفسلجة الطبية',
    'المصطلحات الطبية',
    'الكيمياء الحياتية الطبية',
    'الحاسوب الطبي',
  ],
  'المرحلة الثانية': [
    'تقنيات الأشعة السينية (X-Ray)',
    'التشريح الشعاعي',
    'أجهزة التصوير الطبي',
    'الفيزياء الإشعاعية والوقاية',
    'علم الأمراض الشعاعي',
    'تدريب سريري مستشفيات',
  ],
  'المرحلة الثالثة': [
    'المفراس الحلزوني (CT Scan)',
    'الرنين المغناطيسي (MRI)',
    'السونار والموجات فوق الصوتية',
    'المواد الملونة وصبغات التباين',
    'تدريب سريري بالمستشفى',
  ],
  'المرحلة الرابعة': [
    'الطب النووي (PET/SPECT)',
    'العلاج الإشعاعي',
    'ضبط وتوكيد الجودة (QA/QC)',
    'أنظمة PACS وDICOM',
    'بحوث التخرج والتدريب الإكلينيكي',
  ],
};

export const HomeView: React.FC<HomeViewProps> = ({
  state,
  onUpdateUserName,
  onUpdateProfile,
  onResetAllData,
  onAddTodaySubject,
  onDeleteScheduleItem,
  onAddReminder,
  onToggleCompleteReminder,
  onDeleteReminder,
  onTriggerTestAlarm,
  onAddVoiceNote,
  onDeleteVoiceNote,
}) => {
  const todayIndex = new Date().getDay() as DayOfWeek;
  const todayName = DAY_NAMES[todayIndex];

  // Editing profile (Name & Stage) modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editProfileName, setEditProfileName] = useState(state.userName);
  const [editProfileStage, setEditProfileStage] = useState(state.userClass || 'المرحلة الثانية');

  // Voice-to-Text Live Dictation state
  const [voiceDraft, setVoiceDraft] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const speechRecRef = useRef<any>(null);
  const voiceTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const baseTextRef = useRef('');
  const sessionTextRef = useRef('');
  const voiceDraftRef = useRef('');

  useEffect(() => {
    voiceDraftRef.current = voiceDraft;
  }, [voiceDraft]);

  useEffect(() => {
    return () => {
      shouldKeepListeningRef.current = false;
      if (speechRecRef.current) {
        try {
          speechRecRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const stopVoiceListening = () => {
    shouldKeepListeningRef.current = false;
    setIsVoiceListening(false);
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {
        // ignore
      }
    }
  };

  const startSingleRecognitionPass = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      shouldKeepListeningRef.current = false;
      setIsVoiceListening(false);
      voiceTextareaRef.current?.focus();
      setVoiceError('تم فتح لوحة المفاتيح: اضغط على زر الميكروفون 🎙️ الموجود في كيبورد هاتفك للكتابة بالصوت مباشرة.');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'ar-SA';
      // Using continuous=false per pass avoids the Android Chrome bug that duplicates words 5x,
      // while auto-restarting in onend keeps the mic open continuously until the user stops it.
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      baseTextRef.current = voiceDraftRef.current.trim();
      sessionTextRef.current = '';

      rec.onstart = () => {
        setIsVoiceListening(true);
      };

      rec.onresult = (event: any) => {
        if (!event.results || event.results.length === 0) return;
        // Take only the latest result slot to prevent cumulative duplication on Android
        const latestResult = event.results[event.results.length - 1];
        const transcript = (latestResult[0]?.transcript || '').trim();

        sessionTextRef.current = transcript;
        const combined = [baseTextRef.current, transcript].filter(Boolean).join(' ');
        setVoiceDraft(combined);
        voiceDraftRef.current = combined;
      };

      rec.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // User paused speaking; onend will seamlessly restart if still active
          return;
        }
        shouldKeepListeningRef.current = false;
        setIsVoiceListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          voiceTextareaRef.current?.focus();
          setVoiceError(
            'بسبب فقاعات المحادثة العائمة (مثل ماسنجر) أو صلاحيات الهاتف: يمكنك إغلاق الفقاعة العائمة للموافقة لمرة واحدة، أو الضغط على أيقونة الميكروفون 🎙️ في كيبورد هاتفك.'
          );
        } else if (event.error === 'network') {
          setVoiceError(
            'الإنترنت ضعيف حالياً: اضغط على أيقونة الميكروفون 🎙️ في كيبورد هاتفك للكتابة الصوتية بدون تقطيع.'
          );
        }
      };

      rec.onend = () => {
        // Commit the finished phrase into baseTextRef
        baseTextRef.current = voiceDraftRef.current.trim();
        sessionTextRef.current = '';

        // If the user hasn't clicked "إيقاف التسجيل", automatically continue listening
        if (shouldKeepListeningRef.current) {
          setTimeout(() => {
            if (shouldKeepListeningRef.current) {
              startSingleRecognitionPass();
            }
          }, 120);
        } else {
          setIsVoiceListening(false);
        }
      };

      speechRecRef.current = rec;
      rec.start();
    } catch {
      shouldKeepListeningRef.current = false;
      setIsVoiceListening(false);
    }
  };

  const toggleLiveVoiceNote = () => {
    setVoiceError(null);

    if (isVoiceListening || shouldKeepListeningRef.current) {
      stopVoiceListening();
      return;
    }

    shouldKeepListeningRef.current = true;
    startSingleRecognitionPass();
  };

  const handleSaveVoiceDraft = (e: React.FormEvent) => {
    e.preventDefault();
    const combined = voiceDraft.trim();
    if (!combined || !onAddVoiceNote) return;

    stopVoiceListening();
    onAddVoiceNote(combined);
    setVoiceDraft('');
    voiceDraftRef.current = '';
    baseTextRef.current = '';
    sessionTextRef.current = '';
  };

  // Add subject modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [subName, setSubName] = useState('');
  const [subTime, setSubTime] = useState('08:30 ص');
  const [subRoom, setSubRoom] = useState('');
  const [subInstructor, setSubInstructor] = useState('');

  // Add Reminder modal state
  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false);

  // Delete confirmation states
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [reminderToDelete, setReminderToDelete] = useState<string | null>(null);

  // Filter ONLY today's subjects
  const todaySubjects = state.schedule.filter((s) => s.day === todayIndex);

  // Reminders list
  const reminders = state.reminders || [];
  const pendingReminders = reminders.filter((r) => !r.isCompleted);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProfileName.trim() || !editProfileStage.trim()) return;
    if (onUpdateProfile) {
      onUpdateProfile(editProfileName.trim(), editProfileStage.trim());
    } else {
      onUpdateUserName(editProfileName.trim());
    }
    setIsProfileModalOpen(false);
  };

  const handleAddSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;

    onAddTodaySubject({
      name: subName.trim(),
      time: subTime.trim() || '08:30 ص',
      room: subRoom.trim() || undefined,
      instructor: subInstructor.trim() || undefined,
    });

    setSubName('');
    setSubRoom('');
    setSubInstructor('');
    setIsAddModalOpen(false);
  };

  const formattedDate = new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const arabicNumbers = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '١٠', '١١', '١٢'];

  // Extract unique subjects for suggestion chips
  const subjectSuggestions = Array.from(
    new Set([
      ...state.schedule.map((s) => s.subjectName),
      ...state.subjectsGrades.map((s) => s.name),
    ])
  );

  return (
    <div className="space-y-3.5 pb-24 pt-1 px-4 max-w-lg mx-auto animate-classic" dir="rtl">
      
      {/* 1. Classic Academic Welcome Card */}
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 text-white border border-cyan-500/20 relative overflow-hidden transition-colors duration-300">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-cyan-300 inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{todayName} · {formattedDate}</span>
            </span>

            <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-slate-200">
              {todaySubjects.length} محاضرات
            </span>
          </div>

          {/* Student Greeting */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                مرحباً، {state.userName || 'طالب الأشعة'}
              </h1>
              {state.userClass && (
                <button
                  type="button"
                  onClick={() => {
                    setEditProfileName(state.userName);
                    setEditProfileStage(state.userClass);
                    setIsProfileModalOpen(true);
                  }}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 transition active:scale-95 flex items-center gap-1 cursor-pointer"
                  title="تغيير المرحلة"
                >
                  <span>{state.userClass}</span>
                  <Edit2 className="w-3 h-3 opacity-70" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setEditProfileName(state.userName);
                setEditProfileStage(state.userClass);
                setIsProfileModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-cyan-300 hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer"
              title="تعديل بيانات الطالب"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Fast Actions Row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setIsAddReminderModalOpen(true)}
          className="p-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-xs flex items-center justify-between transition active:scale-95 border border-amber-400/20 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 shrink-0" />
            <span className="font-bold">تنبيه مهمة</span>
          </div>
          {pendingReminders.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-white text-amber-700 text-[10px] font-bold flex items-center justify-center shrink-0">
              {pendingReminders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="p-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-xs flex items-center justify-between transition active:scale-95 border border-cyan-400/20 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 shrink-0" />
            <span className="font-bold">إضافة محاضرة</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-cyan-100 opacity-80 shrink-0" />
        </button>
      </div>

      {/* 3. Voice Notes Section */}
      <div className="classic-card rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
              isVoiceListening
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
            }`}>
              {isVoiceListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                ملاحظة صوتية
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleLiveVoiceNote}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 ${
              isVoiceListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isVoiceListening ? (
              <>
                <MicOff className="w-3 h-3" />
                <span>إيقاف</span>
              </>
            ) : (
              <>
                <Mic className="w-3 h-3" />
                <span>تسجيل</span>
              </>
            )}
          </button>
        </div>

        {voiceError && (
          <p className="text-[11px] font-bold text-rose-500 bg-rose-500/10 px-3 py-2 rounded-xl">
            {voiceError}
          </p>
        )}

        <form onSubmit={handleSaveVoiceDraft} className="space-y-2.5">
          <div className="relative">
            <textarea
              ref={voiceTextareaRef}
              rows={2}
              value={voiceDraft}
              onChange={(e) => {
                setVoiceDraft(e.target.value);
                voiceDraftRef.current = e.target.value;
                baseTextRef.current = e.target.value.trim();
              }}
              placeholder={
                isVoiceListening
                  ? 'جاري الاستماع... تحدث الآن'
                  : 'اكتب ملاحظتك هنا أو اضغط تسجيل...'
              }
              className={`w-full rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition resize-none leading-relaxed ${
                isVoiceListening
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border border-rose-500'
                  : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500'
              }`}
            />
          </div>

          {voiceDraft.trim() && (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setVoiceDraft('');
                  voiceDraftRef.current = '';
                  baseTextRef.current = '';
                  sessionTextRef.current = '';
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
              >
                مسح
              </button>
              <button
                type="submit"
                className="px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition active:scale-95"
              >
                حفظ
              </button>
            </div>
          )}
        </form>

        {/* Saved Voice-Transcribed Notes List */}
        {(state.voiceNotes || []).length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {(state.voiceNotes || []).map((vn) => (
              <div
                key={vn.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                    {vn.text}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {vn.createdAt}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(vn.text);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    title="نسخ"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {onDeleteVoiceNote && (
                    <button
                      type="button"
                      onClick={() => onDeleteVoiceNote(vn.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. HOMEWORK REMINDERS SECTION */}
      <div className="space-y-2 pt-0.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span>تنبيهات المهام</span>
          </h2>
          <span className="text-[11px] text-slate-500">
            {pendingReminders.length} معلّقة
          </span>
        </div>

        {reminders.length === 0 ? (
          <div className="classic-card rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              لا توجد تنبيهات مهام حالياً
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {reminders.map((reminder) => {
              const isToday = reminder.date === new Date().toISOString().slice(0, 10);
              return (
                <div
                  key={reminder.id}
                  className={`classic-card rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all duration-200 ${
                    reminder.isCompleted
                      ? 'opacity-65'
                      : 'hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox to toggle completion */}
                    <button
                      onClick={() => onToggleCompleteReminder(reminder.id)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition shrink-0 ${
                        reminder.isCompleted
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-600'
                      }`}
                      title={reminder.isCompleted ? 'إلغاء التحديد' : 'تحديد كمنجز'}
                    >
                      {reminder.isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Circle className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-xs sm:text-sm font-bold ${
                          reminder.isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          {reminder.title}
                        </h4>
                        {reminder.subjectName && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                            {reminder.subjectName}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
                        <span className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-[10px] ${
                          isToday
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>{isToday ? 'اليوم' : reminder.date} • {reminder.time}</span>
                        </span>

                        {reminder.soundEnabled && (
                          <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                            <Volume2 className="w-3 h-3" />
                            <span>رنين 🔔</span>
                          </span>
                        )}

                        {reminder.notes && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                            {reminder.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Test alert chime right away */}
                    {onTriggerTestAlarm && !reminder.isCompleted && (
                      <button
                        onClick={() => onTriggerTestAlarm(reminder)}
                        className="p-1.5 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition"
                        title="تجربة صوت التنبيه الآن"
                      >
                        <Bell className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete reminder */}
                    <button
                      onClick={() => setReminderToDelete(reminder.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition active:scale-95"
                      title="حذف التنبيه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Today's Classes Header with Add Action */}
      <div className="flex items-center justify-between pt-2 px-1">
        <div>
          <h2 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>محاضرات اليوم ({todayName})</span>
          </h2>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة</span>
        </button>
      </div>

      {/* 5. Today's Subjects List */}
      <div className="space-y-2">
        {todaySubjects.length === 0 ? (
          <div className="classic-card rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              لا توجد محاضرات مسجلة اليوم ({todayName})
            </p>
          </div>
        ) : (
          todaySubjects.map((item, idx) => (
            <div
              key={item.id}
              className="classic-card rounded-2xl p-4 flex items-center justify-between gap-3 group hover:border-cyan-400/70 dark:hover:border-cyan-500/50"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 flex items-center justify-center font-black text-sm shrink-0 tabular-nums shadow-2xs">
                  {arabicNumbers[idx] || idx + 1}
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {item.subjectName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1 tabular-nums text-cyan-700 dark:text-cyan-300 font-bold bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-0.5 rounded-lg border border-cyan-200/80 dark:border-cyan-800/50 text-[11px]">
                      <Clock className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                      {item.time}
                    </span>
                    {item.room && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        {item.room}
                      </span>
                    )}
                    {item.instructor && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        <User className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        {item.instructor}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setItemToDelete(item.id)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200 active:scale-95"
                title="حذف من جدول اليوم"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add Subject For Today */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4" dir="rtl">
          <div className="w-full max-w-md max-h-[85dvh] rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-white animate-classic flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-black flex items-center gap-2 text-slate-900 dark:text-white">
                <Plus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                إضافة محاضرة ليوم ({todayName})
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center transition hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubjectSubmit} className="flex flex-col flex-1 min-h-0 pt-4">
              <div className="flex-1 overflow-y-auto space-y-4 px-0.5 pb-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    اسم المادة أو المحاضرة
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: التشريح الشعاعي، فيزياء الرنين، تقنيات المفراس CT"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner"
                    required
                    autoFocus
                  />
                  {/* Stage-Tailored Course Chips */}
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                      مقترحات لمرحلتك ({state.userClass || 'المرحلة الأولى'}):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {(STAGE_SUBJECT_RECOMMENDATIONS[state.userClass || 'المرحلة الأولى'] || STAGE_SUBJECT_RECOMMENDATIONS['المرحلة الأولى']).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSubName(s)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg transition font-medium cursor-pointer ${
                            subName === s
                              ? 'bg-cyan-600 text-white font-bold'
                              : 'bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    وقت المحاضرة
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 08:30 ص أو 10:00 ص"
                    value={subTime}
                    onChange={(e) => setSubTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs tabular-nums text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner"
                    required
                  />
                  {/* Smooth Time Presets */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {TIME_PRESETS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSubTime(t)}
                        className={`text-[11px] px-2.5 py-1 rounded-xl tabular-nums transition-all duration-200 ${
                          subTime === t
                            ? 'bg-cyan-600 text-white font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      القاعة / المختبر / المستشفى (اختياري)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: مختبر الأشعة 2"
                      value={subRoom}
                      onChange={(e) => setSubRoom(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      اسم الأستاذ / الطبيب المشرف (اختياري)
                    </label>
                    <input
                      type="text"
                      placeholder="د. / أ.د."
                      value={subInstructor}
                      onChange={(e) => setSubInstructor(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 mt-1 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 transition active:scale-95 cursor-pointer"
                >
                  إضافة لجدول اليوم
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Edit Student Profile & Stage (المرحلة الجامعية فقط: الأولى إلى الرابعة) */}
      {isProfileModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-classic">
          <div className="w-full max-w-sm rounded-[28px] p-5 sm:p-6 bg-slate-900 border border-cyan-500/30 text-white shadow-2xl relative overflow-hidden" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">تعديل بيانات الطالب والمرحلة</h3>
                  <p className="text-[10px] text-cyan-300 font-semibold">قسم تقنيات الأشعة والتصوير الطبي</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم الطالب الثلاثي</label>
                <input
                  type="text"
                  value={editProfileName}
                  onChange={(e) => setEditProfileName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition font-medium"
                  placeholder="اسم الطالب..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>المرحلة الدراسية</span>
                  </span>
                  <span className="text-[10px] text-cyan-400/90 font-mono">4 مراحل فقط</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {STAGE_PRESETS.map((stage) => {
                    const isSelected = editProfileStage === stage.id;
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => setEditProfileStage(stage.id)}
                        className={`p-2.5 rounded-2xl text-right transition-all border flex flex-col justify-between ${
                          isSelected
                            ? 'bg-gradient-to-br from-cyan-950/90 to-indigo-950 border-cyan-400 text-white shadow-md ring-1 ring-cyan-400/50'
                            : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono text-cyan-400 font-bold">{stage.tag}</span>
                          {isSelected && (
                            <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-black">{stage.label}</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{stage.subtitle}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="w-1/3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  حفظ
                </button>
              </div>

              {onResetAllData && (
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('هل أنت متأكد من تفريغ كافة البيانات والبدء بسجل فارغ؟')) {
                        onResetAllData();
                        setIsProfileModalOpen(false);
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold border border-rose-500/20 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>إعادة ضبط السجل</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Add Homework Reminder */}
      <AddReminderModal
        isOpen={isAddReminderModalOpen}
        onClose={() => setIsAddReminderModalOpen(false)}
        onAddReminder={onAddReminder}
        availableSubjects={subjectSuggestions}
      />

      {/* Confirmation Modal for Delete Subject */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="تأكيد حذف المحاضرة"
        message="هل أنت متأكد من رغبتك في حذف هذه المحاضرة من جدول اليوم؟ لا يمكن الاستعادة بعد الحذف."
        onCancel={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) {
            onDeleteScheduleItem(itemToDelete);
            setItemToDelete(null);
          }
        }}
      />

      {/* Confirmation Modal for Delete Reminder */}
      <ConfirmModal
        isOpen={!!reminderToDelete}
        title="تأكيد حذف التنبيه"
        message="هل أنت متأكد من رغبتك في حذف هذا التنبيه؟ لن يتم إرسال إشعار أو صوت له ولا يمكن الاستعادة."
        onCancel={() => setReminderToDelete(null)}
        onConfirm={() => {
          if (reminderToDelete) {
            onDeleteReminder(reminderToDelete);
            setReminderToDelete(null);
          }
        }}
      />

    </div>
  );
};
