import { useEffect, useState } from 'react';
import api from '../../../services/api.js';
import Modal from '../../../components/Modal.jsx';

export default function StepPublish({ twin, back, onFinish }) {
  const [knowledgeCount, setKnowledgeCount] = useState(twin.knowledgeCount ?? 0);
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/twins/${twin._id}/knowledge`).then(({ data }) => setKnowledgeCount(data.knowledge.length));
  }, [twin._id]);

  const saveDraft = () => onFinish();

  const publish = async () => {
    setPublishing(true);
    setError('');
    try {
      await api.post(`/twins/${twin._id}/publish`);
      setConfirming(false);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not publish this Twin.');
    } finally {
      setPublishing(false);
    }
  };

  if (done) {
    return (
      <div className="wizard-card" style={{ textAlign: 'center' }}>
        <div className="badge badge-success" style={{ margin: '0 auto 16px' }}>✓ Twin published successfully</div>
        <h2>{twin.name}'s Digital Twin is now available to NIIT users.</h2>
        <button className="btn btn-primary mt-24" onClick={onFinish}>Go to Digital Twins</button>
      </div>
    );
  }

  return (
    <div className="wizard-card">
      <h2>Ready to publish?</h2>
      <p className="lead">Review the summary below before making this Twin available to users.</p>

      {error && <div className="auth-error">{error}</div>}

      <div className="summary-row"><span className="label">Name</span><span className="value">{twin.name}</span></div>
      <div className="summary-row"><span className="label">Title</span><span className="value">{twin.title}</span></div>
      <div className="summary-row"><span className="label">Organization</span><span className="value">{twin.organization}</span></div>
      <div className="summary-row"><span className="label">Knowledge sources</span><span className="value">{knowledgeCount}</span></div>
      <div className="summary-row"><span className="label">Expertise areas</span><span className="value">{twin.expertise?.length || 0}</span></div>
      <div className="summary-row"><span className="label">Persona configured</span><span className="value">{twin.communicationStyle?.length ? 'Yes' : 'No'}</span></div>

      <div className="wizard-actions mt-24">
        <button className="btn btn-secondary" onClick={back}>Back</button>
        <div className="flex gap-12">
          <button className="btn btn-secondary" onClick={saveDraft}>Save Draft</button>
          <button className="btn btn-accent" onClick={() => setConfirming(true)}>Publish Twin</button>
        </div>
      </div>

      {confirming && (
        <Modal title="Publish Digital Twin?" onClose={() => setConfirming(false)}>
          <p className="text-muted">Once published, this Twin will become visible to NIIT users.</p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setConfirming(false)}>Cancel</button>
            <button className="btn btn-accent" onClick={publish} disabled={publishing}>
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
