import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns'; // TimeScale için gerekli
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, zoomPlugin);

// Chart için renk paleti. Her deney için bir renk, sonra gerçek/tahmin için tonlar.
const chartColors = ['#42b983', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#7e22ce', '#15803d'];

function ComparisonView({ experiments, onClose }) {

  // Ortak ChartJS seçenekleri
  const commonChartOptions = (title, isTimeScale = false) => ({
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false, },
      plugins: { 
        legend: { position: 'top', labels: { font: { size: 14 } } },
        title: { display: true, text: title, font: { size: 16, weight: 'bold' } },
        tooltip: {
          backgroundColor: 'var(--content-bg)',
          borderColor: 'var(--border-color)',
          borderWidth: 1,
          titleColor: 'var(--text-color)',
          bodyColor: 'var(--text-color)',
        },
        zoom: {
          pan: { enabled: true, mode: 'x', modifierKey: 'alt', },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
        }
      },
      scales: {
          y: { title: { display: true, text: title.includes('Kayıp') ? 'Kayıp Değeri (Loss)' : 'Değer' }, beginAtZero: false, ticks: { color: 'var(--text-color-darker)' }, grid: { color: 'var(--border-color)', borderDash: [2, 4] } }, 
          x: { 
            title: { display: true, text: isTimeScale ? 'Tarih' : 'Epoch' }, 
            grid: { display: false },
            ticks: { color: 'var(--text-color-darker)' },
            type: isTimeScale ? 'time' : 'category',
            time: isTimeScale ? { unit: 'day', tooltipFormat: 'yyyy-MM-dd' } : {},
          } 
      }
  });

  // Kayıp Grafiği Verisi
  const lossChartData = {
    labels: Array.from({ length: Math.max(...experiments.map(e => e.results?.history?.loss?.length || 0)) }, (_, i) => `E${i + 1}`),
    datasets: experiments.map((exp, i) => ({
      label: `${exp.pipeline_name} (${exp.config?.data_sourcing?.ticker || 'N/A'}) - Kayıp`,
      data: exp.results?.history?.loss || [], 
      borderColor: chartColors[i % chartColors.length],
      backgroundColor: `${chartColors[i % chartColors.length]}33`,
      tension: 0.1, fill: false, borderWidth: 2, pointRadius: 1, pointHoverRadius: 5,
    })),
  };

  // Tahmin Grafiği Verisi
  const predictionChartData = {
      // X ekseni için tüm deneylerin zaman indekslerini birleştireceğiz ve sıralayacağız
      // Veya her dataset kendi x ekseni değerlerini taşıyabilir (daha basit ve güvenilir)
      datasets: experiments.flatMap((exp, i) => {
          const currentXAxis = exp.results?.time_index || [];
          const currentYTrue = exp.results?.y_true || [];
          const currentYPred = exp.results?.y_pred || [];

          const baseColor = chartColors[i % chartColors.length];

          return [
              {
                  label: `${exp.pipeline_name} (${exp.config?.data_sourcing?.ticker || 'N/A'}) - Gerçek`,
                  data: currentYTrue.map((val, idx) => ({ x: new Date(currentXAxis[idx]), y: val })),
                  borderColor: baseColor,
                  backgroundColor: `${baseColor}33`,
                  pointRadius: 0,
                  fill: false,
                  tension: 0.1,
              },
              {
                  label: `${exp.pipeline_name} (${exp.config?.data_sourcing?.ticker || 'N/A'}) - Tahmin`,
                  data: currentYPred.map((val, idx) => ({ x: new Date(currentXAxis[idx]), y: val })),
                  borderColor: `color-mix(in srgb, ${baseColor} 50%, #fff)`, // Ana renkten biraz farklı bir ton
                  borderDash: [5, 5], // Kesikli çizgi
                  pointRadius: 0,
                  fill: false,
                  tension: 0.1,
              }
          ].filter(dataset => dataset.data.length > 0); // Verisi olmayan dataset'leri filtrele
      })
  };


  return (
    <div className="comparison-modal-overlay" onClick={onClose}>
      <div className="comparison-modal-content" onClick={e => e.stopPropagation()}>
        <div className="comparison-header">
          <h2>Deney Karşılaştırması ({experiments.length} adet)</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="comparison-body">
          {/* Kayıp Grafiği */}
          {lossChartData.datasets.some(ds => ds.data.length > 0) && (
            <div className="comparison-chart-container">
              <Line data={lossChartData} options={commonChartOptions('Eğitim Kaybı Karşılaştırması')} />
              <p className="chart-instructions">Yakınlaştırmak için fare tekerleğini kullanın. Sıfırlamak için çift tıklayın. Kaydırmak için <strong>Alt + Sürükle</strong>.</p>
            </div>
          )}

          {/* Tahmin Grafiği */}
          {predictionChartData.datasets.some(ds => ds.data.length > 0) && (
            <div className="comparison-chart-container">
              <Line data={predictionChartData} options={commonChartOptions('Tahmin Performansı Karşılaştırması', true)} />
              <p className="chart-instructions">Yakınlaştırmak için fare tekerleğini kullanın. Sıfırlamak için çift tıklayın. Kaydırmak için <strong>Alt + Sürükle</strong>.</p>
            </div>
          )}

          <h4 className="section-title" style={{ marginTop: 0 }}>Özet Tablosu</h4>
          <div className="table-container">
            <table>
              <thead><tr><th>Deney ID</th><th>Pipeline</th><th>Sembol</th><th>Epochs</th><th>LR</th><th>Final Kayıp</th><th>R² Skoru</th><th>MAE</th></tr></thead>
              <tbody>
                {experiments.map((exp, i) => (
                  <tr key={exp.experiment_id}>
                    <td><span className="color-indicator" style={{backgroundColor: chartColors[i % chartColors.length]}}></span>{exp.experiment_id.slice(0, 10)}...</td>
                    <td>{exp.pipeline_name || 'N/A'}</td>
                    <td>{exp.config?.data_sourcing?.ticker ?? 'N/A'}</td>
                    <td>{Array.isArray(exp.config?.training_params?.epochs) ? exp.config.training_params.epochs[0] : exp.config?.training_params?.epochs ?? 'N/A'}</td>
                    <td>{Array.isArray(exp.config?.training_params?.lr) ? exp.config.training_params.lr[0] : exp.config?.training_params?.lr ?? 'N/A'}</td>
                    <td>{exp.results?.final_loss?.toFixed(6) ?? 'N/A'}</td>
                    <td>{exp.results?.metrics?.r2_score?.toFixed(4) ?? 'N/A'}</td>
                    <td>{exp.results?.metrics?.mae?.toFixed(4) ?? 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
ComparisonView.propTypes = { experiments: PropTypes.array.isRequired, onClose: PropTypes.func.isRequired, };
export default ComparisonView;