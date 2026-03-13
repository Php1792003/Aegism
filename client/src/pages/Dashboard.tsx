import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' : 'https://api.aegism.online';

const PLAN_CONFIG: any = {
    STARTER:      { label: 'STARTER',      color: 'blue',   price: 'Liên hệ' },
    PROFESSIONAL: { label: 'PROFESSIONAL', color: 'purple', price: '599.000 VNĐ' },
    ENTERPRISE:   { label: 'ENTERPRISE',   color: 'indigo', price: '1.499.000 VNĐ+' },
};

const Dashboard = () => {
    const [user] = useState<any>(() => {
        const s = localStorage.getItem('user');
        return s ? JSON.parse(s) : { fullName: 'Người dùng', tenant: { name: '...' } };
    });

    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${apiUrl}/api/dashboard/summary`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
                });
                if (res.ok) setData(await res.json());
            } catch (e) { console.error(e); }
            setIsLoading(false);
        };
        fetchDashboard();
    }, []);

    const planKey = (localStorage.getItem('userPlan') || 'starter').toUpperCase();
    const plan = PLAN_CONFIG[planKey] || PLAN_CONFIG.STARTER;

    const stats = data?.stats || {};
    const chart = data?.chart;

    const chartData = {
        labels: chart?.labels || ['T2','T3','T4','T5','T6','T7','CN'],
        datasets: [
            {
                label: 'Lượt quét QR Code',
                data: chart?.scanData || [0,0,0,0,0,0,0],
                borderColor: '#2563EB',
                backgroundColor: 'rgba(37,99,235,0.06)',
                borderWidth: 2, tension: 0.4, fill: true, pointRadius: 4,
            },
            {
                label: 'Sự cố báo cáo',
                data: chart?.incidentData || [0,0,0,0,0,0,0],
                borderColor: '#EF4444',
                backgroundColor: 'transparent',
                borderWidth: 2, tension: 0.4, borderDash: [5,5], pointRadius: 3,
            }
        ],
    };

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' as const, align: 'end' as const } },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false } }
        }
    };

    const statCards = [
        {
            label: 'Dự án Quản lý', value: isLoading ? '…' : (stats.totalProjects ?? '—'),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            iconBg: 'bg-blue-50 text-blue-600', barColor: 'bg-blue-500',
        },
        {
            label: 'Mã QR / Điểm quét', value: stats.totalQrCodes ?? '—',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
            ),
            iconBg: 'bg-purple-50 text-purple-600', barColor: 'bg-purple-500',
        },
        {
            label: 'Nhân sự hệ thống', value: stats.totalUsers ?? '—',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            iconBg: 'bg-green-50 text-green-600', barColor: 'bg-green-500',
        },
        {
            label: 'Lượt quét tuần này', value: stats.scanThisWeek ?? '—',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            iconBg: 'bg-orange-50 text-orange-600', barColor: 'bg-orange-500',
        },
    ];

    const statusColor: any = {
        VALID: 'bg-green-100 text-green-700',
        INVALID_LOCATION: 'bg-red-100 text-red-700',
        ISSUE: 'bg-yellow-100 text-yellow-700',
    };
    const statusLabel: any = {
        VALID: 'Hợp lệ', INVALID_LOCATION: 'Sai vị trí', ISSUE: 'Sự cố',
    };

    return (
        <div className="p-4 md:p-6">
            {/* Greeting */}
            <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                    Xin chào, <span>{user.fullName || user.name || 'Bạn'}</span>! 👋
                </h3>
                <p className="text-gray-500 mt-1">
                    Chào mừng quay trở lại hệ thống <strong>{user.tenant?.name || user.tenantName || '...'}</strong>.
                </p>
            </div>

            {/* Skeleton loader */}
            {isLoading && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-pulse">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="bg-white rounded-lg p-6 h-28 border border-gray-100">
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                            <div className="h-7 bg-gray-200 rounded w-1/3"></div>
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && (
                <>
                    {/* Stat cards row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Gói dịch vụ */}
                        <div className={`bg-white rounded-lg p-5 shadow-sm border border-gray-100 relative overflow-hidden col-span-2 lg:col-span-1`}>
                            <div className={`absolute top-0 right-0 w-16 h-16 transform translate-x-4 -translate-y-4 rotate-45 opacity-10 bg-${plan.color}-500`}></div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Gói Dịch Vụ</p>
                                    <h4 className={`text-lg font-bold mt-1 text-${plan.color}-600`}>{plan.label}</h4>
                                </div>
                                <span className="px-2 py-0.5 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Active</span>
                            </div>
                            <div className="mt-3 text-xs text-gray-500 flex justify-between items-center">
                                <span>{plan.price}/tháng</span>
                                {planKey !== 'ENTERPRISE' && (
                                    <Link to="/billing" className="text-blue-600 hover:underline font-medium">Nâng cấp</Link>
                                )}
                            </div>
                        </div>

                        {/* Stat cards */}
                        {statCards.map((card, i) => (
                            <div key={i} className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500">{card.label}</p>
                                        <h4 className="text-2xl font-bold text-gray-900 mt-1">{card.value}</h4>
                                    </div>
                                    <div className={`p-2 rounded-lg ${card.iconBg}`}>{card.icon}</div>
                                </div>
                                <div className="mt-4 w-full bg-gray-100 rounded-full h-1">
                                    <div className={`h-1 rounded-full ${card.barColor}`} style={{ width: '40%' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Task progress row */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                            { label: 'Chờ xử lý', value: stats.tasks?.pending ?? 0, color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-400' },
                            { label: 'Đang thực hiện', value: stats.tasks?.inProgress ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
                            { label: 'Hoàn thành', value: stats.tasks?.completed ?? 0, color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500' },
                        ].map((t, i) => (
                            <div key={i} className={`rounded-lg p-4 ${t.bg} border border-gray-100`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`w-2 h-2 rounded-full ${t.dot}`}></span>
                                    <span className="text-xs font-medium text-gray-500">{t.label}</span>
                                </div>
                                <p className={`text-2xl font-bold ${t.color}`}>{t.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Chart + Shortcuts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2 border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-base font-bold text-gray-800">Lưu lượng quét QR (7 ngày qua)</h4>
                            </div>
                            <div className="relative h-72 w-full">
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {/* Tổng sự cố */}
                            <div className="bg-red-50 border border-red-100 rounded-lg p-5">
                                <p className="text-xs font-medium text-red-500 mb-1">Tổng sự cố ghi nhận</p>
                                <p className="text-3xl font-bold text-red-600">{stats.totalIncidents ?? 0}</p>
                                <Link to="/qrcodes" className="text-xs text-red-400 hover:underline mt-1 block">Xem chi tiết →</Link>
                            </div>

                            {/* Shortcuts */}
                            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 flex-1">
                                <h4 className="text-sm font-bold text-gray-800 mb-3">Phím tắt</h4>
                                <div className="space-y-2">
                                    <Link to="/tasks" className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-blue-50 transition group">
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Tạo nhiệm vụ mới</span>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                    </Link>
                                    <Link to="/staff" className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-blue-50 transition group">
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Thêm nhân viên</span>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    </Link>
                                    <Link to="/reports" className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-blue-50 transition group">
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Xuất báo cáo tuần</span>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent logs + Recent incidents */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent scan logs */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h4 className="font-bold text-gray-800 text-sm">Lượt quét gần đây</h4>
                                <Link to="/qrcodes" className="text-xs text-blue-600 hover:underline">Xem tất cả</Link>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {(data?.recentLogs || []).length === 0 && (
                                    <p className="text-center text-gray-400 text-sm py-8">Chưa có dữ liệu</p>
                                )}
                                {(data?.recentLogs || []).map((log: any) => (
                                    <div key={log.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                                                {(log.userName || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{log.qrName}</p>
                                                <p className="text-xs text-gray-400 truncate">{log.userName} · {new Date(log.scannedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(log.scannedAt).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ml-2 ${statusColor[log.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {statusLabel[log.status] || log.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent incidents */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h4 className="font-bold text-gray-800 text-sm">Sự cố gần đây</h4>
                                <Link to="/qrcodes" className="text-xs text-blue-600 hover:underline">Xem tất cả</Link>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {(data?.recentIncidents || []).length === 0 && (
                                    <p className="text-center text-gray-400 text-sm py-8">Không có sự cố nào</p>
                                )}
                                {(data?.recentIncidents || []).map((inc: any) => (
                                    <div key={inc.id} className="px-5 py-3 hover:bg-gray-50 transition">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 mt-0.5"></span>
                                                    <span className="truncate">{inc.qrName}</span>
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 ml-3.5">{inc.description || 'Không có mô tả'}</p>
                                            </div>
                                            <p className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                                {new Date(inc.createdAt).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
