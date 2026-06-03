export default {
  async fetch(req, env) {

    const url = new URL(req.url);

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // 处理预检请求
    if(req.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    try {
      // ---------------- /log 日志 KV ----------------
      if(url.pathname === "/log" && req.method === "POST") {

        if(!env.EVENTS) {
          return new Response(JSON.stringify({
            ok:false,
            error:"EVENTS KV binding missing"
          }), {status:500, headers: { ...cors, "Content-Type":"application/json" }});
        }

        const data = await req.json();

        const item = {
          ...data,
          ip: req.headers.get("CF-Connecting-IP"),
          createdAt: Date.now()
        };

        await env.EVENTS.put(crypto.randomUUID(), JSON.stringify(item));

        return new Response(JSON.stringify({ ok:true }), {
          headers: { ...cors, "Content-Type":"application/json" }
        });
      }

      // ---------------- /comment D1 ----------------
      if(url.pathname === "/comment") {

        if(!env.DB) {
          return new Response(JSON.stringify({
            ok:false,
            error:"DB D1 binding missing"
          }), {status:500, headers: { ...cors, "Content-Type":"application/json" }});
        }

        // POST：新增评论
        if(req.method === "POST") {
          const data = await req.json();
          const id = crypto.randomUUID();
          const now = Date.now();

          await env.DB.prepare(`
            INSERT INTO comments(id, content, created_at)
            VALUES(?1, ?2, ?3)
          `).bind(id, data.content, now).run();

          return new Response(JSON.stringify({ ok:true, id }), {
            headers: { ...cors, "Content-Type":"application/json" }
          });
        }

        // GET：获取最新评论
        if(req.method === "GET") {
          const result = await env.DB.prepare(`
            SELECT id, content, created_at
            FROM comments
            ORDER BY created_at DESC
            LIMIT 50
          `).all();

          return new Response(JSON.stringify(result.results), {
            headers: { ...cors, "Content-Type":"application/json" }
          });
        }

        // DELETE：删除评论（可选）
        // if(req.method==="DELETE"){ ... }

      }

      // 其他路径
      return new Response(JSON.stringify({ ok:false, error:"Not Found" }), {
        status:404,
        headers: { ...cors, "Content-Type":"application/json" }
      });

    } catch(err) {
      return new Response(JSON.stringify({
        ok:false,
        error:{
          name: err.name,
          message: err.message,
          stack: err.stack
        }
      }), { status:500, headers:{ ...cors, "Content-Type":"application/json" }});
    }

  }
};