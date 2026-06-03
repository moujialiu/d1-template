export default {
  async fetch(req, env) {

    // 处理预检请求 (OPTIONS)
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",                // 允许所有域访问
          "Access-Control-Allow-Methods": "POST,OPTIONS",   // 允许的方法
          "Access-Control-Allow-Headers": "Content-Type",   // 允许的请求头
        }
      });
    }

    // 处理 POST
    if (req.method === "POST") {
      try {
        const data = await req.json();

        // 获取真实 IP（Cloudflare 会在请求头里添加）
        const ip = req.headers.get("CF-Connecting-IP") || req.headers.get("x-forwarded-for") || "unknown";

        // 组合完整数据
        const eventData = {
          ...data,
          ip,
          received_at: new Date().toISOString()
        };

        // 存入 KV
        const id = crypto.randomUUID();
        await env.EVENTS.put(id, JSON.stringify(eventData));

        return new Response(JSON.stringify({ ok: true, id }), {
          headers: { "Access-Control-Allow-Origin": "*" , "Content-Type": "application/json"}
        });

      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
          status: 400
        });
      }
    }

    // GET 或其他方法返回提示
    return new Response(JSON.stringify({ ok: true, message: "Worker ready" }), {
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }
    });
  }
}