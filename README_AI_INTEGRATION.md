# AI Integration (OpenAI <-> Grok) — Instructions

This update adds a client-side **AI wrapper** (`ai_integration.js`) that calls a small **proxy endpoint** (`/api/ai`) on your server.
The proxy is responsible for calling the real provider (OpenAI or Grok) with your API keys — **do not put API keys in client-side code**.

## What changed
- `ai_integration.js` — a generic wrapper supporting providers `grok` and `openai` (no keys, uses proxy).
- `README.md` (this file) — usage and server proxy examples.
- The project was zipped to `SumberInspirasi_fixed_ai_integration.zip` for download.

## How it works (recommended architecture)
1. Client (browser) posts to your server: `POST /api/ai` with JSON `{ provider, model, input }`.
2. Server reads provider and forwards the request to the provider's API using a server-side API key.
3. Server returns `{ success: true, result: "..." }` or `{ success: false, error: "..." }` to the client.

## Proxy example (Node.js + Express)
Install dependencies:
```bash
npm init -y
npm install express node-fetch
```

Example `server.js` (replace placeholders, keep keys secret):
```js
const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

// load keys from env
const OPENAI_KEY = process.env.OPENAI_KEY;
const GROK_KEY = process.env.GROK_KEY;

app.post('/api/ai', async (req, res) => {
  try {
    const {provider, model, input} = req.body;
    if (!provider || !input) return res.status(400).json({success:false, error:'Missing provider or input'});

    if (provider === 'openai') {
      // Example for OpenAI (Chat completions or new API)
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [{role:'user', content: input}]
        })
      });
      const j = await r.json();
      // adapt to response shape
      const text = j.choices?.[0]?.message?.content ?? JSON.stringify(j);
      return res.json({success:true, result: text});
    } else if (provider === 'grok') {
      // Example for Grok (xAI) - check xAI docs for exact endpoints and request format
      const r = await fetch('https://api.grok.ai/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROK_KEY}` },
        body: JSON.stringify({ model: model || 'grok-1', input })
      });
      const j = await r.json();
      const text = j.output?.[0]?.content ?? JSON.stringify(j);
      return res.json({success:true, result: text});
    } else {
      return res.status(400).json({success:false, error:'Unknown provider'});
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({success:false, error: err.message});
  }
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log('AI proxy listening on', port));
```

## How to enable in your site
1. Put `ai_integration.js` into your site's JS folder.
2. In your HTML, load it as a module and attach to UI:
```html
<script type="module">
  import { attachChatUI } from '/js/ai_integration.js';
  attachChatUI({ formSelector:'#chat-form', inputSelector:'#chat-input', messagesContainerSelector:'#chat-messages' });
</script>
```
3. Set provider in `AI_CONFIG` inside `ai_integration.js` to `"grok"` (or `"openai"`).
4. Deploy the proxy (server.js) to your host (Heroku, Vercel serverless function, render, etc.) and set env vars `GROK_KEY` / `OPENAI_KEY`.

## Notes & troubleshooting
- If your previous ChatGPT (gpt-4-turbo) integration "didn't appear", it might have been because the client tried to call the provider directly from browser — browsers block secret keys and CORS can fail. Use the proxy approach.
- Confirm the exact Grok API URL and response shape from xAI docs — adjust the proxy code accordingly.
- Keep API keys secret and rotate if accidentally committed.
