// ========== GÜNCELLENECEK DOSYA: dashboard/src/components/ExperimentsList.jsx ==========
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
        setError('API sunucusuna bağlanılamadı.');
      } finally {
        if (loading) setLoading(false);
      }
    };
    
    getExperiments();
    const intervalId = setInterval(getExperiments, 5000); 
    
    return () => clearInterval(intervalId);
  }, [loading]); // `loading`'i bağımlılık dizisine ekledim, bu daha doğru bir kullanım

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
          </tr>
        </thead>
        <tbody>
          {experiments.map((exp) => (
            <tr key={exp.id}>
              <td className="exp-id">{exp.id}</td>
              <td><span className={`status-badge status-${exp.status?.toLowerCase() || 'unknown'}`}>{exp.status || 'Bilinmiyor'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- EKSİK OLAN SATIR ---
export default ExperimentsList;