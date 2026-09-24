import { useState, useMemo } from 'react';
import { 
  Code, TrendingUp, Cpu, Layers, Briefcase, 
  ChevronRight, ChevronDown, Check, Sparkles, Filter, 
  Search, Eye, Network, CheckCircle2, Circle
} from 'lucide-react';
import { SKILL_TAXONOMY, groupSkillsByTaxonomy } from '../data/skillTaxonomy.js';

const ICON_MAP = {
  Code,
  TrendingUp,
  Cpu,
  Layers,
  Briefcase
};

export default function SkillMapChart({ 
  skills = [], 
  onToggleSkill = null, 
  selectable = false,
  readOnly = false,
  title = "Interactive Skill Map",
  subtitle = "Visual drill-down of technical competencies & domain specializations",
  compact = false
}) {
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'clusters'
  const [filterQuery, setFilterQuery] = useState('');
  const [expandedDomains, setExpandedDomains] = useState(() => {
    // By default expand domains that have at least one selected skill or the first 2 domains
    const initial = {};
    SKILL_TAXONOMY.forEach((d, idx) => {
      const hasSkills = d.categories.some((c) => c.skills.some((s) => skills.includes(s)));
      if (hasSkills || idx < 2) {
        initial[d.id] = true;
      }
    });
    return initial;
  });

  const selectedSet = useMemo(() => new Set(skills), [skills]);

  const toggleDomain = (domainId) => {
    setExpandedDomains((prev) => ({
      ...prev,
      [domainId]: !prev[domainId]
    }));
  };

  const expandAll = () => {
    const all = {};
    SKILL_TAXONOMY.forEach((d) => (all[d.id] = true));
    setExpandedDomains(all);
  };

  const collapseAll = () => {
    setExpandedDomains({});
  };

  // Grouped active skills for metric calculations
  const groupedActive = useMemo(() => groupSkillsByTaxonomy(skills), [skills]);

  // Filtered taxonomy based on filterQuery
  const filteredTaxonomy = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return SKILL_TAXONOMY;

    return SKILL_TAXONOMY.map((domain) => {
      const domainMatch = domain.name.toLowerCase().includes(q) || domain.description.toLowerCase().includes(q);
      const filteredCategories = domain.categories.map((cat) => {
        const catMatch = cat.name.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q);
        const matchingSkills = cat.skills.filter((s) => s.toLowerCase().includes(q));
        if (domainMatch || catMatch) {
          return cat;
        }
        if (matchingSkills.length > 0) {
          return { ...cat, skills: matchingSkills };
        }
        return null;
      }).filter(Boolean);

      if (domainMatch || filteredCategories.length > 0) {
        return {
          ...domain,
          categories: filteredCategories
        };
      }
      return null;
    }).filter(Boolean);
  }, [filterQuery]);

  return (
    <div className={`skill-map-container ${compact ? 'compact' : ''}`}>
      {/* Header bar */}
      <div className="skill-map-header">
        <div className="skill-map-title-area">
          <div className="skill-map-badge">
            <Network size={14} /> Skill Ontology Map
          </div>
          <h3>{title}</h3>
          {subtitle && <p className="text-secondary">{subtitle}</p>}
        </div>

        <div className="skill-map-controls">
          <div className="skill-map-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Filter chart nodes…"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
            {filterQuery && (
              <button className="clear-btn" onClick={() => setFilterQuery('')}>×</button>
            )}
          </div>

          <div className="view-mode-toggle">
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => setViewMode('tree')}
              title="Hierarchical Tree Map"
            >
              Hierarchical Tree
            </button>
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'clusters' ? 'active' : ''}`}
              onClick={() => setViewMode('clusters')}
              title="Grouped Clusters"
            >
              Cluster Grid
            </button>
          </div>

          <div className="expand-collapse-actions">
            <button type="button" className="btn-ghost-sm" onClick={expandAll}>Expand All</button>
            <span>•</span>
            <button type="button" className="btn-ghost-sm" onClick={collapseAll}>Collapse All</button>
          </div>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="skill-map-metrics-bar">
        <div className="metric-pill total">
          <span className="label">Total Competencies:</span>
          <span className="val">{skills.length}</span>
        </div>
        {groupedActive.map((g) => (
          <div 
            key={g.domainName} 
            className="metric-pill"
            style={{ borderColor: g.domainColor, background: g.domainBgColor, color: g.domainColor }}
          >
            <span className="dot" style={{ background: g.domainColor }} />
            <span className="label">{g.domainName}:</span>
            <span className="val">{g.totalSkills}</span>
          </div>
        ))}
      </div>

      {/* TREE DRILL-DOWN VIEW */}
      {viewMode === 'tree' && (
        <div className="skill-tree-view">
          {filteredTaxonomy.map((domain) => {
            const IconComp = ICON_MAP[domain.icon] || Code;
            const isExpanded = !!expandedDomains[domain.id];
            const domainSelectedSkills = domain.categories.flatMap((c) => c.skills).filter((s) => selectedSet.has(s));
            const totalDomainSkills = domain.categories.flatMap((c) => c.skills).length;

            return (
              <div 
                key={domain.id} 
                className={`tree-domain-node ${isExpanded ? 'expanded' : 'collapsed'}`}
                style={{ '--domain-color': domain.color, '--domain-bg': domain.bgColor }}
              >
                {/* Level 1: Domain Root Node */}
                <div 
                  className="domain-node-header" 
                  onClick={() => toggleDomain(domain.id)}
                >
                  <div className="node-expander">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>

                  <div className="domain-icon-badge" style={{ color: domain.color, background: domain.bgColor }}>
                    <IconComp size={18} />
                  </div>

                  <div className="domain-node-info">
                    <div className="domain-title-row">
                      <span className="domain-name">{domain.name}</span>
                      <span className="domain-stats-badge">
                        {domainSelectedSkills.length > 0 ? (
                          <span className="active-count">
                            <Check size={11} /> {domainSelectedSkills.length} selected
                          </span>
                        ) : (
                          <span className="total-count">{totalDomainSkills} skills</span>
                        )}
                      </span>
                    </div>
                    <span className="domain-desc">{domain.description}</span>
                  </div>
                </div>

                {/* Level 2 & 3: Categories and Granular Skills Branches */}
                {isExpanded && (
                  <div className="tree-branches-container">
                    <div className="tree-guide-rail" style={{ borderColor: domain.color }} />
                    <div className="tree-branches-list">
                      {domain.categories.map((cat) => {
                        const catSelectedSkills = cat.skills.filter((s) => selectedSet.has(s));

                        return (
                          <div key={cat.id} className="tree-category-branch">
                            <div className="category-branch-connector" style={{ borderColor: domain.color }} />
                            
                            <div className="category-branch-content">
                              <div className="category-branch-header">
                                <div className="category-title-group">
                                  <span className="category-bullet" style={{ background: domain.color }} />
                                  <span className="category-name">{cat.name}</span>
                                  {catSelectedSkills.length > 0 && (
                                    <span className="category-match-pill" style={{ background: domain.bgColor, color: domain.color }}>
                                      {catSelectedSkills.length} active
                                    </span>
                                  )}
                                </div>
                                <span className="category-desc">{cat.description}</span>
                              </div>

                              {/* Granular Skills Leaves */}
                              <div className="skills-leaf-grid">
                                {cat.skills.map((skill) => {
                                  const isSelected = selectedSet.has(skill);
                                  const canClick = !readOnly && onToggleSkill;

                                  return (
                                    <div
                                      key={skill}
                                      className={`skill-leaf-chip ${isSelected ? 'selected' : ''} ${canClick ? 'interactive' : ''}`}
                                      onClick={() => canClick && onToggleSkill(skill)}
                                      title={canClick ? (isSelected ? 'Click to deselect' : 'Click to select') : skill}
                                      style={isSelected ? { borderColor: domain.color, background: domain.bgColor, color: domain.color } : {}}
                                    >
                                      {canClick && (
                                        <span className="chip-check-icon">
                                          {isSelected ? <CheckCircle2 size={13} /> : <Circle size={13} className="unchecked" />}
                                        </span>
                                      )}
                                      <span className="skill-label">{skill}</span>
                                      {isSelected && !canClick && (
                                        <Check size={12} className="check-indicator" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CLUSTERS GRID VIEW */}
      {viewMode === 'clusters' && (
        <div className="skill-clusters-grid">
          {filteredTaxonomy.map((domain) => {
            const IconComp = ICON_MAP[domain.icon] || Code;
            const domainSelectedSkills = domain.categories.flatMap((c) => c.skills).filter((s) => selectedSet.has(s));

            return (
              <div 
                key={domain.id} 
                className="cluster-card"
                style={{ borderTopColor: domain.color }}
              >
                <div className="cluster-header">
                  <div className="cluster-icon" style={{ color: domain.color, background: domain.bgColor }}>
                    <IconComp size={18} />
                  </div>
                  <div>
                    <h4>{domain.name}</h4>
                    <span className="cluster-meta">
                      {domainSelectedSkills.length} active / {domain.categories.length} sub-domains
                    </span>
                  </div>
                </div>

                <div className="cluster-categories-list">
                  {domain.categories.map((cat) => {
                    const catSelectedSkills = cat.skills.filter((s) => selectedSet.has(s));

                    return (
                      <div key={cat.id} className="cluster-category-group">
                        <div className="cluster-cat-title">
                          <span>{cat.name}</span>
                          {catSelectedSkills.length > 0 && (
                            <span className="badge-mini" style={{ color: domain.color }}>
                              {catSelectedSkills.length}
                            </span>
                          )}
                        </div>

                        <div className="cluster-skills-wrap">
                          {cat.skills.map((skill) => {
                            const isSelected = selectedSet.has(skill);
                            const canClick = !readOnly && onToggleSkill;

                            return (
                              <span
                                key={skill}
                                className={`cluster-skill-pill ${isSelected ? 'active' : ''} ${canClick ? 'clickable' : ''}`}
                                onClick={() => canClick && onToggleSkill(skill)}
                                style={isSelected ? { borderColor: domain.color, background: domain.bgColor, color: domain.color } : {}}
                              >
                                {isSelected && <Check size={11} />}
                                {skill}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State when filter matches nothing */}
      {filteredTaxonomy.length === 0 && (
        <div className="skill-map-empty">
          <Filter size={28} />
          <h4>No matching skills or domains found</h4>
          <p>Try searching for terms like "Software", "Digital Marketing", "Python", "Cloud", "SEO", or "AI".</p>
          <button className="btn btn-secondary btn-sm" onClick={() => setFilterQuery('')}>
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
}
