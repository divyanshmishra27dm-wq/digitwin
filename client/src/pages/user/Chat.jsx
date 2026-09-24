import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, LifeBuoy, Sparkles, Briefcase, UserCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import SourcePanel from '../../components/SourcePanel.jsx';
import EscalationModal from '../../components/EscalationModal.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';

const SUGGESTED = [
  'What projects have you worked on?',
  'What is the LLM Council?',
  'How do you approach a new AI problem?',
  'What did you learn from Wakubo?',
  'What did you work on in NexIQ?',
  'How do you decide whether an AI idea is worth building?',
];

const CONFIDENCE_LABEL = { high: 'High', medium: 'Medium', low: 'Low' };
const RESPONSE_LABEL = {
  documented: 'DOCUMENTED',
  inferred: 'INFERRED',
  insufficient_information: 'NOT DOCUMENTED',
};

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [twin, setTwin] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
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

  const userTitle = user?.title || 'Employee';
  const matchedTitlePersona = twin?.titlePersonas?.find((tp) => {
    if (!tp.targetTitle) return false;
    const target = tp.targetTitle.trim().toLowerCase();
    const current = userTitle.trim().toLowerCase();
    return current === target || current.includes(target) || target.includes(current);
  });

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;

    setInput('');
    setError('');
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setSending(true);

    try {
      const { data } = await api.post('/chat', { twinId: id, conversationId, message: content });
      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, { role: 'twin', content: data.reply.answer, ...data.reply, sourceQuestion: content }]);
    } catch (err) {
      setError(err.response?.data?.message || "We couldn't reach this Twin right now.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  if (!twin) return error ? <ErrorAlert message={error} /> : null;

  return (
    <div>
      <div className="chat-header" style={{ marginBottom: 20, border: 'none', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="back" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> {twin.name}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {matchedTitlePersona ? (
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--primary)',
                background: 'var(--bg-secondary)',
                padding: '4px 10px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
              title={`Adaptive Persona Active: Calibrated for ${matchedTitlePersona.targetTitle}`}
            >
              <Briefcase size={12} /> Role: {userTitle} (Tailored)
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-secondary)',
                padding: '4px 10px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <UserCheck size={12} /> Role: {userTitle}
            </span>
          )}
          <span className="status-line"><span className="status-live-dot" /> Twin Online</span>
        </div>
      </div>

      <div className="chat-shell">
        <div className="chat-profile-panel">
          <div className="twin-avatar">{twin.avatarInitials}</div>
          <div className="name">{twin.name}</div>
          <div className="role">{twin.title}</div>
          <div className="exp-list">
            {(twin.expertise || []).slice(0, 6).map((e) => <div className="chip" key={e}>{e}</div>)}
          </div>

          {/* User Persona Calibration Card */}
          <div style={{
            marginTop: 18,
            padding: '12px 14px',
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            border: '1px solid var(--border)',
            textAlign: 'left'
          }}>
            <div style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              marginBottom: 4
            }}>
              <Briefcase size={12} style={{ color: 'var(--primary)' }} />
              Persona Calibration
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {userTitle}
            </div>
            {matchedTitlePersona ? (
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                ✓ Calibrated for {matchedTitlePersona.targetTitle}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Using standard base persona
              </div>
            )}
          </div>
        </div>

        <div className="chat-main">
          <div className="chat-messages" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="chat-empty">
                <h3>Start a conversation with {twin.name.split(' ')[0]}</h3>
                <p>Explore his experience across AI, product, engineering and entrepreneurship.</p>
                <div className="suggested-grid">
                  {SUGGESTED.map((q) => (
                    <button className="suggested-chip" key={q} onClick={() => send(q)}>{q}</button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) =>
                m.role === 'user' ? (
                  <div className="message-row user" key={i}>
                    <div className="bubble-user">{m.content}</div>
                  </div>
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
                            onClick={() => setEscalationTarget(m.sourceQuestion)}
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

          {error && <div style={{ padding: '0 24px 12px' }}><ErrorAlert message={error} /></div>}

          <div className="chat-input-row">
            <input
              placeholder="Ask something…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              maxLength={2000}
            />
            <button className="btn btn-accent" onClick={() => send()} disabled={sending || !input.trim()}>
              Send <Send size={15} />
            </button>
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
    </div>
  );
}
