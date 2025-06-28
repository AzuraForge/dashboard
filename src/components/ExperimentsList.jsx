// ========== DOSYA: src/components/ExperimentsList.jsx ==========
import { useState, useEffect } from 'react';
import { fetchExperiments } from '../services/api';

function ExperimentsList() {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getExperiments = async () => {
      // Sadece ilk yüklemede loading state'ini ayarla
      if (loading) {
        try {
          const response = await fetchExperiments();
          setExperiments(response.data);
          setError(null);
        } catch (err) {
          setError('API sunucusuna bağlanılamadı. Servisin çalıştığından emin olun.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        // Sonraki güncellemelerde sessizce yap
        try {
          const response = await fetchExperiments();
          setExperiments(response.data);
        } catch (err) {
          console.error("Could not refresh experiments:", err);
        }
      }
    };
    
    getExperiments(); // İlk yüklemede çalıştır
    const intervalId = setInterval(getExperiments, 5000); // Her 5 saniyede bir veriyi yenile
    
    return () => clearInterval(intervalId); // Bileşen kaldırıldığında interval'i temizle
  }, []); // Bağımlılık dizisi boş olduğu için sadece mount/unmount'ta çalışır

  if (loading) return <p>Deneyler yükleniyor...</p>;
  if (error) return <p className="error">{error}</p>;
  if (experiments.length === 0) return <p>Henüz bir deney bulunamadı. Yeni bir tane başlatın!</p>;

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Deney ID</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {experiments.map((exp) => (
            <tr key={exp.task_id || exp.id}>
              <td className="exp-id">{exp.task_id || exp.id}</td>
              <td><span className={`status-badge status-${exp.status?.toLowerCase() || 'unknown'}`}>{exp.status || 'Bilinmiyor'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ExperimentsList;