
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Language, UserMode, AppSection, Word, ProficiencyLevel } from './types';
import { UI_STRINGS } from './constants';
import { authService } from './authService';
import { KID_WORDS_DATA, ADULT_WORDS_DATA, ALL_WORDS } from './wordData';
import { speechService } from './speechService';
import { getWordImage } from './imageLibrary';

// Removed useAntiDevTools for production

const AuthScreen: React.FC<{ onAuth: (user: User) => void }> = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [lang, setLang] = useState<Language>(Language.RUSSIAN);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const t = UI_STRINGS[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (username.length < 6 || password.length < 6) {
      setError(t.authError);
      return;
    }
    if (isLogin) {
      const result = await authService.login(username, password);
      if (result.user) {
        onAuth(result.user);
      } else {
        const errorMsg = result.error || 'Invalid credentials';
        // Используем локализованное сообщение для ошибки входа
        if (errorMsg.includes('Invalid credentials') || errorMsg.includes('invalid-credential')) {
          setError(t.invalidCredentials);
        } else {
          setError(errorMsg);
        }
      }
    } else {
      const result = await authService.register(username, password);
      if (result.success) {
        setSuccess(t.registrationSuccess);
        setIsLogin(true);
        setError('');
        // Небольшая задержка для синхронизации Firebase
        await new Promise(resolve => setTimeout(resolve, 500));
        // Автоматически пытаемся войти после успешной регистрации
        const loginResult = await authService.login(username, password);
        if (loginResult.user) {
          onAuth(loginResult.user);
        } else {
          const errorMsg = loginResult.error || 'Registration successful, but login failed. Please try logging in manually.';
          if (errorMsg.includes('Invalid credentials') || errorMsg.includes('invalid-credential')) {
            setError(t.invalidCredentials);
          } else {
            setError(errorMsg);
          }
          setSuccess('');
        }
      } else {
        setError(result.error || 'User already exists');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-600 p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg mb-4 text-white text-3xl font-black">L</div>
          <h1 className="text-3xl font-black text-indigo-900">Linguist Pro</h1>
        </div>
        <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
          <button type="button" onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }} className={`flex-1 py-2 rounded-lg transition-all font-bold text-sm ${isLogin ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>{t.login}</button>
          <button type="button" onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }} className={`flex-1 py-2 rounded-lg transition-all font-bold text-sm ${!isLogin ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>{t.register}</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder={t.username} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-bold" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input type="password" placeholder={t.password} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-bold" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && (
            <div className="space-y-1">
              <div className="text-red-500 text-xs font-bold text-center">{error}</div>
              {error.includes('Invalid credentials') && (
                <div className="text-slate-400 text-[10px] text-center">{t.loginHint}</div>
              )}
            </div>
          )}
          {success && <div className="text-emerald-600 text-xs font-bold text-center">{success}</div>}
          <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-lg shadow-lg active:scale-95 transition-all">{isLogin ? t.login : t.register}</button>
        </form>
        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center gap-3">
          {Object.values(Language).map(l => (
            <button key={l} onClick={() => setLang(l)} className={`w-10 h-10 rounded-xl font-black text-xs border-2 transition-all ${lang === l ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-300'}`}>{l}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ user: User; lang: Language; onSectionChange: (s: AppSection) => void; onLogout: () => void; }> = ({ user, lang, onSectionChange, onLogout }) => {
  const t = UI_STRINGS[lang];
  const currentProgress = user.mode === UserMode.KID ? user.progress?.kid : user.progress?.adult;
  const learnedCount = currentProgress?.learnedWordIds?.length || 0;
  const seenCount = currentProgress?.seenWordIds?.length || 0;
  const canTest = learnedCount >= 20;
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{user.username}</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{user.mode} • {user.level}</p>
        </div>
        <button onClick={onLogout} className="text-red-500 font-bold px-4 py-2 hover:bg-red-50 rounded-xl transition-all">{t.logout}</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-indigo-500">
          <p className="text-indigo-600 font-black text-3xl">{learnedCount}</p>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t.learned}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-emerald-500">
          <p className="text-emerald-600 font-black text-3xl">{seenCount}</p>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t.seen}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {[
          { id: 'LEARN' as AppSection, icon: '📚', title: t.study, color: 'bg-orange-50 text-orange-600' },
          { id: 'REVIEW' as AppSection, icon: '🔄', title: t.review, color: 'bg-blue-50 text-blue-600' },
          { id: 'TEST' as AppSection, icon: '📝', title: t.test, color: 'bg-purple-50 text-purple-600', disabled: !canTest },
          { id: 'DICTIONARY' as AppSection, icon: '📓', title: t.dictionary, color: 'bg-emerald-50 text-emerald-600' }
        ].map(item => (
          <button key={item.id} disabled={item.disabled} onClick={() => onSectionChange(item.id)} className={`flex items-center gap-4 bg-white p-5 rounded-3xl shadow-sm border-2 border-transparent hover:border-indigo-100 transition-all text-left ${item.disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'active:scale-95'}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${item.color}`}>{item.icon}</div>
            <div className="flex-1">
              <h3 className="font-black text-lg text-slate-800">{item.title}</h3>
              {item.disabled && <p className="text-slate-400 text-[10px] font-bold">Needs 20 words</p>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const WordCarousel: React.FC<{ words: Word[]; user: User; lang: Language; onFinish: (learnedIds: string[], seenIds: string[]) => void; onBack: () => void; }> = ({ words, user, lang, onFinish, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newLearned, setNewLearned] = useState<string[]>([]);
  const [newSeen, setNewSeen] = useState<string[]>([]);
  const t = UI_STRINGS[lang];
  const word = words[currentIndex];

  const handleNext = () => {
    if (!word) return;
    const learned = [...newLearned, word.id];
    const seen = [...newSeen, word.id];
    setNewLearned(learned);
    setNewSeen(seen);
    if (currentIndex < words.length - 1) setCurrentIndex(prev => prev + 1);
    else onFinish(learned, seen);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevWord = words[currentIndex - 1];
      // Удаляем предыдущее слово из списков, если оно там есть
      setNewLearned(prev => prev.filter(id => id !== prevWord.id));
      setNewSeen(prev => prev.filter(id => id !== prevWord.id));
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!word) return (
    <div className="flex flex-col items-center justify-center h-[80vh] p-8 text-center">
      <div className="text-6xl mb-6">🏜️</div>
      <p className="text-slate-400 text-xl font-bold mb-8">{t.emptyDictionary}</p>
      <button onClick={onBack} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg">{t.back}</button>
    </div>
  );

  const imageUrl = getWordImage(word, user.mode === UserMode.KID);

  return (
    <div className={`flex flex-col items-center p-4 min-h-[80vh] ${user.mode === UserMode.KID ? 'font-kids' : ''}`}>
      <div className="w-full max-w-sm flex items-center mb-6">
        <button onClick={onBack} className="bg-white w-10 h-10 flex items-center justify-center rounded-xl shadow-sm border border-slate-100 text-indigo-600 hover:bg-indigo-50 transition-all">← {t.back}</button>
      </div>
      <div className="bg-white shadow-xl rounded-[2.5rem] p-8 w-full max-w-sm text-center relative overflow-hidden border border-slate-100">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }} />
        </div>
        <div className={`mb-6 p-4 rounded-3xl flex items-center justify-center min-h-[200px] bg-slate-50 overflow-hidden`}>
          <img src={imageUrl} className="h-44 w-44 object-contain rounded-2xl drop-shadow-md" alt={word.english} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-1">{word.english}</h2>
        {user.mode !== UserMode.KID && word.transcription && (
          <p className="text-indigo-400 font-bold mb-6 italic">{word.transcription}</p>
        )}
        <button onClick={() => speechService.speak(word.english)} className="mb-6 w-14 h-14 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg flex items-center justify-center text-2xl mx-auto active:scale-90 transition-all">🔊</button>
        <div className="w-full h-px bg-slate-100 mb-6"></div>
        {lang !== Language.ENGLISH && <p className="text-3xl font-black text-indigo-950 mb-8">{lang === Language.RUSSIAN ? word.russian : word.armenian}</p>}
        <div className="flex gap-3">
          {currentIndex > 0 && (
            <button onClick={handlePrevious} className="flex-1 bg-slate-200 text-slate-700 py-4 rounded-2xl font-black text-xl shadow-lg hover:bg-slate-300 transition-all active:scale-95">
              ← {t.back}
            </button>
          )}
          <button onClick={handleNext} className={`${currentIndex > 0 ? 'flex-1' : 'w-full'} bg-emerald-500 text-white py-4 rounded-2xl font-black text-xl shadow-lg hover:bg-emerald-600 transition-all active:scale-95`}>
            {currentIndex === words.length - 1 ? t.finish : t.next}
          </button>
        </div>
        <p className="mt-4 text-slate-300 font-bold text-[10px] tracking-widest uppercase">{currentIndex + 1} / {words.length}</p>
      </div>
    </div>
  );
};

const TestMode: React.FC<{ words: Word[]; user: User; lang: Language; onFinish: () => void; onBack: () => void; }> = ({ words, user, lang, onFinish, onBack }) => {
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [testFinished, setTestFinished] = useState(false);
  const t = UI_STRINGS[lang];
  const word = words[idx];
  const [opts, setOpts] = useState<string[]>([]);
  const showImages = user.mode === UserMode.KID; // Показывать картинки только в детском режиме
  
  useEffect(() => {
    if (!word) return;
    const correct = lang === Language.RUSSIAN ? word.russian : lang === Language.ARMENIAN ? word.armenian : word.english;
    const dists = words.filter(w => w.id !== word.id).sort(() => 0.5 - Math.random()).slice(0, 3).map(w => lang === Language.RUSSIAN ? w.russian : lang === Language.ARMENIAN ? w.armenian : w.english);
    while (dists.length < 3) dists.push("???");
    setOpts([correct, ...dists].sort(() => 0.5 - Math.random()));
    setResult(null);
    setSelected(null);
  }, [word, lang, words]);
  
  const handleSelect = (opt: string) => {
    if (result !== null) return;
    const correct = lang === Language.RUSSIAN ? word.russian : lang === Language.ARMENIAN ? word.armenian : word.english;
    setSelected(opt);
    const isCorrect = opt === correct;
    setResult(isCorrect);
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
    setTimeout(() => { 
      if (idx < words.length - 1) {
        setIdx(prev => prev + 1);
      } else {
        setTestFinished(true);
      }
    }, 1200);
  };

  // Экран результатов
  if (testFinished) {
    const score = correctAnswers;
    const total = words.length;
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <div className="w-full max-w-sm animate-fadeIn text-center">
          <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100">
            <div className="text-6xl mb-6">{score === total ? '🎉' : score >= total * 0.7 ? '✨' : '📚'}</div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">{t.testComplete}</h2>
            <p className="text-5xl font-black text-indigo-600 mb-2">{score} / {total}</p>
            <p className="text-slate-400 font-bold text-sm mb-8">{t.testScore.replace('{score}', score.toString()).replace('{total}', total.toString())}</p>
            <button onClick={onFinish} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
              {t.back}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!word) return <div className="p-20 text-center font-black">{t.emptyDictionary}</div>;
  const correctVal = lang === Language.RUSSIAN ? word.russian : lang === Language.ARMENIAN ? word.armenian : word.english;
  const imageUrl = getWordImage(word, user.mode === UserMode.KID);
  
  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-sm flex items-center justify-between mb-6">
        <button onClick={onBack} className="bg-white w-10 h-10 flex items-center justify-center rounded-xl shadow-sm border border-slate-100 text-indigo-600 hover:bg-indigo-50 transition-all">← {t.back}</button>
        <p className="text-slate-400 font-bold text-xs">{idx + 1} / {words.length}</p>
      </div>
      <div className="w-full max-w-sm animate-fadeIn text-center">
        <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 mb-8 inline-block w-full">
          {showImages && (
            <div className="mb-4 p-4 rounded-3xl flex items-center justify-center min-h-[180px] bg-slate-50 overflow-hidden">
              <img
                src={imageUrl}
                className="h-40 w-40 object-contain rounded-2xl drop-shadow-md"
                alt={word.english}
              />
            </div>
          )}
          <h2 className="text-5xl font-black text-slate-900">{word.english}</h2>
          {user.mode !== UserMode.KID && word.transcription && (
            <p className="text-indigo-400 font-bold mt-2 italic">{word.transcription}</p>
          )}
          <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest">{t.test}</p>
        </div>
        <div className="space-y-3">
          {opts.map((opt, i) => (
            <button key={i} onClick={() => handleSelect(opt)} disabled={result !== null} className={`w-full p-5 rounded-2xl text-lg font-bold border-2 transition-all shadow-sm ${result === null ? 'bg-white border-slate-100 hover:border-indigo-400' : result !== null && opt === correctVal ? 'bg-emerald-500 text-white border-emerald-500 scale-105' : result === false && opt === selected ? 'bg-red-500 text-white border-red-500' : 'opacity-20 grayscale'}`}>{opt}</button>
          ))}
        </div>
        <div className="h-12 flex items-center justify-center mt-6 text-2xl font-black">
          {result === true && <p className="text-emerald-500">✨ {t.correct}</p>}
          {result === false && <p className="text-red-500">❌ {t.wrong}</p>}
        </div>
      </div>
    </div>
  );
};

const DictionaryItem: React.FC<{ word: Word; user: User; lang: Language; isLearned: boolean }> = ({ word, user, lang, isLearned }) => {
  const img = getWordImage(word, user.mode === UserMode.KID);
  const showTranscription = user.mode !== UserMode.KID;

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-50 flex items-center justify-between group animate-fadeIn relative overflow-hidden">
      {isLearned && <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500 text-white flex items-center justify-center text-[10px] rounded-bl-xl shadow-sm">✓</div>}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center p-2">
          <img src={img} className="w-full h-full object-contain rounded-lg" alt="" />
        </div>
        <div>
          <p className="font-black text-lg text-slate-800">{word.english}</p>
          {showTranscription && word.transcription && (
            <p className="text-slate-400 font-bold text-[10px] italic">{word.transcription}</p>
          )}
          <p className="text-indigo-500 font-bold text-[10px] uppercase">
            {lang === Language.RUSSIAN ? word.russian : lang === Language.ARMENIAN ? word.armenian : word.english}
          </p>
        </div>
      </div>
      <button onClick={() => speechService.speak(word.english)} className="bg-indigo-50 text-indigo-600 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-indigo-600 hover:text-white transition-all">🔊</button>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>(Language.RUSSIAN);
  const [sect, setSect] = useState<AppSection>('DASHBOARD');
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dictionaryTab, setDictionaryTab] = useState<'MY' | 'ALL'>('MY');
  const [isLoading, setIsLoading] = useState(true);

  const onAuth = useCallback((u: User) => { 
    setUser(u); 
    setSect('DASHBOARD');
  }, []);
  const onLogout = useCallback(() => { setUser(null); setShowSettings(false); authService.logout(); }, []);

  // Автоматический вход при загрузке приложения (проверка сохранённой сессии)
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        setSect('DASHBOARD');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const toggleMode = useCallback(async () => {
    if (!user) return;
    const mode = user.mode === UserMode.KID ? UserMode.ADULT : UserMode.KID;
    const upd = { ...user, mode }; 
    setUser(upd); 
    await authService.updateUserMode(user.username, mode);
    // Счётчики обновятся автоматически через currentProgress в Dashboard
  }, [user]);

  const changeLevel = useCallback(async (lvl: ProficiencyLevel) => {
    if (!user) return;
    const upd = { ...user, level: lvl }; 
    setUser(upd); 
    await authService.updateUserLevel(user.username, lvl);
  }, [user]);

  const updateProg = useCallback((lIds: string[], sIds: string[]) => {
    if (!user) return;
    const currentMode = user.mode === UserMode.KID ? 'kid' : 'adult';
    const currentModeProgress = user.progress?.[currentMode] || { seenWordIds: [], learnedWordIds: [] };
    
    const updatedModeProgress = {
      seenWordIds: Array.from(new Set([...currentModeProgress.seenWordIds, ...sIds])),
      learnedWordIds: Array.from(new Set([...currentModeProgress.learnedWordIds, ...lIds]))
    };
    
    const progress = {
      ...user.progress,
      [currentMode]: updatedModeProgress
    };
    
    const upd = { ...user, progress }; 
    setUser(upd); 
    authService.updateProgress(user.username, progress); 
    setSect('DASHBOARD');
  }, [user]);

  // СТРОГИЙ ВЫБОР СЛОВАРЯ НА ОСНОВЕ РЕЖИМА
  const words = useMemo(() => {
    if (!user) return [];
    if (user.mode === UserMode.KID) {
      return KID_WORDS_DATA; // Для детей всегда только 100 слов из детского JSON
    } else {
      // Для взрослых берем из взрослого JSON и фильтруем по выбранному уровню
      return ADULT_WORDS_DATA.filter(w => w.level === user.level);
    }
  }, [user?.mode, user?.level]);

  const filteredDictionaryWords = useMemo(() => {
    // Для "Мой словарь" - все слова, которые пользователь изучал в любом режиме
    const allLearnedIds = new Set([
      ...(user?.progress?.kid?.learnedWordIds || []),
      ...(user?.progress?.adult?.learnedWordIds || [])
    ]);
    
    // Для "Все слова" - показываем все слова из программы
    const baseWords = dictionaryTab === 'MY' 
      ? ALL_WORDS.filter(w => allLearnedIds.has(w.id))
      : ALL_WORDS;
    
    if (!searchQuery) return baseWords;
    
    const query = searchQuery.toLowerCase().trim();
    return baseWords.filter(w => 
      w.english.toLowerCase().includes(query) || 
      w.russian.toLowerCase().includes(query) || 
      w.armenian.toLowerCase().includes(query)
    );
  }, [user?.progress?.kid, user?.progress?.adult, searchQuery, dictionaryTab]);

  // Показываем загрузку пока проверяем сохранённую сессию
  if (isLoading) {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl shadow-lg mb-4 text-white text-3xl font-black animate-pulse">L</div>
          <p className="text-lg font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={onAuth} />;
  const t = UI_STRINGS[lang];

  return (
    <div className={`min-h-screen bg-slate-50 ${user.mode === UserMode.KID ? 'font-kids' : ''}`}>
      <header className="bg-white/80 backdrop-blur-md px-4 py-3 flex justify-between items-center shadow-sm sticky top-0 z-[100] border-b border-slate-100">
        <h1 className="font-black text-xl text-indigo-600 flex items-center gap-2 cursor-pointer" onClick={() => { setSect('DASHBOARD'); setShowSettings(false); }}>
          <span className="bg-indigo-600 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm shadow-md">L</span>
          <span className="hidden sm:inline">Linguist</span>
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {Object.values(Language).map(l => (
              <button key={l} onClick={() => setLang(l)} className={`w-8 h-8 rounded-md text-[10px] font-black transition-all ${lang === l ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}>{l}</button>
            ))}
          </div>
          <button onClick={onLogout} className="text-red-500 font-bold px-3 py-1.5 hover:bg-red-50 rounded-xl transition-all text-xs">{t.logout}</button>
          <button onClick={() => setShowSettings(!showSettings)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${showSettings ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>⚙️</button>
        </div>
      </header>

      {showSettings && (
        <div className="fixed inset-0 z-[110] animate-fadeIn">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="absolute top-16 right-4 w-64 bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 animate-slideIn">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Configurations</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-indigo-600 block mb-2 uppercase tracking-wider">Mode</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={toggleMode} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${user.mode === UserMode.KID ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>👶 Kid</button>
                  <button onClick={toggleMode} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${user.mode === UserMode.ADULT ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>👔 Adult</button>
                </div>
              </div>
              {user.mode === UserMode.ADULT && (
                <div>
                  <label className="text-[10px] font-black text-indigo-600 block mb-2 uppercase tracking-wider">Level</label>
                  <div className="grid grid-cols-1 gap-1">
                    {[ProficiencyLevel.EASY, ProficiencyLevel.MEDIUM, ProficiencyLevel.ADVANCED].map(lvl => (
                      <button key={lvl} onClick={() => changeLevel(lvl)} className={`w-full py-2 px-4 rounded-xl text-[10px] font-black text-left transition-all ${user.level === lvl ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}>{lvl}</button>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={onLogout} className="w-full py-3 mt-4 text-red-500 font-black text-xs border border-red-100 rounded-xl hover:bg-red-50">Logout</button>
            </div>
          </div>
        </div>
      )}

      <main className="py-6 animate-fadeIn">
        {sect === 'DASHBOARD' && <Dashboard user={user} lang={lang} onSectionChange={setSect} onLogout={onLogout} />}
        {sect === 'LEARN' && (() => {
          const currentProgress = user.mode === UserMode.KID ? user.progress?.kid : user.progress?.adult;
          const seenIds = currentProgress?.seenWordIds || [];
          return <WordCarousel words={words.filter(w => !seenIds.includes(w.id)).slice(0, 15)} user={user} lang={lang} onFinish={updateProg} onBack={() => setSect('DASHBOARD')} />;
        })()}
        {sect === 'REVIEW' && (() => {
          const currentProgress = user.mode === UserMode.KID ? user.progress?.kid : user.progress?.adult;
          const learnedIds = currentProgress?.learnedWordIds || [];
          // Берём только выученные слова текущего режима и перемешиваем их
          const reviewWords = words
            .filter(w => learnedIds.includes(w.id))
            .sort(() => 0.5 - Math.random());
          return <WordCarousel words={reviewWords} user={user} lang={lang} onFinish={() => setSect('DASHBOARD')} onBack={() => setSect('DASHBOARD')} />;
        })()}
        {sect === 'TEST' && (() => {
          const currentProgress = user.mode === UserMode.KID ? user.progress?.kid : user.progress?.adult;
          const learnedIds = currentProgress?.learnedWordIds || [];
          // Берем только 10 случайных слов из выученных
          const testWords = words.filter(w => learnedIds.includes(w.id)).sort(() => 0.5 - Math.random()).slice(0, 10);
          return <TestMode words={testWords} user={user} lang={lang} onFinish={() => setSect('DASHBOARD')} onBack={() => setSect('DASHBOARD')} />;
        })()}
        {sect === 'DICTIONARY' && (
          <div className="px-4 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <button onClick={() => { setSect('DASHBOARD'); setSearchQuery(''); }} className="bg-white w-10 h-10 flex items-center justify-center rounded-xl shadow-sm border border-slate-100 text-indigo-600 hover:bg-indigo-50 transition-all">←</button>
                <h2 className="text-2xl font-black text-slate-900">{t.dictionary}</h2>
              </div>
              
              <div className="relative flex-1 max-w-md">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search word..." 
                  className="w-full pl-10 pr-10 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-all text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex p-1 bg-slate-100 rounded-2xl mb-8 w-full max-w-sm mx-auto sm:mx-0">
              <button 
                onClick={() => setDictionaryTab('MY')} 
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${dictionaryTab === 'MY' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
              >
                {t.myDictionary}
              </button>
              <button 
                onClick={() => setDictionaryTab('ALL')} 
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${dictionaryTab === 'ALL' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
              >
                {t.allDictionary}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDictionaryWords.length === 0 ? (
                <div className="col-span-full py-20 text-center">
                  <div className="text-4xl mb-4">📭</div>
                  <p className="text-slate-400 font-bold">
                    {searchQuery ? `No results for "${searchQuery}"` : t.emptyDictionary}
                  </p>
                </div>
              ) : (
                filteredDictionaryWords.map(word => {
                  // Проверяем, изучено ли слово в любом из режимов
                  const allLearnedIds = new Set([
                    ...(user.progress?.kid?.learnedWordIds || []),
                    ...(user.progress?.adult?.learnedWordIds || [])
                  ]);
                  return (
                    <DictionaryItem 
                      key={word.id} 
                      word={word} 
                      user={user} 
                      lang={lang} 
                      isLearned={allLearnedIds.has(word.id)} 
                    />
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-slideIn { animation: slideIn 0.3s cubic-bezier(0.19, 1, 0.22, 1); }
      `}</style>
    </div>
  );
};

export default App;
