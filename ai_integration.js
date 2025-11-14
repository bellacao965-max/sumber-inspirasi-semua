// ai_integration.js
// Generic client-side wrapper to call an AI backend via a proxy endpoint: /api/ai
// This file does NOT contain any API keys. The server/proxy must add keys and forward requests
// to the chosen provider (openai or grok). Configure provider in `AI_CONFIG` below.
const AI_CONFIG = {
  provider: "grok", // "grok" or "openai"
  // If you run a local or hosted proxy, set proxyBase to that URL (no trailing slash).
  // Example: "https://mydomain.com" or "" for same origin.
  proxyBase: "" // default: same origin so calls go to /api/ai
};

// sendMessage: sends a user message and returns provider response (string)
// The proxy is expected to accept JSON { provider, model, input } and return { success, result, error }
export async function sendMessage(userText, opts = {}) {
  const payload = {
    provider: AI_CONFIG.provider,
    model: opts.model || (AI_CONFIG.provider === "grok" ? "grok-1" : "gpt-4o-mini"),
    input: userText,
    // pass any additional metadata if needed
    meta: opts.meta || {}
  };
  const url = (AI_CONFIG.proxyBase || "") + "/api/ai";
  const res = await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Proxy error ${res.status}: ${text}`);
  }
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Unknown AI proxy error");
  return data.result;
}

// Simple helper to attach to a chat UI
export function attachChatUI({formSelector, inputSelector, messagesContainerSelector}) {
  const form = document.querySelector(formSelector);
  const input = document.querySelector(inputSelector);
  const container = document.querySelector(messagesContainerSelector);
  if (!form || !input || !container) {
    console.warn("Chat UI selectors not found for attachChatUI");
    return;
  }
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    // append user message
    const userEl = document.createElement("div"); userEl.className="msg user"; userEl.textContent = text;
    container.appendChild(userEl);
    input.value = "";
    try {
      const aiText = await sendMessage(text);
      const aiEl = document.createElement("div"); aiEl.className="msg ai"; aiEl.textContent = aiText;
      container.appendChild(aiEl);
      container.scrollTop = container.scrollHeight;
    } catch (err) {
      const errEl = document.createElement("div"); errEl.className="msg error"; errEl.textContent = "Error: "+err.message;
      container.appendChild(errEl);
      console.error(err);
    }
  });
}
