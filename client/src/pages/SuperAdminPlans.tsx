import { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { HiOutlineRefresh, HiOutlinePencil, HiOutlineX, HiOutlineCheck, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import Swal from 'sweetalert2';

const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' : 'https://api.aegism.online';
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` });
const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const fmtShort = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M ₫` : `${(n / 1_000).toFixed(0)}K ₫`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleString('vi-VN') : '—';

const PLAN_COLORS: Record<string, string> = { NONE: '#6b7280', STARTER: '#3b82f6', BUSINESS: '#8b5cf6', ENTERPRISE: '#f59e0b' };

// ─── EDIT PLAN MODAL ─────────────────────────────────────────────────────────
const EditPlanModal = ({ plan, isNew = false, onClose, onSave }: { plan: any; isNew?: boolean; onClose: () => void; onSave: (key: string, data: any, isNew: boolean) => Promise<void> }) => {
    const [form, setForm] = useState({
        planKey: plan.planKey || '',
        displayName: plan.displayName || '',
        monthlyPrice: plan.monthlyPrice || 0,
        yearlyPrice: plan.yearlyPrice || 0,
        maxUsers: plan.maxUsers || 5,
        maxProjects: plan.maxProjects || 1,
        maxQRCodes: plan.maxQRCodes || 100,
        features: (plan.features || []).join('\n'),
        isActive: plan.isActive ?? true,
    });
    const [discountPercent, setDiscountPercent] = useState(() => {
        const m = plan.monthlyPrice || 0;
        const y = plan.yearlyPrice || 0;
        if (m > 0 && y > 0) {
            return Math.round(((m - y) / m) * 100);
        }
        return 0;
    });
    const [saving, setSaving] = useState(false);

    const updateMonthlyPrice = (val: number) => {
        setForm(p => {
            const nextForm = { ...p, monthlyPrice: val };
            if (discountPercent > 0 && val > 0) {
                nextForm.yearlyPrice = Math.round(val * (1 - discountPercent / 100));
            } else if (val > 0 && p.yearlyPrice > 0) {
                setDiscountPercent(Math.round(((val - p.yearlyPrice) / val) * 100));
            }
            return nextForm;
        });
    };

    const updateYearlyPrice = (val: number) => {
        setForm(p => {
            const nextForm = { ...p, yearlyPrice: val };
            if (p.monthlyPrice > 0) {
                const pct = Math.round(((p.monthlyPrice - val) / p.monthlyPrice) * 100);
                setDiscountPercent(Math.max(0, pct));
            }
            return nextForm;
        });
    };

    const updateDiscountPercent = (pct: number) => {
        const safePct = Math.max(0, Math.min(100, pct));
        setDiscountPercent(safePct);
        setForm(p => {
            const nextForm = { ...p };
            if (p.monthlyPrice > 0) {
                nextForm.yearlyPrice = Math.round(p.monthlyPrice * (1 - safePct / 100));
            }
            return nextForm;
        });
    };

    const submit = async () => {
        if (isNew && !form.planKey) {
            Swal.fire({ icon: 'warning', title: 'Thiếu mã gói', text: 'Vui lòng nhập mã gói', background: '#111827', color: '#f3f4f6' });
            return;
        }
        setSaving(true);
        await onSave(form.planKey || plan.planKey, { ...form, features: form.features.split('\n').filter(Boolean) }, isNew);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <div>
                        <h2 className="text-white font-bold text-lg">{isNew ? 'Thêm gói mới' : 'Chỉnh sửa gói'}</h2>
                        {!isNew && <p className="text-gray-400 text-xs mt-0.5 font-mono">{plan.planKey}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"><HiOutlineX className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                    {isNew && (
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block">Mã gói (VD: PRO)</label>
                            <input value={form.planKey} onChange={e => setForm(p => ({ ...p, planKey: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
                                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500" />
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">Tên hiển thị</label>
                        <input value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                            <label className="text-xs text-gray-400 mb-1.5 block">Giá tháng (VND)</label>
                            <input type="number" value={form.monthlyPrice} onChange={e => updateMonthlyPrice(Number(e.target.value))}
                                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500" />
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs text-gray-400 mb-1.5 block">Giảm giá năm (%)</label>
                            <input type="number" min={0} max={100} value={discountPercent} onChange={e => updateDiscountPercent(Number(e.target.value))}
                                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500 text-emerald-400 font-bold" />
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs text-gray-400 mb-1.5 block">Giá năm/tháng (VND)</label>
                            <input type="number" value={form.yearlyPrice} onChange={e => updateYearlyPrice(Number(e.target.value))}
                                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {[['maxUsers', 'Max Users'], ['maxProjects', 'Max Projects'], ['maxQRCodes', 'Max QR']].map(([k, l]) => (
                            <div key={k}>
                                <label className="text-xs text-gray-400 mb-1.5 block">{l}</label>
                                <input type="number" value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: Number(e.target.value) }))}
                                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500" />
                            </div>
                        ))}
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">Tính năng (mỗi dòng 1 tính năng)</label>
                        <textarea rows={6} value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500 resize-none" />
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="active" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                            className="w-4 h-4 rounded bg-gray-800 border-gray-600 accent-purple-600" />
                        <label htmlFor="active" className="text-sm text-gray-300">Kích hoạt gói</label>
                    </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg">Hủy</button>
                    <button onClick={submit} disabled={saving}
                        className="px-5 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2">
                        {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── TENANT HISTORY MODAL ────────────────────────────────────────────────────
const TenantHistoryModal = ({ tenantId, tenantName, onClose }: { tenantId: string; tenantName: string; onClose: () => void }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${apiUrl}/api/master-admin/tenant-payments/${tenantId}`, { headers: hdrs() })
            .then(r => r.json()).then(setData).catch(() => { }).finally(() => setLoading(false));
    }, [tenantId]);

    const exportCSV = () => {
        if (!data?.payments?.length) return;
        const rows = [['Mã GD', 'Gói', 'Số tiền', 'Trạng thái', 'Ngày'],
        ...data.payments.map((p: any) => [p.orderCode, p.plan, p.amount, p.status, new Date(p.createdAt).toLocaleString('vi-VN')])];
        const csv = '\uFEFF' + rows.map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
        a.download = `lichsu-${tenantName}-${Date.now()}.csv`; a.click();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <div>
                        <h2 className="text-white font-bold">Lịch sử thanh toán</h2>
                        <p className="text-gray-400 text-sm">{tenantName} · Tổng: <span className="text-emerald-400 font-semibold">{fmt(data?.totalSpent || 0)}</span></p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={exportCSV} className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">Xuất CSV</button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><HiOutlineX className="w-5 h-5" /></button>
                    </div>
                </div>
                <div className="overflow-y-auto flex-1">
                    {loading ? <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
                        : !data?.payments?.length ? <p className="text-center py-16 text-gray-600">Chưa có giao dịch nào</p>
                            : (
                                <table className="w-full text-sm">
                                    <thead><tr className="border-b border-gray-800 text-gray-500 text-xs uppercase">
                                        <th className="text-left px-5 py-3">Mã GD</th>
                                        <th className="text-left px-4 py-3">Gói</th>
                                        <th className="text-right px-4 py-3">Số tiền</th>
                                        <th className="text-left px-4 py-3">Trạng thái</th>
                                        <th className="text-left px-4 py-3">Ngày</th>
                                    </tr></thead>
                                    <tbody>
                                        {data.payments.map((p: any) => (
                                            <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                                                <td className="px-5 py-3 font-mono text-xs text-gray-400">{p.orderCode}</td>
                                                <td className="px-4 py-3"><span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: (PLAN_COLORS[p.plan] || '#6b7280') + '20', color: PLAN_COLORS[p.plan] || '#6b7280' }}>{p.plan}</span></td>
                                                <td className="px-4 py-3 text-right font-bold text-white">{fmt(p.amount)}</td>
                                                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : p.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>{p.status}</span></td>
                                                <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(p.createdAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                </div>
            </div>
        </div>
    );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const SuperAdminPlans = () => {
    const [plans, setPlans] = useState<any[]>([]);
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [historyTenant, setHistoryTenant] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [tenantSearch, setTenantSearch] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, tenantsRes] = await Promise.all([
                fetch(`${apiUrl}/api/master-admin/plan-stats`, { headers: hdrs() }),
                fetch(`${apiUrl}/api/master-admin/tenants`, { headers: hdrs() }),
            ]);
            if (!statsRes.ok || !tenantsRes.ok) {
                const status = !statsRes.ok ? statsRes.status : tenantsRes.status;
                if (status === 401 || status === 403) {
                    Swal.fire({ icon: 'warning', title: 'Phiên đăng nhập hết hạn', text: 'Vui lòng đăng nhập lại', background: '#111827', color: '#f3f4f6' })
                        .then(() => { localStorage.clear(); window.location.href = '/login'; });
                    return;
                }
                throw new Error(`HTTP ${status}`);
            }
            const plansData = await statsRes.json();
            const tenantsData = await tenantsRes.json();
            setPlans(Array.isArray(plansData) ? plansData : []);
            setTenants(Array.isArray(tenantsData) ? tenantsData : []);
        } catch {
            Swal.fire({ icon: 'error', title: 'Lỗi tải dữ liệu', background: '#111827', color: '#f3f4f6' });
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSave = async (planKey: string, dto: any, isNew: boolean) => {
        try {
            const url = isNew ? `${apiUrl}/api/master-admin/plan-config` : `${apiUrl}/api/master-admin/plan-config/${planKey}`;
            const method = isNew ? 'POST' : 'PUT';
            const res = await fetch(url, {
                method, headers: hdrs(), body: JSON.stringify(dto),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Lỗi xử lý');
            }
            await load();
            setEditingPlan(null);
            setIsCreating(false);
            Swal.fire({ icon: 'success', title: isNew ? 'Đã thêm gói!' : 'Đã cập nhật gói!', timer: 1500, showConfirmButton: false, background: '#111827', color: '#f3f4f6' });
        } catch (e: any) {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: e.message, background: '#111827', color: '#f3f4f6' });
        }
    };

    const handleDelete = async (planKey: string) => {
        const result = await Swal.fire({
            title: `Xóa gói ${planKey}?`,
            text: "Không thể hoàn tác hành động này!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#374151',
            confirmButtonText: 'Có, xóa gói',
            cancelButtonText: 'Hủy',
            background: '#111827',
            color: '#f3f4f6'
        });
        if (result.isConfirmed) {
            try {
                const res = await fetch(`${apiUrl}/api/master-admin/plan-config/${planKey}`, { method: 'DELETE', headers: hdrs() });
                if (!res.ok) throw new Error();
                await load();
                Swal.fire({ icon: 'success', title: 'Đã xóa!', timer: 1500, showConfirmButton: false, background: '#111827', color: '#f3f4f6' });
            } catch {
                Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể xóa gói', background: '#111827', color: '#f3f4f6' });
            }
        }
    };

    const pieData = plans.map(p => ({ name: p.planKey, value: p.tenantCount, color: PLAN_COLORS[p.planKey] || '#6b7280' }));
    const totalTenants = plans.reduce((s, p) => s + p.tenantCount, 0);
    const filteredTenants = tenants.filter(t => !tenantSearch || t.name?.toLowerCase().includes(tenantSearch.toLowerCase()) || t.users?.[0]?.email?.toLowerCase().includes(tenantSearch.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Quản lý Gói dịch vụ</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Cấu hình giá, tính năng và theo dõi phân bổ tenant</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium">
                        <HiOutlinePlus className="w-4 h-4" /> Thêm gói
                    </button>
                    <button onClick={load} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 border border-gray-700 hover:text-white hover:border-gray-600 rounded-lg">
                        <HiOutlineRefresh className="w-4 h-4" /> Làm mới
                    </button>
                </div>
            </div>

            {/* Stats overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 h-24 animate-pulse" />
                )) : plans.map(p => (
                    <div key={p.planKey} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLAN_COLORS[p.planKey] || '#6b7280' }} />
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{p.planKey}</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{p.tenantCount}</div>
                        <div className="text-xs text-gray-500 mt-0.5">tenant đang dùng</div>
                        <div className="text-xs text-emerald-400 mt-1 font-medium">{fmtShort(p.revenue || 0)} doanh thu</div>
                    </div>
                ))}
            </div>

            {/* Charts + Plan cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Pie */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Phân bổ tenant theo gói</h3>
                    {!loading && pieData.some(p => p.value > 0) ? (
                        <>
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie data={pieData.filter(p => p.value > 0)} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                        {pieData.filter(p => p.value > 0).map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip formatter={(v: any, name: any) => [`${v} tenant`, name]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-3">
                                {plans.filter(p => p.tenantCount > 0).map(p => (
                                    <div key={p.planKey} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLAN_COLORS[p.planKey] || '#6b7280' }} />
                                            <span className="text-gray-400">{p.displayName}</span>
                                        </div>
                                        <span className="text-white font-medium">{p.tenantCount} <span className="text-gray-500">({totalTenants ? Math.round(p.tenantCount / totalTenants * 100) : 0}%)</span></span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : <div className="h-40 flex items-center justify-center text-gray-600 text-sm">{loading ? <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /> : 'Chưa có dữ liệu'}</div>}
                </div>

                {/* Plan cards */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 h-48 animate-pulse" />) :
                        plans.map(p => (
                            <div key={p.planKey} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3 relative group hover:border-gray-700 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PLAN_COLORS[p.planKey] || '#6b7280' }} />
                                            <span className="text-white font-bold text-base">{p.displayName}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono">{p.planKey}</div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <button onClick={() => setEditingPlan(p)} className="p-1.5 rounded-lg bg-gray-800 hover:bg-purple-600 text-gray-400 hover:text-white" title="Chỉnh sửa">
                                            <HiOutlinePencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(p.planKey)} className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white" title="Xóa">
                                            <HiOutlineTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-white">{p.monthlyPrice > 0 ? fmt(p.monthlyPrice) : 'Miễn phí'}</div>
                                    {p.yearlyPrice > 0 && (
                                        <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                                            <span>{fmt(p.yearlyPrice)}/tháng (yearly)</span>
                                            {p.monthlyPrice > 0 && (
                                                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
                                                    -{Math.round(((p.monthlyPrice - p.yearlyPrice) / p.monthlyPrice) * 100)}%
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 space-y-0.5">
                                    <div>👥 Max {p.maxUsers} users · 📁 {p.maxProjects} projects · 📱 {p.maxQRCodes} QR</div>
                                </div>
                                <div className="space-y-1 flex-1">
                                    {(p.features || []).slice(0, 3).map((f: string, i: number) => (
                                        <div key={i} className="flex items-start gap-1.5 text-xs text-gray-400">
                                            <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <span className="line-clamp-1">{f}</span>
                                        </div>
                                    ))}
                                    {p.features?.length > 3 && <div className="text-xs text-gray-600">+{p.features.length - 3} tính năng khác</div>}
                                </div>
                                {!p.isActive && <div className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">Đang tắt</div>}
                            </div>
                        ))}
                </div>
            </div>

            {/* Tenant payment history lookup */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                    <h3 className="text-sm font-semibold text-white">Lịch sử thanh toán theo khách hàng</h3>
                    <div className="relative">
                        <input value={tenantSearch} onChange={e => setTenantSearch(e.target.value)} placeholder="Tìm khách hàng..."
                            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg pl-3 pr-4 py-2 focus:outline-none focus:border-purple-500 placeholder-gray-600 w-52" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-800 text-gray-500 text-xs uppercase">
                            <th className="text-left px-5 py-3">Tenant</th>
                            <th className="text-left px-4 py-3">Gói hiện tại</th>
                            <th className="text-left px-4 py-3">Users</th>
                            <th className="text-left px-4 py-3">Ngày tạo</th>
                            <th className="text-center px-4 py-3">Lịch sử TT</th>
                        </tr></thead>
                        <tbody>
                            {loading ? Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-gray-800/50">
                                    {Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>)}
                                </tr>
                            )) : filteredTenants.slice(0, 15).map((t: any) => (
                                <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors group">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-800/60 flex items-center justify-center text-purple-300 font-semibold text-sm flex-shrink-0">{t.name?.charAt(0)}</div>
                                            <div>
                                                <div className="text-white font-medium text-sm">{t.name}</div>
                                                <div className="text-gray-500 text-xs">{t.users?.[0]?.email || '—'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: (PLAN_COLORS[t.subscriptionPlan] || '#6b7280') + '20', color: PLAN_COLORS[t.subscriptionPlan] || '#6b7280' }}>
                                            {t.subscriptionPlan || 'NONE'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-sm">{t._count?.users || 0}</td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">{t.createdAt ? new Date(t.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => setHistoryTenant(t)}
                                            className="opacity-60 group-hover:opacity-100 transition-opacity text-xs px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white rounded-lg border border-purple-600/30 hover:border-purple-600">
                                            Xem lịch sử
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingPlan && <EditPlanModal plan={editingPlan} onClose={() => setEditingPlan(null)} onSave={handleSave} />}
            {isCreating && <EditPlanModal isNew={true} plan={{}} onClose={() => setIsCreating(false)} onSave={handleSave} />}
            {historyTenant && <TenantHistoryModal tenantId={historyTenant.id} tenantName={historyTenant.name} onClose={() => setHistoryTenant(null)} />}
        </div>
    );
};

export default SuperAdminPlans;
