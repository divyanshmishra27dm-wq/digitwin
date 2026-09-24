import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import { useDemoMode } from '../hooks/useDemoMode.js';

export default function UserLayout() {
  const demoMode = useDemoMode();
  return (
    <div className="app-shell">
      <Sidebar mode="user" demoMode={demoMode} />
      <div className="app-main">
        <Topbar />
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
