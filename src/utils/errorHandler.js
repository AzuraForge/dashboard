import { toast } from 'react-toastify';

const ERROR_MESSAGES = {
  // API Hataları
  "PIPELINE_NOT_FOUND": "Seçilen pipeline sistemde bulunamadı.",
  "CONFIG_NOT_FOUND": "Seçilen pipeline için varsayılan konfigürasyon yüklenemedi.",
  "EXPERIMENT_NOT_FOUND": "Deney bulunamadı. Sayfayı yenilemeyi deneyin.",
  "PREDICTION_TASK_FAILED": (message) => `Tahmin görevi başarısız oldu: ${message}`,

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
  
  // === DÜZELTME: error.response nesnesinin varlığını kontrol et ===
  if (error.response && error.response.data && error.response.data.detail) {
      const detail = error.response.data.detail;
      if (typeof detail === 'string') {
          displayMessage = ERROR_MESSAGES[detail] || detail;
      } else if (typeof detail === 'object' && detail.error_code) {
          const { error_code, message } = detail;
          const messageGenerator = ERROR_MESSAGES[error_code];
          displayMessage = typeof messageGenerator === 'function' 
              ? messageGenerator(message) 
              : (messageGenerator || message || ERROR_MESSAGES.DEFAULT_ERROR);
      } else {
          displayMessage = JSON.stringify(detail);
      }
  } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      displayMessage = ERROR_MESSAGES.NETWORK_ERROR;
  } else {
      displayMessage = error.message || ERROR_MESSAGES.DEFAULT_ERROR;
  }
  
  console.error(`Hata (${context}):`, error);
  toast.error(displayMessage);
};