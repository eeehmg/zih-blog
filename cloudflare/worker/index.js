const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
});

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
  if (!origin || allowed.includes(origin)) return {
    'access-control-allow-origin': origin || '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'vary': 'Origin'
  };
  return {};
}

function response(request, env, data, status = 200) {
  const cors = corsHeaders(request, env);
  if (request.headers.get('Origin') && !cors['access-control-allow-origin']) {
    return json({ error: 'origin_not_allowed' }, 403);
  }
  return json(data, status, cors);
}

function makeId() {
  return crypto.randomUUID();
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    if (request.method === 'GET' && path === '/api/health') {
      return response(request, env, { ok: true, service: 'zih-ai-backend', version: '0.1.0', timestamp: new Date().toISOString() });
    }

    if (request.method === 'GET' && path === '/api/rooms') {
      const { results = [] } = await env.DB.prepare('SELECT id, name, visibility FROM chat_rooms ORDER BY name').all();
      return response(request, env, { rooms: results });
    }

    const roomMatch = path.match(/^\/api\/rooms\/([a-zA-Z0-9_-]{1,64})\/messages$/);
    if (roomMatch && request.method === 'GET') {
      const roomId = roomMatch[1];
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));
      const before = url.searchParams.get('before');
      let query = 'SELECT id, room_id AS roomId, author_name AS name, author_type AS authorType, content, created_at AS createdAt FROM chat_messages WHERE room_id = ?';
      const params = [roomId];
      if (before) { query += ' AND created_at < ?'; params.push(before); }
      query += ' ORDER BY created_at DESC LIMIT ?'; params.push(limit);
      const { results = [] } = await env.DB.prepare(query).bind(...params).all();
      return response(request, env, { messages: results.reverse() });
    }

    if (roomMatch && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return response(request, env, { error: 'invalid_json' }, 400); }
      const name = String(body.name || '').trim().slice(0, 24);
      const content = String(body.content || '').trim();
      const maxLength = Math.min(5000, Math.max(100, Number(env.MAX_MESSAGE_LENGTH) || 2000));
      if (!name || !content) return response(request, env, { error: 'name_and_content_required' }, 400);
      if (content.length > maxLength) return response(request, env, { error: 'message_too_long', maxLength }, 413);
      const roomId = roomMatch[1];
      const room = await env.DB.prepare('SELECT id FROM chat_rooms WHERE id = ?').bind(roomId).first();
      if (!room) return response(request, env, { error: 'room_not_found' }, 404);
      const id = makeId();
      await env.DB.prepare('INSERT INTO chat_messages(id, room_id, author_name, author_type, content) VALUES(?, ?, ?, ?, ?)')
        .bind(id, roomId, name, 'visitor', content).run();
      const message = await env.DB.prepare('SELECT id, room_id AS roomId, author_name AS name, author_type AS authorType, content, created_at AS createdAt FROM chat_messages WHERE id = ?').bind(id).first();
      return response(request, env, { message }, 201);
    }

    // Model credentials remain server-side. Configure a trusted OpenAI-compatible gateway URL and secret.
    if (request.method === 'POST' && path === '/api/ai/chat') {
      if (!env.MODEL_GATEWAY_URL || !env.MODEL_GATEWAY_API_KEY) {
        return response(request, env, { error: 'model_gateway_not_configured' }, 503);
      }
      let body;
      try { body = await request.json(); } catch { return response(request, env, { error: 'invalid_json' }, 400); }
      if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 30) {
        return response(request, env, { error: 'messages_must_be_an_array_of_1_to_30_items' }, 400);
      }
      const safeMessages = body.messages.map(m => ({
        role: ['system', 'user', 'assistant'].includes(m.role) ? m.role : 'user',
        content: String(m.content || '').slice(0, 8000)
      }));
      const endpoint = env.MODEL_GATEWAY_URL.replace(/\/$/, '') + '/chat/completions';
      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'authorization': `Bearer ${env.MODEL_GATEWAY_API_KEY}` },
        body: JSON.stringify({ model: String(body.model || env.DEFAULT_MODEL || 'default'), messages: safeMessages, temperature: 0.7, stream: false })
      });
      const raw = await upstream.text();
      if (!upstream.ok) return response(request, env, { error: 'model_gateway_error', status: upstream.status, detail: raw.slice(0, 1000) }, 502);
      let result;
      try { result = JSON.parse(raw); } catch { return response(request, env, { error: 'invalid_model_gateway_response' }, 502); }
      return response(request, env, { id: result.id || null, model: result.model || null, choices: result.choices || [] });
    }

    return response(request, env, { error: 'not_found' }, 404);
  }
};
