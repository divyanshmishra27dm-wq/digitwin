import { X, FileText, Sparkles, CheckCircle2 } from 'lucide-react';

const SOURCE_DETAILS = {
  'LLM Council': {
    category: 'Enterprise AI',
    summary: 'AI-assisted analysis of MBR/QBR information to identify patterns, cross-BU insights, and variances.',
    tags: ['MBR', 'QBR', 'Strategy', 'Business Intelligence', 'AI'],
  },
  NexIQ: {
    category: 'Software Engineering',
    summary: 'Enterprise application engineering, Docker containerization, Keycloak authentication, and cloud deployment.',
    tags: ['Docker', 'MongoDB', 'AWS', 'Azure', 'Keycloak', 'Infrastructure'],
  },
  Wakubo: {
    category: 'Entrepreneurship',
    summary: 'AI fashion-technology venture featuring an AI fashion stylist, personalized recommendations, and virtual try-on.',
    tags: ['Computer Vision', 'Recommendations', 'Fashion Tech', 'Entrepreneurship'],
  },
  'World Model / EdTech': {
    category: 'Research',
    summary: 'Concept for accelerated simulation of education and product decisions using learner and market data.',
    tags: ['EdTech', 'Simulation', 'Research', 'Product'],
  },
  'AI Research': {
    category: 'Research',
    summary: 'Generative AI, computer vision, and educational technology experimentation and rapid prototyping.',
    tags: ['Generative AI', 'Computer Vision', 'Research', 'Experimentation'],
  },
  'Problem Solving': {
    category: 'Approach',
    summary: 'A problem-first, practical, product-aware approach to building AI solutions and proof-of-concepts.',
    tags: ['Problem Solving', 'Product', 'AI Strategy', 'POC'],
  },
  Communication: {
    category: 'Style',
    summary: 'Direct, practical and conversational communication style.',
    tags: ['Communication', 'Style'],
  },
};

export default function SourcePanel({ source, onClose }) {
  if (!source) return null;
  const staticDetails = SOURCE_DETAILS[source.title] || {};
  const category = source.category || staticDetails.category || 'Documented Project Knowledge';
  const summary = source.summary || staticDetails.summary || `This response drew upon documented knowledge in the Twin's RAG knowledge repository for "${source.title}".`;
  const tags = source.tags || staticDetails.tags || ['Verified Knowledge', 'RAG Context'];
  const sourceOrigin = source.source || staticDetails.source || '';

  return (
    <div className="source-panel-overlay" onMouseDown={onClose}>
      <div className="source-panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={13} style={{ color: 'var(--primary)' }} />
            RAG Knowledge Source
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <h2>{source.title}</h2>

        <div className="field-label">Category</div>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{category}</div>

        <div className="field-label">Summary & Grounding</div>
        <p className="text-muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {summary}
        </p>

        {sourceOrigin && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <FileText size={14} style={{ color: 'var(--primary)' }} />
            <span>Document Source: <strong>{sourceOrigin}</strong></span>
          </div>
        )}

        {tags?.length > 0 && (
          <>
            <div className="field-label">Tags</div>
            <div className="flex flex-wrap gap-8 mt-4">
              {tags.map((tag) => (
                <span key={tag} className="chip" style={{ fontSize: 11, padding: '3px 8px' }}>
                  {tag}
                </span>
              ))}
            </div>
          </>
        )}

        <div className="field-label" style={{ marginTop: 20 }}>RAG Verifiability Note</div>
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 6,
            padding: '10px 12px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
          <span>Every Digital Twin answer is grounded in documented knowledge entries from the owner's CV and uploaded project files.</span>
        </div>
      </div>
    </div>
  );
}
