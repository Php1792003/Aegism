import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
    HiOutlineChartBar, HiOutlineOfficeBuilding, HiOutlineUsers,
    HiOutlineCog, HiOutlineLogout, HiOutlineMenu, HiOutlineX,
    HiOutlineShieldCheck, HiOutlineCurrencyDollar, HiOutlineDocumentReport,
    HiOutlineChevronLeft, HiOutlineChevronRight
} from 'react-icons/hi';

const SuperAdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>({ name: 'Super Admin', avatar: '' });
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (!u.isSuperAdmin) { navigate('/dashboard'); return; }
        const avatarUrl = `https://ui-avatars.com/api/?name=Super+Admin&background=7C3AED&color=fff`;
        setUser({ name: u.name || u.fullName || 'Super Admin', avatar: u.avatar || avatarUrl });
    }, []);

    const handleLogout = () => {
        Swal.fire({ title: 'Đăng xuất?', icon: 'question', showCancelButton: true, confirmButtonColor: '#7C3AED', confirmButtonText: 'Đăng xuất', cancelButtonText: 'Ở lại' })
            .then(r => { if (r.isConfirmed) { localStorage.clear(); navigate('/login'); } });
    };

    const navItems = [
        { path: '/super-admin/dashboard', icon: <HiOutlineChartBar className="w-5 h-5 flex-shrink-0" />, label: 'Tổng quan hệ thống' },
        { path: '/super-admin/customers', icon: <HiOutlineOfficeBuilding className="w-5 h-5 flex-shrink-0" />, label: 'Quản lý Khách hàng' },
        { path: '/super-admin/users', icon: <HiOutlineUsers className="w-5 h-5 flex-shrink-0" />, label: 'Quản lý người dùng' },
        { path: '/super-admin/revenue', icon: <HiOutlineCurrencyDollar className="w-5 h-5 flex-shrink-0" />, label: 'Doanh thu & Gói' },
        { path: '/super-admin/logs', icon: <HiOutlineDocumentReport className="w-5 h-5 flex-shrink-0" />, label: 'Nhật ký hệ thống' },
        { path: '/super-admin/settings', icon: <HiOutlineCog className="w-5 h-5 flex-shrink-0" />, label: 'Cấu hình hệ thống' },
    ];

    const getLinkClass = (path: string) => {
        const isActive = location.pathname === path;
        return `flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 mb-1 ${isActive
            ? 'bg-purple-600 text-white shadow-lg'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`;
    };

    return (
        <div className="flex h-screen bg-gray-950 overflow-hidden font-sans">
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black bg-opacity-60 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
            )}

            {/* SIDEBAR */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 bg-gray-900 border-r border-gray-800 flex flex-col justify-between transition-all duration-300
                lg:static
                ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${sidebarOpen ? 'w-64' : 'w-16'}
            `}>
                <div className="overflow-hidden">
                    <div className={`flex items-center h-16 px-3 border-b border-gray-800 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
                        {sidebarOpen && (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <HiOutlineShieldCheck className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="text-white font-bold text-sm">AEGISM</div>
                                    <div className="text-purple-400 text-xs">Super Admin</div>
                                </div>
                            </div>
                        )}
                        {!sidebarOpen && (
                            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                <HiOutlineShieldCheck className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 hover:bg-purple-600 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                        >
                            {sidebarOpen ? <HiOutlineChevronLeft className="w-3.5 h-3.5" /> : <HiOutlineChevronRight className="w-3.5 h-3.5" />}
                        </button>
                    </div>

                    <nav className="mt-4 px-2">
                        {sidebarOpen && (
                            <p className="px-3 text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Quản trị</p>
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

                <div className={`p-3 border-t border-gray-800 ${!sidebarOpen ? 'flex flex-col items-center gap-2' : ''}`}>
                    {sidebarOpen ? (
                        <>
                            <div className="flex items-center gap-3 mb-3 px-1">
                                <img src={user.avatar} className="w-9 h-9 rounded-full border-2 border-purple-500 flex-shrink-0" alt="avatar" />
                                <div>
                                    <div className="text-white text-sm font-semibold truncate">{user.name}</div>
                                    <div className="text-purple-400 text-xs">Super Administrator</div>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                                <HiOutlineLogout className="w-4 h-4" />
                                Đăng xuất
                            </button>
                        </>
                    ) : (
                        <>
                            <img src={user.avatar} className="w-8 h-8 rounded-full border-2 border-purple-500" alt="avatar" title={user.name} />
                            <button onClick={handleLogout} className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors" title="Đăng xuất">
                                <HiOutlineLogout className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            </aside>

            {/* MAIN */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                        >
                            <HiOutlineMenu className="w-5 h-5" />
                        </button>
                        <span className="text-gray-500 text-xs uppercase tracking-widest font-medium">Super Admin Panel</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:flex items-center gap-1.5 bg-green-950 text-green-400 text-xs px-3 py-1.5 rounded-full font-medium border border-green-900">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            Hệ thống hoạt động
                        </span>
                        <Link to="/dashboard" className="text-xs text-purple-400 hover:text-purple-300 border border-gray-700 hover:border-purple-600 px-3 py-1.5 rounded-lg transition-colors">
                            ← Về Dashboard
                        </Link>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto bg-gray-950 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default SuperAdminLayout;
