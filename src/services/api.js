// ========== GÜNCELLENECEK DOSYA: dashboard/src/services/api.js ==========

import axios from 'axios';

// API sunucumuzun adresini merkezi bir yerden alıyoruz
const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Tüm tamamlanmış/çalışan deney görevlerini API'dan çeker.
 */
export const fetchExperiments = () => {
  return apiClient.get('/experiments/');
};

/**
 * Yeni bir deneyi başlatmak için API'a istek gönderir.
 * @param {object} config - Deney konfigürasyonu
 */
export const startNewExperiment = (config) => {
  return apiClient.post('/experiments/', config);
};

// --- YENİ EKLENEN FONKSİYON ---
/**
 * Platformda kurulu ve keşfedilmiş tüm pipeline'ları ve varsayılan 
 * konfigürasyonlarını API'dan çeker.
 */
export const fetchAvailablePipelines = () => {
  // Bu, API'da oluşturduğumuz yeni '/pipelines' endpoint'ine istek atar.
  return apiClient.get('/experiments/pipelines');
};

// --- API'mızda Task Durumunu Sorgulamak İçin Eklediğimiz Fonksiyonlar ---
/**
 * Belirli bir görevin durumunu sorgular.
 * @param {string} taskId - Celery görev ID'si
 */
export const getTaskStatus = (taskId) => {
  return apiClient.get(`/experiments/${taskId}/status`);
};