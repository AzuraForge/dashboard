import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchReportContent, API_BASE_URL } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import styles from './ReportModal.module.css';

function ReportModal({ experimentId, onClose }) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  // urlTransform fonksiyonu, her URL için çağrılır ve yeni URL'i döndürmelidir.
  const urlTransform = (url) => {
    // Eğer URL göreceli bir imaj yolu ise, onu tam API yoluna çevir.
    if (url.startsWith('images/')) {
      return `${API_BASE_URL}/experiments/${experimentId}/report/${url}`;
    }
    // Diğer tüm URL'leri olduğu gibi bırak.
    return url;
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
              urlTransform={urlTransform}
              components={{
                h1: ({node, ...props}) => <h2 {...props} />,
                table: ({node, ...props}) => <div className="table-container"><table {...props} /></div>
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