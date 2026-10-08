import React, { useState, useEffect } from 'react';
import { AppState, ScheduleItem, DayOfWeek, GradeItem, FolderFile, HomeworkReminder } from './types';
import { Storage } from './services/storage';
import { TelegramBot } from './services/telegramBot';
import { SoundService } from './services/soundService';
import { Header } from './components/Header';
import { Navbar, MainTab } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { CalendarScheduleView } from './components/CalendarScheduleView';
import { GradesView } from './components/GradesView';
import { LibraryView } from './components/LibraryView';
import { BooksView } from './components/BooksView';
import { RegistrationView } from './components/RegistrationView';
import { PWAInstallModal } from './components/PWAInstallModal';
import { TelegramToast } from './components/TelegramToast';
import { AlarmRingingModal } from './components/AlarmRingingModal';
import { WelcomeSplash } from './components/WelcomeSplash';

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function App() {
  const [state, setState] = useState<AppState>(() => Storage.load());
  const [currentTab, setCurrentTab] = useState<MainTab>('home');
  const [showWelcomeSplash, setShowWelcomeSplash] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('talib_theme');
      return saved === 'light' || saved === 'dark' ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [isPWAInstallOpen, setIsPWAInstallOpen] = useState(false);

  // Active ringing alarm modal state
  const [activeAlarmReminder, setActiveAlarmReminder] = useState<HomeworkReminder | null>(null);

  // Telegram toast state
  const [showTelegramToast, setShowTelegramToast] = useState(false);
  const [telegramToastMsg, setTelegramToastMsg] = useState('تم بنجاح');

  const triggerTelegramToast = (msg?: string) => {
    if (msg) setTelegramToastMsg(msg);
    setShowTelegramToast(true);
    setTimeout(() => {
      setShowTelegramToast(false);
    }, 3000);
  };

  // Sync dark/light theme to document root and body
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
    }
    try {
      localStorage.setItem('talib_theme', theme);
    } catch {
      // Ignore storage error
    }
  }, [theme]);

  // Persist state to IndexedDB and LocalStorage automatically
  useEffect(() => {
    Storage.save(state);
  }, [state]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 0. REGISTRATION ACTION (صفحة التسجيل)
  const handleRegister = (name: string, studentClass: string) => {
    setState((prev) => ({
      ...prev,
      userName: name,
      userClass: studentClass,
      isRegistered: true,
    }));
    setShowWelcomeSplash(true);

    // Send silently to Telegram in the background without any announcement/toast in the UI
    TelegramBot.sendStudentRegistration(name, studentClass);
  };

  // 1. HOME ACTIONS
  const handleUpdateUserName = (newName: string) => {
    setState((prev) => ({ ...prev, userName: newName }));
  };

  const handleUpdateProfile = (name: string, studentStage: string) => {
    setState((prev) => ({
      ...prev,
      userName: name,
      userClass: studentStage,
    }));
    triggerTelegramToast('تم تحديث البيانات الجامعية بنجاح');
  };

  const handleUpdateUserClass = (newStage: string) => {
    setState((prev) => ({
      ...prev,
      userClass: newStage,
    }));
    triggerTelegramToast(`تم تخصيص المنصة لـ ${newStage}`);
  };

  const handleResetAllData = () => {
    const fresh = Storage.clearAllData();
    setState(fresh);
    triggerTelegramToast('تم تفريغ ومسح كافة البيانات بنجاح');
  };

  const handleAddTodaySubject = (sub: { name: string; time: string; room?: string; instructor?: string }) => {
    const todayIndex = new Date().getDay() as DayOfWeek;
    const newItem: ScheduleItem = {
      id: 'sch_' + Date.now(),
      day: todayIndex,
      subjectName: sub.name,
      time: sub.time,
      room: sub.room,
      instructor: sub.instructor,
    };
    setState((prev) => ({
      ...prev,
      schedule: [...prev.schedule, newItem],
    }));

    // Send to Telegram
    TelegramBot.sendScheduleAdded(DAY_NAMES[todayIndex], sub.name, sub.time, sub.room);
    triggerTelegramToast('تم إضافة المحاضرة');
  };

  // 2. SCHEDULE & CALENDAR ACTIONS
  const handleAddScheduleItem = (item: ScheduleItem) => {
    setState((prev) => ({
      ...prev,
      schedule: [...prev.schedule, item],
    }));

    // Send to Telegram
    TelegramBot.sendScheduleAdded(DAY_NAMES[item.day], item.subjectName, item.time, item.room);
    triggerTelegramToast('تم حفظ المحاضرة');
  };

  const handleDeleteScheduleItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((s) => s.id !== id),
    }));
  };

  const handleSaveCalendarNote = (date: string, text: string) => {
    setState((prev) => {
      const existing = prev.calendarNotes.filter((n) => n.date !== date);
      return {
        ...prev,
        calendarNotes: [...existing, { id: 'cn_' + Date.now(), date, text, createdAt: new Date().toISOString() }],
      };
    });

    // Send note to Telegram
    TelegramBot.sendCalendarNote(date, text);
    triggerTelegramToast('تم حفظ الملاحظة');
  };

  const handleDeleteCalendarNote = (date: string) => {
    setState((prev) => ({
      ...prev,
      calendarNotes: prev.calendarNotes.filter((n) => n.date !== date),
    }));
  };

  // 3. GRADES ACTIONS
  const handleAddSubjectGrade = (name: string) => {
    setState((prev) => ({
      ...prev,
      subjectsGrades: [
        ...prev.subjectsGrades,
        { id: 'sub_' + Date.now(), name, grades: [] },
      ],
    }));
  };

  const handleDeleteSubjectGrade = (subjectId: string) => {
    setState((prev) => ({
      ...prev,
      subjectsGrades: prev.subjectsGrades.filter((s) => s.id !== subjectId),
    }));
  };

  const handleAddGradeToSubject = (subjectId: string, grade: Omit<GradeItem, 'id'>) => {
    const subject = state.subjectsGrades.find((s) => s.id === subjectId);
    setState((prev) => ({
      ...prev,
      subjectsGrades: prev.subjectsGrades.map((s) => {
        if (s.id === subjectId) {
          const newGrade: GradeItem = {
            id: 'g_' + Date.now(),
            ...grade,
          };
          return {
            ...s,
            grades: [...s.grades, newGrade],
          };
        }
        return s;
      }),
    }));

    // Send grade to Telegram
    if (subject) {
      TelegramBot.sendGradeAdded(subject.name, grade.title, grade.score, grade.maxScore);
      triggerTelegramToast('تم حفظ الدرجة');
    }
  };

  const handleDeleteGradeFromSubject = (subjectId: string, gradeId: string) => {
    setState((prev) => ({
      ...prev,
      subjectsGrades: prev.subjectsGrades.map((s) => {
        if (s.id === subjectId) {
          return {
            ...s,
            grades: s.grades.filter((g) => g.id !== gradeId),
          };
        }
        return s;
      }),
    }));
  };

  // 4. LIBRARY ACTIONS & HIDDEN VAULT
  const handleAddFolder = (name: string, isLocked?: boolean, password?: string, color?: string) => {
    setState((prev) => ({
      ...prev,
      folders: [
        ...prev.folders,
        { 
          id: 'f_' + Date.now(), 
          name, 
          createdAt: new Date().toISOString().slice(0, 10),
          color: color || '#4f46e5',
          isLocked,
          password,
          isHidden: false,
        },
      ],
    }));
  };

  const handleDeleteFolder = (folderId: string) => {
    setState((prev) => ({
      ...prev,
      folders: prev.folders.filter((f) => f.id !== folderId),
      files: prev.files.filter((f) => f.folderId !== folderId),
    }));
  };

  const handleAddFileToFolder = (folderId: string, file: Omit<FolderFile, 'id' | 'folderId'>) => {
    const newFile: FolderFile = {
      id: 'file_' + Date.now(),
      folderId,
      ...file,
      isHidden: false,
    };
    setState((prev) => ({
      ...prev,
      files: [newFile, ...prev.files],
    }));

    // Send file to Telegram
    const folder = state.folders.find((f) => f.id === folderId);
    const folderName = folder ? folder.name : 'المكتبة';
    TelegramBot.sendFile(file, folderName);
    triggerTelegramToast('تم حفظ الملف');
  };

  const handleDeleteFile = (fileId: string) => {
    setState((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.id !== fileId),
    }));
  };

  const handleToggleHideFolder = (folderId: string) => {
    setState((prev) => {
      const targetFolder = prev.folders.find((f) => f.id === folderId);
      if (!targetFolder) return prev;
      const willBeHidden = !targetFolder.isHidden;

      return {
        ...prev,
        folders: prev.folders.map((f) =>
          f.id === folderId ? { ...f, isHidden: willBeHidden } : f
        ),
        // When a folder is hidden, all files inside it are also hidden
        files: prev.files.map((file) =>
          file.folderId === folderId ? { ...file, isHidden: willBeHidden } : file
        ),
      };
    });
  };

  const handleToggleHideFile = (fileId: string) => {
    setState((prev) => ({
      ...prev,
      files: prev.files.map((f) =>
        f.id === fileId ? { ...f, isHidden: !f.isHidden } : f
      ),
    }));
  };

  const handleUpdateVaultPasscode = (newPasscode: string) => {
    setState((prev) => ({
      ...prev,
      hiddenVaultPasscode: newPasscode,
    }));
  };

  // 4.5 CURRICULUM BOOKS & HANDOUTS ACTIONS
  const handleSaveCustomBookUrl = (key: string, url: string) => {
    setState((prev) => ({
      ...prev,
      customCurriculumUrls: {
        ...(prev.customCurriculumUrls || {}),
        [key]: url,
      },
    }));
    triggerTelegramToast('تم حفظ رابط الكتاب بنجاح');
  };

  const handleSaveBookToLibrary = (title: string, gradeName: string, dataUrl: string) => {
    setState((prev) => {
      let targetFolder = prev.folders.find((f) => f.name === gradeName && !f.isHidden);
      const newFolders = [...prev.folders];
      if (!targetFolder) {
        targetFolder = {
          id: 'f_' + Date.now(),
          name: gradeName,
          createdAt: new Date().toISOString().slice(0, 10),
          color: '#4f46e5',
          isHidden: false,
        };
        newFolders.push(targetFolder);
      }
      const newFile: FolderFile = {
        id: 'file_' + Date.now(),
        folderId: targetFolder.id,
        name: `${title}.pdf`,
        type: 'pdf',
        dataUrl,
        createdAt: new Date().toISOString().slice(0, 10),
        isHidden: false,
      };
      return {
        ...prev,
        folders: newFolders,
        files: [newFile, ...prev.files],
      };
    });
    triggerTelegramToast('تم حفظ الكتاب في المكتبة');
  };

  // 5. BACKGROUND ALARM MONITOR: Checks every 3 seconds for due reminders
  useEffect(() => {
    const checkReminders = () => {
      const reminders = state.reminders || [];
      if (reminders.length === 0) return;

      const now = new Date();

      for (const r of reminders) {
        if (r.isCompleted || r.isDismissed) continue;

        const parts = r.date.split('-');
        const timeParts = r.time.split(':');
        if (parts.length < 3 || timeParts.length < 2) continue;

        const rYear = parseInt(parts[0], 10);
        const rMonth = parseInt(parts[1], 10);
        const rDay = parseInt(parts[2], 10);
        const rH = parseInt(timeParts[0], 10);
        const rM = parseInt(timeParts[1], 10);

        if (isNaN(rYear) || isNaN(rMonth) || isNaN(rDay) || isNaN(rH) || isNaN(rM)) continue;

        const targetTime = new Date(rYear, rMonth - 1, rDay, rH, rM, 0, 0);

        // Check if current time has arrived or passed
        if (now.getTime() >= targetTime.getTime()) {
          setActiveAlarmReminder(r);
          SoundService.showSystemNotification(
            `🔔 حان موعد التنبيه: ${r.title}`,
            `الموعد المحدد: ${r.time} ${r.subjectName ? `• مادة: ${r.subjectName}` : ''}`
          );
          break; // Show one active ringing alarm at a time
        }
      }
    };

    const timer = setInterval(checkReminders, 3000);
    checkReminders();

    return () => clearInterval(timer);
  }, [state.reminders]);

  // 6. REMINDER ACTIONS
  const handleAddReminder = (
    reminder: Omit<HomeworkReminder, 'id' | 'createdAt' | 'isCompleted' | 'isDismissed'>
  ) => {
    const newReminder: HomeworkReminder = {
      id: 'rem_' + Date.now(),
      ...reminder,
      isCompleted: false,
      isDismissed: false,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      reminders: [newReminder, ...(prev.reminders || [])],
    }));

    triggerTelegramToast('تم ضبط تنبيه الواجب بنجاح ⏰');
  };

  const handleToggleCompleteReminder = (id: string) => {
    setState((prev) => ({
      ...prev,
      reminders: (prev.reminders || []).map((r) =>
        r.id === id ? { ...r, isCompleted: !r.isCompleted } : r
      ),
    }));
  };

  const handleDeleteReminder = (id: string) => {
    setState((prev) => ({
      ...prev,
      reminders: (prev.reminders || []).filter((r) => r.id !== id),
    }));
    triggerTelegramToast('تم حذف التنبيه بنجاح');
  };

  const handleDismissActiveAlarm = () => {
    if (!activeAlarmReminder) return;
    const remId = activeAlarmReminder.id;
    setActiveAlarmReminder(null);

    setState((prev) => ({
      ...prev,
      reminders: (prev.reminders || []).map((r) =>
        r.id === remId ? { ...r, isDismissed: true } : r
      ),
    }));
  };

  const handleCompleteActiveAlarm = () => {
    if (!activeAlarmReminder) return;
    const remId = activeAlarmReminder.id;
    setActiveAlarmReminder(null);

    setState((prev) => ({
      ...prev,
      reminders: (prev.reminders || []).map((r) =>
        r.id === remId ? { ...r, isCompleted: true, isDismissed: true } : r
      ),
    }));
    triggerTelegramToast('أحسنت! تم إنجاز الواجب بنجاح 🌟');
  };

  const handleSnoozeActiveAlarm = (minutes: number = 5) => {
    if (!activeAlarmReminder) return;
    const remId = activeAlarmReminder.id;
    setActiveAlarmReminder(null);

    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const newH = String(now.getHours()).padStart(2, '0');
    const newM = String(now.getMinutes()).padStart(2, '0');
    const newTimeStr = `${newH}:${newM}`;

    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentDay = String(now.getDate()).padStart(2, '0');
    const newDateStr = `${currentYear}-${currentMonth}-${currentDay}`;

    setState((prev) => ({
      ...prev,
      reminders: (prev.reminders || []).map((r) =>
        r.id === remId
          ? {
              ...r,
              date: newDateStr,
              time: newTimeStr,
              isDismissed: false,
            }
          : r
      ),
    }));
    triggerTelegramToast(`تم تأجيل التنبيه ${minutes} دقائق ⏳`);
  };

  const handleTriggerTestAlarm = (reminder: HomeworkReminder) => {
    setActiveAlarmReminder(reminder);
  };

  // 7. VOICE-TO-TEXT NOTES ACTIONS
  const handleAddVoiceNote = (text: string, subjectName?: string) => {
    const newVoiceNote = {
      id: 'vn_' + Date.now(),
      text,
      subjectName: subjectName || undefined,
      createdAt: new Date().toLocaleString('ar-SA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setState((prev) => ({
      ...prev,
      voiceNotes: [newVoiceNote, ...(prev.voiceNotes || [])],
    }));

    triggerTelegramToast('تم حفظ الملاحظة الصوتية');
  };

  const handleDeleteVoiceNote = (id: string) => {
    setState((prev) => ({
      ...prev,
      voiceNotes: (prev.voiceNotes || []).filter((n) => n.id !== id),
    }));
    triggerTelegramToast('تم حذف الملاحظة');
  };

  // If not registered yet, display registration view first
  if (!state.isRegistered) {
    return (
      <RegistrationView
        onRegister={handleRegister}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col font-sans ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-100 text-slate-900 light'
    }`}>
      {/* Animated 5-Second Motivational Welcome Splash Screen */}
      {showWelcomeSplash && (
        <WelcomeSplash
          userName={state.userName}
          userClass={state.userClass}
          onFinish={() => setShowWelcomeSplash(false)}
        />
      )}

      {/* Floating Telegram Toast Notification */}
      <TelegramToast
        show={showTelegramToast}
        message={telegramToastMsg}
      />

      {/* Active Alarm Ringing Modal */}
      <AlarmRingingModal
        reminder={activeAlarmReminder}
        onDismiss={handleDismissActiveAlarm}
        onComplete={handleCompleteActiveAlarm}
        onSnooze={handleSnoozeActiveAlarm}
      />

      {/* Sticky Header */}
      <Header
        theme={theme}
        userName={state.userName}
        userClass={state.userClass}
        onToggleTheme={handleToggleTheme}
        onOpenPWAInstall={() => setIsPWAInstallOpen(true)}
      />

      {/* Main Content Area - Strictly Phone Width Centered */}
      <main className="flex-1 w-full max-w-md mx-auto overflow-x-hidden">
        {/* TAB 1: الرئيسية */}
        {currentTab === 'home' && (
          <HomeView
            state={state}
            onUpdateUserName={handleUpdateUserName}
            onUpdateProfile={handleUpdateProfile}
            onResetAllData={handleResetAllData}
            onAddTodaySubject={handleAddTodaySubject}
            onDeleteScheduleItem={handleDeleteScheduleItem}
            onAddReminder={handleAddReminder}
            onToggleCompleteReminder={handleToggleCompleteReminder}
            onDeleteReminder={handleDeleteReminder}
            onTriggerTestAlarm={handleTriggerTestAlarm}
            onAddVoiceNote={handleAddVoiceNote}
            onDeleteVoiceNote={handleDeleteVoiceNote}
          />
        )}

        {/* TAB 2: التقويم والجدول */}
        {currentTab === 'calendar_schedule' && (
          <CalendarScheduleView
            state={state}
            onAddScheduleItem={handleAddScheduleItem}
            onDeleteScheduleItem={handleDeleteScheduleItem}
            onSaveCalendarNote={handleSaveCalendarNote}
            onDeleteCalendarNote={handleDeleteCalendarNote}
          />
        )}

        {/* TAB 3: الدرجات */}
        {currentTab === 'grades' && (
          <GradesView
            subjects={state.subjectsGrades}
            onAddSubject={handleAddSubjectGrade}
            onDeleteSubject={handleDeleteSubjectGrade}
            onAddGradeToSubject={handleAddGradeToSubject}
            onDeleteGradeFromSubject={handleDeleteGradeFromSubject}
          />
        )}

        {/* TAB 4: المكتبة مع الخزنة المخفية */}
        {currentTab === 'library' && (
          <LibraryView
            folders={state.folders}
            files={state.files}
            onAddFolder={handleAddFolder}
            onDeleteFolder={handleDeleteFolder}
            onAddFileToFolder={handleAddFileToFolder}
            onDeleteFile={handleDeleteFile}
            onToggleHideFolder={handleToggleHideFolder}
            onToggleHideFile={handleToggleHideFile}
            hiddenVaultPasscode={state.hiddenVaultPasscode || '0000'}
            onUpdateVaultPasscode={handleUpdateVaultPasscode}
          />
        )}

        {/* TAB 5: الكتب والملازم الدراسية */}
        {currentTab === 'books' && (
          <BooksView
            userClass={state.userClass}
            onUpdateUserClass={handleUpdateUserClass}
            customUrls={state.customCurriculumUrls}
            onSaveCustomUrl={handleSaveCustomBookUrl}
            onSaveToLibrary={handleSaveBookToLibrary}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation (4 Tabs) */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />

      {/* PWA Install Modal */}
      <PWAInstallModal
        isOpen={isPWAInstallOpen}
        onClose={() => setIsPWAInstallOpen(false)}
      />
    </div>
  );
}
