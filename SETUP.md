# Инструкция по запуску LinguaApp

## 1. Установка зависимостей

Открой PowerShell (с английской раскладкой) и выполни:

```powershell
cd "D:\OneDrive\Desktop\LinguaApp"
npm install
```

Если видишь ошибку "npm не распознано", установи Node.js с https://nodejs.org/

## 2. Настройка Firebase

### В Firebase Console (https://console.firebase.google.com/):

1. **Authentication:**
   - Открой проект `poliglot-project`
   - Перейди в **Build → Authentication → Sign-in method**
   - Включи **Email/Password** (Enabled)

2. **Firestore Database:**
   - Перейди в **Build → Firestore Database**
   - Нажми **Create database**
   - Выбери режим **Production mode** (или Test mode для разработки)
   - Выбери регион (например, `us-central`)
   - После создания перейди в **Rules** и установи:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
  }
}
```

## 3. Запуск приложения

```powershell
npm run dev
```

Открой в браузере адрес, который покажет Vite (обычно `http://localhost:5173/`)

## 4. Проверка работы

1. Зарегистрируй нового пользователя (логин и пароль минимум 6 символов)
2. Войди в систему
3. Попробуй разделы: Study, Review, Test, Dictionary

## Возможные проблемы

- **Ошибка при регистрации/логине:** Проверь, что в Firebase включен Email/Password
- **Ошибка "Permission denied":** Проверь правила Firestore (шаг 2)
- **Белый экран в браузере:** Открой консоль браузера (F12) и посмотри ошибки
