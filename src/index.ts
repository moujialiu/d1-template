export default {
	async fetch(req, env) {
		const url = new URL(req.url)

		const cors = {
			"Access-Control-Allow-Origin":"*",
			"Access-Control-Allow-Methods":"GET,POST,OPTIONS",
			"Access-Control-Allow-Headers":"Content-Type"
		}

		if (req.method === "OPTIONS") {
			return new Response(null, {headers: cors})
		}

		// ---------- 日志 KV ----------
		if (url.pathname === "/log" && req.method === "POST") {
			const data = await req.json()
			await env.EVENTS.put(
				crypto.randomUUID(),
				JSON.stringify({
					...data,
					ip: req.headers.get("CF-Connecting-IP"),
					createdAt: Date.now()
				})
			)

			return Response.json({ok:true}, {headers:cors})
		}

		// ---------- 评论 D1 ----------
		if (url.pathname === "/comment" && req.method === "POST") {
			const data = await req.json()
			await env.DB.prepare(`
				INSERT INTO comments
				(
					id,
					content,
					created_at
				)
				VALUES(?1,?2,?3)
			`)
			.bind(crypto.randomUUID(), data.content, Date.now())
			.run()

			return Response.json({ok: true}, {headers: cors})
		}

		if (url.pathname === "/comment" && req.method === "GET") {
			const result = await env.DB.prepare(`
				SELECT *
				FROM comments
				ORDER BY created_at DESC
				LIMIT 20
			`).all()

			return Response.json(result.results, {headers: cors})
		}

		return new Response("Not Found", {status:404})
	}
}