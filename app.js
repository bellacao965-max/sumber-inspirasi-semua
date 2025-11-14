// app.js (vanilla JS)
const chatBox = document.getElementById("chatBox");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const quoteText = document.getElementById("quoteText");
const nextQuote = document.getElementById("nextQuote");

const ytSearch = document.getElementById("ytSearch");
const ytSearchBtn = document.getElementById("ytSearchBtn");
const ytPlayer = document.getElementById("ytPlayer");
const ytResults = document.getElementById("ytResults");

const tiktokUrl = document.getElementById("tiktokUrl");
const loadTiktok = document.getElementById("loadTiktok");
const tiktokEmbed = document.getElementById("tiktokEmbed");
const instaUrl = document.getElementById("instaUrl");
const loadInsta = document.getElementById("loadInsta");
const instaEmbed = document.getElementById("instaEmbed");

// small quotes list (can be replaced with remote API)
const quotes = [
  "Kerja cerdas, bukan hanya keras.",
  "Ide besar lahir dari tindakan kecil yang konsisten.",
  "Jangan menunggu inspirasi — ciptakanlah.",
  "Gagal adalah bukti bahwa kamu berani mencoba.",
  "Sederhana adalah bentuk kecanggihan tertinggi."
];

function setQuoteRandom() {
  quoteText.textContent = quotes[Math.floor(Math.random()*quotes.length)];
}
setQuoteRandom();
nextQuote?.addEventListener("click", setQuoteRandom);

// --- Chat with backend (GPT-4 Turbo) ---
let messages = [{ role: "system", text: "Kamu adalah asisten bantuan kreatif." }];

function appendMessage(text, role="assistant"){
  const div = document.createElement("div");
  div.className = "chatMessage " + (role==="user" ? "user" : "assistant");
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if(!text) return;
  messages.push({ role: "user", text });
  appendMessage(text, "user");
  chatInput.value = "";
  appendMessage("Menunggu jawaban...", "assistant");

  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ messages })
    });
    const j = await res.json();
    // remove "Menunggu jawaban..." placeholder
    const last = chatBox.querySelectorAll(".chatMessage.assistant");
    if (last.length) last[last.length-1].remove();

    if (j.reply) {
      appendMessage(j.reply, "assistant");
      messages.push({ role: "assistant", text: j.reply });
    } else {
      appendMessage("Tidak ada balasan dari server.", "assistant");
    }
  } catch(err){
    console.error(err);
    appendMessage("Terjadi kesalahan saat menghubungi server: "+err.message, "assistant");
  }
});

// --- YouTube dynamic: allow paste URL/ID or search (requires YOUTUBE_API_KEY on server)
function extractVideoId(input){
  // If it's a full URL, extract v= or short youtu.be
  try{
    const u = new URL(input);
    if(u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    const v = u.searchParams.get("v");
    if(v) return v;
  }catch(e){}
  // fallback: maybe raw id
  return input;
}

ytSearchBtn.addEventListener("click", async () => {
  const q = ytSearch.value.trim();
  if(!q) return;
  // If it's probably a URL/ID, play directly
  const id = extractVideoId(q);
  if (id && id.length >= 6 && !q.includes(' ')) {
    // treat as ID or URL
    ytPlayer.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
    ytResults.innerHTML = "";
    return;
  }

  // Else call server-side youtube search
  ytResults.innerHTML = "Mencari...";
  try {
    const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`);
    const j = await res.json();
    ytResults.innerHTML = "";
    (j.results || []).forEach(it => {
      const card = document.createElement("div");
      card.className = "ytCard";
      card.innerHTML = `<img src="${it.thumbnail}" /><div><strong>${it.title}</strong></div>`;
      card.onclick = () => {
        ytPlayer.src = `https://www.youtube.com/embed/${it.videoId}?autoplay=1`;
      };
      ytResults.appendChild(card);
    });
    if((j.results||[]).length===0) ytResults.textContent = "Tidak ada hasil.";
  } catch(err){
    console.error(err);
    ytResults.textContent = "Error saat mencari YouTube: " + err.message;
  }
});

// --- TikTok & Instagram embeds (simple) ---
loadTiktok?.addEventListener("click", () => {
  const url = tiktokUrl.value.trim();
  if(!url) return;
  // Use tiktok embed via iframe (may be restricted by CORS/embedding policy)
  tiktokEmbed.innerHTML = `<iframe src="https://www.tiktok.com/embed/v2/${encodeURIComponent(url)}" style="width:100%;height:430px;border:0;overflow:hidden;" loading="lazy"></iframe>`;
});

loadInsta?.addEventListener("click", () => {
  const url = instaUrl.value.trim();
  if(!url) return;
  instaEmbed.innerHTML = `<iframe src="https://www.instagram.com/p/${extractInstaShortcode(url)}/embed" style="width:100%;height:430px;border:0;overflow:hidden;" loading="lazy"></iframe>`;
});

function extractInstaShortcode(url){
  try{
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[1] || parts[0] || "";
  }catch(e){ return url; }
}
