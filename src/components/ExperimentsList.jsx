// ========== DOSYA: dashboard/src/components/ExperimentsList.jsx ==========
import { useState, useEffect } from 'react';
import { fetchExperiments } from '../services/api';

function ExperimentsList() {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getExperiments = async () => {
      try {
        const response = await fetchExperiments();
        setExperiments(response.data);
        setError(null);
      } catch (err) {
        setError('API sunucusuna bağlanılamadı. Servisin çalıştığından emin olun.');
        console.error(err);
      } finally {
        if (loading) setLoading(false); // Sadece ilk yüklemede loading'i kapat
      }
    };
    
    getExperiments(); // İlk yüklemede çalıştır
    const intervalId = setInterval(getExperiments, 5000); // Her 5 saniyede bir veriyi yenile
    
    return () => clearInterval(intervalId); // Bileşen kaldırıldığında interval'i temizle
  }, [loading]); // 'loading' state'i değiştiğinde effect'i yeniden çalıştır

  if (loading) return <p>Deneyler yükleniyor...</p>;
  if (error) return <p className="error">{error}</p>;
  if (experiments.length === 0) return <p>Henüz bir deney bulunamadı. "Yeni Deney Başlat" sekmesinden bir tane oluşturun.</p>;

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Deney ID</th>
            <th>Durum</th>
            <th>Pipeline</th>
            <th>Sembol</th>
            <th>Kayıp</th>
          </tr>
        </thead>
        <tbody>
          {experiments.map((exp) => (
            <tr key={exp.id}>
              <td className="exp-id">{exp.id}</td>
              <td><span className={`status-badge status-${exp.status?.toLowerCase() || 'unknown'}`}>{exp.status || 'Bilinmiyor'}</span></td>
              <td>{exp.pipeline_name || exp.pipeline || 'N/A'}</td> {/* pipeline_name veya pipeline */}
              <td>{exp.ticker || 'N/A'}</td>
              <td>{exp.final_loss !== undefined && exp.final_loss !== null ? exp.final_loss.toFixed(6) : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ExperimentsList;