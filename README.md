# ScamSense

AI scam checker and scam-resistance trainer for students and families in India.
Built for PromptWars x Error Zero. It is an AI assistant, not an autonomous agent.

## Run it (3 steps)

1. Get a free Gemini API key at https://aistudio.google.com/apikey
2. Copy `.env.example` to `.env` and paste your key:
   ```
   GEMINI_API_KEY=your_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```
3. Install and start (Node 18 or newer):
   ```
   npm install
   npm start
   ```
   Open http://localhost:3000

If you see "model name was not found", open AI Studio, pick a Flash model that is listed for your account and put its name in `GEMINI_MODEL`.

## Pages

| Path | What it is |
|---|---|
| `/` | Home with intro reveal, parallax hero, how it works, season forecast, tools, benefits, about, roadmap |
| `/check` | Message Checker (text or screenshot, English or Hindi explanation) |
| `/practice` | Practice Mode (5 scenarios) and the score screen |
| `/learn` | Scam library with filter |
| `/forecast` | Scam season forecast (current season highlighted from the date) |
| `/about`, `/help`, `/privacy` | About and FAQ, "I lost money" checklist, privacy and terms |

## Structure

```
client/            HTML, CSS, vanilla JS (no build step)
  css/styles.css   design tokens, light and dark themes
  js/layout.js     nav, footer, theme, intro, scroll animation, parallax
  js/check.js      checker page
  js/practice.js   practice chat and score
server/
  index.js         Express, security headers, static files
  routes/          check.js, practice.js
  services/        gemini.js (API call), prompts.js (ALL prompts), ratelimit.js
```

Fix a wrong verdict by editing the prompts in `server/services/prompts.js`.

## What the server does for safety

- API key stays in `.env` on the server and is never sent to the browser.
- Every quote the AI returns is checked against the real message. Quotes that do not match are dropped.
- A message that asks for OTP, PIN, CVV or password can never be marked Safe.
- In Practice Mode, sharing a PIN or OTP caps the score at 25, and one-message chats cap at 75.
- Rate limit per IP, 2,000 character limit, image type and size limits, strict Content Security Policy, no inline scripts.
- Identical text checks are cached for 30 minutes to save free quota.
- Message content is never written to logs or disk.

## Before the demo

- **Free tier limit:** about 10 requests per minute. Test with 3 people at once. Errors show a clear "wait a minute" message.
- **Privacy wording:** on the free Gemini tier Google may use content to improve its products. The site says this. Do not claim "zero retention".
- Test with 6 scam messages and 2 genuine ones. Every scam should be Scam or Risky and both genuine ones Safe.
- Deploy a backup (Render or Cloud Run), set `GEMINI_API_KEY` in the host settings, not in code.
- Record a 60-second video of the full flow as a fallback.

## Not built yet (roadmap, shown as plans on the site)

More Indian languages, voice call practice, WhatsApp share, campus alerts.
