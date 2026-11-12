import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { NotebookEntry, NotebookStatus } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { VoiceInputButton } from './VoiceInputButton';
import {
  NotebookPen,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  PauseCircle,
  XCircle,
  Pin,
  Edit3,
  Trash2,
  Send,
  Copy,
  Check,
  X,
  ChevronDown,
  MessageSquarePlus,
} from 'lucide-react';

interface NotebookViewProps {
  entries: NotebookEntry[];
  onAddEntry: (entry: Omit<NotebookEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateEntry: (id: string, updates: Partial<Omit<NotebookEntry, 'id' | 'createdAt'>>) => void;
  onChangeStatus: (id: string, status: NotebookStatus, statusNote?: string) => void;
  onTogglePin: (id: string) => void;
  onDeleteEntry: (id: string) => void;
  onResendToTelegram: (entry: NotebookEntry) => void;
}

export const STATUS_CONFIG: Record<
  NotebookStatus,
  {
    label: string;
    emoji: string;
    icon: React.FC<{ className?: string }>;
    borderAccent: string;
    activeBtn: string;
    textAccent: string;
  }
> = {
  in_progress: {
    label: 'قيد التنفيذ',
    emoji: '⏳',
    icon: Clock,
    borderAccent: 'border-r-4 border-r-cyan-500',
    activeBtn: 'bg-cyan-600 text-white border-cyan-600 shadow-xs',
    textAccent: 'text-cyan-600 dark:text-cyan-400',
  },
  completed: {
    label: 'تم الإنجاز',
    emoji: '✅',
    icon: CheckCircle2,
    borderAccent: 'border-r-4 border-r-emerald-500',
    activeBtn: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
    textAccent: 'text-emerald-600 dark:text-emerald-400',
  },
  postponed: {
    label: 'تأجيل',
    emoji: '🗓️',
    icon: PauseCircle,
    borderAccent: 'border-r-4 border-r-amber-500',
    activeBtn: 'bg-amber-600 text-white border-amber-600 shadow-xs',
    textAccent: 'text-amber-600 dark:text-amber-400',
  },
  not_done: {
    label: 'لم يتم',
    emoji: '❌',
    icon: XCircle,
    borderAccent: 'border-r-4 border-r-rose-500',
    activeBtn: 'bg-rose-600 text-white border-rose-600 shadow-xs',
    textAccent: 'text-rose-600 dark:text-rose-400',
  },
};

const STATUS_ORDER: NotebookStatus[] = ['in_progress', 'completed', 'postponed', 'not_done'];
const CATEGORY_PRESETS = ['عام', 'دراسة', 'مستشفى', 'مهام', 'شخصي', 'متابعة'];
const QUICK_STATUS_NOTES = [
  'تم الإنجاز بالكامل',
  'مؤجل إلى الغد',
  'مؤجل للأسبوع القادم',
  'لم يتم لعدم توفر الوقت',
  'بانتظار المتابعة',
];

const getTodayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const NotebookView: React.FC<NotebookViewProps> = ({
  entries,
  onAddEntry,
  onUpdateEntry,
  onChangeStatus,
  onTogglePin,
  onDeleteEntry,
  onResendToTelegram,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | NotebookStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Inline quick status-note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [quickStatusNoteText, setQuickStatusNoteText] = useState('');

  // Modal state for Create / Edit entry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<NotebookEntry | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDetails, setFormDetails] = useState('');
  const [formStatus, setFormStatus] = useState<NotebookStatus>('in_progress');
  const [formStatusNote, setFormStatusNote] = useState('');
  const [formDate, setFormDate] = useState(getTodayISO());
  const [formPinned, setFormPinned] = useState(false);

  // Delete confirmation state
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingEntry(null);
    setFormTitle('');
    setFormCategory('');
    setFormDetails('');
    setFormStatus('in_progress');
    setFormStatusNote('');
    setFormDate(getTodayISO());
    setFormPinned(false);
    setIsModalOpen(true);
  };

  const openEditModal = (entry: NotebookEntry) => {
    setEditingEntry(entry);
    setFormTitle(entry.title);
    setFormCategory(entry.category || '');
    setFormDetails(entry.details);
    setFormStatus(entry.status);
    setFormStatusNote(entry.statusNote || '');
    setFormDate(entry.date || getTodayISO());
    setFormPinned(Boolean(entry.isPinned));
    setIsModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() && !formDetails.trim()) return;

    const cleanTitle = formTitle.trim() || 'مذكرة بدون عنوان';
    const payload = {
      title: cleanTitle,
      details: formDetails.trim(),
      category: formCategory.trim() || undefined,
      status: formStatus,
      statusNote: formStatusNote.trim() || undefined,
      date: formDate || getTodayISO(),
      isPinned: formPinned,
    };

    if (editingEntry) {
      onUpdateEntry(editingEntry.id, payload);
    } else {
      onAddEntry(payload);
    }

    setIsModalOpen(false);
  };

  const handleCopyEntry = (entry: NotebookEntry) => {
    const statusLabel = STATUS_CONFIG[entry.status].label;
    const text = [
      entry.title,
      `الحالة: ${statusLabel}${entry.statusNote ? ` (${entry.statusNote})` : ''}`,
      entry.category ? `التصنيف: ${entry.category}` : '',
      `التاريخ: ${entry.date}`,
      '',
      entry.details,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard?.writeText(text);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Counts per status
  const statusCounts = useMemo(() => {
    const counts: Record<'all' | NotebookStatus, number> = {
      all: entries.length,
      in_progress: 0,
      completed: 0,
      postponed: 0,
      not_done: 0,
    };
    for (const item of entries) {
      counts[item.status] = (counts[item.status] || 0) + 1;
    }
    return counts;
  }, [entries]);

  // Filtered and sorted entries (pinned first, then newest created/updated)
  const visibleEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries
      .filter((entry) => {
        const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
        if (!matchesStatus) return false;
        if (!q) return true;
        return (
          entry.title.toLowerCase().includes(q) ||
          entry.details.toLowerCase().includes(q) ||
          (entry.category && entry.category.toLowerCase().includes(q)) ||
          (entry.statusNote && entry.statusNote.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
          return a.isPinned ? -1 : 1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [entries, filterStatus, searchQuery]);

  return (
    <div className="space-y-3.5 pb-28 pt-2 px-4 max-w-lg mx-auto animate-classic" dir="rtl">
      {/* 1. Notebook Header & Controls Card */}
      <div className="classic-card rounded-2xl p-4 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <NotebookPen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                مفكرتي
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {entries.length} تدوينات · {statusCounts.completed} منجزة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>تدوينة جديدة</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في المفكرة..."
            className="w-full pr-9 pl-8 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 transition font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Segmented Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <span>الكل</span>
            <span className="text-[11px] opacity-75 tabular-nums">({statusCounts.all})</span>
          </button>

          {STATUS_ORDER.map((stKey) => {
            const cfg = STATUS_CONFIG[stKey];
            const isSelected = filterStatus === stKey;
            return (
              <button
                key={stKey}
                type="button"
                onClick={() => setFilterStatus(stKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? cfg.activeBtn
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <span>{cfg.label}</span>
                <span className="text-[11px] opacity-75 tabular-nums">({statusCounts[stKey]})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Notebook Entries List */}
      {visibleEntries.length === 0 ? (
        <div className="classic-card rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mx-auto flex items-center justify-center">
            <NotebookPen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {entries.length === 0 ? 'مفكرتك فارغة حالياً' : 'لا توجد تدوينات مطابقة'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {entries.length === 0
                ? 'ابدأ بكتابة تفاصيلك وملاحظاتك '
                : 'جرّب تغيير التصنيف أو كلمة البحث'}
            </p>
          </div>
          {entries.length === 0 && (
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>كتابة أول مذكرة</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleEntries.map((entry) => {
            const statusCfg = STATUS_CONFIG[entry.status];
            const StatusIcon = statusCfg.icon;
            const isLongText = entry.details.length > 220 || entry.details.split('\n').length > 4;
            const isExpanded = Boolean(expandedIds[entry.id]);
            const isEditingQuickNote = editingNoteId === entry.id;

            return (
              <article
                key={entry.id}
                className={`classic-card rounded-2xl p-4 space-y-2.5 ${statusCfg.borderAccent} transition-all`}
              >
                {/* Top Row: Quiet Metadata + Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                      {entry.isPinned && (
                        <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold">
                          <Pin className="w-3 h-3 fill-current" />
                          <span>مثبتة</span>
                          <span aria-hidden="true">·</span>
                        </span>
                      )}
                      <span className="tabular-nums">{entry.date}</span>
                      {entry.category && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {entry.category}
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className={`inline-flex items-center gap-1 font-bold ${statusCfg.textAccent}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusCfg.label}</span>
                      </span>
                    </div>

                    <h3
                      className={`text-sm font-bold leading-snug ${
                        entry.status === 'completed'
                          ? 'text-slate-600 dark:text-slate-300'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {entry.title}
                    </h3>
                  </div>

                  {/* Card Header Icon Controls */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onTogglePin(entry.id)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        entry.isPinned
                          ? 'text-amber-500 bg-amber-500/10'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={entry.isPinned ? 'إلغاء التثبيت' : 'تثبيت بالأعلى'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${entry.isPinned ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyEntry(entry)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="نسخ النص"
                    >
                      {copiedId === entry.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onResendToTelegram(entry)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="حفظ "
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(entry)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="تعديل"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setEntryToDelete(entry.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details Paper Body */}
                {entry.details && (
                  <div className="rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 p-3">
                    <p
                      className={`text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap ${
                        isLongText && !isExpanded ? 'line-clamp-4' : ''
                      }`}
                    >
                      {entry.details}
                    </p>
                    {isLongText && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedIds((prev) => ({ ...prev, [entry.id]: !isExpanded }))
                        }
                        className="mt-1.5 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{isExpanded ? 'إخفاء' : 'قراءة كل التفاصيل'}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>
                )}

                {/* Status Remark / Inline Quick Note */}
                {isEditingQuickNote ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      onChangeStatus(entry.id, entry.status, quickStatusNoteText.trim() || undefined);
                      setEditingNoteId(null);
                    }}
                    className="flex items-center gap-1.5 pt-0.5"
                  >
                    <input
                      type="text"
                      value={quickStatusNoteText}
                      onChange={(e) => setQuickStatusNoteText(e.target.value)}
                      placeholder="اكتب ملاحظة الحالة (مثال: تأجيل ليوم الأحد)..."
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
                    >
                      حفظ
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingNoteId(null)}
                      className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </form>
                ) : entry.statusNote ? (
                  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/50 text-xs">
                    <span className="text-slate-700 dark:text-slate-300 truncate">
                      <span className="font-bold text-slate-500 dark:text-slate-400">ملاحظة: </span>
                      {entry.statusNote}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickStatusNoteText(entry.statusNote || '');
                        setEditingNoteId(entry.id);
                      }}
                      className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline shrink-0 cursor-pointer"
                    >
                      تعديل
                    </button>
                  </div>
                ) : null}

                {/* Quick Status Switcher Row */}
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1 flex-wrap">
                    {STATUS_ORDER.map((stKey) => {
                      const cfg = STATUS_CONFIG[stKey];
                      const active = entry.status === stKey;
                      return (
                        <button
                          key={stKey}
                          type="button"
                          onClick={() => {
                            if (entry.status !== stKey) {
                              onChangeStatus(entry.id, stKey, entry.statusNote);
                            }
                          }}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                            active
                              ? cfg.activeBtn
                              : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>

                  {!isEditingQuickNote && !entry.statusNote && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickStatusNoteText('');
                        setEditingNoteId(entry.id);
                      }}
                      className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 cursor-pointer"
                      title="إضافة ملاحظة للحالة"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      <span>ملاحظة</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 3. Create / Edit Notebook Modal */}
      {isModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
            dir="rtl"
          >
            <div className="w-full max-w-md max-h-[88dvh] rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl text-slate-900 dark:text-white animate-classic flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                  <NotebookPen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>{editingEntry ? 'تعديل التدوينة' : 'تدوينة جديدة'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="flex flex-col flex-1 min-h-0 pt-3.5">
                <div className="flex-1 overflow-y-auto space-y-3.5 px-0.5 pb-2">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      العنوان
                    </label>
                    <input
                      type="text"
                      placeholder="عنوان المذكرة أو الموضوع..."
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 transition"
                      autoFocus
                      required
                    />
                  </div>

                  {/* Details + Voice Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        التفاصيل
                      </label>
                      <VoiceInputButton
                        compact
                        label="إملاء صوتي"
                        onTranscript={(txt) =>
                          setFormDetails((prev) => (prev ? `${prev} ${txt}` : txt))
                        }
                      />
                    </div>
                    <textarea
                      rows={5}
                      placeholder="اكتب جميع التفاصيل والملاحظات هنا..."
                      value={formDetails}
                      onChange={(e) => setFormDetails(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 transition leading-relaxed"
                    />
                  </div>

                  {/* Status Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      الحالة
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {STATUS_ORDER.map((stKey) => {
                        const cfg = STATUS_CONFIG[stKey];
                        const StIcon = cfg.icon;
                        const active = formStatus === stKey;
                        return (
                          <button
                            key={stKey}
                            type="button"
                            onClick={() => setFormStatus(stKey)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                              active
                                ? cfg.activeBtn
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <StIcon className="w-3.5 h-3.5" />
                            <span>{cfg.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status Note */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ملاحظة الحالة (اختياري)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: تم الإنجاز، لم يتم، تأجيل ليوم الخميس..."
                      value={formStatusNote}
                      onChange={(e) => setFormStatusNote(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 transition"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {QUICK_STATUS_NOTES.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFormStatusNote(preset)}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-700 dark:hover:text-cyan-300 transition cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category & Date + Pin */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        التصنيف (اختياري)
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: دراسة، مستشفى..."
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        التاريخ
                      </label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>
                  </div>

                  {/* Category quick chips */}
                  <div className="flex flex-wrap gap-1">
                    {CATEGORY_PRESETS.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormCategory(cat)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                          formCategory === cat
                            ? 'bg-cyan-600 text-white border-cyan-600'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Pin Toggle */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Pin className="w-3.5 h-3.5 text-amber-500" />
                      <span>تثبيت في أعلى المفكرة</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormPinned(!formPinned)}
                      className={`w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                        formPinned ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          formPinned ? '-translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="flex gap-2 pt-3 mt-1 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{editingEntry ? 'حفظ التعديل' : 'حفظ '}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* 4. Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!entryToDelete}
        title="حذف المذكرة"
        message="هل أنت متأكد من حذف هذه التدوينة؟"
        onCancel={() => setEntryToDelete(null)}
        onConfirm={() => {
          if (entryToDelete) {
            onDeleteEntry(entryToDelete);
            setEntryToDelete(null);
          }
        }}
      />
    </div>
  );
};
