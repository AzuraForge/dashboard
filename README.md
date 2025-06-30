# AzuraForge Dashboard

Bu proje, AzuraForge platformunun kullanıcı arayüzüdür. React ve Vite kullanılarak geliştirilmiştir.

## ✨ Ana Yetenekler

*   Sistemde mevcut olan tüm AI pipeline'larını listeleme ve yeni deneyler başlatma.
*   Geçmişte çalıştırılmış tüm deneylerin sonuçlarını görüntüleme ve filtreleme.
*   Seçilen deneyleri tek bir ekranda karşılaştırarak performanslarını analiz etme.
*   Devam eden bir deneyi, anlık kayıp ve tahmin grafikleriyle **canlı olarak takip etme**.
*   Tamamlanan deneyler için oluşturulmuş interaktif raporları görüntüleme.

## 🚀 Yerel Geliştirme Ortamı

Bu projeyi yerel ortamda çalıştırmak için, ana `platform` reposundaki **[Geliştirme Rehberi](../../platform/docs/DEVELOPMENT_GUIDE.md)**'ni takip edin.

Proje bağımlılıkları kurulduktan sonra, aşağıdaki komutlarla geliştirme sunucusunu başlatabilir ve testleri çalıştırabilirsiniz.

**Geliştirme Sunucusunu Başlatma:**
```bash
# dashboard/ kök dizinindeyken
npm run dev
```
Uygulama `http://localhost:5173` adresinde erişilebilir olacaktır.

**Lint Kontrolü:**
```bash
npm run lint
```

**Not:** Dashboard'un tam olarak çalışabilmesi için `api` servisinin `http://localhost:8000` adresinde çalışıyor olması gerekmektedir.
```
