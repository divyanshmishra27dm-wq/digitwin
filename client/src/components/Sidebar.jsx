import { NavLink } from 'react-router-dom';
import {
  Home, Users2, MessageSquare, UserCircle, LayoutGrid, Sparkles,
  MessagesSquare, LifeBuoy, BarChart3, Settings, Bot, PlusCircle, Radio
} from 'lucide-react';

const userLinks = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/twins', label: 'Digital Twins', icon: Bot, end: true },
  { to: '/roundtable', label: 'Twin Roundtable', icon: Users2 },
  { to: '/twins/create', label: 'Create Twin', icon: PlusCircle },
  { to: '/conversations', label: 'My Conversations', icon: MessageSquare },
];

const adminLinks = [
  { group: null, links: [{ to: '/admin', label: 'Overview', icon: LayoutGrid, end: true }] },
  {
    group: 'Digital Twins',
    links: [
      { to: '/admin/twins', label: 'All Twins', icon: Bot, end: true },
      { to: '/admin/twins/create', label: 'Create Twin', icon: Sparkles },
      { to: '/admin/awareness', label: 'Awareness Radar', icon: Radio },
    ],
  },
  { group: 'Engagement', links: [
    { to: '/admin/conversations', label: 'Conversations', icon: MessagesSquare },
    { to: '/admin/escalations', label: 'Escalations', icon: LifeBuoy },
  ] },
  { group: 'System', links: [
    { to: '/admin/users', label: 'Users', icon: Users2 },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ] },
];

export default function Sidebar({ mode, demoMode }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="mark">DT</div>
        <div className="label">
          NIIT Digital Twin
          <span>{mode === 'admin' ? 'Administration' : 'Internal Innovation POC'}</span>
        </div>
      </div>

      {mode === 'admin' ? (
        <>
          {adminLinks.map((section, i) => (
            <div className="sidebar-group" key={i}>
              {section.group && <div className="sidebar-group-label">{section.group}</div>}
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                  <link.icon size={17} />
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </>
      ) : (
        <div className="sidebar-group">
          {userLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <link.icon size={17} />
              {link.label}
            </NavLink>
          ))}
        </div>
      )}

      <div className="sidebar-footer">
        {demoMode && (
          <div className="demo-mode-pill">
            <Sparkles size={13} /> DEMO MODE
          </div>
        )}
        <NavLink to="/profile" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <UserCircle size={17} />
          Profile
        </NavLink>
      </div>
    </aside>
  );
}
