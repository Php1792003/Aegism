import { useState, useEffect, useRef, useMemo } from 'react';
import Swal from 'sweetalert2';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

// Import các icon tương ứng từ FontAwesome 6 trong React Icons
import {
    FaMagnifyingGlass, FaPlus, FaLocationDot, FaQrcode, FaUsers,
    FaCircleInfo, FaLayerGroup, FaSignal, FaCalendarPlus, FaClockRotateLeft,
    FaXmark, FaRegImage, FaCropSimple, FaComputerMouse, FaChevronDown,
    FaRegFolderOpen, FaTrash
} from 'react-icons/fa6';

const Projects = () => {
    // --- State Management ---
    const [apiUrl] = useState((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000'
        : 'https://aegism.online');

    const [currentPlan, setCurrentPlan] = useState('starter');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [user, setUser] = useState<any>({ name: 'Loading...', email: '', avatar: '', roleName: 'User', isSuperAdmin: false, isTenantAdmin: false, permissions: [] });

    // Modals state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCropModal, setShowCropModal] = useState(false);

    // Data state
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<any>({});
    const [editingProject, setEditingProject] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<any>({});

    // Cropper state
    const [tempCropImage, setTempCropImage] = useState('');
    const imageRef = useRef<HTMLImageElement>(null);
    const cropperRef = useRef<Cropper | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Plans Configuration
    const plans: any = {
        starter: { limits: { projects: 1 } },
        professional: { limits: { projects: 5 } },
        enterprise: { limits: { projects: 'unlimited' } }
    };

    // --- Effects ---
    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                window.location.href = '/login'; // Chuyển hướng nếu chưa login
                return;
            }

            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    updateUserUI(u);
                } catch (e) { console.error("Error parsing stored user"); }
            }

            await fetchUserProfile();
            await fetchProjects();
        };

        init();

        // Cleanup cropper on unmount
        return () => {
            if (cropperRef.current) {
                cropperRef.current.destroy();
            }
        };
    }, []);

    useEffect(() => {
        if (showCropModal && imageRef.current) {
            if (cropperRef.current) cropperRef.current.destroy();

            cropperRef.current = new Cropper(imageRef.current, {
                aspectRatio: 16 / 9,
                viewMode: 1,
                autoCropArea: 1,
                dragMode: 'move',
                guides: true,
                background: false
            } as any);
        }
    }, [showCropModal, tempCropImage]);

    // --- Helper Functions ---
    const updateUserUI = (u: any) => {
        let roleDisplay = 'Nhân viên';
        let permissions: string[] = [];
        const isSuper = u.isSuperAdmin === true || u.isSuperAdmin === 'true' || u.isSuperAdmin === 1;
        const isTenant = u.isTenantAdmin === true || u.isTenantAdmin === 'true' || u.isTenantAdmin === 1;

        if (isSuper) { roleDisplay = 'Super Admin'; permissions = ['ALL']; }
        else if (isTenant) { roleDisplay = 'Quản trị viên'; permissions = ['ALL']; }
        else if (u.role) {
            roleDisplay = u.role.name;
            try {
                if (Array.isArray(u.role.permissions)) permissions = u.role.permissions;
                else if (typeof u.role.permissions === 'string') {
                    try { permissions = JSON.parse(u.role.permissions); }
                    catch { permissions = u.role.permissions.split(',').map((p: string) => p.trim()); }
                }
            } catch (e) { permissions = []; }
        }

        let avatarUrl = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}&background=2563EB&color=fff`;
        if (avatarUrl.startsWith('/uploads')) avatarUrl = `${apiUrl}${avatarUrl}`;

        setUser({
            id: u.id, name: u.fullName || 'User', email: u.email, avatar: avatarUrl,
            roleName: roleDisplay, isSuperAdmin: isSuper, isTenantAdmin: isTenant, permissions: permissions
        });

        if (u.tenant) setCurrentPlan(u.tenant.subscriptionPlan?.toLowerCase() || 'starter');
    };

    const hasPermission = (perm: string) => {
        if (user.isSuperAdmin || user.isTenantAdmin) return true;
        if (user.permissions.includes('ALL')) return true;
        return user.permissions.includes(perm);
    };

    const checkPermissionAction = (perm: string) => {
        if (!hasPermission(perm)) {
            Swal.fire({
                icon: 'error',
                title: 'Truy cập bị từ chối',
                text: 'Bạn không có quyền thực hiện chức năng này.'
            });
            return false;
        }
        return true;
    };

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
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${apiUrl}/api/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) { console.error('Lỗi kết nối:', error); }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'active': return { class: 'bg-green-500 text-white', text: 'Hoạt động', bgLight: 'bg-green-100', textLight: 'text-green-800' };
            case 'maintenance': return { class: 'bg-yellow-500 text-white', text: 'Bảo trì', bgLight: 'bg-yellow-100', textLight: 'text-yellow-800' };
            case 'inactive': return { class: 'bg-red-500 text-white', text: 'Dừng', bgLight: 'bg-red-100', textLight: 'text-red-800' };
            default: return { class: 'bg-gray-500 text-white', text: 'N/A', bgLight: 'bg-gray-100', textLight: 'text-gray-800' };
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getLimitText = (type: string) => {
        const limit = plans[currentPlan]?.limits[type];
        return limit === 'unlimited' ? '∞' : limit;
    };

    // --- Computed Properties ---
    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const name = project.name || '';
            const address = project.address || '';
            const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                address.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [projects, searchQuery, filterStatus]);

    const canAddProject = useMemo(() => {
        const limit = plans[currentPlan]?.limits?.projects;
        if (limit === 'unlimited') return true;
        return projects.length < limit;
    }, [projects, currentPlan, plans]);

    // --- Action Handlers ---
    const createNewProject = () => {
        if (!checkPermissionAction('CREATE_PROJECT')) return;
        if (!canAddProject) {
            Swal.fire({ icon: 'warning', title: 'Giới hạn gói', text: `Bạn đã đạt giới hạn gói ${currentPlan.toUpperCase()}.` });
            return;
        }
        setEditingProject({ name: '', description: '', address: '', status: 'active', image: '' });
        setErrors({});
        setShowEditModal(true);
    };

    const openDetail = (project: any) => {
        if (!checkPermissionAction('VIEW_PROJECT')) return;
        setSelectedProject(project);
        setShowDetailModal(true);
    };

    const openEdit = (project: any) => {
        if (!hasPermission('UPDATE_PROJECT') && !hasPermission('EDIT_PROJECT') && !hasPermission('MANAGE_PROJECT')) {
            Swal.fire({ icon: 'error', title: 'Truy cập bị từ chối', text: 'Bạn không có quyền sửa dự án.' });
            return;
        }
        setEditingProject(JSON.parse(JSON.stringify(project)));
        setErrors({});
        setShowEditModal(true);
    };

    const deleteProject = async (project: any) => {
        if (!checkPermissionAction('DELETE_PROJECT') && !checkPermissionAction('MANAGE_PROJECT')) return;

        const result = await Swal.fire({
            title: 'Bạn có chắc chắn?',
            text: `Xóa dự án "${project.name}" sẽ xóa tất cả dữ liệu liên quan!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Vâng, xóa nó!',
            cancelButtonText: 'Hủy bỏ',
            confirmButtonColor: '#EF4444'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await fetch(`${apiUrl}/api/projects/${project.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    setProjects(projects.filter(p => p.id !== project.id));
                    Swal.fire('Đã xóa!', 'Dự án đã được xóa thành công.', 'success');
                } else {
                    const err = await res.json();
                    Swal.fire('Lỗi', err.message || res.statusText, 'error');
                }
            } catch (error) {
                Swal.fire('Lỗi kết nối', 'Không thể kết nối đến máy chủ.', 'error');
            }
        }
    };

    const handleImageUpload = (event: any) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                setTempCropImage(e.target.result);
                setShowCropModal(true);
            };
            reader.readAsDataURL(file);
            event.target.value = '';
        }
    };

    const saveCrop = () => {
        if (cropperRef.current) {
            const canvas = (cropperRef.current as any).getCroppedCanvas({ width: 800 });

            setEditingProject({ ...editingProject, image: canvas.toDataURL('image/jpeg', 0.9) });
            cancelCrop();
        }
    };

    const cancelCrop = () => {
        setShowCropModal(false);
        setTempCropImage('');
        if (cropperRef.current) {
            cropperRef.current.destroy();
            cropperRef.current = null;
        }
    };

    const validateForm = () => {
        const newErrors: any = {};
        let isValid = true;
        const specialCharRegex = /^[a-zA-Z0-9\s\u00C0-\u1EF9]+$/;

        if (!editingProject.name || !editingProject.name.trim()) {
            newErrors.name = 'Tên dự án không được để trống.';
            isValid = false;
        } else if (editingProject.name.length < 3) {
            newErrors.name = 'Tên dự án phải có ít nhất 3 ký tự.';
            isValid = false;
        } else if (editingProject.name.length > 100) {
            newErrors.name = 'Tên dự án không được vượt quá 100 ký tự.';
            isValid = false;
        } else if (!specialCharRegex.test(editingProject.name)) {
            newErrors.name = 'Tên dự án không được chứa ký tự đặc biệt (@, #, $, ...).';
            isValid = false;
        }

        if (editingProject.address && editingProject.address.length > 200) {
            newErrors.address = 'Địa chỉ không được vượt quá 200 ký tự.';
            isValid = false;
        }
        if (editingProject.description && editingProject.description.length > 500) {
            newErrors.description = 'Mô tả không được vượt quá 500 ký tự.';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const saveProject = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        const token = localStorage.getItem('accessToken');
        const isUpdate = !!editingProject.id;
        const url = isUpdate
            ? `${apiUrl}/api/projects/${editingProject.id}`
            : `${apiUrl}/api/projects`;
        const method = isUpdate ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editingProject)
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công',
                    text: isUpdate ? 'Cập nhật thành công!' : 'Tạo dự án thành công!',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowEditModal(false);
                fetchProjects();
            } else {
                const err = await res.json();
                Swal.fire({ icon: 'error', title: 'Lỗi', text: err.message || res.statusText });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Lỗi kết nối', text: 'Có lỗi xảy ra khi lưu dữ liệu.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 h-full font-sans text-gray-800">
            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">

                {/* Search & Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="flex flex-1 w-full sm:w-auto space-x-4">
                        <div className="relative w-full sm:w-64">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <FaMagnifyingGlass className="text-gray-400" />
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm dự án..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opsera-primary focus:border-transparent shadow-sm"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opsera-primary shadow-sm"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Đang hoạt động</option>
                            <option value="maintenance">Bảo trì</option>
                            <option value="inactive">Dừng</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 mr-2">
                            Đã dùng: <span className="font-bold text-gray-800">{projects.length}</span> / <span>{getLimitText('projects')}</span>
                        </span>

                        {(hasPermission('CREATE_PROJECT') || hasPermission('MANAGE_PROJECT')) && (
                            <button
                                onClick={createNewProject}
                                disabled={!canAddProject}
                                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:-translate-y-0.5 ${canAddProject ? 'bg-opsera-primary hover:bg-blue-700 text-white shadow-md hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                            >
                                <FaPlus className="mr-2" />
                                Thêm Dự án
                            </button>
                        )}
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project: any) => (
                        <div key={project.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full group">
                            <div className="h-48 bg-gray-100 w-full relative shrink-0 overflow-hidden">
                                <img src={project.image || 'https://via.placeholder.com/800x400?text=No+Image'} alt="Project Image" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute top-3 right-3 z-10">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full text-white shadow-md backdrop-blur-sm ${getStatusInfo(project.status).class}`}>
                                        {getStatusInfo(project.status).text}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="text-lg font-bold text-gray-800 mb-1 truncate group-hover:text-opsera-primary transition-colors">{project.name}</h3>
                                <div className="flex items-center text-sm text-gray-500 mb-4">
                                    <FaLocationDot className="mr-1 shrink-0 text-gray-400" />
                                    <span className="truncate">{project.address || 'Chưa có địa chỉ'}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-auto">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Điểm quét</p>
                                        <p className="font-bold text-gray-800 flex items-center mt-1">
                                            <FaQrcode className="text-purple-500 mr-1.5" />
                                            <span>{project.qrCount || 0}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Nhân sự</p>
                                        <p className="font-bold text-gray-800 flex items-center mt-1">
                                            <FaUsers className="text-blue-500 mr-1.5" />
                                            <span>{project.staffCount || 0}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 flex space-x-3">
                                    <button onClick={() => openDetail(project)} className="flex-1 py-2 px-3 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 transition-all">
                                        Chi tiết
                                    </button>

                                    {(hasPermission('UPDATE_PROJECT') || hasPermission('EDIT_PROJECT') || hasPermission('MANAGE_PROJECT')) && (
                                        <button onClick={() => openEdit(project)} className="flex-1 py-2 px-3 rounded-lg bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 hover:text-blue-700 transition-all">
                                            Cấu hình
                                        </button>
                                    )}

                                    {(hasPermission('DELETE_PROJECT') || hasPermission('MANAGE_PROJECT')) && (
                                        <button onClick={() => deleteProject(project)} className="py-2 px-3 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 hover:text-red-700 transition-all">
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredProjects.length === 0 && (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 text-gray-400">
                            <FaRegFolderOpen className="text-3xl" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Không tìm thấy dự án nào</h3>
                        <p className="mt-1 text-gray-500">Hãy thử thay đổi bộ lọc hoặc tạo dự án mới.</p>
                    </div>
                )}
            </main>

            {/* --- DETAIL MODAL --- */}
            {showDetailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6 sm:px-0">
                    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" onClick={() => setShowDetailModal(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl transform transition-all sm:max-w-2xl w-full relative z-10 overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                        <div className="relative h-48 sm:h-56 bg-gray-200 shrink-0">
                            <img src={selectedProject.image || 'https://via.placeholder.com/800x400?text=No+Image'} className="w-full h-full object-cover" alt="Detail" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                            <button onClick={() => setShowDetailModal(false)} className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-md transition-colors">
                                <FaXmark />
                            </button>

                            <div className="absolute bottom-0 left-0 p-6 w-full">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-bold text-white shadow-sm leading-tight">{selectedProject.name}</h2>
                                        <div className="flex items-center text-gray-200 text-sm mt-2">
                                            <FaLocationDot className="mr-1.5 opacity-80" />
                                            <span>{selectedProject.address || 'Chưa cập nhật địa chỉ'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-white custom-scrollbar">
                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 flex items-center">
                                    <FaCircleInfo className="mr-2 text-blue-500" />
                                    Mô tả dự án
                                </h4>
                                <div className="bg-gray-50 rounded-xl p-4 text-gray-600 text-sm leading-relaxed border border-gray-100 shadow-sm">
                                    <p>{selectedProject.description || 'Chưa có mô tả chi tiết cho dự án này.'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                        <FaLayerGroup className="text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase">Gói dịch vụ</p>
                                        <p className="text-sm font-bold text-gray-800 mt-0.5 uppercase">{currentPlan}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                        <FaSignal className="text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase">Trạng thái</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusInfo(selectedProject.status).bgLight} ${getStatusInfo(selectedProject.status).textLight}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusInfo(selectedProject.status).class.replace('text-white', '').replace('bg-', 'bg-')}`}></span>
                                            {getStatusInfo(selectedProject.status).text}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                        <FaCalendarPlus className="text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase">Ngày tạo</p>
                                        <p className="text-sm font-medium text-gray-800 mt-0.5 font-mono">{formatDate(selectedProject.createdAt)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                        <FaClockRotateLeft className="text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase">Cập nhật lần cuối</p>
                                        <p className="text-sm font-medium text-gray-800 mt-0.5 font-mono">{formatDate(selectedProject.updatedAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
                            <button onClick={() => setShowDetailModal(false)} className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all">
                                Đóng cửa sổ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- EDIT/ADD MODAL --- */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6 sm:px-0">
                    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" onClick={() => setShowEditModal(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl transform transition-all sm:max-w-xl w-full relative z-10 border border-gray-100 flex flex-col max-h-[90vh]">

                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Cấu hình Dự án</h3>
                                <p className="text-sm text-gray-500 mt-1">Cập nhật thông tin chi tiết cho dự án của bạn.</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                                <FaXmark className="text-xl" />
                            </button>
                        </div>

                        <div className="px-8 py-6 overflow-y-auto space-y-6 bg-white custom-scrollbar">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Hình ảnh đại diện</label>
                                <div
                                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 transition-colors relative group cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="space-y-1 text-center">
                                        {(!editingProject.image || editingProject.image.includes('placeholder')) ? (
                                            <div>
                                                <FaRegImage className="text-4xl text-gray-400 mb-2 mx-auto" />
                                                <p className="text-sm text-gray-600">Thêm hình ảnh</p>
                                            </div>
                                        ) : (
                                            <div className="relative mx-auto h-32 w-full max-w-xs rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                                                <img src={editingProject.image} className="h-full w-full object-cover" alt="Preview" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-white font-medium text-sm">Thay đổi ảnh</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex text-sm text-gray-600 justify-center mt-2">
                                            <label className="relative cursor-pointer rounded-md font-medium text-opsera-primary hover:text-blue-500 focus-within:outline-none">
                                                <span>Thêm hình ảnh</span>
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 5MB</p>
                                    </div>
                                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên dự án <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={editingProject.name}
                                        onChange={(e) => {
                                            setEditingProject({ ...editingProject, name: e.target.value });
                                            setErrors({ ...errors, name: null });
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder-gray-400 text-gray-900 ${errors.name ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-300'}`}
                                        placeholder="Nhập tên dự án..."
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Địa chỉ hiển thị</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaLocationDot className="text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={editingProject.address}
                                                onChange={(e) => {
                                                    setEditingProject({ ...editingProject, address: e.target.value });
                                                    setErrors({ ...errors, address: null });
                                                }}
                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-gray-900 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder="Địa chỉ..."
                                            />
                                        </div>
                                        {errors.address && <p className="mt-1 text-xs text-red-600 font-medium">{errors.address}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trạng thái</label>
                                        <div className="relative">
                                            <select
                                                value={editingProject.status}
                                                onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value })}
                                                className="appearance-none w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-gray-900 bg-white"
                                            >
                                                <option value="active">🟢 Hoạt động</option>
                                                <option value="maintenance">🟡 Bảo trì</option>
                                                <option value="inactive">🔴 Dừng</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                                <FaChevronDown className="text-xs" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả</label>
                                    <textarea
                                        rows={4}
                                        value={editingProject.description}
                                        onChange={(e) => {
                                            setEditingProject({ ...editingProject, description: e.target.value });
                                            setErrors({ ...errors, description: null });
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-gray-900 resize-none ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Mô tả ngắn gọn về dự án..."
                                    ></textarea>
                                    {errors.description && <p className="mt-1 text-xs text-red-600 font-medium">{errors.description}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 rounded-b-2xl">
                            <button onClick={() => setShowEditModal(false)} className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:outline-none transition-all">
                                Hủy bỏ
                            </button>
                            <button
                                onClick={saveProject}
                                disabled={isSaving}
                                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-lg shadow-md text-sm font-bold text-white hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CROP MODAL --- */}
            {showCropModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto px-4 py-6 sm:px-0">
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm transition-opacity" onClick={cancelCrop}></div>
                    <div className="bg-gray-900 rounded-2xl shadow-2xl transform transition-all sm:max-w-3xl w-full relative z-10 flex flex-col max-h-[95vh] border border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center rounded-t-2xl bg-gray-800/50">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-600 rounded-lg">
                                    <FaCropSimple className="text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Căn chỉnh hình ảnh</h3>
                            </div>
                            <button onClick={cancelCrop} className="text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-2 rounded-full">
                                <FaXmark />
                            </button>
                        </div>

                        <div className="p-1 flex-1 overflow-hidden bg-black flex justify-center items-center relative">
                            <div className="img-container w-full h-full flex justify-center items-center overflow-hidden bg-gray-800">
                                <img ref={imageRef} src={tempCropImage} className="block max-w-full max-h-[60vh]" alt="Crop" />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-800 border-t border-gray-700 flex justify-between items-center rounded-b-2xl">
                            <div className="flex items-center text-xs text-gray-400 space-x-2">
                                <FaComputerMouse />
                                <span>Lăn chuột để zoom • Kéo để di chuyển</span>
                            </div>
                            <div className="flex space-x-3">
                                <button onClick={cancelCrop} className="px-5 py-2 bg-gray-700 border border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-200 hover:bg-gray-600 hover:text-white focus:outline-none transition-all">
                                    Hủy bỏ
                                </button>
                                <button onClick={saveCrop} className="px-5 py-2 bg-blue-600 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:-translate-y-0.5 transition-all">
                                    Áp dụng cắt
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;