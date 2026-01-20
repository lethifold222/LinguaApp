
export class SpeechService {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesReady: boolean = false;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();
    
    // Голоса могут загружаться асинхронно, поэтому слушаем событие
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadVoices(): void {
    this.voices = this.synth.getVoices();
    this.voicesReady = this.voices.length > 0;
  }

  private getEnglishVoice(): SpeechSynthesisVoice | null {
    if (!this.voicesReady) {
      this.loadVoices();
    }

    // Приоритет: Google voices > качественные английские голоса > любой английский голос
    const googleVoice = this.voices.find(
      v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('google'))
    );
    
    if (googleVoice) return googleVoice;

    // Ищем качественные английские голоса
    const qualityVoices = this.voices.filter(
      v => v.lang.startsWith('en') && (v.name.includes('Enhanced') || v.name.includes('Premium'))
    );
    
    if (qualityVoices.length > 0) return qualityVoices[0];

    // Любой английский голос
    const anyEnglishVoice = this.voices.find(v => v.lang.startsWith('en'));
    
    return anyEnglishVoice || null;
  }

  speak(text: string): void {
    if (!text || text.trim().length === 0) {
      return;
    }

    // Отменяем любое текущее воспроизведение
    this.synth.cancel();

    try {
      const utterance = new SpeechSynthesisUtterance(text.trim());
      
      // Настройки для лучшего качества произношения
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Немного медленнее для лучшего понимания
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Выбираем лучший доступный английский голос
      const voice = this.getEnglishVoice();
      if (voice) {
        utterance.voice = voice;
      }

      // Обработка ошибок
      utterance.onerror = () => {
        // Silent error handling for production
      };

      // Воспроизводим
      this.synth.speak(utterance);
    } catch (error) {
      // Silent error handling for production
    }
  }

  stop(): void {
    this.synth.cancel();
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }
}

export const speechService = new SpeechService();
