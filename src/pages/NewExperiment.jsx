// dashboard/src/pages/NewExperiment.jsx

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { fetchAvailablePipelines, fetchPipelineDefaultConfig, startNewExperiment } from '../services/api';
import { get, set, cloneDeep, isObject, isArray, isString } from 'lodash'; // Lodash fonksiyonlarını doğrudan import edelim

// === YARDIMCI BİLEŞENLER VE FONKSİYONLAR ===

const ChevronDownIcon = ({ className = '' }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);
ChevronDownIcon.propTypes = { className: PropTypes.string };

const parseNumberListInput = (value) => {
    if (value === null || value === undefined || value === '') return [];
    if (isArray(value)) return value.map(v => isString(v) ? parseFloat(v.replace(',', '.')) : v).filter(v => !isNaN(v));
    if (typeof value === 'number') return [value];
    if (isString(value)) {
        const parts = value.split(',').map(s => s.trim()).filter(s => s !== '');
        return parts.map(s => {
            const num = parseFloat(s.replace(',', '.'));
            return isNaN(num) ? NaN : num;
        }).filter(v => !isNaN(v));
    }
    return [];
};

// === DİNAMİK FORM OLUŞTURUCU ÇEKİRDEĞİ ===

function DynamicFormField({ field, config, onConfigChange }) {
    const { id, path, label, type, placeholder, help_text, options } = field;
    const value = get(config, path, '');

    const handleChange = (e) => {
        let newValue;
        if (e.target.type === 'checkbox') {
            newValue = e.target.checked;
        } else if (type === 'select' && (e.target.value === 'true' || e.target.value === 'false')) {
            newValue = (e.target.value === 'true');
        } else {
            newValue = e.target.value;
        }
        
        // DÜZELTME: State'in değiştiğini React'e bildirmek için yeni bir nesne oluşturuyoruz
        const newConfig = cloneDeep(config);
        set(newConfig, path, newValue);
        onConfigChange(newConfig);
    };

    const renderField = () => {
        switch (type) {
            case 'select':
                return (
                    <select id={id} value={String(value)} onChange={handleChange}>
                        {options?.map(opt => <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>)}
                    </select>
                );
            case 'text':
            default:
                return <input type="text" id={id} value={value} onChange={handleChange} placeholder={placeholder || ''} />;
        }
    };

    return (
        <div className="form-group">
            <label htmlFor={id}>{label}</label>
            {renderField()}
            {help_text && <small>{help_text}</small>}
        </div>
    );
}
DynamicFormField.propTypes = { field: PropTypes.object.isRequired, config: PropTypes.object.isRequired, onConfigChange: PropTypes.func.isRequired };

function DynamicFormRenderer({ schema, config, onConfigChange }) {
    const [expandedSections, setExpandedSections] = useState({});

    useEffect(() => {
        if (schema?.groups?.length > 0) {
            const initialExpandedState = {};
            // Varsayılan olarak ilk grubu açık yap
            initialExpandedState[schema.groups[0].id] = true;
            setExpandedSections(initialExpandedState);
        }
    }, [schema]);

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    if (!schema || !isArray(schema.groups) || schema.groups.length === 0) {
        return <p>Bu pipeline için form şeması bulunamadı.</p>;
    }

    return (
        <>
            {schema.groups.map(group => (
                <fieldset key={group.id} className={`form-fieldset collapsible-fieldset ${expandedSections[group.id] ? 'expanded' : ''}`}>
                    <div className={`collapsible-header ${!expandedSections[group.id] ? 'collapsed' : ''}`} onClick={() => toggleSection(group.id)}>
                        <span>{group.name}</span>
                        <ChevronDownIcon className="icon" />
                    </div>
                    <div className="collapsible-content">
                        {group.fields.map(field => (
                            <DynamicFormField key={field.path} field={field} config={config} onConfigChange={onConfigChange} />
                        ))}
                    </div>
                </fieldset>
            ))}
        </>
    );
}
DynamicFormRenderer.propTypes = { schema: PropTypes.object, config: PropTypes.object, onConfigChange: PropTypes.func.isRequired };

// === ANA BİLEŞEN: NewExperiment ===

function NewExperiment({ onExperimentStarted, onClosePanel }) { 
    const [pipelines, setPipelines] = useState([]);
    const [selectedPipelineId, setSelectedPipelineId] = useState('');
    const [currentConfig, setCurrentConfig] = useState(null);
    const [currentSchema, setCurrentSchema] = useState(null);
    const [batchName, setBatchName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadPipelines = async () => {
            setIsLoading(true);
            try {
                const response = await fetchAvailablePipelines();
                if (response.data && response.data.length > 0) {
                    setPipelines(response.data);
                    if (!selectedPipelineId) setSelectedPipelineId(response.data[0].id);
                } else {
                  setPipelines([]);
                }
            } catch (error) { toast.error('Pipeline listesi yüklenemedi.'); } 
            finally { setIsLoading(false); }
        };
        loadPipelines();
    }, []); 

    const loadPipelineData = useCallback(async (pipelineId) => {
        if (!pipelineId) return;
        setIsLoading(true);
        setCurrentConfig(null);
        setCurrentSchema(null);
        try {
            const { data } = await fetchPipelineDefaultConfig(pipelineId);
            setCurrentConfig(data.default_config || {});
            setCurrentSchema(data.form_schema || null);
        } catch (error) { toast.error(`Konfigürasyon yüklenemedi: ${error.response?.data?.detail || error.message}`); } 
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => {
        loadPipelineData(selectedPipelineId);
    }, [selectedPipelineId, loadPipelineData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentConfig) return toast.error('Konfigürasyon henüz yüklenmedi.');
        let configToSend = cloneDeep(currentConfig);
        const processNode = (node) => {
            for (const key in node) {
                if (isObject(node[key]) && !isArray(node[key])) {
                    processNode(node[key]);
                } else if (isString(node[key])) {
                    const nonNumericKeys = ['ticker', 'optimizer', 'target_col', 'target_col_transform'];
                    if (!nonNumericKeys.includes(key)) {
                        const numbers = parseNumberListInput(node[key]);
                        if (numbers.length > 0) node[key] = numbers.length === 1 ? numbers[0] : numbers;
                    }
                }
            }
        };
        processNode(configToSend);
        setIsSubmitting(true);
        configToSend.pipeline_name = selectedPipelineId;
        if (batchName.trim()) configToSend.batch_name = batchName.trim();
        try {
            const { data } = await startNewExperiment(configToSend); 
            toast.success(data.message || 'Görev başarıyla gönderildi!');
            if (onExperimentStarted) onExperimentStarted();
        } catch (err) {
            toast.error('Deney başlatılamadı. Logları kontrol edin.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const selectedPipelineDetails = pipelines.find(p => p.id === selectedPipelineId);

    return (
        <form onSubmit={handleSubmit} className="new-experiment-panel-form"> 
            <div className="new-experiment-panel-form-content"> 
                <div className="card">
                    <div className="form-group">
                        <label htmlFor="pipeline-select">Çalıştırılacak Pipeline Eklentisi</label>
                        <select id="pipeline-select" value={selectedPipelineId} onChange={(e) => setSelectedPipelineId(e.target.value)} disabled={isLoading || isSubmitting}>
                            {pipelines.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="batch-name">Deney Grubu Adı (İsteğe Bağlı)</label>
                        <input type="text" id="batch-name" value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="Örn: LR ve Epoch Optimizasyonu" disabled={isLoading || isSubmitting} />
                    </div>
                </div>
                <div className="card" style={{padding: 0, marginTop: '20px'}}> 
                    <div onClick={() => loadPipelineData(selectedPipelineId)} style={{borderBottom: '1px solid var(--border-color)', padding: '10px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-color-darker)'}}>
                        <span role="img" aria-label="reset">🔄</span> Varsayılan Konfigürasyona Dön
                    </div>
                    <div style={{padding: '15px'}}>
                        <h3>Deney Parametreleri</h3>
                        {isLoading ? <p>Yükleniyor...</p> : <DynamicFormRenderer schema={currentSchema} config={currentConfig} onConfigChange={setCurrentConfig} />}
                    </div>
                </div>
            </div>
            <div className="form-action-bar">
                <div className="pipeline-info">
                    <strong>Pipeline:</strong> <span>{selectedPipelineDetails?.name || '...'}</span>
                </div>
                <button type="submit" disabled={isLoading || isSubmitting || !currentSchema} className="button-primary">
                    {isSubmitting ? 'Başlatılıyor...' : 'Eğitimi Başlat'}
                </button>
            </div>
        </form>
    );
}
NewExperiment.propTypes = { onExperimentStarted: PropTypes.func.isRequired, onClosePanel: PropTypes.func.isRequired };
export default NewExperiment;