import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  label?: string;
  compact?: boolean;
  className?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  label = 'تحدث للكتابة',
  compact = false,
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const shouldKeepListeningRef = useRef(false);
  const lastEmittedRef = useRef('');

  useEffect(() => {
    return () => {
      shouldKeepListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const stopListening = () => {
    shouldKeepListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  };

  const startPass = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      shouldKeepListeningRef.current = false;
      setIsListening(false);
      setErrorMsg('متصفحك الحالي لا يدعم الإملاء الصوتي المباشر (جرّب Chrome أو Safari)');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        if (!event.results || event.results.length === 0) return;
        const latest = event.results[event.results.length - 1];
        if (latest && latest.isFinal) {
          const text = (latest[0]?.transcript || '').trim();
          if (text && text !== lastEmittedRef.current) {
            lastEmittedRef.current = text;
            onTranscript(text);
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          return;
        }
        shouldKeepListeningRef.current = false;
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMsg('يرجى السماح بصلاحية الميكروفون للكتابة بالصوت');
          setTimeout(() => setErrorMsg(null), 4000);
        }
      };

      recognition.onend = () => {
        lastEmittedRef.current = '';
        if (shouldKeepListeningRef.current) {
          setTimeout(() => {
            if (shouldKeepListeningRef.current) {
              startPass();
            }
          }, 120);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      shouldKeepListeningRef.current = false;
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    setErrorMsg(null);

    if (isListening || shouldKeepListeningRef.current) {
      stopListening();
      return;
    }

    shouldKeepListeningRef.current = true;
    lastEmittedRef.current = '';
    startPass();
  };

  return (
    <div className={`inline-flex flex-col items-end ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        title={isListening ? 'إيقاف الاستماع' : 'اضغط وتحدث ليكتب المشروع تلقائياً'}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition active:scale-95 cursor-pointer select-none ${
          compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs'
        } ${
          isListening
            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse'
            : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25'
        }`}
      >
        {isListening ? (
          <>
            <MicOff className="w-3.5 h-3.5" />
            <span>إيقاف التسجيل</span>
            <Loader2 className="w-3 h-3 animate-spin" />
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5" />
            <span>{label}</span>
          </>
        )}
      </button>

      {errorMsg && (
        <span className="text-[10px] font-bold text-rose-500 mt-1">
          {errorMsg}
        </span>
      )}
    </div>
  );
};
