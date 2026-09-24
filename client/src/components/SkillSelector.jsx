import { useState, useMemo, useRef } from 'react';
import { 
  Search, X, Check, Plus, GitFork, 
  Layers, Shield, Code, TrendingUp, Cpu, Briefcase,
  ChevronRight, ChevronDown, CheckCircle2, Circle
} from 'lucide-react';
import { 
  SKILL_TAXONOMY, 
  searchSkillsAndContexts, 
  getSkillMetadata, 
  groupSkillsByTaxonomy 
} from '../data/skillTaxonomy.js';
import SkillFlowchart from './SkillFlowchart.jsx';

const QUICK_CONTEXTS = [
  { label: 'Cybersecurity', query: 'Cybersecurity', icon: Shield, color: '#D9383A' },
  { label: 'Software Engineering', query: 'Software Engineering', icon: Code, color: '#3E63DD' },
  { label: 'Digital Marketing', query: 'Digital Marketing', icon: TrendingUp, color: '#E5484D' },
  { label: 'AI & Data Science', query: 'Artificial Intelligence', icon: Cpu, color: '#8E4EC6' },
  { label: 'Cloud & DevOps', query: 'Cloud & DevOps', icon: Layers, color: '#0090FF' },
  { label: 'Enterprise Strategy', query: 'Enterprise Leadership', icon: Briefcase, color: '#1F8A5C' }
];

export default function SkillSelector({
  selectedSkills = [],
  onChange,
  twinName = "Digital Twin",
  twinRole = "Intelligence Profile",
  label = "Expertise & Skills",
  helperText = "Type a context like 'cybersecurity' or 'digital marketing' to drill down into sub-disciplines and select multiple skills."
}) {
  const [query, setQuery] = useState('');
  const [showFlowchartModal, setShowFlowchartModal] = useState(false);
  const [activeTabDomain, setActiveTabDomain] = useState(null); // When user selects a quick domain tab
  const inputRef = useRef(null);

  const selectedSet = useMemo(() => new Set(selectedSkills), [selectedSkills]);

  // Search results
  const searchResults = useMemo(() => {
    return searchSkillsAndContexts(query);
  }, [query]);

  // Grouped active skills
  const groupedSelected = useMemo(() => {
    return groupSkillsByTaxonomy(selectedSkills);
  }, [selectedSkills]);

  const toggleSkill = (skill) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (selectedSet.has(trimmed)) {
      onChange(selectedSkills.filter((s) => s !== trimmed));
    } else {
      onChange([...selectedSkills, trimmed]);
    }
  };

  const addCustomSkill = (customName) => {
    const trimmed = customName.trim();
    if (!trimmed || selectedSet.has(trimmed)) return;
    onChange([...selectedSkills, trimmed]);
    setQuery('');
  };

  const selectAllInCategory = (skillsList) => {
    const newToAdd = skillsList.filter((s) => !selectedSet.has(s));
    if (newToAdd.length > 0) {
      onChange([...selectedSkills, ...newToAdd]);
    } else {
      const toRemoveSet = new Set(skillsList);
      onChange(selectedSkills.filter((s) => !toRemoveSet.has(s)));
    }
  };

  const clearAllSkills = () => {
    onChange([]);
  };

  const handleQuickContext = (qc) => {
    if (activeTabDomain === qc.query && !query) {
      setActiveTabDomain(null);
    } else {
      setActiveTabDomain(qc.query);
      setQuery(qc.query);
    }
    if (inputRef.current) inputRef.current.focus();
  };

  // Determine if query is a custom skill
  const isCustomSkill = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return false;
    let matchedExact = false;
    SKILL_TAXONOMY.forEach((d) => {
      if (d.name.toLowerCase() === q) matchedExact = true;
      d.categories.forEach((c) => {
        if (c.name.toLowerCase() === q) matchedExact = true;
        c.skills.forEach((s) => {
          if (s.toLowerCase() === q) matchedExact = true;
        });
      });
    });
    return !matchedExact;
  }, [query]);

  return (
    <div className="sleek-skill-selector">
      {/* Header & Flowchart Button */}
      <div className="selector-top-header">
        <div>
          <label className="selector-title">{label}</label>
          {helperText && <p className="selector-sub">{helperText}</p>}
        </div>

        <button
          type="button"
          className="btn-open-flowchart"
          onClick={() => setShowFlowchartModal(true)}
        >
          <GitFork size={15} />
          <span>View Skill Flowchart</span>
          <span className="badge-count">{selectedSkills.length}</span>
        </button>
      </div>

      {/* Context Search Bar */}
      <div className="search-context-container">
        <div className="search-bar-inner">
          <Search size={16} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Type context (e.g. 'Cybersecurity', 'Digital Marketing', 'Python', 'Cloud')…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (query.trim()) {
                  if (searchResults.matchedSkills.length === 1) {
                    toggleSkill(searchResults.matchedSkills[0].skill);
                    setQuery('');
                  } else if (isCustomSkill) {
                    addCustomSkill(query);
                  }
                }
              }
            }}
          />
          {query && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => {
                setQuery('');
                setActiveTabDomain(null);
                if (inputRef.current) inputRef.current.focus();
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Quick Context Chips */}
        <div className="quick-context-chips-row">
          <span className="quick-tag-label">Contexts:</span>
          {QUICK_CONTEXTS.map((qc) => {
            const IconC = qc.icon;
            const isActive = query.toLowerCase() === qc.query.toLowerCase() || activeTabDomain === qc.query;
            return (
              <button
                key={qc.label}
                type="button"
                className={`quick-context-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleQuickContext(qc)}
                style={isActive ? { borderColor: qc.color, background: qc.color + '15', color: qc.color } : {}}
              >
                <IconC size={13} style={{ color: qc.color }} />
                <span>{qc.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DRILL-DOWN PANEL WHEN USER TYPES OR SELECTS CONTEXT */}
      {query.trim() && (
        <div className="drilldown-dropdown-card">
          {/* Matching Domains (e.g. Cybersecurity, Digital Marketing) */}
          {searchResults.matchedDomains.length > 0 && (
            <div className="drilldown-domains-list">
              {searchResults.matchedDomains.map((domain) => (
                <div key={domain.id} className="drilldown-domain-block">
                  <div className="drilldown-domain-banner" style={{ borderLeftColor: domain.color }}>
                    <div className="domain-info-left">
                      <span className="domain-chip-pill" style={{ background: domain.bgColor, color: domain.color }}>
                        {domain.name}
                      </span>
                      <span className="domain-desc-text">{domain.description}</span>
                    </div>
                  </div>

                  <div className="categories-grid-container">
                    {domain.categories.map((cat) => {
                      const allCatSelected = cat.skills.every((s) => selectedSet.has(s));
                      const selectedCount = cat.skills.filter((s) => selectedSet.has(s)).length;

                      return (
                        <div key={cat.id} className="category-card-box">
                          <div className="category-card-header">
                            <div>
                              <span className="category-card-name">{cat.name}</span>
                              <span className="category-selected-counter">
                                ({selectedCount}/{cat.skills.length})
                              </span>
                            </div>

                            <button
                              type="button"
                              className="btn-category-select-all"
                              onClick={() => selectAllInCategory(cat.skills)}
                            >
                              {allCatSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>

                          <div className="category-skills-chips-wrap">
                            {cat.skills.map((skill) => {
                              const isChecked = selectedSet.has(skill);
                              return (
                                <button
                                  key={skill}
                                  type="button"
                                  className={`skill-check-pill ${isChecked ? 'selected' : ''}`}
                                  onClick={() => toggleSkill(skill)}
                                  style={isChecked ? { borderColor: domain.color, background: domain.bgColor, color: domain.color } : {}}
                                >
                                  {isChecked ? <Check size={12} strokeWidth={3} /> : <span className="empty-dot" />}
                                  <span>{skill}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Matching Categories (e.g. SEO, Backend, Network Security) */}
          {searchResults.matchedDomains.length === 0 && searchResults.matchedCategories.length > 0 && (
            <div className="drilldown-categories-list">
              {searchResults.matchedCategories.map((cat) => {
                const allCatSelected = cat.skills.every((s) => selectedSet.has(s));
                const selectedCount = cat.skills.filter((s) => selectedSet.has(s)).length;

                return (
                  <div key={cat.id} className="category-card-box highlight">
                    <div className="category-card-header">
                      <div>
                        <span className="domain-crumb-tag" style={{ color: cat.domainColor }}>{cat.domainName} &gt;</span>
                        <span className="category-card-name">{cat.name}</span>
                        <span className="category-selected-counter">({selectedCount}/{cat.skills.length})</span>
                      </div>

                      <button
                        type="button"
                        className="btn-category-select-all"
                        onClick={() => selectAllInCategory(cat.skills)}
                      >
                        {allCatSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="category-skills-chips-wrap">
                      {cat.skills.map((skill) => {
                        const isChecked = selectedSet.has(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            className={`skill-check-pill ${isChecked ? 'selected' : ''}`}
                            onClick={() => toggleSkill(skill)}
                            style={isChecked ? { borderColor: cat.domainColor, background: cat.domainBgColor, color: cat.domainColor } : {}}
                          >
                            {isChecked ? <Check size={12} strokeWidth={3} /> : <span className="empty-dot" />}
                            <span>{skill}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Matching Granular Skills (e.g. Python, Java, Zero Trust, SIEM) */}
          {searchResults.matchedDomains.length === 0 && searchResults.matchedCategories.length === 0 && searchResults.matchedSkills.length > 0 && (
            <div className="drilldown-skills-list">
              <div className="drilldown-skills-header">
                <span>{searchResults.matchedSkills.length} matching competencies:</span>
              </div>
              <div className="skills-items-grid">
                {searchResults.matchedSkills.map((item) => {
                  const isChecked = selectedSet.has(item.skill);
                  return (
                    <div
                      key={item.skill}
                      className={`skill-search-result-row ${isChecked ? 'active' : ''}`}
                      onClick={() => toggleSkill(item.skill)}
                    >
                      <div className="row-left">
                        <span className="check-box" style={isChecked ? { background: item.domainColor, borderColor: item.domainColor } : {}}>
                          {isChecked && <Check size={11} strokeWidth={3} color="#fff" />}
                        </span>
                        <div>
                          <span className="skill-title-text">{item.skill}</span>
                          <span className="skill-path-text">
                            <span style={{ color: item.domainColor }}>{item.domainName}</span> • {item.categoryName}
                          </span>
                        </div>
                      </div>
                      <span className={`add-tag-btn ${isChecked ? 'checked' : ''}`}>
                        {isChecked ? 'Added' : '+ Add'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Skill Option */}
          {isCustomSkill && query.trim().length > 1 && (
            <div className="custom-skill-action-box">
              <div className="custom-copy">
                <strong>+ Add "{query.trim()}" as specialized competence</strong>
                <p>Not found in standard ontology. Add it as a custom skill for this twin.</p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => addCustomSkill(query)}
              >
                + Add Skill
              </button>
            </div>
          )}
        </div>
      )}

      {/* SELECTED SKILLS DISPLAY TRAY */}
      <div className="selected-skills-summary-box">
        <div className="summary-box-header">
          <div className="flex items-center gap-8">
            <span className="summary-title">Selected Skills</span>
            <span className="summary-pill">{selectedSkills.length} Total</span>
          </div>

          {selectedSkills.length > 0 && (
            <button
              type="button"
              className="btn-clear-tray"
              onClick={clearAllSkills}
            >
              Clear All
            </button>
          )}
        </div>

        {selectedSkills.length === 0 ? (
          <div className="no-skills-msg">
            <Layers size={18} />
            <span>No skills selected yet. Type a context (e.g. <em>"Cybersecurity"</em>, <em>"Digital Marketing"</em>) or click a quick context above to add skills.</span>
          </div>
        ) : (
          <div className="selected-groups-list">
            {groupedSelected.map((group) => (
              <div 
                key={group.domainName} 
                className="group-domain-section"
                style={{ borderColor: group.domainColor }}
              >
                <div className="group-domain-header" style={{ color: group.domainColor }}>
                  <span className="domain-dot" style={{ background: group.domainColor }} />
                  <span className="domain-title">{group.domainName}</span>
                  <span className="domain-count" style={{ background: group.domainBgColor, color: group.domainColor }}>
                    {group.totalSkills}
                  </span>
                </div>

                <div className="group-chips-grid">
                  {group.categories.flatMap((cat) => cat.skills).map((skill) => (
                    <span
                      key={skill}
                      className="selected-tag-chip"
                      style={{ background: group.domainBgColor, color: group.domainColor, borderColor: group.domainColor + '40' }}
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        title={`Remove ${skill}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FULLSCREEN / MODAL SKILL FLOWCHART */}
      {showFlowchartModal && (
        <div className="modal-overlay" onClick={() => setShowFlowchartModal(false)}>
          <div className="flowchart-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="flowchart-modal-header">
              <div className="flex items-center gap-10">
                <GitFork size={20} className="text-primary" />
                <div>
                  <h3 className="modal-title">Digital Twin Skill Flowchart</h3>
                  <p className="modal-sub">Hierarchical flowchart breakdown of {twinName}'s capabilities & technical ontology.</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowFlowchartModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flowchart-modal-body">
              <SkillFlowchart
                skills={selectedSkills}
                twinName={twinName}
                twinRole={twinRole}
                onToggleSkill={toggleSkill}
                selectable={true}
                title="Skill Architecture Flowchart"
                subtitle="Click any skill leaf in the flowchart to toggle selection. Filter by domain or search."
              />
            </div>

            <div className="flowchart-modal-footer">
              <span className="stats-indicator">
                <strong>{selectedSkills.length}</strong> skills connected in flowchart
              </span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowFlowchartModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
