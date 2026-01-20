
export enum Language {
  ENGLISH = 'EN',
  RUSSIAN = 'RU',
  ARMENIAN = 'AM'
}

export enum UserMode {
  KID = 'KID',
  ADULT = 'ADULT'
}

export enum ProficiencyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  ADVANCED = 'advanced'
}

export interface Word {
  id: string;
  english: string;
  transcription: string;
  russian: string;
  armenian: string;
  category: 'basic' | 'advanced';
  level: ProficiencyLevel;
  imageData?: string; // Поле для хранения base64 строки изображения
}

export interface ModeProgress {
  seenWordIds: string[];
  learnedWordIds: string[];
}

export interface UserProgress {
  kid: ModeProgress;
  adult: ModeProgress;
}

export interface User {
  username: string;
  passwordHash: string;
  mode: UserMode;
  level: ProficiencyLevel;
  progress: UserProgress;
}

export type AppSection = 'DASHBOARD' | 'LEARN' | 'REVIEW' | 'TEST' | 'DICTIONARY';
