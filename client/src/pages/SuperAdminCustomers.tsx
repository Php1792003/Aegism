import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import {
    HiOutlineSearch, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash,
    HiOutlineRefresh, HiOutlineEye, HiOutlineFilter, HiOutlineDownload,
    HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock,
    HiOutlineCurrencyDollar, HiOutlineCalendar, HiOutlineUser,
    HiOutlineOfficeBuilding, HiOutlineMail, HiOutlinePhone,
    HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineX,
    HiOutlineBadgeCheck, HiOutlineExclamationCircle
} from 'react-icons/hi';

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface RenewalHistory {
    id: string;
    date: string;
    plan: string;
    months: number;
    amount: number;
    note?: string;
}

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    company?: string;
    tenantId?: string;
    tenantName?: string;
    plan: 'free' | 'starter' | 'pro' | 'enterprise';
    status: 'active' | 'expired' | 'suspended' | 'trial';
    createdAt: string;
    expiredAt: string;
    totalSpent: number;
    renewalCount: number;
    renewalHistory: RenewalHistory[];
    avatar?: string;
    address?: string;
    taxCode?: string;
}

// ─── MOCK API ─────────────────────────────────────────────────────────────────
// Replace BASE_URL with your actual API endpoint
const BASE_URL = '/api/v1';

const api = {
    getCustomers: async (params?: Record<string, any>): Promise<{ data: Customer[]; total: number }> => {
        // const res = await fetch(`${BASE_URL}/customers?` + new URLSearchParams(params));
        // return res.json();

        // MOCK DATA — remove when API is ready
        await new Promise(r => setTimeout(r, 600));
        return { data: MOCK_CUSTOMERS, total: MOCK_CUSTOMERS.length };
    },
    createCustomer: async (payload: Partial<Customer>): Promise<Customer> => {
        // const res = await fetch(`${BASE_URL}/customers`, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
        // return res.json();
        await new Promise(r => setTimeout(r, 500));
        return { ...payload, id: Date.now().toString(), createdAt: new Date().toISOString(), expiredAt: new Date().toISOString(), totalSpent: 0, renewalCount: 0, renewalHistory: [] } as Customer;
    },
    updateCustomer: async (id: string, payload: Partial<Customer>): Promise<Customer> => {
        // const res = await fetch(`${BASE_URL}/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
        // return res.json();
        await new Promise(r => setTimeout(r, 500));
        return { id, ...payload } as Customer;
    },
    deleteCustomer: async (id: string): Promise<void> => {
        // await fetch(`${BASE_URL}/customers/${id}`, { method: 'DELETE' });
        await new Promise(r => setTimeout(r, 400));
    },
    renewPlan: async (id: string, plan: string, months: number): Promise<Customer> => {
        // const res = await fetch(`${BASE_URL}/customers/${id}/renew`, { method: 'POST', body: JSON.stringify({ plan, months }), headers: { 'Content-Type': 'application/json' } });
        // return res.json();
        await new Promise(r => setTimeout(r, 600));
        return {} as Customer;
    },
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_CUSTOMERS: Customer[] = [
    {
        id: '1', name: 'Nguyễn Văn An', email: 'an.nguyen@company.vn', phone: '0901234567',
        company: 'Công ty TNHH ABC', tenantId: 'tenant-001', tenantName: 'abc-corp',
        plan: 'enterprise', status: 'active',
        createdAt: '2023-01-15T08:00:00Z', expiredAt: '2025-01-15T08:00:00Z',
        totalSpent: 48000000, renewalCount: 4,
        renewalHistory: [
            { id: 'r1', date: '2024-01-15', plan: 'enterprise', months: 12, amount: 12000000, note: 'Gia hạn năm 2024' },
            { id: 'r2', date: '2023-01-15', plan: 'pro', months: 6, amount: 3000000 },
        ],
        address: '123 Nguyễn Huệ, Q1, TP.HCM', taxCode: '0123456789',
    },
    {
        id: '2', name: 'Trần Thị Bích', email: 'bich.tran@startup.io', phone: '0912345678',
        company: 'Startup XYZ', tenantId: 'tenant-002', tenantName: 'xyz-startup',
        plan: 'pro', status: 'active',
        createdAt: '2023-06-01T09:00:00Z', expiredAt: '2024-12-01T09:00:00Z',
        totalSpent: 15000000, renewalCount: 2,
        renewalHistory: [
            { id: 'r3', date: '2024-06-01', plan: 'pro', months: 6, amount: 7500000 },
        ],
        address: '45 Lê Lợi, Hải Phòng', taxCode: '0987654321',
    },
    {
        id: '3', name: 'Lê Minh Cường', email: 'cuong.le@freelance.com', phone: '0923456789',
        company: undefined, tenantId: 'tenant-003', tenantName: 'cuong-dev',
        plan: 'starter', status: 'trial',
        createdAt: '2024-10-20T10:00:00Z', expiredAt: '2024-11-20T10:00:00Z',
        totalSpent: 0, renewalCount: 0, renewalHistory: [],
    },
    {
        id: '4', name: 'Phạm Thu Hương', email: 'huong.pham@bigcorp.vn', phone: '0934567890',
        company: 'Tập đoàn Big Corp', tenantId: 'tenant-004', tenantName: 'big-corp',
        plan: 'enterprise', status: 'expired',
        createdAt: '2022-03-10T08:00:00Z', expiredAt: '2024-03-10T08:00:00Z',
        totalSpent: 72000000, renewalCount: 6,
        renewalHistory: [
            { id: 'r4', date: '2023-03-10', plan: 'enterprise', months: 12, amount: 12000000 },
            { id: 'r5', date: '2022-03-10', plan: 'enterprise', months: 12, amount: 12000000 },
        ],
        address: '789 Trần Phú, Đà Nẵng', taxCode: '0111222333',
    },
    {
        id: '5', name: 'Võ Đình Khải', email: 'khai.vo@sme.vn', phone: '0945678901',
        company: 'Doanh nghiệp SME', tenantId: 'tenant-005', tenantName: 'sme-viet',
        plan: 'pro', status: 'suspended',
        createdAt: '2023-09-01T08:00:00Z', expiredAt: '2024-09-01T08:00:00Z',
        totalSpent: 9000000, renewalCount: 1, renewalHistory: [],
    },
    {
        id: '6', name: 'Đỗ Hải Nam', email: 'nam.do@techco.vn', phone: '0956789012',
        company: 'TechCo Vietnam', tenantId: 'tenant-006', tenantName: 'techco-vn',
        plan: 'starter', status: 'active',
        createdAt: '2024-05-15T08:00:00Z', expiredAt: '2025-05-15T08:00:00Z',
        totalSpent: 2400000, renewalCount: 1,
        renewalHistory: [{ id: 'r6', date: '2024-05-15', plan: 'starter', months: 12, amount: 2400000 }],
    },
];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PLANS = [
    { value: 'free', label: 'Free', color: 'text-gray-400 bg-gray-800', price: 0 },
    { value: 'starter', label: 'Starter', color: 'text-blue-400 bg-blue-900/40', price: 200000 },
    { value: 'pro', label: 'Pro', color: 'text-purple-400 bg-purple-900/40', price: 500000 },
    { value: 'enterprise', label: 'Enterprise', color: 'text-amber-400 bg-amber-900/40', price: 1000000 },
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
    const p = PLANS.find(x => x.value === plan) || PLANS[0];
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
const CustomerFormModal = ({ customer, onClose, onSave }: { customer?: Customer | null; onClose: () => void; onSave: (data: any) => void }) => {
    const isEdit = !!customer;
    const [form, setForm] = useState({
        name: customer?.name || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        company: customer?.company || '',
        address: customer?.address || '',
        taxCode: customer?.taxCode || '',
        plan: customer?.plan || 'free',
        status: customer?.status || 'trial',
        tenantName: customer?.tenantName || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!form.name || !form.email) {
            Swal.fire({ icon: 'warning', title: 'Thiếu thông tin', text: 'Vui lòng nhập tên và email', background: '#111827', color: '#f3f4f6' });
            return;
        }
        setSaving(true);
        await onSave(form);
        setSaving(false);
    };

    const field = (label: string, key: string, type = 'text', placeholder = '') => (
        <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
            <input
                type={type}
                value={(form as any)[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500 placeholder-gray-600 transition-colors"
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <div>
                        <h2 className="text-white font-bold text-lg">{isEdit ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}</h2>
                        <p className="text-gray-400 text-xs mt-0.5">{isEdit ? `ID: ${customer?.id}` : 'Điền thông tin khách hàng bên dưới'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {field('Họ và tên *', 'name', 'text', 'Nguyễn Văn A')}
                        {field('Email *', 'email', 'email', 'email@example.com')}
                        {field('Số điện thoại', 'phone', 'tel', '09xxxxxxxx')}
                        {field('Tên công ty', 'company', 'text', 'Công ty TNHH...')}
                        {field('Subdomain / Tenant', 'tenantName', 'text', 'ten-cong-ty')}
                        {field('Mã số thuế', 'taxCode', 'text', '0123456789')}
                    </div>
                    {field('Địa chỉ', 'address', 'text', '123 Đường ABC, Quận 1, TP.HCM')}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Gói dịch vụ</label>
                            <select value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value as any }))}
                                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500">
                                {PLANS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Trạng thái</label>
                            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}
                                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500">
                                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors">
                        Hủy
                    </button>
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
    const [plan, setPlan] = useState(customer.plan);
    const [months, setMonths] = useState(1);
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    const planObj = PLANS.find(p => p.value === plan)!;
    const total = planObj.price * months;
    const newExpiry = new Date(Math.max(Date.now(), new Date(customer.expiredAt).getTime()));
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
                        <p className="text-gray-400 text-xs mt-0.5">{customer.name} · {customer.email}</p>
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
                            <p className="text-sm text-white font-medium">{fmtDate(customer.expiredAt)}</p>
                        </div>
                    </div>

                    {/* Plan selector */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Chọn gói gia hạn</label>
                        <div className="grid grid-cols-2 gap-2">
                            {PLANS.filter(p => p.value !== 'free').map(p => (
                                <button key={p.value} onClick={() => setPlan(p.value as any)}
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
                            <p className="text-gray-400 text-sm">{customer.email}</p>
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
                        <div className={`text-lg font-bold ${isExpiringSoon(customer.expiredAt) ? 'text-orange-400' : 'text-white'}`}>
                            {Math.max(0, Math.floor((new Date(customer.expiredAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">Ngày còn lại</div>
                    </div>
                </div>

                {/* Info */}
                <div className="px-6 py-4 space-y-3 border-b border-gray-800">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Thông tin</h4>
                    {[
                        { icon: HiOutlinePhone, label: 'Điện thoại', val: customer.phone },
                        { icon: HiOutlineOfficeBuilding, label: 'Công ty', val: customer.company || '—' },
                        { icon: HiOutlineUser, label: 'Tenant', val: customer.tenantName || '—' },
                        { icon: HiOutlineCalendar, label: 'Ngày tạo', val: fmtDate(customer.createdAt) },
                        { icon: HiOutlineCalendar, label: 'Hết hạn', val: fmtDate(customer.expiredAt) },
                    ].map(({ icon: Icon, label, val }) => (
                        <div key={label} className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
                            <span className="text-sm text-gray-300 truncate">{val}</span>
                        </div>
                    ))}
                    {customer.address && (
                        <div className="flex items-start gap-3">
                            <HiOutlineMail className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-gray-500 w-20 flex-shrink-0">Địa chỉ</span>
                            <span className="text-sm text-gray-300">{customer.address}</span>
                        </div>
                    )}
                    {customer.taxCode && (
                        <div className="flex items-center gap-3">
                            <HiOutlineBadgeCheck className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="text-xs text-gray-500 w-20 flex-shrink-0">MST</span>
                            <span className="text-sm text-gray-300">{customer.taxCode}</span>
                        </div>
                    )}
                </div>

                {/* Renewal history */}
                <div className="px-6 py-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Lịch sử gia hạn</h4>
                    {customer.renewalHistory.length === 0 ? (
                        <p className="text-gray-600 text-sm text-center py-6">Chưa có lịch sử gia hạn</p>
                    ) : (
                        <div className="space-y-2">
                            {customer.renewalHistory.map(r => (
                                <div key={r.id} className="bg-gray-800/50 rounded-xl p-3 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <PlanBadge plan={r.plan} />
                                            <span className="text-xs text-gray-500">{r.months} tháng</span>
                                        </div>
                                        <div className="text-xs text-gray-500">{fmtDate(r.date)}</div>
                                        {r.note && <div className="text-xs text-gray-500 italic mt-0.5">{r.note}</div>}
                                    </div>
                                    <div className="text-sm font-semibold text-emerald-400">{fmtCurrency(r.amount)}</div>
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
            const res = await api.getCustomers();
            setCustomers(res.data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Stats
    const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
    const activeCount = customers.filter(c => c.status === 'active').length;
    const expiringCount = customers.filter(c => isExpiringSoon(c.expiredAt)).length;

    // Filter
    const filtered = customers.filter(c => {
        const q = search.toLowerCase();
        const matchSearch = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.company || '').toLowerCase().includes(q);
        return matchSearch && (!filterPlan || c.plan === filterPlan) && (!filterStatus || c.status === filterStatus);
    });

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    // Handlers
    const handleCreate = async (data: any) => {
        const created = await api.createCustomer(data);
        setCustomers(p => [created, ...p]);
        setModal(null);
        Swal.fire({ icon: 'success', title: 'Tạo thành công!', timer: 1500, showConfirmButton: false, background: '#111827', color: '#f3f4f6' });
    };

    const handleUpdate = async (data: any) => {
        if (!selected) return;
        await api.updateCustomer(selected.id, data);
        setCustomers(p => p.map(c => c.id === selected.id ? { ...c, ...data } : c));
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
        await api.renewPlan(selected.id, plan, months);
        const newExpiry = new Date(Math.max(Date.now(), new Date(selected.expiredAt).getTime()));
        newExpiry.setMonth(newExpiry.getMonth() + months);
        const planPrice = PLANS.find(p => p.value === plan)?.price || 0;
        const amount = planPrice * months;
        const newHistory: RenewalHistory = { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], plan, months, amount, note: note || undefined };
        setCustomers(prev => prev.map(c => c.id === selected.id ? {
            ...c, plan: plan as any, status: 'active', expiredAt: newExpiry.toISOString(),
            totalSpent: c.totalSpent + amount, renewalCount: c.renewalCount + 1,
            renewalHistory: [newHistory, ...c.renewalHistory],
        } : c));
        setSelected(prev => prev ? { ...prev, plan: plan as any, status: 'active', expiredAt: newExpiry.toISOString() } : null);
        setModal(null);
        Swal.fire({ icon: 'success', title: 'Gia hạn thành công!', html: `Hết hạn mới: <strong>${newExpiry.toLocaleDateString('vi-VN')}</strong>`, background: '#111827', color: '#f3f4f6' });
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
                                <th className="text-left px-4 py-3.5">Tenant</th>
                                <th className="text-left px-4 py-3.5">Gói</th>
                                <th className="text-left px-4 py-3.5">Trạng thái</th>
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
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-16 text-gray-600">Không tìm thấy khách hàng nào</td></tr>
                            ) : paginated.map(c => (
                                <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-800/60 flex items-center justify-center text-purple-300 font-semibold text-sm flex-shrink-0">
                                                {c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">{c.name}</div>
                                                <div className="text-gray-500 text-xs">{c.email}</div>
                                                {c.phone && <div className="text-gray-600 text-xs">{c.phone}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-gray-400 text-xs">{c.tenantName || '—'}</td>
                                    <td className="px-4 py-4"><PlanBadge plan={c.plan} /></td>
                                    <td className="px-4 py-4"><StatusBadge status={c.status} /></td>
                                    <td className="px-4 py-4">
                                        <div className={`text-sm ${isExpiringSoon(c.expiredAt) ? 'text-orange-400 font-medium' : 'text-gray-400'}`}>
                                            {fmtDate(c.expiredAt)}
                                        </div>
                                        {isExpiringSoon(c.expiredAt) && <div className="text-xs text-orange-500">Sắp hết hạn</div>}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="text-white font-medium text-sm">{(c.totalSpent / 1000000).toFixed(1)}M ₫</div>
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
            {modal === 'create' && <CustomerFormModal onClose={() => setModal(null)} onSave={handleCreate} />}
            {modal === 'edit' && selected && <CustomerFormModal customer={selected} onClose={() => setModal(null)} onSave={handleUpdate} />}
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
