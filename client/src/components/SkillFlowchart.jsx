import { useState, useMemo } from 'react';
import { 
  Shield, Code, TrendingUp, Cpu, Layers, Briefcase, 
  Search, ZoomIn, ZoomOut, RotateCcw, Check, Sparkles, 
  ArrowRight, GitFork, User, Maximize2, Minimize2, Filter,
  X, CheckCircle2, Circle
} from 'lucide-react';
import { SKILL_TAXONOMY, groupSkillsByTaxonomy, getSkillMetadata } from '../data/skillTaxonomy.js';

const ICON_MAP = {
  Shield,
  Code,
  TrendingUp,
  Cpu,
  Layers,
  Briefcase
};

export default function SkillFlowchart({
  skills = [],
  twinName = "Digital Twin",
  twinRole = "Verified Intelligence",
  onToggleSkill = null,
  selectable = false,
  readOnly = false,
  title = "Skill Architecture Flowchart",
  subtitle = "Visual flowchart mapping only the verified skills added for this Twin"
}) {
  const [zoom, setZoom] = useState(1);
  const [orientation, setOrientation] = useState('horizontal'); // 'horizontal' | 'vertical'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDomainFilter, setActiveDomainFilter] = useState('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedDomains, setExpandedDomains] = useState({});

  // Group ONLY the added skills for this Twin into taxonomy hierarchy
  const activeTree = useMemo(() => {
    const grouped = groupSkillsByTaxonomy(skills);

    // Merge icon and description from SKILL_TAXONOMY if available
    return grouped.map((group) => {
      const taxonomyDomain = SKILL_TAXONOMY.find((d) => d.name === group.domainName || d.id === group.domainId);
      return {
        ...group,
        icon: taxonomyDomain ? taxonomyDomain.icon : 'Sparkles',
        description: taxonomyDomain ? taxonomyDomain.description : 'Custom specialized competencies and technologies',
        categories: group.categories.map((cat) => {
          const taxonomyCat = taxonomyDomain?.categories.find((c) => c.name === cat.categoryName || c.id === cat.categoryId);
          return {
            ...cat,
            description: taxonomyCat ? taxonomyCat.description : 'Specialized skill set'
          };
        })
      };
    });
  }, [skills]);

  // Filter tree based on search query & domain filter
  const filteredActiveTree = useMemo(() => {
    let list = activeTree;

    if (activeDomainFilter !== 'all') {
      list = list.filter((d) => d.domainId === activeDomainFilter || d.domainName === activeDomainFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    return list.map((domain) => {
      const dMatch = domain.domainName.toLowerCase().includes(q) || domain.description?.toLowerCase().includes(q);

      const filteredCategories = domain.categories.map((cat) => {
        const cMatch = cat.categoryName.toLowerCase().includes(q) || cat.description?.toLowerCase().includes(q);
        const matchingSkills = cat.skills.filter((s) => s.toLowerCase().includes(q));

        if (dMatch || cMatch) return cat;
        if (matchingSkills.length > 0) return { ...cat, skills: matchingSkills };
        return null;
      }).filter(Boolean);

      if (dMatch || filteredCategories.length > 0) {
        return {
          ...domain,
          categories: filteredCategories
        };
      }
      return null;
    }).filter(Boolean);
  }, [activeTree, searchQuery, activeDomainFilter]);

  const toggleDomain = (domainId) => {
    setExpandedDomains((prev) => ({
      ...prev,
      [domainId]: prev[domainId] === false ? true : false
    }));
  };

  const handleZoom = (delta) => {
    setZoom((z) => Math.min(Math.max(0.6, z + delta), 1.5));
  };

  const resetZoom = () => setZoom(1);

  return (
    <div className={`flowchart-card-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Flowchart Control Bar */}
      <div className="flowchart-toolbar">
        <div className="flowchart-title-box">
          <div className="flowchart-badge">
            <GitFork size={13} /> Added Skills Flowchart
          </div>
          <h4>{title}</h4>
          {subtitle && <p className="flowchart-sub">{subtitle}</p>}
        </div>

        <div className="flowchart-actions-group">
          {/* Search within added skills */}
          <div className="flowchart-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search active skills…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && <button onClick={() => setSearchQuery('')}>×</button>}
          </div>

          {/* Orientation Switcher */}
          <div className="flowchart-btn-group">
            <button
              type="button"
              className={`flowchart-tool-btn ${orientation === 'horizontal' ? 'active' : ''}`}
              onClick={() => setOrientation('horizontal')}
              title="Horizontal Tree Flow"
            >
              Horizontal Flow
            </button>
            <button
              type="button"
              className={`flowchart-tool-btn ${orientation === 'vertical' ? 'active' : ''}`}
              onClick={() => setOrientation('vertical')}
              title="Vertical Top-Down Flow"
            >
              Vertical Flow
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flowchart-zoom-controls">
            <button type="button" onClick={() => handleZoom(-0.1)} title="Zoom Out"><ZoomOut size={14} /></button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => handleZoom(0.1)} title="Zoom In"><ZoomIn size={14} /></button>
            <button type="button" onClick={resetZoom} title="Reset View"><RotateCcw size={14} /></button>
            <button 
              type="button" 
              onClick={() => setIsFullscreen(!isFullscreen)} 
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Domain Quick Filters (Only for domains with added skills) */}
      {activeTree.length > 0 && (
        <div className="flowchart-domain-filter-bar">
          <span className="filter-label"><Filter size={12} /> Active Domains:</span>
          <button
            type="button"
            className={`filter-chip ${activeDomainFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveDomainFilter('all')}
          >
            All Active ({skills.length} skills)
          </button>
          {activeTree.map((d) => {
            const isFilterActive = activeDomainFilter === d.domainId || activeDomainFilter === d.domainName;
            return (
              <button
                key={d.domainName}
                type="button"
                className={`filter-chip ${isFilterActive ? 'active' : ''}`}
                onClick={() => setActiveDomainFilter(isFilterActive ? 'all' : d.domainId)}
                style={isFilterActive ? { borderColor: d.domainColor, background: d.domainBgColor, color: d.domainColor } : {}}
              >
                <span className="dot" style={{ background: d.domainColor }} />
                {d.domainName} <span className="pill-cnt">({d.totalSkills})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* FLOWCHART DIAGRAM CANVAS */}
      <div className="flowchart-canvas-container">
        {skills.length === 0 ? (
          <div className="no-skills-msg" style={{ margin: 'auto', padding: '40px 20px', textAlign: 'center' }}>
            <GitFork size={28} style={{ color: 'var(--text-tertiary)', marginBottom: 10 }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>No skills added for this Digital Twin yet</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              Select or type skills in the selector to generate the twin's skill flowchart.
            </p>
          </div>
        ) : filteredActiveTree.length === 0 ? (
          <div className="no-skills-msg" style={{ margin: 'auto', padding: '40px 20px', textAlign: 'center' }}>
            <Search size={28} style={{ color: 'var(--text-tertiary)', marginBottom: 10 }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>No matching skills in flowchart</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              Try a different search term or reset the domain filter.
            </p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => { setSearchQuery(''); setActiveDomainFilter('all'); }}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div 
            className={`flowchart-diagram ${orientation}`}
            style={{ transform: `scale(${zoom})`, transformOrigin: orientation === 'horizontal' ? 'top left' : 'top center' }}
          >
            {/* ════ LEVEL 0: ROOT NODE (Digital Twin) ════ */}
            <div className="flowchart-root-section">
              <div className="flowchart-root-node">
                <div className="root-node-avatar">
                  <User size={20} />
                </div>
                <div className="root-node-content">
                  <span className="root-node-badge">Root Twin Node</span>
                  <h3 className="root-node-name">{twinName}</h3>
                  <span className="root-node-title">{twinRole}</span>
                </div>
                <div className="root-node-stats">
                  <span className="stats-number">{skills.length}</span>
                  <span className="stats-label">Active Skills</span>
                </div>
              </div>

              {/* Root Connector Stem */}
              <div className="root-stem-connector" />
            </div>

            {/* ════ LEVEL 1, 2, 3: DOMAINS -> SUB-DISCIPLINES -> SKILLS (ONLY ADDED SKILLS) ════ */}
            <div className="flowchart-domains-branch-container">
              {filteredActiveTree.map((domain) => {
                const IconComp = ICON_MAP[domain.icon] || Sparkles;
                const isExpanded = expandedDomains[domain.domainId] !== false;

                return (
                  <div 
                    key={domain.domainName} 
                    className={`flowchart-domain-branch ${isExpanded ? 'expanded' : 'collapsed'}`}
                    style={{ '--domain-color': domain.domainColor, '--domain-bg': domain.domainBgColor }}
                  >
                    {/* Domain Stem Line */}
                    <div className="domain-stem-line" style={{ borderColor: domain.domainColor }} />

                    {/* Level 1: Domain Node Box */}
                    <div 
                      className="flowchart-domain-node" 
                      onClick={() => toggleDomain(domain.domainId)}
                      style={{ borderColor: domain.domainColor, borderLeftColor: domain.domainColor }}
                    >
                      <div className="domain-node-header-row">
                        <div className="domain-icon-circle" style={{ background: domain.domainBgColor, color: domain.domainColor }}>
                          <IconComp size={16} />
                        </div>
                        <div className="domain-node-titles">
                          <span className="domain-eyebrow">Domain Branch</span>
                          <h4>{domain.domainName}</h4>
                        </div>
                      </div>

                      <div className="domain-node-footer">
                        <span className="domain-count-indicator" style={{ background: domain.domainBgColor, color: domain.domainColor }}>
                          <Check size={11} /> {domain.totalSkills} {domain.totalSkills === 1 ? 'skill' : 'skills'}
                        </span>
                        <span className="domain-toggle-icon">
                          {isExpanded ? '−' : '+'}
                        </span>
                      </div>
                    </div>

                    {/* Level 2 & 3: Subcategories and Only Added Skills */}
                    {isExpanded && (
                      <div className="flowchart-categories-container">
                        {domain.categories.map((cat) => (
                          <div key={cat.categoryName} className="flowchart-category-node-wrap">
                            {/* Category Connector Line */}
                            <div className="category-stem-line" style={{ borderColor: domain.domainColor }} />

                            {/* Level 2: Category Node Box */}
                            <div className="flowchart-category-node">
                              <div className="cat-node-header">
                                <div className="cat-dot" style={{ background: domain.domainColor }} />
                                <span className="cat-title">{cat.categoryName}</span>
                                <span className="cat-active-pill" style={{ background: domain.domainBgColor, color: domain.domainColor }}>
                                  {cat.skills.length} active
                                </span>
                              </div>
                              {cat.description && <p className="cat-sub-desc">{cat.description}</p>}

                              {/* Level 3: ONLY Added Granular Skills */}
                              <div className="flowchart-skills-flow">
                                {cat.skills.map((skill) => {
                                  const canClick = !readOnly && onToggleSkill;

                                  return (
                                    <div
                                      key={skill}
                                      className={`flowchart-skill-leaf selected ${canClick ? 'clickable' : ''}`}
                                      onClick={() => canClick && onToggleSkill(skill)}
                                      style={{ borderColor: domain.domainColor, background: domain.domainBgColor, color: domain.domainColor }}
                                      title={canClick ? 'Click to remove from twin' : skill}
                                    >
                                      <span className="leaf-check">
                                        <Check size={11} strokeWidth={3} />
                                      </span>
                                      <span className="leaf-skill-name">{skill}</span>
                                      {canClick && (
                                        <X size={11} style={{ opacity: 0.6, marginLeft: 2 }} />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
