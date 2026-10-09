const express = require('express');
const { AppError, callGemini, parseJson } = require('../services/gemini');
const { SCENARIOS, scammerSystem, SCORER_SYSTEM } = require('../services/prompts');

const router = express.Router();
const MAX_HISTORY = 30;
const MAX_MSG = 500;

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function readInput(body) {
  const scenario = body && body.scenario;
  if (!SCENARIOS[scenario]) throw new AppError(400, 'Pick a scenario first.');
  const raw = Array.isArray(body.history) ? body.history : [];
  if (raw.length > MAX_HISTORY) throw new AppError(400, 'This chat is too long. Start a new one.');
  const history = raw.map((m, i) => {
    const role = m && m.role;
    const text = str(m && m.text, MAX_MSG);
    const expected = i % 2 === 0 ? 'scammer' : 'user'; // chat always starts with the scammer
    if (role !== expected || !text) throw new AppError(400, 'The chat history is not valid.');
    return { role, text };
  });
  return { scenario, history };
}

// Next scammer message
router.post('/message', async (req, res, next) => {
  try {
    const { scenario, history } = readInput(req.body);
    if (history.length && history[history.length - 1].role !== 'user') throw new AppError(400, 'Waiting for your reply.');

    const contents = [{ role: 'user', parts: [{ text: 'Begin the chat now. Write your first message to the student.' }] }];
    for (const m of history) contents.push({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] });

    let reply = await callGemini({
      system: scammerSystem(scenario),
      contents,
      temperature: 0.9,
      maxTokens: 220,
    });
    reply = reply.replace(/^["'\s]+|["'\s]+$/g, '').replace(/^[A-Za-z .]{2,30}:\s+/, '').slice(0, MAX_MSG);
    if (!reply) throw new AppError(502, 'The scammer did not reply. Try again.');
    res.json({ reply });
  } catch (err) {
    next(err);
  }
});

// Final score
router.post('/score', async (req, res, next) => {
  try {
    const { scenario, history } = readInput(req.body);
    const userMsgs = history.filter((m) => m.role === 'user');
    if (!userMsgs.length) throw new AppError(400, 'Reply to the scammer at least once, then end the chat.');

    const transcript = history.map((m) => `${m.role === 'user' ? 'USER' : 'SCAMMER'}: ${m.text}`).join('\n');
    const out = await callGemini({
      system: SCORER_SYSTEM,
      contents: [{ role: 'user', parts: [{ text: `Scenario: ${SCENARIOS[scenario].title}\n<transcript>\n${transcript}\n</transcript>` }] }],
      json: true,
      temperature: 0.2,
      maxTokens: 1200,
    });
    const raw = parseJson(out);

    let score = Math.round(Number(raw.score));
    if (!Number.isFinite(score)) score = 50;
    score = Math.max(0, Math.min(100, score));

    // Hard safety floor: if the user typed what looks like a PIN/OTP/CVV or a card number, the score stays low.
    const all = userMsgs.map((m) => m.text).join(' \n ');
    const sharedSecret = /\b(pin|otp|cvv|password)\b[^0-9]{0,15}\d{3,8}\b/i.test(all) || /\b\d{3,8}\b[^0-9]{0,6}\b(is|as)\b[^.]{0,12}\b(pin|otp|cvv)\b/i.test(all);
    if (sharedSecret) score = Math.min(score, 25);
    if (userMsgs.length === 1) score = Math.min(score, 75);

    const lowerUser = userMsgs.map((m) => m.text.toLowerCase());
    const valid = (item) => item && str(item.quote, 200) && lowerUser.some((u) => u.includes(str(item.quote, 200).toLowerCase()));
    const clean = (arr) =>
      (Array.isArray(arr) ? arr : []).filter(valid).slice(0, 3).map((i) => ({ quote: str(i.quote, 200), why: str(i.why, 220) }));

    const defaults = [
      'Never share your PIN, OTP or CVV with anyone.',
      'Hang up and call the official number yourself.',
      'Real offices never ask you to pay money to receive money.',
    ];
    const tips = (Array.isArray(raw.tips) ? raw.tips : []).map((t) => str(t, 200)).filter(Boolean).slice(0, 3);
    while (tips.length < 3) tips.push(defaults[tips.length]);

    res.json({
      score,
      scenario: SCENARIOS[scenario].title,
      summary: str(raw.summary, 200) || 'Here is how you did in this practice chat.',
      slipped: clean(raw.slipped),
      good_moves: clean(raw.good_moves),
      tips,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
