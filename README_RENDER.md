Sumber Inspirasi — Final Render-ready package (gpt-4-turbo)

Cara deploy:
1. Upload semua file ini ke GitHub repo root.
2. Di Render: Create → Web Service → Connect repo.
   - Root Directory: .
   - Build Command: npm install
   - Start Command: npm start (or node server.js)
3. Tambahkan Environment Variable di Render:
   - Key: OPENAI_API_KEY
   - Value: (paste API key dari https://platform.openai.com/api-keys)
4. Manual deploy / Clear build cache & deploy.
5. Aplikasi akan aktif. Gunakan chat & image generator.

Catatan:
- Jika tidak menambahkan OPENAI_API_KEY, fitur AI akan menggunakan fallback offline sederhana.
- Pastikan package.json ada di root sehingga Render menginstall dependencies.
