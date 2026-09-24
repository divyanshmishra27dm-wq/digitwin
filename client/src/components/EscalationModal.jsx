import { useState } from 'react';
import Modal from './Modal.jsx';
import api from '../services/api.js';

export default function EscalationModal({ twinId, conversationId, defaultQuestion, onClose, onSubmitted }) {
  const [question, setQuestion] = useState(defaultQuestion || '');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!question.trim()) {
      setError('Please enter your question.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/escalations', { twinId, conversationId, question, reason });
      onSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit your request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Ask the Real Expert" onClose={onClose}>
      {error && <div className="auth-error">{error}</div>}
      <div className="field">
        <label>Your question</label>
        <textarea className="textarea" value={question} onChange={(e) => setQuestion(e.target.value)} />
      </div>
      <div className="field">
        <label>Why are you escalating?</label>
        <textarea
          className="textarea"
          placeholder="e.g. I need more detail than the Twin could provide"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={submitting}>
          {submitting ? 'Sending…' : 'Send Request'}
        </button>
      </div>
    </Modal>
  );
}
