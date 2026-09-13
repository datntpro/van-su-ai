/**
 * Cloudflare Worker stub — proxy AI for Van Su AI.
 * Set secrets: AI_API_KEY (shared with app), OPENAI_API_KEY (optional).
 */

const DISCLAIMER =
  'Chỉ mang tính giải trí, không phải lời khuyên chuyên môn';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors() });
    }
    if (request.method !== 'POST') {
      return json({ error: 'POST only' }, 405);
    }

    const auth = request.headers.get('Authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (!env.AI_API_KEY || token !== env.AI_API_KEY) {
      return json({ error: 'unauthorized' }, 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid json' }, 400);
    }

    const type = body.type === 'chat' ? 'chat' : 'horoscope';
    const prompt = buildPrompt(type, body);

    let text = '';
    let model = 'stub';

    if (env.OPENAI_API_KEY) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'Bạn là Van Su AI — trợ lý tử vi/lịch vạn sự tiếng Việt, chỉ giải trí, ngắn gọn, không khẳng định tuyệt đối.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.8,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          text = data.choices?.[0]?.message?.content?.trim() || '';
          model = env.OPENAI_MODEL || 'gpt-4o-mini';
        }
      } catch (e) {
        console.error('openai failed', e);
      }
    }

    // Optional: Workers AI binding `env.AI.run(...)` when configured in wrangler.toml

    if (!text) {
      text = [
        type === 'chat'
          ? `Van Su AI (stub): về “${String(body.message || '').slice(0, 80)}”, hãy giữ tâm thế trung dung hôm nay.`
          : 'Van Su AI (stub): ngày mang năng lượng ổn định — ưu tiên việc nhỏ hoàn thành sớm.',
        '',
        `— ${DISCLAIMER} —`,
      ].join('\n');
      model = 'stub-local';
    } else if (!text.includes('giải trí')) {
      text = `${text}\n\n— ${DISCLAIMER} —`;
    }

    return json({ text, model });
  },
};

function buildPrompt(type, body) {
  const p = body.profile || {};
  if (type === 'chat') {
    return `Hồ sơ: sinh ${p.birthDate || '?'}, giờ ${p.birthTime || 'không rõ'}. Câu hỏi: ${body.message || ''}`;
  }
  return `Viết tử vi ngày (tiếng Việt, giải trí) cho người sinh ${p.birthDate || '?'}, ngày ${body.date || 'hôm nay'}.`;
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors() },
  });
}
