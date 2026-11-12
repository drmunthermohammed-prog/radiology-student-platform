/**
 * Sound & Web Notification Service for Homework & Class Reminders
 * Uses Web Audio API for reliable cross-browser alert chimes & vibration
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (err) {
    console.warn('AudioContext not available:', err);
    return null;
  }
}

export const SoundService = {
  /**
   * Play a pleasant classic academic chime / alarm sequence
   */
  playAlertSound(repeatCount = 2) {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Notes: E5 (659.25), G#5 (830.61), B5 (987.77), E6 (1318.51)
      const notes = [659.25, 830.61, 987.77, 1318.51];

      for (let r = 0; r < repeatCount; r++) {
        const offset = r * 0.45;
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + offset + idx * 0.09);

          // Gentle envelope
          gain.gain.setValueAtTime(0.001, now + offset + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.25, now + offset + idx * 0.09 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + idx * 0.09 + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + offset + idx * 0.09);
          osc.stop(now + offset + idx * 0.09 + 0.36);
        });
      }
    } catch (e) {
      console.warn('Failed to play alert sound:', e);
    }
  },

  /**
   * Short test chime for settings or preview
   */
  playTestChime() {
    this.playAlertSound(1);
    this.vibrate([100, 50, 100]);
  },

  /**
   * Vibrate device if supported
   */
  vibrate(pattern: number[] = [300, 150, 300, 150, 400]) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore on unsupported devices
      }
    }
  },

  /**
   * Request system notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const res = await Notification.requestPermission();
        return res === 'granted';
      }
    } catch {
      return false;
    }
    return false;
  },

  /**
   * Show OS / Browser level notification
   */
  showSystemNotification(title: string, body: string) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
      } catch {
        // Fallback for mobile browser where Notification constructor might fail
      }
    }
  }
};
