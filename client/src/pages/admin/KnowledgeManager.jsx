import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Pencil, Trash2, Eye, Upload, FileText, Sparkles, Layers, Globe, Link2 } from 'lucide-react';
import api from '../../services/api.js';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import Modal from '../../components/Modal.jsx';
import DocumentUploader from '../../components/DocumentUploader.jsx';
import WebLinkIngesterModal from '../../components/WebLinkIngesterModal.jsx';

const EMPTY = { title: '', category: '', summary: '', content: '', tags: '', source: '', sourceType: 'manual' };

export default function KnowledgeManager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [twin, setTwin] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [showWebModal, setShowWebModal] = useState(false);
  const [previewEntry, setPreviewEntry] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [twinRes, knowRes] = await Promise.all([
        api.get(`/twins/${id}`),
        api.get(`/twins/${id}/knowledge`),
      ]);
      setTwin(twinRes.data?.twin || null);
      setEntries(Array.isArray(knowRes.data?.knowledge) ? knowRes.data.knowledge : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load knowledge.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const categories = ['All', ...new Set((entries || []).map((e) => e.category).filter(Boolean))];

  const filtered = (entries || []).filter((e) => {
    const matchesFilter = filter === 'All' || e.category === filter;
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      (e.title || '').toLowerCase().includes(q) ||
      (e.summary || '').toLowerCase().includes(q) ||
      (e.content || '').toLowerCase().includes(q) ||
      (e.source || '').toLowerCase().includes(q) ||
      (e.tags || []).some((t) => t.toLowerCase().includes(q));
    return matchesFilter && matchesQuery;
  });

  const openNew = () => {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (entry) => {
    setForm({
      ...entry,
      tags: (entry.tags || []).join(', '),
      source: entry.source || '',
      sourceType: entry.sourceType || 'manual',
    });
    setEditingId(entry._id);
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      tags: typeof form.tags === 'string' ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : form.tags,
    };
    try {
      if (editingId) {
        await api.patch(`/knowledge/${editingId}`, payload);
      } else {
        await api.post(`/twins/${id}/knowledge`, payload);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this entry.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this knowledge entry?')) return;
    try {
      await api.delete(`/knowledge/${entryId}`);
      setEntries((prev) => prev.filter((e) => e._id !== entryId));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete knowledge entry.');
    }
  };

  return (
    <div>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate(`/admin/twins/${id}`)}
        style={{ marginBottom: 20 }}
      >
        <ArrowLeft size={15} /> Back to Twin {twin ? `(${twin.name})` : ''}
      </button>

      <div className="flex justify-between items-center" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="page-title">RAG Knowledge Library & Document Ingestion</div>
          <div className="page-subtitle">
            {twin ? `Documented knowledge base and project memory for ${twin.name}.` : 'What this Twin is grounded in.'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setShowWebModal(true)}>
            <Globe size={15} /> Learn from Web Link
          </button>
          <button className="btn btn-secondary" onClick={() => setShowDocUpload(true)}>
            <Upload size={15} /> Ingest Documents
          </button>
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={15} /> Add Knowledge
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={load} />}

      <div className="knowledge-toolbar">
        <div className="search-bar" style={{ margin: 0, maxWidth: 360 }}>
          <Search size={15} />
          <input
            placeholder="Search projects, architecture, tags, sources…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {categories.length > 1 && (
        <div className="knowledge-filters mt-16" style={{ marginBottom: 20 }}>
          {categories.map((c) => (
            <button
              key={c}
              className={`filter-pill${filter === c ? ' active' : ''}`}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-12">
          <div className="skeleton" style={{ height: 100 }} />
          <div className="skeleton" style={{ height: 100 }} />
          <div className="skeleton" style={{ height: 100 }} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No knowledge entries"
          description={
            query || filter !== 'All'
              ? 'No entries match your search.'
              : 'Upload project documents or add the first documented knowledge entry for this Twin.'
          }
          action={
            !query && filter === 'All' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" onClick={() => setShowDocUpload(true)}>
                  <Upload size={15} /> Upload Project Docs
                </button>
                <button className="btn btn-primary" onClick={openNew}>
                  <Plus size={15} /> Add Knowledge
                </button>
              </div>
            )
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((entry) => {
            const isFromCV = entry.sourceType === 'cv_upload';
            const isFromDoc = entry.sourceType === 'document_upload';
            const isFromWeb = entry.sourceType === 'web_learning';
            const isAutoAware = entry.sourceType === 'auto_aware_mode';

            return (
              <div className="knowledge-entry-card" key={entry._id}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <h4 style={{ margin: 0 }}>{entry.title}</h4>
                    <span className="cat">{entry.category}</span>
                    {isFromCV && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '2px 7px',
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
                          padding: '2px 7px',
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
                    {isFromWeb && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: 'rgba(31, 138, 92, 0.15)',
                          color: '#1F8A5C',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <Globe size={11} /> Web Link Learned
                      </span>
                    )}
                    {isAutoAware && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: 'rgba(142, 78, 198, 0.15)',
                          color: '#8E4EC6',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <Sparkles size={11} /> Auto Aware Mode
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.55 }}>
                    {entry.summary}
                  </p>

                  {entry.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-6 mt-8">
                      {entry.tags.map((t) => (
                        <span key={t} className="chip" style={{ fontSize: 11, padding: '2px 8px' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-8" style={{ flexShrink: 0 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setPreviewEntry(entry)}>
                    <Eye size={14} /> Preview
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(entry)}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => remove(entry._id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Web Link Ingestion Modal */}
      {showWebModal && (
        <WebLinkIngesterModal
          isOpen={showWebModal}
          onClose={() => setShowWebModal(false)}
          defaultTwinId={id}
          onIngested={load}
        />
      )}

      {/* Document Ingestion Modal */}
      {showDocUpload && (
        <DocumentUploader
          twinId={id}
          onIngested={(newKnowledge) => {
            if (newKnowledge) setEntries(newKnowledge);
            else load();
          }}
          onClose={() => setShowDocUpload(false)}
        />
      )}

      {/* ── Preview Modal ────────────────────────────── */}
      {previewEntry && (
        <Modal title={previewEntry.title} onClose={() => setPreviewEntry(null)}>
          <div className="flex items-center gap-8 mb-12 flex-wrap">
            <span className="cat">{previewEntry.category}</span>
            {previewEntry.sourceType === 'cv_upload' && (
              <span className="badge badge-accent" style={{ fontSize: 11 }}>CV Ingested</span>
            )}
            {previewEntry.sourceType === 'document_upload' && (
              <span className="badge badge-info" style={{ fontSize: 11 }}>Document Ingested</span>
            )}
            {previewEntry.sourceType === 'web_learning' && (
              <span className="badge badge-success" style={{ fontSize: 11 }}>Web Learning</span>
            )}
            {previewEntry.sourceType === 'auto_aware_mode' && (
              <span className="badge badge-accent" style={{ fontSize: 11 }}>Auto Aware Mode</span>
            )}
          </div>

          <div className="field-label" style={{ fontWeight: 600, marginTop: 12 }}>Summary</div>
          <p className="text-muted" style={{ lineHeight: 1.6 }}>{previewEntry.summary}</p>

          <div className="field-label" style={{ fontWeight: 600, marginTop: 16 }}>Detailed Knowledge & Architecture</div>
          <div
            style={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.65,
              marginTop: 6,
              background: 'var(--bg-secondary)',
              padding: '14px 18px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              maxHeight: 350,
              overflowY: 'auto',
              fontSize: '0.88rem',
            }}
          >
            {previewEntry.content}
          </div>

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
              Source: {previewEntry.source}
            </div>
          )}

          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setPreviewEntry(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* ── Add / Edit Modal ─────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onMouseDown={() => setShowForm(false)}>
          <div className="modal-panel" style={{ maxWidth: 640 }} onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Knowledge Entry' : 'Add Knowledge Entry'}</h3>
            </div>
            <form onSubmit={save}>
              <div className="grid-2">
                <div className="field">
                  <label>Title / Project Name</label>
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
                    placeholder="e.g. Enterprise AI, Cloud Infra"
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
                  placeholder="2-sentence high-level overview"
                  required
                />
              </div>
              <div className="field">
                <label>Detailed Knowledge & System Architecture (RAG Content)</label>
                <textarea
                  className="textarea"
                  style={{ minHeight: 140 }}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Comprehensive technical details: problem, solution architecture, tech stack, key accomplishments, metrics, trade-offs, and learnings."
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
                    placeholder="e.g. Python, Docker, Keycloak, RAG"
                  />
                </div>
                <div className="field">
                  <label>Source Reference</label>
                  <input
                    className="input"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    placeholder="e.g. Project Whitepaper / CV"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
