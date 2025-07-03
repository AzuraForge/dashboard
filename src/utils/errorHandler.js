import { toast } from 'react-toastify';

const ERROR_MESSAGES = {
  // API Hataları
  "PIPELINE_NOT_FOUND": "Seçilen pipeline sistemde bulunamadı.",
  "CONFIG_NOT_FOUND": "Seçilen pipeline için varsayılan konfigürasyon yüklenemedi.",
  "EXPERIMENT_NOT_FOUND": "Deney bulunamadı. Sayfayı yenilemeyi deneyin.",

  // Worker Pipeline Hataları
  "PIPELINE_VALUE_ERROR": (message) => `Pipeline Değer Hatası: "${message}". Lütfen girdi parametrelerinizi kontrol edin.`,
  "PIPELINE_FILE_NOT_FOUND": (message) => `Dosya Bulunamadı: "${message}".`,
  "PIPELINE_EXECUTION_ERROR": (message) => `Deney Sırasında Hata: "${message}".`,
  
  // Auth Hataları
  "Incorrect username or password": "Kullanıcı adı veya parola hatalı.",
  "Could not validate credentials": "Oturum doğrulanamadı. Lütfen tekrar giriş yapın.",
  "Username already registered": "Bu kullanıcı adı zaten kayıtlı.",

  // Genel Hatalar
  "NETWORK_ERROR": "Sunucuya ulaşılamıyor. İnternet bağlantınızı veya sunucu durumunu kontrol edin.",
  "DEFAULT_ERROR": "Bilinmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin."
};

/**
 * API'den gelen hata nesnesini işler ve kullanıcıya anlamlı bir bildirim gösterir.
 * @param {Error} error - Yakalanan hata nesnesi.
 * @param {string} context - Hatanın oluştuğu bağlam (örn: "deney başlatma").
 */
export const handleApiError = (error, context = "bir işlem") => {
  let displayMessage;
  let detailMessage = null;

  if (error.response && error.response.data && error.response.data.detail) {
      detailMessage = error.response.data.detail;
  }
  
  if (typeof detailMessage === 'string') {
      // FastAPI'nin standart string hataları için
      displayMessage = ERROR_MESSAGES[detailMessage] || detailMessage;
  } else if (typeof detailMessage === 'object' && detailMessage.error_code) {
      // Bizim özel AzuraForgeException formatımız için
      const { error_code, message } = detailMessage;
      const messageGenerator = ERROR_MESSAGES[error_code];
      displayMessage = typeof messageGenerator === 'function' ? messageGenerator(message) : (messageGenerator || message);
  } else if (error.code === 'ERR_NETWORK') {
    displayMessage = ERROR_MESSAGES.NETWORK_ERROR;
  } else {
    displayMessage = error.message || ERROR_MESSAGES.DEFAULT_ERROR;
  }
  
  console.error(`Hata (${context}):`, error);
  toast.error(displayMessage);
};