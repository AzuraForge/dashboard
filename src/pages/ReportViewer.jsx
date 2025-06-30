// dashboard/src/pages/ReportViewer.jsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, TimeScale, Title, Tooltip, Legend } from 'chart.js';
import 'chartjs-adapter-date-fns'; // Zaman serisi için adaptör
import { fetchExperimentDetails } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, TimeScale, Title, Tooltip, Legend);

const chartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'top' },
        title: { display: true, text: title, font: { size: 16 } }
    }
});

function ReportViewer() {
    const { experimentId } = useParams();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getDetails = async () => {
            setLoading(true);
            try {
                const response = await fetchExperimentDetails(experimentId);
                setDetails(response.data);
                setError(null);
            } catch (err) {
                setError(`Rapor detayları yüklenemedi: ${err.response?.data?.detail || err.message}`);
            } finally {
                setLoading(false);
            }
        };
        getDetails();
    }, [experimentId]);

    if (loading) return <div className="card"><p>Rapor Yükleniyor...</p></div>;
    if (error) return <div className="card" style={{borderColor: 'var(--error-color)'}}><p>{error}</p><Link to="/">Geri Dön</Link></div>;
    if (!details) return <div className="card"><p>Deney detayı bulunamadı.</p></div>;

    const { config, results } = details;
    const lossHistory = results?.history?.loss || [];
    const predictionData = {
        labels: results?.time_index || [],
        datasets: [
            {
                label: 'Gerçek Değerler',
                data: results?.y_true || [],
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                pointRadius: 1,
            },
            {
                label: 'Tahmin Edilen Değerler',
                data: results?.y_pred || [],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderDash: [5, 5],
                pointRadius: 1,
            }
        ]
    };
    
    const lossData = {
        labels: lossHistory.map((_, i) => `Epoch ${i + 1}`),
        datasets: [{
            label: 'Eğitim Kaybı',
            data: lossHistory,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    return (
        <div className="report-viewer">
            <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                    <h1>{config?.pipeline_name} Deney Raporu</h1>
                    <p style={{fontFamily: 'var(--font-mono)', color: 'var(--text-color-darker)'}}>{experimentId}</p>
                </div>
                <Link to="/" className="button-primary" style={{textDecoration: 'none'}}>← Genel Bakış'a Dön</Link>
            </div>

            <div className="card" style={{marginBottom: '20px'}}>
                <h2>Performans Özeti</h2>
                <div style={{display: 'flex', gap: '20px'}}>
                    <p><strong>R² Skoru:</strong> {results?.metrics?.r2_score?.toFixed(4) || 'N/A'}</p>
                    <p><strong>MAE:</strong> {results?.metrics?.mae?.toFixed(4) || 'N/A'}</p>
                    <p><strong>Final Kayıp:</strong> {results?.final_loss?.toFixed(6) || 'N/A'}</p>
                </div>
            </div>

            <div className="card" style={{height: '500px', marginBottom: '20px'}}>
                 <Line options={{...chartOptions('Tahmin vs Gerçek Değerler'), scales: {x: {type: 'time'}}}} data={predictionData} />
            </div>

            <div className="card" style={{height: '400px', marginBottom: '20px'}}>
                <Line options={chartOptions('Model Öğrenme Eğrisi')} data={lossData} />
            </div>
            
            <div className="card">
                <h2>Deney Konfigürasyonu</h2>
                <pre style={{backgroundColor: 'var(--bg-color)', padding: '15px', borderRadius: '8px', whiteSpace: 'pre-wrap'}}>
                    <code>{JSON.stringify(config, null, 2)}</code>
                </pre>
            </div>
        </div>
    );
}

export default ReportViewer;