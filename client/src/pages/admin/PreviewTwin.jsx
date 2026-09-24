import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, LifeBuoy, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api.js';
import Modal from '../../components/Modal.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import SourcePanel from '../../components/SourcePanel.jsx';
import EscalationModal from '../../components/EscalationModal.jsx';

const SUGGESTED = [
  'What projects have you worked on?',
  'Why wasn\'t the LLM Council just an MBR summarizer?',
  'How do you approach a new AI problem?',
  'What did you work on in NexIQ?',
  'What is Wakubo?',
  'What was Divyansh\'s biggest failure at NIIT?',
];

const RESPONSE_LABEL = {
  documented: 'DOCUMENTED',
  inferred: 'INFERRED',
  insufficient_information: 'NOT DOCUMENTED',
};
const CONFIDENCE_LABEL = { high: 'High', medium: 'Medium', low: 'Low' };

export default function PreviewTwin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [twin, setTwin] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [activeSource, setActiveSource] = useState(null);
  const [escalationTarget, setEscalationTarget] = useState(null);
  const [escalated, setEscalated] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    api.get(`/twins/${id}`).then(({ data }) => setTwin(data.twin)).catch(() => setError('Could not load this Twin.'));
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setSending(true);
    try {
      const { data } = await api.post('/chat', { twinId: id, conversationId, message: content });
      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        { role: 'twin', content: data.reply.answer, ...data.reply, sourceQuestion: content },
      ]);
    } catch {
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const publish = async () => {
    await api.post(`/twins/${id}/publish`);
    setConfirming(false);
    navigate(`/admin/twins/${id}`);
  };

  if (error) return <ErrorAlert message={error} />;
  if (!twin) return null;

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/twins/${id}`)} style={{ marginBottom: 16 }}>
        <ArrowLeft size={15} /> Back to Editor
      </button>

      {twin.status !== 'published' && (
        <div className="preview-banner">
          <div className="copy">
            <h4>You're viewing an unpublished Digital Twin.</h4>
            <p>Users cannot access this Twin yet.</p>
          </div>
          <div className="flex gap-8">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/twins/${id}/edit`)}>Back to Editor</button>
            <button className="btn btn-accent btn-sm" onClick={() => setConfirming(true)}>Publish Twin</button>
          </div>
        </div>
      )}

      <div className="chat-shell">
        <div className="chat-profile-panel">
          <div className="twin-avatar">{twin.avatarInitials}</div>
          <div className="name">{twin.name}</div>
          <div className="role">{twin.title}</div>
          <div className="exp-list">
            {(twin.expertise || []).slice(0, 6).map((e) => <div className="chip" key={e}>{e}</div>)}
          </div>
        </div>
        <div className="chat-main">
          <div className="chat-messages" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="chat-empty">
                <h3>Test Conversation</h3>
                <p>Try asking this Twin something to verify its knowledge and tone before publishing.</p>
                <div className="suggested-grid">
                  {SUGGESTED.map((q) => (
                    <button className="suggested-chip" key={q} onClick={() => send(q)}>{q}</button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) =>
                m.role === 'user' ? (
                  <div className="message-row user" key={i}><div className="bubble-user">{m.content}</div></div>
                ) : (
                  <div className="message-row" key={i}>
                    <div className="bubble-twin">
                      <div className="who">{twin.name.split(' ')[0]} Twin</div>
                      <div className="content markdown-content">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>

                      {m.suggestedOptions?.length > 0 && (
                        <div className="bubble-followups">
                          <div className="bubble-followups-label">
                            <Sparkles size={13} style={{ color: 'var(--blue-accent)' }} />
                            Suggested Options & Follow-ups
                          </div>
                          <div className="bubble-options-grid">
                            {m.suggestedOptions.map((opt) => (
                              <button
                                key={opt}
                                className="followup-option-btn"
                                onClick={() => send(opt)}
                                disabled={sending}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="bubble-meta flex-col gap-12">
                        <div className="flex justify-between items-center" style={{ width: '100%' }}>
                          <div className="flex gap-16 items-center">
                            <span className="text-tertiary">Response</span>
                            <strong>{RESPONSE_LABEL[m.responseType] || '—'}</strong>
                          </div>
                          <div className="flex gap-16 items-center">
                            <span className="text-tertiary">Confidence</span>
                            <strong>{CONFIDENCE_LABEL[m.confidence] || '—'}</strong>
                          </div>
                        </div>

                        {m.sources?.length > 0 && (
                          <div className="bubble-sources">
                            {m.sources.map((s) => (
                              <button key={s.title} className="source-chip" onClick={() => setActiveSource(s)}>
                                {s.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {m.canEscalate && (
                        <div className="escalate-row">
                          <div className="copy">
                            <h4>Need the real expert?</h4>
                            <p>Some questions are better answered directly by the person behind the Twin.</p>
                          </div>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEscalationTarget(m.sourceQuestion || m.content)}
                          >
                            <LifeBuoy size={14} /> Ask {twin.name.split(' ')[0]}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )
            )}
            {sending && (
              <div className="message-row">
                <div className="bubble-twin">
                  <div className="who">{twin.name.split(' ')[0]} Twin</div>
                  <div className="typing-dots"><span /><span /><span /></div>
                </div>
              </div>
            )}
          </div>
          <div className="chat-input-row">
            <input placeholder="Ask something…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
            <button className="btn btn-accent" onClick={() => send()} disabled={sending || !input.trim()}>Send <Send size={15} /></button>
          </div>
        </div>
      </div>

      {activeSource && <SourcePanel source={activeSource} onClose={() => setActiveSource(null)} />}

      {escalationTarget && (
        <EscalationModal
          twinId={id}
          conversationId={conversationId}
          defaultQuestion={escalationTarget}
          onClose={() => setEscalationTarget(null)}
          onSubmitted={() => {
            setEscalationTarget(null);
            setEscalated(true);
            setTimeout(() => setEscalated(false), 4000);
          }}
        />
      )}

      {escalated && (
        <div className="modal-overlay" onMouseDown={() => setEscalated(false)}>
          <div className="modal-panel" style={{ textAlign: 'center' }} onMouseDown={(e) => e.stopPropagation()}>
            <h3>Request submitted.</h3>
            <p className="text-muted mt-8">
              The expert will receive the question along with relevant conversation context.
            </p>
            <button className="btn btn-primary mt-16" onClick={() => setEscalated(false)}>Close</button>
          </div>
        </div>
      )}

      {confirming && (
        <Modal title="Publish Digital Twin?" onClose={() => setConfirming(false)}>
          <p className="text-muted">Once published, this Twin will become visible to NIIT users.</p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setConfirming(false)}>Cancel</button>
            <button className="btn btn-accent" onClick={publish}>Publish</button>
          </div>
        </Modal>
      )}
    </div>
  );
}


