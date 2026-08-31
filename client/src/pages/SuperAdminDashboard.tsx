import { useState, useEffect } from 'react';
import { HiOutlineOfficeBuilding, HiOutlineUserGroup, HiOutlineExclamation, HiOutlineClock } from 'react-icons/hi';
import Swal from 'sweetalert2';

const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' : 'https://api.aegism.online';

const fmt = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
    return (bytes / 1e3).toFixed(1) + ' KB';
};

const GaugeBar = ({ percent, color }: { percent: number, color: string }) => (
    <div className="w-full rounded-full h-2 mt-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className={`h-2 rounded-full transition-all duration-700`} style={{ width: `${Math.min(percent, 100)}%`, background: color }} />
    </div>
);

const StatCard = ({ icon, label, value, sub, accent }: any) => (
    <div style={{ background: 'rgba(17,17,27,0.8)', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: '14px', padding: '18px 20px', backdropFilter: 'blur(12px)', position: 'relative', overflow: 'hidden' }} className="flex flex-col h-full">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', background: `${accent}18`, color: accent, border: `1px solid ${accent}30`, marginBottom: '12px' }}>{icon}</div>
        <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff', lineHeight: 1.1, fontFamily: 'JetBrains Mono, monospace' }} className="truncate mb-1">{value}</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase' }} className="truncate">{label}</div>
        {sub && <div className="text-[10px] sm:text-xs mt-auto pt-2 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</div>}
    </div>
);

const planBadge: any = {
    enterprise: 'bg-purple-900 text-purple-300 border border-purple-700',
    professional: 'bg-orange-900 text-orange-300 border border-orange-700',
    starter: 'bg-blue-900 text-blue-300 border border-blue-700',
};

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const fetchAll = async (manual = false) => {
        if (manual) setIsRefreshing(true);
        const token = localStorage.getItem('accessToken');
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const [sRes, tRes] = await Promise.all([
                fetch(`${apiUrl}/api/master-admin/system-stats`, { headers }),
                fetch(`${apiUrl}/api/master-admin/tenants`, { headers }),
            ]);

            if (sRes.status === 429 || tRes.status === 429) {
                if (manual) {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'warning',
                        title: 'Thao tác quá nhanh, vui lòng thử lại sau',
                        showConfirmButton: false,
                        timer: 3000
                    });
                }
            } else {
                if (sRes.ok) setStats(await sRes.json());
                if (tRes.ok) setTenants(await tRes.json());
                setLastUpdate(new Date());
            }
        } catch (e) { console.error(e); }
        setLoading(false);
        if (manual) setIsRefreshing(false);
    };

    useEffect(() => {
        fetchAll();
        // Tăng thời gian polling lên 60 giây để tránh hit rate limit (Throttler: 60 req/min)
        const interval = setInterval(() => fetchAll(), 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <div className="text-gray-400 text-sm">Đang tải dữ liệu hệ thống...</div>
            </div>
        </div>
    );

    const cpuColor = (stats?.cpu?.usage || 0) > 80 ? '#ff2d55' : (stats?.cpu?.usage || 0) > 50 ? '#ff9500' : '#34c759';
    const memColor = (stats?.memory?.percent || 0) > 80 ? '#ff2d55' : (stats?.memory?.percent || 0) > 60 ? '#ff9500' : '#8b5cf6';
    const diskColor = (stats?.disk?.percent || 0) > 80 ? '#ff2d55' : (stats?.disk?.percent || 0) > 60 ? '#ff9500' : '#3b82f6';

    return (
        <div className="space-y-6 text-white">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Tổng quan hệ thống</h1>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1">
                        Cập nhật lúc {lastUpdate.toLocaleTimeString('vi-VN')} • {stats?.os?.hostname}
                    </p>
                </div>
                <button
                    onClick={() => fetchAll(true)}
                    disabled={isRefreshing}
                    className="w-full sm:w-auto px-4 py-2 sm:py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {isRefreshing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    )}
                    {isRefreshing ? 'Đang làm mới...' : 'Làm mới'}
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard icon={<HiOutlineOfficeBuilding className="w-5 h-5" />} label="Tổng Tenant" value={stats?.stats?.tenants || 0} accent="#8b5cf6" sub={`${tenants.filter(t => t.status === 'active').length} đang hoạt động`} />
                <StatCard icon={<HiOutlineUserGroup className="w-5 h-5" />} label="Tổng User" value={stats?.stats?.users || 0} accent="#3b82f6" />
                <StatCard icon={<HiOutlineExclamation className="w-5 h-5" />} label="Sự cố" value={stats?.stats?.incidents || 0} accent="#ff2d55" />
                <StatCard icon={<HiOutlineClock className="w-5 h-5" />} label="Uptime" value={stats?.uptime?.formatted || '—'} accent="#34c759" sub="Thời gian hoạt động" />
            </div>

            {/* Resources */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div style={{ background: 'rgba(17,17,27,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', backdropFilter: 'blur(12px)' }} className="p-5">
                    <div className="flex justify-between items-start mb-1">
                        <div>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>CPU</p>
                            <p className="text-white text-xs mt-0.5">{stats?.cpu?.cores} cores • {stats?.cpu?.model?.slice(0, 25)}</p>
                        </div>
                        <span style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: cpuColor }}>{stats?.cpu?.usage || 0}%</span>
                    </div>
                    <GaugeBar percent={stats?.cpu?.usage || 0} color={cpuColor} />
                </div>

                <div style={{ background: 'rgba(17,17,27,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', backdropFilter: 'blur(12px)' }} className="p-5">
                    <div className="flex justify-between items-start mb-1">
                        <div>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>RAM</p>
                            <p className="text-white text-xs mt-0.5">{fmt(stats?.memory?.used || 0)} / {fmt(stats?.memory?.total || 0)}</p>
                        </div>
                        <span style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: memColor }}>{stats?.memory?.percent || 0}%</span>
                    </div>
                    <GaugeBar percent={stats?.memory?.percent || 0} color={memColor} />
                </div>

                <div style={{ background: 'rgba(17,17,27,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', backdropFilter: 'blur(12px)' }} className="p-5">
                    <div className="flex justify-between items-start mb-1">
                        <div>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Disk</p>
                            <p className="text-white text-xs mt-0.5">{fmt(stats?.disk?.used || 0)} / {fmt(stats?.disk?.total || 0)}</p>
                        </div>
                        <span style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: diskColor }}>{stats?.disk?.percent || 0}%</span>
                    </div>
                    <GaugeBar percent={stats?.disk?.percent || 0} color={diskColor} />
                </div>
            </div>

            {/* OS Info */}
            <div style={{ background: 'rgba(17,17,27,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', backdropFilter: 'blur(12px)' }} className="p-4 sm:p-5">
                <h2 style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase' }} className="mb-4">Thông tin máy chủ</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {[
                        { label: 'Platform', value: stats?.os?.platform },
                        { label: 'Hostname', value: stats?.os?.hostname },
                        { label: 'Architecture', value: stats?.os?.arch },
                        { label: 'RAM trống', value: fmt(stats?.memory?.free || 0) },
                    ].map((item, i) => (
                        <div key={i} className="min-w-0">
                            <div className="text-gray-500 text-[10px] sm:text-xs mb-1 truncate">{item.label}</div>
                            <div className="text-white text-sm sm:text-base font-medium truncate">{item.value || '—'}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tenant Table */}
            <div style={{ background: 'rgba(17,17,27,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', backdropFilter: 'blur(12px)' }} className="overflow-hidden">
                <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between">
                    <h2 className="text-white font-semibold">Danh sách Tenant <span className="text-gray-500 font-normal">({tenants.length})</span></h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)]">
                                {['Tên công ty', 'Gói', 'Trạng thái', 'Users', 'Projects', 'QR Codes', 'Ngày tạo'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.map(t => (
                                <tr key={t.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{t.name}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${planBadge[t.subscriptionPlan?.toLowerCase()] || planBadge.starter}`}>
                                            {t.subscriptionPlan || 'starter'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${t.status === 'active' ? 'bg-[#34c759]/10 text-[#34c759] border border-[#34c759]/20' : 'bg-[#ff2d55]/10 text-[#ff2d55] border border-[#ff2d55]/20'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'active' ? 'bg-[#34c759]' : 'bg-[#ff2d55]'}`}></span>
                                            {t.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap font-mono">{t._count?.users || 0}</td>
                                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap font-mono">{t._count?.projects || 0}</td>
                                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap font-mono">{t._count?.qrcodes || 0}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString('vi-VN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {tenants.length === 0 && <div className="p-8 text-center text-gray-600 text-sm">Không có tenant nào</div>}
                </div>
            </div>
        </div>
    );
}
