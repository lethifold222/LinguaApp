
import { Word, ProficiencyLevel } from './types';
import kidsJson from './kids_dictionary_export-2.json';
import adultsJson from './polyglot_autosave_1503_words-5.json';

type RawWord = {
  id: string;
  english: string;
  transcription: string;
  russian: string;
  armenian: string;
  difficulty?: string;
  createdAt?: number;
  imageBase64?: string;
};

const mapDifficultyToLevel = (difficulty?: string): ProficiencyLevel => {
  switch ((difficulty || '').toLowerCase()) {
    case 'easy':
      return ProficiencyLevel.EASY;
    case 'medium':
      return ProficiencyLevel.MEDIUM;
    case 'advanced':
    case 'hard':
    case 'difficult':
      return ProficiencyLevel.ADVANCED;
    default:
      return ProficiencyLevel.EASY;
  }
};

const mapDifficultyToCategory = (difficulty?: string): Word['category'] => {
  const d = (difficulty || '').toLowerCase();
  return d === 'advanced' || d === 'hard' || d === 'difficult' ? 'advanced' : 'basic';
};

const mapRawToWord = (raw: RawWord, levelFromDifficulty: boolean): Word => ({
  id: raw.id,
  english: raw.english,
  transcription: raw.transcription,
  russian: raw.russian,
  armenian: raw.armenian,
  category: mapDifficultyToCategory(raw.difficulty),
  level: levelFromDifficulty ? mapDifficultyToLevel(raw.difficulty) : ProficiencyLevel.EASY,
  imageData: raw.imageBase64,
});

export const KID_WORDS_DATA: Word[] = (kidsJson as RawWord[]).map(raw =>
  mapRawToWord(raw, false)
);

export const ADULT_WORDS_DATA: Word[] = (adultsJson as RawWord[]).map(raw =>
  mapRawToWord(raw, true)
);

export const ALL_WORDS = [...KID_WORDS_DATA, ...ADULT_WORDS_DATA];
