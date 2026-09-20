import type { JSX } from 'react';
import { HashRouter, BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts & Providers
import PublicLayout from '@/layouts/PublicLayout';
import MainLayout from '@/layouts/MainLayout';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import { PromoProvider } from '@/components/promo/PromoSystem';

// Public Pages
import LandingPage from '@/pages/public/LandingPage';
import AboutPage from '@/pages/public/AboutPage';
import PricingPage from '@/pages/public/PricingPage';
import FeaturesPage from '@/pages/public/FeaturesPage';
import ContactPage from '@/pages/public/ContactPage';
import RequestDemoPage from '@/pages/public/RequestDemoPage';
import PolicyPage from '@/pages/public/PolicyPage';
import TermsPage from '@/pages/public/TermsPage';
import DownloadPage from '@/pages/public/DownloadPage';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

// Tenant Dashboard Pages
import TenantDashboardPage from '@/pages/dashboard/TenantDashboardPage';
import ProjectListPage from '@/pages/dashboard/ProjectListPage';
import QrCodeListPage from '@/pages/dashboard/QrCodeListPage';
import StaffPage from '@/pages/dashboard/StaffPage';
import TaskListPage from '@/pages/dashboard/TaskListPage';
import ChatPage from '@/pages/dashboard/ChatPage';
import ReportDashboardPage from '@/pages/dashboard/ReportDashboardPage';
import AuditLogPage from '@/pages/dashboard/AuditLogPage';
import BrandingPage from '@/pages/dashboard/BrandingPage';
import ApiIntegrationPage from '@/pages/dashboard/ApiIntegrationPage';
import ProfilePage from '@/pages/dashboard/ProfilePage';
import HelpdeskPage from '@/pages/dashboard/HelpdeskPage';

// Super Admin Pages
import SuperAdminDashboardPage from '@/pages/admin/SuperAdminDashboardPage';
import SuperAdminCustomersPage from '@/pages/admin/SuperAdminCustomersPage';
import SuperAdminUsersPage from '@/pages/admin/SuperAdminUsersPage';
import SuperAdminRevenuePage from '@/pages/admin/SuperAdminRevenuePage';
import SuperAdminPlansPage from '@/pages/admin/SuperAdminPlansPage';
import SuperAdminPromoPage from '@/pages/admin/SuperAdminPromoPage';
import SuperAdminSecurityPage from '@/pages/admin/SuperAdminSecurityPage';
import SuperAdminApiKeysPage from '@/pages/admin/SuperAdminApiKeysPage';

// System Pages
import ScanRedirectPage from '@/pages/system/ScanRedirectPage';
import NotFoundPage from '@/pages/system/NotFoundPage';
import ServerErrorPage from '@/pages/system/ServerErrorPage';

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

// Tự động kiểm tra nếu đang chạy trong môi trường Electron thì dùng HashRouter
const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron');
const Router = isElectron ? HashRouter : BrowserRouter;

function App() {
  return (
    <Router>
      <PromoProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/request-demo" element={<RequestDemoPage />} />
            <Route path="/policy" element={<PolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/download" element={<DownloadPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* User routes */}
          <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route path="/dashboard" element={<TenantDashboardPage />} />
            <Route path="projects" element={<ProjectListPage />} />
            <Route path="qrcodes" element={<QrCodeListPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="tasks" element={<TaskListPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="reports" element={<ReportDashboardPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
            <Route path="/branding" element={<BrandingPage />} />
            <Route path="/api-integration" element={<ApiIntegrationPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="helpdesk" element={<HelpdeskPage />} />
          </Route>

          {/* Super Admin routes */}
          <Route element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}>
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboardPage />} />
            <Route path="/super-admin/customers" element={<SuperAdminCustomersPage />} />
            <Route path="/super-admin/users" element={<SuperAdminUsersPage />} />
            <Route path="/super-admin/revenue" element={<SuperAdminRevenuePage />} />
            <Route path="/super-admin/plans" element={<SuperAdminPlansPage />} />
            <Route path="/super-admin/promotions" element={<SuperAdminPromoPage />} />
            <Route path="/super-admin/helpdesk" element={<HelpdeskPage />} />
            <Route path="/super-admin/security" element={<SuperAdminSecurityPage />} />
            <Route path="/super-admin/api-keys" element={<SuperAdminApiKeysPage />} />
          </Route>

          {/* Scan redirect & Errors */}
          <Route path="/scan" element={<ScanRedirectPage />} />
          <Route path="/500" element={<ServerErrorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </PromoProvider>
    </Router>
  );
}

export default App;