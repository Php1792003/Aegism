import { useState, useEffect, useMemo, useRef } from 'react';
import Swal from 'sweetalert2';
import { getAvatar } from '../utils/helpers';
import {
    HiOutlineSearch, HiOutlinePencil, HiOutlineRefresh,
    HiOutlineLockClosed, HiOutlineLockOpen, HiOutlineUsers,
    HiOutlineShieldCheck, HiOutlineX, HiOutlineClipboardCopy,
    HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineEye,
    HiOutlineUserCircle, HiOutlineBan, HiOutlineCheckCircle,
    HiOutlinePlus, HiOutlineCamera,
} from 'react-icons/hi';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' : 'https://api.aegism.online';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
});

const Toast = Swal.mixin({
    toast: true, position: 'top-end', showConfirmButton: false,
    timer: 3000, timerProgressBar: true,
});

const PAGE_SIZE = 10;

// ─── API ─────────────────────────────────────────────────────────────────────
const api = {
    getUsers: async () => {
        const res = await fetch(`${apiUrl}/api/master-admin/users`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed');
        return res.json();
    },
    createUser: async (data: any) => {
        const res = await fetch(`${apiUrl}/api/master-admin/users`, {
            method: 'POST', headers: getHeaders(), body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create user');
        return res.json();
    },
    getTenants: async () => {
        const res = await fetch(`${apiUrl}/api/master-admin/tenants`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch tenants');
        return res.json();
    },
    updateStatus: async (id: string, status: string) => {
        const res = await fetch(`${apiUrl}/api/master-admin/users/${id}/status`, {
            method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Failed');
        return res.json();
    },
    updateUser: async (id: string, data: any) => {
        const res = await fetch(`${apiUrl}/api/master-admin/users/${id}`, {
            method: 'PUT', headers: getHeaders(), body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed');
        return res.json();
    },
    impersonate: async (id: string) => {
        const res = await fetch(`${apiUrl}/api/master-admin/impersonate/${id}`, {
            method: 'POST', headers: getHeaders(),
        });
        if (!res.ok) throw new Error('Failed');
        return res.json();
    },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const getRoleBadge = (u: any) => {
    if (u.isSuperAdmin) return { label: 'Super Admin', cls: 'bg-purple-500/10 text-purple-400 border border-purple-500/30' };
    if (u.isTenantAdmin) return { label: 'Admin', cls: 'bg-blue-500/10 text-blue-400 border border-blue-500/30' };
    return { label: u.role?.name || 'User', cls: 'bg-gray-700/50 text-gray-400 border border-gray-600/30' };
};

const getStatusBadge = (status: string) =>
    status === 'active'
        ? { label: 'Hoạt động', cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30', dot: 'bg-emerald-400' }
        : { label: 'Đã khóa', cls: 'bg-red-500/10 text-red-400 border border-red-500/30', dot: 'bg-red-400' };

// ─── STAT CARD ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, accent }: any) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        </div>
    </div>
);

// ─── SKELETON ────────────────────────────────────────────────────────────────
const SkeletonRow = () => (
    <tr className="border-b border-gray-800/50">
        {Array.from({ length: 7 }).map((_, i) => (
            <td key={i} className="px-5 py-4">
                <div className="h-4 bg-gray-800 rounded animate-pulse" />
            </td>
        ))}
    </tr>
);

// ─── EDIT MODAL ──────────────────────────────────────────────────────────────
const EditModal = ({ user, onClose, onSave }: { user: any; onClose: () => void; onSave: (id: string, data: any) => Promise<void> }) => {
    const [form, setForm] = useState({
        fullName: user.fullName || '',
        email: user.email || '',
        password: '',
        avatar: user.avatar ? getAvatar(user) : '',
    });
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return Swal.fire('Lỗi', 'Ảnh quá lớn (>2MB)', 'warning');
        const reader = new FileReader();
        reader.onload = (ev: any) => setForm(p => ({ ...p, avatar: ev.target.result }));
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const r = await Swal.fire({
            title: 'Xác nhận cập nhật', text: `Lưu thay đổi cho tài khoản ${user.email}?`,
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#7c3aed', cancelButtonColor: '#374151',
            confirmButtonText: 'Lưu', cancelButtonText: 'Hủy',
        });
        if (!r.isConfirmed) return;
        setLoading(true);
        const payload: any = { fullName: form.fullName, email: form.email };
        if (form.password) payload.password = form.password;
        if (form.avatar) payload.avatar = form.avatar;
        await onSave(user.id, payload);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-gray-900 border border-gray-700/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
                    <div>
                        <h3 className="text-base font-semibold text-white">Chỉnh sửa tài khoản</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                        <HiOutlineX className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                    {/* Avatar pick container */}
                    <div className="flex flex-col items-center gap-2 mb-2">
                        <label className="block text-xs font-medium text-gray-400">Ảnh đại diện</label>
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-700 bg-gray-800 cursor-pointer group flex items-center justify-center"
                            onClick={() => fileInputRef.current?.click()}>
                            {form.avatar ? (
                                <img src={form.avatar} className="w-full h-full object-cover" alt="avatar" />
                            ) : (
                                <HiOutlineUserCircle className="w-10 h-10 text-gray-500" />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <HiOutlineCamera className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                        <span className="text-[10px] text-gray-500">Kích thước ảnh nhỏ hơn 2MB</span>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Tên đầy đủ *</label>
                        <input type="text" required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Email *</label>
                        <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Mật khẩu mới (để trống nếu không đổi)</label>
                        <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors" placeholder="Nhập mật khẩu mới..." />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Hủy</button>
                        <button type="submit" disabled={loading}
                            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── ADD MODAL ───────────────────────────────────────────────────────────────
const AddModal = ({ tenants, onClose, onSave }: { tenants: any[]; onClose: () => void; onSave: (data: any) => Promise<void> }) => {
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        tenantId: tenants[0]?.id || '',
        status: 'active',
        isSuperAdmin: false,
        isTenantAdmin: false,
        avatar: '',
    });
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return Swal.fire('Lỗi', 'Ảnh quá lớn (>2MB)', 'warning');
        const reader = new FileReader();
        reader.onload = (ev: any) => setForm(p => ({ ...p, avatar: ev.target.result }));
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.fullName || !form.email || !form.password || !form.tenantId) {
            Swal.fire('Lỗi', 'Vui lòng điền đầy đủ các thông tin bắt buộc', 'warning');
            return;
        }
        setLoading(true);
        await onSave(form);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-gray-900 border border-gray-700/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
                    <div>
                        <h3 className="text-base font-semibold text-white">Thêm tài khoản người dùng</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Điền đầy đủ thông tin bên dưới</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                        <HiOutlineX className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                    {/* Avatar pick container */}
                    <div className="flex flex-col items-center gap-2 mb-2">
                        <label className="block text-xs font-medium text-gray-400">Ảnh đại diện</label>
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-700 bg-gray-800 cursor-pointer group flex items-center justify-center"
                            onClick={() => fileInputRef.current?.click()}>
                            {form.avatar ? (
                                <img src={form.avatar} className="w-full h-full object-cover" alt="avatar" />
                            ) : (
                                <HiOutlineUserCircle className="w-10 h-10 text-gray-500" />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <HiOutlineCamera className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                        <span className="text-[10px] text-gray-500">Kích thước ảnh nhỏ hơn 2MB</span>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Tên đầy đủ *</label>
                        <input type="text" required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors" placeholder="Nguyễn Văn A" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Email *</label>
                        <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors" placeholder="email@example.com" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Mật khẩu *</label>
                        <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors" placeholder="••••••••" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Chọn Tenant *</label>
                        <select required value={form.tenantId} onChange={e => setForm({ ...form, tenantId: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors">
                            <option value="" disabled>-- Chọn công ty --</option>
                            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Trạng thái</label>
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors">
                                <option value="active">Hoạt động</option>
                                <option value="locked">Khóa</option>
                            </select>
                        </div>
                        <div className="flex flex-col justify-end gap-2 pb-2">
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-400 cursor-pointer">
                                <input type="checkbox" checked={form.isTenantAdmin} onChange={e => setForm({ ...form, isTenantAdmin: e.target.checked })}
                                    className="rounded bg-gray-800 border-gray-700 text-purple-600 focus:ring-purple-500 w-4 h-4" />
                                Admin Công Ty
                            </label>
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-400 cursor-pointer">
                                <input type="checkbox" checked={form.isSuperAdmin} onChange={e => setForm({ ...form, isSuperAdmin: e.target.checked })}
                                    className="rounded bg-gray-800 border-gray-700 text-purple-600 focus:ring-purple-500 w-4 h-4" />
                                Super Admin
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Hủy</button>
                        <button type="submit" disabled={loading}
                            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                            {loading ? 'Đang lưu...' : 'Thêm tài khoản'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const SuperAdminUsers = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(1);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const load = async () => {
        setLoading(true);
        try { setUsers(await api.getUsers()); }
        catch { Toast.fire({ icon: 'error', title: 'Không thể tải danh sách người dùng' }); }
        finally { setLoading(false); }
    };

    const loadTenants = async () => {
        try { setTenants(await api.getTenants()); }
        catch (e) { console.error('Failed to load tenants:', e); }
    };

    useEffect(() => { load(); loadTenants(); }, []);

    const handleStatus = async (u: any) => {
        const locking = u.status === 'active';
        const r = await Swal.fire({
            title: locking ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?',
            html: `Bạn có chắc muốn ${locking ? '<b>khóa</b>' : '<b>mở khóa</b>'} tài khoản <b>${u.email}</b>?`,
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: locking ? '#ef4444' : '#10b981',
            cancelButtonColor: '#374151',
            confirmButtonText: locking ? 'Khóa ngay' : 'Mở khóa',
            cancelButtonText: 'Hủy',
        });
        if (!r.isConfirmed) return;
        try {
            await api.updateStatus(u.id, locking ? 'locked' : 'active');
            Toast.fire({ icon: 'success', title: locking ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản' });
            load();
        } catch { Toast.fire({ icon: 'error', title: 'Thao tác thất bại' }); }
    };

    const handleSave = async (id: string, data: any) => {
        try {
            await api.updateUser(id, data);
            Toast.fire({ icon: 'success', title: 'Cập nhật thành công' });
            setEditingUser(null);
            load();
        } catch { Toast.fire({ icon: 'error', title: 'Cập nhật thất bại' }); }
    };

    const handleCreate = async (data: any) => {
        try {
            await api.createUser(data);
            Toast.fire({ icon: 'success', title: 'Thêm người dùng thành công' });
            setShowAddModal(false);
            load();
        } catch { Toast.fire({ icon: 'error', title: 'Thêm người dùng thất bại' }); }
    };

    const handleImpersonate = async (u: any) => {
        const r = await Swal.fire({
            title: 'Mạo danh tài khoản',
            html: `Bạn sẽ đăng nhập với tư cách <b>${u.email}</b>`,
            icon: 'question', showCancelButton: true,
            confirmButtonColor: '#7c3aed', cancelButtonColor: '#374151',
            confirmButtonText: 'Tiếp tục', cancelButtonText: 'Hủy',
        });
        if (!r.isConfirmed) return;
        try {
            const data = await api.impersonate(u.id);
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            Toast.fire({ icon: 'success', title: 'Đang chuyển hướng...' });
            setTimeout(() => window.location.href = '/dashboard', 1200);
        } catch { Toast.fire({ icon: 'error', title: 'Mạo danh thất bại' }); }
    };

    const copyId = (id: string) => {
        navigator.clipboard.writeText(id);
        Toast.fire({ icon: 'success', title: 'Đã sao chép ID' });
    };

    const filtered = useMemo(() => {
        return users.filter(u => {
            const q = search.toLowerCase();
            const matchQ = !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
            let matchRole = true;
            if (filterRole === 'superadmin') matchRole = u.isSuperAdmin;
            else if (filterRole === 'admin') matchRole = u.isTenantAdmin && !u.isSuperAdmin;
            else if (filterRole === 'user') matchRole = !u.isSuperAdmin && !u.isTenantAdmin;
            const matchStatus = !filterStatus || u.status === filterStatus;
            return matchQ && matchRole && matchStatus;
        });
    }, [users, search, filterRole, filterStatus]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const stats = useMemo(() => ({
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        locked: users.filter(u => u.status !== 'active').length,
        admins: users.filter(u => u.isTenantAdmin || u.isSuperAdmin).length,
    }), [users]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Quản lý Người dùng</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Xem và quản lý tất cả tài khoản trong hệ thống</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white text-sm rounded-lg transition-colors">
                        <HiOutlineRefresh className="w-4 h-4" /> Làm mới
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg font-medium transition-colors">
                        <HiOutlinePlus className="w-4 h-4" /> Thêm người dùng
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng tài khoản" value={stats.total} icon={HiOutlineUsers} accent="bg-purple-500/10 text-purple-400" />
                <StatCard label="Đang hoạt động" value={stats.active} icon={HiOutlineCheckCircle} accent="bg-emerald-500/10 text-emerald-400" />
                <StatCard label="Đã bị khóa" value={stats.locked} icon={HiOutlineBan} accent="bg-red-500/10 text-red-400" />
                <StatCard label="Quản trị viên" value={stats.admins} icon={HiOutlineShieldCheck} accent="bg-blue-500/10 text-blue-400" />
            </div>

            {/* Table Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 px-5 py-4 border-b border-gray-800">
                    <div className="relative flex-1">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text" placeholder="Tìm theo tên, email, ID..."
                            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="w-full bg-gray-800 border border-gray-700 text-white pl-9 pr-4 py-2 rounded-lg text-sm outline-none focus:border-purple-500 transition-colors placeholder-gray-600"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}
                            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-purple-500 min-w-[130px]">
                            <option value="">Tất cả vai trò</option>
                            <option value="superadmin">Super Admin</option>
                            <option value="admin">Tenant Admin</option>
                            <option value="user">User thường</option>
                        </select>
                        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-purple-500 min-w-[130px]">
                            <option value="">Tất cả trạng thái</option>
                            <option value="active">Hoạt động</option>
                            <option value="locked">Đã khóa</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="text-left px-5 py-3.5 font-semibold">Người dùng</th>
                                <th className="text-left px-4 py-3.5 font-semibold">Tenant</th>
                                <th className="text-left px-4 py-3.5 font-semibold">Vai trò</th>
                                <th className="text-left px-4 py-3.5 font-semibold">Trạng thái</th>
                                <th className="text-left px-4 py-3.5 font-semibold">ID</th>
                                <th className="text-left px-4 py-3.5 font-semibold">Ngày tạo</th>
                                <th className="text-center px-4 py-3.5 font-semibold">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16">
                                        <HiOutlineUserCircle className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">Không tìm thấy tài khoản nào</p>
                                    </td>
                                </tr>
                            ) : paginated.map(u => {
                                const role = getRoleBadge(u);
                                const status = getStatusBadge(u.status);
                                return (
                                    <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors group">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={getAvatar(u)}
                                                    alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-700"
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-white font-medium text-sm truncate">{u.fullName}</div>
                                                    <div className="text-gray-500 text-xs truncate">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-gray-400 text-sm truncate max-w-[140px] block" title={u.tenant?.name}>
                                                {u.tenant?.name || <span className="text-gray-600">—</span>}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${role.cls}`}>
                                                {u.isSuperAdmin && <HiOutlineShieldCheck className="w-3 h-3" />}
                                                {role.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.cls}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <button
                                                onClick={() => copyId(u.id)}
                                                className="flex items-center gap-1.5 group/id"
                                                title="Click để sao chép ID"
                                            >
                                                <span className="font-mono text-xs text-gray-600 group-hover/id:text-gray-400 transition-colors">{u.id.slice(0, 8)}…</span>
                                                <HiOutlineClipboardCopy className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover/id:opacity-100 transition-opacity" />
                                            </button>
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleImpersonate(u)} title="Mạo danh"
                                                    className="p-1.5 rounded-lg hover:bg-purple-500/10 text-gray-500 hover:text-purple-400 transition-colors">
                                                    <HiOutlineEye className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setEditingUser(u)} title="Chỉnh sửa"
                                                    className="p-1.5 rounded-lg hover:bg-blue-500/10 text-gray-500 hover:text-blue-400 transition-colors">
                                                    <HiOutlinePencil className="w-4 h-4" />
                                                </button>
                                                {u.status === 'active' ? (
                                                    <button onClick={() => handleStatus(u)} title="Khóa tài khoản"
                                                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                                                        <HiOutlineLockClosed className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleStatus(u)} title="Mở khóa"
                                                        className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-400 transition-colors">
                                                        <HiOutlineLockOpen className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-800">
                        <span className="text-xs text-gray-500">
                            Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} người dùng
                        </span>
                        <div className="flex items-center gap-1">
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

            {editingUser && <EditModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSave} />}
            {showAddModal && <AddModal tenants={tenants} onClose={() => setShowAddModal(false)} onSave={handleCreate} />}
        </div>
    );
};

export default SuperAdminUsers;
