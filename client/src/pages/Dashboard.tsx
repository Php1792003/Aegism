import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
    // --- KHỞI TẠO STATE NGAY LẬP TỨC TỪ LOCALSTORAGE ---
    // Giúp hiển thị tên NGAY KHI render lần đầu, không bị "Loading..."
    const [user, setUser] = useState<any>(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : { name: 'Người dùng', tenantName: '...' };
    });

    const [currentPlan, setCurrentPlan] = useState(() => {
        return localStorage.getItem('userPlan') || 'starter';
    });

    const [usage] = useState({ projects: 1, qr: 85, users: 4 });

    const plans: any = {
        starter: { name: 'STARTER', price: 'Liên hệ', limits: { projects: 1, qr: 100, users: 5 }, color: 'blue' },
        professional: { name: 'PROFESSIONAL', price: '599.000 VNĐ', limits: { projects: 5, qr: 500, users: 50 }, color: 'purple' },
        enterprise: { name: 'ENTERPRISE', price: '1.499.000 VNĐ+', limits: { projects: 'unlimited', qr: 'unlimited', users: 'unlimited' }, color: 'indigo' }
    };

    // Vẫn giữ useEffect để cập nhật nếu localStorage thay đổi (ít khi xảy ra ở Dashboard nhưng nên có)
    useEffect(() => {
        const handleStorageChange = () => {
            const userStr = localStorage.getItem('user');
            const planStr = localStorage.getItem('userPlan');
            if (userStr) setUser(JSON.parse(userStr));
            if (planStr) setCurrentPlan(planStr);
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Helper functions
    const getLimitText = (type: string) => {
        const limit = plans[currentPlan]?.limits?.[type]; // Thêm ?. để tránh lỗi nếu plan không khớp
        return limit === 'unlimited' ? 'Không giới hạn' : limit;
    };

    const getUsagePercent = (type: string) => {
        const limit = plans[currentPlan]?.limits?.[type];
        if (limit === 'unlimited' || !limit) return 10;
        // @ts-ignore
        return (usage[type] / limit) * 100;
    };

    // Chart Configuration
    const chartData = {
        labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
        datasets: [
            {
                label: 'Lượt quét QR Code',
                data: [120, 150, 180, 220, 190, 140, 100],
                borderColor: '#2563EB',
                backgroundColor: 'rgba(37, 99, 235, 0.05)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
            },
            {
                label: 'Sự cố báo cáo',
                data: [2, 0, 5, 1, 3, 0, 1],
                borderColor: '#EF4444',
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.4,
                borderDash: [5, 5],
                pointRadius: 3,
            }
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const, align: 'end' as const },
        },
        scales: {
            y: { beginAtZero: true, grid: { borderDash: [4, 4], color: '#f3f4f6' } },
            x: { grid: { display: false } }
        }
    };

    return (
        <div>
            <div className="mb-6">
                {/* SỬA LẠI CHỖ HIỂN THỊ TÊN */}
                {/* Dùng user.fullName hoặc user.name tùy theo API trả về key nào */}
                <h3 className="text-2xl font-bold text-opsera-dark">
                    Xin chào, <span>{user.fullName || user.name || 'Bạn'}</span>! 👋
                </h3>
                <p className="text-gray-500 mt-1">
                    Chào mừng quay trở lại hệ thống <strong>{user.tenantName || user.tenant?.name || '...'}</strong>.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* CARD GÓI DỊCH VỤ */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-16 h-16 transform translate-x-4 -translate-y-4 rotate-45 opacity-10 bg-${plans[currentPlan]?.color}-500`}></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Gói Dịch Vụ</p>
                            <h4 className={`text-xl font-bold mt-1 uppercase text-${plans[currentPlan]?.color}-600`}>{plans[currentPlan]?.name}</h4>
                        </div>
                        <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Active</span>
                    </div>
                    <div className="mt-4 text-xs text-gray-500 flex justify-between items-center">
                        <span>{plans[currentPlan]?.price}/tháng</span>
                        {currentPlan !== 'enterprise' && <a href="#" className="text-blue-600 hover:underline font-medium">Nâng cấp</a>}
                    </div>
                </div>

                {/* CARD DỰ ÁN */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Dự án Quản lý</p>
                            <div className="flex items-baseline mt-1">
                                <h4 className="text-xl font-bold text-opsera-dark">{usage.projects}</h4>
                                <span className="text-sm text-gray-400 ml-1">/ <span>{getLimitText('projects')}</span></span>
                            </div>
                        </div>
                        <div className="p-2 bg-blue-50 text-opsera-primary rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                        </div>
                    </div>
                    <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full transition-all duration-500 ${getUsagePercent('projects') > 90 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${getUsagePercent('projects')}%` }}></div>
                    </div>
                </div>

                {/* CARD QR */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Mã QR / Điểm quét</p>
                            <div className="flex items-baseline mt-1">
                                <h4 className="text-xl font-bold text-opsera-dark">{usage.qr}</h4>
                                <span className="text-sm text-gray-400 ml-1">/ <span>{getLimitText('qr')}</span></span>
                            </div>
                        </div>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                        </div>
                    </div>
                    <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all duration-500 bg-purple-500" style={{ width: `${getUsagePercent('qr')}%` }}></div>
                    </div>
                </div>

                {/* CARD USERS */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Nhân sự hệ thống</p>
                            <div className="flex items-baseline mt-1">
                                <h4 className="text-xl font-bold text-opsera-dark">{usage.users}</h4>
                                <span className="text-sm text-gray-400 ml-1">/ <span>{getLimitText('users')}</span></span>
                            </div>
                        </div>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </div>
                    </div>
                    <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all duration-500 bg-green-500" style={{ width: `${getUsagePercent('users')}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* CHART SECTION */}
                <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2 border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-bold text-gray-800">Lưu lượng quét QR (7 ngày qua)</h4>
                        <button className="text-sm text-opsera-primary hover:underline">Chi tiết</button>
                    </div>
                    <div className="relative h-80 w-full">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>

                {/* SHORTCUTS SECTION */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                        <h4 className="text-lg font-bold text-gray-800 mb-4">Phím tắt</h4>
                        <div className="space-y-3">
                            <Link to="/tasks/new" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors group">
                                <span className="text-sm font-medium text-gray-700 group-hover:text-opsera-primary">Tạo nhiệm vụ mới</span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            </Link>
                            <Link to="/staff" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors group">
                                <span className="text-sm font-medium text-gray-700 group-hover:text-opsera-primary">Thêm nhân viên</span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            </Link>
                            <Link to="/reports" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors group">
                                <span className="text-sm font-medium text-gray-700 group-hover:text-opsera-primary">Xuất báo cáo tuần</span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;