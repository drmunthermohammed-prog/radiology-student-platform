import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { SubjectWithGrades, GradeItem } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { 
  Award, Plus, ChevronLeft, ArrowRight, 
  Trash2, BookOpen, Sparkles, TrendingUp, CheckCircle2
} from 'lucide-react';

interface GradesViewProps {
  subjects: SubjectWithGrades[];
  onAddSubject: (name: string) => void;
  onDeleteSubject: (subjectId: string) => void;
  onAddGradeToSubject: (subjectId: string, grade: Omit<GradeItem, 'id'>) => void;
  onDeleteGradeFromSubject: (subjectId: string, gradeId: string) => void;
}

const GRADE_TITLE_PRESETS = [
  'امتحان شهري أول', 'امتحان شهري ثانٍ', 'الامتحان العملي (أفلام)', 'السعي السنوي', 'الامتحان التقويمي الوزاري', 'الامتحان النهائي'
];

const SUGGESTED_RADIOLOGY_SUBJECTS = [
  'التشريح الشعاعي (Radiological Anatomy)',
  'فيزياء التصوير الطبي (Radiation Physics)',
  'تقنيات الأشعة السينية (X-Ray Tech)',
  'المفراس الحلزوني المقطعي (CT Scan)',
  'الرنين المغناطيسي (MRI Technology)',
  'الوقاية والسلامة الإشعاعية',
  'الموجات فوق الصوتية والسونار',
  'علم الأمراض الشعاعي (Pathology)',
  'الطب النووي والتصوير الجزيئي',
];

export const GradesView: React.FC<GradesViewProps> = ({
  subjects,
  onAddSubject,
  onDeleteSubject,
  onAddGradeToSubject,
  onDeleteGradeFromSubject,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  
  // Modal for new subject
  const [isAddSubjectModal, setIsAddSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  // Modal for new grade in active subject
  const [isAddGradeModal, setIsAddGradeModal] = useState(false);
  const [gradeTitle, setGradeTitle] = useState('شهر أول');
  const [gradeScore, setGradeScore] = useState<number>(50);
  const [gradeMaxScore, setGradeMaxScore] = useState<number>(50);

  // Deletion confirm states
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [gradeToDelete, setGradeToDelete] = useState<string | null>(null);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Add subject submit
  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    onAddSubject(newSubjectName.trim());
    setNewSubjectName('');
    setIsAddSubjectModal(false);
  };

  // Add grade to active subject submit
  const handleCreateGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !gradeTitle.trim()) return;

    onAddGradeToSubject(selectedSubjectId, {
      title: gradeTitle.trim(),
      score: Number(gradeScore) || 0,
      maxScore: Number(gradeMaxScore) || 100,
    });

    setGradeTitle('شهر أول');
    setGradeScore(50);
    setGradeMaxScore(50);
    setIsAddGradeModal(false);
  };

  // ========================================================
  // VIEW: SUBJECT GRADES DETAIL (عند الضغط على المادة)
  // ========================================================
  if (activeSubject) {
    const totalScore = activeSubject.grades.reduce((acc, g) => acc + g.score, 0);
    const totalMax = activeSubject.grades.reduce((acc, g) => acc + g.maxScore, 0);
    const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    const getGradeRating = (pct: number) => {
      if (pct >= 90) return { label: 'امتياز 🌟', color: 'text-emerald-600 dark:text-emerald-400' };
      if (pct >= 80) return { label: 'جيد جداً 🎖️', color: 'text-sky-600 dark:text-sky-400' };
      if (pct >= 70) return { label: 'جيد 👍', color: 'text-indigo-600 dark:text-indigo-400' };
      if (pct >= 50) return { label: 'مقبول ⚠️', color: 'text-amber-600 dark:text-amber-400' };
      return { label: 'بحاجة لتحسين 📚', color: 'text-rose-600 dark:text-rose-400' };
    };

    const rating = getGradeRating(percentage);

    return (
      <div className="space-y-4 pb-28 pt-2 px-4 max-w-lg mx-auto animate-classic" dir="rtl">
        {/* Back navigation & header card */}
        <div className="classic-card rounded-[28px] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSubjectId(null)}
                className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95"
                title="الرجوع لقائمة المواد"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  سجل درجات: {activeSubject.name}
                </h2>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  إجمالي التقييمات: {activeSubject.grades.length} اختبارات
                </span>
              </div>
            </div>

            <button
              onClick={() => setSubjectToDelete(activeSubject.id)}
              className="p-2.5 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition active:scale-95"
              title="حذف المادة بالكامل"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Classic Total Score & Performance Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold block">المجموع المحصل:</span>
              <div className="text-2xl font-black tabular-nums text-indigo-600 dark:text-indigo-400">
                {totalScore} <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">من {totalMax}</span>
              </div>
            </div>

            <div className="text-left">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold block">النسبة المئوية:</span>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-2xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                  {percentage}%
                </span>
              </div>
              <span className={`text-[11px] font-bold ${rating.color}`}>
                {rating.label}
              </span>
            </div>
          </div>

          {/* Smooth Progress Bar */}
          {totalMax > 0 && (
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Action: Add Grade button */}
        <div className="flex items-center justify-between pt-1 px-1">
          <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
            تفاصيل الدرجات (شهر أول، ثانٍ، نهائي...)
          </h3>

          <button
            onClick={() => setIsAddGradeModal(true)}
            className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة درجة</span>
          </button>
        </div>

        {/* Grades list */}
        <div className="space-y-3">
          {activeSubject.grades.length === 0 ? (
            <div className="classic-card rounded-3xl p-8 text-center text-xs">
              <Award className="w-12 h-12 mx-auto text-indigo-500/60 dark:text-indigo-400/50 mb-2" />
              <p className="font-black text-sm text-slate-900 dark:text-slate-100">لا توجد درجات مسجلة لهذه المادة بعد.</p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">اضغط على زر "+ إضافة درجة" لإدخال درجات الشهر الأول والثاني والأنشطة.</p>
            </div>
          ) : (
            activeSubject.grades.map((item) => {
              const itemPct = item.maxScore > 0 ? Math.round((item.score / item.maxScore) * 100) : 0;

              return (
                <div
                  key={item.id}
                  className="classic-card rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-indigo-400/60 transition"
                >
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium tabular-nums">
                      النسبة: {itemPct}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-left tabular-nums">
                      <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                        {item.score}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold"> / {item.maxScore}</span>
                    </div>

                    <button
                      onClick={() => setGradeToDelete(item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition active:scale-95"
                      title="حذف هذه الدرجة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal: Add Grade to Subject */}
        {isAddGradeModal && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4" dir="rtl">
            <div className="w-full max-w-md max-h-[85dvh] rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-white animate-classic flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <h3 className="text-base font-black flex items-center gap-2 text-slate-900 dark:text-white">
                  <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  إضافة درجة لمادة ({activeSubject.name})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddGradeModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center transition hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateGrade} className="flex flex-col flex-1 min-h-0 pt-4">
                <div className="flex-1 overflow-y-auto space-y-4 px-0.5 pb-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      اسم الاختبار أو التقييم
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: شهر أول، شهر ثانٍ، نشاط، نهائي"
                      value={gradeTitle}
                      onChange={(e) => setGradeTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                      required
                      autoFocus
                    />
                    {/* Preset Buttons for Quick Title Selection */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {GRADE_TITLE_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setGradeTitle(preset)}
                          className={`text-[11px] px-2.5 py-1 rounded-xl transition ${
                            gradeTitle === preset
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        الدرجة المحصلة
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="50"
                        value={gradeScore}
                        onChange={(e) => setGradeScore(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        الدرجة العظمى (من كم؟)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="50 أو 100"
                        value={gradeMaxScore}
                        onChange={(e) => setGradeMaxScore(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3 mt-1 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setIsAddGradeModal(false)}
                    className="w-1/3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition active:scale-95"
                  >
                    حفظ الدرجة
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* Confirmation Modal for deleting individual Grade */}
        <ConfirmModal
          isOpen={!!gradeToDelete}
          title="تأكيد حذف الدرجة"
          message="هل أنت متأكد من رغبتك في حذف هذه الدرجة من سجل المادة؟"
          onCancel={() => setGradeToDelete(null)}
          onConfirm={() => {
            if (gradeToDelete && activeSubject) {
              onDeleteGradeFromSubject(activeSubject.id, gradeToDelete);
              setGradeToDelete(null);
            }
          }}
        />

        {/* Confirmation Modal for deleting entire Subject */}
        <ConfirmModal
          isOpen={!!subjectToDelete}
          title="تأكيد حذف المادة"
          message={`هل أنت متأكد من حذف مادة (${activeSubject.name}) وكافة درجاتها؟`}
          onCancel={() => setSubjectToDelete(null)}
          onConfirm={() => {
            if (subjectToDelete) {
              onDeleteSubject(subjectToDelete);
              setSelectedSubjectId(null);
              setSubjectToDelete(null);
            }
          }}
        />
      </div>
    );
  }

  // ========================================================
  // VIEW: ALL SUBJECTS LIST (شاشة المواد للدرجات)
  // ========================================================
  return (
    <div className="space-y-4 pb-28 pt-2 px-4 max-w-lg mx-auto animate-classic" dir="rtl">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>سجل درجات المواد</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            اضغط على المادة لإضافة درجات الشهر الأول والثاني والنهائي
          </p>
        </div>

        <button
          onClick={() => setIsAddSubjectModal(true)}
          className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مادة</span>
        </button>
      </div>

      {/* Subjects Cards */}
      <div className="space-y-3">
        {subjects.length === 0 ? (
          <div className="classic-card rounded-3xl p-8 text-center">
            <Award className="w-14 h-14 mx-auto text-indigo-500/60 dark:text-indigo-400/50 mb-2" />
            <p className="text-sm font-black text-slate-900 dark:text-slate-100">لا توجد مواد مسجلة للدرجات بعد</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              اضغط على زر "+ إضافة مادة" لإدراج مادتك الأولى والبدء بتسجيل درجات امتحاناتك ونسب النجاح.
            </p>
          </div>
        ) : (
          subjects.map((sub) => {
            const totalScore = sub.grades.reduce((acc, g) => acc + g.score, 0);
            const totalMax = sub.grades.reduce((acc, g) => acc + g.maxScore, 0);
            const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

            return (
              <div
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className="classic-card rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500/50 transition group relative"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs group-hover:scale-105 transition">
                    <BookOpen className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {sub.name}
                    </h3>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {sub.grades.length} درجات مسجلة
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {sub.grades.length > 0 && (
                    <div className="text-left tabular-nums">
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {totalScore}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold"> / {totalMax}</span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-bold">
                        ({percentage}%)
                      </span>
                    </div>
                  )}

                  <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:-translate-x-1 transition" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add New Subject for Grades */}
      {isAddSubjectModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4" dir="rtl">
          <div className="w-full max-w-md max-h-[85dvh] rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-white animate-classic flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-black flex items-center gap-2 text-slate-900 dark:text-white">
                <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                إضافة مادة جديدة لسجل الدرجات
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSubjectModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center transition hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="flex flex-col flex-1 min-h-0 pt-4">
              <div className="flex-1 overflow-y-auto space-y-4 px-0.5 pb-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    اسم المادة الدراسية
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: التشريح الشعاعي، فيزياء الإشعاع، تقنيات المفراس CT، الرنين MRI"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner font-medium"
                    required
                    autoFocus
                  />
                  <div className="mt-3">
                    <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                      مقترحات سريعة لمواد تقنيات الأشعة:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {SUGGESTED_RADIOLOGY_SUBJECTS.map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setNewSubjectName(sub)}
                          className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-700 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700/60 transition active:scale-95 text-right font-medium"
                        >
                          + {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 mt-1 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectModal(false)}
                  className="w-1/3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-cyan-600/30 transition active:scale-95 cursor-pointer"
                >
                  إضافة المادة لسجل الدرجات
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
