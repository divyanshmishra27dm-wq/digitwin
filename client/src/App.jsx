import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import UserLayout from './layouts/UserLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

import Login from './pages/Login.jsx';

import Home from './pages/user/Home.jsx';
import TwinsList from './pages/user/TwinsList.jsx';
import TwinProfile from './pages/user/TwinProfile.jsx';
import Chat from './pages/user/Chat.jsx';
import Conversations from './pages/user/Conversations.jsx';
import ConversationDetail from './pages/user/ConversationDetail.jsx';
import Profile from './pages/user/Profile.jsx';
import RoundtableList from './pages/user/RoundtableList.jsx';
import RoundtableRoom from './pages/user/RoundtableRoom.jsx';

import Overview from './pages/admin/Overview.jsx';
import AdminTwinsList from './pages/admin/TwinsList.jsx';
import Wizard from './pages/admin/Wizard.jsx';
import TwinDetail from './pages/admin/TwinDetail.jsx';
import EditTwin from './pages/admin/EditTwin.jsx';
import KnowledgeManager from './pages/admin/KnowledgeManager.jsx';
import PersonaEditor from './pages/admin/PersonaEditor.jsx';
import PreviewTwin from './pages/admin/PreviewTwin.jsx';
import AdminConversations from './pages/admin/AdminConversations.jsx';
import Escalations from './pages/admin/Escalations.jsx';
import Users from './pages/admin/Users.jsx';
import Analytics from './pages/admin/Analytics.jsx';
import Settings from './pages/admin/Settings.jsx';
import AwarenessHub from './pages/admin/AwarenessHub.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* ── User routes ─────────────────────────────────── */}
      <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
        <Route path="/" element={<Home />} />
        <Route path="/twins" element={<TwinsList />} />
        <Route path="/twins/create" element={<Wizard userMode={true} />} />
        <Route path="/twins/:id" element={<TwinProfile />} />
        <Route path="/twins/:id/chat" element={<Chat />} />
        <Route path="/twins/:id/edit" element={<EditTwin userMode={true} />} />
        <Route path="/twins/:id/knowledge" element={<KnowledgeManager userMode={true} />} />
        <Route path="/twins/:id/persona" element={<PersonaEditor userMode={true} />} />
        <Route path="/twins/:id/preview" element={<PreviewTwin userMode={true} />} />
        <Route path="/roundtable" element={<RoundtableList />} />
        <Route path="/roundtable/:id" element={<RoundtableRoom />} />
        <Route path="/conversations" element={<Conversations />} />
        <Route path="/conversations/:id" element={<ConversationDetail />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* ── Admin routes ─────────────────────────────────── */}
      <Route element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<Overview />} />
        <Route path="/admin/twins" element={<AdminTwinsList />} />
        <Route path="/admin/twins/create" element={<Wizard />} />
        <Route path="/admin/twins/:id" element={<TwinDetail />} />
        <Route path="/admin/twins/:id/edit" element={<EditTwin />} />
        <Route path="/admin/twins/:id/knowledge" element={<KnowledgeManager />} />
        <Route path="/admin/twins/:id/persona" element={<PersonaEditor />} />
        <Route path="/admin/twins/:id/preview" element={<PreviewTwin />} />
        <Route path="/admin/conversations" element={<AdminConversations />} />
        <Route path="/admin/escalations" element={<Escalations />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/admin/awareness" element={<AwarenessHub />} />
        <Route path="/admin/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
