import { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart } from 'chart.js';
import 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';
import { getCssVar } from '../utils/cssUtils'; // YENİ: Yardımcı fonksiyonu import et

Chart.register(annotationPlugin);

function LiveTrackerPane({ taskId, onClose }) {
  const [statusData, setStatusData] = useState({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [pingAnnotation, setPingAnnotation] = useState(null);
  
  const socketRef = useRef(null);
  
  // --- GRAFİK SEÇENEKLERİ NİHAİ SÜRÜM ---
  // useMemo kullanarak, bu seçeneklerin sadece bir kez hesaplanmasını sağlıyoruz.
  const chartOptions = useMemo(() => {
    // CSS değişkenlerinden renkleri al
    const primaryColor = getCssVar('--primary-color');
    const textColor = getCssVar('--text-color');
    const textColorDarker = getCssVar('--text-color-darker');
    const borderColor = getCssVar('--border-color');
    const contentBg = getCssVar('--content-bg');

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300, easing: 'linear' },
      plugins: { 
        legend: { display: false }, 
        tooltip: {
          enabled: true,
          backgroundColor: contentBg,
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: borderColor,
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            title: (context) => context[0].label,
            label: (context) => `Kayıp: ${context.parsed.y.toFixed(6)}`,
          }
        },
        annotation: {
          animations: { numbers: { properties: ['radius'], duration: 1000 } },
          annotations: { ...(pingAnnotation && { ping: pingAnnotation }) }
        }
      },
      scales: { 
        y: { 
          grid: { color: borderColor, borderDash: [2, 4], drawTicks: false },
          ticks: { padding: 10, maxTicksLimit: 5, font: { size: 12 }, color: textColorDarker },
        }, 
        x: {
          grid: { display: false },
          ticks: { padding: 10, maxRotation: 0, autoSkip: true, maxTicksLimit: 7, font: { size: 12 }, color: textColorDarker },
        } 
      }
    };
  }, [pingAnnotation]); // Sadece ping animasyonu değiştiğinde seçenekleri yeniden hesapla

  useEffect(() => {
    if (!taskId) return;

    setStatusData({ state: 'CONNECTING', details: { status_text: 'Worker\'a bağlanılıyor...' } });
    
    // Dataset'i renklerle birlikte başlangıçta ayarla
    setChartData({
      labels: [],
      datasets: [{
        label: 'Eğitim Kaybı', data: [],
        fill: true,
        borderColor: getCssVar('--primary-color'),
        backgroundColor: 'color-mix(in srgb, ' + getCssVar('--primary-color') + ' 20%, transparent)',
        tension: 0.4, borderWidth: 2,
        pointRadius: (ctx) => ctx.dataIndex === ctx.dataset.data.length - 1 ? 6 : 0,
        pointBorderColor: getCssVar('--text-inverse'),
        pointBackgroundColor: getCssVar('--primary-color'),
        pointHoverRadius: 8,
      }]
    });

    const newSocket = new WebSocket(`ws://localhost:8000/ws/task_status/${taskId}`);
    socketRef.current = newSocket;
    
    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatusData(data);
      
      if (data.state === 'PROGRESS' && data.details?.loss !== undefined) {
        setChartData(prev => {
          const epochLabel = `E${data.details.epoch}`;
          if (prev.labels.includes(epochLabel)) return prev;
          const newLabels = [...prev.labels, epochLabel].slice(-30);
          const newLossData = [...prev.datasets[0].data, data.details.loss].slice(-30);
          setPingAnnotation({
            type: 'point', xValue: epochLabel, yValue: data.details.loss,
            radius: 15, backgroundColor: 'color-mix(in srgb, ' + getCssVar('--primary-color') + ' 25%, transparent)',
            borderColor: getCssVar('--primary-color'), borderWidth: 2, borderDash: [6, 6]
          });
          setTimeout(() => setPingAnnotation(null), 1000);
          return { ...prev, datasets: [{ ...prev.datasets[0], data: newLossData }], labels: newLabels };
        });
      } else if (data.result?.results?.loss) {
        const finalLossHistory = data.result.results.loss;
        setChartData(prev => ({
          ...prev,
          labels: Array.from({ length: finalLossHistory.length }, (_, i) => `E${i + 1}`),
          datasets: [{ ...prev.datasets[0], data: finalLossHistory }]
        }));
      }
    };
    
    newSocket.onerror = () => setStatusData({ state: 'ERROR', details: { status_text: 'WebSocket bağlantı hatası!' } });
    newSocket.onclose = () => setStatusData(prev => (['SUCCESS', 'FAILURE', 'ERROR'].includes(prev.state)) ? prev : { ...prev, state: 'DISCONNECTED' });
    
    return () => { newSocket.close(1000, "Component unmounting"); };
  }, [taskId]);
  
  const { state, details, result } = statusData;
  const { pipeline_name, data_sourcing } = details?.config || result?.config || {};
  const { total_epochs, epoch, status_text } = details || {};
  const progressPercent = state === 'SUCCESS' ? 100 : (total_epochs ? (epoch / total_epochs) * 100 : 0);
  
  return (
    <div className="live-tracker-pane">
      <button className="close-button" onClick={onClose}>×</button>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
        <h4><span role="img" aria-label="satellite">🛰️</span> Canlı Takip: {pipeline_name || "..."} {data_sourcing?.ticker && `(${data_sourcing.ticker})`}</h4>
        <div><span className="exp-id">ID: {taskId}</span><span className={`status-badge status-${state?.toLowerCase()}`}>{state}</span></div>
      </div>
      <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
        <div style={{flex: 1}}><p>{status_text || state}</p><progress value={progressPercent} max="100" style={{width: '100%'}}></progress></div>
        <div style={{flex: 2, height: '100px'}}>
          {chartData.labels.length > 0 && <Line data={chartData} options={chartOptions} />}
        </div>
      </div>
      {state === 'FAILURE' && result?.error && <p className="feedback error" style={{marginTop: '15px', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto'}}>{result.error}</p>}
    </div>
  );
}

LiveTrackerPane.propTypes = { 
  taskId: PropTypes.string.isRequired, 
  onClose: PropTypes.func.isRequired, 
};

export default LiveTrackerPane;