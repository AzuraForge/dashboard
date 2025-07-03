# AzuraForge Dashboard

Bu proje, AzuraForge platformunun kullanıcı arayüzüdür. React ve Vite kullanılarak geliştirilmiştir.

## ✨ Ana Yetenekler

*   Sistemde mevcut olan tüm AI pipeline'larını listeleme ve yeni deneyler başlatma.
*   Geçmişte çalıştırılmış tüm deneylerin sonuçlarını görüntüleme ve filtreleme.
*   Seçilen deneyleri tek bir ekranda karşılaştırarak performanslarını analiz etme.
*   Devam eden bir deneyi, anlık kayıp ve tahmin grafikleriyle **canlı olarak takip etme**.
*   Tamamlanan deneyler için oluşturulmuş interaktif raporları görüntüleme.

---

## 🏛️ Ekosistemdeki Yeri

Bu arayüz, AzuraForge ekosisteminin bir parçasıdır. Projenin genel mimarisini, vizyonunu ve geliştirme rehberini anlamak için lütfen ana **[AzuraForge Platform Dokümantasyonuna](https://github.com/AzuraForge/platform/tree/main/docs)** başvurun.

---

## 🚀 Yerel Geliştirme Ortamı

Bu projeyi yerel ortamda çalıştırmak için, ana `platform` reposundaki **[Geliştirme Rehberi](https://github.com/AzuraForge/platform/blob/main/docs/DEVELOPMENT_GUIDE.md)**'ni takip ederek genel ortamı kurun.

Proje bağımlılıkları kurulduktan sonra, aşağıdaki komutlarla geliştirme sunucusunu başlatabilirsiniz:

```bash
# dashboard/ kök dizinindeyken
npm run dev
```
Uygulama `http://localhost:5173` adresinde erişilebilir olacaktır.

**Not:** Dashboard'un tam olarak çalışabilmesi için `api` servisinin `http://localhost:8000` adresinde çalışıyor olması gerekmektedir.
