import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getAvatar } from '@/utils/formatters';
import {
    HiOutlineChartBar, HiOutlineOfficeBuilding, HiOutlineUsers,
    HiOutlineLogout, HiOutlineMenu,
    HiOutlineShieldCheck, HiOutlineCurrencyDollar, HiOutlineDocumentReport,
    HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineSpeakerphone,
    HiOutlineKey, HiOutlineMail
} from 'react-icons/hi';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';

const SuperAdminLayout = () => {
    const { isDark } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>({ name: 'Super Admin', avatar: '' });
    const navigate = useNavigate();
    const location = useLocation();

    const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000' : 'https://api.aegism.online';

    const syncUser = () => {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (!u.isSuperAdmin) { navigate('/dashboard'); return; }
        const avatarUrl = getAvatar(u);
        setUser({ name: u.fullName || u.name || 'Super Admin', avatar: avatarUrl });
    };

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;
            const res = await fetch(`${apiUrl}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const u = await res.json();
                localStorage.setItem('user', JSON.stringify(u));
                syncUser();
            }
        } catch (e) { console.error('SuperAdmin profile sync error:', e); }
    };

    useEffect(() => {
        syncUser();
        fetchUserProfile();
        window.addEventListener('user-profile-updated', syncUser);
        window.addEventListener('storage', syncUser);
        return () => {
            window.removeEventListener('user-profile-updated', syncUser);
            window.removeEventListener('storage', syncUser);
        };
    }, []);

    const handleLogout = () => {
        Swal.fire({ title: 'Đăng xuất?', icon: 'question', showCancelButton: true, confirmButtonColor: '#7C3AED', confirmButtonText: 'Đăng xuất', cancelButtonText: 'Ở lại' })
            .then(r => { if (r.isConfirmed) { localStorage.clear(); navigate('/login'); } });
    };

    const navItems = [
        { path: '/super-admin/dashboard', icon: <HiOutlineChartBar className="w-5 h-5 flex-shrink-0" />, label: 'Tổng quan hệ thống', shortLabel: 'Tổng quan' },
        { path: '/super-admin/customers', icon: <HiOutlineOfficeBuilding className="w-5 h-5 flex-shrink-0" />, label: 'Quản lý Khách hàng', shortLabel: 'Khách hàng' },
        { path: '/super-admin/users', icon: <HiOutlineUsers className="w-5 h-5 flex-shrink-0" />, label: 'Quản lý người dùng', shortLabel: 'Người dùng' },
        { path: '/super-admin/revenue', icon: <HiOutlineCurrencyDollar className="w-5 h-5 flex-shrink-0" />, label: 'Doanh thu', shortLabel: 'Doanh thu' },
        { path: '/super-admin/plans', icon: <HiOutlineDocumentReport className="w-5 h-5 flex-shrink-0" />, label: 'Quản lý Gói', shortLabel: 'Gói dịch vụ' },
        { path: '/super-admin/promotions', icon: <HiOutlineSpeakerphone className="w-5 h-5 flex-shrink-0" />, label: 'Chiến dịch Quảng bá', shortLabel: 'Quảng bá' },
        { path: '/super-admin/api-keys', icon: <HiOutlineKey className="w-5 h-5 flex-shrink-0" />, label: 'Quản lý API Keys', shortLabel: 'API Keys' },
        { path: '/super-admin/helpdesk', icon: <HiOutlineMail className="w-5 h-5 flex-shrink-0" />, label: 'Hỗ trợ Khách hàng', shortLabel: 'Helpdesk' },
        { path: '/super-admin/security', icon: <HiOutlineShieldCheck className="w-5 h-5 flex-shrink-0" />, label: 'Bảo mật & Nhật ký', shortLabel: 'Bảo mật' },
    ];

    const getLinkClass = (path: string) => {
        const isActive = location.pathname === path;
        if (isDark) {
            return `flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 mb-1 border ${isActive
                ? 'bg-[#8b5cf6]/15 text-[#a78bfa] border-[#8b5cf6]/30 shadow-[0_0_15px_rgba(139,92,246,0.15)] font-semibold'
                : 'text-gray-400 hover:bg-white/5 hover:text-[#e5e7eb] border-transparent'}`;
        }
        return `flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 mb-1 border ${isActive
            ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm font-bold'
            : 'text-slate-600 hover:bg-slate-100 hover:text-purple-700 border-transparent'}`;
    };

    return (
        <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-200 ${isDark ? 'bg-[#080810] text-[#e5e7eb]' : 'bg-[#f8fafc] text-[#0f172a]'}`}>
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
            )}

            {/* SIDEBAR */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 flex flex-col justify-between transition-all duration-300 pb-16 lg:pb-0 lg:static
                ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${sidebarOpen ? 'w-64' : 'w-16'}
                ${isDark ? 'bg-[#0f0f1c]/95 border-r border-white/5 backdrop-blur-md' : 'bg-white border-r border-slate-200 shadow-sm'}
            `}>
                <div className="overflow-hidden">
                    <div className={`flex items-center h-16 px-3 border-b ${isDark ? 'border-white/5' : 'border-slate-100'} ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
                        {sidebarOpen && (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/20">
                                    <HiOutlineShieldCheck className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className={`font-bold text-sm leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>AEGISM</div>
                                    <div className="text-purple-600 dark:text-purple-400 text-xs font-semibold">Super Admin</div>
                                </div>
                            </div>
                        )}
                        {!sidebarOpen && (
                            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-purple-500/20">
                                <HiOutlineShieldCheck className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-full transition-colors flex-shrink-0 ${
                                isDark ? 'bg-gray-800 hover:bg-purple-600 text-gray-400 hover:text-white' : 'bg-slate-100 hover:bg-purple-100 text-slate-500 hover:text-purple-700'
                            }`}
                        >
                            {sidebarOpen ? <HiOutlineChevronLeft className="w-3.5 h-3.5" /> : <HiOutlineChevronRight className="w-3.5 h-3.5" />}
                        </button>
                    </div>

                    <nav className="mt-4 px-2">
                        {sidebarOpen && (
                            <p className="px-3 text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3">Quản trị</p>
                        )}
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileSidebarOpen(false)}
                                className={getLinkClass(item.path)}
                                title={!sidebarOpen ? item.label : undefined}
                            >
                                {item.icon}
                                {sidebarOpen && <span className="text-sm whitespace-nowrap">{item.label}</span>}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className={`p-3 border-t ${isDark ? 'border-white/5' : 'border-slate-100'} ${!sidebarOpen ? 'flex flex-col items-center gap-2' : ''}`}>
                    {sidebarOpen ? (
                        <>
                            <div className="flex items-center gap-3 mb-3 px-1">
                                <img
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Admin')}&background=7C3AED&color=fff&bold=true&size=128`}
                                    onError={(e) => {
                                        const target = e.currentTarget;
                                        target.onerror = null;
                                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Admin')}&background=7C3AED&color=fff&bold=true&size=128`;
                                    }}
                                    className="w-9 h-9 rounded-full border-2 border-purple-500 flex-shrink-0 object-cover"
                                    alt="avatar"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</div>
                                    <div className="text-purple-600 dark:text-purple-400 text-xs truncate font-medium">Super Administrator</div>
                                </div>
                            </div>
                            <button onClick={handleLogout} className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                                isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-600 hover:text-red-600 hover:bg-red-50'
                            }`}>
                                <HiOutlineLogout className="w-4 h-4" />
                                Đăng xuất
                            </button>
                        </>
                    ) : (
                        <>
                            <img
                                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Admin')}&background=7C3AED&color=fff&bold=true&size=128`}
                                onError={(e) => {
                                    const target = e.currentTarget;
                                    target.onerror = null;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Admin')}&background=7C3AED&color=fff&bold=true&size=128`;
                                }}
                                className="w-8 h-8 rounded-full border-2 border-purple-500 object-cover"
                                alt="avatar"
                                title={user.name}
                            />
                            <button onClick={handleLogout} className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                                isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                            }`} title="Đăng xuất">
                                <HiOutlineLogout className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            </aside>

            {/* MAIN */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <header className={`h-16 border-b flex items-center justify-between px-4 sm:px-6 flex-shrink-0 relative z-40 transition-colors ${
                    isDark ? 'bg-[#0f0f1c]/95 border-white/5 backdrop-blur-md' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                            className={`lg:hidden p-2 rounded-lg transition-colors ${
                                isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <HiOutlineMenu className="w-5 h-5" />
                        </button>
                        <span className="text-slate-500 dark:text-gray-500 text-xs uppercase tracking-widest font-bold">Super Admin Panel</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle compact />
                        <span className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 text-xs px-3 py-1.5 rounded-full font-semibold border border-emerald-200 dark:border-emerald-800/80">
                            <span className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"></span>
                            Hệ thống hoạt động
                        </span>
                        <Link to="/dashboard" className="text-xs text-purple-700 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 border border-purple-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 px-3 py-1.5 rounded-lg transition-colors font-medium">
                            ← Về Dashboard
                        </Link>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">
                    <Outlet />
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg ${
                    isDark ? 'bg-[#0f0f1c]/95 border-white/5 backdrop-blur-md' : 'bg-white border-slate-200'
                }`}>
                    <div className="flex items-center justify-around h-16 px-1">
                        {navItems.slice(0, 4).map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileSidebarOpen(false)}
                                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full px-1 transition-colors ${
                                    location.pathname === item.path
                                        ? 'text-purple-600 dark:text-purple-400 font-bold'
                                        : 'text-slate-500 dark:text-gray-500 hover:text-slate-800 dark:hover:text-gray-300'
                                }`}
                            >
                                <span className="w-5 h-5">{item.icon}</span>
                                <span className="text-[10px] font-medium leading-tight text-center">{item.shortLabel}</span>
                            </Link>
                        ))}
                        <button
                            onClick={() => setMobileSidebarOpen(true)}
                            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full px-1 text-slate-500 dark:text-gray-500 hover:text-slate-800 dark:hover:text-gray-300 transition-colors"
                        >
                            <HiOutlineMenu className="w-5 h-5" />
                            <span className="text-[10px] font-medium leading-tight">Thêm</span>
                        </button>
                    </div>
                </nav>
            </div>
        </div>
    );
};

export default SuperAdminLayout;
