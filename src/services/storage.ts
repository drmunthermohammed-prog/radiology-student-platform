import { AppState } from '../types';

const STORAGE_KEY = 'rad_student_app_v3';
const IDB_NAME = 'RadStudentDB';
const IDB_VERSION = 2;
const IDB_STORE = 'app_data';

// All starter academic data is completely empty as requested by the user
export const INITIAL_STATE: AppState = {
  userName: '',
  userClass: '',
  isRegistered: false,
  hiddenVaultPasscode: '0000',
  schedule: [],
  calendarNotes: [],
  subjectsGrades: [],
  folders: [],
  files: [],
  reminders: [],
  voiceNotes: [],
};

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export const Storage = {
  load(): AppState {
    if (typeof window === 'undefined') return INITIAL_STATE;
    try {
      // Purge all legacy school version storage keys to prevent obsolete dummy data from loading
      const LEGACY_KEYS = [
        'talib_clean_app_v5',
        'talib_clean_app_v4',
        'talib_clean_app_v3',
        'talib_clean_app_v2',
        'talib_clean_app_v1',
        'talib_clean_app',
        'talib_app_v5',
      ];
      for (const key of LEGACY_KEYS) {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
      }

      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);

        // Sanitize and filter out any legacy school items (رياضيات, إسلامية, etc.)
        const cleanSchedule = Array.isArray(parsed.schedule)
          ? parsed.schedule.filter(
              (s: any) =>
                s &&
                s.subjectName &&
                !s.subjectName.includes('إسلامية') &&
                !s.subjectName.includes('رياضيات')
            )
          : [];

        const cleanReminders = Array.isArray(parsed.reminders)
          ? parsed.reminders.filter(
              (r: any) =>
                r &&
                r.title &&
                !r.title.includes('رياضيات') &&
                !r.title.includes('حل واجب') &&
                !r.title.includes('تسليم واجب')
            )
          : [];

        const cleanGrades = Array.isArray(parsed.subjectsGrades)
          ? parsed.subjectsGrades.filter(
              (g: any) =>
                g &&
                g.name &&
                !g.name.includes('رياضيات') &&
                !g.name.includes('إسلامية')
            )
          : [];

        const cleanFolders = Array.isArray(parsed.folders)
          ? parsed.folders.filter(
              (f: any) =>
                f &&
                f.name &&
                !f.name.includes('رياضيات') &&
                !f.name.includes('الفيزياء') &&
                !f.name.includes('الحاسوب')
            )
          : [];

        const cleanFiles = Array.isArray(parsed.files)
          ? parsed.files.filter(
              (f: any) =>
                f &&
                f.name &&
                !f.name.includes('رياضيات')
            )
          : [];

        return {
          ...INITIAL_STATE,
          ...parsed,
          schedule: cleanSchedule,
          reminders: cleanReminders,
          subjectsGrades: cleanGrades,
          folders: cleanFolders,
          files: cleanFiles,
          calendarNotes: Array.isArray(parsed.calendarNotes) ? parsed.calendarNotes : [],
          voiceNotes: Array.isArray(parsed.voiceNotes) ? parsed.voiceNotes : [],
          // Only true if both userName and userClass exist
          isRegistered: Boolean(parsed.isRegistered && parsed.userName && parsed.userClass),
        };
      }
    } catch (e) {
      console.error('Failed reading localStorage', e);
    }
    return INITIAL_STATE;
  },

  clearAllData(): AppState {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    return INITIAL_STATE;
  },

  async save(state: AppState): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }

    try {
      const db = await openDB();
      if (db) {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put({ key: 'main_state', value: state });
      }
    } catch (e) {
      console.warn('IndexedDB save failed', e);
    }
  }
};
