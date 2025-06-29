// ========== GÜNCELLENECEK DOSYA: dashboard/src/components/ExperimentsList.jsx (Tıklanabilir Satırlar) ==========
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Link bileşeni import edildi
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
        if (loading) setLoading(false);
      }
    };
    
    getExperiments();
    const intervalId = setInterval(getExperiments, 5000);
    
    return () => clearInterval(intervalId);
  }, [loading]);

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
            // Her bir satırı tıklanabilir hale getirmek için Link bileşenini kullanıyoruz
            <tr key={exp.id}>
              {/* Deney ID'sine göre detay sayfasına yönlendirme */}
              <td className="exp-id clickable-cell" onClick={() => {}}> {/* onClick={() => {}} satırı tıklanabilir yapmak için eklenir, Link bunu zaten yapar */}
                <Link to={`/experiments/${exp.id}`}>
                  {exp.id}
                </Link>
              </td>
              <td><span className={`status-badge status-${exp.status?.toLowerCase() || 'unknown'}`}>{exp.status || 'Bilinmiyor'}</span></td>
              <td>{exp.pipeline_name || exp.pipeline || 'N/A'}</td>
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