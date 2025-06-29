import PropTypes from 'prop-types';
import ExperimentRow from './ExperimentRow'; // YENİ: ExperimentRow bileşenini import et

function ExperimentsList({ experiments }) {
  if (!experiments || experiments.length === 0) {
    return <p className="feedback info">Henüz gösterilecek bir deney bulunamadı.</p>;
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Deney ID</th>
            <th>Durum</th>
            <th>Pipeline</th>
            <th>Sembol</th>
            <th>Final Kayıp</th>
            <th>Bitiş Tarihi</th>
          </tr>
        </thead>
        <tbody>
          {/* DÜZELTME: Her bir deney için ExperimentRow bileşenini render et */}
          {experiments.map((exp) => (
            <ExperimentRow key={exp.experiment_id} experiment={exp} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

ExperimentsList.propTypes = {
  experiments: PropTypes.array.isRequired,
};

export default ExperimentsList;