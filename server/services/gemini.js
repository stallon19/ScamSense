// Single place that talks to the Gemini API. The API key never leaves the server.

class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function endpoint(model) {
  const base = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta/models';
  return `${base}/${encodeURIComponent(model)}:generateContent`;
}

async function callGemini({ system, contents, json = false, temperature = 0.3, maxTokens = 1200 }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.startsWith('your_')) {
    throw new AppError(503, 'The server has no Gemini API key yet. Add GEMINI_API_KEY to the .env file and restart.');
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const body = {
    contents,
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  if (json) body.generationConfig.responseMimeType = 'application/json';
  // 2.5 Flash "thinks" by default, which is slow. Turn it off for speed.
  if (/gemini-2\.5-flash/.test(model)) body.generationConfig.thinkingConfig = { thinkingBudget: 0 };

  let lastStatus = 0;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 28000);
    try {
      const res = await fetch(endpoint(model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      lastStatus = res.status;

      if (res.ok) {
        const data = await res.json();
        const cand = data.candidates && data.candidates[0];
        if (!cand || !cand.content || !cand.content.parts) {
          throw new AppError(422, 'The AI could not process this message. Try rewording it.');
        }
        return cand.content.parts.map((p) => p.text || '').join('').trim();
      }
      if ((res.status === 500 || res.status === 503) && attempt === 0) {
        await sleep(900);
        continue;
      }
      break;
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (err.name === 'AbortError') throw new AppError(504, 'The AI took too long. Please try again.');
      if (attempt === 0) { await sleep(600); continue; }
      throw new AppError(502, 'Could not reach the AI service. Check your internet and try again.');
    } finally {
      clearTimeout(timer);
    }
  }

  if (lastStatus === 429) throw new AppError(429, 'The free AI limit was reached. Wait one minute and try again.');
  if (lastStatus === 400 || lastStatus === 403) throw new AppError(502, 'The AI service rejected the request. Check the API key and model name in .env.');
  if (lastStatus === 404) throw new AppError(502, 'The AI model name was not found. Set GEMINI_MODEL in .env to a model listed in AI Studio.');
  throw new AppError(502, 'The AI service is busy. Please try again.');
}

function parseJson(text) {
  const clean = String(text).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const a = clean.indexOf('{');
    const b = clean.lastIndexOf('}');
    if (a >= 0 && b > a) {
      try { return JSON.parse(clean.slice(a, b + 1)); } catch { /* fall through */ }
    }
    throw new AppError(502, 'The AI sent an unreadable answer. Please try again.');
  }
}

module.exports = { AppError, callGemini, parseJson };
