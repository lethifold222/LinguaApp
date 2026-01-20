
import { Word } from './types';

/**
 * Возвращает изображение для слова.
 * Приоритет: 
 * 1. Встроенный base64 из JSON (imageData)
 * 2. Статическая карта (для тестов)
 * 3. Внешний URL Icons8
 */
export const getWordImage = (word: Word, isKid: boolean): string => {
  // Если в JSON уже есть картинка в base64, используем её
  if (word.imageData) {
    return word.imageData;
  }

  const cleanWord = word.english.toLowerCase().trim();
  
  const staticMap: Record<string, string> = {
    'apple': 'https://img.icons8.com/fluency/200/apple.png',
    'ball': 'https://img.icons8.com/fluency/200/basketball.png',
    'cat': 'https://img.icons8.com/fluency/200/cat.png',
    'dog': 'https://img.icons8.com/fluency/200/dog.png',
    'tree': 'https://img.icons8.com/fluency/200/tree.png'
  };

  if (staticMap[cleanWord]) return staticMap[cleanWord];

  // Резервный вариант, если в JSON почему-то нет картинки
  const style = isKid ? 'fluency' : 'color';
  return `https://img.icons8.com/${style}/200/${cleanWord}.png`;
};
