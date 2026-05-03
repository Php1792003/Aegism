import { useState, useEffect } from 'react';

const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' : 'https://api.aegism.online';

const fmt = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
    return (bytes / 1e3).toFixed(1) + ' KB';
};

const GaugeBar = ({ percent, color }: { percent: number, color: string }) => (
    <div className="w-full bg-gray-800 rounded-full h-2 mt-3">
        <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
);

const StatCard = ({ icon, label, value, sub, color }: any) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className={`text-2xl mb-2`}>{icon}</div>
        <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
        <div className="text-gray-400 text-sm">{label}</div>
        {sub && <div className="text-gray-600 text-xs mt-1">{sub}</div>}
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
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const fetchAll = async () => {
        const token = localStorage.getItem('accessToken');
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const [sRes, tRes] = await Promise.all([
                fetch(`${apiUrl}/api/master-admin/system-stats`, { headers }),
                fetch(`${apiUrl}/api/master-admin/tenants`, { headers }),
            ]);
            if (sRes.ok) setStats(await sRes.json());
            if (tRes.ok) setTenants(await tRes.json());
            setLastUpdate(new Date());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 10000);
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

    const cpuColor = (stats?.cpu?.usage || 0) > 80 ? 'bg-red-500' : (stats?.cpu?.usage || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500';
    const memColor = (stats?.memory?.percent || 0) > 80 ? 'bg-red-500' : (stats?.memory?.percent || 0) > 60 ? 'bg-yellow-500' : 'bg-purple-500';
    const diskColor = (stats?.disk?.percent || 0) > 80 ? 'bg-red-500' : (stats?.disk?.percent || 0) > 60 ? 'bg-yellow-500' : 'bg-blue-500';

    return (
        <div className="space-y-6 text-white">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Tổng quan hệ thống</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Cập nhật lúc {lastUpdate.toLocaleTimeString('vi-VN')} • {stats?.os?.hostname}
                    </p>
                </div>
                <button onClick={fetchAll} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2">
                    ↻ Làm mới
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="🏢" label="Tổng Tenant" value={stats?.stats?.tenants || 0} color="text-purple-400" sub={`${tenants.filter(t => t.status === 'active').length} đang hoạt động`} />
                <StatCard icon="👥" label="Tổng User" value={stats?.stats?.users || 0} color="text-blue-400" />
                <StatCard icon="🚨" label="Sự cố" value={stats?.stats?.incidents || 0} color="text-red-400" />
                <StatCard icon="⏱️" label="Uptime" value={stats?.uptime?.formatted || '—'} color="text-green-400" sub="Thời gian hoạt động" />
            </div>

            {/* Resources */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-1">
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-widest">CPU</p>
                            <p className="text-white text-xs mt-0.5">{stats?.cpu?.cores} cores • {stats?.cpu?.model?.slice(0, 25)}</p>
                        </div>
                        <span className={`text-3xl font-bold ${(stats?.cpu?.usage || 0) > 80 ? 'text-red-400' : 'text-green-400'}`}>{stats?.cpu?.usage || 0}%</span>
                    </div>
                    <GaugeBar percent={stats?.cpu?.usage || 0} color={cpuColor} />
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-1">
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-widest">RAM</p>
                            <p className="text-white text-xs mt-0.5">{fmt(stats?.memory?.used || 0)} / {fmt(stats?.memory?.total || 0)}</p>
                        </div>
                        <span className={`text-3xl font-bold ${(stats?.memory?.percent || 0) > 80 ? 'text-red-400' : 'text-purple-400'}`}>{stats?.memory?.percent || 0}%</span>
                    </div>
                    <GaugeBar percent={stats?.memory?.percent || 0} color={memColor} />
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-1">
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-widest">Disk</p>
                            <p className="text-white text-xs mt-0.5">{fmt(stats?.disk?.used || 0)} / {fmt(stats?.disk?.total || 0)}</p>
                        </div>
                        <span className={`text-3xl font-bold ${(stats?.disk?.percent || 0) > 80 ? 'text-red-400' : 'text-blue-400'}`}>{stats?.disk?.percent || 0}%</span>
                    </div>
                    <GaugeBar percent={stats?.disk?.percent || 0} color={diskColor} />
                </div>
            </div>

            {/* OS Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-4">Thông tin máy chủ</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Platform', value: stats?.os?.platform },
                        { label: 'Hostname', value: stats?.os?.hostname },
                        { label: 'Architecture', value: stats?.os?.arch },
                        { label: 'RAM trống', value: fmt(stats?.memory?.free || 0) },
                    ].map((item, i) => (
                        <div key={i}>
                            <div className="text-gray-500 text-xs mb-1">{item.label}</div>
                            <div className="text-white font-medium">{item.value || '—'}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tenant Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                    <h2 className="text-white font-semibold">Danh sách Tenant <span className="text-gray-500 font-normal">({tenants.length})</span></h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800">
                                {['Tên công ty', 'Gói', 'Trạng thái', 'Users', 'Projects', 'QR Codes', 'Ngày tạo'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.map(t => (
                                <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                                    <td className="px-4 py-3 font-medium text-white">{t.name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${planBadge[t.subscriptionPlan?.toLowerCase()] || planBadge.starter}`}>
                                            {t.subscriptionPlan || 'starter'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.status === 'active' ? 'bg-green-900 text-green-400 border border-green-700' : 'bg-red-900 text-red-400 border border-red-700'}`}>
                                            {t.status === 'active' ? '● Hoạt động' : '● Tạm dừng'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400">{t._count?.users || 0}</td>
                                    <td className="px-4 py-3 text-gray-400">{t._count?.projects || 0}</td>
                                    <td className="px-4 py-3 text-gray-400">{t._count?.qrcodes || 0}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(t.createdAt).toLocaleDateString('vi-VN')}</td>
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
