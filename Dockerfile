# ========== GÜNCEL VE KAPSAMLI DÜZELTME: dashboard/Dockerfile ==========

# Node.js LTS sürümünü Alpine Linux üzerinde kullan
FROM node:22-alpine AS dashboard_builder

# Çalışma dizinini ayarla
WORKDIR /app

# package.json ve package-lock.json dosyalarını kopyala
# Bu adım, host makinenizdeki dosyaları Docker container'ına taşır.
COPY package.json package-lock.json ./

# KRİTİK DÜZELTME 1: Host'tan gelen package-lock.json'ı sil.
# Bu, npm'in container'ın kendi Linux ortamına uygun, yeni bir package-lock.json oluşturmasını sağlar.
# Bu adımın cache tarafından atlanmadığından emin olmak için sonraki build adımları önemlidir.
RUN rm -f package-lock.json

# KRİTİK DÜZELTME 2: npm cache'ini temizle
# Bu, npm'in eski veya bozuk cache verilerini kullanmasını engeller.
RUN npm cache clean --force

# KRİTİK DÜZELTME 3: Bağımlılıkları yükle.
# Bu adım, container ortamında sıfırdan bir kurulum yapar ve Rollup'ın doğru binary'sini indirmesini sağlar.
# Bu işlem, yeni ve doğru bir package-lock.json dosyası da oluşturacaktır.
RUN npm install --verbose

# Geri kalan uygulama kodunu kopyala
# .dockerignore dosyası varsa, buraya kopyalanacaklar filtrelecektir.
COPY . .

# Vite geliştirme sunucusunu başlatmak için komut.
# docker-compose.yml tarafından override edildiği için burada CMD satırı aslında çalışmaz.
# Ancak iyi bir practice olarak tutulur.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Dashboard servisi 5173 portunda çalışır
EXPOSE 5173