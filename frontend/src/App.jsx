import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage       from './pages/LoginPage';
import DashboardPage   from './pages/DashboardPage';
import ThreatsPage     from './pages/ThreatsPage';
import MapPage         from './pages/MapPage';
import StakeholdersPage from './pages/StakeholdersPage';
import IntelPage       from './pages/IntelPage';
import BriefPage       from './pages/BriefPage';
import ReportsPage     from './pages/ReportsPage';
import UsersPage       from './pages/UsersPage';
import AuditPage       from './pages/AuditPage';
import AdminPage       from './pages/AdminPage';

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/dashboard"   element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/threats"     element={<ProtectedRoute><ThreatsPage /></ProtectedRoute>} />
      <Route path="/map"         element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
      <Route path="/stakeholders"element={<ProtectedRoute><StakeholdersPage /></ProtectedRoute>} />
      <Route path="/intel"       element={<ProtectedRoute><IntelPage /></ProtectedRoute>} />
      <Route path="/brief"       element={<ProtectedRoute roles={['DIRECTOR','ANALYST']}><BriefPage /></ProtectedRoute>} />
      <Route path="/reports"     element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/admin"       element={<ProtectedRoute roles={['ADMIN','DIRECTOR']}><AdminPage /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN','DIRECTOR']}><UsersPage /></ProtectedRoute>} />
      <Route path="/admin/audit" element={<ProtectedRoute roles={['ADMIN','DIRECTOR']}><AuditPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
