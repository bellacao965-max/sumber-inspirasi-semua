// server.js
// Simple Express server that proxies to OpenAI Chat and (optionally) YouTube Search.
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname));

// Init OpenAI client (server-side)
if (!process.env.OPENAI_API_KEY) {
  console.warn("Warning: OPENAI_API_KEY not set in .env");
}
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, time: Date.now() }));

// Chat endpoint (expects { messages: [{role:'user'|'assistant'|'system', text: '...'}] })
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // Map messages to expected format for OpenAI chat API
    const chatMessages = messages.map(m => ({
      role: m.role === 'user' ? 'user' : m.role === 'assistant' ? 'assistant' : 'system',
      content: m.text ?? m.content ?? ''
    }));

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
      messages: chatMessages,
      max_tokens: 800
    });

    const assistantReply = completion.choices?.[0]?.message?.content ?? '';
    return res.json({ reply: assistantReply, raw: completion });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Optional: Youtube search proxy (requires YOUTUBE_API_KEY in .env)
app.get('/api/youtube/search', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'q query required' });
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return res.status(500).json({ error: 'YOUTUBE_API_KEY not configured' });

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', q);
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', '6');
    url.searchParams.set('key', key);

    const r = await fetch(url.toString());
    const j = await r.json();
    const items = (j.items || []).map(it => ({
      videoId: it.id.videoId,
      title: it.snippet.title,
      thumbnail: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url
    }));
    res.json({ results: items });
  } catch (err) {
    console.error('YT search error:', err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
