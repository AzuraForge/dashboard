/* ======================================================
   ExperimentCard.module.css
   Sadece ExperimentCard bileşenini ilgilendiren stiller
   ====================================================== */

.card {
  display: flex;
  flex-direction: column;
  background-color: var(--content-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  overflow: hidden;
}

.card:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.selectedCard {
  border-color: var(--secondary-color) !important; /* !important ile normal hover'ı ezer */
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--secondary-color) 40%, transparent) !important;
  transform: translateY(-2px);
}

.topSection {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-color); 
  gap: 15px; 
}

.checkboxStatus {
  display: flex;
  align-items: center;
  gap: 15px; /* Checkbox ve badge arası boşluk artırıldı */
  flex-shrink: 0;
}
.checkboxStatus input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.mainInfo {
  flex-grow: 1; 
  display: flex;
  flex-direction: column; 
  align-items: flex-start;
  overflow: hidden; 
  gap: 2px;
}

.pipelineName {
  margin: 0;
  font-size: 1.1em;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%; 
}

.experimentId,
.batchName {
  font-family: var(--font-mono);
  font-size: 0.8em;
  color: var(--text-color-darker);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.body {
  padding: 20px;
  display: grid; /* Flexbox yerine Grid kullanıyoruz */
  grid-template-columns: 1fr 1fr; /* İki sütunlu yapı */
  gap: 25px;
  align-items: flex-start; 
}

.metricsSummary {
  display: grid; 
  grid-template-columns: auto 1fr; 
  align-items: center;
  column-gap: 15px;
  row-gap: 8px;
}

.metricsSummary p {
  margin: 0;
  font-size: 0.9em;
  display: contents; /* p etiketini grid layout'undan kaldırır */
}

.metricsSummary p > strong {
  color: var(--text-color); 
  font-weight: 500;
  text-align: right;
}

.metricsSummary p > span {
  color: var(--text-color-darker);
  text-align: left;
  white-space: nowrap; 
  overflow: hidden;
  text-overflow: ellipsis;
}


.chartsSection {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.liveProgressBarSection {
    grid-column: 1 / -1; /* İki sütunu da kapla */
    width: 100%;
    margin-top: 10px;
    padding-top: 15px;
    border-top: 1px solid var(--border-color);
}

.liveProgressBarSection .progressHeader {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 8px;
    font-size: 0.85em;
}

.liveProgressBarSection .statusText {
    color: var(--text-color-darker);
}

.liveProgressBarSection .epochCounter {
    font-weight: bold;
    font-family: var(--font-mono);
}

.liveProgressBarSection progress {
    width: 100%;
    height: 8px;
    -webkit-appearance: none;
    appearance: none;
    border-radius: 4px;
    overflow: hidden;
    border: none;
}
.liveProgressBarSection progress::-webkit-progress-bar {
    background-color: var(--border-color);
}
.liveProgressBarSection progress::-webkit-progress-value {
    background-color: var(--info-color); 
    border-radius: 4px;
    transition: width 0.3s ease;
}
.liveProgressBarSection progress::-moz-progress-bar {
    background-color: var(--info-color);
    border-radius: 4px;
    transition: width 0.3s ease;
}