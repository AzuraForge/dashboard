import PropTypes from 'prop-types';
import ExperimentRow from './ExperimentRow';

function ExperimentsList({ experiments, selectedIds, onSelect, setTrackingTaskId }) {
  if (!experiments || experiments.length === 0) {
    return <p style={{textAlign: 'center', padding: '20px'}}>Filtrelerinize uyan bir deney bulunamadı.</p>;
  }
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th style={{width: '40px'}}></th>
            <th>Durum</th>
            <th>Deney Detayları</th>
            <th>Parametreler</th>
            <th>Sonuçlar</th>
            <th>Zamanlama</th>
            <th style={{width: '50px'}}>Aksiyon</th>
          </tr>
        </thead>
        <tbody>
          {experiments.map((exp) => (
            <ExperimentRow 
              key={exp.experiment_id} 
              experiment={exp} 
              isSelected={selectedIds.has(exp.experiment_id)}
              onSelect={() => onSelect(exp.experiment_id)}
              setTrackingTaskId={setTrackingTaskId}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
ExperimentsList.propTypes = { 
  experiments: PropTypes.array.isRequired, 
  selectedIds: PropTypes.object.isRequired, 
  onSelect: PropTypes.func.isRequired, 
  setTrackingTaskId: PropTypes.func.isRequired 
};
export default ExperimentsList;