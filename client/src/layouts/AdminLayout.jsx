import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import { useDemoMode } from '../hooks/useDemoMode.js';

export default function AdminLayout() {
  const demoMode = useDemoMode();
  return (
    <div className="app-shell">
      <Sidebar mode="admin" demoMode={demoMode} />
      <div className="app-main">
        <Topbar searchPlaceholder="Search" onSearch={() => {}} />
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
