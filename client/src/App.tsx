import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import type { JSX } from 'react';
import Project from './pages/Project';
import QrCodes from './pages/QrCodes';
import Staff from './pages/Staff';
import Tasks from './pages/Task';
import Chat from './pages/Chat';
import ReportDashboard from './pages/ReportDashboard';
import AuditLog from './pages/AuditLog';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import PublicLayout from './layouts/PublicLayout';
import PricingPage from './pages/PricingPage';
import FeaturesPage from './pages/FeaturesPage';
import ContactPage from './pages/ContactPage';
import RequestDemoPage from './pages/RequestDemoPage';
import RegisterPage from './pages/RegisterPage';
import Branding from './pages/Branding';
import ApiIntegration from './pages/ApiIntegration';
import ProfilePage from './pages/ProfilePage';
import SuperAdminCustomers from './pages/SuperAdminCustomers';
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('accessToken');
  return token ? children : <Navigate to="/login" />;
};

const SuperAdminRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) return <Navigate to="/login" />;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.isSuperAdmin) return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path='/features' element={<FeaturesPage />} />
          <Route path='/contact' element={<ContactPage />} />
          <Route path='/request-demo' element={<RequestDemoPage />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* User routes */}
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Project />} />
          <Route path="qrcodes" element={<QrCodes />} />
          <Route path="staff" element={<Staff />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="chat" element={<Chat />} />
          <Route path="reports" element={<ReportDashboard />} />
          <Route path="audit-log" element={<AuditLog />} />
          <Route path="/branding" element={<Branding />} />
          <Route path="/api-integration" element={<ApiIntegration />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Super Admin routes */}
        <Route element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}>
          <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
	  <Route path="/super-admin/customers" element={<SuperAdminCustomers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
