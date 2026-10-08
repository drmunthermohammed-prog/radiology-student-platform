import React from 'react';
import { Home, Calendar, Award, Folder, BookOpen } from 'lucide-react';

export type MainTab = 'home' | 'calendar_schedule' | 'grades' | 'library' | 'books';

interface NavbarProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'home' as MainTab, label: 'الرئيسية', icon: Home },
    { id: 'calendar_schedule' as MainTab, label: 'التقويم والجدول', icon: Calendar },
    { id: 'grades' as MainTab, label: 'الدرجات', icon: Award },
    { id: 'library' as MainTab, label: 'المكتبة', icon: Folder },
    { id: 'books' as MainTab, label: 'المحاضرات', icon: BookOpen },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe pointer-events-none select-none">
      <div className="max-w-md mx-auto px-4 pb-2">
        <div className="pointer-events-auto rounded-[28px] border p-1.5 shadow-2xl backdrop-blur-2xl transition-all duration-300 border-slate-300/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 flex items-center justify-around shadow-slate-900/10 dark:shadow-black/60">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex-1 relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-300 active:scale-95 group ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold'
                }`}
              >
                {/* Active Indicator Background Pill */}
                {isActive && (
                  <span className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-indigo-600 shadow-md shadow-cyan-600/30 transition-all duration-300" />
                )}

                <div className="relative z-10 flex flex-col items-center">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-300 ${
                      isActive ? 'scale-110 drop-shadow-sm' : 'group-hover:scale-105'
                    }`}
                  />
                  <span className="text-[11px] mt-1 tracking-tight">
                    {tab.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
