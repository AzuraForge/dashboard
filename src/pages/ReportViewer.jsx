// dashboard/src/pages/ReportViewer.jsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchExperimentReport } from '../services/api';
import { API_BASE_URL } from '../services/api';

function ReportViewer() {
    const { experimentId } = useParams();
    const [reportContent, setReportContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getReport = async () => {
            setLoading(true);
            try {
                const response = await fetchExperimentReport(experimentId);
                setReportContent(response.data);
                setError(null);
            } catch (err) {
                setError(`Rapor yüklenemedi: ${err.response?.data?.detail || err.message}`);
                setReportContent('');
            } finally {
                setLoading(false);
            }
        };
        getReport();
    }, [experimentId]);

    // Markdown içindeki göreceli imaj yollarını (images/...) mutlak API yollarına dönüştür
    const transformImageUrl = (uri) => {
        if (uri.startsWith('images/')) {
            // Rapor dosyaları reports/<pipeline_name>/<experiment_id>/report.md şeklinde.
            // Bu yüzden imaj yolu da bu yapıya göre oluşturulmalı.
            // Ancak experiment_id'yi URL'den aldığımız için, tam yolu API'de çözmek daha mantıklı.
            // Şimdilik API endpoint'ine experiment_id ile birlikte imaj adını da gönderelim.
            // Bu yaklaşım yerine, rapor klasörünü statik olarak sunmak daha iyi bir çözüm olabilir.
            // Geçici Çözüm: Rapor dosyalarının public bir klasörde olduğunu varsayalım.
            // Docker'da /app/reports dizinini /reports olarak sunacak bir yapı lazım.
            // ŞİMDİLİK en basit yol: API'yi bir proxy olarak kullanmak.
            // Bunun için API'ye yeni bir endpoint eklemek gerekir. Şimdilik bu kısmı atlayıp
            // imajların kırık görünmesini kabul edelim ve sonraki fazda düzeltelim.
            // VEYA daha basit bir yol deneyelim:
            // Raporlar, `api` servisinin `reports` adlı bir alt klasöründe bulunur.
            // API'yi `http://localhost:8000`'da çalıştırdığımızı varsayarsak, imaj URL'si
            // `http://localhost:8000/reports/<exp_id>/images/imaj.png` olmalı.
            // Bunun için FastAPI'de statik dosya sunumu yapmak gerekir.
            return `${API_BASE_URL}/experiments/${experimentId}/report/${uri}`; // Bu endpoint henüz yok, sonraki adımda ekleyebiliriz.
            // ŞİMDİLİK bu kısmı pas geçip sadece metni gösterelim.
        }
        return uri;
    };


    if (loading) return <p>Rapor yükleniyor...</p>;
    if (error) return <div className="card" style={{borderColor: 'var(--error-color)'}}><p>{error}</p><Link to="/">Geri Dön</Link></div>;

    return (
        <div className="report-viewer">
            <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                    <h1>Deney Raporu</h1>
                    <p style={{fontFamily: 'var(--font-mono)', color: 'var(--text-color-darker)'}}>{experimentId}</p>
                </div>
                <Link to="/" className="button-primary" style={{textDecoration: 'none'}}>← Geri Dön</Link>
            </div>
            <div className="card" style={{padding: '40px'}}>
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {reportContent}
                </ReactMarkdown>
            </div>
        </div>
    );
}

export default ReportViewer;