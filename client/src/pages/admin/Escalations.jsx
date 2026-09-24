import { useEffect, useState } from 'react';
import { LifeBuoy, Clock, CheckCircle2, XCircle, Sparkles, BookOpen, Send, Check } from 'lucide-react';
import api from '../../services/api.js';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import Badge from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';

const STATUS_TONE = {
  pending: 'warning',
  reviewed: 'accent',
  responded: 'success',
  closed: 'neutral',
};

const CATEGORIES = [
  'Experience',
  'Leadership & Strategy',
  'Projects & Innovation',
  'Engineering & Architecture',
  'Challenges & Learnings',
  'Work Culture & Values',
];

export default function Escalations() {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [successToast, setSuccessToast] = useState('');

  // Answer Modal State
  const [answering, setAnswering] = useState(null); // escalation object
  const [answerForm, setAnswerForm] = useState({
    title: '',
    category: 'Experience',
    summary: '',
    content: '',
    tags: 'Human Verified, Escalation Answer',
    addToKnowledge: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/escalations');
      setEscalations(Array.isArray(data?.escalations) ? data.escalations : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load escalations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/escalations/${id}`, { status });
      setEscalations((prev) =>
        prev.map((e) => (e._id === id ? { ...e, status } : e))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update escalation status.');
    }
  };

  const openAnswerModal = (escalation, ev) => {
    if (ev) ev.stopPropagation();
    setAnswering(escalation);
    setModalError('');
    setAnswerForm({
      title: escalation.question,
      category: 'Experience',
      summary: escalation.expertAnswer ? escalation.expertAnswer.slice(0, 140) : '',
      content: escalation.expertAnswer || '',
      tags: 'Human Verified, Escalation Answer',
      addToKnowledge: true,
    });
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answerForm.content.trim()) {
      setModalError('Please provide the expert answer content.');
      return;
    }

    setSubmitting(true);
    setModalError('');
    try {
      const { data } = await api.post(`/escalations/${answering._id}/answer`, {
        title: answerForm.title.trim() || answering.question,
        category: answerForm.category,
        summary: answerForm.summary.trim() || answerForm.content.slice(0, 160),
        content: answerForm.content.trim(),
        tags: answerForm.tags,
        expertAnswer: answerForm.content.trim(),
        addToKnowledge: answerForm.addToKnowledge,
      });

      // Update state
      setEscalations((prev) =>
        prev.map((item) => (item._id === answering._id ? data.escalation : item))
      );

      // Auto-expand this item to show the answer
      setExpanded(answering._id);
      setAnswering(null);
      setSuccessToast(`Successfully answered! The Digital Twin is now trained on this response.`);
      setTimeout(() => setSuccessToast(''), 6000);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-title">Human Escalations</div>
      <div className="page-subtitle" style={{ marginBottom: 24 }}>
        Questions users routed to the human expert. Answer them here to permanently train your Digital Twin for future inquiries.
      </div>

      {successToast && (
        <div
          className="flex items-center gap-10"
          style={{
            background: 'var(--success-surface, rgba(16, 185, 129, 0.12))',
            color: 'var(--success, #059669)',
            border: '1px solid var(--success-border, rgba(16, 185, 129, 0.3))',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 20,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <Check size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {error && <ErrorAlert message={error} onRetry={load} />}

      {loading ? (
        <div className="flex flex-col gap-12">
          <div className="skeleton" style={{ height: 72 }} />
          <div className="skeleton" style={{ height: 72 }} />
          <div className="skeleton" style={{ height: 72 }} />
        </div>
      ) : escalations.length === 0 ? (
        <EmptyState
          title="No escalations yet."
          description="When a user asks to speak with the real expert or escalates an unanswered question in chat, their request will appear here."
        />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {escalations.map((e) => {
            const userName = e.userId?.name || e.userId?.email || 'User';
            const twinName = e.twinId?.name || 'Digital Twin';
            const initials = userName.slice(0, 2).toUpperCase();
            const dateStr = e.createdAt ? new Date(e.createdAt).toLocaleString() : '';
            const isResponded = e.status === 'responded' || Boolean(e.expertAnswer);

            return (
              <div
                key={e._id}
                className="twin-list-row"
                style={{
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  padding: '18px 24px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
                onClick={() => setExpanded(expanded === e._id ? null : e._id)}
              >
                <div className="who" style={{ flex: 1, alignItems: 'flex-start' }}>
                  <div className="twin-avatar" style={{ width: 38, height: 38, fontSize: 13, flexShrink: 0, marginTop: 2 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-8">
                      <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{e.question}</h4>
                      {isResponded && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 12,
                            background: 'var(--success-surface, rgba(16, 185, 129, 0.12))',
                            color: 'var(--success, #059669)',
                            fontWeight: 600,
                          }}
                        >
                          <Sparkles size={11} /> Twin Trained
                        </span>
                      )}
                    </div>

                    <div className="sub" style={{ marginTop: 4 }}>
                      <span>{userName}</span>
                      <span style={{ margin: '0 6px' }}>→</span>
                      <strong>{twinName}</strong>
                      {dateStr && <span style={{ marginLeft: 10, color: 'var(--text-tertiary)' }}>· {dateStr}</span>}
                    </div>

                    {expanded === e._id && (
                      <div className="mt-12 flex flex-col gap-10" style={{ background: 'var(--surface-muted)', padding: '14px 16px', borderRadius: 'var(--radius-sm)' }}>
                        {e.reason && (
                          <div style={{ fontSize: 13 }}>
                            <strong style={{ color: 'var(--text-secondary)' }}>User's Escalation Reason: </strong>
                            <span>{e.reason}</span>
                          </div>
                        )}
                        {e.aiResponse && (
                          <div style={{ fontSize: 13 }}>
                            <strong style={{ color: 'var(--text-secondary)' }}>AI Twin's Prior Answer: </strong>
                            <span className="text-muted">{e.aiResponse}</span>
                          </div>
                        )}

                        {e.expertAnswer && (
                          <div
                            style={{
                              marginTop: 6,
                              padding: '12px 14px',
                              background: 'var(--surface-card, #ffffff)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            <div className="flex items-center justify-between mb-8">
                              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--brand-primary, #6366f1)' }}>
                                <Sparkles size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                                Expert Response & Trained Knowledge
                              </span>
                              {e.respondedAt && (
                                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                                  Answered {new Date(e.respondedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                              {e.expertAnswer}
                            </p>
                            {e.knowledgeId && (
                              <div className="mt-8" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                <strong>Knowledge Entry: </strong>
                                <span>{e.knowledgeId.title || 'Escalation Response'}</span>
                                {e.knowledgeId.category && (
                                  <span style={{ marginLeft: 8, padding: '2px 6px', background: 'var(--surface-muted)', borderRadius: 4, fontSize: 11 }}>
                                    {e.knowledgeId.category}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-12" style={{ flexShrink: 0 }}>
                  <Badge tone={STATUS_TONE[e.status] || 'neutral'}>{e.status}</Badge>

                  <div className="actions flex items-center gap-8" onClick={(ev) => ev.stopPropagation()}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(ev) => openAnswerModal(e, ev)}
                      title={isResponded ? "Edit Answer & Re-train" : "Answer and train the Digital Twin"}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 600,
                      }}
                    >
                      <Sparkles size={14} />
                      {isResponded ? 'Update Answer' : 'Answer & Train'}
                    </button>

                    {e.status === 'pending' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => updateStatus(e._id, 'reviewed')}
                        title="Mark Reviewed"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    )}

                    {e.status !== 'closed' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => updateStatus(e._id, 'closed')}
                        title="Close Escalation"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Answer & Train Twin Modal ───────────────────────── */}
      {answering && (
        <div className="modal-overlay" onMouseDown={() => setAnswering(null)}>
          <div
            className="modal-panel"
            style={{ maxWidth: 620, width: '92%' }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="flex items-center gap-8">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--brand-primary-light, rgba(99, 102, 241, 0.12))',
                    color: 'var(--brand-primary, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Answer Escalation & Train Twin</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Training <strong>{answering.twinId?.name || 'Digital Twin'}</strong> with expert ground truth
                  </div>
                </div>
              </div>
            </div>

            {modalError && (
              <div style={{ marginBottom: 16 }}>
                <ErrorAlert message={modalError} />
              </div>
            )}

            {/* Context of Escalation */}
            <div
              style={{
                background: 'var(--surface-muted)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 16,
                fontSize: 13,
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ marginBottom: 6 }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Escalated Question: </strong>
                <span style={{ fontWeight: 600 }}>{answering.question}</span>
              </div>
              {answering.reason && (
                <div style={{ marginBottom: 6, color: 'var(--text-secondary)' }}>
                  <strong>User's Note: </strong>
                  <span>{answering.reason}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleAnswerSubmit} className="flex flex-col gap-12">
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Knowledge Title
                </label>
                <input
                  className="input"
                  style={{ width: '100%' }}
                  value={answerForm.title}
                  onChange={(e) => setAnswerForm({ ...answerForm, title: e.target.value })}
                  placeholder="e.g. Divyansh's Biggest Failure and Lessons Learned"
                  required
                />
              </div>

              <div className="grid-2 gap-12">
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Category
                  </label>
                  <select
                    className="input"
                    style={{ width: '100%' }}
                    value={answerForm.category}
                    onChange={(e) => setAnswerForm({ ...answerForm, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Tags (comma separated)
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%' }}
                    value={answerForm.tags}
                    onChange={(e) => setAnswerForm({ ...answerForm, tags: e.target.value })}
                    placeholder="Human Verified, Escalation Answer"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Short Summary
                </label>
                <input
                  className="input"
                  style={{ width: '100%' }}
                  value={answerForm.summary}
                  onChange={(e) => setAnswerForm({ ...answerForm, summary: e.target.value })}
                  placeholder="A concise 1-2 sentence overview of the answer"
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Expert Answer & Knowledge Detail <span style={{ color: 'var(--brand-primary, #6366f1)' }}>*</span>
                </label>
                <textarea
                  className="input"
                  style={{ width: '100%', minHeight: 140, resize: 'vertical', lineHeight: 1.5 }}
                  value={answerForm.content}
                  onChange={(e) => setAnswerForm({ ...answerForm, content: e.target.value })}
                  placeholder="Provide the authentic, detailed response from the real expert. This content will be indexed in the Twin's knowledge base and used to answer all future similar inquiries."
                  required
                />
              </div>

              <div
                className="flex items-center gap-8"
                style={{
                  padding: '10px 12px',
                  background: 'var(--surface-muted)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                }}
              >
                <input
                  type="checkbox"
                  id="addToKnowledge"
                  checked={answerForm.addToKnowledge}
                  onChange={(e) => setAnswerForm({ ...answerForm, addToKnowledge: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="addToKnowledge" style={{ cursor: 'pointer', margin: 0, fontWeight: 500 }}>
                  Automatically index as verified knowledge for <strong>{answering.twinId?.name || 'this Digital Twin'}</strong>
                </label>
              </div>

              <div className="modal-actions" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAnswering(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Sparkles size={16} />
                  {submitting ? 'Training Twin...' : 'Save & Train Digital Twin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


