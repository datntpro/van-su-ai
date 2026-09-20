/**
 * Cloudflare Worker — Van Su AI proxy.
 * Matches src/lib/ai.ts contract. Never returns or requires Supabase service_role.
 *
 * Secrets: AI_API_KEY (required), OPENAI_API_KEY (optional)
 * Binding: AI (Workers AI, optional)
 * Vars: AI_PROVIDER, OPENAI_MODEL, OPENAI_BASE_URL, WORKERS_AI_MODEL
 */

const DISCLAIMER =
  'Chỉ mang tính giải trí, không phải lời khuyên chuyên môn';

const BASE_SYSTEM = `Bạn là Van Su AI — trợ lý tử vi / lịch vạn sự / giải trí tiếng Việt.
Luôn trả lời bằng tiếng Việt, ngắn gọn, thân thiện, mang tính giải trí.
Không khẳng định tuyệt đối. Không tư vấn y tế / tài chính / pháp lý chuyên môn.
Không bao giờ yêu cầu hoặc tiết lộ service_role / secret / API key.
Cuối câu trả lời có thể nhắc: chỉ mang tính giải trí.`;

const INTAKE_SYSTEM = `${BASE_SYSTEM}

Nhiệm vụ trên tab Tử vi (horoscope_intake):
1. Hỏi lần lượt thông tin còn thiếu (không hỏi lại cái đã có): giờ sinh, giới tính, hôn nhân/tình cảm, công việc, điều đang quan tâm, mục tiêu năm nay, nơi đang sống nếu hữu ích.
2. Một câu hỏi mỗi lượt.
3. Khi đủ ngữ cảnh (≥3 mục ngoài ngày sinh) HOẶC user bỏ qua: luận giải cá nhân hóa (entertainment horoscope).
4. Nếu có thể, trả JSON một dòng:
{ "text": "...", "traits": { "gender": "...", "relationshipStatus": "...", "career": "...", "concerns": ["..."], "locationCurrent": "...", "questionnaire": { "year_goal": "..." } }, "birthTime": "HH:mm", "readyForReading": true|false }
Nếu không structured, chỉ trả text.`;

const HOROSCOPE_SYSTEM = `${BASE_SYSTEM}

Viết tử vi / luận ngày kiểu giải trí lịch vạn sự Việt Nam: can chi, khí vận, gợi ý việc nên/không nên — cá nhân hóa theo hồ sơ, không generic copy-paste.`;

const CHAT_SYSTEM = `${BASE_SYSTEM}

Trả lời câu hỏi về lịch vạn sự, tử vi giải trí, chọn ngày, giờ hoàng đạo — tiếng Việt, rõ ràng, có disclaimer giải trí.`;

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors() });
    }
    if (request.method === 'GET') {
      return json({
        ok: true,
        service: 'van-su-ai-proxy',
        contract: 'POST JSON { type, profile?, traits?, date?, message?, history?, systemPrompt?, skipIntake? } → { text, model?, traits?, readyForReading?, birthTime? }',
        note: 'Never send Supabase service_role to this worker from Expo.',
      });
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

    // Strip any accidental privileged keys from client payload
    if (body && typeof body === 'object') {
      delete body.service_role;
      delete body.serviceRole;
      delete body.supabaseServiceKey;
    }

    const type = ['chat', 'horoscope_intake', 'horoscope'].includes(body.type)
      ? body.type
      : 'horoscope';

    const system =
      body.systemPrompt ||
      (type === 'horoscope_intake'
        ? INTAKE_SYSTEM
        : type === 'chat'
          ? CHAT_SYSTEM
          : HOROSCOPE_SYSTEM);

    const messages = [{ role: 'system', content: system }];
    if (Array.isArray(body.history)) {
      for (const h of body.history.slice(-12)) {
        if (h && (h.role === 'user' || h.role === 'assistant') && h.content) {
          messages.push({ role: h.role, content: String(h.content).slice(0, 4000) });
        }
      }
    }
    messages.push({ role: 'user', content: buildPrompt(type, body) });

    let text = '';
    let model = 'stub';

    const provider = (env.AI_PROVIDER || 'auto').toLowerCase();
    const preferOpenAI =
      provider === 'openai' ||
      (provider === 'auto' && Boolean(env.OPENAI_API_KEY));
    const preferWorkers =
      provider === 'workers' ||
      (provider === 'auto' && !env.OPENAI_API_KEY && env.AI);

    if (preferOpenAI && env.OPENAI_API_KEY) {
      const result = await callOpenAICompatible(env, messages);
      if (result.text) {
        text = result.text;
        model = result.model;
      }
    }

    if (!text && (preferWorkers || provider === 'auto') && env.AI) {
      const result = await callWorkersAI(env, messages);
      if (result.text) {
        text = result.text;
        model = result.model;
      }
    }

    // Last-chance OpenAI if auto started with Workers but failed
    if (!text && env.OPENAI_API_KEY && !preferOpenAI) {
      const result = await callOpenAICompatible(env, messages);
      if (result.text) {
        text = result.text;
        model = result.model;
      }
    }

    if (!text) {
      text = stubReply(type, body);
      model = 'stub-local';
    } else if (!text.includes('giải trí')) {
      text = `${text}\n\n— ${DISCLAIMER} —`;
    }

    const parsed = tryParseStructured(text);
    const readyForReading =
      typeof parsed.readyForReading === 'boolean'
        ? parsed.readyForReading
        : Boolean(body.skipIntake) || type === 'horoscope';

    const out = {
      text: parsed.text || text,
      model,
      readyForReading,
    };
    if (parsed.traits) out.traits = parsed.traits;
    if (parsed.birthTime) out.birthTime = parsed.birthTime;
    return json(out);
  },
};

async function callOpenAICompatible(env, messages) {
  const base = (env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = env.OPENAI_MODEL || 'gpt-4o-mini';
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.8,
        max_tokens: 1200,
      }),
    });
    if (!res.ok) {
      console.error('openai upstream', res.status, await res.text().catch(() => ''));
      return { text: '', model };
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';
    return { text, model };
  } catch (e) {
    console.error('openai failed', e);
    return { text: '', model };
  }
}

async function callWorkersAI(env, messages) {
  const model = env.WORKERS_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';
  try {
    const result = await env.AI.run(model, { messages });
    const text =
      (typeof result?.response === 'string' && result.response.trim()) ||
      (typeof result?.result?.response === 'string' && result.result.response.trim()) ||
      (typeof result === 'string' && result.trim()) ||
      '';
    return { text, model };
  } catch (e) {
    console.error('workers ai failed', e);
    return { text: '', model };
  }
}

function buildPrompt(type, body) {
  const p = body.profile || {};
  const tr = body.traits || {};
  const traitLine = [
    tr.gender && `giới tính ${tr.gender}`,
    tr.relationshipStatus && `tình cảm ${tr.relationshipStatus}`,
    tr.relationship_status && `tình cảm ${tr.relationship_status}`,
    tr.career && `nghề ${tr.career}`,
    Array.isArray(tr.concerns) && tr.concerns.length && `quan tâm ${tr.concerns.join(', ')}`,
    tr.locationCurrent && `đang ở ${tr.locationCurrent}`,
    tr.location_current && `đang ở ${tr.location_current}`,
  ]
    .filter(Boolean)
    .join('; ');

  if (type === 'horoscope_intake') {
    return [
      `Hồ sơ sinh: ${p.birthDate || '?'}, giờ ${p.birthTime || 'chưa có'}.`,
      p.displayName ? `Tên gọi: ${p.displayName}.` : '',
      traitLine ? `Đã biết: ${traitLine}.` : 'Chưa có traits.',
      body.skipIntake
        ? 'User bỏ qua hỏi thêm — hãy luận giải tử vi giải trí cá nhân hóa ngay (readyForReading=true).'
        : '',
      body.message
        ? `User vừa nói: ${body.message}`
        : 'Hãy hỏi thông tin còn thiếu (một câu hỏi).',
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (type === 'chat') {
    return `Hồ sơ: sinh ${p.birthDate || '?'}, giờ ${p.birthTime || 'không rõ'}. ${traitLine}. Câu hỏi: ${body.message || ''}`;
  }
  return `Viết tử vi ngày (tiếng Việt, giải trí, cá nhân hóa) cho người sinh ${p.birthDate || '?'}${p.birthTime ? `, giờ ${p.birthTime}` : ''}, ngày ${body.date || 'hôm nay'}. ${traitLine}`;
}

function stubReply(type, body) {
  const lines =
    type === 'horoscope_intake'
      ? [
          body.skipIntake
            ? 'Đã đủ để luận giải. Mình sẽ soạn tử vi giải trí cá nhân hóa dựa trên hồ sơ bạn đã cung cấp.'
            : `Mình cần thêm vài chi tiết. ${body.message ? 'Cảm ơn bạn đã chia sẻ. ' : ''}Bạn nhớ giờ sinh, giới tính, công việc hoặc điều đang quan tâm không?`,
        ]
      : type === 'chat'
        ? [
            `Van Su AI: về “${String(body.message || '').slice(0, 80)}”, hãy giữ tâm thế trung dung hôm nay — ưu tiên việc nhỏ hoàn thành sớm.`,
          ]
        : [
            'Van Su AI: ngày mang năng lượng ổn định theo lịch vạn sự giải trí — nên xuất hành nhẹ, tránh quyết định lớn nếu chưa sẵn sàng.',
          ];
  return [...lines, '', `— ${DISCLAIMER} —`].join('\n');
}

function tryParseStructured(text) {
  const trimmed = String(text || '').trim();
  if (!(trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    return { text };
  }
  try {
    const inner = JSON.parse(trimmed);
    return {
      text: typeof inner.text === 'string' ? inner.text : text,
      traits: inner.traits && typeof inner.traits === 'object' ? inner.traits : undefined,
      birthTime: typeof inner.birthTime === 'string' ? inner.birthTime : undefined,
      readyForReading:
        typeof inner.readyForReading === 'boolean' ? inner.readyForReading : undefined,
    };
  } catch {
    return { text };
  }
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors() },
  });
}
