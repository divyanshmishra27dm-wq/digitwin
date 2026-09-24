import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, X, Plus, Sparkles, Layers } from 'lucide-react';
import api from '../services/api.js';

export default function DocumentUploader({ twinId, onIngested, onClose }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (incomingList) => {
    if (!incomingList || incomingList.length === 0) return;

    const allowed = ['.pdf', '.docx', '.doc', '.txt', '.md'];
    const valid = [];

    for (let i = 0; i < incomingList.length; i++) {
      const f = incomingList[i];
      const nameLower = f.name.toLowerCase();
      if (allowed.some((ext) => nameLower.endsWith(ext))) {
        valid.push(f);
      }
    }

    if (valid.length === 0) {
      setError('Please upload PDF, DOCX, TXT, or MD documents.');
      return;
    }

    setError('');
    setFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    setError('');
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }

    try {
      const { data } = await api.post(`/twins/${twinId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessCount(data.results?.reduce((acc, r) => acc + (r.count || 0), 0) || files.length);
      setTimeout(() => {
        if (onIngested) {
          onIngested(data.knowledge);
        }
        if (onClose) {
          onClose();
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process and ingest document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal-panel"
        style={{ maxWidth: 600, width: '95%' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Sparkles size={13} /> RAG Document Ingestion
            </div>
            <h3 style={{ margin: '4px 0 0' }}>Upload Project Documents & Knowledge</h3>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={uploading}>
            <X size={16} />
          </button>
        </div>

        <p className="text-muted" style={{ fontSize: '0.86rem', margin: '8px 0 16px', lineHeight: 1.5 }}>
          Upload technical design specs, project whitepapers, project retrospectives, architecture summaries, or research docs (PDF, Word, Markdown, Text).
          Our RAG engine decomposes them into structured knowledge chunks for this Twin.
        </p>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: '0.85rem',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successCount > 0 && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: '0.88rem',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <CheckCircle2 size={18} />
            <span>Successfully ingested {successCount} knowledge entries into the Twin's RAG knowledge base!</span>
          </div>
        )}

        <div
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: isDragOver ? '2px dashed #3b82f6' : '2px dashed var(--border)',
            borderRadius: 10,
            padding: '24px 20px',
            textAlign: 'center',
            background: isDragOver ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: 16,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt,.md"
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#3b82f6',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}
          >
            <Upload size={20} />
          </div>

          <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: 4 }}>
            Click or drag & drop documents here
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Supports PDF, DOCX, DOC, TXT, MD (Up to 10 files, max 20MB each)
          </div>
        </div>

        {files.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
              Selected Documents ({files.length}):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
              {files.map((f, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    fontSize: '0.84rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <FileText size={15} style={{ color: '#3b82f6', flexShrink: 0 }} />
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      ({Math.round(f.size / 1024)} KB)
                    </span>
                  </div>
                  {!uploading && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 6px' }}
                      onClick={() => removeFile(idx)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={submit}
            disabled={uploading || files.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {uploading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Parsing & Ingesting…
              </>
            ) : (
              <>
                <Layers size={14} />
                Ingest {files.length > 0 ? `${files.length} Document(s)` : 'Documents'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
