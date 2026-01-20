
import { User, UserMode, ProficiencyLevel } from './types';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

// Если пользователь ввёл уже готовый email (есть '@') — используем его как есть.
// Если нет — добавляем технический домен, чтобы получить валидный email для Firebase.
const usernameToEmail = (username: string) =>
  username.includes('@') ? username : `${username}@lingua.local`;

// Миграция старой структуры прогресса в новую
const migrateProgress = (oldData: any): User['progress'] => {
  // Если уже новая структура - возвращаем как есть
  if (oldData?.kid && oldData?.adult) {
    return oldData;
  }
  
  // Если старая структура (seenWordIds и learnedWordIds на верхнем уровне)
  if (oldData?.seenWordIds || oldData?.learnedWordIds) {
    const seenIds = oldData.seenWordIds || [];
    const learnedIds = oldData.learnedWordIds || [];
    return {
      kid: {
        seenWordIds: [],
        learnedWordIds: [],
      },
      adult: {
        seenWordIds: seenIds,
        learnedWordIds: learnedIds,
      },
    };
  }
  
  // Если нет прогресса - возвращаем пустой
  return {
    kid: {
      seenWordIds: [],
      learnedWordIds: [],
    },
    adult: {
      seenWordIds: [],
      learnedWordIds: [],
    },
  };
};

const buildDefaultUser = (username: string): User => ({
  username,
  passwordHash: '',
  mode: UserMode.ADULT,
  level: ProficiencyLevel.EASY,
  progress: {
    kid: {
      seenWordIds: [],
      learnedWordIds: [],
    },
    adult: {
      seenWordIds: [],
      learnedWordIds: [],
    },
  },
});

export const authService = {
  register: async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const email = usernameToEmail(username);
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      const userDoc: User = buildDefaultUser(username);
      
      // Пытаемся создать документ в Firestore, но не критично если не получится
      try {
        await setDoc(doc(db, 'users', uid), userDoc);
      } catch (firestoreError: any) {
        // Если Firestore недоступен, но Auth успешен - всё равно считаем регистрацию успешной
        // Документ создастся позже при первом входе
        console.error('Firestore error during registration (non-critical):', firestoreError);
      }

      return { success: true };
    } catch (e: any) {
      console.error('Registration error:', e);
      const code = e?.code;
      if (code === 'auth/email-already-in-use') {
        return { success: false, error: 'User already exists' };
      }
      if (code === 'auth/weak-password') {
        return { success: false, error: 'Password is too weak' };
      }
      if (code === 'auth/invalid-email') {
        return { success: false, error: 'Invalid email' };
      }
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  },

  login: async (username: string, password: string): Promise<{ user: User | null; error?: string }> => {
    try {
      const email = usernameToEmail(username);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      const ref = doc(db, 'users', uid);
      
      let snap;
      try {
        snap = await getDoc(ref);
      } catch (fetchError: any) {
        console.error('Error fetching document:', fetchError);
        const code = fetchError?.code;
        if (code === 'unavailable' || code === 'failed-precondition') {
          return { user: null, error: 'Database unavailable. Please check your internet connection and try again.' };
        }
        throw fetchError;
      }

      if (!snap.exists()) {
        // Если пользователь есть в Auth, но нет документа в Firestore - создаём
        const userDoc = buildDefaultUser(username);
        try {
          await setDoc(ref, userDoc);
          return { user: userDoc };
        } catch (createError: any) {
          console.error('Error creating user document:', createError);
          // Если не можем создать документ, всё равно возвращаем пользователя
          return { user: userDoc };
        }
      }

      const data = snap.data() as any;
      
      // Миграция старой структуры прогресса
      const migratedProgress = migrateProgress(data.progress);
      
      // Убеждаемся, что все обязательные поля присутствуют
      const migratedUser: User = {
        username: data.username || username,
        passwordHash: data.passwordHash || '',
        mode: data.mode || UserMode.ADULT,
        level: data.level || ProficiencyLevel.EASY,
        progress: migratedProgress,
      };
      
      // Если была миграция - сохраняем обновлённые данные
      if (migratedProgress !== data.progress) {
        await updateDoc(ref, { progress: migratedProgress });
      }
      
      // Если отсутствуют обязательные поля - обновляем документ
      if (!data.username || !data.mode || !data.level) {
        await updateDoc(ref, {
          username: migratedUser.username,
          mode: migratedUser.mode,
          level: migratedUser.level,
        });
      }
      
      return { user: migratedUser };
    } catch (e: any) {
      console.error('Login error:', e);
      const code = e?.code;
      const message = e?.message || '';
      console.error('Error code:', code, 'Error message:', message);
      
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        return { user: null, error: 'Invalid credentials' };
      }
      if (code === 'auth/invalid-email') {
        return { user: null, error: 'Invalid email' };
      }
      if (code === 'auth/too-many-requests') {
        return { user: null, error: 'Too many login attempts. Please try again later.' };
      }
      // Ошибка Firestore: клиент офлайн / нет сети
      if (code === 'unavailable' || code === 'auth/network-request-failed') {
        return { user: null, error: 'Network error: cannot reach database. Please check your internet connection or firewall/VPN.' };
      }
      return { user: null, error: `Login failed: ${message || 'Please try again.'}` };
    }
  },

  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Logout error:', e);
    }
  },

  updateProgress: async (_username: string, progress: User['progress']) => {
    try {
      const current = auth.currentUser;
      if (!current) return;
      const ref = doc(db, 'users', current.uid);
      await updateDoc(ref, { progress });
    } catch (e) {
      console.error('Update progress error:', e);
    }
  },

  updateUserMode: async (_username: string, mode: UserMode) => {
    try {
      const current = auth.currentUser;
      if (!current) return;
      const ref = doc(db, 'users', current.uid);
      await updateDoc(ref, { mode });
    } catch (e) {
      console.error('Update mode error:', e);
    }
  },

  updateUserLevel: async (_username: string, level: ProficiencyLevel) => {
    try {
      const current = auth.currentUser;
      if (!current) return;
      const ref = doc(db, 'users', current.uid);
      await updateDoc(ref, { level });
    } catch (e) {
      console.error('Update level error:', e);
    }
  },

  // Получить текущего пользователя из сохранённой сессии
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const current = auth.currentUser;
      if (!current) return null;

      const ref = doc(db, 'users', current.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        // Если пользователь есть в Auth, но нет документа - создаём
        const userDoc = buildDefaultUser(current.email?.split('@')[0] || 'user');
        try {
          await setDoc(ref, userDoc);
          return userDoc;
        } catch (createError: any) {
          console.error('Error creating user document:', createError);
          return userDoc;
        }
      }

      const data = snap.data() as any;
      const migratedProgress = migrateProgress(data.progress);

      const migratedUser: User = {
        username: data.username || current.email?.split('@')[0] || 'user',
        passwordHash: data.passwordHash || '',
        mode: data.mode || UserMode.ADULT,
        level: data.level || ProficiencyLevel.EASY,
        progress: migratedProgress,
      };

      if (migratedProgress !== data.progress) {
        await updateDoc(ref, { progress: migratedProgress });
      }

      if (!data.username || !data.mode || !data.level) {
        await updateDoc(ref, {
          username: migratedUser.username,
          mode: migratedUser.mode,
          level: migratedUser.level,
        });
      }

      return migratedUser;
    } catch (e: any) {
      console.error('Get current user error:', e);
      return null;
    }
  },

  // Подписка на изменения состояния аутентификации
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await authService.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  },
};
