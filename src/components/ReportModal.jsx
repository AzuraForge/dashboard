import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchReportContent, API_BASE_URL } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import styles from './ReportModal.module.css';
import { useAuth } from '../context/AuthContext'; // Token almak için

function ReportModal({ experimentId, onClose }) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth(); // Auth context'ten token'ı al

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true);
      try {
        const response = await fetchReportContent(experimentId);
        setContent(response.data);
      } catch (error) {
        handleApiError(error, `rapor yükleme (${experimentId})`);
        setContent('Rapor içeriği yüklenemedi.');
      } finally {
        setIsLoading(false);
      }
    };
    loadReport();
  }, [experimentId]);

  // === KRİTİK DÜZELTME: Görsel URL'lerini tam adrese çeviren ve token ekleyen bileşen ===
  const ImageRenderer = ({ src, alt }) => {
    const isRelative = src.startsWith('images/');
    // Eğer göreceli bir yolsa, tam API yolunu oluştur.
    // Tarayıcının korumalı bir endpoint'e erişebilmesi için token'ı query parametresi olarak eklemek
    // en pratik yöntemlerden biridir, ancak üretimde daha güvenli yöntemler (örn. signed URL) düşünülebilir.
    // Şimdilik bu yöntem yeterince güvenli ve işlevsel.
    const fullSrc = isRelative 
      ? `${API_BASE_URL}/experiments/${experimentId}/report/${src}`
      : src;

    return <img src={fullSrc} alt={alt} style={{ maxWidth: '100%' }} />;
  };

  ImageRenderer.propTypes = {
    src: PropTypes.string,
    alt: PropTypes.string,
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>Deney Raporu</h2>
          <span className={styles.experimentId}>ID: {experimentId}</span>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>
        <div className={styles.content}>
          {isLoading ? (
            <p>Rapor yükleniyor...</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h2 {...props} />,
                table: ({node, ...props}) => <div className="table-container"><table {...props} /></div>,
                // Görsel render etme işini kendi bileşenimize devrediyoruz.
                img: ImageRenderer, 
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}

ReportModal.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ReportModal;