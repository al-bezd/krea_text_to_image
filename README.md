# Krea AI — плагин для Photopea

Плагин добавляет в Photopea кнопку генерации изображений через [Krea.ai](https://www.krea.ai). Выдели область, напиши промпт — результат появится новым слоем прямо в документе.

---

## Что потребуется

- Аккаунт [krea.ai](https://www.krea.ai) с платным планом (API доступен только на платных)
- API ключ — получить на [krea.ai/settings/api-tokens](https://www.krea.ai/settings/api-tokens)
- Бесплатный аккаунт [Cloudflare](https://dash.cloudflare.com/sign-up) для прокси (нужен обход CORS)

---

## Шаг 1 — Настройка Cloudflare Worker (прокси)

Плагин обращается к `api.krea.ai` из браузера, и для этого нужен прокси. Cloudflare Workers бесплатны и разворачиваются за 2 минуты.

### 1.1 Создай Worker

1. Зайди на [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
2. Нажми **Create Worker**
3. Дай воркеру любое имя, например `krea-proxy`
4. Нажми **Deploy** (сразу, с дефолтным кодом — потом заменим)

### 1.2 Вставь код воркера

1. После деплоя нажми **Edit code**
2. Удали весь дефолтный код и вставь содержимое файла `worker.js` из этого репозитория:

```js
export default {
    async fetch(request) {
        // CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Max-Age": "86400",
                },
            });
        }

        const url = new URL(request.url);

        // /proxy?url=https://... — скачать любой внешний URL через CORS
        if (url.pathname === "/proxy") {
            const targetUrl = url.searchParams.get("url");
            if (!targetUrl) {
                return new Response("Missing ?url= parameter", { status: 400 });
            }
            try {
                const response = await fetch(targetUrl);
                const headers = new Headers();
                headers.set("Access-Control-Allow-Origin", "*");
                const ct = response.headers.get("Content-Type");
                if (ct) headers.set("Content-Type", ct);
                return new Response(response.body, { status: response.status, headers });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 502,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                });
            }
        }

        // Всё остальное → проксируем к api.krea.ai
        const kreaUrl = "https://api.krea.ai" + url.pathname + url.search;
        const headers = new Headers();
        for (const [key, value] of request.headers.entries()) {
            if (key.toLowerCase() !== "host") headers.set(key, value);
        }
        try {
            const response = await fetch(kreaUrl, {
                method: request.method,
                headers,
                body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
            });
            const respHeaders = new Headers(response.headers);
            respHeaders.set("Access-Control-Allow-Origin", "*");
            respHeaders.set("Access-Control-Allow-Headers", "*");
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: respHeaders,
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 502,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }
    },
};
```

3. Нажми **Deploy** в редакторе

### 1.3 Скопируй URL воркера

После деплоя Cloudflare покажет адрес вида:
```
https://krea-proxy.ИМЯ.workers.dev
```
Скопируй его — он понадобится в плагине.

> **Лимиты бесплатного плана:** 100 000 запросов в сутки. Для личного использования более чем достаточно.

---

## Шаг 2 — Установка плагина в Photopea

### Вариант А — хостинг уже готов (этот репозиторий на GitHub Pages)

Плагин доступен по адресу:
```
https://USERNAME.github.io/REPO/plugin.html
```

Если хочешь использовать свою копию — сделай форк репозитория и включи GitHub Pages (Settings → Pages → Deploy from branch `main`).

### Вариант Б — Netlify Drop (без форка)

1. Зайди на [app.netlify.com/drop](https://app.netlify.com/drop)
2. Перетащи файл `plugin.html`
3. Netlify автоматически выдаст тебе публичный URL

### Подключение к Photopea

1. Открой [photopea.com](https://www.photopea.com)
2. В меню выбери **Window → Plugins → Add Plugin**
3. Вставь URL своего `plugin.html`
4. Плагин появится на правой панели с иконкой **K**

---

## Шаг 3 — Первый запуск

При первом открытии плагина заполни два поля и сохрани их:

**API Key** — Bearer-токен из [krea.ai/settings/api-tokens](https://www.krea.ai/settings/api-tokens)

**Cloudflare Worker URL** — адрес вида `https://krea-proxy.ИМЯ.workers.dev`, который ты получил на Шаге 1

Оба значения сохраняются в браузере и не требуют повторного ввода.

---

## Использование

### Режим «Только выделенная область»

1. Открой изображение в Photopea
2. Выдели область инструментом **Rectangular Marquee** (клавиша `M`) или лассо
3. Открой плагин → выбери модель → введи промпт
4. Убедись что выбран режим **«Только выделенная область»**
5. Нажми **✦ Генерировать**
6. Дождись результата (~15–60 сек в зависимости от модели)
7. Появится превью — нажми **✓ Вставить в слой**

Результат появится новым слоем **«Krea AI Result»** точно поверх выделенной области — никакого нового документа.

### Режим «Весь холст»

Выделение не нужно — плагин отправит всё изображение целиком и вернёт результат того же размера.

---

## Модели

| Модель | Скорость | Лучше всего для |
|---|---|---|
| **Nano Banana** | ~10 сек | Быстрая и дешёвая ($0.04), для теста |
| **Nano Banana Pro** | ~15 сек | Универсальная генерация |
| **Flux Kontext** | ~25 сек | Редактирование стиля, сохранение деталей |
| **ChatGPT Image 2** ⭐ | ~55 сек | Настоящий inpainting — понимает контекст |
| **SeedEdit** | ~30 сек | Frontier редактирование |
| **Imagen 4** | ~25 сек | Высокое качество, фотореализм |

---

## Советы

- **Промпт лучше писать на английском** — качество заметно выше
- **Сила редактирования 0.7–0.9** — баланс между следованием промпту и сохранением оригинала
- **ChatGPT Image 2** — единственная модель с настоящим inpainting: прозрачная область холста передаётся как маска, остальные пиксели остаются нетронутыми
- После вставки результата можно добавить маску слоя (Layer → Layer Mask) чтобы точно вписать его в нужную область
- `Ctrl+A` — выделить весь холст, если хочешь обработать изображение полностью в режиме выделения

---

## Как это работает

```
Photopea (холст / выделение)
    ↓ postMessage → plugin.html читает PNG
plugin.html
    ↓ fetch → Cloudflare Worker (прокси)
    ↓ → api.krea.ai/assets (загрузка исходника)
    ↓ → api.krea.ai/generate/image/... (запуск задачи)
    ↓ polling каждые 2.5 сек
Результат (URL изображения)
    ↓ Cloudflare Worker /proxy?url=... (скачивание)
plugin.html
    ↓ app.open(dataUrl, null, true) → Photopea
Новый слой «Krea AI Result» в текущем документе
```
