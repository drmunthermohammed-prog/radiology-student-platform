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
    <div className="space-y-4 pb-28 pt-2 px-4 max-w-lg mx-auto animate-classic" dir="rtl">
      
      {/* 1. Classic Academic Welcome Card: اسم المستخدم واليوم */}
      <div className="rounded-[28px] p-6 bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 text-white shadow-xl border border-cyan-500/25 relative overflow-hidden transition-colors duration-300">
        {/* Subtle ambient highlights */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-600" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 inline-flex items-center gap-1.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{todayName} • {formattedDate}</span>
            </span>

            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-slate-200 border border-white/15 shadow-2xs">
              {todaySubjects.length} محاضرات اليوم
            </span>
          </div>

          {/* Student Greeting with Fast Edit Profile Modal */}
          <div className="flex items-center flex-wrap gap-2 pt-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              مرحباً، {state.userName || 'زميلنا التقني'} 🥼
            </h1>
            {state.userClass && (
              <button
                type="button"
                onClick={() => {
                  setEditProfileName(state.userName);
                  setEditProfileStage(state.userClass);
                  setIsProfileModalOpen(true);
                }}
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 transition active:scale-95 flex items-center gap-1 cursor-pointer"
                title="تغيير المرحلة الجامعية"
              >
                <span>{state.userClass}</span>
                <Edit2 className="w-3 h-3 opacity-70" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setEditProfileName(state.userName);
                setEditProfileStage(state.userClass);
                setIsProfileModalOpen(true);
              }}
              className="p-1.5 rounded-xl text-cyan-300 hover:text-white hover:bg-white/10 transition-all duration-200 active:scale-95 cursor-pointer"
              title="تعديل بيانات الطالب والمرحلة"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-cyan-200/80 font-semibold leading-relaxed">
            المنصة الأكاديمية لطلبة تقنيات الأشعة والتصوير الطبي • جدول محاضرات وتدريب ({todayName})
          </p>
        </div>
      </div>

      {/* 2. Fast Actions Row (تنبيه واجب جديد ⏰ + إضافة محاضرة لليوم ➕) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* زر التنبيه */}
        <button
          onClick={() => setIsAddReminderModalOpen(true)}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center justify-between transition-all duration-200 active:scale-95 border border-amber-400/30 group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0">
              <Bell className="w-4 h-4 animate-pulse" />
            </div>
            <div className="text-right">
              <span className="block leading-tight font-black">تنبيه مهمة / سريري</span>
              <span className="text-[10px] font-semibold text-amber-100">مع رنين تنبيه 🔔</span>
            </div>
          </div>
          {pendingReminders.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-amber-700 text-[10px] tabular-nums font-black flex items-center justify-center shadow-2xs shrink-0">
              {pendingReminders.length}
            </span>
          )}
        </button>

        {/* زر إضافة محاضرة اليوم */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 flex items-center justify-between transition-all duration-200 active:scale-95 border border-cyan-400/30 group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div className="text-right">
              <span className="block leading-tight font-black">إضافة محاضرة لليوم</span>
              <span className="text-[10px] font-semibold text-cyan-100">لجدول ({todayName})</span>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-cyan-100 opacity-80 shrink-0" />
        </button>
      </div>

      {/* 3. VOICE-TO-TEXT SMART NOTES SECTION (الملاحظات الصوتية: تحدث والمشروع يكتب) */}
      <div className="classic-card rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition ${
              isVoiceListening
                ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30'
                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
            }`}>
              {isVoiceListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                الملاحظات الصوتية الذكية 🎙️
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                اضغط الميكروفون وتحدث بالعربية وسيكتب المشروع كلامك فوراً
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleLiveVoiceNote}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 ${
              isVoiceListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/25 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
            }`}
          >
            {isVoiceListening ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>إيقاف التسجيل</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>تحدث الآن</span>
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
                  ? '🎙️ تكلم الآن... سيظل الميكروفون مفتوحاً حتى تضغط "إيقاف التسجيل"'
                  : 'اضغط "تحدث الآن" وتكلم ليتم تحويل صوتك إلى كتابة، أو اكتب ملاحظتك هنا...'
              }
              className={`w-full rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition resize-none leading-relaxed ${
                isVoiceListening
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-2 border-rose-500/60'
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
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
              >
                مسح النص
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition active:scale-95"
              >
                حفظ الملاحظة المكتوبة
              </button>
            </div>
          )}
        </form>

        {/* Saved Voice-Transcribed Notes List */}
        {(state.voiceNotes || []).length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {(state.voiceNotes || []).map((vn) => (
              <div
                key={vn.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                    {vn.text}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                    🎙️ كُتبت بالصوت · {vn.createdAt}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(vn.text);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                    title="نسخ النص"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {onDeleteVoiceNote && (
                    <button
                      type="button"
                      onClick={() => onDeleteVoiceNote(vn.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition"
                      title="حذف الملاحظة"
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

      {/* 4. HOMEWORK REMINDERS SECTION (قسم تنبيهات الواجبات والمذاكرة) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <span>تنبيهات الواجبات والمهام ⏰</span>
          </h2>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
            {pendingReminders.length} تنبيه قيد الانتظار
          </span>
        </div>

        {reminders.length === 0 ? (
          <div className="classic-card rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-2">
              <Bell className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
              لا توجد تنبيهات واجبات حالياً
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              اضغط على "تنبيه واجب جديد ⏰" أعلاه لتسجيل واجب، وسيصلك تنبيه مع صوت الرنين عند حلول الوقت المحدد.
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
      <div className="flex items-center justify-between pt-3 px-1">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>محاضرات وتدريب اليوم ({todayName})</span>
          </h2>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <span>المواد والمختبرات المقررة عليك اليوم</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-500/25">
              {state.userClass || 'المرحلة الأولى'}
            </span>
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-1.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة محاضرة</span>
        </button>
      </div>

      {/* 5. Today's Subjects List (محاضرات اليوم فقط) */}
      <div className="space-y-2.5">
        {todaySubjects.length === 0 ? (
          <div className="classic-card rounded-3xl p-7 text-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mx-auto flex items-center justify-center mb-3">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              لا توجد محاضرات مسجلة لهذا اليوم ({todayName})
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              يوم مخصص للاستذكار أو التدريب الحر. اضغط على "+ إضافة محاضرة" لإدراج أي درس أو معمل.
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

                {/* Explicit notification banner for stage selection */}
                <div className="mt-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-right flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-3.5 h-3.5 animate-bounce" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-black text-amber-300 block">
                      🔔 تنبيه تخصيص المرحلة:
                    </span>
                    <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed font-medium">
                      عند اختيارك للمرحلة، سوف تظهر لك محاضراتك ومناهجك والكتب والملازم الخاصة بهذه المرحلة فقط.
                    </p>
                  </div>
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
                  className="w-2/3 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-cyan-600/30 transition active:scale-95 cursor-pointer"
                >
                  حفظ البيانات الجامعية
                </button>
              </div>

              {onResetAllData && (
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('هل أنت متأكد من تفريغ كافة البيانات (المحاضرات، المجلدات، الدرجات، التنبيهات) والبدء بسجل فارغ تماماً؟')) {
                        onResetAllData();
                        setIsProfileModalOpen(false);
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold border border-rose-500/20 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>تفريغ ومسح السجل للبدء من جديد (سجل فارغ)</span>
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
