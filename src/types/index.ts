export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=الأحد, 1=الإثنين, 2=الثلاثاء, 3=الأربعاء, 4=الخميس, 5=الجمعة, 6=السبت

export interface TodaySubject {
  id: string;
  name: string;
  time: string;
  room?: string;
  instructor?: string;
  completed?: boolean;
}

export interface ScheduleItem {
  id: string;
  day: DayOfWeek;
  subjectName: string;
  time: string;
  room?: string;
  instructor?: string;
}

export interface DayCalendarNote {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;
  createdAt: string;
}

export interface GradeItem {
  id: string;
  title: string; // e.g. "شهر أول", "شهر ثانٍ", "نشاط", "نهائي"
  score: number; // e.g. 50
  maxScore: number; // e.g. 50 or 100
  date?: string;
}

export interface SubjectWithGrades {
  id: string;
  name: string;
  grades: GradeItem[];
}

export interface FolderFile {
  id: string;
  folderId: string;
  name: string;
  type: 'pdf' | 'image' | 'video' | 'other';
  dataUrl: string;
  size?: number;
  createdAt: string;
  isHidden?: boolean;
  hiddenCategory?: string; // 'أسئلة' | 'كتاب' | 'صور أسئلة' | 'شرح فيديو' | 'أخرى'
}

export interface LibraryFolder {
  id: string;
  name: string;
  createdAt: string;
  color?: string;
  isLocked?: boolean;
  password?: string;
  isHidden?: boolean;
}

export interface HomeworkReminder {
  id: string;
  title: string;           // عنوان الواجب أو المهمة
  date: string;            // YYYY-MM-DD
  time: string;            // HH:MM (e.g. "16:30")
  subjectName?: string;    // المادة الدراسية (اختياري)
  notes?: string;          // تفاصيل وملاحظات
  soundEnabled: boolean;   // تشغيل صوت التنبيه
  isCompleted: boolean;    // هل أنجز الطالب الواجب
  isDismissed: boolean;    // هل تم إغلاق التنبيه الحالي
  createdAt: string;
}

export interface VoiceTranscribedNote {
  id: string;
  text: string;
  subjectName?: string;
  createdAt: string;
}

export interface AppState {
  userName: string;
  userClass: string;
  isRegistered: boolean;
  hiddenVaultPasscode?: string;
  schedule: ScheduleItem[];
  calendarNotes: DayCalendarNote[];
  subjectsGrades: SubjectWithGrades[];
  folders: LibraryFolder[];
  files: FolderFile[];
  reminders?: HomeworkReminder[];
  voiceNotes?: VoiceTranscribedNote[];
  customCurriculumUrls?: Record<string, string>;
}
