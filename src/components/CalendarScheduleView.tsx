import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AppState, ScheduleItem, DayOfWeek } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { VoiceInputButton } from './VoiceInputButton';
import { 
  Calendar as CalendarIcon, Clock, Plus, Trash2, 
  MapPin, ChevronRight, ChevronLeft, Edit3, FileText, Check, BookOpen, Star
} from 'lucide-react';

interface CalendarScheduleViewProps {
  state: AppState;
  onAddScheduleItem: (item: ScheduleItem) => void;
  onDeleteScheduleItem: (id: string) => void;
  onSaveCalendarNote: (date: string, text: string) => void;
  onDeleteCalendarNote: (date: string) => void;
}

const DAYS_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const TIME_PRESETS = [
  '08:30 ص', '10:00 ص', '11:30 ص', '01:00 م', '02:30 م'
];

export const CalendarScheduleView: React.FC<CalendarScheduleViewProps> = ({
  state,
  onAddScheduleItem,
  onDeleteScheduleItem,
  onSaveCalendarNote,
  onDeleteCalendarNote,
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'schedule'>('calendar');

  // ===================== CALENDAR STATE =====================
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [noteInput, setNoteInput] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Deletion confirm states
  const [confirmDeleteNote, setConfirmDeleteNote] = useState(false);
  const [scheduleItemToDelete, setScheduleItemToDelete] = useState<string | null>(null);

  // Month navigation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'كانون الثاني / يناير', 'شباط / فبراير', 'آذار / مارس', 'نيسان / أبريل',
    'أيار / مايو', 'حزيران / يونيو', 'تموز / يوليو', 'آب / أغسطس',
    'أيلول / سبتمبر', 'تشرين الأول / أكتوبر', 'تشرين الثاني / نوفمبر', 'كانون الأول / ديسمبر'
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedNote = state.calendarNotes.find((n) => n.date === selectedCalendarDate);

  const handleSelectDay = (dayNum: number) => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    setSelectedCalendarDate(formatted);
    const existing = state.calendarNotes.find((n) => n.date === formatted);
    setNoteInput(existing ? existing.text : '');
    setIsEditingNote(!existing);
  };

  const handleSaveNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) {
      setConfirmDeleteNote(true);
    } else {
      onSaveCalendarNote(selectedCalendarDate, noteInput.trim());
      setIsEditingNote(false);
    }
  };

  // ===================== SCHEDULE BY DAY STATE =====================
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<DayOfWeek>(
    new Date().getDay() as DayOfWeek
  );
  const [isAddScheduleModal, setIsAddScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    subjectName: '',
    time: '08:30 ص',
    room: '',
    instructor: '',
  });

  const handleAddScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.subjectName.trim()) return;

    onAddScheduleItem({
      id: 'sch_' + Date.now(),
      day: selectedScheduleDay,
      subjectName: scheduleForm.subjectName.trim(),
      time: scheduleForm.time.trim() || '08:30 ص',
      room: scheduleForm.room.trim() || undefined,
      instructor: scheduleForm.instructor.trim() || undefined,
    });

    setScheduleForm({
      subjectName: '',
      time: '08:30 ص',
      room: '',
      instructor: '',
    });
    setIsAddScheduleModal(false);
  };

  const currentDaySchedule = state.schedule.filter((s) => s.day === selectedScheduleDay);

  return (
    <div className="space-y-4 pb-28 pt-2 px-4 max-w-lg mx-auto animate-classic" dir="rtl">
      
      {/* 1. Classic Smooth Sub-Tabs Switcher */}
      <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-2xs">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'calendar'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>التقويم والملاحظات</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'schedule'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>الجدول الأسبوعي</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* OPTION 1: تقويم الشهر + الضغط على اليوم لكتابة الملاحظات */}
      {/* ========================================================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-4 animate-classic">
          
          {/* Classic Calendar Card */}
          <div className="classic-card rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                  {monthNames[month]} {year}
                </h3>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  اضغط على أي يوم لتدوين وتعديل ملاحظاتك
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95"
                  title="الشهر السابق"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95"
                  title="الشهر القادم"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays names header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 py-1 border-b border-slate-100 dark:border-slate-800/80">
              {['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {/* Empty leading days */}
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-10" />
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = selectedCalendarDate === dateKey;
                const hasNote = state.calendarNotes.some((n) => n.date === dateKey && n.text.trim());
                const isToday = new Date().toISOString().slice(0, 10) === dateKey;

                return (
                  <button
                    key={dayNum}
                    onClick={() => handleSelectDay(dayNum)}
                    className={`h-11 rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200 tabular-nums text-xs font-bold active:scale-95 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                        : isToday
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-400/80'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {hasNote && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-amber-300' : 'bg-amber-500 animate-pulse'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Classic Notebook / Journal Card (دفتر الملاحظات الكلاسيكي) */}
          <div className="classic-card rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  مفكرة يوم: <span className="tabular-nums text-indigo-600 dark:text-indigo-400 font-black">{selectedCalendarDate}</span>
                </h4>
              </div>

              {!isEditingNote && selectedNote && (
                <button
                  onClick={() => {
                    setNoteInput(selectedNote.text);
                    setIsEditingNote(true);
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل الملاحظة</span>
                </button>
              )}
            </div>

            {isEditingNote ? (
              <form onSubmit={handleSaveNoteSubmit} className="space-y-3 animate-classic">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    اكتب يدويّاً أو تحدث بالصوت وسيكتب التطبيق تلقائياً:
                  </span>
                  <VoiceInputButton
                    compact
                    label="تحدث ليكتب"
                    onTranscript={(txt) => setNoteInput((prev) => (prev ? `${prev} ${txt}` : txt))}
                  />
                </div>
                <textarea
                  rows={4}
                  placeholder="اكتب ملاحظاتك، واجباتك، أو اضغط على (تحدث ليكتب) وتكلم..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner leading-relaxed"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  {selectedNote && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteNote(true)}
                      className="px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                    >
                      حذف الملاحظة
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition active:scale-95"
                  >
                    حفظ ومزامنة الملاحظة
                  </button>
                </div>
              </form>
            ) : selectedNote ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                {selectedNote.text}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-600 dark:text-slate-400 text-xs space-y-2.5">
                <p>لا توجد ملاحظات مسجلة لهذا اليوم ({selectedCalendarDate}).</p>
                <button
                  onClick={() => {
                    setNoteInput('');
                    setIsEditingNote(true);
                  }}
                  className="px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition active:scale-95 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>كتابة ملاحظة لهذا اليوم</span>
                </button>
              </div>
            )}
          </div>

          {/* Confirm Delete Note Modal */}
          <ConfirmModal
            isOpen={confirmDeleteNote}
            title="تأكيد حذف الملاحظة"
            message={`هل أنت متأكد من رغبتك في حذف ملاحظة يوم (${selectedCalendarDate})؟`}
            onCancel={() => setConfirmDeleteNote(false)}
            onConfirm={() => {
              onDeleteCalendarNote(selectedCalendarDate);
              setNoteInput('');
              setIsEditingNote(false);
              setConfirmDeleteNote(false);
            }}
          />

        </div>
      )}

      {/* ========================================================= */}
      {/* OPTION 2: الجدول (كتابة وتعديل المواد حسب كل يوم)          */}
      {/* ========================================================= */}
      {activeTab === 'schedule' && (
        <div className="space-y-4 animate-classic">
          
          {/* Day selection tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar shadow-2xs">
            {DAYS_NAMES.map((name, idx) => {
              const isSelected = selectedScheduleDay === idx;
              const count = state.schedule.filter((s) => s.day === idx).length;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedScheduleDay(idx as DayOfWeek)}
                  className={`flex-1 min-w-[56px] py-2 px-1 rounded-xl text-center transition-all duration-200 flex flex-col items-center justify-center active:scale-95 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-bold'
                      : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
                  }`}
                >
                  <span className="text-xs">{name}</span>
                  <span className={`text-[10px] mt-0.5 tabular-nums ${isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-500'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action to add subject for this specific day */}
          <div className="flex items-center justify-between pt-1 px-1">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              محاضرات يوم {DAYS_NAMES[selectedScheduleDay]} ({currentDaySchedule.length})
            </h3>

            <button
              onClick={() => setIsAddScheduleModal(true)}
              className="px-3.5 py-1.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-cyan-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة محاضرة لليوم</span>
            </button>
          </div>

          {/* List of subjects for this day */}
          <div className="space-y-2.5">
            {currentDaySchedule.length === 0 ? (
              <div className="classic-card rounded-3xl p-8 text-center">
                <Clock className="w-12 h-12 mx-auto text-cyan-500/60 dark:text-cyan-400/50 mb-2" />
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                  لا توجد محاضرات مسجلة ليوم {DAYS_NAMES[selectedScheduleDay]}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  اضغط على زر "+ إضافة محاضرة لليوم" لإدراج الجدول النظري أو العملي أو التدريب السريري.
                </p>
              </div>
            ) : (
              currentDaySchedule.map((item, idx) => (
                <div
                  key={item.id}
                  className="classic-card rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-cyan-400/60 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/50 flex items-center justify-center font-black text-xs shrink-0 tabular-nums shadow-2xs">
                      {idx + 1}
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {item.subjectName}
                      </h4>
                      <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 mt-1">
                        <span className="tabular-nums text-cyan-700 dark:text-cyan-300 font-bold flex items-center gap-1 bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200/70 dark:border-cyan-800/40 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </span>
                        {item.room && (
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {item.room}
                          </span>
                        )}
                        {item.instructor && (
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            • {item.instructor}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setScheduleItemToDelete(item.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition active:scale-95"
                    title="حذف المحاضرة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Modal to add subject for this day */}
          {isAddScheduleModal && createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4" dir="rtl">
              <div className="w-full max-w-md max-h-[85dvh] rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-white animate-classic flex flex-col overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                  <h3 className="text-sm sm:text-base font-black flex items-center gap-2 text-slate-900 dark:text-white">
                    <Plus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    إضافة محاضرة ليوم ({DAYS_NAMES[selectedScheduleDay]})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddScheduleModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center transition hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddScheduleSubmit} className="flex flex-col flex-1 min-h-0 pt-4">
                  <div className="flex-1 overflow-y-auto space-y-4 px-0.5 pb-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">اسم المادة أو المحاضرة</label>
                      <input
                        type="text"
                        placeholder="مثال: التشريح الشعاعي، فيزياء الرنين، تقنيات المفراس CT"
                        value={scheduleForm.subjectName}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, subjectName: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner"
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">الوقت</label>
                      <input
                        type="text"
                        placeholder="مثال: 08:30 ص أو 11:00 ص"
                        value={scheduleForm.time}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs tabular-nums text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner"
                        required
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {TIME_PRESETS.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setScheduleForm({ ...scheduleForm, time: t })}
                            className={`text-[11px] px-2.5 py-1 rounded-xl tabular-nums transition ${
                              scheduleForm.time === t
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
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">القاعة / المختبر / المستشفى (اختياري)</label>
                        <input
                          type="text"
                          placeholder="مثال: مختبر الأشعة 2"
                          value={scheduleForm.room}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">الأستاذ / الطبيب المشرف (اختياري)</label>
                        <input
                          type="text"
                          placeholder="أ.د. / د."
                          value={scheduleForm.instructor}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, instructor: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-3 mt-1 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => setIsAddScheduleModal(false)}
                      className="w-1/3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 transition active:scale-95 cursor-pointer"
                    >
                      حفظ المحاضرة في الجدول
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}

          {/* Confirm Delete Schedule Item Modal */}
          <ConfirmModal
            isOpen={!!scheduleItemToDelete}
            title="تأكيد حذف المحاضرة"
            message="هل أنت متأكد من رغبتك في حذف هذه المحاضرة أو جلسة التدريب من الجدول الأسبوعي؟"
            onCancel={() => setScheduleItemToDelete(null)}
            onConfirm={() => {
              if (scheduleItemToDelete) {
                onDeleteScheduleItem(scheduleItemToDelete);
                setScheduleItemToDelete(null);
              }
            }}
          />

        </div>
      )}

    </div>
  );
};
