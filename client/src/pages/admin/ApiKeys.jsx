import { useState, useEffect } from 'react';
import {
  Key, Plus, Copy, Check, Eye, EyeOff, ShieldAlert, Sparkles,
  Trash2, RefreshCw, Filter, CheckSquare, Square, Terminal, Globe,
  Building2, AlertCircle, X, ChevronRight, CheckCircle2
} from 'lucide-react';
import api from '../../services/api.js';
import ErrorAlert from '../../components/ErrorAlert.jsx';

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [masterKey, setMasterKey] = useState(null);
  const [allTwins, setAllTwins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals & UI States
  const [showModal, setShowModal] = useState(false);
  const [editingKey, setEditingKey] = useState(null); // null if creating
  const [showCurlModal, setShowCurlModal] = useState(false);
  const [activeCurlKey, setActiveCurlKey] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customKey: '',
    selectedTwinIds: [],
  });
  const [saving, setSaving] = useState(false);
  const [twinSearch, setTwinSearch] = useState('');
  const [twinDeptFilter, setTwinDeptFilter] = useState('ALL');

  // Key Visibility & Copy state
  const [visibleKeys, setVisibleKeys] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const getApiHost = () => {
    if (import.meta.env.VITE_API_URL) {
      const clean = import.meta.env.VITE_API_URL.replace(/\/+$/, '').replace(/\/api$/, '');
      if (clean) return clean;
    }
    if (typeof window !== 'undefined' && window.location.origin) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5004';
      }
      return window.location.origin;
    }
    return 'https://digitwin-app.onrender.com';
  };

  // Load API Keys & All Available Twins
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [keysRes, twinsRes] = await Promise.all([
        api.get('/api-keys'),
        api.get('/twins?status=all'),
      ]);
      setKeys(keysRes.data.keys || []);
      setMasterKey(keysRes.data.masterKey || null);
      setAllTwins(twinsRes.data.twins || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load API access keys.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingKey(null);
    setFormData({
      name: '',
      description: '',
      customKey: '',
      selectedTwinIds: [],
    });
    setTwinSearch('');
    setTwinDeptFilter('ALL');
    setShowModal(true);
  };

  const openEditModal = (keyItem) => {
    setEditingKey(keyItem);
    setFormData({
      name: keyItem.name,
      description: keyItem.description || '',
      customKey: keyItem.key,
      selectedTwinIds: (keyItem.twins || []).map((t) => t._id || t),
    });
    setTwinSearch('');
    setTwinDeptFilter('ALL');
    setShowModal(true);
  };

  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Key name is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (editingKey) {
        // Update existing key
        const { data } = await api.put(`/api-keys/${editingKey._id}`, {
          name: formData.name,
          description: formData.description,
          twinIds: formData.selectedTwinIds,
        });
        setSuccessMsg(data.message || 'API Key updated successfully.');
      } else {
        // Create new key
        const { data } = await api.post('/api-keys', {
          name: formData.name,
          description: formData.description,
          customKey: formData.customKey.trim() || undefined,
          twinIds: formData.selectedTwinIds,
        });
        setSuccessMsg(data.message || 'API Key created successfully.');
      }
      setShowModal(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save API Key.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (keyItem) => {
    const nextStatus = keyItem.status === 'active' ? 'revoked' : 'active';
    try {
      await api.put(`/api-keys/${keyItem._id}`, { status: nextStatus });
      loadData();
    } catch (err) {
      setError('Could not update key status.');
    }
  };

  const handleDeleteKey = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the API Key "${name}"? External users using this key will immediately lose access.`)) {
      return;
    }
    try {
      await api.delete(`/api-keys/${id}`);
      loadData();
    } catch (err) {
      setError('Could not delete API Key.');
    }
  };

  const handleRegenerateKey = async (id, name) => {
    if (!window.confirm(`Generate a brand new token string for "${name}"? The previous key token will stop working immediately.`)) {
      return;
    }
    try {
      const { data } = await api.post(`/api-keys/${id}/regenerate`);
      setSuccessMsg(data.message || 'Token regenerated successfully.');
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError('Could not regenerate token.');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleVisibility = (id) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter twins for the selector
  const availableDepts = ['ALL', ...new Set(allTwins.map((t) => t.dept).filter(Boolean))];
  const filteredTwins = allTwins.filter((t) => {
    const matchesDept = twinDeptFilter === 'ALL' || t.dept === twinDeptFilter;
    const matchesSearch = !twinSearch ||
      t.name.toLowerCase().includes(twinSearch.toLowerCase()) ||
      t.title.toLowerCase().includes(twinSearch.toLowerCase()) ||
      (t.dept || '').toLowerCase().includes(twinSearch.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const toggleTwinSelection = (twinId) => {
    setFormData((prev) => {
      const exists = prev.selectedTwinIds.includes(twinId);
      if (exists) {
        return { ...prev, selectedTwinIds: prev.selectedTwinIds.filter((id) => id !== twinId) };
      } else {
        return { ...prev, selectedTwinIds: [...prev.selectedTwinIds, twinId] };
      }
    });
  };

  const selectAllFiltered = () => {
    const idsToAdd = filteredTwins.map((t) => t._id);
    setFormData((prev) => ({
      ...prev,
      selectedTwinIds: [...new Set([...prev.selectedTwinIds, ...idsToAdd])],
    }));
  };

  const deselectAllFiltered = () => {
    const idsToRemove = new Set(filteredTwins.map((t) => t._id));
    setFormData((prev) => ({
      ...prev,
      selectedTwinIds: prev.selectedTwinIds.filter((id) => !idsToRemove.has(id)),
    }));
  };

  const selectBankingSuite = () => {
    const bankKeywords = [
      'kavita', 'vikram', 'rajesh', 'suresh', 'farida', 'rohan',
      'arvind', 'meera', 'anjali', 'sanjay', 'sunil', 'amit', 'ashok'
    ];
    const bankIds = allTwins
      .filter((t) => bankKeywords.some((k) => t.name.toLowerCase().includes(k)))
      .map((t) => t._id);

    setFormData((prev) => ({
      ...prev,
      selectedTwinIds: [...new Set([...prev.selectedTwinIds, ...bankIds])],
    }));
  };

  return (
    <div>
      {/* ── Page Header ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Key size={24} style={{ color: 'var(--blue-accent, #3b82f6)' }} />
            API Access Keys & Model Scoping
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Generate scoped API keys, manually allocate which Digital Twins are showcased, and restrict external API callers to their designated models.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-accent"
          onClick={openCreateModal}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontWeight: 600 }}
        >
          <Plus size={16} /> Create API Access Key
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#059669', padding: '10px 16px', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* ── Master Universal Key Card ────────────────────────────── */}
      {masterKey && (
        <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {masterKey.name}
                </span>
                <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12, textTransform: 'uppercase' }}>
                  Super Admin / All Models
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                System-level environment key configured in <code>.env</code>. Grants universal access across all {masterKey.allocatedCount} published Digital Twins without model filtering.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <code style={{ background: 'var(--surface-muted, #f1f5f9)', padding: '6px 12px', borderRadius: 6, fontSize: '0.82rem', fontWeight: 600, color: '#2563eb', border: '1px solid var(--border)' }}>
                {visibleKeys['master'] ? masterKey.key : '••••••••••••••••••••••••'}
              </code>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => toggleVisibility('master')}
                title={visibleKeys['master'] ? 'Hide Key' : 'Reveal Key'}
              >
                {visibleKeys['master'] ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => copyToClipboard(masterKey.key, 'master')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                {copiedId === 'master' ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                {copiedId === 'master' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Scoped API Keys Table ─────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Scoped API Access Keys ({keys.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              API callers using these keys will only see and be able to converse with the models assigned to them.
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading API access keys…
          </div>
        ) : keys.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Key size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 600 }}>No Scoped API Keys Created Yet</h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 460 }}>
              Create your first API key to manually allocate specific digital twins (e.g. only Branch Operations or Banking twins) for third-party access.
            </p>
            <button type="button" className="btn btn-accent btn-sm" onClick={openCreateModal}>
              <Plus size={14} /> Create First API Key
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-muted, #f8fafc)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 18px' }}>Key Label & Token</th>
                  <th style={{ padding: '12px 18px' }}>Allocated Digital Twins (Showcased)</th>
                  <th style={{ padding: '12px 18px' }}>Status</th>
                  <th style={{ padding: '12px 18px' }}>Usage / Last Active</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => {
                  const isVisible = !!visibleKeys[k._id];
                  const allocated = k.twins || [];
                  const isRevoked = k.status === 'revoked';

                  return (
                    <tr key={k._id} style={{ borderBottom: '1px solid var(--border)', background: isRevoked ? 'rgba(239, 68, 68, 0.02)' : 'transparent' }}>
                      {/* Name & Token */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top', minWidth: 240 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                          {k.name}
                        </div>
                        {k.description && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                            {k.description}
                          </div>
                        )}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surface-muted)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 6 }}>
                          <code style={{ fontSize: '0.78rem', color: isRevoked ? '#ef4444' : '#2563eb', fontWeight: 600 }}>
                            {isVisible ? k.key : `${k.key.slice(0, 8)}••••••••••••••••`}
                          </code>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: 2 }}
                            onClick={() => toggleVisibility(k._id)}
                            title={isVisible ? 'Hide token' : 'Reveal token'}
                          >
                            {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: 2 }}
                            onClick={() => copyToClipboard(k.key, k._id)}
                            title="Copy API key token"
                          >
                            {copiedId === k._id ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>

                      {/* Allocated Twins */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top', minWidth: 320 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: allocated.length > 0 ? '#059669' : '#f59e0b' }}>
                            {allocated.length} Model{allocated.length === 1 ? '' : 's'} Allocated
                          </span>
                          <button
                            type="button"
                            onClick={() => openEditModal(k)}
                            style={{ fontSize: '0.74rem', background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                          >
                            Edit Selection
                          </button>
                        </div>

                        {allocated.length === 0 ? (
                          <div style={{ fontSize: '0.78rem', color: '#f59e0b', fontStyle: 'italic' }}>
                            No models allocated. Key will return an empty list of twins.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 90, overflowY: 'auto' }}>
                            {allocated.map((t) => (
                              <span
                                key={t._id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: '0.74rem',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: 12,
                                  background: 'rgba(59, 130, 246, 0.08)',
                                  color: '#1d4ed8',
                                  border: '1px solid rgba(59, 130, 246, 0.2)',
                                }}
                              >
                                {t.name}
                                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>({t.dept || 'Gen'})</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top', minWidth: 100 }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(k)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: 12,
                            border: 'none',
                            cursor: 'pointer',
                            background: isRevoked ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: isRevoked ? '#dc2626' : '#059669',
                          }}
                          title="Click to toggle Active / Revoked"
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isRevoked ? '#dc2626' : '#10b981' }} />
                          {isRevoked ? 'REVOKED' : 'ACTIVE'}
                        </button>
                      </td>

                      {/* Usage */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top', minWidth: 140 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {k.usageCount || 0} calls
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {k.lastUsedAt ? `Last: ${new Date(k.lastUsedAt).toLocaleDateString()}` : 'Never used yet'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setActiveCurlKey(k);
                              setShowCurlModal(true);
                            }}
                            title="View ready-to-run curl snippet"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.76rem' }}
                          >
                            <Terminal size={13} /> Test
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditModal(k)}
                            title="Edit key & allocated models"
                            style={{ fontSize: '0.76rem' }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleRegenerateKey(k._id, k.name)}
                            title="Regenerate token string"
                            style={{ color: '#f59e0b', padding: '4px 6px' }}
                          >
                            <RefreshCw size={14} />
                          </button>

                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDeleteKey(k._id, k.name)}
                            title="Delete API key"
                            style={{ color: '#ef4444', padding: '4px 6px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit API Key Modal ───────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 840, width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editingKey ? `Edit API Access Key: "${editingKey.name}"` : 'Create New Scoped API Access Key'}
                </h2>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Manually select which Digital Twins this key will showcase and permit access to.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowModal(false)}
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveKey}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
                <div>
                  <label className="label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Key Name / Identifier *
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Branch RM Training Cohort or External Vendor Access"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Custom Key Value (Optional)
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Leave empty to auto-generate secure key (ndt_...)"
                    value={formData.customKey}
                    onChange={(e) => setFormData({ ...formData, customKey: e.target.value })}
                    disabled={!!editingKey}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Description / Scope Notes
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Scoped to Fort Branch Relationship Manager operations and Teller twins"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* ── Manual Model Allocation Selector ──────────────── */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Allocated Digital Twins ({formData.selectedTwinIds.length} of {allTwins.length} selected)
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      External clients using this key will only be able to see and query the checked models below.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={selectBankingSuite}
                      style={{ fontSize: '0.76rem', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                    >
                      ⚡ Select Banking RM Suite (13)
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={selectAllFiltered}
                      style={{ fontSize: '0.76rem' }}
                    >
                      Select All Filtered
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={deselectAllFiltered}
                      style={{ fontSize: '0.76rem' }}
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                {/* Filter and Department Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Search model by name, title, or department…"
                    value={twinSearch}
                    onChange={(e) => setTwinSearch(e.target.value)}
                    style={{ maxWidth: 300, fontSize: '0.84rem', padding: '6px 12px' }}
                  />

                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {availableDepts.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setTwinDeptFilter(d)}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 14,
                          border: twinDeptFilter === d ? '1px solid #2563eb' : '1px solid var(--border)',
                          background: twinDeptFilter === d ? '#2563eb' : 'var(--surface)',
                          color: twinDeptFilter === d ? '#ffffff' : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model Checklist Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10, maxHeight: 320, overflowY: 'auto', padding: 2 }}>
                  {filteredTwins.map((t) => {
                    const isSelected = formData.selectedTwinIds.includes(t._id);
                    return (
                      <div
                        key={t._id}
                        onClick={() => toggleTwinSelection(t._id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: isSelected ? '1px solid #10b981' : '1px solid var(--border)',
                          background: isSelected ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ color: isSelected ? '#10b981' : 'var(--text-muted)', flexShrink: 0 }}>
                          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                        </div>

                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: isSelected ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--surface-muted)',
                            color: isSelected ? '#fff' : 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            flexShrink: 0,
                          }}
                        >
                          {t.avatarInitials || t.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.title}
                          </div>
                          <span style={{ fontSize: '0.66rem', color: '#2563eb', fontWeight: 600 }}>
                            {t.dept || 'Engineering'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-accent"
                  disabled={saving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {saving ? 'Saving…' : editingKey ? 'Update API Key & Allocations' : 'Create API Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Test & Curl Instructions Modal ───────────────────────── */}
      {showCurlModal && activeCurlKey && (
        <div className="modal-overlay" onClick={() => setShowCurlModal(false)}>
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 700, width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Terminal size={20} style={{ color: '#3b82f6' }} />
                  API Integration & Curl Snippets: {activeCurlKey.name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  This key is scoped to exactly {(activeCurlKey.twins || []).length} digital twin models.
                </span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowCurlModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                1. Retrieve Only Allocated Digital Twins
              </div>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Calls the shared showcase endpoint. Response will only contain the models assigned to this key.
              </p>
              <div style={{ position: 'relative' }}>
                <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '12px 14px', borderRadius: 8, fontSize: '0.8rem', overflowX: 'auto', margin: 0 }}>
{`curl -X GET "${getApiHost()}/api/shared/twins" \\
  -H "x-api-key: ${activeCurlKey.key}"`}
                </pre>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => copyToClipboard(`curl -X GET "${getApiHost()}/api/shared/twins" \\\n  -H "x-api-key: ${activeCurlKey.key}"`, 'curl1')}
                  style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.72rem', padding: '3px 8px' }}
                >
                  {copiedId === 'curl1' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                2. Chat with an Allocated Model
              </div>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Interacts with the AI model. If the caller requests an unallocated twin, it automatically returns 403 Forbidden.
              </p>
              <div style={{ position: 'relative' }}>
                <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '12px 14px', borderRadius: 8, fontSize: '0.8rem', overflowX: 'auto', margin: 0 }}>
{`curl -X POST "${getApiHost()}/api/shared/twins/chat" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${activeCurlKey.key}" \\
  -d '{
    "twinId": "${activeCurlKey.twins?.[0]?._id || '<TWIN_ID>'}",
    "message": "Hi, can you explain the typical onboarding process?"
  }'`}
                </pre>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => copyToClipboard(`curl -X POST "${getApiHost()}/api/shared/twins/chat" \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: ${activeCurlKey.key}" \\\n  -d '{\n    "twinId": "${activeCurlKey.twins?.[0]?._id || '<TWIN_ID>'}",\n    "message": "Hi, can you explain the typical onboarding process?"\n  }'`, 'curl2')}
                  style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.72rem', padding: '3px 8px' }}
                >
                  {copiedId === 'curl2' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCurlModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
