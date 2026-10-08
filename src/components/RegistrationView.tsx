import React, { useState } from 'react';
import { Activity, Sparkles, User, ArrowLeft, Check, ShieldCheck, Zap, Layers, Bell, AlertCircle } from 'lucide-react';

interface RegistrationViewProps {
  onRegister: (name: string, studentClass: string) => void;
}

const STAGE_PRESETS = [
  { id: 'المرحلة الأولى', label: 'المرحلة الأولى', subtitle: 'أساسيات الإشعاع والتشريح والفسلجة', tag: 'Stage 1' },
  { id: 'المرحلة الثانية', label: 'المرحلة الثانية', subtitle: 'تقنيات الأشعة السينية والوقاية الإشعاعية', tag: 'Stage 2' },
  { id: 'المرحلة الثالثة', label: 'المرحلة الثالثة', subtitle: 'المفراس CT والرنين MRI والسونار', tag: 'Stage 3' },
  { id: 'المرحلة الرابعة', label: 'المرحلة الرابعة', subtitle: 'التصوير المتقدم وبحوث التخرج والمستشفيات', tag: 'Stage 4' },
];

export const RegistrationView: React.FC<RegistrationViewProps> = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [studentStage, setStudentStage] = useState('المرحلة الأولى');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى كتابة اسم الطالب الجامعي');
      return;
    }
    if (!studentStage.trim()) {
      setError('يرجى اختيار المرحلة الجامعية');
      return;
    }

    setError('');
    onRegister(name.trim(), studentStage.trim());
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100 select-none animate-classic transition-colors duration-300 relative overflow-hidden" dir="rtl">
      {/* Radiology Neon Glow Highlights */}
      <div className="absolute top-1/4 -right-24 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 left-1/3 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Mobile container - strictly phone sized */}
      <div className="w-full max-w-sm rounded-[32px] p-6 sm:p-7 bg-slate-900/90 border border-cyan-500/30 backdrop-blur-2xl shadow-2xl shadow-cyan-950/50 relative overflow-hidden z-10">
        
        {/* Subtle top scanline accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-600" />

        <div className="relative z-10 space-y-5">
          {/* Logo & Department Crest */}
          <div className="text-center space-y-2 pt-1">
            <div className="relative mx-auto w-16 h-16 mb-2">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-cyan-500/30 border border-white/20">
                <Activity className="w-8 h-8 text-white drop-shadow animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-950 border border-cyan-400/40 text-cyan-300">
                <Zap className="w-3 h-3 fill-cyan-400" />
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 inline-flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>قسم تقنيات الأشعة والتصوير الطبي</span>
              </span>
              <h1 className="text-xl font-black text-white mt-2 tracking-tight">
                تسجيل بيانات طالب الأشعة
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                المنصة الجامعية الذكية لجدول المحاضرات والتدريب السريري، وحساب السعيات والامتحانات التقويمية.
              </p>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Student Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>اسم الطالب الثلاثي</span>
              </label>
              <input
                type="text"
                placeholder="مثال: علي حسن عبد الرضا"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition shadow-inner placeholder:text-slate-500 font-medium"
                autoFocus
                required
              />
            </div>

            {/* University Stage Selection (المرحلة الجامعية فقط: الأولى، الثانية، الثالثة، الرابعة) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>المرحلة الدراسية</span>
                </span>
                <span className="text-[10px] text-cyan-400/80 font-mono">4 سنوات دراسية</span>
              </label>

              {/* Selection cards for the 4 stages */}
              <div className="grid grid-cols-2 gap-2">
                {STAGE_PRESETS.map((stage) => {
                  const isSelected = studentStage === stage.id;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => {
                        setStudentStage(stage.id);
                        setError('');
                      }}
                      className={`p-3 rounded-2xl text-right transition-all duration-200 border relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-br from-cyan-950/80 to-indigo-950/90 border-cyan-400 text-white shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-400/50'
                          : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-cyan-400/90 font-bold">
                          {stage.tag}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-black tracking-tight">{stage.label}</h4>
                      <p className="text-[9px] text-slate-400 mt-1 line-clamp-1 leading-snug">
                        {stage.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Explicit notification banner for stage selection */}
              <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-cyan-500/15 to-teal-500/10 border border-amber-500/30 text-right flex items-start gap-2.5 shadow-sm">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-3.5 h-3.5 animate-bounce" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-black text-amber-300 block">
                    🔔 تنبيه تخصيص المرحلة:
                  </span>
                  <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed font-medium">
                    عند اختيارك للمرحلة، سوف تظهر لك محاضراتك ومناهجك والكتب والملازم الخاصة بهذه المرحلة فقط.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-400 font-bold text-center bg-rose-500/10 border border-rose-500/20 py-2 rounded-xl">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-cyan-600/30 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
              >
                <span>دخول المنصة الأكاديمية</span>
                <ArrowLeft className="w-4 h-4 -scale-x-100" />
              </button>
            </div>
          </form>

          {/* Department badge / Local Storage Note */}
          <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>بياناتك ومحاضراتك محفوظة محلياً وتعمل بدون إنترنت</span>
          </div>
        </div>
      </div>
    </div>
  );
};
