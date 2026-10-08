import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  FileText,
  Download,
  Search,
  ChevronDown,
  GraduationCap,
  Check,
  X,
  ExternalLink,
  FolderPlus,
  BookMarked,
  Clock,
  Bell,
  Layers,
  Sparkles,
  ArrowRight,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  LECTURES_DATA,
  CurriculumStage,
  CurriculumGrade,
  CurriculumSubject,
  CurriculumLecture,
} from '../data/curriculumBooks';

interface BooksViewProps {
  userClass?: string;
  onUpdateUserClass?: (newClass: string) => void;
  customUrls?: Record<string, string>;
  onSaveCustomUrl?: (key: string, url: string) => void;
  onSaveToLibrary?: (title: string, gradeName: string, dataUrl: string) => void;
}

// Stage resolver helper
function resolveStageId(className?: string): string {
  if (!className) return 'stage_1';
  const c = className.trim().toLowerCase();
  if (c.includes('رابع') || c.includes('4')) return 'stage_4';
  if (c.includes('ثالث') || c.includes('3')) return 'stage_3';
  if (c.includes('ثان') || c.includes('2')) return 'stage_2';
  if (c.includes('أول') || c.includes('اول') || c.includes('1')) return 'stage_1';
  return 'stage_1';
}

const STAGES_CONFIG = [
  { id: 'stage_1', label: 'المرحلة الأولى', subtitle: 'الأساسيات والتشريح والفيزياء الإشعاعية', tag: 'Stage 1' },
  { id: 'stage_2', label: 'المرحلة الثانية', subtitle: 'تقنيات الأشعة السينية والوقاية الإشعاعية', tag: 'Stage 2' },
  { id: 'stage_3', label: 'المرحلة الثالثة', subtitle: 'المفراس CT والرنين MRI والسونار', tag: 'Stage 3' },
  { id: 'stage_4', label: 'المرحلة الرابعة', subtitle: 'التصوير المتقدم والـ PET-CT والبحوث', tag: 'Stage 4' },
];

// Helper to convert Google Drive view links into embeddable preview links
function getEmbeddableUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }
  return trimmed;
}

// Helper to convert Google Drive view links into direct download links
function getDownloadUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }
  return trimmed;
}

// Subject visual styling helper
function getSubjectMeta(subjectId: string) {
  const s = subjectId.toLowerCase();
  if (s.includes('phys') || s.includes('phy')) {
    return { emoji: '⚡', badgeBg: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/25' };
  }
  if (s.includes('anat')) {
    return { emoji: '🩻', badgeBg: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/25' };
  }
  if (s.includes('xray')) {
    return { emoji: '🦴', badgeBg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/25' };
  }
  if (s.includes('ct')) {
    return { emoji: '🌀', badgeBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25' };
  }
  if (s.includes('mri')) {
    return { emoji: '🧲', badgeBg: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/25' };
  }
  if (s.includes('ultra') || s.includes('sound') || s.includes('us')) {
    return { emoji: '📡', badgeBg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/25' };
  }
  if (s.includes('protect') || s.includes('safe')) {
    return { emoji: '🛡️', badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25' };
  }
  if (s.includes('nuclear') || s.includes('pet') || s.includes('nuc')) {
    return { emoji: '☢️', badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/25' };
  }
  if (s.includes('patho')) {
    return { emoji: '🔬', badgeBg: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/25' };
  }
  if (s.includes('radio') || s.includes('therapy') || s.includes('rt')) {
    return { emoji: '🎯', badgeBg: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/25' };
  }
  if (s.includes('train') || s.includes('clinic')) {
    return { emoji: '🏥', badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25' };
  }
  if (s.includes('equip') || s.includes('qa') || s.includes('pacs') || s.includes('comp') || s.includes('info')) {
    return { emoji: '🖥️', badgeBg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/25' };
  }
  return { emoji: '📚', badgeBg: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/25' };
}

interface ActiveLectureModalItem {
  subjectName: string;
  lectureName: string;
  gradeName: string;
  url: string;
}

export const BooksView: React.FC<BooksViewProps> = ({
  userClass,
  onUpdateUserClass,
  onSaveToLibrary,
}) => {
  // Selected Grade ID (strictly defaults to student's registered stage, or stage_1)
  const [selectedGradeId, setSelectedGradeId] = useState<string>(() => resolveStageId(userClass));

  // Modal to switch stage if the student requests changing their level
  const [isChangeStageModalOpen, setIsChangeStageModalOpen] = useState(false);

  // Sync when userClass changes in profile
  useEffect(() => {
    if (userClass) {
      setSelectedGradeId(resolveStageId(userClass));
    }
  }, [userClass]);

  // Expanded Subject IDs (defaults to true for intuitive access to all lectures)
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Active Reader Modal state
  const [activeLectureModal, setActiveLectureModal] = useState<ActiveLectureModalItem | null>(null);
  const [savedNotice, setSavedNotice] = useState('');

  const currentData: CurriculumStage[] = LECTURES_DATA;

  // Flatten all grades for easy lookup
  const allGrades = useMemo(() => {
    const list: { stage: CurriculumStage; grade: CurriculumGrade }[] = [];
    for (const stage of currentData) {
      for (const grade of stage.grades) {
        list.push({ stage, grade });
      }
    }
    return list;
  }, [currentData]);

  const activeGradeObj = useMemo(() => {
    const targetId = selectedGradeId || resolveStageId(userClass);
    return allGrades.find((g) => g.grade.id === targetId) || allGrades[0] || null;
  }, [selectedGradeId, userClass, allGrades]);

  const toggleExpandSubject = (subjectId: string, defaultExpanded: boolean) => {
    setExpandedSubjects((prev) => {
      const current = prev[subjectId] !== undefined ? prev[subjectId] : defaultExpanded;
      return { ...prev, [subjectId]: !current };
    });
  };

  // Open Reader Modal
  const handleReadLecture = (
    subjectName: string,
    lectureName: string,
    gradeName: string,
    url?: string
  ) => {
    setSavedNotice('');
    setActiveLectureModal({
      subjectName,
      lectureName,
      gradeName,
      url: (url || '').trim(),
    });
  };

  // Trigger Direct Download
  const handleDownloadLecture = (
    subjectName: string,
    lectureName: string,
    gradeName: string,
    url?: string
  ) => {
    const trimmedUrl = (url || '').trim();
    if (trimmedUrl) {
      const dlUrl = getDownloadUrl(trimmedUrl);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `${subjectName} - ${lectureName} - ${gradeName}.pdf`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    setSavedNotice('');
    setActiveLectureModal({
      subjectName,
      lectureName,
      gradeName,
      url: '',
    });
  };

  // Safe lecture getter
  const getSubjectLectures = (subject: CurriculumSubject): CurriculumLecture[] => {
    if (Array.isArray(subject.lectures) && subject.lectures.length > 0) {
      return subject.lectures;
    }
    if (Array.isArray(subject.parts) && subject.parts.length > 0) {
      return subject.parts;
    }
    return [];
  };

  // Total lectures count in current active grade
  const totalGradeLecturesCount = useMemo(() => {
    if (!activeGradeObj) return 0;
    return activeGradeObj.grade.subjects.reduce((sum, sub) => sum + getSubjectLectures(sub).length, 0);
  }, [activeGradeObj]);

  // Search filtering strictly within the student's selected grade
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !activeGradeObj) return [];
    const results: {
      grade: CurriculumGrade;
      stageName: string;
      subject: CurriculumSubject;
      matchingLectures: CurriculumLecture[];
    }[] = [];

    const grade = activeGradeObj.grade;
    for (const subject of grade.subjects) {
      const lectures = getSubjectLectures(subject);
      const matchSubject = subject.name.toLowerCase().includes(q) || (subject.code && subject.code.toLowerCase().includes(q));
      const matchingLectures = lectures.filter((lec) => lec.name.toLowerCase().includes(q));

      if (matchSubject || matchingLectures.length > 0) {
        results.push({
          grade,
          stageName: activeGradeObj.stage.name,
          subject,
          matchingLectures: matchSubject ? lectures : matchingLectures,
        });
      }
    }
    return results;
  }, [searchQuery, activeGradeObj]);

  // Render a single lecture row
  const renderLectureRow = (
    grade: CurriculumGrade,
    subject: CurriculumSubject,
    lecture: CurriculumLecture,
    idx: number
  ) => {
    const lectureUrl = (lecture.url || '').trim();

    return (
      <div
        key={`${grade.id}_${subject.id}_lec_${idx}`}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-cyan-500/50 transition-all duration-200"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-700 dark:text-cyan-300 shrink-0 font-black text-xs tabular-nums">
            {idx + 1}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {lecture.name}
              </h5>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                <Check className="w-2.5 h-2.5" /> جاهزة للدراسة
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {subject.name} • {grade.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleReadLecture(subject.name, lecture.name, grade.name, lectureUrl)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>قراءة</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadLecture(subject.name, lecture.name, grade.name, lectureUrl)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تحميل</span>
          </button>
        </div>
      </div>
    );
  };

  // Render a single subject card with its lectures
  const renderSubjectCard = (
    grade: CurriculumGrade,
    subject: CurriculumSubject,
    customLectures?: CurriculumLecture[]
  ) => {
    const meta = getSubjectMeta(subject.id);
    const lectures = customLectures || getSubjectLectures(subject);
    const hasLectures = lectures.length > 0;
    const expandKey = `${grade.id}_${subject.id}`;

    // Auto-expanded by default for fast direct browsing
    const defaultExpanded = true;
    const isExpanded =
      expandedSubjects[expandKey] !== undefined ? expandedSubjects[expandKey] : defaultExpanded;

    return (
      <div
        key={`${grade.id}_${subject.id}`}
        className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/95 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
      >
        {/* Subject Header Row */}
        <div
          onClick={() => toggleExpandSubject(expandKey, defaultExpanded)}
          className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl shrink-0 shadow-xs ${meta.badgeBg}`}
            >
              {meta.emoji}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                  {subject.name}
                </h4>
                {subject.code && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {subject.code}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                <span>{grade.name}</span>
                <span>•</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/70 dark:border-cyan-800/50 px-2 py-0.5 rounded-md">
                  {lectures.length} محاضرات أكاديمية
                </span>
              </div>
            </div>
          </div>

          {/* Right Action: Expand/Collapse */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpandSubject(expandKey, defaultExpanded);
              }}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isExpanded
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-600'
              }`}
            >
              <span>{isExpanded ? 'إغلاق المحاضرات' : `عرض المحاضرات (${lectures.length})`}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Expanded Lectures List */}
        {hasLectures && isExpanded && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/60 p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                قائمة المحاضرات المقررة ({lectures.length} محاضرات):
              </span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">
                اضغط قراءة أو تحميل للمحاضرة المطلوبة
              </span>
            </div>
            {lectures.map((lecture, idx) => renderLectureRow(grade, subject, lecture, idx))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="px-4 pt-4 pb-28 space-y-5 animate-classic">
      {/* 1. Top Header Banner */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/20 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                محاضرات تقنيات الأشعة والتصوير الطبي
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                المحاضرات الجامعية المعتمدة لجميع مواد قسم الأشعة (قراءة مباشرة وتحميل PDF)
              </p>
            </div>
          </div>
        </div>

        {/* Search Input for Lectures */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن مادة أو عنوان محاضرة (مثال: رنين، مفراس، تشريح، T1, T2, فيزياء الإشعاع)..."
            className="w-full pr-10 pl-9 py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Academic Stage Lock Banner */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/90 to-slate-900 border border-cyan-500/35 flex items-center justify-between gap-3 text-white shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    المرحلة الدراسية
                  </span>
                  <span className="text-xs font-black text-white truncate">
                    {activeGradeObj?.grade.name}
                  </span>
                </div>
                <p className="text-[11px] text-cyan-200/80 mt-0.5">
                  معروض حصراً: {activeGradeObj?.grade.subjects.length} مواد و {totalGradeLecturesCount} محاضرة لهذه المرحلة
                </p>
              </div>
            </div>

            {onUpdateUserClass && (
              <button
                type="button"
                onClick={() => setIsChangeStageModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 hover:text-white border border-cyan-400/30 text-[11px] font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                title="تعديل مرحلتك الدراسية"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>تعديل المرحلة</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Explicit Information Banner */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-cyan-500/10 via-teal-500/15 to-indigo-500/10 border border-cyan-500/30 dark:border-cyan-400/25 flex items-start gap-3 shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
          <BookMarked className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-black text-slate-900 dark:text-white">
              محاضرات {activeGradeObj?.grade.name || 'المرحلة الدراسية'}:
            </h4>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-600 text-white">
              {activeGradeObj?.grade.subjects.length} مواد تخصصية
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            كل مادة مقسمة إلى سلسلة محاضرات مرقمة ومرتبة تسلسلياً بحسب الخطة الأكاديمية ومفردات المنهج المعتمد.
          </p>
        </div>
      </div>

      {/* IF SEARCH IS ACTIVE: Show Filtered Results */}
      {searchQuery.trim() !== '' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              نتائج البحث عن المحاضرات ({searchResults.length})
            </h3>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 cursor-pointer"
            >
              مسح البحث
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-2">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                لا توجد محاضرات مطابقة لـ "{searchQuery}" في هذه المرحلة
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map(({ grade, subject, matchingLectures }) =>
                renderSubjectCard(grade, subject, matchingLectures)
              )}
            </div>
          )}
        </div>
      ) : activeGradeObj ? (
        /* STANDARD VIEW: All subjects of selected stage with their lectures */
        <div className="space-y-4">
          <div className="space-y-3">
            {activeGradeObj.grade.subjects.map((subject) =>
              renderSubjectCard(activeGradeObj.grade, subject)
            )}
          </div>
        </div>
      ) : null}

      {/* ===================================================================== */}
      {/* IN-APP LECTURE READER & PDF MODAL                                     */}
      {/* ===================================================================== */}
      {activeLectureModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" dir="rtl">
          <div className="w-full max-w-2xl max-h-[92vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-classic">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/60">
              <div className="min-w-0">
                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 mb-0.5">
                  {activeLectureModal.gradeName} • {activeLectureModal.subjectName}
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  {activeLectureModal.lectureName}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveLectureModal(null)}
                className="w-9 h-9 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              {savedNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{savedNotice}</span>
                </div>
              )}

              {activeLectureModal.url ? (
                <div className="space-y-3">
                  <div className="w-full h-[65vh] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 relative">
                    <iframe
                      src={getEmbeddableUrl(activeLectureModal.url)}
                      title={activeLectureModal.lectureName}
                      className="w-full h-full border-0"
                      allow="autoplay"
                    />
                  </div>

                  {/* Actions below reader */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={getDownloadUrl(activeLectureModal.url)}
                      download={`${activeLectureModal.subjectName} - ${activeLectureModal.lectureName}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل المحاضرة (PDF)</span>
                    </a>

                    <a
                      href={activeLectureModal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>فتح في نافذة كاملة</span>
                    </a>

                    {onSaveToLibrary && (
                      <button
                        type="button"
                        onClick={() => {
                          onSaveToLibrary(
                            `${activeLectureModal.subjectName} - ${activeLectureModal.lectureName}`,
                            activeLectureModal.gradeName,
                            activeLectureModal.url
                          );
                          setSavedNotice('تم حفظ نسخة من المحاضرة في قسم المكتبة بنجاح!');
                        }}
                        className="py-2.5 px-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>حفظ في مكتبتي</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-10 px-4 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-500 flex items-center justify-center mx-auto">
                    <Clock className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    ملف المحاضرة قيد التجهيز
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    جاري رفع وإعداد رابط "{activeLectureModal.lectureName}" لمادة {activeLectureModal.subjectName}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Change Academic Stage */}
      {isChangeStageModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-classic" dir="rtl">
          <div className="w-full max-w-sm rounded-[28px] p-5 sm:p-6 bg-slate-900 border border-cyan-500/30 text-white shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">تعديل مرحلتك الدراسية</h3>
                  <p className="text-[10px] text-cyan-300">قسم تقنيات الأشعة والتصوير الطبي</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangeStageModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 pt-3 leading-relaxed">
              اختر مرحلتك لعرض محاضراتها المقررة حصراً:
            </p>

            <div className="space-y-2 pt-3">
              {STAGES_CONFIG.map((stg) => {
                const isCurrent = selectedGradeId === stg.id;
                return (
                  <button
                    key={stg.id}
                    type="button"
                    onClick={() => {
                      if (onUpdateUserClass) {
                        onUpdateUserClass(stg.label);
                      }
                      setSelectedGradeId(stg.id);
                      setSearchQuery('');
                      setIsChangeStageModalOpen(false);
                    }}
                    className={`w-full p-3 rounded-2xl text-right transition-all border flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? 'bg-gradient-to-r from-cyan-950/90 to-indigo-950 border-cyan-400 text-white shadow-md ring-1 ring-cyan-400/50'
                        : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-cyan-400">{stg.tag}</span>
                        <h4 className="text-xs font-black text-white">{stg.label}</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{stg.subtitle}</p>
                    </div>
                    {isCurrent && (
                      <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => setIsChangeStageModalOpen(false)}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
