import { useState, useEffect, useRef, useMemo } from 'react';
import Swal from 'sweetalert2';

// Import Icons
import {
    FaUsers, FaUserPlus, FaMagnifyingGlass, FaShieldHalved, FaPlus,
    FaPen, FaTrash, FaPenToSquare, FaEllipsisVertical, FaCrown,
    FaUserPen, FaXmark, FaCamera,
    FaCheck,
    FaCircleNotch
} from 'react-icons/fa6';
import { FaRegEnvelope, FaRegFolderOpen } from 'react-icons/fa';

const Staff = () => {
    // --- State Management ---
    const [apiUrl] = useState((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000'
        : 'https://aegism.online');

    const [activeTab, setActiveTab] = useState('staff'); // staff, roles
    const [currentPlan, setCurrentPlan] = useState('starter');
    const [user, setUser] = useState<any>({ name: 'Loading...', permissions: [] });

    // Data States
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [allStaff, setAllStaff] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Forms
    const [isEditingStaff, setIsEditingStaff] = useState(false);
    const [staffForm, setStaffForm] = useState<any>({ id: null, fullName: '', email: '', password: '', roleId: '', isTenantAdmin: false, status: 'active', projectId: '', avatar: '' });
    const [tempPassword, setTempPassword] = useState<string | null>(null);

    const [isEditingRole, setIsEditingRole] = useState(false);
    const [roleForm, setRoleForm] = useState<any>({ id: null, name: '', permissions: [] });

    const [selectedStaff, setSelectedStaff] = useState<any>({});
    const [errors, setErrors] = useState<any>({});

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null); // Để quản lý dropdown từng dòng

    // Config
    const plans: any = {
        starter: { limits: { users: 5 } },
        professional: { limits: { users: 50 } },
        enterprise: { limits: { users: 'unlimited' } }
    };

    const PERMISSIONS_LIST = {
        USER: ['CREATE_USER', 'VIEW_USERS', 'READ_USER', 'EDIT_USER', 'UPDATE_USER', 'DELETE_USER', 'MANAGE_USER'],
        PROJECT: ['CREATE_PROJECT', 'VIEW_PROJECTS', 'READ_PROJECT', 'EDIT_PROJECT', 'UPDATE_PROJECT', 'DELETE_PROJECT', 'MANAGE_PROJECT'],
        QR: ['CREATE_QR', 'VIEW_QR', 'EDIT_QR', 'DELETE_QR', 'SCAN_QR', 'MANAGE_QRCODE'],
        TASK: ['CREATE_TASK', 'VIEW_TASKS', 'READ_TASK', 'EDIT_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ASSIGN_TASK', 'COMPLETE_TASK', 'MANAGE_TASK'],
        REPORT: ['VIEW_REPORTS', 'EXPORT_REPORTS', 'VIEW_ANALYTICS', 'VIEW_AUDIT_LOGS', 'VIEW_SCAN_LOGS', 'MANAGE_SCAN_LOGS'],
        SYSTEM: ['MANAGE_SYSTEM', 'MANAGE_TENANT_SETTINGS', 'VIEW_TENANT_SETTINGS', 'MANAGE_SUBSCRIPTION', 'CREATE_ROLE', 'VIEW_ROLES', 'MANAGE_ROLE']
    };

    // --- Effects ---
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

        // Close dropdown when clicking outside
        const handleClickOutside = () => setDropdownOpenId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            changeProject();
        }
    }, [selectedProjectId]);

    // --- Helpers ---
    const updateUserUI = (u: any) => {
        let permissions: string[] = [];
        if (u.isSuperAdmin || u.isTenantAdmin) permissions = ['ALL'];
        else if (u.role) {
            try {
                permissions = Array.isArray(u.role.permissions) ? u.role.permissions : JSON.parse(u.role.permissions);
            } catch { permissions = []; }
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
        if (!hasPermission(perm)) {
            Swal.fire({ icon: 'error', title: 'Truy cập bị từ chối', text: 'Bạn không có quyền thực hiện chức năng này.' });
            return false;
        }
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
        try { return JSON.parse(permStr); } catch (e) { return permStr.split(',').map((p: string) => p.trim()); }
    };

    const getRoleName = (role: any) => role ? role.name : 'Chưa gán';

    const canAddUser = useMemo(() => {
        const limit = plans[currentPlan]?.limits?.users;
        if (limit === 'unlimited') return true;
        return allStaff.length < limit;
    }, [allStaff, currentPlan, plans]);

    const filteredStaff = useMemo(() => {
        if (!searchQuery) return allStaff;
        const lowerQuery = searchQuery.toLowerCase();
        return allStaff.filter(s =>
            s.fullName?.toLowerCase().includes(lowerQuery) ||
            s.email?.toLowerCase().includes(lowerQuery)
        );
    }, [allStaff, searchQuery]);

    // --- Validations ---
    const validateInput = (value: string, type: string) => {
        if (!value || (typeof value === 'string' && !value.trim())) return 'Không được để trống.';
        const nameRegex = /^[a-zA-Z0-9\s\u00C0-\u1EF9]+$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (type === 'name' && !nameRegex.test(value)) return 'Không được chứa ký tự đặc biệt.';
        if (type === 'email' && !emailRegex.test(value)) return 'Email không hợp lệ.';
        if (type === 'password' && value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.';
        return null;
    };

    const validateStaffForm = () => {
        const newErrors: any = {};
        let isValid = true;

        const nameError = validateInput(staffForm.fullName, 'name');
        if (nameError) { newErrors.fullName = nameError; isValid = false; }

        const emailError = validateInput(staffForm.email, 'email');
        if (emailError) { newErrors.email = emailError; isValid = false; }

        if (!isEditingStaff) {
            const passError = validateInput(staffForm.password, 'password');
            if (passError) { newErrors.password = passError; isValid = false; }
        }

        if (!staffForm.roleId) { newErrors.roleId = 'Vui lòng chọn vai trò.'; isValid = false; }

        setErrors(newErrors);
        return isValid;
    };

    const validateRoleForm = () => {
        const newErrors: any = {};
        let isValid = true;
        const roleNameError = validateInput(roleForm.name, 'name');
        if (roleNameError) { newErrors.roleName = roleNameError; isValid = false; }
        setErrors(newErrors);
        return isValid;
    };

    // --- API Calls ---
    const fetchUserProfile = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/users/profile`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) {
                const u = await res.json();
                localStorage.setItem('user', JSON.stringify(u));
                updateUserUI(u);
            }
        } catch (e) { console.error(e); }
    };

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/projects`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
                if (data.length > 0 && !selectedProjectId) {
                    setSelectedProjectId(data[0].id);
                }
            }
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const changeProject = () => {
        if (selectedProjectId) {
            fetchStaff();
            fetchRoles();
        }
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
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    // --- Staff Actions ---
    const openAddStaffModal = () => {
        if (!checkPermissionAction('CREATE_USER') && !checkPermissionAction('MANAGE_USER')) return;
        if (!selectedProjectId) { Swal.fire('Thông báo', 'Vui lòng chọn dự án trước', 'info'); return; }
        setIsEditingStaff(false);
        setTempPassword(null);
        setStaffForm({ fullName: '', email: '', password: '', roleId: '', isTenantAdmin: false, status: 'active', projectId: selectedProjectId, avatar: '' });
        setErrors({});
        setShowStaffModal(true);
    };

    const openEditStaffModal = (staff: any) => {
        if (!hasPermission('EDIT_USER') && !hasPermission('UPDATE_USER') && !hasPermission('MANAGE_USER')) return Swal.fire({ icon: 'error', title: 'Từ chối', text: 'Bạn không có quyền sửa nhân sự.' });
        setIsEditingStaff(true);
        setTempPassword(null);
        setStaffForm({ ...staff, password: '', roleId: staff.role ? staff.role.id : '', projectId: selectedProjectId, avatar: getAvatarUrl(staff) });
        setErrors({});
        setShowStaffModal(true);
    };

    const saveStaff = async () => {
        if (!validateStaffForm()) return;
        const url = isEditingStaff ? `${apiUrl}/api/members/${staffForm.id}` : `${apiUrl}/api/members`;
        const method = isEditingStaff ? 'PUT' : 'POST';
        const payload = { ...staffForm };
        if (isEditingStaff && payload.avatar && payload.avatar.startsWith('http')) delete payload.avatar;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                if (!isEditingStaff && data.temporaryPassword) {
                    setTempPassword(data.temporaryPassword);
                    fetchStaff();
                    Swal.fire({ icon: 'success', title: 'Tạo thành công', text: 'Đã tạo tài khoản nhân viên.', timer: 1500, showConfirmButton: false });
                } else {
                    Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã cập nhật thông tin.', timer: 1500, showConfirmButton: false });
                    setShowStaffModal(false);
                    fetchStaff();
                }
            } else { Swal.fire('Lỗi', data.message || "Không thể lưu", 'error'); }
        } catch (e) { Swal.fire('Lỗi', 'Lỗi kết nối server.', 'error'); }
    };

    const deleteStaff = async (id: string) => {
        if (!checkPermissionAction('DELETE_USER') && !checkPermissionAction('MANAGE_USER')) return;
        const result = await Swal.fire({ title: 'Xóa nhân sự?', text: "Nhân viên sẽ bị xóa khỏi dự án này.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#EF4444', confirmButtonText: 'Xóa ngay', cancelButtonText: 'Hủy' });
        if (!result.isConfirmed) return;
        try {
            const res = await fetch(`${apiUrl}/api/members/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) { Swal.fire('Đã xóa!', 'Nhân sự đã được xóa thành công.', 'success'); fetchStaff(); }
            else { const err = await res.json(); Swal.fire('Lỗi', err.message || res.statusText, 'error'); }
        } catch (e) { Swal.fire('Lỗi', 'Lỗi kết nối đến Server.', 'error'); }
    };

    const handleFileUpload = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return Swal.fire('Lỗi', 'Ảnh quá lớn (>2MB)', 'warning');
        const reader = new FileReader();
        reader.onload = (ev: any) => { setStaffForm({ ...staffForm, avatar: ev.target.result }); };
        reader.readAsDataURL(file);
    };

    // --- Role Actions ---
    const openRoleModal = () => {
        if (!checkPermissionAction('CREATE_ROLE')) return;
        setIsEditingRole(false); setRoleForm({ name: '', permissions: [] }); setErrors({}); setShowRoleModal(true);
    };

    const openEditRoleModal = (role: any) => {
        if (!hasPermission('MANAGE_ROLE') && !hasPermission('EDIT_ROLE')) return Swal.fire({ icon: 'error', title: 'Từ chối', text: 'Bạn không có quyền sửa vai trò.' });
        setIsEditingRole(true);
        setRoleForm({ id: role.id, name: role.name, permissions: parsePermissions(role.permissions) });
        setErrors({});
        setShowRoleModal(true);
    };

    const saveRole = async () => {
        if (!validateRoleForm()) return;
        const payload = { ...roleForm, projectId: selectedProjectId };
        const url = isEditingRole ? `${apiUrl}/api/roles/${roleForm.id}` : `${apiUrl}/api/roles`;
        const method = isEditingRole ? 'PUT' : 'POST';
        try {
            await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify(payload) });
            Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã lưu thông tin vai trò.', timer: 1500, showConfirmButton: false });
            setShowRoleModal(false); fetchRoles();
        } catch (e) { Swal.fire('Lỗi', 'Không thể kết nối máy chủ', 'error'); }
    };

    const deleteRole = async (id: string) => {
        if (!checkPermissionAction('DELETE_ROLE') && !checkPermissionAction('MANAGE_ROLE')) return;
        const result = await Swal.fire({ title: 'Xóa vai trò?', text: "Hành động này không thể hoàn tác!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#EF4444', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' });
        if (!result.isConfirmed) return;
        try {
            await fetch(`${apiUrl}/api/roles/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            Swal.fire('Đã xóa!', 'Vai trò đã bị xóa.', 'success'); fetchRoles();
        } catch (e) { Swal.fire('Lỗi', 'Lỗi kết nối', 'error'); }
    };

    const handleRolePermissionChange = (perm: string) => {
        const currentPerms = [...roleForm.permissions];
        if (currentPerms.includes(perm)) {
            setRoleForm({ ...roleForm, permissions: currentPerms.filter(p => p !== perm) });
        } else {
            setRoleForm({ ...roleForm, permissions: [...currentPerms, perm] });
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 h-full font-sans text-gray-800">
            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 m-6">
                <div className="flex items-center w-full md:w-auto">
                    <div className="relative w-full md:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaMagnifyingGlass className="text-gray-400" />
                        </div>
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="block w-full pl-10 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-opsera-primary focus:border-opsera-primary sm:text-sm rounded-lg bg-gray-50"
                        >
                            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaMagnifyingGlass className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm nhân sự..."
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-opsera-primary sm:text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200 px-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('staff')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center transition-colors ${activeTab === 'staff' ? 'border-opsera-primary text-opsera-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        <FaUsers className="mr-2" /> Danh sách Nhân sự
                    </button>
                    <button
                        onClick={() => setActiveTab('roles')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center transition-colors ${activeTab === 'roles' ? 'border-opsera-primary text-opsera-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        <FaShieldHalved className="mr-2" /> Quản lý Vai trò & Quyền hạn
                    </button>
                </nav>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex justify-center items-center py-10">
                    <FaCircleNotch className="animate-spin h-10 w-10 text-opsera-primary" />
                </div>
            )}

            {/* --- TAB: STAFF --- */}
            {activeTab === 'staff' && selectedProjectId && !isLoading && (
                <div className="px-6 pb-6">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Đội ngũ Dự án</h3>
                            <p className="text-sm text-gray-500">Quản lý thành viên và phân quyền truy cập.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-sm bg-blue-50 text-opsera-primary px-3 py-1.5 rounded-full font-medium">
                                {filteredStaff.length} Thành viên
                            </div>
                            {(hasPermission('CREATE_USER') || hasPermission('MANAGE_USER')) && (
                                <button
                                    onClick={openAddStaffModal}
                                    disabled={!canAddUser}
                                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all transform active:scale-95 ${canAddUser ? 'bg-opsera-primary hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                >
                                    <FaUserPlus className="mr-2" /> Thêm Nhân sự
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thông tin Nhân viên</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vai trò</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày tham gia</th>
                                    <th className="px-6 py-4 relative"><span className="sr-only">Hành động</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStaff.map((staff: any) => (
                                    <tr key={staff.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => { setSelectedStaff(staff); setShowDetailModal(true); }}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 relative">
                                                    <img className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm" src={getAvatarUrl(staff)} alt="" />
                                                    {staff.isTenantAdmin && (
                                                        <div className="absolute -bottom-1 -right-1 bg-purple-600 rounded-full p-0.5 border-2 border-white" title="Quản trị viên">
                                                            <FaCrown className="text-[10px] text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{staff.fullName}</div>
                                                    <div className="text-sm text-gray-500">{staff.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                                {getRoleName(staff.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`h-2.5 w-2.5 rounded-full mr-2 ${staff.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-400'}`}></div>
                                                <span className="text-sm text-gray-700 font-medium">{staff.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(staff.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                            <div className="relative">
                                                <button onClick={(e) => { e.stopPropagation(); setDropdownOpenId(dropdownOpenId === staff.id ? null : staff.id); }} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                                                    <FaEllipsisVertical />
                                                </button>
                                                {dropdownOpenId === staff.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-100 origin-top-right">
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
                                {filteredStaff.length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">Chưa tìm thấy nhân sự phù hợp.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- TAB: ROLES --- */}
            {activeTab === 'roles' && selectedProjectId && !isLoading && (
                <div className="px-6 pb-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-opsera-dark">Vai trò & Quyền hạn</h3>
                            <p className="text-sm text-gray-500">Định nghĩa các nhóm quyền để gán cho nhân viên.</p>
                        </div>

                        {(hasPermission('MANAGE_ROLE') || hasPermission('CREATE_ROLE')) && (
                            <button onClick={openRoleModal} className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium shadow-sm transition-colors">
                                <FaPlus className="mr-2 text-gray-500" /> Tạo Vai trò Mới
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roles.map((role: any) => (
                            <div key={role.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md hover:border-opsera-primary transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-lg bg-blue-50 text-opsera-primary flex items-center justify-center mr-3">
                                            <FaShieldHalved />
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-800">{role.name}</h4>
                                    </div>

                                    {hasPermission('MANAGE_ROLE') && (
                                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditRoleModal(role)} className="p-1.5 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-md hover:bg-blue-50"><FaPen /></button>
                                            <button onClick={() => deleteRole(role.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 rounded-md hover:bg-red-50"><FaTrash /></button>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 rounded-lg p-3 h-28 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 border border-gray-100 custom-scrollbar">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">Quyền được cấp:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {parsePermissions(role.permissions).map((perm: string) => (
                                            <span key={perm} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600 shadow-sm">{perm}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {roles.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                <div className="text-gray-400 mb-2"><FaRegFolderOpen className="text-3xl" /></div>
                                <span className="text-gray-500 font-medium">Chưa có vai trò nào được tạo.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!selectedProjectId && (
                <div className="text-center py-24 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <i className="fa-solid fa-arrow-pointer text-3xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Chọn Dự án để Quản lý</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">Vui lòng chọn một dự án từ menu phía trên để xem danh sách nhân viên và cấu hình quyền hạn.</p>
                </div>
            )}

            {/* --- MODAL: ROLE FORM --- */}
            {showRoleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto">
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowRoleModal(false)}></div>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl relative z-10 transform transition-all my-8 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
                            <h3 className="text-lg font-bold text-gray-900">{isEditingRole ? 'Chỉnh sửa Vai trò' : 'Tạo Vai trò Mới'}</h3>
                            <button onClick={() => setShowRoleModal(false)} className="text-gray-400 hover:text-gray-500">
                                <FaXmark className="text-xl" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tên Vai trò <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={roleForm.name}
                                    onChange={(e) => { setRoleForm({ ...roleForm, name: e.target.value }); setErrors({ ...errors, roleName: null }); }}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-shadow ${errors.roleName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                                    placeholder="Ví dụ: Giám sát viên"
                                />
                                {errors.roleName && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.roleName}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">Phân quyền</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <h5 className="font-bold text-gray-800 text-sm mb-2 border-b pb-1">Quản lý Người dùng</h5>
                                        <div className="space-y-1">
                                            {PERMISSIONS_LIST.USER.map(perm => (
                                                <label key={perm} className="flex items-center text-sm cursor-pointer hover:text-blue-600">
                                                    <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" checked={roleForm.permissions.includes(perm)} onChange={() => handleRolePermissionChange(perm)} />
                                                    <span className="ml-2 truncate">{perm}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <h5 className="font-bold text-gray-800 text-sm mb-2 border-b pb-1">Quản lý Dự án</h5>
                                        <div className="space-y-1">
                                            {PERMISSIONS_LIST.PROJECT.map(perm => (
                                                <label key={perm} className="flex items-center text-sm cursor-pointer hover:text-blue-600">
                                                    <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" checked={roleForm.permissions.includes(perm)} onChange={() => handleRolePermissionChange(perm)} />
                                                    <span className="ml-2 truncate">{perm}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <h5 className="font-bold text-gray-800 text-sm mb-2 border-b pb-1">Mã QR</h5>
                                        <div className="space-y-1">
                                            {PERMISSIONS_LIST.QR.map(perm => (
                                                <label key={perm} className="flex items-center text-sm cursor-pointer hover:text-blue-600">
                                                    <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" checked={roleForm.permissions.includes(perm)} onChange={() => handleRolePermissionChange(perm)} />
                                                    <span className="ml-2 truncate">{perm}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    {/* ... Các nhóm quyền khác tương tự ... */}
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <h5 className="font-bold text-gray-800 text-sm mb-2 border-b pb-1">Công việc</h5>
                                        <div className="space-y-1">
                                            {PERMISSIONS_LIST.TASK.map(perm => (
                                                <label key={perm} className="flex items-center text-sm cursor-pointer hover:text-blue-600">
                                                    <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" checked={roleForm.permissions.includes(perm)} onChange={() => handleRolePermissionChange(perm)} />
                                                    <span className="ml-2 truncate">{perm}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Report & System permissions... */}
                                </div>
                                <div className="mt-4 flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                                    <span className="text-sm font-semibold text-gray-600">Tổng quyền đã chọn:</span>
                                    <span className="text-lg font-bold text-opsera-primary">{roleForm.permissions.length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3 rounded-b-xl shrink-0">
                            <button onClick={() => setShowRoleModal(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">Hủy</button>
                            <button onClick={saveRole} className="px-4 py-2 bg-opsera-primary text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-md shadow-blue-500/30 transition-all transform active:scale-95">
                                {isEditingRole ? 'Lưu thay đổi' : 'Tạo mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL: STAFF FORM --- */}
            {showStaffModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto">
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={() => setShowStaffModal(false)}></div>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative z-10 transform transition-all my-8">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <span className="bg-blue-100 text-opsera-primary p-1.5 rounded-lg mr-3"><FaUserPen /></span>
                                <span>{isEditingStaff ? 'Cập nhật Thông tin' : 'Thêm Nhân sự Mới'}</span>
                            </h3>
                            <button onClick={() => setShowStaffModal(false)} className="text-gray-400 hover:text-gray-500 transition-colors">
                                <FaXmark className="text-xl" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Họ và Tên <span className="text-red-500">*</span></label>
                                    <input type="text" value={staffForm.fullName} onChange={(e) => { setStaffForm({ ...staffForm, fullName: e.target.value }); setErrors({ ...errors, fullName: null }); }}
                                        className={`w-full pl-4 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${errors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} placeholder="Nhập tên nhân viên" />
                                    {errors.fullName && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.fullName}</p>}
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                                    <input type="email" value={staffForm.email} onChange={(e) => { setStaffForm({ ...staffForm, email: e.target.value }); setErrors({ ...errors, email: null }); }}
                                        disabled={isEditingStaff}
                                        className={`w-full pl-4 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} placeholder="email@example.com" />
                                    {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email}</p>}
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Ảnh đại diện</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                            <img src={staffForm.avatar ? (staffForm.avatar.startsWith('data:') ? staffForm.avatar : apiUrl + staffForm.avatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(staffForm.fullName || 'User')}&background=random&size=128`}
                                                className="h-16 w-16 rounded-full border-2 border-gray-200 object-cover group-hover:border-blue-500 transition-colors" alt="Avatar Upload" />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all">
                                                <FaCamera className="text-white opacity-0 group-hover:opacity-100" />
                                            </div>
                                        </div>
                                        <div>
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                                                Chọn ảnh
                                            </button>
                                            <p className="text-xs text-gray-500 mt-1">JPG, PNG hoặc GIF (Max 2MB)</p>
                                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                                        </div>
                                    </div>
                                </div>

                                {!isEditingStaff && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                                        <input type="password" value={staffForm.password} onChange={(e) => { setStaffForm({ ...staffForm, password: e.target.value }); setErrors({ ...errors, password: null }); }}
                                            className={`w-full pl-4 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} placeholder="••••••••" />
                                        {errors.password && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.password}</p>}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Vai trò <span className="text-red-500">*</span></label>
                                    <select value={staffForm.roleId} onChange={(e) => { setStaffForm({ ...staffForm, roleId: e.target.value }); setErrors({ ...errors, roleId: null }); }}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 bg-white ${errors.roleId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}>
                                        <option value="" disabled>-- Chọn vai trò --</option>
                                        {roles.map((role: any) => <option key={role.id} value={role.id}>{role.name}</option>)}
                                    </select>
                                    {errors.roleId && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.roleId}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Trạng thái</label>
                                    <select value={staffForm.status} onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                                        <option value="active">Hoạt động</option>
                                        <option value="inactive">Tạm dừng</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <div className="flex items-center">
                                    <div className="bg-purple-100 p-2 rounded-lg mr-3">
                                        <FaShieldHalved className="text-purple-600" />
                                    </div>
                                    <div>
                                        <span className="block text-sm font-bold text-gray-800">Quản trị viên dự án</span>
                                        <span className="block text-xs text-gray-500">Cho phép truy cập toàn quyền cấu hình dự án</span>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={staffForm.isTenantAdmin} onChange={(e) => setStaffForm({ ...staffForm, isTenantAdmin: e.target.checked })} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3 rounded-b-xl">
                            <button onClick={() => { setShowStaffModal(false); setTempPassword(null); }} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">Hủy</button>
                            {!tempPassword && (
                                <button onClick={saveStaff} className="px-6 py-2 bg-opsera-primary text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-md shadow-blue-500/30 transition-all transform active:scale-95 flex items-center">
                                    {isEditingStaff ? 'Lưu thay đổi' : 'Tạo nhân sự'}
                                </button>
                            )}
                        </div>

                        {tempPassword && (
                            <div className="m-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start">
                                <FaCheck className="text-green-500 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-green-800 mb-1">Tạo tài khoản thành công!</p>
                                    <p className="text-sm text-green-700">Mật khẩu tạm thời: <code className="px-2 py-1 bg-white border border-green-300 rounded text-blue-600 font-mono font-bold select-all">{tempPassword}</code></p>
                                    <p className="text-xs text-green-600 mt-1">Vui lòng sao chép mật khẩu này và gửi cho nhân viên.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- MODAL: DETAIL --- */}
            {showDetailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto">
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={() => setShowDetailModal(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 transform transition-all my-8 overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                            <button onClick={() => setShowDetailModal(false)} className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/30 rounded-full p-1 transition-colors">
                                <FaXmark />
                            </button>
                        </div>

                        <div className="px-6 pb-6 relative">
                            <div className="flex justify-between items-end -mt-10 mb-4">
                                <img className="h-20 w-20 rounded-full border-4 border-white shadow-md bg-white object-cover" src={getAvatarUrl(selectedStaff)} alt="" />

                                {(hasPermission('EDIT_USER') || hasPermission('MANAGE_USER')) && (
                                    <button onClick={() => { setShowDetailModal(false); openEditStaffModal(selectedStaff); }}
                                        className="mb-1 px-4 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-full shadow-sm hover:bg-gray-50 flex items-center">
                                        <FaPen className="mr-1.5" /> Chỉnh sửa
                                    </button>
                                )}
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900">{selectedStaff.fullName}</h3>
                                <div className="flex items-center text-gray-500 text-sm mt-1">
                                    <FaRegEnvelope className="mr-1.5" />
                                    <span>{selectedStaff.email}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <div className="col-span-2 sm:col-span-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Vai trò</span>
                                    <div className="mt-1 flex items-center">
                                        <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-sm font-semibold">{getRoleName(selectedStaff.role)}</span>
                                    </div>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Trạng thái</span>
                                    <div className="mt-1 flex items-center">
                                        <div className={`h-2 w-2 rounded-full mr-2 ${selectedStaff.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        <span className="text-sm font-medium text-gray-700">{selectedStaff.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}</span>
                                    </div>
                                </div>
                                <div className="col-span-2 border-t border-gray-200 my-1"></div>
                                <div className="col-span-2 sm:col-span-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Quyền Admin</span>
                                    <div className="mt-1 text-sm font-medium text-gray-700">
                                        {selectedStaff.isTenantAdmin ? (
                                            <span className="text-purple-600 flex items-center"><FaCrown className="mr-1" /> Có</span>
                                        ) : (
                                            <span className="text-gray-500">Không</span>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
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