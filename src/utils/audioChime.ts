// Polite synthesized beep for barcode scan feedback using Web Audio API
export function playScanBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Quick pleasant double-chime
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.08); // E6
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Vibration API if supported on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(60);
    }
  } catch (e) {
    // Audio contexts may be restricted if user hasn't interacted yet
    console.debug('Audio beep skipped:', e);
  }
}
