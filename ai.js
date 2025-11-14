(function(global){
  async function askAI(prompt, opts={}){
    try {
      const res = await fetch('/api/ai', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({prompt, max_tokens: opts.max_tokens||600})
      });
      if (res.ok) {
        const j = await res.json();
        return j.text || JSON.stringify(j);
      }
    } catch (e) { console.error('AI fetch error', e); }
    return "Offline fallback: sambungkan OPENAI_API_KEY di Render untuk jawaban penuh.";
  }

  async function genImage(prompt){
    try {
      const res = await fetch('/api/image', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({prompt})
      });
      const j = await res.json();
      if (j.url) return j.url;
      if (j.b64) return 'data:image/png;base64,' + j.b64;
      return null;
    } catch(e){ console.error('Image fetch error', e); return null; }
  }

  global.SI = { askAI, genImage };
})(window);