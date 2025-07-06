# Node.js LTS sürümünü Alpine Linux üzerinde kullan
FROM node:22-alpine AS dashboard_builder

# Çalışma dizinini ayarla
WORKDIR /app

# package.json ve package-lock.json dosyalarını kopyala
COPY package.json package-lock.json ./

# package-lock.json dosyasını sil (npm'in kendi ortamına uygun olarak yeniden oluşturması için)
RUN rm -f package-lock.json

# npm cache temizle
RUN npm cache clean --force

# Bağımlılıkları yükle (container ortamında)
RUN npm install --verbose

# Uygulama kodunu kopyala
COPY . .

# Vite geliştirme sunucusunu başlatmak için komut
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Dashboard servisi 5173 portunda çalışır
EXPOSE 5173
