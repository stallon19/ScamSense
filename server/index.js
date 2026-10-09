require('dotenv').config();
const path = require('path');
const express = require('express');
const rateLimit = require('./services/ratelimit');
const { AppError } = require('./services/gemini');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Basic security headers. No inline scripts are used anywhere in the client.
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  });
  next();
});

app.use(express.json({ limit: '7mb' }));

app.get('/api/health', (req, res) => {
  const k = process.env.GEMINI_API_KEY;
  res.json({ ok: true, keyConfigured: Boolean(k && !k.startsWith('your_')), model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
});

app.use('/api/check', rateLimit({ max: 40 }), require('./routes/check'));
app.use('/api/practice', rateLimit({ max: 120 }), require('./routes/practice'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// "/check" serves check.html, "/practice" serves practice.html
app.use(express.static(path.join(__dirname, '..', 'client'), { extensions: ['html'], maxAge: '1h' }));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, '..', 'client', '404.html')));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'That upload is too large.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Bad request.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

const port = process.env.PORT || 3000;
module.exports = app;