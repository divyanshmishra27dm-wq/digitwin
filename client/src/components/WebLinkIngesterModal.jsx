import { useState, useEffect } from 'react';
import { Globe, Sparkles, CheckCircle2, AlertCircle, Loader2, ExternalLink, ArrowRight } from 'lucide-react';
import api from '../services/api.js';
import Modal from './Modal.jsx';

export default function WebLinkIngesterModal({ isOpen, onClose, defaultTwinId = null, onIngested = null }) {
  const [twins, setTwins] = useState([]);
  const [selectedTwinId, setSelectedTwinId] = useState(defaultTwinId || '');
  const [url, setUrl] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('input'); // 'input' | 'processing' | 'success'
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setStep('input');
      setUrl('');
      setCustomNotes('');
      setResult(null);

      // Fetch published twins for selection if no default twin
      if (!defaultTwinId) {
        api.get('/twins')
          .then(({ data }) => {
            const list = data.twins || [];
            setTwins(list);
            if (list.length > 0 && !selectedTwinId) {
              setSelectedTwinId(list[0]._id);
            }
          })
          .catch(() => {});
      } else {
        setSelectedTwinId(defaultTwinId);
      }
    }
  }, [isOpen, defaultTwinId]);

  if (!isOpen) return null;

  const handleIngest = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please provide a valid website URL.');
      return;
    }
    if (!selectedTwinId) {
      setError('Please select a target Digital Twin.');
      return;
    }

    setLoading(true);
    setError('');
    setStep('processing');
    setProgressMsg('Connecting to website & extracting content…');

    try {
      setTimeout(() => {
        setProgressMsg('Analyzing technical architecture & distilling key learnings…');
      }, 1500);

      setTimeout(() => {
        setProgressMsg('Assimilating into Twin RAG memory & expanding skills…');
      }, 3500);

      const { data } = await api.post('/awareness/ingest-url', {
        twinId: selectedTwinId,
        url: url.trim(),
        customNotes: customNotes.trim(),
      });

      setResult(data);
      setStep('success');
      if (onIngested) {
        onIngested(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to read and ingest this web link.');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const selectedTwin = twins.find((t) => t._id === selectedTwinId);

  return (
    <Modal
      title="Make Twin Aware via Web Link"
      onClose={step === 'processing' ? () => {} : onClose}
    >
      {step === 'input' && (
        <form onSubmit={handleIngest}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(62, 99, 221, 0.08) 0%, rgba(142, 78, 198, 0.08) 100%)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '14px 18px',
            marginBottom: 20,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}>
            <Globe size={28} style={{ color: 'var(--blue-accent)', flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Paste any website, technical paper, documentation, blog post, or release note you went through.
              The AI will read, summarize, and assimilate the knowledge and newly learned skills directly into your Digital Twin.
            </div>
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-soft)',
              color: 'var(--danger)',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {!defaultTwinId && twins.length > 0 && (
            <div className="field" style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>
                Select Target Digital Twin
              </label>
              <select
                className="input"
                value={selectedTwinId}
                onChange={(e) => setSelectedTwinId(e.target.value)}
                required
              >
                {twins.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} — {t.title} ({t.dept || 'Engineering'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Website / Article / Documentation URL <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="url"
              className="input"
              placeholder="https://example.com/deepseek-r1-architecture or https://docs.anthropic.com/mcp"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="field" style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Your Key Takeaways or Context (Optional)
            </label>
            <textarea
              className="textarea"
              placeholder="e.g. Learned how this reduces API latency by 40% and solves our vector search bottleneck."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              style={{ minHeight: 80 }}
            />
          </div>

          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !url.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Sparkles size={15} /> Read & Assimilate Learning
            </button>
          </div>
        </form>
      )}

      {step === 'processing' && (
        <div style={{ textAlign: 'center', padding: '36px 16px' }}>
          <div style={{ display: 'inline-block', position: 'relative', marginBottom: 20 }}>
            <Loader2 size={44} className="spin" style={{ color: 'var(--blue-accent)' }} />
          </div>
          <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700 }}>Reading & Synthesizing Web Intelligence</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 380, margin: '0 auto' }}>
            {progressMsg}
          </p>
          <div style={{
            marginTop: 24,
            fontSize: 12,
            color: 'var(--text-tertiary)',
            fontFamily: 'monospace',
            background: 'var(--surface-muted)',
            padding: '6px 14px',
            borderRadius: 6,
            display: 'inline-block',
          }}>
            {url}
          </div>
        </div>
      )}

      {step === 'success' && result && (
        <div>
          <div style={{
            background: 'var(--success-soft)',
            border: '1px solid rgba(31, 138, 92, 0.25)',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <CheckCircle2 size={24} style={{ color: 'var(--success)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 14 }}>
                Web Knowledge Assimilated Successfully!
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                This knowledge is now part of the Digital Twin's active memory.
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '16px 18px',
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-accent" style={{ fontSize: 11 }}>
                {result.knowledge?.category || 'AI & Tech'}
              </span>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 12,
                  color: 'var(--blue-accent)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={12} /> Source Link
              </a>
            </div>

            <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>
              {result.knowledge?.title}
            </h4>

            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {result.knowledge?.summary}
            </p>

            {result.newlyAddedSkills?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  ✨ Newly Acquired Skills Added to Profile:
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {result.newlyAddedSkills.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: '3px 9px',
                        borderRadius: 6,
                        background: 'rgba(142, 78, 198, 0.12)',
                        color: '#8E4EC6',
                        border: '1px solid rgba(142, 78, 198, 0.25)',
                      }}
                    >
                      + {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setStep('input');
                setUrl('');
                setCustomNotes('');
              }}
            >
              Ingest Another Link
            </button>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
