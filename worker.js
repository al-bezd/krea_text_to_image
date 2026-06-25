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

        // Режим 1: /proxy?url=https://gen.krea.ai/... — скачать любой внешний URL
        if (url.pathname === "/proxy") {
            const targetUrl = url.searchParams.get("url");
            if (!targetUrl) {
                return new Response("Missing ?url= parameter", { status: 400 });
            }
            try {
                const response = await fetch(targetUrl);
                const headers = new Headers();
                headers.set("Access-Control-Allow-Origin", "*");
                // Сохраняем Content-Type оригинала
                const ct = response.headers.get("Content-Type");
                if (ct) headers.set("Content-Type", ct);

                return new Response(response.body, {
                    status: response.status,
                    headers,
                });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 502,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                });
            }
        }

        // Режим 2: всё остальное → проксируем к api.krea.ai
        const kreaUrl = "https://api.krea.ai" + url.pathname + url.search;

        const headers = new Headers();
        for (const [key, value] of request.headers.entries()) {
            if (key.toLowerCase() !== "host") {
                headers.set(key, value);
            }
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