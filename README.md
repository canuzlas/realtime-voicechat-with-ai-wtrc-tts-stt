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

Fixes

- Ensure Register button visible on Home: added explicit Register buttons to the navbar and quick-start card so "Sign up" is accessible on desktop and mobile.

## Running with Docker

If you want to run the backend and MongoDB using Docker Compose, a `docker-compose.yml` is included at the repository root. It builds the server image from `./server/Dockerfile` and starts a MongoDB service.

Start the stack:

```bash
docker compose up --build
```

Stop and remove the stack:

```bash
docker compose down
```

Remove all containers and images (CAUTION: affects all Docker containers/images on the host):

```bash
# Stop and remove containers
docker stop $(docker ps -aq) || true
docker rm -f $(docker ps -aq) || true

# Remove all images
docker rmi -f $(docker images -q) || true

# Prune volumes
docker volume prune -f || true
```
