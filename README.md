# Krea AI Inpainting — плагин для Photopea

Плагин позволяет выделить область в Photopea и дорисовать её через Krea.ai API.

---

## Что нужно

- Аккаунт на [krea.ai](https://www.krea.ai) с подпиской (API доступен на платных планах)
- API ключ из [krea.ai/dashboard/api](https://www.krea.ai/dashboard/api)
- Хостинг для `plugin.html` (GitHub Pages, Vercel, Netlify — бесплатно)

---

## Установка

### Вариант 1 — GitHub Pages (рекомендуется)

1. Создай публичный репозиторий на GitHub
2. Загрузи туда `plugin.html` и `icon.svg`
3. Включи GitHub Pages (Settings → Pages → Deploy from branch `main`)
4. Твой URL будет: `https://USERNAME.github.io/REPO-NAME/plugin.html`

### Вариант 2 — Netlify Drop

1. Зайди на [app.netlify.com/drop](https://app.netlify.com/drop)
2. Перетащи папку с `plugin.html`
3. Netlify даст тебе URL автоматически

---

## Подключение к Photopea

### Через config URL (самый простой способ):

Замени `YOUR-HOST` в `photopea-config.json` на свой URL, например:
```json
{
  "environment": {
    "plugins": [
      {
        "name": "Krea AI",
        "url": "https://username.github.io/krea-plugin/plugin.html",
        "icon": "https://username.github.io/krea-plugin/icon.svg"
      }
    ]
  }
}
```

Загрузи этот JSON на хостинг. Затем открой Photopea с параметром:
```
https://www.photopea.com/#{"environment":{"plugins":[{"name":"Krea AI","url":"ТВОЙ_URL/plugin.html"}]}}
```

### Через Window → Plugins:

1. Открой Photopea
2. Window → Plugins → Add Plugin
3. Введи URL своего `plugin.html`
4. Плагин появится на правой панели

---

## Использование

1. Открой изображение в Photopea
2. Выдели область инструментом **Rectangular Marquee** (M) или любым другим
3. Нажми кнопку плагина **K** на правой панели
4. Введи API ключ и сохрани его
5. Выбери модель (рекомендуется **Flux Kontext** для редактирования)
6. Введи промпт — что должно появиться в выделенной области
7. Нажми **✦ Генерировать**
8. Дождись результата (~15–60 сек)
9. Нажми **✓ Вставить в слой** — результат появится новым слоем

---

## Модели

| Модель | Скорость | Лучше всего для |
|--------|----------|-----------------|
| **Flux Kontext** ⭐ | ~23 сек | Редактирование, inpainting, сохранение стиля |
| ChatGPT Image 2 | ~55 сек | Умное редактирование, инструкции |
| SeedEdit | ~30 сек | Frontier редактирование |
| Nano Banana Pro | ~20 сек | Универсальная генерация |
| Imagen 4 | ~25 сек | Фотореализм |

---

## Как работает

```
Photopea (выделение + холст)
    ↓ postMessage (PNG ArrayBuffer)
plugin.html (iframe внутри Photopea)
    ↓ fetch
api.krea.ai/assets (загрузка исходника)
    ↓
api.krea.ai/generate/image/... (запуск генерации)
    ↓ polling
Результат (URL изображения)
    ↓ postMessage (ArrayBuffer обратно)
Photopea → новый слой "Krea AI Result"
```

---

## CORS

Krea API поддерживает CORS, поэтому запросы из браузера работают напрямую без прокси.

---

## Советы

- **Сила редактирования 0.7–0.9** — хороший баланс между следованием промпту и сохранением контекста
- Для inpainting Flux Kontext работает лучше всего — он специально обучен на редактирование
- Промпт пиши на **английском** — результат обычно лучше
- После вставки результата ты можешь использовать маску слоя чтобы точно вписать его в нужную область
