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
        // API'dan gelen sahte veriyi gerçekçi hale getirelim
        const formattedData = response.data.map(exp => ({
          ...exp,
          pipeline: exp.name?.split('_')[0] || 'N/A',
        }));
        setExperiments(formattedData);
        setError(null);
      } catch (err) {
        setError('API sunucusuna bağlanılamadı.');
      } finally {
        setLoading(false);
      }
    };
    
    getExperiments(); // İlk yüklemede çalıştır
    const intervalId = setInterval(getExperiments, 5000); // Her 5 saniyede bir veriyi yenile
    
    return () => clearInterval(intervalId); // Bileşen kaldırıldığında interval'i temizle
  }, []);

  if (loading) return <p>Yükleniyor...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Pipeline</th>
            <th>Durum</th>
            <th>Deney ID</th>
          </tr>
        </thead>
        <tbody>
          {experiments.map((exp) => (
            <tr key={exp.id}>
              <td>{exp.pipeline}</td>
              <td><span className={`status-badge status-${exp.status}`}>{exp.status}</span></td>
              <td className="exp-id">{exp.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ExperimentsList;