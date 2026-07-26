import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import {
    HiOutlineSearch, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash,
    HiOutlineRefresh, HiOutlineEye,
    HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock,
    HiOutlineCurrencyDollar, HiOutlineCalendar, HiOutlineUser,
    HiOutlineOfficeBuilding, HiOutlineMail,
    HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineX,
    HiOutlineExclamationCircle
} from 'react-icons/hi';

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface SubscriptionRecord {
    id: string;
    plan: string;
    price: number;
    status: string;
    startDate: string;
    endDate: string;
    paymentMethod?: string;
    createdAt: string;
}

interface Customer {
    id: string;
    name: string;              // Tenant name (= company name)
    plan: string;              // e.g. "STARTER", "PRO", "ENTERPRISE"
    status: string;            // "active" | "expired" | "suspended"
    isActive: boolean;
    subscriptionExpiresAt: string | null;
    createdAt: string;
    updatedAt: string;
    maxUsers: number;
    maxProjects: number;
    maxQRCodes: number;
    adminEmail: string | null;
    adminName: string | null;
    adminAvatar: string | null;
    totalSpent: number;
    renewalCount: number;
    userCount: number;
    projectCount: number;
    qrcodeCount: number;
    subscriptions: SubscriptionRecord[];
    paymentOrders: any[];
}

// ─── API LAYER ────────────────────────────────────────────────────────────────
const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' : 'https://api.aegism.online';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
});

const api = {
    getCustomers: async (): Promise<Customer[]> => {
        const res = await fetch(`${apiUrl}/api/master-admin/customers`, { headers: getHeaders() });
        if (!res.ok) throw new Error(`Failed to fetch customers: ${res.status}`);
        return res.json();
    },
    createCustomer: async (payload: { name: string; subscriptionPlan?: string; isActive?: boolean; maxUsers?: number; maxProjects?: number; maxQRCodes?: number }): Promise<any> => {
        const res = await fetch(`${apiUrl}/api/master-admin/customers`, {
            method: 'POST', headers: getHeaders(), body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Failed to create customer: ${res.status}`);
        return res.json();
    },
    updateCustomer: async (id: string, payload: any): Promise<any> => {
        const res = await fetch(`${apiUrl}/api/master-admin/customers/${id}`, {
            method: 'PUT', headers: getHeaders(), body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Failed to update customer: ${res.status}`);
        return res.json();
    },
    deleteCustomer: async (id: string): Promise<void> => {
        const res = await fetch(`${apiUrl}/api/master-admin/customers/${id}`, {
            method: 'DELETE', headers: getHeaders(),
        });
        if (!res.ok) throw new Error(`Failed to delete customer: ${res.status}`);
    },
    renewPlan: async (id: string, plan: string, months: number, note?: string): Promise<any> => {
        const res = await fetch(`${apiUrl}/api/master-admin/customers/${id}/renew`, {
            method: 'POST', headers: getHeaders(), body: JSON.stringify({ plan, months, note }),
        });
        if (!res.ok) throw new Error(`Failed to renew plan: ${res.status}`);
        return res.json();
    },
    getPlanConfigs: async (): Promise<any[]> => {
        const res = await fetch(`${apiUrl}/api/master-admin/plan-config`, { headers: getHeaders() });
        if (!res.ok) throw new Error(`Failed to fetch plan configs: ${res.status}`);
        return res.json();
    },
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PLANS = [
    { value: 'NONE', label: 'Miễn phí', color: 'text-gray-400 bg-gray-800', price: 0 },
    { value: 'STARTER', label: 'Starter', color: 'text-blue-400 bg-blue-900/40', price: 200000 },
    { value: 'BUSINESS', label: 'Business', color: 'text-purple-400 bg-purple-900/40', price: 500000 },
    { value: 'ENTERPRISE', label: 'Enterprise', color: 'text-amber-400 bg-amber-900/40', price: 1000000 },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    active: { label: 'Hoạt động', color: 'text-emerald-400 bg-emerald-900/30 border border-emerald-800', icon: HiOutlineCheckCircle },
    expired: { label: 'Hết hạn', color: 'text-red-400 bg-red-900/30 border border-red-800', icon: HiOutlineXCircle },
    suspended: { label: 'Tạm khóa', color: 'text-orange-400 bg-orange-900/30 border border-orange-800', icon: HiOutlineExclamationCircle },
    trial: { label: 'Dùng thử', color: 'text-sky-400 bg-sky-900/30 border border-sky-800', icon: HiOutlineClock },
};

const fmtCurrency = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const isExpiringSoon = (d: string) => {
    const days = (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 30;
};

// ─── BADGE COMPONENT ──────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
            <Icon className="w-3.5 h-3.5" /> {cfg.label}
        </span>
    );
};

const PlanBadge = ({ plan }: { plan: string }) => {
    let key = plan.toUpperCase();
    if (key === 'FREE') key = 'NONE';
    if (key === 'PRO') key = 'BUSINESS';
    const p = PLANS.find(x => x.value === key) || PLANS[0];
    return <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-semibold ${p.color}`}>{p.label}</span>;
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, accent }: any) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
            {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
        </div>
    </div>
);

// ─── FORM MODAL ───────────────────────────────────────────────────────────────
const CustomerFormModal = ({ customer, onClose, onSave, planConfigs }: { customer?: Customer | null; onClose: () => void; onSave: (data: any) => void; planConfigs: any[] }) => {
    const isEdit = !!customer;
    const [form, setForm] = useState(() => {
        if (isEdit && customer) {
            let initialPlan = (customer.plan || 'STARTER').toUpperCase();
            if (initialPlan === 'FREE') initialPlan = 'NONE';
            if (initialPlan === 'PRO') initialPlan = 'BUSINESS';
            return {
                name: customer.name || '',
                subscriptionPlan: initialPlan,
                isActive: customer.isActive ?? true,
                maxUsers: customer.maxUsers ?? 5,
                maxProjects: customer.maxProjects ?? 1,
                maxQRCodes: customer.maxQRCodes ?? 100,
            };
        } else {
            const defaultPlan = planConfigs.find(p => p.planKey.toUpperCase() === 'STARTER');
            return {
                name: '',
                subscriptionPlan: 'STARTER',
                isActive: true,
                maxUsers: defaultPlan ? defaultPlan.maxUsers : 10,
                maxProjects: defaultPlan ? defaultPlan.maxProjects : 3,
                maxQRCodes: defaultPlan ? defaultPlan.maxQRCodes : 100,
            };
        }
    });
    const [saving, setSaving] = useState(false);

    const handlePlanChange = (selectedPlanKey: string) => {
        const plan = planConfigs.find(p => p.planKey.toUpperCase() === selectedPlanKey.toUpperCase());
        setForm(p => ({
            ...p,
            subscriptionPlan: selectedPlanKey,
            maxUsers: plan ? plan.maxUsers : p.maxUsers,
            maxProjects: plan ? plan.maxProjects : p.maxProjects,
            maxQRCodes: plan ? plan.maxQRCodes : p.maxQRCodes
        }));
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            Swal.fire({ icon: 'warning', title: 'Thiếu thông tin', text: 'Vui lòng nhập tên công ty', background: '#111827', color: '#f3f4f6' });
            return;
        }
        if (form.maxUsers === undefined || form.maxUsers === null || isNaN(form.maxUsers) || form.maxUsers <= 0) {
            Swal.fire({ icon: 'warning', title: 'Giá trị không hợp lệ', text: 'Vui lòng nhập số lượng người dùng tối đa (phải lớn hơn 0)', background: '#111827', color: '#f3f4f6' });
            return;
        }
        if (form.maxProjects === undefined || form.maxProjects === null || isNaN(form.maxProjects) || form.maxProjects < 0) {
            Swal.fire({ icon: 'warning', title: 'Giá trị không hợp lệ', text: 'Vui lòng nhập số lượng dự án tối đa (không được âm)', background: '#111827', color: '#f3f4f6' });
            return;
        }
        if (form.maxQRCodes === undefined || form.maxQRCodes === null || isNaN(form.maxQRCodes) || form.maxQRCodes < 0) {
            Swal.fire({ icon: 'warning', title: 'Giá trị không hợp lệ', text: 'Vui lòng nhập số lượng mã QR tối đa (không được âm)', background: '#111827', color: '#f3f4f6' });
            return;
        }
        setSaving(true);
        await onSave(form);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <div>
                        <h2 className="text-white font-bold text-lg">{isEdit ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}</h2>
                        <p className="text-gray-400 text-xs mt-0.5">{isEdit ? `ID: ${customer?.id}` : 'Điền thông tin bên dưới'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Tên công ty *</label>
                        <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            placeholder="Công ty TNHH ABC" className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500 placeholder-gray-600" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Gói dịch vụ *</label>
                        <select value={form.subscriptionPlan} onChange={e => handlePlanChange(e.target.value.toUpperCase())}
                            className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500">
                            {PLANS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Max Users *</label>
                            <input type="number" min={1} value={form.maxUsers} onChange={e => setForm(p => ({ ...p, maxUsers: Number(e.target.value) }))}
                                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Max Projects *</label>
                            <input type="number" min={0} value={form.maxProjects} onChange={e => setForm(p => ({ ...p, maxProjects: Number(e.target.value) }))}
                                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Max QR Codes *</label>
                            <input type="number" min={0} value={form.maxQRCodes} onChange={e => setForm(p => ({ ...p, maxQRCodes: Number(e.target.value) }))}
                                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                            className="w-4 h-4 rounded bg-gray-800 border-gray-600 text-purple-600 focus:ring-purple-500" />
                        <label htmlFor="isActive" className="text-sm text-gray-300">Kích hoạt tài khoản</label>
                    </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors">Hủy</button>
                    <button onClick={handleSubmit} disabled={saving}
                        className="px-5 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                        {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {isEdit ? 'Lưu thay đổi' : 'Tạo khách hàng'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── RENEW MODAL ──────────────────────────────────────────────────────────────
const RenewModal = ({ customer, onClose, onRenew }: { customer: Customer; onClose: () => void; onRenew: (plan: string, months: number, note: string) => void }) => {
    const [plan, setPlan] = useState(() => {
        let p = customer.plan.toUpperCase();
        if (p === 'FREE') p = 'NONE';
        if (p === 'PRO') p = 'BUSINESS';
        return p;
    });
    const [months, setMonths] = useState(1);
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    const planObj = PLANS.find(p => p.value === plan) || PLANS[1];
    const total = planObj.price * months;
    const baseDate = customer.subscriptionExpiresAt ? new Date(customer.subscriptionExpiresAt) : new Date();
    const newExpiry = new Date(Math.max(Date.now(), baseDate.getTime()));
    newExpiry.setMonth(newExpiry.getMonth() + months);

    const handleSubmit = async () => {
        setSaving(true);
        await onRenew(plan, months, note);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <div>
                        <h2 className="text-white font-bold text-lg">Gia hạn gói thủ công</h2>
                        <p className="text-gray-400 text-xs mt-0.5">{customer.name} · {customer.adminEmail || '—'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"><HiOutlineX className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Current state */}
                    <div className="bg-gray-800/60 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Gói hiện tại</p>
                            <PlanBadge plan={customer.plan} />
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 mb-1">Hết hạn</p>
                            <p className="text-sm text-white font-medium">{fmtDate(customer.subscriptionExpiresAt || '')}</p>
                        </div>
                    </div>

                    {/* Plan selector */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Chọn gói gia hạn</label>
                        <div className="grid grid-cols-2 gap-2">
                            {PLANS.filter(p => p.value !== 'NONE').map(p => (
                                <button key={p.value} onClick={() => setPlan(p.value)}
                                    className={`p-3 rounded-xl border text-left transition-all ${plan === p.value ? 'border-purple-500 bg-purple-900/30' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'}`}>
                                    <div className={`text-sm font-semibold ${plan === p.value ? 'text-purple-300' : 'text-gray-300'}`}>{p.label}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{fmtCurrency(p.price)}/tháng</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Months */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Số tháng gia hạn</label>
                        <div className="flex items-center gap-3">
                            {[1, 3, 6, 12].map(m => (
                                <button key={m} onClick={() => setMonths(m)}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${months === m ? 'bg-purple-600 border-purple-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'}`}>
                                    {m}T
                                </button>
                            ))}
                        </div>
                        <input type="number" min={1} max={60} value={months} onChange={e => setMonths(Number(e.target.value))}
                            className="mt-2 w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500" placeholder="Hoặc nhập số tháng tùy ý..." />
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Ghi chú (tuỳ chọn)</label>
                        <input type="text" value={note} onChange={e => setNote(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500 placeholder-gray-600"
                            placeholder="VD: Gia hạn theo hợp đồng số..." />
                    </div>

                    {/* Summary */}
                    <div className="bg-purple-900/20 border border-purple-800/40 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Gói mới</span>
                            <PlanBadge plan={plan} />
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Thời gian</span>
                            <span className="text-white">{months} tháng</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Hết hạn mới</span>
                            <span className="text-emerald-400 font-medium">{newExpiry.toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="border-t border-gray-700 pt-2 flex justify-between text-sm font-semibold">
                            <span className="text-gray-300">Tổng tiền</span>
                            <span className="text-purple-300 text-base">{fmtCurrency(total)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors">Hủy</button>
                    <button onClick={handleSubmit} disabled={saving}
                        className="px-5 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                        {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Xác nhận gia hạn
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── DETAIL DRAWER ────────────────────────────────────────────────────────────
const DetailDrawer = ({ customer, onClose, onEdit, onRenew }: { customer: Customer; onClose: () => void; onEdit: () => void; onRenew: () => void }) => {
    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative w-full max-w-md bg-gray-900 border-l border-gray-800 flex flex-col h-full shadow-2xl overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {customer.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">{customer.name}</h3>
                            <p className="text-gray-400 text-sm">{customer.adminEmail || '—'}</p>
                            <div className="flex gap-2 mt-1.5">
                                <StatusBadge status={customer.status} />
                                <PlanBadge plan={customer.plan} />
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"><HiOutlineX className="w-5 h-5" /></button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 px-6 py-4 border-b border-gray-800">
                    <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors">
                        <HiOutlinePencil className="w-4 h-4" /> Chỉnh sửa
                    </button>
                    <button onClick={onRenew} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                        <HiOutlineRefresh className="w-4 h-4" /> Gia hạn
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-gray-800">
                    <div className="bg-gray-800/60 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-white">{customer.renewalCount}</div>
                        <div className="text-xs text-gray-400 mt-0.5">Lần gia hạn</div>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-emerald-400">{(customer.totalSpent / 1000000).toFixed(1)}M</div>
                        <div className="text-xs text-gray-400 mt-0.5">Tổng chi tiêu</div>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl p-3 text-center">
                        <div className={`text-lg font-bold ${customer.subscriptionExpiresAt && isExpiringSoon(customer.subscriptionExpiresAt) ? 'text-orange-400' : 'text-white'}`}>
                            {customer.subscriptionExpiresAt ? Math.max(0, Math.floor((new Date(customer.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : '—'}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">Ngày còn lại</div>
                    </div>
                </div>

                {/* Info */}
                <div className="px-6 py-4 space-y-3 border-b border-gray-800">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Thông tin</h4>
                    {[
                        { icon: HiOutlineMail, label: 'Email', val: customer.adminEmail || '—' },
                        { icon: HiOutlineUser, label: 'Admin', val: customer.adminName || '—' },
                        { icon: HiOutlineOfficeBuilding, label: 'Users', val: `${customer.userCount} / ${customer.maxUsers}` },
                        { icon: HiOutlineCalendar, label: 'Ngày tạo', val: fmtDate(customer.createdAt) },
                        { icon: HiOutlineCalendar, label: 'Hết hạn', val: fmtDate(customer.subscriptionExpiresAt || '') },
                    ].map(({ icon: Icon, label, val }) => (
                        <div key={label} className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
                            <span className="text-sm text-gray-300 truncate">{val}</span>
                        </div>
                    ))}
                </div>

                {/* Renewal history */}
                <div className="px-6 py-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Lịch sử gia hạn</h4>
                    {(customer.subscriptions || []).length === 0 ? (
                        <p className="text-gray-600 text-sm text-center py-6">Chưa có lịch sử gia hạn</p>
                    ) : (
                        <div className="space-y-2">
                            {customer.subscriptions.map(r => (
                                <div key={r.id} className="bg-gray-800/50 rounded-xl p-3 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <PlanBadge plan={r.plan} />
                                            <span className="text-xs text-gray-500">{r.paymentMethod || 'N/A'}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">{fmtDate(r.startDate)} → {fmtDate(r.endDate)}</div>
                                    </div>
                                    <div className="text-sm font-semibold text-emerald-400">{fmtCurrency(Number(r.price))}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const SuperAdminCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [planConfigs, setPlanConfigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterPlan, setFilterPlan] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    const [modal, setModal] = useState<'create' | 'edit' | 'renew' | null>(null);
    const [selected, setSelected] = useState<Customer | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [customersData, plansData] = await Promise.all([
                api.getCustomers(),
                api.getPlanConfigs()
            ]);
            setCustomers(customersData);
            setPlanConfigs(plansData);
        } catch (err) {
            console.error('Failed to load customers:', err);
            Swal.fire({ icon: 'error', title: 'Lỗi tải dữ liệu', text: 'Không thể lấy danh sách khách hàng. Vui lòng thử lại.', background: '#111827', color: '#f3f4f6' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Stats
    const totalRevenue = customers.reduce((s, c) => s + (c.totalSpent || 0), 0);
    const activeCount = customers.filter(c => c.status === 'active').length;
    const expiringCount = customers.filter(c => c.subscriptionExpiresAt && isExpiringSoon(c.subscriptionExpiresAt)).length;

    // Filter
    const filtered = customers.filter(c => {
        const q = search.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchEmail = (c.adminEmail || '').toLowerCase().includes(q);
        const matchAdmin = (c.adminName || '').toLowerCase().includes(q);
        const matchSearch = !q || matchName || matchEmail || matchAdmin;
        
        const cPlan = c.plan.toUpperCase() === 'PRO' ? 'BUSINESS' : (c.plan.toUpperCase() === 'FREE' ? 'NONE' : c.plan.toUpperCase());
        const matchPlan = !filterPlan || cPlan === filterPlan.toUpperCase();
        
        const matchStatus = !filterStatus || c.status === filterStatus;
        return matchSearch && matchPlan && matchStatus;
    });

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    // Handlers
    const handleCreate = async (data: any) => {
        await api.createCustomer(data);
        await load();
        setModal(null);
        Swal.fire({ icon: 'success', title: 'Tạo thành công!', timer: 1500, showConfirmButton: false, background: '#111827', color: '#f3f4f6' });
    };

    const handleUpdate = async (data: any) => {
        if (!selected) return;
        await api.updateCustomer(selected.id, data);
        await load();
        setModal(null);
        setDetailOpen(false);
        Swal.fire({ icon: 'success', title: 'Cập nhật thành công!', timer: 1500, showConfirmButton: false, background: '#111827', color: '#f3f4f6' });
    };

    const handleDelete = (customer: Customer) => {
        Swal.fire({
            title: 'Xóa khách hàng?', html: `Khách hàng <strong>${customer.name}</strong> sẽ bị xóa vĩnh viễn.`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626',
            confirmButtonText: 'Xóa', cancelButtonText: 'Hủy', background: '#111827', color: '#f3f4f6',
        }).then(async r => {
            if (r.isConfirmed) {
                await api.deleteCustomer(customer.id);
                setCustomers(p => p.filter(c => c.id !== customer.id));
                if (detailOpen && selected?.id === customer.id) setDetailOpen(false);
                Swal.fire({ icon: 'success', title: 'Đã xóa!', timer: 1200, showConfirmButton: false, background: '#111827', color: '#f3f4f6' });
            }
        });
    };

    const handleRenew = async (plan: string, months: number, note: string) => {
        if (!selected) return;
        try {
            const result = await api.renewPlan(selected.id, plan.toUpperCase(), months, note);
            await load();
            setModal(null);
            const expiryDate = result.newExpiry ? new Date(result.newExpiry).toLocaleDateString('vi-VN') : '';
            Swal.fire({ icon: 'success', title: 'Gia hạn thành công!', html: `Hết hạn mới: <strong>${expiryDate}</strong>`, background: '#111827', color: '#f3f4f6' });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể gia hạn. Vui lòng thử lại.', background: '#111827', color: '#f3f4f6' });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Quản lý khách hàng</h1>
                    <p className="text-gray-400 text-sm mt-1">{customers.length} khách hàng trong hệ thống</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={load} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 border border-gray-700 hover:border-gray-600 hover:text-white rounded-lg transition-colors">
                        <HiOutlineRefresh className="w-4 h-4" /> Làm mới
                    </button>
                    <button onClick={() => { setSelected(null); setModal('create'); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                        <HiOutlinePlus className="w-4 h-4" /> Thêm khách hàng
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng khách hàng" value={customers.length} icon={HiOutlineUser} accent="bg-blue-900/40 text-blue-400" />
                <StatCard label="Đang hoạt động" value={activeCount} sub={`${customers.length ? Math.round(activeCount / customers.length * 100) : 0}% tổng số`} icon={HiOutlineCheckCircle} accent="bg-emerald-900/40 text-emerald-400" />
                <StatCard label="Sắp hết hạn (30 ngày)" value={expiringCount} icon={HiOutlineClock} accent="bg-orange-900/40 text-orange-400" />
                <StatCard label="Tổng doanh thu" value={`${(totalRevenue / 1000000).toFixed(0)}M ₫`} icon={HiOutlineCurrencyDollar} accent="bg-purple-900/40 text-purple-400" />
            </div>

            {/* Filters */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Tìm kiếm theo tên, email, SĐT, công ty..."
                        className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-purple-500 placeholder-gray-500" />
                </div>
                <select value={filterPlan} onChange={e => { setFilterPlan(e.target.value); setPage(1); }}
                    className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500">
                    <option value="">Tất cả gói</option>
                    {PLANS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                    className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500">
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="text-left px-5 py-3.5">Khách hàng</th>
                                <th className="text-left px-4 py-3.5">Thống kê</th>
                                <th className="text-left px-4 py-3.5">Gói</th>
                                <th className="text-left px-4 py-3.5">Giới hạn (User/DA/QR)</th>
                                <th className="text-left px-4 py-3.5">Trạng thái</th>
                                <th className="text-left px-4 py-3.5">Ngày tạo</th>
                                <th className="text-left px-4 py-3.5">Hết hạn</th>
                                <th className="text-right px-4 py-3.5">Chi tiêu</th>
                                <th className="text-right px-4 py-3.5">Gia hạn</th>
                                <th className="text-center px-4 py-3.5">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-gray-800/50">
                                        {Array.from({ length: 10 }).map((_, j) => (
                                            <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={10} className="text-center py-16 text-gray-600">Không tìm thấy khách hàng nào</td></tr>
                            ) : paginated.map(c => (
                                <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-800/60 flex items-center justify-center text-purple-300 font-semibold text-sm flex-shrink-0">
                                                {c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">{c.name}</div>
                                                <div className="text-gray-500 text-xs">{c.adminEmail || '—'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-gray-400 text-xs">{c.userCount} users / {c.projectCount} projects</td>
                                    <td className="px-4 py-4"><PlanBadge plan={c.plan} /></td>
                                    <td className="px-4 py-4 text-xs font-medium text-gray-300">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500">👥 User:</span>
                                                <span>{c.maxUsers}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500">📁 Dự án:</span>
                                                <span>{c.maxProjects}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500">🔲 QR:</span>
                                                <span>{c.maxQRCodes}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4"><StatusBadge status={c.status} /></td>
                                    <td className="px-4 py-4 text-xs text-gray-400">{fmtDate(c.createdAt)}</td>
                                    <td className="px-4 py-4">
                                        <div className={`text-sm ${c.subscriptionExpiresAt && isExpiringSoon(c.subscriptionExpiresAt) ? 'text-orange-400 font-medium' : 'text-gray-400'}`}>
                                            {fmtDate(c.subscriptionExpiresAt || '')}
                                        </div>
                                        {c.subscriptionExpiresAt && isExpiringSoon(c.subscriptionExpiresAt) && <div className="text-xs text-orange-500">Sắp hết hạn</div>}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="text-white font-medium text-sm">{((c.totalSpent || 0) / 1000000).toFixed(1)}M ₫</div>
                                        <div className="text-gray-500 text-xs">{c.renewalCount} lần</div>
                                    </td>
                                    <td className="px-4 py-4 text-right text-gray-400 text-xs">{c.renewalCount} lần</td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setSelected(c); setDetailOpen(true); }}
                                                title="Xem chi tiết" className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                                                <HiOutlineEye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => { setSelected(c); setModal('edit'); }}
                                                title="Chỉnh sửa" className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                                                <HiOutlinePencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => { setSelected(c); setModal('renew'); }}
                                                title="Gia hạn gói" className="p-1.5 rounded-lg hover:bg-purple-700 text-gray-400 hover:text-purple-300 transition-colors">
                                                <HiOutlineRefresh className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(c)}
                                                title="Xóa" className="p-1.5 rounded-lg hover:bg-red-900/50 text-gray-400 hover:text-red-400 transition-colors">
                                                <HiOutlineTrash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-800">
                        <span className="text-xs text-gray-500">
                            Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} khách hàng
                        </span>
                        <div className="flex gap-1">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors">
                                <HiOutlineChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                <button key={n} onClick={() => setPage(n)}
                                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${n === page ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                                    {n}
                                </button>
                            ))}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors">
                                <HiOutlineChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {modal === 'create' && <CustomerFormModal planConfigs={planConfigs} onClose={() => setModal(null)} onSave={handleCreate} />}
            {modal === 'edit' && selected && <CustomerFormModal customer={selected} planConfigs={planConfigs} onClose={() => setModal(null)} onSave={handleUpdate} />}
            {modal === 'renew' && selected && <RenewModal customer={selected} onClose={() => setModal(null)} onRenew={handleRenew} />}
            {detailOpen && selected && (
                <DetailDrawer
                    customer={customers.find(c => c.id === selected.id) || selected}
                    onClose={() => setDetailOpen(false)}
                    onEdit={() => { setModal('edit'); setDetailOpen(false); }}
                    onRenew={() => setModal('renew')}
                />
            )}
        </div>
    );
};

export default SuperAdminCustomers;
