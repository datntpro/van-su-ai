/**
 * Cloudflare Worker stub — proxy AI for Van Su AI.
 * Set secrets: AI_API_KEY (shared with app), OPENAI_API_KEY (optional).
 */

const DISCLAIMER =
  'Chỉ mang tính giải trí, không phải lời khuyên chuyên môn';

const INTAKE_SYSTEM = `Bạn là Van Su AI — trợ lý tử vi / lịch vạn sự tiếng Việt, chỉ mang tính giải trí.
Hỏi lần lượt thông tin còn thiếu (giờ sinh, giới tính, hôn nhân, công việc, điều quan tâm, mục tiêu năm nay).
Một câu hỏi mỗi lượt. Khi đủ ngữ cảnh hoặc user bỏ qua: luận giải cá nhân hóa, không generic.
Không khẳng định tuyệt đối.`;

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

    const type = ['chat', 'horoscope_intake'].includes(body.type)
      ? body.type
      : 'horoscope';
    const prompt = buildPrompt(type, body);

    let text = '';
    let model = 'stub';

    if (env.OPENAI_API_KEY) {
      try {
        const messages = [
          {
            role: 'system',
            content: body.systemPrompt || (type === 'horoscope_intake' ? INTAKE_SYSTEM :
              'Bạn là Van Su AI — trợ lý tử vi/lịch vạn sự tiếng Việt, chỉ giải trí, ngắn gọn, không khẳng định tuyệt đối.'),
          },
        ];
        if (Array.isArray(body.history)) {
          for (const h of body.history.slice(-12)) {
            if (h && (h.role === 'user' || h.role === 'assistant') && h.content) {
              messages.push({ role: h.role, content: String(h.content) });
            }
          }
        }
        messages.push({ role: 'user', content: prompt });

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: env.OPENAI_MODEL || 'gpt-4o-mini',
            messages,
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

    if (!text) {
      text = [
        type === 'horoscope_intake'
          ? (body.skipIntake
            ? 'Đã đủ để luận giải. Mình sẽ soạn tử vi cá nhân hóa dựa trên hồ sơ bạn đã cung cấp.'
            : `Mình cần thêm vài chi tiết. ${body.message ? 'Cảm ơn bạn đã chia sẻ. ' : ''}Bạn nhớ giờ sinh, giới tính, công việc hoặc điều đang quan tâm không?`)
          : type === 'chat'
            ? `Van Su AI (stub): về “${String(body.message || '').slice(0, 80)}”, hãy giữ tâm thế trung dung hôm nay.`
            : 'Van Su AI (stub): ngày mang năng lượng ổn định — ưu tiên việc nhỏ hoàn thành sớm.',
        '',
        `— ${DISCLAIMER} —`,
      ].join('\n');
      model = 'stub-local';
    } else if (!text.includes('giải trí')) {
      text = `${text}\n\n— ${DISCLAIMER} —`;
    }

    const readyForReading = Boolean(body.skipIntake) || type === 'horoscope';
    return json({ text, model, readyForReading });
  },
};

function buildPrompt(type, body) {
  const p = body.profile || {};
  const tr = body.traits || {};
  const traitLine = [
    tr.gender && `giới tính ${tr.gender}`,
    tr.relationshipStatus && `tình cảm ${tr.relationshipStatus}`,
    tr.career && `nghề ${tr.career}`,
    Array.isArray(tr.concerns) && tr.concerns.length && `quan tâm ${tr.concerns.join(', ')}`,
    tr.locationCurrent && `đang ở ${tr.locationCurrent}`,
  ].filter(Boolean).join('; ');

  if (type === 'horoscope_intake') {
    return [
      `Hồ sơ sinh: ${p.birthDate || '?'}, giờ ${p.birthTime || 'chưa có'}.`,
      traitLine ? `Đã biết: ${traitLine}.` : 'Chưa có traits.',
      body.skipIntake ? 'User bỏ qua hỏi thêm — hãy luận giải cá nhân hóa ngay.' : '',
      body.message ? `User vừa nói: ${body.message}` : 'Hãy hỏi thông tin còn thiếu (một câu).',
    ].filter(Boolean).join(' ');
  }
  if (type === 'chat') {
    return `Hồ sơ: sinh ${p.birthDate || '?'}, giờ ${p.birthTime || 'không rõ'}. ${traitLine}. Câu hỏi: ${body.message || ''}`;
  }
  return `Viết tử vi ngày (tiếng Việt, giải trí, cá nhân hóa) cho người sinh ${p.birthDate || '?'}, ngày ${body.date || 'hôm nay'}. ${traitLine}`;
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
