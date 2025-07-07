import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchReportContent, fetchReportImageBlob } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import styles from './ReportModal.module.css';

// === GÖRSELLE İLGİLİ TÜM MANTIĞI YÖNETEN YENİ BİLEŞEN ===
const ImageRenderer = ({ src, alt }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // URL'nin göreceli olup olmadığını kontrol et
    const isRelative = src && src.startsWith('images/');
    if (!isRelative) {
      setImageUrl(src); // Eğer tam bir URL ise, doğrudan kullan
      return;
    }

    let objectUrl = null;

    const loadImage = async () => {
      try {
        const response = await fetchReportImageBlob(`/experiments/${experimentId}/report/${src}`);
        objectUrl = URL.createObjectURL(response.data);
        setImageUrl(objectUrl);
      } catch (err) {
        console.error(`Görsel yüklenemedi: ${src}`, err);
        setError(true);
      }
    };
    
    // experimentId prop'u bu bileşene direkt gelmediği için,
    // bir üst bileşenden almamız gerekiyor. Bu örnekte ReportModal'dan alacağız.
    // Ancak bu yapı biraz karmaşık, bu yüzden ReportModal'da `transformImageUri` kullanmak daha temiz olacak.
    // Bu bileşeni şimdilik iptal edip ReportModal'da daha temiz bir çözüm uygulayalım.
    // --> YENİDEN DÜŞÜNME: En temiz yol, `ReactMarkdown`'un `transformImageUri` prop'unu kullanmaktır.
    // Ancak bu, asenkron `fetch` işlemleri için uygun değil. `components` prop'u doğru yol.
    // Bu bileşeni ReportModal içinde tanımlayıp `experimentId`'yi oradan almasını sağlayalım.
    // --> KARAR: Aşağıdaki ReportModal kodundaki çözüm en temizi.
  }, [src]);

  if (error) {
    return <span className={styles.imageError}>⚠️ Görsel Yüklenemedi: {alt}</span>;
  }
  
  if (!imageUrl) {
    return <span className={styles.imageLoading}>Görsel yükleniyor...</span>;
  }

  return <img src={imageUrl} alt={alt} />;
};

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

  // === GÖRSEL İŞLEME İÇİN ALT BİLEŞEN ===
  const SafeImage = ({ src, alt }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [error, setError] = useState(false);
  
    useEffect(() => {
      const isRelative = src && src.startsWith('images/');
      if (!isRelative) {
        setImageUrl(src);
        return;
      }
  
      let objectUrl;
      const loadImage = async () => {
        try {
          // Servis fonksiyonunu çağırarak blob verisini al
          const response = await fetchReportImageBlob(`/experiments/${experimentId}/report/${src}`);
          // Blob'dan bir URL oluştur
          objectUrl = URL.createObjectURL(response.data);
          setImageUrl(objectUrl);
        } catch (err) {
          console.error("Görsel yükleme hatası:", err);
          setError(true);
        }
      };
  
      loadImage();
  
      // Component unmount olduğunda oluşturulan object URL'i temizle (memory leak önlemi)
      return () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      };
    }, [src, experimentId]);
  
    if (error) return <p className={styles.imageError}>⚠️ Görsel yüklenemedi: {src}</p>;
    if (!imageUrl) return <p className={styles.imageLoading}>Görsel yükleniyor: {src}</p>;
    return <img src={imageUrl} alt={alt} />;
  };
  SafeImage.propTypes = { src: PropTypes.string, alt: PropTypes.string };

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
                img: SafeImage, // img etiketlerini bizim bileşenimiz render edecek
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