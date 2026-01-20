import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Конфигурация твоего Firebase-проекта
const firebaseConfig = {
  apiKey: 'AIzaSyA4vwuJfQDgr-ymbmEUhWu81M7DXkoeAvk',
  authDomain: 'poliglot-project.firebaseapp.com',
  projectId: 'poliglot-project',
  storageBucket: 'poliglot-project.firebasestorage.app',
  messagingSenderId: '428088241141',
  appId: '1:428088241141:web:e4d39ee5fb76e401a4cebc',
  measurementId: 'G-KEJTWFX4C5',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Сохраняем сессию в браузере (localStorage)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

