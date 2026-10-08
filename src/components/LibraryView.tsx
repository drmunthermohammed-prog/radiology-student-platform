import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LibraryFolder, FolderFile } from '../types';
import { ConfirmModal } from './ConfirmModal';
import {
  Folder,
  FolderPlus,
  Plus,
  ArrowRight,
  Trash2,
  FileText,
  Image,
  Video,
  File,
  Download,
  Eye,
  X,
  ChevronLeft,
  Lock,
  KeyRound,
  ShieldAlert,
  Sparkles,
  EyeOff,
  ShieldCheck,
  FolderArchive,
  RefreshCw,
  Key,
  Search,
  LayoutGrid,
  List,
  Upload,
  BookOpen,
  HardDrive,
} from 'lucide-react';

interface LibraryViewProps {
  folders: LibraryFolder[];
  files: FolderFile[];
  onAddFolder: (name: string, isLocked?: boolean, password?: string, color?: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onAddFileToFolder: (folderId: string, file: Omit<FolderFile, 'id' | 'folderId'>) => void;
  onDeleteFile: (fileId: string) => void;
  onToggleHideFolder: (folderId: string) => void;
  onToggleHideFile: (fileId: string) => void;
  hiddenVaultPasscode: string;
  onUpdateVaultPasscode: (newPasscode: string) => void;
}

const FOLDER_COLORS = [
  { id: '#4f46e5', label: 'نيلي', bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30', fill: 'fill-indigo-500', bar: 'bg-indigo-500' },
  { id: '#f59e0b', label: 'ذهبي', bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', fill: 'fill-amber-500', bar: 'bg-amber-500' },
  { id: '#10b981', label: 'زمردي', bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', fill: 'fill-emerald-500', bar: 'bg-emerald-500' },
  { id: '#0ea5e9', label: 'سماوي', bg: 'bg-sky-500/15', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500/30', fill: 'fill-sky-500', bar: 'bg-sky-500' },
  { id: '#f43f5e', label: 'وردي', bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', fill: 'fill-rose-500', bar: 'bg-rose-500' },
  { id: '#8b5cf6', label: 'بنفسجي', bg: 'bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/30', fill: 'fill-violet-500', bar: 'bg-violet-500' },
];

function getFolderTheme(colorHex?: string) {
  return FOLDER_COLORS.find((c) => c.id === colorHex) || FOLDER_COLORS[1];
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  folders,
  files,
  onAddFolder,
  onDeleteFolder,
  onAddFileToFolder,
  onDeleteFile,
  onToggleHideFolder,
  onToggleHideFile,
  hiddenVaultPasscode,
  onUpdateVaultPasscode,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [librarySection, setLibrarySection] = useState<'folders' | 'all_files'>('folders');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [globalFileFilter, setGlobalFileFilter] = useState<'all' | 'pdf' | 'image' | 'video'>('all');

  // Modal to add folder
  const [isAddFolderModal, setIsAddFolderModal] = useState(false);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [folderColorInput, setFolderColorInput] = useState('#4f46e5');
  const [isLockedInput, setIsLockedInput] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // Password Unlock Prompt Modal for locked folders
  const [pendingLockedFolder, setPendingLockedFolder] = useState<LibraryFolder | null>(null);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  // Filter & search inside folder
  const [fileFilter, setFileFilter] = useState<'all' | 'pdf' | 'image' | 'video'>('all');
  const [folderSearchQuery, setFolderSearchQuery] = useState('');

  // Preview file modal (Images / Videos / PDF)
  const [previewFile, setPreviewFile] = useState<FolderFile | null>(null);

  // Deletion confirm states
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  // Hide confirmation states
  const [folderToHide, setFolderToHide] = useState<string | null>(null);
  const [fileToHide, setFileToHide] = useState<string | null>(null);

  // ===================== SECRET HIDDEN VAULT STATE =====================
  const [isSecretVaultPromptOpen, setIsSecretVaultPromptOpen] = useState(false);
  const [vaultEnteredPasscode, setVaultEnteredPasscode] = useState('');
  const [vaultPasscodeError, setVaultPasscodeError] = useState(false);
  const [isSecretVaultOpen, setIsSecretVaultOpen] = useState(false);

  // Change secret passcode modal state
  const [isChangePasscodeModal, setIsChangePasscodeModal] = useState(false);
  const [newVaultPasscode, setNewVaultPasscode] = useState('');

  // Long press timer for "إضافة مجلد" button
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActiveRef = useRef(false);

  const startLongPress = () => {
    isLongPressActiveRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
      setIsSecretVaultPromptOpen(true);
      setVaultEnteredPasscode('');
      setVaultPasscodeError(false);
    }, 700);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleAddFolderBtnClick = () => {
    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;
      return;
    }
    setIsAddFolderModal(true);
  };

  // Long press timer for Folder card
  const folderTimerRef = useRef<NodeJS.Timeout | null>(null);
  const folderLongPressActiveRef = useRef(false);

  const startFolderLongPress = (folderId: string) => {
    folderLongPressActiveRef.current = false;
    folderTimerRef.current = setTimeout(() => {
      folderLongPressActiveRef.current = true;
      if (navigator.vibrate) navigator.vibrate(40);
      setFolderToHide(folderId);
    }, 600);
  };

  const cancelFolderLongPress = () => {
    if (folderTimerRef.current) {
      clearTimeout(folderTimerRef.current);
      folderTimerRef.current = null;
    }
  };

  const handleFolderCardClick = (folder: LibraryFolder) => {
    if (folderLongPressActiveRef.current) {
      folderLongPressActiveRef.current = false;
      return;
    }
    handleFolderClick(folder);
  };

  // Long press timer for File card
  const fileTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileLongPressActiveRef = useRef(false);

  const startFileLongPress = (fileId: string) => {
    fileLongPressActiveRef.current = false;
    fileTimerRef.current = setTimeout(() => {
      fileLongPressActiveRef.current = true;
      if (navigator.vibrate) navigator.vibrate(40);
      setFileToHide(fileId);
    }, 600);
  };

  const cancelFileLongPress = () => {
    if (fileTimerRef.current) {
      clearTimeout(fileTimerRef.current);
      fileTimerRef.current = null;
    }
  };

  const handleFileCardClick = (file: FolderFile) => {
    if (fileLongPressActiveRef.current) {
      fileLongPressActiveRef.current = false;
      return;
    }
    if (file.dataUrl) {
      setPreviewFile(file);
    }
  };

  // Submit secret vault passcode
  const handleVaultPasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPasscode = hiddenVaultPasscode || '0000';
    if (vaultEnteredPasscode.trim() === targetPasscode) {
      setIsSecretVaultPromptOpen(false);
      setIsSecretVaultOpen(true);
      setVaultEnteredPasscode('');
      setVaultPasscodeError(false);
    } else {
      setVaultPasscodeError(true);
    }
  };

  // Change passcode submit
  const handleChangePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newVaultPasscode.trim()) {
      onUpdateVaultPasscode(newVaultPasscode.trim());
      setIsChangePasscodeModal(false);
      setNewVaultPasscode('');
    }
  };

  // Active folder in public library (must NOT be hidden)
  const activeFolder = folders.find((f) => f.id === selectedFolderId && !f.isHidden);

  // Public files inside the active folder (must NOT be hidden)
  const rawFolderFiles = files.filter((f) => f.folderId === selectedFolderId && !f.isHidden);

  const activeFolderFiles = rawFolderFiles.filter((f) => {
    const matchesType = fileFilter === 'all' || f.type === fileFilter;
    const matchesSearch = !folderSearchQuery.trim() || f.name.toLowerCase().includes(folderSearchQuery.trim().toLowerCase());
    return matchesType && matchesSearch;
  });

  // Public folders & files
  const publicFolders = folders.filter((f) => !f.isHidden);
  const publicFiles = files.filter((f) => !f.isHidden);

  const filteredPublicFolders = publicFolders.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const folderMatches = f.name.toLowerCase().includes(q);
    const hasMatchingFile = publicFiles.some(
      (file) => file.folderId === f.id && file.name.toLowerCase().includes(q)
    );
    return folderMatches || hasMatchingFile;
  });

  // Hidden folders and hidden files
  const hiddenFolders = folders.filter((f) => f.isHidden);
  const hiddenFiles = files.filter((f) => f.isHidden);

  // Add folder submit
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderNameInput.trim()) return;

    onAddFolder(
      folderNameInput.trim(),
      isLockedInput,
      isLockedInput ? passwordInput.trim() : undefined,
      folderColorInput
    );

    setFolderNameInput('');
    setIsLockedInput(false);
    setPasswordInput('');
    setIsAddFolderModal(false);
  };

  // Handle clicking a folder in regular library
  const handleFolderClick = (folder: LibraryFolder) => {
    if (folder.isLocked && folder.password) {
      setPendingLockedFolder(folder);
      setEnteredPasscode('');
      setPasscodeError(false);
    } else {
      setSelectedFolderId(folder.id);
      setFileFilter('all');
      setFolderSearchQuery('');
    }
  };

  // Unlock folder submit
  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingLockedFolder) return;

    if (enteredPasscode.trim() === pendingLockedFolder.password) {
      setSelectedFolderId(pendingLockedFolder.id);
      setFileFilter('all');
      setFolderSearchQuery('');
      setPendingLockedFolder(null);
      setEnteredPasscode('');
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
    }
  };

  // Upload file (Books, Images, Videos)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetFolderId?: string) => {
    const fId = targetFolderId || selectedFolderId;
    if (!fId) return;
    const file = e.target.files?.[0];
    if (!file) return;

    let fileType: 'pdf' | 'image' | 'video' | 'other' = 'other';
    if (file.type.includes('pdf')) {
      fileType = 'pdf';
    } else if (file.type.includes('image')) {
      fileType = 'image';
    } else if (file.type.includes('video')) {
      fileType = 'video';
    }

    const reader = new FileReader();
    reader.onload = () => {
      onAddFileToFolder(fId, {
        name: file.name,
        type: fileType,
        dataUrl: reader.result as string,
        size: file.size,
        createdAt: new Date().toISOString().slice(0, 10),
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const getFileIcon = (type: 'pdf' | 'image' | 'video' | 'other') => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-500" />;
      case 'image':
        return <Image className="w-5 h-5 text-emerald-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-violet-500" />;
      default:
        return <File className="w-5 h-5 text-sky-500" />;
    }
  };

  const getFileBadge = (type: 'pdf' | 'image' | 'video' | 'other') => {
    switch (type) {
      case 'pdf':
        return {
          label: 'كتاب PDF',
          color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
        };
      case 'image':
        return {
          label: 'صورة',
          color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        };
      case 'video':
        return {
          label: 'فيديو',
          color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20',
        };
      default:
        return {
          label: 'مستند',
          color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
        };
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'محفوظ محلياً';
    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ========================================================
  // VIEW 1: INSIDE SELECTED FOLDER (عرض الملفات داخل المجلد)
  // ========================================================
  if (activeFolder) {
    const themeStyle = getFolderTheme(activeFolder.color);
    const totalFolderBytes = rawFolderFiles.reduce((acc, f) => acc + (f.size || 0), 0);
    const pdfCount = rawFolderFiles.filter((f) => f.type === 'pdf').length;
    const imgCount = rawFolderFiles.filter((f) => f.type === 'image').length;
    const vidCount = rawFolderFiles.filter((f) => f.type === 'video').length;

    return (
      <div className="space-y-4 pb-28 pt-2 px-4 max-w-lg mx-auto animate-classic" dir="rtl">
        {/* 1. Folder Hero Header Card */}
        <div className="classic-card rounded-3xl p-5 relative overflow-hidden">
          <div className={`absolute top-0 inset-x-0 h-1.5 ${themeStyle.bar}`} />

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedFolderId(null)}
                className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition flex items-center justify-center shrink-0 active:scale-95"
                title="الرجوع للمجلدات"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className={`w-12 h-12 rounded-2xl ${themeStyle.bg} ${themeStyle.border} border flex items-center justify-center shrink-0 shadow-xs`}>
                <Folder className={`w-6 h-6 ${themeStyle.text} ${themeStyle.fill}`} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                    {activeFolder.name}
                  </h2>
                  {activeFolder.isLocked && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px] font-bold inline-flex items-center gap-1 shrink-0">
                      <Lock className="w-3 h-3" />
                      <span>مقفل</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  <span>{rawFolderFiles.length} ملفات</span>
                  <span>•</span>
                  <span className="font-mono">{formatFileSize(totalFolderBytes)}</span>
                </div>
              </div>
            </div>

            {/* Folder Actions: Delete */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setFolderToDelete(activeFolder.id)}
                className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition active:scale-95"
                title="حذف المجلد بالكامل"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Upload Banner Button Inside Folder */}
          <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <label className="cursor-pointer flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition active:scale-[0.98]">
              <Upload className="w-4 h-4" />
              <span>رفع كتاب PDF أو صورة أو فيديو للمجلد</span>
              <input
                type="file"
                accept=".pdf,image/*,video/*,.doc,.docx"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            {/* Grid / List View Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/70 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
                title="عرض شبكة"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
                title="عرض قائمة"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Search & Category Filter Tabs */}
        {rawFolderFiles.length > 0 && (
          <div className="space-y-2.5">
            {/* Search input inside folder */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={folderSearchQuery}
                onChange={(e) => setFolderSearchQuery(e.target.value)}
                placeholder={`ابحث داخل مجلد ${activeFolder.name}...`}
                className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-xs"
              />
            </div>

            {/* Filter Chips with Counts */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: 'all', label: 'الكل', count: rawFolderFiles.length },
                { id: 'pdf', label: 'كتب وملازم PDF', count: pdfCount },
                { id: 'image', label: 'صور وملخصات', count: imgCount },
                { id: 'video', label: 'فيديوهات', count: vidCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFileFilter(tab.id as any)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border ${
                    fileFilter === tab.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      fileFilter === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Files Display (Grid or List) */}
        {activeFolderFiles.length === 0 ? (
          <div className="classic-card rounded-3xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
              <BookOpen className="w-7 h-7" />
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {rawFolderFiles.length === 0 ? 'هذا المجلد فارغ حالياً' : 'لا توجد ملفات مطابقة للبحث'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              اضغط على زر "رفع كتاب PDF أو صورة أو فيديو" لإضافة ملازمك وملخصاتك وحفظها محلياً.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {activeFolderFiles.map((file) => {
              const badge = getFileBadge(file.type);
              const isImageWithPreview = file.type === 'image' && file.dataUrl;

              return (
                <div
                  key={file.id}
                  onMouseDown={() => startFileLongPress(file.id)}
                  onMouseUp={cancelFileLongPress}
                  onMouseLeave={cancelFileLongPress}
                  onTouchStart={() => startFileLongPress(file.id)}
                  onTouchEnd={cancelFileLongPress}
                  onTouchCancel={cancelFileLongPress}
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={() => handleFileCardClick(file)}
                  className="classic-card rounded-3xl p-3.5 flex flex-col justify-between hover:border-indigo-500/50 transition cursor-pointer select-none touch-manipulation group overflow-hidden"
                >
                  <div>
                    {/* Thumbnail or Styled Icon Box */}
                    <div className="w-full h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center overflow-hidden relative mb-3">
                      {isImageWithPreview ? (
                        <img
                          src={file.dataUrl}
                          alt={file.name}
                          draggable={false}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-xs flex items-center justify-center">
                            {getFileIcon(file.type)}
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* File Name & Metadata */}
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {file.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                      {formatFileSize(file.size)} • {file.createdAt}
                    </p>
                  </div>

                  {/* Quick Action Bar */}
                  <div
                    className="flex items-center justify-between gap-1 pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1">
                      {file.dataUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition"
                          title="معاينة الملف"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setFileToDelete(file.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition"
                      title="حذف الملف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeFolderFiles.map((file) => {
              const badge = getFileBadge(file.type);

              return (
                <div
                  key={file.id}
                  onMouseDown={() => startFileLongPress(file.id)}
                  onMouseUp={cancelFileLongPress}
                  onMouseLeave={cancelFileLongPress}
                  onTouchStart={() => startFileLongPress(file.id)}
                  onTouchEnd={cancelFileLongPress}
                  onTouchCancel={cancelFileLongPress}
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={() => handleFileCardClick(file)}
                  className="classic-card rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-indigo-500/50 transition cursor-pointer select-none touch-manipulation"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center shrink-0">
                      {getFileIcon(file.type)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {file.name}
                        </h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold shrink-0 ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono mt-0.5">
                        {formatFileSize(file.size)} • {file.createdAt}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {file.dataUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewFile(file)}
                        className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-600 hover:text-white transition active:scale-95"
                        title="معاينة أو فتح"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setFileToDelete(file.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition active:scale-95"
                      title="حذف الملف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Preview File */}
        {previewFile && createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-classic">
            <div className="w-full max-w-xl max-h-[85dvh] rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white" dir="rtl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3 shrink-0">
                <h4 className="text-sm font-bold truncate max-w-sm">{previewFile.name}</h4>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center transition hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl p-2 min-h-[260px] border border-slate-200 dark:border-slate-800">
                {previewFile.type === 'image' ? (
                  <img src={previewFile.dataUrl} alt={previewFile.name} className="max-h-[55dvh] object-contain rounded-xl shadow" />
                ) : previewFile.type === 'video' ? (
                  <video controls src={previewFile.dataUrl} className="max-h-[55dvh] w-full rounded-xl shadow" />
                ) : previewFile.type === 'pdf' ? (
                  <iframe src={previewFile.dataUrl} className="w-full h-[55dvh] rounded-xl" title={previewFile.name} />
                ) : (
                  <div className="text-center p-8 text-slate-500 dark:text-slate-400">
                    <File className="w-12 h-12 mx-auto mb-2 text-indigo-500" />
                    <p className="text-xs">المستند محفوظ ومخزن محلياً في جهازك.</p>
                  </div>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                <a
                  href={previewFile.dataUrl}
                  download={previewFile.name}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/25 transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل الملف للجهاز</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Confirmation Modal for hiding File */}
        <ConfirmModal
          isOpen={!!fileToHide}
          title="إخفاء الملف في الخزنة السرية"
          message="هل أنت متأكد من إخفاء هذا الملف؟ لن يظهر في هذا المجلد بعد الآن ولن يمكن لأحد عرضه إلا بالدخول إلى الخزنة السرية واستخراجه."
          onCancel={() => setFileToHide(null)}
          onConfirm={() => {
            if (fileToHide) {
              onToggleHideFile(fileToHide);
              setFileToHide(null);
            }
          }}
        />

        {/* Confirmation Modal for deleting File */}
        <ConfirmModal
          isOpen={!!fileToDelete}
          title="تأكيد حذف الملف"
          message="هل أنت متأكد من رغبتك في حذف هذا الملف من المجلد نهائياً؟"
          onCancel={() => setFileToDelete(null)}
          onConfirm={() => {
            if (fileToDelete) {
              onDeleteFile(fileToDelete);
              setFileToDelete(null);
            }
          }}
        />

        {/* Confirmation Modal for hiding Folder */}
        <ConfirmModal
          isOpen={!!folderToHide}
          title="إخفاء المجلد في الخزنة السرية"
          message={`هل أنت متأكد من إخفاء مجلد (${activeFolder.name})؟ سيختفي المجلد تماماً من المكتبة العامة ولن يظهر إلا في الخزنة السرية عبر الرقم السري.`}
          onCancel={() => setFolderToHide(null)}
          onConfirm={() => {
            if (folderToHide) {
              onToggleHideFolder(folderToHide);
              setSelectedFolderId(null);
              setFolderToHide(null);
            }
          }}
        />

        {/* Confirmation Modal for deleting Folder */}
        <ConfirmModal
          isOpen={!!folderToDelete}
          title="تأكيد حذف المجلد"
          message={`هل أنت متأكد من رغبتك في حذف مجلد (${activeFolder.name}) وكافة الملفات والكتب الموجودة بداخله نهائياً؟`}
          onCancel={() => setFolderToDelete(null)}
          onConfirm={() => {
            if (folderToDelete) {
              onDeleteFolder(folderToDelete);
              setSelectedFolderId(null);
              setFolderToDelete(null);
            }
          }}
        />
      </div>
    );
  }

  // ========================================================
  // VIEW 2: MAIN FOLDERS & FILES DASHBOARD (عرض المجلدات والملفات المنظمة)
  // ========================================================
  const totalPublicBooks = publicFiles.filter((f) => f.type === 'pdf').length;
  const totalPublicMedia = publicFiles.filter((f) => f.type === 'image' || f.type === 'video').length;

  // Files in unlocked public folders for the "All Files" view
  const unlockedFolderIds = new Set(publicFolders.filter((f) => !f.isLocked).map((f) => f.id));
  const browsablePublicFiles = publicFiles.filter((f) => unlockedFolderIds.has(f.folderId));

  const filteredGlobalFiles = browsablePublicFiles.filter((f) => {
    const matchesType = globalFileFilter === 'all' || f.type === globalFileFilter;
    const matchesSearch =
      !searchQuery.trim() || f.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-28 pt-2 px-4 max-w-lg mx-auto animate-classic" dir="rtl">
      {/* 1. Library Header & Stats Banner */}
      <div className="classic-card rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                المكتبة والمجلدات الدراسية
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                نظم ملازمك، كتبك، وملخصاتك في مجلدات ملونة ومحمية
              </p>
            </div>
          </div>

          {/* Button with Long Press detection for Secret Vault */}
          <button
            type="button"
            onClick={handleAddFolderBtnClick}
            onMouseDown={startLongPress}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onTouchStart={startLongPress}
            onTouchEnd={cancelLongPress}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition active:scale-95 select-none touch-manipulation shrink-0"
            title="اضغط لإضافة مجلد (أو اضغط مطولاً لفتح الخزنة السرية)"
          >
            <FolderPlus className="w-4 h-4" />
            <span>مجلد جديد</span>
          </button>
        </div>

        {/* Quick Library Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setLibrarySection('folders')}
            className={`p-3 rounded-2xl border text-center transition ${
              librarySection === 'folders'
                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800/80'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300'
            }`}
          >
            <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 block leading-tight">
              {publicFolders.length}
            </span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5 block">
              مجلدات المواد
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLibrarySection('all_files');
              setGlobalFileFilter('pdf');
            }}
            className={`p-3 rounded-2xl border text-center transition ${
              librarySection === 'all_files' && globalFileFilter === 'pdf'
                ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/80'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-rose-300'
            }`}
          >
            <span className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 block leading-tight">
              {totalPublicBooks}
            </span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5 block">
              كتب وملازم PDF
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLibrarySection('all_files');
              setGlobalFileFilter('image');
            }}
            className={`p-3 rounded-2xl border text-center transition ${
              librarySection === 'all_files' && globalFileFilter === 'image'
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300'
            }`}
          >
            <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 block leading-tight">
              {totalPublicMedia}
            </span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5 block">
              صور وفيديوهات
            </span>
          </button>
        </div>

        {/* Section Switcher: المجلدات الدراسية | كل الملفات والكتب */}
        <div className="flex bg-slate-100 dark:bg-slate-950/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setLibrarySection('folders')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              librarySection === 'folders'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>عرض المجلدات ({publicFolders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setLibrarySection('all_files');
              setGlobalFileFilter('all');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              librarySection === 'all_files'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>عرض كل الملفات ({browsablePublicFiles.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Search Bar & View Mode Switcher */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              librarySection === 'folders'
                ? 'ابحث عن مجلد مادة أو ملف بداخله...'
                : 'ابحث في جميع الكتب والملخصات والملفات...'
            }
            className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl transition ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="عرض شبكي"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl transition ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="عرض قائمة منظمة"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Filter Bar when browsing All Files */}
      {librarySection === 'all_files' && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {[
            { id: 'all', label: 'جميع الملفات', count: browsablePublicFiles.length },
            { id: 'pdf', label: 'كتب وملازم PDF', count: browsablePublicFiles.filter((f) => f.type === 'pdf').length },
            { id: 'image', label: 'صور وملخصات', count: browsablePublicFiles.filter((f) => f.type === 'image').length },
            { id: 'video', label: 'فيديوهات شرح', count: browsablePublicFiles.filter((f) => f.type === 'video').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setGlobalFileFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border ${
                globalFileFilter === tab.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  globalFileFilter === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 3A. Public Folders Display (Grid or List) */}
      {librarySection === 'folders' ? (
        filteredPublicFolders.length === 0 ? (
          <div className="classic-card rounded-3xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center mb-3">
              <Folder className="w-7 h-7 fill-amber-500" />
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {publicFolders.length === 0 ? 'لا توجد مجلدات دراسية بعد' : 'لا توجد مجلدات مطابقة للبحث'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              اضغط على زر "مجلد جديد" لإضافة مجلدات موادك وسلايداتك (مثل: التشريح الشعاعي، المفراس CT، الرنين MRI).
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3.5">
            {filteredPublicFolders.map((folder) => {
              const folderFiles = publicFiles.filter((f) => f.folderId === folder.id);
              const pdfCount = folderFiles.filter((f) => f.type === 'pdf').length;
              const mediaCount = folderFiles.filter((f) => f.type !== 'pdf').length;
              const themeStyle = getFolderTheme(folder.color);

              return (
                <div
                  key={folder.id}
                  onMouseDown={() => startFolderLongPress(folder.id)}
                  onMouseUp={cancelFolderLongPress}
                  onMouseLeave={cancelFolderLongPress}
                  onTouchStart={() => startFolderLongPress(folder.id)}
                  onTouchEnd={cancelFolderLongPress}
                  onTouchCancel={cancelFolderLongPress}
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={() => handleFolderCardClick(folder)}
                  className="classic-card rounded-3xl p-4 flex flex-col justify-between relative overflow-hidden cursor-pointer select-none touch-manipulation group hover:border-indigo-500/60 hover:shadow-md transition-all"
                >
                  {/* Folder Top Tab Accent */}
                  <div className={`absolute top-0 right-0 left-0 h-1.5 ${themeStyle.bar}`} />

                  <div className="pt-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div
                        className={`w-12 h-12 rounded-2xl ${themeStyle.bg} ${themeStyle.border} border flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform`}
                      >
                        <Folder className={`w-6 h-6 ${themeStyle.text} ${themeStyle.fill}`} />
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {folder.isLocked ? (
                          <span
                            title="مجلد مقفل برقم سري"
                            className="p-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <label
                            title="رفع ملف سريع إلى هذا المجلد"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <input
                              type="file"
                              accept=".pdf,image/*,video/*,.doc,.docx"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, folder.id)}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {folder.name}
                    </h3>

                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      {folderFiles.length === 0
                        ? 'مجلد فارغ — اضغط للفتح'
                        : `${folderFiles.length} ملفات محفوظة`}
                    </p>
                  </div>

                  {/* Bottom Breakdown Footer */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span>{pdfCount} كتاب</span>
                      <span aria-hidden="true">·</span>
                      <span>{mediaCount} وسائط</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredPublicFolders.map((folder) => {
              const folderFiles = publicFiles.filter((f) => f.folderId === folder.id);
              const pdfCount = folderFiles.filter((f) => f.type === 'pdf').length;
              const mediaCount = folderFiles.filter((f) => f.type !== 'pdf').length;
              const themeStyle = getFolderTheme(folder.color);

              return (
                <div
                  key={folder.id}
                  onMouseDown={() => startFolderLongPress(folder.id)}
                  onMouseUp={cancelFolderLongPress}
                  onMouseLeave={cancelFolderLongPress}
                  onTouchStart={() => startFolderLongPress(folder.id)}
                  onTouchEnd={cancelFolderLongPress}
                  onTouchCancel={cancelFolderLongPress}
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={() => handleFolderCardClick(folder)}
                  className="classic-card rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer select-none touch-manipulation group hover:border-indigo-500/60 transition relative overflow-hidden"
                >
                  <div className={`absolute top-0 bottom-0 right-0 w-1.5 ${themeStyle.bar}`} />

                  <div className="flex items-center gap-3.5 min-w-0 pr-1.5">
                    <div
                      className={`w-12 h-12 rounded-2xl ${themeStyle.bg} ${themeStyle.border} border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition`}
                    >
                      <Folder className={`w-6 h-6 ${themeStyle.text} ${themeStyle.fill}`} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                          {folder.name}
                        </h3>
                        {folder.isLocked && (
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>مقفل</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                        <span>{folderFiles.length} ملفات</span>
                        <span aria-hidden="true">·</span>
                        <span>{pdfCount} كتاب PDF</span>
                        <span aria-hidden="true">·</span>
                        <span>{mediaCount} وسائط</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!folder.isLocked && (
                      <label
                        title="رفع ملف سريع للمجلد"
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept=".pdf,image/*,video/*,.doc,.docx"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, folder.id)}
                        />
                      </label>
                    )}
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                      <ChevronLeft className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* 3B. All Files Display (عند اختيار "عرض كل الملفات") */
        filteredGlobalFiles.length === 0 ? (
          <div className="classic-card rounded-3xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
              <FileText className="w-7 h-7" />
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              لا توجد ملفات مطابقة للعرض
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              افتح أي مجلد دراسي واضغط على "رفع كتاب PDF أو صورة أو فيديو" لإضافة ملفاتك الدراسية.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3.5">
            {filteredGlobalFiles.map((file) => {
              const badge = getFileBadge(file.type);
              const parentFolder = publicFolders.find((f) => f.id === file.folderId);
              const isImageWithPreview = file.type === 'image' && file.dataUrl;

              return (
                <div
                  key={file.id}
                  onMouseDown={() => startFileLongPress(file.id)}
                  onMouseUp={cancelFileLongPress}
                  onMouseLeave={cancelFileLongPress}
                  onTouchStart={() => startFileLongPress(file.id)}
                  onTouchEnd={cancelFileLongPress}
                  onTouchCancel={cancelFileLongPress}
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={() => handleFileCardClick(file)}
                  className="classic-card rounded-3xl p-3.5 flex flex-col justify-between hover:border-indigo-500/60 transition cursor-pointer select-none touch-manipulation group overflow-hidden"
                >
                  <div>
                    <div className="w-full h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center overflow-hidden relative mb-3">
                      {isImageWithPreview ? (
                        <img
                          src={file.dataUrl}
                          alt={file.name}
                          draggable={false}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-center">
                            {getFileIcon(file.type)}
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            {badge.label}
                          </span>
                        </div>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {file.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {parentFolder && (
                        <>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                            {parentFolder.name}
                          </span>
                          <span aria-hidden="true">·</span>
                        </>
                      )}
                      <span className="font-mono shrink-0">{formatFileSize(file.size)}</span>
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between gap-1 pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1">
                      {file.dataUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition"
                          title="معاينة الملف"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setFileToDelete(file.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition"
                      title="حذف الملف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredGlobalFiles.map((file) => {
              const badge = getFileBadge(file.type);
              const parentFolder = publicFolders.find((f) => f.id === file.folderId);

              return (
                <div
                  key={file.id}
                  onMouseDown={() => startFileLongPress(file.id)}
                  onMouseUp={cancelFileLongPress}
                  onMouseLeave={cancelFileLongPress}
                  onTouchStart={() => startFileLongPress(file.id)}
                  onTouchEnd={cancelFileLongPress}
                  onTouchCancel={cancelFileLongPress}
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={() => handleFileCardClick(file)}
                  className="classic-card rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-indigo-500/60 transition cursor-pointer select-none touch-manipulation"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center shrink-0">
                      {getFileIcon(file.type)}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {file.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {parentFolder && (
                          <>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {parentFolder.name}
                            </span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span>{badge.label}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {file.dataUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewFile(file)}
                        className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-600 hover:text-white transition"
                        title="معاينة الملف"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setFileToDelete(file.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition"
                      title="حذف الملف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Modal: Preview File from Main Dashboard or Vault */}
      {previewFile && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-classic">
          <div className="w-full max-w-xl max-h-[85dvh] rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3 shrink-0">
              <h4 className="text-sm font-bold truncate max-w-sm">{previewFile.name}</h4>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center transition hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl p-2 min-h-[260px] border border-slate-200 dark:border-slate-800">
              {previewFile.type === 'image' ? (
                <img src={previewFile.dataUrl} alt={previewFile.name} className="max-h-[55dvh] object-contain rounded-xl shadow" />
              ) : previewFile.type === 'video' ? (
                <video controls src={previewFile.dataUrl} className="max-h-[55dvh] w-full rounded-xl shadow" />
              ) : previewFile.type === 'pdf' ? (
                <iframe src={previewFile.dataUrl} className="w-full h-[55dvh] rounded-xl" title={previewFile.name} />
              ) : (
                <div className="text-center p-8 text-slate-500 dark:text-slate-400">
                  <File className="w-12 h-12 mx-auto mb-2 text-indigo-500" />
                  <p className="text-xs">المستند محفوظ ومخزن محلياً في جهازك.</p>
                </div>
              )}
            </div>

            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <a
                href={previewFile.dataUrl}
                download={previewFile.name}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/25 transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>تحميل الملف للجهاز</span>
              </a>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal for hiding File from Main Dashboard */}
      <ConfirmModal
        isOpen={!!fileToHide}
        title="إخفاء الملف في الخزنة السرية"
        message="هل أنت متأكد من إخفاء هذا الملف؟ لن يظهر في المكتبة العامة ولن يمكن عرضه إلا بالدخول إلى الخزنة السرية واستخراجه."
        onCancel={() => setFileToHide(null)}
        onConfirm={() => {
          if (fileToHide) {
            onToggleHideFile(fileToHide);
            setFileToHide(null);
          }
        }}
      />

      {/* Confirmation Modal for hiding Folder */}
      <ConfirmModal
        isOpen={!!folderToHide}
        title="إخفاء المجلد في الخزنة السرية"
        message="هل تريد إخفاء هذا المجلد؟ سيتم إخفاء المجلد وجميع الملفات والكتب والصور والفيديوهات الموجودة بداخله في الخزنة السرية ولن تظهر في الواجهة إلا إذا استخرجتها."
        onCancel={() => setFolderToHide(null)}
        onConfirm={() => {
          if (folderToHide) {
            onToggleHideFolder(folderToHide);
            setFolderToHide(null);
          }
        }}
      />

      {/* Modal: Add New Folder (with Color Picker & Passcode Lock option) */}
      {isAddFolderModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4" dir="rtl">
          <div className="w-full max-w-md max-h-[85dvh] rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-white animate-classic flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                إضافة مجلد دراسي جديد
              </h3>
              <button
                type="button"
                onClick={() => setIsAddFolderModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center transition hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="flex flex-col flex-1 min-h-0 pt-4">
              <div className="flex-1 overflow-y-auto space-y-4 px-0.5 pb-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    اسم المجلد
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: التشريح الشعاعي، المفراس CT، الرنين MRI"
                    value={folderNameInput}
                    onChange={(e) => setFolderNameInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition shadow-inner font-medium"
                    required
                    autoFocus
                  />
                </div>

                {/* Folder Color Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    لون تمييز المجلد
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {FOLDER_COLORS.map((c) => {
                      const isSelected = folderColorInput === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setFolderColorInput(c.id)}
                          className={`py-2 rounded-2xl border flex flex-col items-center justify-center gap-1 transition ${
                            isSelected
                              ? 'border-indigo-600 dark:border-white bg-slate-100 dark:bg-slate-800 scale-105 shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <Folder className={`w-5 h-5 ${c.text} ${c.fill}`} />
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lock with Password Toggle */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <Lock className="w-4 h-4 text-amber-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                          قفل المجلد برقم سري
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          لا يمكن فتح المجلد إلا بعد إدخال الرمز السري
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isLockedInput}
                      onChange={(e) => setIsLockedInput(e.target.checked)}
                      className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                    />
                  </label>

                  {isLockedInput && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 animate-classic">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        الرقم السري للمجلد
                      </label>
                      <input
                        type="password"
                        placeholder="أدخل رمز القفل (مثال: 1234)"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                        required={isLockedInput}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 mt-1 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setIsAddFolderModal(false)}
                  className="w-1/3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition active:scale-95"
                >
                  إنشاء المجلد
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Enter Passcode to Unlock Folder */}
      {pendingLockedFolder && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-classic">
          <div className="w-full max-w-sm rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-white text-center" dir="rtl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 mx-auto flex items-center justify-center mb-3 shadow-xs border border-amber-500/30">
              <KeyRound className="w-7 h-7" />
            </div>

            <h3 className="text-base font-black tracking-tight">
              مجلد محمي برقم سري
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              أدخل الرقم السري لفتح مجلد ({pendingLockedFolder.name})
            </p>

            <form onSubmit={handleUnlockSubmit} className="space-y-3.5 mt-4">
              <input
                type="password"
                placeholder="••••"
                value={enteredPasscode}
                onChange={(e) => {
                  setEnteredPasscode(e.target.value);
                  setPasscodeError(false);
                }}
                className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-2xl px-4 py-3 text-center text-lg font-mono tracking-widest text-slate-900 dark:text-white focus:outline-none transition shadow-inner ${
                  passcodeError
                    ? 'border-rose-500 text-rose-500 animate-pulse'
                    : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
                }`}
                autoFocus
                required
              />

              {passcodeError && (
                <p className="text-xs text-rose-500 font-bold flex items-center justify-center gap-1.5 animate-classic">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  الرقم السري غير صحيح! تأكد وحاول ثانية.
                </p>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingLockedFolder(null);
                    setEnteredPasscode('');
                    setPasscodeError(false);
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition active:scale-95"
                >
                  فتح المجلد
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL: SECRET VAULT PROMPT (مربع نص الرقم السري للخزنة)    */}
      {/* ========================================================= */}
      {isSecretVaultPromptOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-classic">
          <div className="w-full max-w-sm rounded-[32px] bg-white dark:bg-slate-900 border border-indigo-500/40 p-6 shadow-2xl text-slate-900 dark:text-white text-center" dir="rtl">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-sky-500 mx-auto flex items-center justify-center text-white mb-3.5 shadow-xl shadow-indigo-600/30 border border-white/20">
              <EyeOff className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black tracking-tight">
              الخزنة السرية للملفات المخفية
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              أدخل الرقم السري لعرض الأسئلة والكتب والمجلدات المخفية
            </p>

            <form onSubmit={handleVaultPasscodeSubmit} className="space-y-4 mt-5">
              <div>
                <input
                  type="password"
                  placeholder="الرقم السري (الافتراضي: 0000)"
                  value={vaultEnteredPasscode}
                  onChange={(e) => {
                    setVaultEnteredPasscode(e.target.value);
                    setVaultPasscodeError(false);
                  }}
                  className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-2xl px-4 py-3 text-center text-lg font-mono tracking-widest text-slate-900 dark:text-white focus:outline-none transition shadow-inner ${
                    vaultPasscodeError
                      ? 'border-rose-500 text-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'
                  }`}
                  autoFocus
                  required
                />
              </div>

              {vaultPasscodeError && (
                <p className="text-xs text-rose-500 font-bold flex items-center justify-center gap-1.5 animate-classic">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  الرقم السري غير صحيح! الرمز الافتراضي هو 0000
                </p>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSecretVaultPromptOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition active:scale-95"
                >
                  فتح وعرض المخفي
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL: FULL SECRET HIDDEN VAULT (شاشة الخزنة السرية الكاملة) */}
      {/* ========================================================= */}
      {isSecretVaultOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-4 animate-classic overflow-y-auto">
          <div className="w-full max-w-lg max-h-[88dvh] rounded-[32px] bg-white dark:bg-slate-900 border border-indigo-500/40 p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-white flex flex-col overflow-hidden" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <EyeOff className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                    الخزنة السرية للملفات المخفية
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {hiddenFolders.length} مجلدات مخفية • {hiddenFiles.length} ملفات مخفية
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsChangePasscodeModal(true)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition"
                  title="تغيير الرقم السري للخزنة"
                >
                  <Key className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsSecretVaultOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Notice */}
            <div className="my-3 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-800 dark:text-indigo-200 flex items-center gap-2 shrink-0">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>هذه العناصر مخفية تماماً عن الواجهة العادية، ولا تظهر إلا إذا ضغطت على "استخراج".</span>
            </div>

            {/* Vault Content - Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 pl-1">
              {/* 1. Hidden Folders Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-amber-500" />
                  <span>المجلدات المخفية ({hiddenFolders.length})</span>
                </h4>

                {hiddenFolders.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                    لا توجد مجلدات مخفية حالياً.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hiddenFolders.map((folder) => {
                      const fCount = files.filter((f) => f.folderId === folder.id).length;

                      return (
                        <div
                          key={folder.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                              <Folder className="w-5 h-5 fill-amber-500" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white">{folder.name}</h5>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">{fCount} ملفات</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onToggleHideFolder(folder.id)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>استخراج</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setFolderToDelete(folder.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition"
                              title="حذف نهائي"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Hidden Files Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-rose-500" />
                  <span>الأسئلة والملفات المخفية ({hiddenFiles.length})</span>
                </h4>

                {hiddenFiles.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                    لا توجد ملفات مخفية حالياً.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hiddenFiles.map((file) => {
                      const parentFolder = folders.find((f) => f.id === file.folderId);
                      const badge = getFileBadge(file.type);

                      return (
                        <div
                          key={file.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                              {getFileIcon(file.type)}
                            </div>
                            <div className="overflow-hidden">
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-xs">
                                {file.name}
                              </h5>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <span>{badge.label}</span>
                                {parentFolder && <span>• مجلد: {parentFolder.name}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {file.dataUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewFile(file)}
                                className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition"
                                title="معاينة أو تشغيل"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => onToggleHideFile(file.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow transition active:scale-95"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>استخراج</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setFileToDelete(file.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition"
                              title="حذف نهائي"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsSecretVaultOpen(false)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition"
              >
                إغلاق الخزنة
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Change Secret Passcode */}
      {isChangePasscodeModal && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-classic">
          <div className="w-full max-w-sm rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-2xl text-slate-900 dark:text-white text-center" dir="rtl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
              <Key className="w-6 h-6" />
            </div>

            <h4 className="text-base font-bold">تعيين رقم سري جديد للخزنة</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">اكتب الرمز الجديد الذي تريده للخزنة السرية</p>

            <form onSubmit={handleChangePasscodeSubmit} className="space-y-4 mt-4">
              <input
                type="password"
                placeholder="الرقم السري الجديد..."
                value={newVaultPasscode}
                onChange={(e) => setNewVaultPasscode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-center text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                required
                autoFocus
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasscodeModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow"
                >
                  حفظ الرمز
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal for deleting File */}
      <ConfirmModal
        isOpen={!!fileToDelete}
        title="تأكيد الحذف النهائي"
        message="هل أنت متأكد من رغبتك في حذف هذا الملف نهائياً؟ لا يمكن استعادة الملف بعد الحذف."
        onCancel={() => setFileToDelete(null)}
        onConfirm={() => {
          if (fileToDelete) {
            onDeleteFile(fileToDelete);
            setFileToDelete(null);
          }
        }}
      />

      {/* Confirmation Modal for deleting Folder */}
      <ConfirmModal
        isOpen={!!folderToDelete}
        title="تأكيد حذف المجلد النهائي"
        message="هل أنت متأكد من رغبتك في حذف هذا المجلد وكافة الملفات والأسئلة الموجودة بداخله نهائياً؟"
        onCancel={() => setFolderToDelete(null)}
        onConfirm={() => {
          if (folderToDelete) {
            onDeleteFolder(folderToDelete);
            if (selectedFolderId === folderToDelete) {
              setSelectedFolderId(null);
            }
            setFolderToDelete(null);
          }
        }}
      />
    </div>
  );
};
