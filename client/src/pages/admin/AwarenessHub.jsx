import { useState, useEffect } from 'react';
import {
  Radio, Sparkles, Globe, Link2, Search, ExternalLink, Trash2, Eye,
  RefreshCw, CheckCircle2, Bot, Layers, BookOpen, Clock, AlertCircle, ArrowUpRight
} from 'lucide-react';
import api from '../../services/api.js';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import WebLinkIngesterModal from '../../components/WebLinkIngesterModal.jsx';
import ReactMarkdown from 'react-markdown';

export default function AwarenessHub() {
  const [feed, setFeed] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'auto_aware_mode' | 'web_learning'
  const [selectedTwinFilter, setSelectedTwinFilter] = useState('');
  const [twinsList, setTwinsList] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showWebModal, setShowWebModal] = useState(false);
  const [triggerSuccess, setTriggerSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'logs'
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [feedRes, statsRes, twinsRes] = await Promise.all([
        api.get('/awareness/feed', {
          params: {
            type: filterType === 'all' ? undefined : filterType,
            twinId: selectedTwinFilter || undefined,
            search: search.trim() || undefined,
            limit: 50,
          },
        }),
        api.get('/awareness/stats'),
        api.get('/twins'),
      ]);
      setFeed(feedRes.data?.entries || []);
      setStats(statsRes.data?.stats || null);
      setTwinsList(twinsRes.data?.twins || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load technology awareness feed.');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data } = await api.get('/awareness/logs');
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterType, selectedTwinFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  const handleTriggerAwareMode = async () => {
    setTriggering(true);
    setError('');
    setTriggerSuccess(null);
    try {
      const { data } = await api.post('/awareness/trigger-aware-mode');
      setTriggerSuccess(data.result);
      loadData();
      if (activeTab === 'logs') loadLogs();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not execute Aware Mode.');
    } finally {
      setTriggering(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Are you sure you want to remove this technology awareness entry?')) return;
    try {
      await api.delete(`/awareness/entry/${id}`);
      setFeed((prev) => prev.filter((item) => item._id !== id));
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete awareness entry.');
    }
  };

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* ── Page Header ────────────────────────────────────────── */}
      <div
        className="flex justify-between items-center"
        style={{ marginBottom: 24, flexWrap: 'wrap', gap: 16 }}
      >
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Radio size={24} style={{ color: 'var(--blue-accent)' }} />
            Twin Self-Awareness & Technology Radar
          </div>
          <div className="page-subtitle">
            Synchronize Digital Twins with real-time internet AI breakthroughs, new model launches, and user-ingested learning links.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowWebModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Link2 size={15} /> Ingest Web Link
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleTriggerAwareMode}
            disabled={triggering}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #3E63DD 0%, #8E4EC6 100%)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(62, 99, 221, 0.35)',
              padding: '10px 18px',
            }}
          >
            <RefreshCw size={16} className={triggering ? 'spin' : ''} />
            {triggering ? 'Assimilating Internet Intelligence…' : 'Trigger Aware Mode'}
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* ── Aware Mode Success Banner ─────────────────────────── */}
      {triggerSuccess && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(62, 99, 221, 0.1) 0%, rgba(31, 138, 92, 0.1) 100%)',
            border: '1px solid rgba(62, 99, 221, 0.25)',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <CheckCircle2 size={22} style={{ color: 'var(--success)', marginTop: 2, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-primary)', marginBottom: 4 }}>
              ✨ Aware Mode Completed Successfully!
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Synchronized <strong>{triggerSuccess.topicsDiscovered?.length || 0} frontier AI breakthroughs</strong> across{' '}
              <strong>{triggerSuccess.totalTwinsUpdated} Digital Twins</strong>. Acquired{' '}
              <strong>{triggerSuccess.totalSkillsAcquired} new technology competencies</strong> into the Twin ontology.
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setTriggerSuccess(null)}
            style={{ fontSize: 12 }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Stats Row ─────────────────────────────────────────── */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14,
            marginBottom: 28,
          }}
        >
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
              Total Technologies Assimilated
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>
              {stats.totalAwareKnowledge}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              {stats.autoAwareCount} Aware Mode · {stats.webLearningCount} Web Ingestions
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
              Synchronized Twins
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--blue-accent)' }}>
              {stats.activeAwareTwins} <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-tertiary)' }}>/ {stats.totalSystemTwins}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Active in Technology Radar
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
              Frontier Skills Acquired
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#8E4EC6' }}>
              {stats.totalUniqueSkills}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Mapped to Flowchart Ontology
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
              Last Internet Sync
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={15} style={{ color: 'var(--text-tertiary)' }} />
              {stats.latestSync ? new Date(stats.latestSync.createdAt).toLocaleDateString() + ' ' + new Date(stats.latestSync.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
              {stats.latestSync ? `Triggered by ${stats.latestSync.triggeredBy}` : 'Run Aware Mode above'}
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation Tabs ───────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setActiveTab('feed')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 600,
            color: activeTab === 'feed' ? 'var(--blue-accent)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'feed' ? '2px solid var(--blue-accent)' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Radio size={16} /> Technology Awareness Feed ({feed.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 600,
            color: activeTab === 'logs' ? 'var(--blue-accent)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'logs' ? '2px solid var(--blue-accent)' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Clock size={16} /> Aware Mode Execution History
        </button>
      </div>

      {activeTab === 'feed' && (
        <>
          {/* ── Search and Filter Controls ──────────────────────── */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            <div className="search-bar" style={{ margin: 0, maxWidth: 360, flex: 1 }}>
              <Search size={15} />
              <input
                placeholder="Search models, skills, technologies, tags…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {twinsList.length > 0 && (
                <select
                  className="input"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: 13, height: 36 }}
                  value={selectedTwinFilter}
                  onChange={(e) => setSelectedTwinFilter(e.target.value)}
                >
                  <option value="">All Digital Twins</option>
                  {twinsList.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.dept || 'Engineering'})
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                className={`filter-pill ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                All Intelligence
              </button>
              <button
                type="button"
                className={`filter-pill ${filterType === 'auto_aware_mode' ? 'active' : ''}`}
                onClick={() => setFilterType('auto_aware_mode')}
              >
                ⚡ Auto Aware Mode
              </button>
              <button
                type="button"
                className={`filter-pill ${filterType === 'web_learning' ? 'active' : ''}`}
                onClick={() => setFilterType('web_learning')}
              >
                🔗 User Web Ingestions
              </button>
            </div>
          </div>

          {/* ── Feed Listing ────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col gap-12">
              <div className="skeleton" style={{ height: 120 }} />
              <div className="skeleton" style={{ height: 120 }} />
              <div className="skeleton" style={{ height: 120 }} />
            </div>
          ) : feed.length === 0 ? (
            <EmptyState
              title="No Technology Awareness Entries"
              description={
                search || filterType !== 'all'
                  ? 'No technology awareness matches your filter criteria.'
                  : 'Trigger Aware Mode to synchronize your twins with new AI models & tech on the internet, or add a web learning link.'
              }
              action={
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary" onClick={() => setShowWebModal(true)}>
                    <Link2 size={15} /> Ingest Web Link
                  </button>
                  <button className="btn btn-primary" onClick={handleTriggerAwareMode}>
                    <RefreshCw size={15} /> Run Aware Mode Now
                  </button>
                </div>
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {feed.map((entry) => {
                const isAuto = entry.sourceType === 'auto_aware_mode';
                const skills = entry.metadata?.skillsLearned || entry.tags || [];
                const twin = entry.twinId;

                return (
                  <div
                    key={entry._id}
                    className="card"
                    style={{
                      padding: '20px 24px',
                      borderLeft: isAuto ? '4px solid #8E4EC6' : '4px solid #1F8A5C',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 20,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: '1 1 500px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                        {isAuto ? (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: 'rgba(142, 78, 198, 0.12)',
                              color: '#8E4EC6',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Sparkles size={11} /> Auto Aware Mode
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: 'rgba(31, 138, 92, 0.12)',
                              color: '#1F8A5C',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Globe size={11} /> User Web Learning
                          </span>
                        )}

                        <span className="badge badge-info" style={{ fontSize: 11 }}>
                          {entry.category}
                        </span>

                        {entry.source && (
                          <a
                            href={entry.source}
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
                            <ExternalLink size={12} /> Source Reference
                          </a>
                        )}

                        <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {entry.title}
                      </h3>

                      <p style={{ margin: '0 0 12px', fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {entry.summary}
                      </p>

                      {/* Twin Association */}
                      {twin && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'var(--surface-muted)',
                            padding: '4px 10px',
                            borderRadius: 8,
                            marginBottom: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: 'var(--navy-900)',
                              color: '#fff',
                              fontSize: 10,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {twin.avatarInitials || 'DT'}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {twin.name}
                          </span>
                          <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                            ({twin.dept || 'Engineering'})
                          </span>
                        </div>
                      )}

                      {/* Acquired Skills Chips */}
                      {skills.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-tertiary)' }}>
                            Acquired Skills:
                          </span>
                          {skills.slice(0, 5).map((s) => (
                            <span
                              key={s}
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: 'rgba(62, 99, 221, 0.08)',
                                color: 'var(--blue-accent)',
                                border: '1px solid rgba(62, 99, 221, 0.2)',
                              }}
                            >
                              {s}
                            </span>
                          ))}
                          {skills.length > 5 && (
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                              +{skills.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedEntry(entry)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <Eye size={13} /> Deep Dive Memory
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDeleteEntry(entry._id)}
                        title="Delete awareness entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Execution History Tab ──────────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
            Aware Mode Execution Audit History
          </div>
          {loadingLogs ? (
            <div className="skeleton" style={{ height: 100 }} />
          ) : logs.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', padding: '20px 0', textAlign: 'center' }}>
              No execution records recorded yet. Click "Trigger Aware Mode" to run the first sync.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {logs.map((log) => (
                <div
                  key={log._id}
                  style={{
                    padding: '14px 18px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--surface)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge badge-success" style={{ fontSize: 11 }}>
                        {log.status.toUpperCase()}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>
                        Triggered by {log.triggeredBy?.name || 'Administrator'}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {log.summary}
                  </p>

                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-tertiary)' }}>
                    <span>👥 <strong>{log.totalTwinsUpdated}</strong> Twins Synchronized</span>
                    <span>✨ <strong>{log.totalSkillsAcquired}</strong> Skills Assimilated</span>
                    <span>📚 <strong>{log.topics?.length || 0}</strong> Technology Topics</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Web Ingestion Modal ───────────────────────────────── */}
      <WebLinkIngesterModal
        isOpen={showWebModal}
        onClose={() => setShowWebModal(false)}
        onIngested={() => {
          loadData();
        }}
      />

      {/* ── Deep Dive Preview Modal ───────────────────────────── */}
      {selectedEntry && (
        <Modal
          title={selectedEntry.title}
          maxWidth={760}
          onClose={() => setSelectedEntry(null)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span className="cat" style={{ margin: 0 }}>{selectedEntry.category}</span>
            {selectedEntry.sourceType === 'auto_aware_mode' ? (
              <span className="badge badge-accent" style={{ fontSize: 11 }}>⚡ Auto Aware Mode</span>
            ) : (
              <span className="badge badge-success" style={{ fontSize: 11 }}>🔗 User Web Ingested</span>
            )}
            {selectedEntry.twinId && (
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: '3px 9px',
                  borderRadius: 6,
                  background: 'var(--surface-muted)',
                  color: 'var(--text-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Bot size={12} /> {selectedEntry.twinId.name} ({selectedEntry.twinId.dept || 'Engineering'})
              </span>
            )}
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>
              Executive Summary
            </div>
            <p style={{ margin: 0, lineHeight: 1.65, fontSize: 14, color: 'var(--text-secondary)' }}>
              {selectedEntry.summary}
            </p>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>
              Technical Architecture & Long-Term RAG Memory
            </div>
            <div
              style={{
                background: 'var(--surface-muted)',
                padding: '18px 22px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                maxHeight: 360,
                overflowY: 'auto',
                fontSize: '13.5px',
                lineHeight: 1.7,
                color: 'var(--text-primary)',
              }}
            >
              <ReactMarkdown>{selectedEntry.content}</ReactMarkdown>
            </div>
          </div>

          {selectedEntry.metadata?.skillsLearned?.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                Acquired Competencies & Flowchart Skills
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {selectedEntry.metadata.skillsLearned.map((s) => (
                  <span
                    key={s}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      background: 'rgba(62, 99, 221, 0.08)',
                      color: 'var(--blue-accent)',
                      border: '1px solid rgba(62, 99, 221, 0.2)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ✨ {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedEntry.source && (
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 14px',
                background: 'var(--surface-muted)',
                borderRadius: 8,
                marginBottom: 20,
              }}
            >
              <span>Source URL:</span>
              <a
                href={selectedEntry.source}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: 'var(--blue-accent)',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  textDecoration: 'none',
                  wordBreak: 'break-all',
                }}
              >
                {selectedEntry.source} <ExternalLink size={12} />
              </a>
            </div>
          )}

          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={() => setSelectedEntry(null)}>
              Close
            </button>
            {selectedEntry.source && (
              <a
                href={selectedEntry.source}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                Open Original Source <ArrowUpRight size={14} />
              </a>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
