import { useState, useEffect, useRef, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
    FaUsers, FaUserPlus, FaMagnifyingGlass, FaShieldHalved, FaPlus,
    FaPen, FaTrash, FaPenToSquare, FaEllipsisVertical, FaCrown,
    FaUserPen, FaXmark, FaCamera, FaCheck, FaCircleNotch, FaChevronDown
} from 'react-icons/fa6';
import { FaRegEnvelope, FaRegFolderOpen } from 'react-icons/fa';

// ─── Permission Config ────────────────────────────────────────────────
const PERMISSION_GROUPS = [
    { key: 'USER',    label: 'Người dùng', icon: '👤', color: 'blue',
      perms: ['CREATE_USER','VIEW_USERS','READ_USER','EDIT_USER','UPDATE_USER','DELETE_USER','MANAGE_USER'] },
    { key: 'PROJECT', label: 'Dự án',      icon: '📁', color: 'indigo',
      perms: ['CREATE_PROJECT','VIEW_PROJECTS','READ_PROJECT','EDIT_PROJECT','UPDATE_PROJECT','DELETE_PROJECT','MANAGE_PROJECT'] },
    { key: 'QR',      label: 'Mã QR',      icon: '🔲', color: 'violet',
      perms: ['CREATE_QR','VIEW_QR','EDIT_QR','DELETE_QR','SCAN_QR','MANAGE_QRCODE'] },
    { key: 'TASK',    label: 'Công việc',  icon: '✅', color: 'emerald',
      perms: ['CREATE_TASK','VIEW_TASKS','READ_TASK','EDIT_TASK','UPDATE_TASK','DELETE_TASK','ASSIGN_TASK','COMPLETE_TASK','MANAGE_TASK'] },
    { key: 'REPORT',  label: 'Báo cáo',    icon: '📊', color: 'orange',
      perms: ['VIEW_REPORTS','EXPORT_REPORTS','VIEW_ANALYTICS','VIEW_AUDIT_LOGS','VIEW_SCAN_LOGS','MANAGE_SCAN_LOGS'] },
    { key: 'SYSTEM',  label: 'Hệ thống',   icon: '⚙️', color: 'rose',
      perms: ['MANAGE_SYSTEM','MANAGE_TENANT_SETTINGS','VIEW_TENANT_SETTINGS','MANAGE_SUBSCRIPTION','CREATE_ROLE','VIEW_ROLES','MANAGE_ROLE'] },
];

const COLOR_MAP: Record<string, any> = {
    blue:    { bg:'bg-blue-50',    border:'border-blue-200',   header:'bg-blue-100',    dot:'bg-blue-500',   tagOn:'bg-blue-600 text-white border-blue-600',   tagOff:'bg-white text-gray-500 border-gray-200 hover:border-blue-300',   btnOn:'bg-blue-600 text-white border-transparent',  btnOff:'bg-white text-gray-600 border-gray-300', chk:'#2563eb' },
    indigo:  { bg:'bg-indigo-50',  border:'border-indigo-200', header:'bg-indigo-100',  dot:'bg-indigo-500', tagOn:'bg-indigo-600 text-white border-indigo-600', tagOff:'bg-white text-gray-500 border-gray-200 hover:border-indigo-300', btnOn:'bg-indigo-600 text-white border-transparent',btnOff:'bg-white text-gray-600 border-gray-300', chk:'#4f46e5' },
    violet:  { bg:'bg-violet-50',  border:'border-violet-200', header:'bg-violet-100',  dot:'bg-violet-500', tagOn:'bg-violet-600 text-white border-violet-600', tagOff:'bg-white text-gray-500 border-gray-200 hover:border-violet-300', btnOn:'bg-violet-600 text-white border-transparent',btnOff:'bg-white text-gray-600 border-gray-300', chk:'#7c3aed' },
    emerald: { bg:'bg-emerald-50', border:'border-emerald-200',header:'bg-emerald-100', dot:'bg-emerald-500',tagOn:'bg-emerald-600 text-white border-emerald-600',tagOff:'bg-white text-gray-500 border-gray-200 hover:border-emerald-300',btnOn:'bg-emerald-600 text-white border-transparent',btnOff:'bg-white text-gray-600 border-gray-300',chk:'#059669' },
    orange:  { bg:'bg-orange-50',  border:'border-orange-200', header:'bg-orange-100',  dot:'bg-orange-500', tagOn:'bg-orange-600 text-white border-orange-600', tagOff:'bg-white text-gray-500 border-gray-200 hover:border-orange-300', btnOn:'bg-orange-600 text-white border-transparent',btnOff:'bg-white text-gray-600 border-gray-300', chk:'#ea580c' },
    rose:    { bg:'bg-rose-50',    border:'border-rose-200',   header:'bg-rose-100',    dot:'bg-rose-500',   tagOn:'bg-rose-600 text-white border-rose-600',     tagOff:'bg-white text-gray-500 border-gray-200 hover:border-rose-300',   btnOn:'bg-rose-600 text-white border-transparent',  btnOff:'bg-white text-gray-600 border-gray-300',  chk:'#e11d48' },
};

// ─── PermissionGroup accordion ─────────────────────────────────────────
const PermissionGroup = ({ group, selectedPerms, onChange }: {
    group: typeof PERMISSION_GROUPS[number];
    selectedPerms: string[];
    onChange: (perm: string) => void;
}) => {
    const [open, setOpen] = useState(true);
    const c = COLOR_MAP[group.color];
    const selected = group.perms.filter(p => selectedPerms.includes(p));
    const allOn = selected.length === group.perms.length;

    const toggleAll = () => {
        if (allOn) group.perms.forEach(p => { if (selectedPerms.includes(p)) onChange(p); });
        else       group.perms.forEach(p => { if (!selectedPerms.includes(p)) onChange(p); });
    };

    return (
        <div className={`rounded-xl border ${c.border} overflow-hidden`}>
            {/* Header */}
            <div className={`${c.header} px-4 py-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <span className="text-sm">{group.icon}</span>
                    <span className="font-bold text-sm text-gray-800">{group.label}</span>
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full text-white ${c.dot}`}>
                        {selected.length}/{group.perms.length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={toggleAll}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${allOn ? c.btnOn : c.btnOff}`}>
                        {allOn ? 'Bỏ tất cả' : 'Chọn tất cả'}
                    </button>
                    <button type="button" onClick={() => setOpen(!open)}
                        className="text-gray-500 p-1 rounded transition-transform duration-200"
                        style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <FaChevronDown style={{ fontSize: 10 }} />
                    </button>
                </div>
            </div>
            {/* Tags */}
            {open && (
                <div className={`${c.bg} px-4 py-3`}>
                    <div className="flex flex-wrap gap-1.5">
                        {group.perms.map(perm => {
                            const on = selectedPerms.includes(perm);
                            return (
                                <button key={perm} type="button" onClick={() => onChange(perm)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all select-none ${on ? c.tagOn : c.tagOff}`}>
                                    <span className="w-3.5 h-3.5 rounded-sm border flex-shrink-0 flex items-center justify-center transition-colors"
                                        style={on ? { backgroundColor: c.chk, borderColor: c.chk } : { borderColor: '#d1d5db', background: '#fff' }}>
                                        {on && <FaCheck className="text-white" style={{ fontSize: 7 }} />}
                                    </span>
                                    {perm.replace(/_/g,' ')}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Staff component ──────────────────────────────────────────────────
const Staff = () => {
    const apiUrl = 'https://api.aegism.online';
    const [activeTab, setActiveTab] = useState('staff');
    const [currentPlan, setCurrentPlan] = useState('starter');
    const [user, setUser] = useState<any>({ name: 'Loading...', permissions: [] });
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [allStaff, setAllStaff] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [isEditingStaff, setIsEditingStaff] = useState(false);
    const [staffForm, setStaffForm] = useState<any>({ id: null, fullName: '', email: '', password: '', roleId: '', isTenantAdmin: false, status: 'active', projectId: '', avatar: '' });
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [isEditingRole, setIsEditingRole] = useState(false);
    const [roleForm, setRoleForm] = useState<any>({ id: null, name: '', permissions: [] });
    const [selectedStaff, setSelectedStaff] = useState<any>({});
    const [errors, setErrors] = useState<any>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);

    const plans: any = { starter: { limits: { users: 5 } }, professional: { limits: { users: 50 } }, enterprise: { limits: { users: 'unlimited' } } };

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) { window.location.href = '/login'; return; }
            const userStr = localStorage.getItem('user');
            if (userStr) updateUserUI(JSON.parse(userStr));
            await fetchUserProfile();
            await fetchProjects();
        };
        init();
        const handleClickOutside = () => setDropdownOpenId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => { if (selectedProjectId) { fetchStaff(); fetchRoles(); } }, [selectedProjectId]);

    const updateUserUI = (u: any) => {
        let permissions: string[] = [];
        if (u.isSuperAdmin || u.isTenantAdmin) permissions = ['ALL'];
        else if (u.role) {
            try { permissions = Array.isArray(u.role.permissions) ? u.role.permissions : JSON.parse(u.role.permissions); }
            catch { permissions = []; }
        }
        setUser({ ...u, permissions });
        if (u.tenant) setCurrentPlan(u.tenant.subscriptionPlan?.toLowerCase() || 'starter');
    };

    const hasPermission = (perm: string) => {
        if (user.isSuperAdmin || user.isTenantAdmin) return true;
        if (user.permissions.includes('ALL')) return true;
        return user.permissions.includes(perm);
    };

    const checkPermissionAction = (perm: string) => {
        if (!hasPermission(perm)) { Swal.fire({ icon: 'error', title: 'Truy cập bị từ chối', text: 'Bạn không có quyền thực hiện chức năng này.' }); return false; }
        return true;
    };

    const getAvatarUrl = (staff: any) => {
        if (staff.avatar && (staff.avatar.startsWith('data:') || staff.avatar.startsWith('http'))) return staff.avatar;
        if (staff.avatar && staff.avatar.startsWith('/uploads')) return apiUrl + staff.avatar;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.fullName || 'User')}&background=random&size=128`;
    };

    const parsePermissions = (permStr: any) => {
        if (!permStr) return [];
        if (Array.isArray(permStr)) return permStr;
        try { return JSON.parse(permStr); } catch { return permStr.split(',').map((p: string) => p.trim()); }
    };

    const getRoleName = (role: any) => role ? role.name : 'Chưa gán';

    const canAddUser = useMemo(() => {
        const limit = plans[currentPlan]?.limits?.users;
        if (limit === 'unlimited') return true;
        return allStaff.length < limit;
    }, [allStaff, currentPlan]);

    const filteredStaff = useMemo(() => {
        if (!searchQuery) return allStaff;
        const lq = searchQuery.toLowerCase();
        return allStaff.filter(s => s.fullName?.toLowerCase().includes(lq) || s.email?.toLowerCase().includes(lq));
    }, [allStaff, searchQuery]);

    const validateInput = (value: string, type: string) => {
        if (!value || !value.trim()) return 'Không được để trống.';
        if (type === 'name' && !/^[a-zA-Z0-9\s\u00C0-\u1EF9]+$/.test(value)) return 'Không được chứa ký tự đặc biệt.';
        if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email không hợp lệ.';
        if (type === 'password' && value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.';
        return null;
    };

    const validateStaffForm = () => {
        const e: any = {};
        const ne = validateInput(staffForm.fullName, 'name'); if (ne) e.fullName = ne;
        const ee = validateInput(staffForm.email, 'email'); if (ee) e.email = ee;
        if (!isEditingStaff) { const pe = validateInput(staffForm.password, 'password'); if (pe) e.password = pe; }
        if (!staffForm.roleId) e.roleId = 'Vui lòng chọn vai trò.';
        setErrors(e); return Object.keys(e).length === 0;
    };

    const validateRoleForm = () => {
        const err = validateInput(roleForm.name, 'name');
        if (err) { setErrors({ roleName: err }); return false; }
        setErrors({}); return true;
    };

    const fetchUserProfile = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/users/profile`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) { const u = await res.json(); localStorage.setItem('user', JSON.stringify(u)); updateUserUI(u); }
        } catch (e) { console.error(e); }
    };

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/projects`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) { const data = await res.json(); setProjects(data); if (data.length > 0 && !selectedProjectId) setSelectedProjectId(data[0].id); }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const fetchRoles = async () => {
        if (!selectedProjectId) return;
        try {
            const res = await fetch(`${apiUrl}/api/roles?projectId=${selectedProjectId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) setRoles(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchStaff = async () => {
        if (!selectedProjectId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/members?projectId=${selectedProjectId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) setAllStaff(await res.json());
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const openAddStaffModal = () => {
        if (!checkPermissionAction('CREATE_USER') && !checkPermissionAction('MANAGE_USER')) return;
        if (!selectedProjectId) { Swal.fire('Thông báo', 'Vui lòng chọn dự án trước', 'info'); return; }
        setIsEditingStaff(false); setTempPassword(null);
        setStaffForm({ fullName: '', email: '', password: '', roleId: '', isTenantAdmin: false, status: 'active', projectId: selectedProjectId, avatar: '' });
        setErrors({}); setShowStaffModal(true);
    };

    const openEditStaffModal = (staff: any) => {
        if (!hasPermission('EDIT_USER') && !hasPermission('UPDATE_USER') && !hasPermission('MANAGE_USER'))
            return Swal.fire({ icon: 'error', title: 'Từ chối', text: 'Bạn không có quyền sửa nhân sự.' });
        setIsEditingStaff(true); setTempPassword(null);
        setStaffForm({ ...staff, password: '', roleId: staff.role ? staff.role.id : '', projectId: selectedProjectId, avatar: getAvatarUrl(staff) });
        setErrors({}); setShowStaffModal(true);
    };

    const saveStaff = async () => {
        if (!validateStaffForm()) return;
        const url = isEditingStaff ? `${apiUrl}/api/members/${staffForm.id}` : `${apiUrl}/api/members`;
        const payload = { ...staffForm };
        if (isEditingStaff && payload.avatar?.startsWith('http')) delete payload.avatar;
        try {
            const res = await fetch(url, { method: isEditingStaff ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (res.ok) {
                if (!isEditingStaff && data.temporaryPassword) { setTempPassword(data.temporaryPassword); fetchStaff(); Swal.fire({ icon: 'success', title: 'Tạo thành công', timer: 1500, showConfirmButton: false }); }
                else { Swal.fire({ icon: 'success', title: 'Thành công', timer: 1500, showConfirmButton: false }); setShowStaffModal(false); fetchStaff(); }
            } else Swal.fire('Lỗi', data.message || 'Không thể lưu', 'error');
        } catch { Swal.fire('Lỗi', 'Lỗi kết nối server.', 'error'); }
    };

    const deleteStaff = async (id: string) => {
        if (!checkPermissionAction('DELETE_USER') && !checkPermissionAction('MANAGE_USER')) return;
        const r = await Swal.fire({ title: 'Xóa nhân sự?', text: 'Nhân viên sẽ bị xóa khỏi dự án.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#EF4444', confirmButtonText: 'Xóa ngay', cancelButtonText: 'Hủy' });
        if (!r.isConfirmed) return;
        try {
            const res = await fetch(`${apiUrl}/api/members/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) { Swal.fire('Đã xóa!', '', 'success'); fetchStaff(); }
            else { const err = await res.json(); Swal.fire('Lỗi', err.message || res.statusText, 'error'); }
        } catch { Swal.fire('Lỗi', 'Lỗi kết nối.', 'error'); }
    };

    const handleFileUpload = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return Swal.fire('Lỗi', 'Ảnh quá lớn (>2MB)', 'warning');
        const reader = new FileReader();
        reader.onload = (ev: any) => setStaffForm({ ...staffForm, avatar: ev.target.result });
        reader.readAsDataURL(file);
    };

    const openRoleModal = () => {
        if (!checkPermissionAction('CREATE_ROLE')) return;
        setIsEditingRole(false); setRoleForm({ name: '', permissions: [] }); setErrors({}); setShowRoleModal(true);
    };

    const openEditRoleModal = (role: any) => {
        if (!hasPermission('MANAGE_ROLE') && !hasPermission('EDIT_ROLE'))
            return Swal.fire({ icon: 'error', title: 'Từ chối', text: 'Bạn không có quyền sửa vai trò.' });
        setIsEditingRole(true);
        setRoleForm({ id: role.id, name: role.name, permissions: parsePermissions(role.permissions) });
        setErrors({}); setShowRoleModal(true);
    };

    const saveRole = async () => {
        if (!validateRoleForm()) return;
        const url = isEditingRole ? `${apiUrl}/api/roles/${roleForm.id}` : `${apiUrl}/api/roles`;
        try {
            await fetch(url, { method: isEditingRole ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ ...roleForm, projectId: selectedProjectId }) });
            Swal.fire({ icon: 'success', title: 'Thành công', timer: 1500, showConfirmButton: false });
            setShowRoleModal(false); fetchRoles();
        } catch { Swal.fire('Lỗi', 'Không thể kết nối máy chủ', 'error'); }
    };

    const deleteRole = async (id: string) => {
        if (!checkPermissionAction('DELETE_ROLE') && !checkPermissionAction('MANAGE_ROLE')) return;
        const r = await Swal.fire({ title: 'Xóa vai trò?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#EF4444', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' });
        if (!r.isConfirmed) return;
        try {
            await fetch(`${apiUrl}/api/roles/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            Swal.fire('Đã xóa!', '', 'success'); fetchRoles();
        } catch { Swal.fire('Lỗi', 'Lỗi kết nối', 'error'); }
    };

    const handleRolePermissionChange = (perm: string) => {
        const cur = [...roleForm.permissions];
        setRoleForm({ ...roleForm, permissions: cur.includes(perm) ? cur.filter(p => p !== perm) : [...cur, perm] });
    };

    const totalPerms = PERMISSION_GROUPS.reduce((s, g) => s + g.perms.length, 0);

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 h-full font-sans text-gray-800">
            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 m-6">
                <div className="relative w-full md:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FaMagnifyingGlass className="text-gray-400" /></div>
                    <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="block w-full pl-10 pr-10 py-2.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-gray-50">
                        {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="relative w-full md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FaMagnifyingGlass className="text-gray-400" /></div>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm nhân sự..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" />
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200 px-6">
                <nav className="-mb-px flex space-x-8">
                    {[{ key: 'staff', icon: <FaUsers className="mr-2" />, label: 'Danh sách Nhân sự' },
                      { key: 'roles', icon: <FaShieldHalved className="mr-2" />, label: 'Quản lý Vai trò & Quyền hạn' }].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center transition-colors ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            {tab.icon}{tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {isLoading && <div className="flex justify-center items-center py-10"><FaCircleNotch className="animate-spin h-10 w-10 text-blue-600" /></div>}

            {/* TAB STAFF */}
            {activeTab === 'staff' && selectedProjectId && !isLoading && (
                <div className="px-6 pb-6">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Đội ngũ Dự án</h3>
                            <p className="text-sm text-gray-500">Quản lý thành viên và phân quyền truy cập.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-medium">{filteredStaff.length} Thành viên</div>
                            {(hasPermission('CREATE_USER') || hasPermission('MANAGE_USER')) && (
                                <button onClick={openAddStaffModal} disabled={!canAddUser}
                                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${canAddUser ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                                    <FaUserPlus className="mr-2" /> Thêm Nhân sự
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Thông tin Nhân viên', 'Vai trò', 'Trạng thái', 'Ngày tham gia', ''].map((h, i) => (
                                        <th key={i} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h || <span className="sr-only">Hành động</span>}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStaff.map((staff: any) => (
                                    <tr key={staff.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { setSelectedStaff(staff); setShowDetailModal(true); }}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 relative">
                                                    <img className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm" src={getAvatarUrl(staff)} alt="" />
                                                    {staff.isTenantAdmin && <div className="absolute -bottom-1 -right-1 bg-purple-600 rounded-full p-0.5 border-2 border-white"><FaCrown className="text-[10px] text-white" /></div>}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{staff.fullName}</div>
                                                    <div className="text-sm text-gray-500">{staff.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">{getRoleName(staff.role)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`h-2.5 w-2.5 rounded-full mr-2 ${staff.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-400'}`}></div>
                                                <span className="text-sm text-gray-700 font-medium">{staff.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(staff.createdAt || Date.now()).toLocaleDateString('vi-VN')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="relative">
                                                <button onClick={(e) => { e.stopPropagation(); setDropdownOpenId(dropdownOpenId === staff.id ? null : staff.id); }} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><FaEllipsisVertical /></button>
                                                {dropdownOpenId === staff.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-100">
                                                        {(hasPermission('EDIT_USER') || hasPermission('UPDATE_USER') || hasPermission('MANAGE_USER')) && (
                                                            <button onClick={() => { openEditStaffModal(staff); setDropdownOpenId(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                                                                <span className="flex items-center"><FaPenToSquare className="w-4 mr-2" /> Chỉnh sửa</span>
                                                            </button>
                                                        )}
                                                        {(hasPermission('DELETE_USER') || hasPermission('MANAGE_USER')) && (
                                                            <button onClick={() => { deleteStaff(staff.id); setDropdownOpenId(null); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                                                <span className="flex items-center"><FaTrash className="w-4 mr-2" /> Xóa nhân sự</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredStaff.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">Chưa tìm thấy nhân sự phù hợp.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB ROLES */}
            {activeTab === 'roles' && selectedProjectId && !isLoading && (
                <div className="px-6 pb-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Vai trò & Quyền hạn</h3>
                            <p className="text-sm text-gray-500">Định nghĩa các nhóm quyền để gán cho nhân viên.</p>
                        </div>
                        {(hasPermission('MANAGE_ROLE') || hasPermission('CREATE_ROLE')) && (
                            <button onClick={openRoleModal} className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium shadow-sm">
                                <FaPlus className="mr-2 text-gray-500" /> Tạo Vai trò Mới
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roles.map((role: any) => {
                            const perms = parsePermissions(role.permissions);
                            return (
                                <div key={role.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-blue-300 transition-all group flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><FaShieldHalved /></div>
                                            <div>
                                                <h4 className="text-base font-bold text-gray-800">{role.name}</h4>
                                                <span className="text-xs text-gray-400">{perms.length} quyền</span>
                                            </div>
                                        </div>
                                        {hasPermission('MANAGE_ROLE') && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditRoleModal(role)} className="p-1.5 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-md hover:bg-blue-50"><FaPen /></button>
                                                <button onClick={() => deleteRole(role.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 rounded-md hover:bg-red-50"><FaTrash /></button>
                                            </div>
                                        )}
                                    </div>
                                    {/* Grouped permission tags */}
                                    <div className="space-y-1.5">
                                        {PERMISSION_GROUPS.map(group => {
                                            const matched = group.perms.filter(p => perms.includes(p));
                                            if (!matched.length) return null;
                                            const c = COLOR_MAP[group.color];
                                            return (
                                                <div key={group.key} className="flex items-start gap-1.5">
                                                    <span className="text-xs mt-0.5 flex-shrink-0">{group.icon}</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {matched.map(p => (
                                                            <span key={p} className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${c.tagOn}`}>{p.replace(/_/g,' ')}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                        {roles.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                <FaRegFolderOpen className="text-3xl text-gray-400 mb-2" />
                                <span className="text-gray-500 font-medium">Chưa có vai trò nào được tạo.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!selectedProjectId && (
                <div className="text-center py-24 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400"><FaShieldHalved className="text-3xl" /></div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Chọn Dự án để Quản lý</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">Vui lòng chọn một dự án từ menu phía trên.</p>
                </div>
            )}

            {/* ══════════════ MODAL: ROLE FORM ══════════════ */}
            {showRoleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={() => setShowRoleModal(false)} />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 flex flex-col max-h-[90vh]">

                        {/* Header gradient */}
                        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl flex justify-between items-center flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg"><FaShieldHalved className="text-white" /></div>
                                <div>
                                    <h3 className="text-base font-bold text-white">{isEditingRole ? 'Chỉnh sửa Vai trò' : 'Tạo Vai trò Mới'}</h3>
                                    <p className="text-blue-100 text-xs">Chọn quyền hạn cho vai trò này</p>
                                </div>
                            </div>
                            <button onClick={() => setShowRoleModal(false)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition"><FaXmark /></button>
                        </div>

                        <div className="p-5 overflow-y-auto flex-1 space-y-4">
                            {/* Role name input */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Tên Vai trò <span className="text-red-500">*</span></label>
                                <input type="text" value={roleForm.name}
                                    onChange={(e) => { setRoleForm({ ...roleForm, name: e.target.value }); setErrors({ ...errors, roleName: null }); }}
                                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 ${errors.roleName ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300 focus:border-blue-400'}`}
                                    placeholder="Ví dụ: Giám sát viên, Bảo vệ, Kỹ thuật viên..." />
                                {errors.roleName && <p className="text-red-500 text-xs mt-1">{errors.roleName}</p>}
                            </div>

                            {/* Summary pill bar */}
                            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl px-4 py-2.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FaShieldHalved className="text-white text-sm" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-gray-400 leading-none">Đã chọn</p>
                                        <p className="text-xl font-black text-blue-700 leading-tight">{roleForm.permissions.length}<span className="text-sm font-normal text-gray-400">/{totalPerms}</span></p>
                                    </div>
                                </div>
                                <div className="flex gap-1 flex-wrap justify-end max-w-xs">
                                    {PERMISSION_GROUPS.map(g => {
                                        const cnt = g.perms.filter(p => roleForm.permissions.includes(p)).length;
                                        if (!cnt) return null;
                                        return <span key={g.key} className="text-[11px] font-bold px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-600">{g.icon} {cnt}</span>;
                                    })}
                                </div>
                                {roleForm.permissions.length > 0 && (
                                    <button type="button" onClick={() => setRoleForm({ ...roleForm, permissions: [] })}
                                        className="text-xs text-gray-400 hover:text-red-500 ml-2 transition flex-shrink-0">Xóa hết</button>
                                )}
                            </div>

                            {/* Accordion groups */}
                            <div className="space-y-2.5">
                                {PERMISSION_GROUPS.map(group => (
                                    <PermissionGroup key={group.key} group={group} selectedPerms={roleForm.permissions} onChange={handleRolePermissionChange} />
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 bg-gray-50 border-t flex justify-between items-center rounded-b-2xl flex-shrink-0">
                            <span className="text-xs text-gray-400">{roleForm.permissions.length}/{totalPerms} quyền đã chọn</span>
                            <div className="flex gap-2">
                                <button onClick={() => setShowRoleModal(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                                <button onClick={saveRole} className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm shadow-md shadow-blue-500/30 transition">
                                    {isEditingRole ? 'Lưu thay đổi' : 'Tạo vai trò'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════ MODAL: STAFF FORM ══════════════ */}
            {showStaffModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto">
                    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={() => setShowStaffModal(false)} />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 my-8">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h3 className="text-base font-bold text-gray-900 flex items-center">
                                <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg mr-3"><FaUserPen /></span>
                                {isEditingStaff ? 'Cập nhật Thông tin' : 'Thêm Nhân sự Mới'}
                            </h3>
                            <button onClick={() => setShowStaffModal(false)} className="text-gray-400 hover:text-gray-600"><FaXmark className="text-xl" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Họ và Tên <span className="text-red-500">*</span></label>
                                <input type="text" value={staffForm.fullName} onChange={(e) => { setStaffForm({ ...staffForm, fullName: e.target.value }); setErrors({ ...errors, fullName: null }); }}
                                    className={`w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 ${errors.fullName ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'}`} placeholder="Nhập tên nhân viên" />
                                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                                <input type="email" value={staffForm.email} disabled={isEditingStaff}
                                    onChange={(e) => { setStaffForm({ ...staffForm, email: e.target.value }); setErrors({ ...errors, email: null }); }}
                                    className={`w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 disabled:bg-gray-100 ${errors.email ? 'border-red-400' : 'border-gray-300 focus:ring-blue-300'}`} placeholder="email@example.com" />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Ảnh đại diện</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <img src={staffForm.avatar ? (staffForm.avatar.startsWith('data:') ? staffForm.avatar : apiUrl + staffForm.avatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(staffForm.fullName || 'User')}&background=random&size=128`}
                                            className="h-14 w-14 rounded-full border-2 border-gray-200 object-cover group-hover:border-blue-500 transition-colors" alt="" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-full flex items-center justify-center transition-all"><FaCamera className="text-white opacity-0 group-hover:opacity-100" /></div>
                                    </div>
                                    <div>
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Chọn ảnh</button>
                                        <p className="text-xs text-gray-400 mt-1">JPG, PNG (Max 2MB)</p>
                                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                                    </div>
                                </div>
                            </div>
                            {!isEditingStaff && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                                    <input type="password" value={staffForm.password} onChange={(e) => { setStaffForm({ ...staffForm, password: e.target.value }); setErrors({ ...errors, password: null }); }}
                                        className={`w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 ${errors.password ? 'border-red-400' : 'border-gray-300 focus:ring-blue-300'}`} placeholder="••••••••" />
                                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Vai trò <span className="text-red-500">*</span></label>
                                    <select value={staffForm.roleId} onChange={(e) => { setStaffForm({ ...staffForm, roleId: e.target.value }); setErrors({ ...errors, roleId: null }); }}
                                        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 bg-white ${errors.roleId ? 'border-red-400' : 'border-gray-300 focus:ring-blue-300'}`}>
                                        <option value="" disabled>-- Chọn vai trò --</option>
                                        {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                    {errors.roleId && <p className="text-red-500 text-xs mt-1">{errors.roleId}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Trạng thái</label>
                                    <select value={staffForm.status} onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-300 bg-white">
                                        <option value="active">Hoạt động</option>
                                        <option value="inactive">Tạm dừng</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-between bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <div className="flex items-center">
                                    <div className="bg-purple-100 p-2 rounded-lg mr-3"><FaShieldHalved className="text-purple-600" /></div>
                                    <div>
                                        <span className="block text-sm font-bold text-gray-800">Quản trị viên dự án</span>
                                        <span className="block text-xs text-gray-500">Toàn quyền cấu hình dự án</span>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={staffForm.isTenantAdmin} onChange={(e) => setStaffForm({ ...staffForm, isTenantAdmin: e.target.checked })} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-2xl">
                            <button onClick={() => { setShowStaffModal(false); setTempPassword(null); }} className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                            {!tempPassword && (
                                <button onClick={saveStaff} className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm shadow-md shadow-blue-500/30 transition">
                                    {isEditingStaff ? 'Lưu thay đổi' : 'Tạo nhân sự'}
                                </button>
                            )}
                        </div>
                        {tempPassword && (
                            <div className="m-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start">
                                <FaCheck className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-green-800 mb-1">Tạo tài khoản thành công!</p>
                                    <p className="text-sm text-green-700">Mật khẩu tạm thời: <code className="px-2 py-1 bg-white border border-green-300 rounded text-blue-600 font-mono font-bold select-all">{tempPassword}</code></p>
                                    <p className="text-xs text-green-600 mt-1">Vui lòng sao chép và gửi cho nhân viên.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════ MODAL: DETAIL ══════════════ */}
            {showDetailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                            <button onClick={() => setShowDetailModal(false)} className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/30 rounded-full p-1 transition"><FaXmark /></button>
                        </div>
                        <div className="px-6 pb-6 relative">
                            <div className="flex justify-between items-end -mt-10 mb-4">
                                <img className="h-20 w-20 rounded-full border-4 border-white shadow-md object-cover" src={getAvatarUrl(selectedStaff)} alt="" />
                                {(hasPermission('EDIT_USER') || hasPermission('MANAGE_USER')) && (
                                    <button onClick={() => { setShowDetailModal(false); openEditStaffModal(selectedStaff); }}
                                        className="mb-1 px-4 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-full shadow-sm hover:bg-gray-50 flex items-center">
                                        <FaPen className="mr-1.5" /> Chỉnh sửa
                                    </button>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{selectedStaff.fullName}</h3>
                            <div className="flex items-center text-gray-500 text-sm mt-1 mb-5"><FaRegEnvelope className="mr-1.5" />{selectedStaff.email}</div>
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Vai trò</span>
                                    <div className="mt-1"><span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-sm font-semibold">{getRoleName(selectedStaff.role)}</span></div>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Trạng thái</span>
                                    <div className="mt-1 flex items-center">
                                        <div className={`h-2 w-2 rounded-full mr-2 ${selectedStaff.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        <span className="text-sm font-medium">{selectedStaff.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}</span>
                                    </div>
                                </div>
                                <div className="col-span-2 border-t border-gray-200" />
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Quyền Admin</span>
                                    <div className="mt-1 text-sm font-medium">
                                        {selectedStaff.isTenantAdmin ? <span className="text-purple-600 flex items-center"><FaCrown className="mr-1" /> Có</span> : <span className="text-gray-500">Không</span>}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Ngày tham gia</span>
                                    <div className="mt-1 text-sm font-medium text-gray-700">{new Date(selectedStaff.createdAt || Date.now()).toLocaleDateString('vi-VN')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Staff;
