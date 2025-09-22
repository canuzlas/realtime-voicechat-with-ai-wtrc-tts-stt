Server (Express)

API Endpoints

- POST /auth/login  { email } -> { token }
- POST /chat/message  { message }  (Authorization: Bearer <token>) -> { reply }

Çalıştırma (Quick start)

1. `cd server`
2. `npm install`
3. `.env.example` dosyasını kopyalayın ve `.env` oluşturun:

	 cp .env.example .env

	 Ardından `.env` içindeki `JWT_SECRET` değerini belirleyin.
4. `npm start`

WebRTC sunucu (peer) olarak çalışma

Sunucunun tarayıcıdan gelen WebRTC offer'larını kabul edip answer göndermesini isterseniz native `wrtc` modülü gerekli olabilir. `wrtc` kurulumu platforma özgü derleme araçları veya önceden derlenmiş ikili dosyalar (prebuilt binaries) gerektirebilir.

- macOS kullanıyorsanız Xcode Komut Satırı Araçlarının yüklü olduğundan emin olun:

	xcode-select --install

- Desteklenen bir Node.js sürümü kullanın (LTS — ör. 18 veya 20 önerilir).

- Eğer `wrtc` için `npm install` hata verirse, aşağıdaki gibi `node-pre-gyp` yardımcı paketini global olarak yüklemeyi deneyin:

	npm install -g node-pre-gyp

	Sonra tekrar:

	cd server
	npm install

Alternatif (native modüllerden kaçınmak)

Native modüllerle uğraşmak istemezseniz, proje socket.io tabanlı bir ses akışı yedekleme (fallback) mekanizması içerir. `stream-audio`, `finalize-audio`, `request-tts` gibi event'ler ile native derlemeye gerek kalmadan çalışır.

Docker (isteğe bağlı)

Sunucuyu Docker içinde çalıştırmak isterseniz (Dockerfile Node 18 tabanlı bir imaj kullanır ve build araçlarını yükler):

	# depodan kök dizinde çalıştırın
	docker build -f server/Dockerfile -t chat-server ./server
	docker run -p 4000:4000 --env-file ./server/.env chat-server

Notlar

- `.env` içinde `JWT_SECRET` anahtarını güvenli bir değerle ayarlayın; bu token imzalama/verify işlemleri için gereklidir.
- WebRTC, platform derlemeleri ve Node sürümleriyle ilgili sorunlar çıkarsa `server/README.md` içeriğini takip ederek hata mesajlarına göre ek adımlar izleyin.

