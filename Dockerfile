# ========== DOSYA: dashboard/Dockerfile ==========
FROM node:22-alpine

WORKDIR /app

# package.json ve package-lock.json'ı kopyala ve bağımlılıkları kur
COPY package.json .
COPY package-lock.json .
RUN npm install

# Uygulamanın geri kalan kodunu kopyala
COPY . .

# Vite geliştirme sunucusunu başlat
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]