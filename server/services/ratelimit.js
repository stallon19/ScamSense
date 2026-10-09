// Tiny in-memory rate limiter so one visitor cannot burn the free Gemini quota.
function rateLimit({ max = 40, windowMs = 10 * 60 * 1000 } = {}) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, e] of hits) if (e.reset < now) hits.delete(ip);
  }, 60 * 1000).unref();

  return (req, res, next) => {
    const now = Date.now();
    let e = hits.get(req.ip);
    if (!e || e.reset < now) {
      e = { count: 0, reset: now + windowMs };
      hits.set(req.ip, e);
    }
    e.count++;
    if (e.count > max) {
      res.set('Retry-After', String(Math.ceil((e.reset - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests from your network. Please wait a few minutes.' });
    }
    next();
  };
}
module.exports = rateLimit;
