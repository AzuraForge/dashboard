# DOSYA: dashboard/Dockerfile
# Node.js LTS sürümünü Alpine Linux üzerinde kullanıyoruz. Alpine, küçük ve güvenli olduğu için idealdir.
FROM node:22-alpine

# Çalışma dizinini ayarla
WORKDIR /app

# Önce SADECE package.json dosyasını kopyala. package-lock.json'ı kopyalama.
# Docker'ın katman önbellekleme (layer caching) özelliğinden faydalanmak için
# en az değişen dosyaları en başa koyarız.
COPY package.json ./

# KRİTİK ADIM: Bağımlılıkları konteyner içinde, sıfırdan kur.
# Bu, npm'in konteynerin Alpine Linux ortamına uygun binary'leri
# (örn: @rollup/rollup-linux-x64-musl) indirmesini ve doğru bir
# package-lock.json oluşturmasını garanti eder.
# --verbose flag'ı, olası hataları görmek için eklenmiştir.
RUN npm install --verbose

# Bağımlılıklar kurulduktan sonra, geri kalan tüm uygulama kodunu kopyala.
# Bu, kodda yaptığınız her değişiklikte 'npm install' adımının tekrar çalışmasını engeller.
COPY . .

# Dashboard servisi 5173 portunda çalışacak
EXPOSE 5173

# Vite geliştirme sunucusunu başlatmak için varsayılan komut.
# Bu, docker-compose.yml'de override edilebilir ama burada olması iyi bir pratiktir.
CMD ["npm", "run", "dev"]