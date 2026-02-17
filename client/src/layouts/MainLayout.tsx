import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';

import {
    HiOutlineHome,
    HiOutlineBriefcase,
    HiOutlineQrcode,
    HiOutlineUsers,
    HiOutlineClipboardList,
    HiOutlineChatAlt2,
    HiOutlineChartBar,
    HiOutlineClipboardCheck,
    HiOutlineCubeTransparent,
    HiOutlineColorSwatch,
    HiOutlineBell,
    HiOutlineMenu,
    HiOutlineLogout
} from 'react-icons/hi';

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>({ name: 'Loading...', email: '', avatar: '', roleName: 'User', tenantName: '...', isSuperAdmin: false, isTenantAdmin: false, permissions: [] });
    const [currentPlan, setCurrentPlan] = useState('starter');

    const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000'
        : 'https://aegism.online';

    const navigate = useNavigate();
    const location = useLocation();

    // --- HÀM MỚI: Xử lý màu sắc cho từng gói (3 màu khác nhau) ---
    const getPlanStyle = (plan: string) => {
        switch (plan?.toLowerCase()) {
            case 'enterprise':
                return { bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-700', label: 'ENTERPRISE' };
            case 'professional':
                return { bg: 'bg-orange-50 border-orange-100', text: 'text-orange-600', label: 'PROFESSIONAL' };
            case 'starter':
            default:
                return { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-600', label: 'STARTER' };
        }
    };

    const getPageTitle = (pathname: string) => {
        if (pathname === '/') return 'Trung tâm Điều hành';
        if (pathname.startsWith('/projects')) return 'Danh sách Dự án';
        if (pathname.startsWith('/qrcodes')) return 'Quản lý Mã QR & Điểm quét';
        if (pathname.startsWith('/staff')) return 'Quản lý Nhân sự';
        if (pathname.startsWith('/tasks')) return 'Danh sách Công việc';
        if (pathname.startsWith('/chat')) return 'Trò chuyện nội bộ';
        if (pathname.startsWith('/reports')) return 'Báo cáo & Thống kê';
        if (pathname.startsWith('/audit-log')) return 'Nhật ký Hoạt động';
        if (pathname.startsWith('/api-integration')) return 'Tích hợp API';
        if (pathname.startsWith('/branding')) return 'Cấu hình Thương hiệu';
        if (pathname.startsWith('/profile')) return 'Cài đặt Tài khoản';
        return 'Trung tâm Điều hành';
    };

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        const planStr = localStorage.getItem('userPlan');

        if (userStr) {
            try {
                const u = JSON.parse(userStr);
                updateUserUI(u);
            } catch (e) {
                console.error("Lỗi parse user", e);
            }
        }
        if (planStr) setCurrentPlan(planStr);

        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const res = await fetch(`${apiUrl}/api/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const u = await res.json();
                localStorage.setItem('user', JSON.stringify(u));
                updateUserUI(u);

                if (u.tenant && u.tenant.subscriptionPlan) {
                    const plan = u.tenant.subscriptionPlan.toLowerCase();
                    setCurrentPlan(plan);
                    localStorage.setItem('userPlan', plan);
                }
            } else if (res.status === 401) {
                localStorage.clear();
                navigate('/login');
            }
        } catch (e) {
            console.error("Sync Error:", e);
        }
    };

    const updateUserUI = (u: any) => {
        let roleDisplay = 'Nhân viên';
        let permissions: string[] = [];

        const isSuper = u.isSuperAdmin === true || u.isSuperAdmin === 'true' || u.isSuperAdmin === 1;
        const isTenant = u.isTenantAdmin === true || u.isTenantAdmin === 'true' || u.isTenantAdmin === 1;

        if (isSuper) {
            roleDisplay = 'Super Admin';
            permissions = ['ALL'];
        } else if (isTenant) {
            roleDisplay = 'Quản trị viên';
            permissions = ['ALL'];
        } else if (u.role) {
            roleDisplay = u.role.name;
            try {
                if (Array.isArray(u.role.permissions)) permissions = u.role.permissions;
                else if (typeof u.role.permissions === 'string') {
                    permissions = JSON.parse(u.role.permissions);
                }
            } catch (e) { permissions = []; }
        }

        let avatarUrl = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=2563EB&color=fff`;
        if (avatarUrl.startsWith('/uploads')) avatarUrl = `${apiUrl}${avatarUrl}`;

        setUser({
            id: u.id,
            name: u.fullName || 'Người dùng',
            email: u.email,
            avatar: avatarUrl,
            roleName: roleDisplay,
            tenantName: u.tenant ? u.tenant.name : '...',
            isSuperAdmin: isSuper,
            isTenantAdmin: isTenant,
            permissions: permissions
        });
    };

    const handleLogout = () => {
        Swal.fire({
            title: 'Đăng xuất?',
            text: "Bạn có chắc muốn thoát phiên làm việc?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563EB',
            confirmButtonText: 'Đăng xuất',
            cancelButtonText: 'Ở lại'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.clear();
                navigate('/login');
            }
        });
    };

    // --- CẬP NHẬT HÀM NÀY: Thêm tham số colorType ---
    const getLinkClass = (path: string, colorType: 'blue' | 'purple' = 'blue') => {
        const isActive = location.pathname === path;

        let activeClasses = 'bg-blue-50 text-blue-600'; // Mặc định màu xanh
        if (colorType === 'purple') {
            activeClasses = 'bg-purple-50 text-purple-600'; // Màu tím cho báo cáo
        }

        return `flex items-center px-4 py-3 rounded-lg transition-colors font-medium mb-1 ${isActive
            ? activeClasses
            : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
            }`;
    };

    const hasPermission = (perm: string) => {
        if (user.isSuperAdmin || user.isTenantAdmin) return true;
        if (user.permissions.includes('ALL')) return true;
        return user.permissions.includes(perm);
    };

    const planStyle = getPlanStyle(currentPlan);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-800">

            {/* --- SIDEBAR --- */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out flex flex-col justify-between shadow-lg lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div>
                    <div className="flex items-center justify-center h-20 border-b border-gray-100">
                        <Link to="/" className="flex items-center space-x-2">
                            <img src="/img/aegism_logo_mini.png" alt="Logo" className="h-[30px] w-auto"
                                onError={(e) => e.currentTarget.style.display = 'none'} />
                        </Link>
                    </div>

                    <nav className="mt-6 px-4 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar">
                        <Link to="/dashboard" className={getLinkClass('/')}>
                            <HiOutlineHome className="w-5 h-5 mr-3" />
                            Tổng quan (Dashboard)
                        </Link>

                        {hasPermission('VIEW_PROJECTS') && (
                            <Link to="/projects" className={getLinkClass('/projects')}>
                                <HiOutlineBriefcase className="w-5 h-5 mr-3" />
                                Quản lý Dự án
                            </Link>
                        )}

                        <Link to="/qrcodes" className={getLinkClass('/qrcodes')}>
                            <HiOutlineQrcode className="w-5 h-5 mr-3" />
                            Mã QR & Điểm quét
                        </Link>

                        <Link to="/staff" className={getLinkClass('/staff')}>
                            <HiOutlineUsers className="w-5 h-5 mr-3" />
                            Nhân sự & Phân quyền
                        </Link>

                        <Link to="/tasks" className={getLinkClass('/tasks')}>
                            <HiOutlineClipboardList className="w-5 h-5 mr-3" />
                            Công việc & Task
                        </Link>

                        <Link to="/chat" className={getLinkClass('/chat')}>
                            <HiOutlineChatAlt2 className="w-5 h-5 mr-3" />
                            Trò chuyện
                        </Link>

                        {['professional', 'enterprise'].includes(currentPlan) && (
                            <div className="pt-2 mt-2 border-t border-gray-100">
                                <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nâng cao</p>

                                {/* --- SỬA Ở ĐÂY: Truyền tham số 'purple' vào --- */}
                                <Link to="/reports" className={getLinkClass('/reports', 'purple')}>
                                    <HiOutlineChartBar className="w-5 h-5 mr-3" />
                                    Báo cáo Thống kê
                                </Link>

                                <Link to="/audit-log" className={getLinkClass('/audit-log', 'purple')}>
                                    <HiOutlineClipboardCheck className="w-5 h-5 mr-3" />
                                    Nhật ký Hoạt động
                                </Link>
                            </div>
                        )}

                        {currentPlan === 'enterprise' && (
                            <div className="pt-2 mt-2 border-t border-gray-100">
                                <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Doanh nghiệp</p>
                                <Link to="/api-integration" className={getLinkClass('/api-integration')}>
                                    <HiOutlineCubeTransparent className="w-5 h-5 mr-3" />
                                    Tích hợp API
                                </Link>
                                <Link to="/branding" className={getLinkClass('/branding')}>
                                    <HiOutlineColorSwatch className="w-5 h-5 mr-3" />
                                    Tùy chỉnh Thương hiệu
                                </Link>
                            </div>
                        )}
                    </nav>
                </div>

                <div className="p-4 border-t border-gray-200">
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                        <HiOutlineLogout className="w-5 h-5 mr-3" />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT WRAPPER --- */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* HEADER */}
                <header className="flex justify-between items-center py-4 px-6 bg-white border-b border-gray-200 shadow-sm relative z-40 h-20">
                    <div className="flex items-center">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 focus:outline-none lg:hidden mr-4 hover:bg-gray-100 p-2 rounded-md">
                            <HiOutlineMenu className="text-2xl" />
                        </button>

                        <h2 className="text-xl font-bold text-gray-800 hidden sm:block">
                            {getPageTitle(location.pathname)}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className={`hidden md:flex items-center rounded-lg p-1.5 border ${planStyle.bg}`}>
                            <span className="text-xs font-medium text-gray-500 px-2">Gói hiện tại:</span>
                            <span className={`text-sm font-bold uppercase px-2 ${planStyle.text}`}>
                                {planStyle.label}
                            </span>
                        </div>

                        <button className="relative p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none">
                            <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">3</span>
                            <HiOutlineBell className="text-2xl" />
                        </button>

                        <div className="relative group h-full flex items-center">
                            <div className="flex items-center cursor-pointer py-2 gap-3">
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-bold text-gray-800 leading-tight">{user.name}</div>
                                    <div className="text-[11px] uppercase font-bold text-blue-600 mt-0.5 tracking-wide">
                                        {user.roleName}
                                    </div>
                                </div>
                                <img className="h-10 w-10 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                                    src={user.avatar} alt="Avatar" />
                            </div>

                            <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                                <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-t border-l border-gray-100 transform rotate-45"></div>

                                <div className="p-6 relative bg-white rounded-xl z-20">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <img className="h-14 w-14 rounded-full object-cover border-2 border-blue-500 p-0.5"
                                            src={user.avatar} alt="Large Avatar" />
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {user.roleName}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 my-3"></div>

                                    <div className="space-y-3">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <span className="truncate w-full">{user.email}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <span>Tenant: <span className="font-semibold">{user.tenantName}</span></span>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-gray-100 flex justify-between items-center">
                                        <Link to="/profile" className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                                            Cài đặt tài khoản
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* PAGE CONTENT */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;