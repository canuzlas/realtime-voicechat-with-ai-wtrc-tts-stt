# English Chat Bot (Vite + React + Tailwind)

Bu depo, basit bir giriş formu ve yer tutucu bir sohbet sayfası içeren küçük bir starter (başlangıç) projesidir. Proje Vite, React ve TailwindCSS kullanır ve geliştirilmeye açık bir demo chat uygulaması sunar.

Hızlı başlangıç

1. Bağımlılıkları yükleyin:

	npm install

2. Geliştirme sunucusunu başlatın:

	npm run dev

3. Tarayıcıda açın: http://localhost:5173 (Vite varsayılan portu)

Sunucu (API)

Projede basit bir Express sunucusu bulunur: `server` klasörü. API ve WebRTC destekleri için sunucuyu çalıştırmak isterseniz aşağıdaki adımları izleyin:

1. `cd server`
2. `npm install`
3. `cp .env.example .env` ve `.env` içindeki `JWT_SECRET` değerini ayarlayın
4. `npm start`

Önemli dosyalar

- `src/components/LoginForm.jsx` - e-posta/şifre ile giriş formu
- `src/components/ChatPage.jsx` - sohbet arayüzü için yer tutucu sayfa
- `server/` - Express tabanlı API ve (isteğe bağlı) WebRTC peer kodu

Notlar

- Sunucu klasörü içinde WebRTC peer olmak için native `wrtc` modülü gerekebilir (platforma bağlı derleme/ikili dosya gereksinimleri olabilir). `server/README.md` içinde daha fazla ayrıntı ve Docker talimatları yer almaktadır.
- Bu proje öğrenme ve prototipleme amaçlıdır; üretime almadan önce kimlik doğrulama, güvenlik ve hata yönetimi kontrolleri ekleyin.
