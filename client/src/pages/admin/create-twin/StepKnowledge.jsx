import { useEffect, useState } from 'react';
import { Plus, Trash2, Upload, FileText, Sparkles, Eye, Check } from 'lucide-react';
import api from '../../../services/api.js';
import DocumentUploader from '../../../components/DocumentUploader.jsx';
import Modal from '../../../components/Modal.jsx';

const EMPTY = { title: '', category: '', summary: '', content: '', tags: '', source: '' };

export default function StepKnowledge({ twin, next, back, cvPretext }) {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [previewEntry, setPreviewEntry] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () =>
    api
      .get(`/twins/${twin._id}/knowledge`)
      .then(({ data }) => setEntries(Array.isArray(data?.knowledge) ? data.knowledge : []))
      .catch((err) => console.error('Failed to load knowledge:', err));

  useEffect(() => {
    if (twin?._id) {
      load();
    }
  }, [twin?._id]);

  const addEntry = async (e) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.summary || !form.content) {
      setError('Title, category, summary and knowledge detail are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post(`/twins/${twin._id}/knowledge`, {
        ...form,
        tags: typeof form.tags === 'string' ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : form.tags,
      });
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add this knowledge entry.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/knowledge/${id}`);
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      console.error('Failed to delete knowledge entry:', err);
    }
  };

  return (
    <div className="wizard-card" style={{ maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <h2>Documented Knowledge & Projects</h2>
          <p className="lead" style={{ margin: '4px 0 0' }}>
            Curate the documented projects, systems, and domain facts this Twin knows. The RAG architecture grounds all twin answers in these verified entries.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setShowDocUpload(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
        >
          <Upload size={14} /> Upload Additional Docs
        </button>
      </div>

      {cvPretext?.projects?.length > 0 && entries.length > 0 && (
        <div
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: '0.84rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
          }}
        >
          <Sparkles size={15} style={{ color: '#3b82f6', flexShrink: 0 }} />
          <span>
            <strong>{entries.length} project & knowledge entries</strong> are actively loaded from your uploaded document. You can add more, view content, or remove any item.
          </span>
        </div>
      )}

      {error && <div className="auth-error">{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {entries.map((entry) => {
          const isFromCV = entry.sourceType === 'cv_upload';
          const isFromDoc = entry.sourceType === 'document_upload';

          return (
            <div
              className="knowledge-entry-card"
              key={entry._id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: 8,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <h4 style={{ margin: 0, fontSize: '0.98rem' }}>{entry.title}</h4>
                  <span className="cat" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                    {entry.category}
                  </span>
                  {isFromCV && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#8b5cf6',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <Sparkles size={11} /> CV Ingested
                    </span>
                  )}
                  {isFromDoc && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#3b82f6',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <FileText size={11} /> {entry.source || 'Doc Upload'}
                    </span>
                  )}
                </div>

                <p style={{ margin: '4px 0 8px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {entry.summary}
                </p>

                {entry.tags?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {entry.tags.map((t) => (
                      <span key={t} className="chip" style={{ fontSize: 11, padding: '2px 7px' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPreviewEntry(entry)}
                  title="View full knowledge content"
                >
                  <Eye size={14} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#ef4444' }}
                  onClick={() => remove(entry._id)}
                  title="Remove knowledge entry"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}

        {entries.length === 0 && (
          <div
            style={{
              padding: '28px 20px',
              textAlign: 'center',
              background: 'var(--bg-secondary)',
              borderRadius: 8,
              border: '1px dashed var(--border)',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: 4 }}>No knowledge entries yet</div>
            <p className="text-muted" style={{ fontSize: '0.82rem', margin: '0 0 16px' }}>
              Upload project documents or add manual project records to give this Twin factual knowledge.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowDocUpload(true)}>
                <Upload size={14} /> Upload Project Docs
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(true)}>
                <Plus size={14} /> Add Entry Manually
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm ? (
        <form onSubmit={addEntry} className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '1rem' }}>Add Knowledge Entry</h3>
          <div className="grid-2">
            <div className="field">
              <label>Project / Topic Title</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. NexIQ Enterprise App"
                required
              />
            </div>
            <div className="field">
              <label>Domain Category</label>
              <input
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Enterprise AI, Cloud Infrastructure"
                required
              />
            </div>
          </div>
          <div className="field">
            <label>Summary</label>
            <input
              className="input"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="High-level 2-sentence summary of what was accomplished."
              required
            />
          </div>
          <div className="field">
            <label>Detailed Knowledge & Architecture (RAG Content)</label>
            <textarea
              className="textarea"
              style={{ minHeight: 120 }}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Detailed explanation of problem statement, architecture, tech stack, key accomplishments, metrics, and learnings."
              required
            />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Tags (comma-separated)</label>
              <input
                className="input"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="e.g. Python, Docker, RAG, AWS"
              />
            </div>
            <div className="field">
              <label>Source Reference</label>
              <input
                className="input"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="e.g. Project Architecture Whitepaper"
              />
            </div>
          </div>
          <div className="flex gap-12 mt-12">
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Adding…' : 'Add Knowledge Entry'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Add Knowledge Entry
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowDocUpload(true)}>
            <Upload size={14} /> Upload Documents
          </button>
        </div>
      )}

      {/* Document Uploader Modal */}
      {showDocUpload && (
        <DocumentUploader
          twinId={twin._id}
          onIngested={() => {
            load();
            setShowDocUpload(false);
          }}
          onClose={() => setShowDocUpload(false)}
        />
      )}

      {/* Preview Knowledge Modal */}
      {previewEntry && (
        <Modal title={previewEntry.title} onClose={() => setPreviewEntry(null)}>
          <div className="cat mb-12">{previewEntry.category}</div>
          <div className="field-label" style={{ fontWeight: 600, marginTop: 12 }}>Summary</div>
          <p className="text-muted" style={{ lineHeight: 1.6 }}>{previewEntry.summary}</p>

          <div className="field-label" style={{ fontWeight: 600, marginTop: 16 }}>Detailed Knowledge</div>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, marginTop: 4 }}>{previewEntry.content}</p>

          {previewEntry.tags?.length > 0 && (
            <>
              <div className="field-label" style={{ fontWeight: 600, marginTop: 16 }}>Tags</div>
              <div className="flex flex-wrap gap-8 mt-4">
                {previewEntry.tags.map((t) => (
                  <span key={t} className="chip">{t}</span>
                ))}
              </div>
            </>
          )}

          {previewEntry.source && (
            <div className="text-tertiary mt-16" style={{ fontSize: 12 }}>
              Source: {previewEntry.source} ({previewEntry.sourceType || 'document'})
            </div>
          )}

          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setPreviewEntry(null)}>Close</button>
          </div>
        </Modal>
      )}

      <div className="wizard-actions mt-32">
        <button type="button" className="btn btn-secondary" onClick={back}>Back</button>
        <button type="button" className="btn btn-primary" onClick={next} disabled={entries.length === 0}>
          Continue to Persona ({entries.length} Entries)
        </button>
      </div>
    </div>
  );
}
