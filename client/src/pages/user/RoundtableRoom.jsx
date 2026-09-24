import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users2, Sparkles, Send, Play, FastForward, CheckCircle2,
  PlusCircle, FileText, Check, Shield, Cpu, Briefcase, RefreshCw, Copy, MessageSquare
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import SummonModal from '../../components/SummonModal.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';

const MODE_LABELS = {
  problem_solving: 'Problem Solving',
  architecture: 'Architecture & Security',
  strategy: 'Product Strategy',
  debate: 'Cross-functional Debate',
  brainstorm: 'Rapid Brainstorming',
};

export default function RoundtableRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [roundtable, setRoundtable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [turnRunning, setTurnRunning] = useState(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);
  const [showSummonModal, setShowSummonModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [copied, setCopied] = useState(false);

  const scrollRef = useRef(null);

  const loadSession = () => {
    setLoading(true);
    setError('');
    api.get(`/roundtables/${id}`)
      .then(({ data }) => {
        setRoundtable(data.roundtable);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load roundtable.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadSession, [id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [roundtable?.turns, turnRunning]);

  // Trigger single next turn (or for a specific twin)
  const handleTriggerTurn = async (targetTwinId = null, instruction = null) => {
    if (turnRunning || !roundtable) return;
    setTurnRunning(true);
    setActiveSpeakerId(targetTwinId || null);
    setError('');

    try {
      const { data } = await api.post(`/roundtables/${id}/turn`, {
        targetTwinId,
        instruction,
      });
      setRoundtable(data.roundtable);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to progress turn.');
    } finally {
      setTurnRunning(false);
      setActiveSpeakerId(null);
    }
  };

  // Run full round across all participating twins
  const handleAutoRound = async () => {
    if (turnRunning || !roundtable) return;
    setTurnRunning(true);
    setError('');

    try {
      const { data } = await api.post(`/roundtables/${id}/auto-round`);
      setRoundtable(data.roundtable);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run discussion round.');
    } finally {
      setTurnRunning(false);
    }
  };

  // User interjection / question
  const handleSendUserMessage = async (e) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content || turnRunning || !roundtable) return;

    setInput('');
    setTurnRunning(true);
    setError('');

    try {
      const { data } = await api.post(`/roundtables/${id}/user-message`, {
        message: content,
        triggerNext: true,
      });
      setRoundtable(data.roundtable);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send prompt.');
    } finally {
      setTurnRunning(false);
    }
  };

  // Synthesize executive consensus
  const handleGenerateSummary = async () => {
    if (summarizing || !roundtable) return;
    setSummarizing(true);
    setError('');

    try {
      const { data } = await api.post(`/roundtables/${id}/summarize`);
      setRoundtable(data.roundtable);
      setShowSummaryModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to synthesize summary.');
    } finally {
      setSummarizing(false);
    }
  };

  const handleCopyBlueprint = () => {
    if (!roundtable?.summary) return;
    const s = roundtable.summary;
    const text = `# Executive Roundtable Blueprint: ${roundtable.title}
Topic: ${roundtable.topic}

## Consensus & Alignment
${s.consensus}

## Overview
${s.overview}

## Department Perspectives
${(s.perspectives || []).map((p) => `### ${p.twinName} (${p.twinTitle})\n${p.summary}\n- ${p.keyPoints.join('\n- ')}`).join('\n\n')}

## Actionable Execution Roadmap
${(s.actionPlan || []).map((a) => `Step ${a.step}: ${a.title} [Owner: ${a.owner} | Priority: ${a.priority}]\n${a.detail}`).join('\n\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading collaborative roundtable room...
      </div>
    );
  }

  if (error && !roundtable) {
    return <ErrorAlert message={error} onRetry={loadSession} />;
  }

  const turns = roundtable.turns || [];
  const twins = roundtable.twins || [];
  const hasSummary = Boolean(roundtable.summary?.consensus);

  return (
    <div className="roundtable-room-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-height) - 48px)' }}>
      {/* Top Header Bar */}
      <div className="roundtable-header flex justify-between items-center mb-16" style={{ flexShrink: 0 }}>
        <div className="flex items-center gap-12">
          <button className="back" onClick={() => navigate('/roundtable')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} /> Roundtables
          </button>
          <div style={{ height: 18, width: 1, background: 'var(--border)' }} />
          <div>
            <div className="flex items-center gap-8">
              <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>
                {roundtable.title}
              </h2>
              <span className="badge" style={{ fontSize: '0.72rem', background: 'var(--surface-muted)' }}>
                {MODE_LABELS[roundtable.discussionMode] || 'Problem Solving'}
              </span>
            </div>
            <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0, maxWidth: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {roundtable.topic}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowSummonModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <PlusCircle size={14} /> Summon Twin
          </button>

          <button
            className={`btn ${hasSummary ? 'btn-secondary' : 'btn-accent'} btn-sm`}
            onClick={() => (hasSummary ? setShowSummaryModal(true) : handleGenerateSummary())}
            disabled={summarizing || turnRunning}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {summarizing ? (
              'Synthesizing...'
            ) : hasSummary ? (
              <>
                <FileText size={14} /> View Blueprint
              </>
            ) : (
              <>
                <Sparkles size={14} /> Synthesize Consensus
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Room Layout: Left Stage (Summoned Twins) + Right Discussion Thread */}
      <div className="roundtable-main-stage" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, flex: 1, minHeight: 0 }}>
        
        {/* Left Stage: Summoned Twins Profile Cards */}
        <div className="roundtable-participants-panel" style={{
          background: 'var(--surface)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          overflowY: 'auto'
        }}>
          <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
              Summoned Twins ({twins.length})
            </span>
            <span className="status-line" style={{ fontSize: '0.75rem' }}>
              <span className="status-live-dot" /> Live
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {twins.map((twin) => {
              const isEng = twin.dept === 'Engineering';
              const isSec = twin.dept === 'Cybersecurity';
              const isProd = twin.dept === 'Product';
              const isSpeakingNow = activeSpeakerId === twin._id;

              return (
                <div
                  key={twin._id}
                  onClick={() => !turnRunning && handleTriggerTurn(twin._id)}
                  className={`participant-card ${isSpeakingNow ? 'speaking' : ''}`}
                  title="Click to ask this Twin to speak next"
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    border: isSpeakingNow ? '2px solid var(--blue-accent)' : '1px solid var(--border)',
                    background: isSpeakingNow ? 'var(--blue-accent-soft)' : 'var(--surface-muted)',
                    cursor: turnRunning ? 'default' : 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div className="flex items-center gap-8">
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: isEng ? '#3E63DD' : isSec ? '#C2422D' : isProd ? '#8A42DD' : '#1F8A5C',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      flexShrink: 0
                    }}>
                      {twin.avatarInitials || twin.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {twin.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {twin.title}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-6" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <span className="badge" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                      {twin.dept || 'Engineering'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--blue-accent)', fontWeight: 600 }}>
                      Ask to Speak →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p className="text-muted" style={{ fontSize: '0.75rem', margin: '0 0 8px 0' }}>
              Click any Twin card above to prompt their specific perspective on the topic.
            </p>
          </div>
        </div>

        {/* Right Stage: Discussion Feed & Interactive Controls */}
        <div className="roundtable-chat-stage" style={{
          background: 'var(--surface)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Discussion Messages */}
          <div className="roundtable-messages-feed" ref={scrollRef} style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            {/* Topic Framing Card */}
            <div className="roundtable-topic-banner" style={{
              background: 'var(--blue-accent-soft)',
              borderRadius: 10,
              border: '1px solid rgba(62, 99, 221, 0.2)',
              padding: '14px 16px'
            }}>
              <div className="flex items-center gap-6 mb-4">
                <Users2 size={16} style={{ color: 'var(--blue-accent)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--blue-accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Roundtable Objective & Problem Statement
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>
                {roundtable.topic}
              </p>
            </div>

            {turns.map((turn, i) => {
              if (turn.speakerRole === 'user') {
                return (
                  <div key={turn._id || i} className="roundtable-turn user" style={{
                    alignSelf: 'flex-end',
                    maxWidth: '82%',
                    background: 'var(--navy-900)',
                    color: '#fff',
                    borderRadius: '12px 12px 2px 12px',
                    padding: '12px 16px',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div className="flex items-center gap-6 mb-4" style={{ opacity: 0.8, fontSize: '0.74rem' }}>
                      <span style={{ fontWeight: 600 }}>{turn.speakerName} (Moderator)</span>
                      <span>·</span>
                      <span>Turn #{turn.turnNumber}</span>
                    </div>
                    <div style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
                      {turn.content}
                    </div>
                  </div>
                );
              }

              if (turn.speakerRole === 'moderator') {
                return (
                  <div key={turn._id || i} style={{
                    textAlign: 'center',
                    margin: '8px 0',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    background: 'var(--surface-muted)',
                    padding: '6px 14px',
                    borderRadius: 16,
                    alignSelf: 'center'
                  }}>
                    <ReactMarkdown>{turn.content}</ReactMarkdown>
                  </div>
                );
              }

              // Twin Turn
              const isEng = turn.speakerDept === 'Engineering';
              const isSec = turn.speakerDept === 'Cybersecurity';
              const isProd = turn.speakerDept === 'Product';

              return (
                <div key={turn._id || i} className="roundtable-turn twin-turn-card" style={{
                  background: 'var(--surface)',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  padding: 16,
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}>
                  {/* Speaker Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-10">
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: isEng ? '#3E63DD' : isSec ? '#C2422D' : isProd ? '#8A42DD' : '#1F8A5C',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}>
                        {turn.speakerAvatarInitials || turn.speakerName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-8">
                          <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                            {turn.speakerName}
                          </span>
                          <span className="badge" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                            {turn.speakerDept || 'Engineering'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          {turn.speakerTitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      {turn.perspective && (
                        <span className="badge" style={{
                          background: 'var(--surface-muted)',
                          color: 'var(--text-primary)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          border: '1px solid var(--border)'
                        }}>
                          {turn.perspective}
                        </span>
                      )}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                        Turn #{turn.turnNumber}
                      </span>
                    </div>
                  </div>

                  {/* Addressed To Tags */}
                  {turn.addressedTo?.length > 0 && (
                    <div className="flex items-center gap-6" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>
                        {turn.turnNumber === 1 ? 'Posing to / Inviting:' : 'Responding to:'}
                      </span>
                      {turn.addressedTo.map((name) => (
                        <span key={name} className="badge" style={{ background: 'var(--blue-accent-soft)', color: 'var(--blue-accent)', fontSize: '0.72rem' }}>
                          @{name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <div className="markdown-content" style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                    <ReactMarkdown>{turn.content}</ReactMarkdown>
                  </div>

                  {/* Key Takeaway Highlight */}
                  {turn.keyTakeaway && (
                    <div style={{
                      background: 'var(--surface-muted)',
                      borderLeft: `3px solid ${isEng ? '#3E63DD' : isSec ? '#C2422D' : '#8A42DD'}`,
                      borderRadius: '0 6px 6px 0',
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 6
                    }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                        Key Contribution:
                      </span>
                      <span>{turn.keyTakeaway}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {turnRunning && (
              <div className="roundtable-turn-loading" style={{
                padding: 16,
                borderRadius: 12,
                background: 'var(--surface-muted)',
                border: '1px dashed var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--blue-accent)' }} />
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Digital Twins are collaborating and formulating their next response...
                </span>
              </div>
            )}
          </div>

          {error && <div style={{ padding: '0 20px 10px' }}><ErrorAlert message={error} /></div>}

          {/* Bottom Action & Input Bar */}
          <div className="roundtable-controls-bar" style={{
            borderTop: '1px solid var(--border)',
            padding: 14,
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            {/* Quick Action Progression Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-8">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleTriggerTurn()}
                  disabled={turnRunning}
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Play size={14} /> Next Twin Turn
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAutoRound}
                  disabled={turnRunning}
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <FastForward size={14} /> Run Full Discussion Round
                </button>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                {turns.length} turns recorded
              </div>
            </div>

            {/* Moderator Prompt Input */}
            <form onSubmit={handleSendUserMessage} className="flex gap-8">
              <input
                type="text"
                placeholder="Intervene as Moderator: Ask a question, challenge trade-offs, or steer the twins…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={turnRunning}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: '0.88rem'
                }}
              />
              <button
                type="submit"
                className="btn btn-accent"
                disabled={turnRunning || !input.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                Send <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Consensus & Action Plan Blueprint Modal */}
      {showSummaryModal && roundtable.summary && (
        <div className="modal-overlay" onMouseDown={() => setShowSummaryModal(false)} style={{ zIndex: 1100 }}>
          <div
            className="modal-panel"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: 840, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div className="flex items-center gap-10">
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#E6F4EC',
                  color: '#1F8A5C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Executive Consensus & Action Blueprint</h2>
                  <p className="text-muted" style={{ fontSize: '0.82rem', margin: 0 }}>
                    Synthesized strategy and actionable execution roadmap across all participating Twins.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopyBlueprint}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Blueprint'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowSummaryModal(false)}>
                  Close
                </button>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '18px 4px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Executive Consensus Box */}
              <div style={{
                background: 'var(--blue-accent-soft)',
                borderRadius: 10,
                border: '1px solid rgba(62, 99, 221, 0.25)',
                padding: 16
              }}>
                <h4 style={{ margin: '0 0 6px 0', color: 'var(--blue-accent)', fontSize: '0.86rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Unified Consensus Statement
                </h4>
                <p style={{ margin: 0, fontSize: '0.94rem', lineHeight: 1.5, color: 'var(--text-primary)', fontWeight: 500 }}>
                  {roundtable.summary.consensus}
                </p>
              </div>

              {/* Department Perspectives Breakdown */}
              <div>
                <h3 style={{ fontSize: '1rem', margin: '0 0 12px 0' }}>Department Perspectives</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                  {(roundtable.summary.perspectives || []).map((p, idx) => (
                    <div key={idx} style={{
                      background: 'var(--surface-muted)',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      padding: 14
                    }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{p.twinName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{p.twinTitle}</div>
                      <p style={{ fontSize: '0.82rem', lineHeight: 1.45, margin: '0 0 10px 0' }}>{p.summary}</p>
                      <div className="flex flex-col gap-4">
                        {(p.keyPoints || []).map((kp, kIdx) => (
                          <div key={kIdx} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: 5 }}>
                            <span>•</span>
                            <span>{kp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ordered Action Roadmap */}
              <div>
                <h3 style={{ fontSize: '1rem', margin: '0 0 12px 0' }}>Actionable Execution Roadmap</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(roundtable.summary.actionPlan || []).map((item) => (
                    <div key={item.step} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      padding: 14,
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)'
                    }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'var(--navy-900)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        flexShrink: 0
                      }}>
                        {item.step}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="flex justify-between items-center mb-4">
                          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                            {item.title}
                          </span>
                          <div className="flex items-center gap-8">
                            <span className="badge" style={{ fontSize: '0.72rem', background: 'var(--blue-accent-soft)', color: 'var(--blue-accent)' }}>
                              Owner: {item.owner}
                            </span>
                            <span className="badge" style={{ fontSize: '0.72rem', background: item.priority === 'High' ? '#FBEAE6' : '#EEF1F5', color: item.priority === 'High' ? '#C2422D' : '#5B6472' }}>
                              {item.priority} Priority
                            </span>
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summon Additional Twins Modal */}
      <SummonModal
        isOpen={showSummonModal}
        onClose={() => setShowSummonModal(false)}
        existingRoundtableId={id}
        onSummoned={(updatedRoundtable) => setRoundtable(updatedRoundtable)}
      />
    </div>
  );
}
