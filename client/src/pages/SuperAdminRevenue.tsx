import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { HiOutlineRefresh, HiOutlineDownload, HiOutlineSearch, HiOutlineFilter,
    HiOutlineCurrencyDollar, HiOutlineTrendingUp, HiOutlineChartBar, HiOutlineX, HiOutlineTicket, HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi';
import Swal from 'sweetalert2';

const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' : 'https://api.aegism.online';
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const fmtShort = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('vi-VN') : '—';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    PAID: { label: 'Đã thanh toán', cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' },
    PENDING: { label: 'Chờ thanh toán', cls: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' },
    CANCELLED: { label: 'Đã hủy', cls: 'bg-red-500/10 text-red-400 border border-red-500/30' },
};

const PLAN_COLORS: Record<string, string> = {
    NONE: '#6b7280', STARTER: '#3b82f6', BUSINESS: '#8b5cf6', ENTERPRISE: '#f59e0b',
};

const PLAN_PRESETS = [
    { value: '', label: 'Tất cả gói' },
    { value: 'STARTER', label: 'Starter' },
    { value: 'BUSINESS', label: 'Business' },
    { value: 'ENTERPRISE', label: 'Enterprise' },
];

const DATE_PRESETS = [
    { label: '7 ngày', days: 7 }, { label: '30 ngày', days: 30 },
    { label: '3 tháng', days: 90 }, { label: '1 năm', days: 365 }, { label: 'Tất cả', days: 0 },
];

const StatCard = ({ label, value, sub, icon: Icon, accent, trend }: any) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white truncate">{value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            {sub && <div className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{sub}</div>}
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 shadow-xl">
            <p className="text-gray-400 text-xs mb-1">{label}</p>
            <p className="text-white font-bold text-sm">{fmt(payload[0]?.value || 0)}</p>
        </div>
    );
};

// ─── VOUCHER MANAGER MODAL ───────────────────────────────────────────────────
const VoucherManagerModal = ({ onClose }: { onClose: () => void }) => {
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<string | null>(null);
    const [form, setForm] = useState({ code: '', type: 'percent', value: 0, maxUses: '', expiresAt: '', isActive: true });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/master-admin/vouchers`, { headers: hdrs() });
            setVouchers(await res.json());
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleEdit = (v: any) => {
        setEditingVoucher(v.code);
        setForm({
            code: v.code,
            type: v.type,
            value: v.value,
            maxUses: v.maxUses || '',
            expiresAt: v.expiresAt ? v.expiresAt.split('T')[0] : '',
            isActive: v.isActive
        });
        setIsCreating(true);
    };

    const handleSave = async () => {
        if (!form.code || form.value <= 0) return Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Vui lòng nhập đủ mã và giá trị', background: '#111827', color: '#f3f4f6' });

        const confirm = await Swal.fire({
            title: editingVoucher ? 'Cập nhật Voucher?' : 'Tạo Voucher mới?',
            text: `Bạn có chắc chắn muốn ${editingVoucher ? 'cập nhật' : 'tạo mới'} mã ${form.code}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy',
            background: '#111827',
            color: '#f3f4f6',
            confirmButtonColor: '#9333ea',
            cancelButtonColor: '#374151'
        });

        if (!confirm.isConfirmed) return;

        try {
            const url = editingVoucher ? `${apiUrl}/api/master-admin/vouchers/${encodeURIComponent(editingVoucher)}` : `${apiUrl}/api/master-admin/vouchers`;
            const method = editingVoucher ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method, headers: hdrs(), body: JSON.stringify(form)
            });
            if (!res.ok) throw new Error((await res.json()).message);
            Swal.fire({ icon: 'success', title: editingVoucher ? 'Đã cập nhật!' : 'Đã tạo!', timer: 1500, showConfirmButton: false, background: '#111827', color: '#f3f4f6' });
            setIsCreating(false); setEditingVoucher(null); setForm({ code: '', type: 'percent', value: 0, maxUses: '', expiresAt: '', isActive: true });
            load();
        } catch (e: any) { Swal.fire({ icon: 'error', title: 'Lỗi', text: e.message, background: '#111827', color: '#f3f4f6' }); }
    };

    const handleDelete = async (code: string) => {
        const confirm = await Swal.fire({
            title: `Xóa mã ${code}?`,
            text: 'Không thể hoàn tác hành động này!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Có, xóa ngay',
            cancelButtonText: 'Hủy',
            background: '#111827',
            color: '#f3f4f6',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#374151'
        });
        if (!confirm.isConfirmed) return;

        await fetch(`${apiUrl}/api/master-admin/vouchers/${encodeURIComponent(code)}`, { method: 'DELETE', headers: hdrs() });
        Swal.fire({ icon: 'success', title: 'Đã xóa!', timer: 1500, showConfirmButton: false, background: '#111827', color: '#f3f4f6' });
        load();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2"><HiOutlineTicket className="w-5 h-5 text-purple-400" /> Quản lý Voucher</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><HiOutlineX className="w-5 h-5" /></button>
                </div>
                <div className="p-6 flex-1 overflow-hidden flex flex-col gap-6">
                    {isCreating ? (
                        <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl">
                            <h3 className="text-sm font-semibold text-white mb-3">{editingVoucher ? 'Cập nhật Voucher' : 'Thêm Voucher Mới'}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                <div className="col-span-2"><label className="text-xs text-gray-400 block mb-1">Mã (VD: GIAM50)</label>
                                <input disabled={!!editingVoucher} value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed" /></div>
                                <div><label className="text-xs text-gray-400 block mb-1">Loại</label>
                                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2">
                                    <option value="percent">% (Phần trăm)</option><option value="fixed">VND (Cố định)</option>
                                </select></div>
                                <div><label className="text-xs text-gray-400 block mb-1">Giá trị</label>
                                <input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: Number(e.target.value) }))} className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2" /></div>
                                <div><label className="text-xs text-gray-400 block mb-1">Giới hạn (lần)</label>
                                <input type="number" placeholder="Vô hạn" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2" /></div>
                                <div><label className="text-xs text-gray-400 block mb-1">Hạn sử dụng</label>
                                <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2" /></div>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 rounded bg-gray-900 border-gray-700 accent-purple-600" />
                                    <span className="text-sm text-gray-300">Kích hoạt Voucher</span>
                                </label>
                                <div className="flex gap-2">
                                    <button onClick={() => { setIsCreating(false); setEditingVoucher(null); setForm({ code: '', type: 'percent', value: 0, maxUses: '', expiresAt: '', isActive: true }); }} className="px-3 py-1.5 text-xs border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">Hủy</button>
                                    <button onClick={handleSave} className="px-4 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">Lưu Voucher</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <button onClick={() => setIsCreating(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg"><HiOutlinePlus /> Thêm Voucher</button>
                        </div>
                    )}
                    
                    <div className="flex-1 overflow-y-auto border border-gray-800 rounded-xl">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase border-b border-gray-800">
                                <tr>
                                    <th className="px-4 py-3">Mã Voucher</th><th className="px-4 py-3">Giá trị</th><th className="px-4 py-3">Đã dùng / Giới hạn</th><th className="px-4 py-3">Hạn sử dụng</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? <tr><td colSpan={6} className="text-center py-4 text-gray-500">Đang tải...</td></tr> : vouchers.map(v => (
                                    <tr key={v.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                                        <td className="px-4 py-3 font-mono font-bold text-white">{v.code}</td>
                                        <td className="px-4 py-3 text-emerald-400 font-semibold">{v.type === 'percent' ? `${v.value}%` : fmt(v.value)}</td>
                                        <td className="px-4 py-3 text-gray-400">{v.usedCount} / {v.maxUses || '∞'}</td>
                                        <td className="px-4 py-3 text-gray-400">{v.expiresAt ? new Date(v.expiresAt).toLocaleDateString('vi-VN') : 'Vô hạn'}</td>
                                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${v.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{v.isActive ? 'Đang bật' : 'Tạm tắt'}</span></td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => handleEdit(v)} className="text-gray-500 hover:text-purple-500 p-1 mr-1 transition-colors"><HiOutlinePencil className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(v.code)} className="text-gray-500 hover:text-red-500 p-1 transition-colors"><HiOutlineTrash className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SuperAdminRevenue = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tenants, setTenants] = useState<any[]>([]);

    // Filters
    const [datePreset, setDatePreset] = useState(30);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [plan, setPlan] = useState('');
    const [status, setStatus] = useState('PAID');
    const [tenantId, setTenantId] = useState('');
    const [groupBy, setGroupBy] = useState<'day' | 'month' | 'year'>('month');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [showVouchers, setShowVouchers] = useState(false);

    const getDateRange = useCallback(() => {
        if (datePreset === 0) return { startDate: '', endDate: '' };
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - datePreset);
        return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
    }, [datePreset]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const range = datePreset > 0 ? getDateRange() : { startDate, endDate };
            const params = new URLSearchParams({
                ...(range.startDate && { startDate: range.startDate }),
                ...(range.endDate && { endDate: range.endDate }),
                ...(plan && { plan }),
                ...(status && { status }),
                ...(tenantId && { tenantId }),
                ...(search && { search }),
                groupBy,
                page: String(page),
                limit: '20',
            });
            const res = await fetch(`${apiUrl}/api/master-admin/revenue?${params}`, { headers: hdrs() });
            if (!res.ok) throw new Error();
            setData(await res.json());
        } catch {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể tải dữ liệu doanh thu', background: '#111827', color: '#f3f4f6' });
        } finally { setLoading(false); }
    }, [datePreset, startDate, endDate, plan, status, tenantId, groupBy, search, page, getDateRange]);

    useEffect(() => {
        fetch(`${apiUrl}/api/master-admin/tenants`, { headers: hdrs() })
            .then(r => r.json()).then(setTenants).catch(() => {});
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleExport = async () => {
        const range = datePreset > 0 ? getDateRange() : { startDate, endDate };
        const params = new URLSearchParams({
            ...(range.startDate && { startDate: range.startDate }),
            ...(range.endDate && { endDate: range.endDate }),
            ...(plan && { plan }),
            ...(status && { status }),
            ...(tenantId && { tenantId }),
        });
        const url = `${apiUrl}/api/master-admin/revenue/export?${params}`;
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        const token = localStorage.getItem('accessToken');
        // Fetch with auth then blob download
        try {
            const res = await fetch(url, { headers: hdrs() });
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            a.href = blobUrl;
            a.download = `doanh-thu-${Date.now()}.csv`;
            a.click();
            URL.revokeObjectURL(blobUrl);
        } catch {
            Swal.fire({ icon: 'error', title: 'Lỗi xuất file', background: '#111827', color: '#f3f4f6' });
        }
    };

    const byPlanData = useMemo(() => {
        if (!data?.byPlan) return [];
        return Object.entries(data.byPlan).map(([key, val]) => ({
            name: key, value: val as number, color: PLAN_COLORS[key] || '#6b7280',
        }));
    }, [data]);

    const summary = data?.summary || {};
    const transactions = data?.transactions || [];
    const chartData = data?.chartData || [];
    const pagination = data?.pagination || {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Doanh thu & Giao dịch</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Theo dõi doanh thu từ các giao dịch PayOS</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={load} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 border border-gray-700 hover:border-gray-600 hover:text-white rounded-lg transition-colors">
                        <HiOutlineRefresh className="w-4 h-4" /> Làm mới
                    </button>
                    <button onClick={() => setShowFilters(p => !p)} className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${showFilters ? 'bg-purple-600 border-purple-600 text-white' : 'text-gray-400 border-gray-700 hover:text-white hover:border-gray-600'}`}>
                        <HiOutlineFilter className="w-4 h-4" /> Bộ lọc
                    </button>
                    <button onClick={() => setShowVouchers(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                        <HiOutlineTicket className="w-4 h-4" /> Quản lý Voucher
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">
                        <HiOutlineDownload className="w-4 h-4" /> Xuất CSV
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">Bộ lọc nâng cao</h3>
                        <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-white">
                            <HiOutlineX className="w-4 h-4" />
                        </button>
                    </div>
                    {/* Date presets */}
                    <div>
                        <label className="text-xs text-gray-400 mb-2 block">Khoảng thời gian</label>
                        <div className="flex flex-wrap gap-2">
                            {DATE_PRESETS.map(p => (
                                <button key={p.days} onClick={() => { setDatePreset(p.days); setStartDate(''); setEndDate(''); }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${datePreset === p.days && !startDate ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Từ ngày</label>
                            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setDatePreset(0); }}
                                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Đến ngày</label>
                            <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setDatePreset(0); }}
                                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Gói dịch vụ</label>
                            <select value={plan} onChange={e => setPlan(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500">
                                {PLAN_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Trạng thái</label>
                            <select value={status} onChange={e => setStatus(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500">
                                <option value="">Tất cả</option>
                                <option value="PAID">Đã thanh toán</option>
                                <option value="PENDING">Chờ thanh toán</option>
                                <option value="CANCELLED">Đã hủy</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Khách hàng</label>
                            <select value={tenantId} onChange={e => setTenantId(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500">
                                <option value="">Tất cả khách hàng</option>
                                {tenants.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Nhóm theo</label>
                            <select value={groupBy} onChange={e => setGroupBy(e.target.value as any)}
                                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500">
                                <option value="day">Theo ngày</option>
                                <option value="month">Theo tháng</option>
                                <option value="year">Theo năm</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng doanh thu" value={loading ? '...' : fmtShort(summary.totalRevenue || 0) + ' ₫'} icon={HiOutlineCurrencyDollar} accent="bg-purple-500/10 text-purple-400" />
                <StatCard label="Tháng này" value={loading ? '...' : fmtShort(summary.thisMonthRevenue || 0) + ' ₫'} sub={`${summary.growth >= 0 ? '▲' : '▼'} ${Math.abs(summary.growth || 0)}% so với tháng trước`} trend={summary.growth} icon={HiOutlineTrendingUp} accent="bg-emerald-500/10 text-emerald-400" />
                <StatCard label="Tổng giao dịch" value={loading ? '...' : summary.totalTransactions || 0} icon={HiOutlineChartBar} accent="bg-blue-500/10 text-blue-400" />
                <StatCard label="GD tháng này" value={loading ? '...' : summary.thisMonthCount || 0} icon={HiOutlineChartBar} accent="bg-orange-500/10 text-orange-400" />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Area chart */}
                <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Xu hướng doanh thu</h3>
                    {loading ? (
                        <div className="h-56 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-56 flex items-center justify-center text-gray-600 text-sm">Không có dữ liệu</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={fmtShort} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 4, fill: '#8b5cf6' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Pie chart */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Doanh thu theo gói</h3>
                    {loading || byPlanData.length === 0 ? (
                        <div className="h-56 flex items-center justify-center text-gray-600 text-sm">
                            {loading ? <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /> : 'Không có dữ liệu'}
                        </div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie data={byPlanData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                        {byPlanData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip formatter={(v: any) => fmt(v)} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-2">
                                {byPlanData.map((p: any) => (
                                    <div key={p.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                            <span className="text-gray-400">{p.name}</span>
                                        </div>
                                        <span className="text-white font-medium">{fmtShort(p.value)} ₫</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Transactions table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                    <h3 className="text-sm font-semibold text-white">Lịch sử giao dịch</h3>
                    <div className="relative">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Tìm mã GD, tên khách..."
                            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-purple-500 placeholder-gray-600 w-64" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="text-left px-5 py-3.5">Mã GD</th>
                                <th className="text-left px-4 py-3.5">Khách hàng</th>
                                <th className="text-left px-4 py-3.5">Gói</th>
                                <th className="text-right px-4 py-3.5">Gốc / Giảm</th>
                                <th className="text-right px-4 py-3.5">Thực thu</th>
                                <th className="text-left px-4 py-3.5">Trạng thái</th>
                                <th className="text-left px-4 py-3.5">Ngày</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-gray-800/50">
                                    {Array.from({ length: 6 }).map((_, j) => (
                                        <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>
                                    ))}
                                </tr>
                            )) : transactions.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-16 text-gray-600">Không có giao dịch nào</td></tr>
                            ) : transactions.map((t: any) => {
                                const st = STATUS_MAP[t.status] || STATUS_MAP['PENDING'];
                                const planColor = PLAN_COLORS[t.plan] || '#6b7280';
                                return (
                                    <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                                        <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{t.orderCode}</td>
                                        <td className="px-4 py-3.5 text-white text-sm">{t.tenant?.name || '—'}</td>
                                        <td className="px-4 py-3.5">
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: planColor + '20', color: planColor, border: `1px solid ${planColor}40` }}>
                                                {t.plan}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            {t.originalAmount && t.originalAmount !== t.amount && <div className="text-gray-400 text-xs line-through">{fmt(t.originalAmount)}</div>}
                                            {t.voucherCode && <div className="text-purple-400 text-xs font-mono">-{fmt(t.discountAmount || 0)} ({t.voucherCode})</div>}
                                            {(!t.originalAmount || t.originalAmount === t.amount) && <span className="text-gray-400 text-xs">—</span>}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-bold text-white">{fmt(t.amount)}</td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-400 text-xs">{fmtDateTime(t.createdAt)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-800">
                        <span className="text-xs text-gray-500">
                            Trang {pagination.page} / {pagination.totalPages} ({pagination.total} giao dịch)
                        </span>
                        <div className="flex gap-1">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors">← Trước</button>
                            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                                className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors">Sau →</button>
                        </div>
                    </div>
                )}
            </div>
            
            {showVouchers && <VoucherManagerModal onClose={() => setShowVouchers(false)} />}
        </div>
    );
};

export default SuperAdminRevenue;
