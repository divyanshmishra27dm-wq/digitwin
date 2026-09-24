import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Layers, Cpu, BookOpen } from 'lucide-react';
import api from '../services/api.js';

export default function CVUploader({ onParsed, onClear, initialParsed = null }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsingStage, setParsingStage] = useState(0); // 0: Idle, 1: Reading, 2: Extracting Projects, 3: Synthesizing Skills & Persona
  const [error, setError] = useState('');
  const [parsedResult, setParsedResult] = useState(initialParsed);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const STAGES = [
    { label: 'Uploading document…', icon: <Upload size={14} /> },
    { label: 'Analyzing structure & text…', icon: <FileText size={14} /> },
    { label: 'Extracting projects, architecture & domain experience…', icon: <Cpu size={14} /> },
    { label: 'Synthesizing skills, bio & persona pretext…', icon: <Sparkles size={14} /> },
  ];

  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;

    // Validate extension
    const allowed = ['.pdf', '.docx', '.doc', '.txt', '.md'];
    const nameLower = selectedFile.name.toLowerCase();
    const isSupported = allowed.some((ext) => nameLower.endsWith(ext));

    if (!isSupported) {
      setError('Please upload a PDF (.pdf), Word document (.docx/.doc), or plain text (.txt/.md) file.');
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('File size exceeds the 20MB limit.');
      return;
    }

    setFile(selectedFile);
    setError('');
    setUploading(true);
    setParsingStage(0);

    const formData = new FormData();
    formData.append('file', selectedFile);

    // Simulate progressive stages while backend parses with LLM
    const stageTimer1 = setTimeout(() => setParsingStage(1), 700);
    const stageTimer2 = setTimeout(() => setParsingStage(2), 2400);
    const stageTimer3 = setTimeout(() => setParsingStage(3), 5500);

    try {
      const { data } = await api.post('/twins/parse-cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);

      const parsed = data.parsed || {};
      setParsedResult(parsed);
      if (onParsed) {
        onParsed(parsed);
      }
    } catch (err) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setError(err.response?.data?.message || 'Could not parse this CV file. Please try another file or proceed with manual entry.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const reset = () => {
    setFile(null);
    setParsedResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onClear) onClear();
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.06) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--primary, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 4,
            }}
          >
            <Sparkles size={14} /> AI Knowledge & Resume Ingestion
          </div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
            Auto-generate Twin from CV / Resume
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Upload a resume or project document. Our RAG engine extracts the owner's documented projects, skills, education, and bio to pre-fill your Twin.
          </p>
        </div>

        {parsedResult && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={reset}
            style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <RefreshCw size={13} /> Re-upload
          </button>
        )}
      </div>

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

      {!parsedResult && !uploading && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: isDragOver ? '2px dashed #3b82f6' : '2px dashed var(--border)',
            borderRadius: 10,
            padding: '24px 20px',
            textAlign: 'center',
            background: isDragOver ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.md"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
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
              marginBottom: 10,
            }}
          >
            <Upload size={20} />
          </div>

          <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: 4 }}>
            Drop CV / Resume file here, or <span style={{ color: '#3b82f6', textDecoration: 'underline' }}>browse</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Supports PDF, DOCX, DOC, TXT, MD (Max 20MB)
          </div>
        </div>
      )}

      {uploading && (
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '20px 24px',
            background: 'var(--bg-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'spin 2s linear infinite',
              }}
            >
              <RefreshCw size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Analyzing "{file?.name || 'Resume'}"
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Extracting technical background, documented projects, and communication tone…
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STAGES.map((s, idx) => {
              const isDone = idx < parsingStage;
              const isCurrent = idx === parsingStage;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: '0.82rem',
                    color: isDone ? '#10b981' : isCurrent ? '#3b82f6' : 'var(--text-muted)',
                    fontWeight: isCurrent ? 600 : 400,
                  }}
                >
                  <span style={{ display: 'inline-flex' }}>
                    {isDone ? <CheckCircle2 size={15} /> : isCurrent ? s.icon : <div style={{ width: 14, height: 14, borderRadius: 7, border: '1px solid var(--border)' }} />}
                  </span>
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {parsedResult && !uploading && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 10,
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 600, fontSize: '0.92rem' }}>
              <CheckCircle2 size={18} />
              <span>Resume Analysis Complete</span>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontWeight: 600,
              }}
            >
              {parsedResult.fileName || 'CV Document'}
            </span>
          </div>

          <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            We've extracted the candidate's core identity, bio, skills ontology, and <strong>{parsedResult.projects?.length || 0} documented projects</strong>.
            All fields below and subsequent wizard steps are pre-populated. You can review, add, or remove any detail.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <div
              style={{
                fontSize: '0.78rem',
                padding: '4px 10px',
                borderRadius: 6,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Layers size={13} style={{ color: '#3b82f6' }} />
              <span><strong>{parsedResult.projects?.length || 0}</strong> Projects Extracted</span>
            </div>

            <div
              style={{
                fontSize: '0.78rem',
                padding: '4px 10px',
                borderRadius: 6,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Cpu size={13} style={{ color: '#8b5cf6' }} />
              <span><strong>{parsedResult.expertise?.length || 0}</strong> Skills Categorized</span>
            </div>

            <div
              style={{
                fontSize: '0.78rem',
                padding: '4px 10px',
                borderRadius: 6,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <BookOpen size={13} style={{ color: '#f59e0b' }} />
              <span>Identity & Persona Ready</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
