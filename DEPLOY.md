# Инструкция по загрузке на GitHub

## 1. Инициализация Git репозитория

```bash
git init
git add .
git commit -m "Initial commit: Linguist Pro app"
```

## 2. Создание репозитория на GitHub

1. Перейдите на [GitHub](https://github.com)
2. Нажмите "New repository"
3. Название: `LinguaApp` (или любое другое)
4. Выберите "Public" или "Private"
5. **НЕ** добавляйте README, .gitignore или лицензию (они уже есть)
6. Нажмите "Create repository"

## 3. Подключение к GitHub

```bash
git remote add origin https://github.com/lethifold222/LinguaApp.git
git branch -M main
git push -u origin main
```

**Важно**: Замените `lethifold222` на ваш GitHub username, а `LinguaApp` на название вашего репозитория.

## 4. Настройка для GitHub Pages

### Если репозиторий называется `LinguaApp`:

В `vite.config.ts` уже настроено:
```typescript
base: '/LinguaApp/',
```

### Если репозиторий называется по-другому:

Измените `base` в `vite.config.ts` на ваше название репозитория:
```typescript
base: '/ваше-название-репозитория/',
```

## 5. Деплой на GitHub Pages

```bash
npm install
npm run build
npm install -g gh-pages
npm run deploy
```

Или вручную:

```bash
npm run build
npx gh-pages -d dist
```

## 6. Включение GitHub Pages

1. Перейдите в Settings вашего репозитория
2. Найдите раздел "Pages"
3. В "Source" выберите "gh-pages" branch
4. Нажмите "Save"

## 7. Доступ к приложению

После деплоя приложение будет доступно по адресу:
```
https://lethifold222.github.io/LinguaApp/
```

**Важно**: Замените `lethifold222` на ваш GitHub username.

## Обновление приложения

После внесения изменений:

```bash
git add .
git commit -m "Update: описание изменений"
git push
npm run deploy
```

## Примечания

- Первый деплой может занять несколько минут
- Если приложение не открывается, проверьте настройки GitHub Pages
- Убедитесь, что Firebase конфигурация правильная для продакшена
