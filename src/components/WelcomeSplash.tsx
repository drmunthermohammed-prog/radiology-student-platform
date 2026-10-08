import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Sparkles, BookOpen, Award, ArrowLeft, Flame, Star } from 'lucide-react';

interface WelcomeSplashProps {
  userName: string;
  userClass?: string;
  onFinish: () => void;
}

interface MotivationalQuote {
  text: string;
  tag: string;
}

const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    text: 'تقني الأشعة هو عين الطب الثاقبة التي تكشف المستور وتصنع الفارق في إنقاذ حياة المرضى.',
    tag: 'عين الطب الثاقبة',
  },
  {
    text: 'كل مقطع تشريحي تفهمه في المفراس والرنين هو خطوة راسخة نحو احتراف التشخيص الدقيق.',
    tag: 'احتراف التصوير الطبي',
  },
  {
    text: 'الفيزياء الإشعاعية والتشريح الشعاعي هما سر قوتك العلمية وتميزك في المستشفيات والمراكز.',
    tag: 'التميز الأكاديمي',
  },
  {
    text: 'أنت لست مجرد طالب؛ أنت متخصص الغد في أدق وأرقى تقنيات التصوير الطبي الحديثة.',
    tag: 'فخر التخصص',
  },
  {
    text: 'دقتك في تطبيق مبادئ السلامة والوقاية ALARA تحمي المرضى وتصنع معايير الرعاية الفضلى.',
    tag: 'أمان المريض',
  },
  {
    text: 'ساعات الدراسة والتدريب السريري اليوم هي رأس مالك الحقيقي يوم تفتح المستشفيات أبوابها لك.',
    tag: 'ثمار الاجتهاد',
  },
  {
    text: 'التصوير بالرنين المغناطيسي والمفراس فن وعلم يلتقيان؛ واصل شغفك واصعد نحو القمة.',
    tag: 'شغف التقنية',
  },
  {
    text: 'كل كويز وامتحان تجتازه اليوم يبني ثقتك العالية أمام أحدث أجهزة التصوير العالمية.',
    tag: 'ثقة وإتقان',
  },
];

export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({
  userName,
  userClass,
  onFinish,
}) => {
  const DURATION_SECONDS = 5;
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SECONDS);
  const [isVisible, setIsVisible] = useState(true);

  // Pick a random motivational quote on mount
  const [quote] = useState<MotivationalQuote>(() => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[randomIndex];
  });

  // Time-based greeting in Arabic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      return 'صباح الهمة والتفوق';
    }
    if (hour >= 12 && hour < 17) {
      return 'طاب يومك بالعلم والإنجاز';
    }
    return 'مساء الطموح والمثابرة';
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const timer = setTimeout(() => {
      handleClose();
    }, DURATION_SECONDS * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onFinish();
    }, 280);
  };

  const displayName = userName?.trim() || 'بطلنا المجتهد';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/75 dark:bg-slate-950/90 backdrop-blur-xl select-none"
          dir="rtl"
        >
          {/* Animated Ambient Background Glows */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.25, 0.4, 0.25],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-indigo-500/30 blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.35, 0.2],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-sky-500/25 blur-3xl"
            />
          </div>

          {/* Main Welcome Card */}
          <motion.div
            initial={{ y: 28, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -16, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="relative w-full max-w-sm rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-white overflow-hidden"
          >
            {/* Top Progress Countdown Bar (5 Seconds) */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: DURATION_SECONDS, ease: 'linear' }}
                className="h-full bg-gradient-to-l from-indigo-600 via-sky-500 to-amber-500"
              />
            </div>

            {/* Top Bar: Countdown Indicator + Skip Button */}
            <div className="flex items-center justify-between gap-2 pt-1 mb-5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
                <span>رسالة اليوم التحفيزية</span>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <span>تخطي ({secondsLeft}ث)</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Animated Hero Avatar / Emblem */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="relative mb-3.5">
                <motion.div
                  animate={{ rotate: [0, 6, -6, 0], y: [0, -4, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 border-2 border-white/80 dark:border-slate-800"
                >
                  <GraduationCap className="w-10 h-10" />
                </motion.div>

                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900"
                >
                  <Star className="w-3.5 h-3.5 fill-white" />
                </motion.div>
              </div>

              {/* Greeting & Student Name */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400"
              >
                {getGreeting()}
              </motion.p>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight"
              >
                أهلاً بك يا {displayName} 👋
              </motion.h2>

              {userClass && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mt-1"
                >
                  {userClass} · قسم تقنيات الأشعة والتصوير الطبي
                </motion.p>
              )}
            </div>

            {/* Motivational Quote Box */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="relative rounded-2xl bg-gradient-to-br from-indigo-50/90 via-slate-50 to-sky-50/80 dark:from-slate-800/90 dark:via-slate-800/60 dark:to-indigo-950/50 border border-indigo-200/70 dark:border-indigo-800/50 p-4 text-center shadow-inner"
            >
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{quote.tag}</span>
              </div>

              <p className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                « {quote.text} »
              </p>

              <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-2.5">
                ثق بنفسك يا {displayName}، القمة بانتظارك! 🌟
              </p>
            </motion.div>

            {/* Bottom Enter / Skip CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>يفتح تلقائياً خلال {secondsLeft} ثوانٍ</span>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/25 transition active:scale-95 cursor-pointer"
              >
                <span>ابدأ الدراسة الآن</span>
                <Award className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
