import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
// Import Icons
import {
    FaPlus, FaMagnifyingGlass, FaHandPointUp, FaCheck, FaXmark,
    FaTriangleExclamation, FaBell, FaCircleNotch, FaChevronUp
} from 'react-icons/fa6';
import { FaRegClock } from 'react-icons/fa';
const Tasks = () => {
    // --- Config ---
    const apiUrl = 'https://api.aegism.online';
    // --- State ---
    const [user, setUser] = useState<any>({ name: 'Loading...', id: '', isSuperAdmin: false, isTenantAdmin: false, permissions: [] });
    // Data
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [projectMembers, setProjectMembers] = useState<any[]>([]);
    // UI Filters
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // Modals
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    // Mobile bottom sheets
    const [showMobileSheet, setShowMobileSheet] = useState(false);
    const [showMobileCompleteSheet, setShowMobileCompleteSheet] = useState(false);
    // Notification Modal State
    const [newNotificationModal, setNewNotificationModal] = useState<any>({ show: false, title: '', message: '', type: '' });
    const [unreadCount, setUnreadCount] = useState(0);
    // Forms
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [newTask, setNewTask] = useState<any>({ title: '', description: '', priority: 'MEDIUM', estimatedHours: 0, deadlineInput: '', assigneeId: '', status: 'PENDING' });
    // Permissions & Validation
    const [isReadOnly, setIsReadOnly] = useState(true);
    const [hasAssignPermission, setHasAssignPermission] = useState(false);
    const [hasDeletePermission, setHasDeletePermission] = useState(false);
    const [errors, setErrors] = useState<any>({});
    // --- Effects ---
    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) { window.location.href = '/login'; return; }
            const userStr = localStorage.getItem('user');
            if (userStr) updateUserUI(JSON.parse(userStr));
            await fetchUserProfile();
            await fetchProjects();
            if (Notification.permission !== "granted") Notification.requestPermission();
            await fetchUnreadCount();
            const interval = setInterval(() => fetchNewNotifications(), 3000);
            return () => clearInterval(interval);
        };
        init();
    }, []);
    useEffect(() => {
        if (selectedProjectId) {
            fetchTasks();
            fetchMembers();
        }
    }, [selectedProjectId]);
    // --- Helper Functions ---
    const updateUserUI = (u: any) => {
        let permissions: string[] = [];
        if (u.isSuperAdmin || u.isTenantAdmin) permissions = ['ALL'];
        else if (u.role) {
            try {
                permissions = Array.isArray(u.role.permissions) ? u.role.permissions : JSON.parse(u.role.permissions);
            } catch { permissions = []; }
        }
        setUser({ ...u, permissions });
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
    const getPriorityColor = (p: string) => {
        return p === 'HIGH' ? 'bg-red-100 text-red-700' : (p === 'MEDIUM' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700');
    };
    const getPriorityLabel = (p: string) => {
        return p === 'HIGH' ? 'Cao' : p === 'MEDIUM' ? 'Trung bình' : 'Thấp';
    };
    const formatDate = (d: string) => {
        if (!d) return 'N/A';
        const date = new Date(d);
        return date.getDate().toString().padStart(2, '0') + '/' + (date.getMonth() + 1).toString().padStart(2, '0') + ' ' + date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
    };
    const formatDateForInput = (isoString: string) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        const offset = date.getTimezoneOffset() * 60000;
        return (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
    };
    const isOverdue = (d: string) => {
        return d && new Date(d) < new Date();
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
        } catch (e) { }
    };
    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/projects`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
                if (data.length > 0 && !selectedProjectId) setSelectedProjectId(data[0].id);
            }
        } catch (e) { } finally { setIsLoading(false); }
    };
    const fetchTasks = async () => {
        if (!selectedProjectId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/tasks?projectId=${selectedProjectId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) {
                const data = await res.json();
                setTasks(data.data || data.tasks || (Array.isArray(data) ? data : []));
            }
        } catch (e) { } finally { setIsLoading(false); }
    };
    const fetchMembers = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/members?projectId=${selectedProjectId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) setProjectMembers(await res.json());
        } catch (e) { }
    };
    // --- Notifications ---
    const fetchUnreadCount = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/notifications?limit=1`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.unreadCount);
            }
        } catch (e) { }
    };
    const fetchNewNotifications = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/notifications?limit=1`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) {
                const data = await res.json();
                const newCount = data.unreadCount;
                if (newCount > unreadCount && data.data.length > 0) {
                    const latest = data.data[0];
                    if (Date.now() - new Date(latest.createdAt).getTime() < 10000) {
                        setNewNotificationModal({ show: true, title: latest.title, message: latest.message, type: latest.type });
                    }
                }
                setUnreadCount(newCount);
            }
        } catch (e) { }
    };
    // --- Computed ---
    const tasksByStatus = (status: string) => {
        let filtered = tasks.filter(t => t.status === status);
        if (showMyTasksOnly) filtered = filtered.filter(t => t.assigneeId === user.id);
        if (searchQuery) filtered = filtered.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
        return filtered;
    };

    // Tasks available to pick up (PENDING, no assignee)
    const availableTasks = tasks.filter(t => t.status === 'PENDING' && !t.assigneeId);

    // My in-progress tasks
    const myInProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS' && (t.assigneeId === user.id || user.isTenantAdmin || user.isSuperAdmin));

    // --- Actions ---
    const openCreateModal = () => {
        if (!selectedProjectId) return Swal.fire('Thông báo', 'Chọn dự án trước', 'info');
        if (!checkPermissionAction('CREATE_TASK') && !checkPermissionAction('MANAGE_TASK')) return;
        setNewTask({ title: '', description: '', priority: 'MEDIUM', estimatedHours: 0, deadlineInput: '', assigneeId: '', status: 'PENDING' });
        setErrors({});
        fetchMembers();
        setShowCreateModal(true);
    };
    const openTaskDetail = (task: any) => {
        const t = JSON.parse(JSON.stringify(task));
        if (!t.assigneeId) t.assigneeId = "";
        t.deadlineInput = formatDateForInput(t.deadline);
        setSelectedTask(t);
        setErrors({});
        setIsReadOnly(!hasPermission('EDIT_TASK') && !hasPermission('UPDATE_TASK') && !hasPermission('MANAGE_TASK'));
        setHasAssignPermission(hasPermission('ASSIGN_TASK') || hasPermission('MANAGE_TASK'));
        setHasDeletePermission(hasPermission('DELETE_TASK') || hasPermission('MANAGE_TASK'));
        setShowDetailModal(true);
    };
    const pickUpTask = async (task: any) => {
        try {
            const res = await fetch(`${apiUrl}/api/tasks/${task.id}/accept`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Thành công', text: 'Bạn đã nhận công việc này.', timer: 1500, showConfirmButton: false });
                fetchTasks();
                // Close sheet if no more tasks
                if (availableTasks.length <= 1) setShowMobileSheet(false);
            } else {
                const err = await res.json(); Swal.fire('Lỗi', err.message, 'error');
            }
        } catch (e) { Swal.fire('Lỗi', 'Lỗi kết nối', 'error'); }
    };
    const completeTask = async (task: any) => {
        try {
            const res = await fetch(`${apiUrl}/api/tasks/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
                body: JSON.stringify({ status: 'COMPLETED' })
            });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Hoàn thành!', text: 'Task đã được chuyển sang trạng thái Hoàn thành.', timer: 1500, showConfirmButton: false });
                fetchTasks();
            } else {
                const err = await res.json(); Swal.fire('Lỗi', err.message, 'error');
            }
        } catch (e) { Swal.fire('Lỗi', 'Lỗi kết nối', 'error'); }
    };
    const saveTask = async () => {
        if (!newTask.title.trim()) { setErrors({ title: 'Tiêu đề không được để trống' }); return; }
        const payload = {
            ...newTask,
            projectId: selectedProjectId,
            assigneeId: newTask.assigneeId || null,
            deadline: newTask.deadlineInput ? new Date(newTask.deadlineInput).toISOString() : null
        };
        delete payload.deadlineInput;
        try {
            const res = await fetch(`${apiUrl}/api/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã tạo công việc mới', timer: 1500, showConfirmButton: false });
                setShowCreateModal(false);
                fetchTasks();
            } else {
                const err = await res.json(); Swal.fire('Lỗi', err.message, 'error');
            }
        } catch (e) { Swal.fire('Lỗi', 'Lỗi kết nối', 'error'); }
    };
    const updateTask = async () => {
        if (isReadOnly) return;
        if (!selectedTask.title.trim()) { setErrors({ detailTitle: 'Tiêu đề không được để trống' }); return; }
        const payload = {
            title: selectedTask.title,
            description: selectedTask.description,
            priority: selectedTask.priority,
            status: selectedTask.status,
            assigneeId: selectedTask.assigneeId || null,
            estimatedHours: Number(selectedTask.estimatedHours),
            deadline: selectedTask.deadlineInput ? new Date(selectedTask.deadlineInput).toISOString() : null
        };
        try {
            const res = await fetch(`${apiUrl}/api/tasks/${selectedTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Thành công', text: 'Cập nhật công việc xong!', timer: 1500, showConfirmButton: false });
                setShowDetailModal(false);
                fetchTasks();
            } else {
                const err = await res.json(); Swal.fire('Lỗi', err.message, 'error');
            }
        } catch (e) { Swal.fire('Lỗi', 'Lỗi kết nối', 'error'); }
    };
    const deleteTask = async () => {
        if (!hasDeletePermission) return;
        const result = await Swal.fire({ title: 'Xóa công việc?', text: "Hành động này không thể hoàn tác!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#EF4444', confirmButtonText: 'Xóa ngay', cancelButtonText: 'Hủy' });
        if (!result.isConfirmed) return;
        try {
            const res = await fetch(`${apiUrl}/api/tasks/${selectedTask.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) {
                Swal.fire('Đã xóa!', 'Công việc đã được xóa.', 'success');
                setShowDetailModal(false);
                fetchTasks();
            } else { Swal.fire('Lỗi', 'Không thể xóa', 'error'); }
        } catch (e) { Swal.fire('Lỗi', 'Lỗi kết nối', 'error'); }
    };
    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 h-full font-sans text-gray-800">
            {/* Notification Modal */}
            {newNotificationModal.show && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setNewNotificationModal({ ...newNotificationModal, show: false })}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 p-6 text-center transform transition-all scale-100">
                        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${newNotificationModal.type === 'WARNING' ? 'bg-red-100' : 'bg-blue-100'}`}>
                            {newNotificationModal.type === 'WARNING' ? <FaTriangleExclamation className="text-3xl text-red-600" /> : <FaBell className="text-3xl text-blue-600" />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{newNotificationModal.title}</h3>
                        <p className="text-sm text-gray-600 mb-6">{newNotificationModal.message}</p>
                        <button onClick={() => setNewNotificationModal({ ...newNotificationModal, show: false })} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition">Đã hiểu</button>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 mx-4 md:mx-6 flex flex-col gap-3">
                {/* Row 1: Dự án + Tạo Task */}
                <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium whitespace-nowrap text-sm">Dự án:</span>
                    <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 font-semibold bg-white text-sm">
                        {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {(hasPermission('CREATE_TASK') || hasPermission('MANAGE_TASK')) && (
                        <button onClick={openCreateModal} disabled={!selectedProjectId}
                            className={`flex items-center px-3 py-2 text-white rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap text-sm flex-shrink-0 ${!selectedProjectId ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            <FaPlus className="mr-1.5" /> Tạo Task
                        </button>
                    )}
                </div>
                {/* Row 2: Checkbox + Search */}
                <div className="flex items-center gap-3">
                    <label className="flex items-center cursor-pointer select-none whitespace-nowrap">
                        <input type="checkbox" checked={showMyTasksOnly} onChange={(e) => setShowMyTasksOnly(e.target.checked)} className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300" />
                        <span className="ml-2 text-sm text-gray-700 font-medium">Của tôi</span>
                    </label>
                    <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><FaMagnifyingGlass className="text-gray-400 text-xs" /></span>
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm công việc..."
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex justify-center py-10">
                    <FaCircleNotch className="animate-spin h-8 w-8 text-blue-600" />
                </div>
            )}

            {/* Kanban Board */}
            {selectedProjectId && !isLoading && (
                <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-220px)] overflow-x-hidden lg:overflow-x-auto pb-24 px-4 md:px-6">
                    {/* COLUMN: PENDING */}
                    <div className="flex-1 flex flex-col bg-gray-100 rounded-xl border border-gray-200 lg:min-w-[300px] max-h-[60vh] lg:max-h-none">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl flex justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-400 mr-2"></span><h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider">Chờ xử lý</h3></div>
                            <span className="bg-white px-2 py-0.5 rounded text-xs font-bold text-gray-500 border border-gray-200 shadow-sm">{tasksByStatus('PENDING').length}</span>
                        </div>
                        <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                            {tasksByStatus('PENDING').map((task: any) => (
                                <div key={task.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition-all group border-l-4 border-l-gray-400 relative">
                                    <div onClick={() => openTaskDetail(task)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-800 mb-1 line-clamp-2 text-sm">{task.title}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                                    </div>
                                    {!task.assigneeId && (
                                        <div className="mb-3">
                                            <button onClick={(e) => { e.stopPropagation(); pickUpTask(task); }}
                                                className="w-full py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors flex items-center justify-center">
                                                <FaHandPointUp className="mr-1.5" /> Nhận việc này
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-100" onClick={() => openTaskDetail(task)}>
                                        <div className="flex items-center space-x-1">
                                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600 font-bold">{(task.assignee?.fullName || 'U').charAt(0)}</div>
                                            <span className="text-xs text-gray-600 truncate max-w-[80px]">{task.assignee?.fullName || 'Chưa gán'}</span>
                                        </div>
                                        <div className={`flex items-center text-xs text-gray-500 ${isOverdue(task.deadline) ? 'text-red-500 font-bold' : ''}`}>
                                            {task.deadline && <FaRegClock className="mr-1" />}
                                            <span>{formatDate(task.deadline)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* COLUMN: IN_PROGRESS */}
                    <div className="flex-1 flex flex-col bg-blue-50 rounded-xl border border-blue-100 lg:min-w-[300px] max-h-[60vh] lg:max-h-none">
                        <div className="p-4 border-b border-blue-200 bg-blue-100 rounded-t-xl flex justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span><h3 className="font-bold text-blue-800 uppercase text-xs tracking-wider">Đang thực hiện</h3></div>
                            <span className="bg-white px-2 py-0.5 rounded text-xs font-bold text-blue-600 border border-blue-200 shadow-sm">{tasksByStatus('IN_PROGRESS').length}</span>
                        </div>
                        <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                            {tasksByStatus('IN_PROGRESS').map((task: any) => (
                                <div key={task.id} onClick={() => openTaskDetail(task)} className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm hover:shadow-md cursor-pointer transition-all border-l-4 border-l-blue-500">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-800 mb-1 line-clamp-2 text-sm">{task.title}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                                    {(task.assigneeId === user.id || user.isTenantAdmin) && (
                                        <div className="mb-3">
                                            <button onClick={(e) => { e.stopPropagation(); completeTask(task); }}
                                                className="w-full py-1.5 bg-green-50 text-green-600 text-xs font-bold rounded border border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors flex items-center justify-center">
                                                <FaCheck className="mr-1.5" /> Hoàn thành
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                        <div className="flex items-center space-x-1">
                                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-bold">{(task.assignee?.fullName || 'U').charAt(0)}</div>
                                            <span className="text-xs text-gray-600 truncate max-w-[80px]">{task.assignee?.fullName || 'Chưa gán'}</span>
                                        </div>
                                        <div className={`flex items-center text-xs text-gray-500 ${isOverdue(task.deadline) ? 'text-red-500 font-bold' : ''}`}>
                                            {task.deadline && <FaRegClock className="mr-1" />}
                                            <span>{formatDate(task.deadline)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* COLUMN: COMPLETED */}
                    <div className="flex-1 flex flex-col bg-green-50 rounded-xl border border-green-100 lg:min-w-[300px] max-h-[60vh] lg:max-h-none">
                        <div className="p-4 border-b border-green-200 bg-green-100 rounded-t-xl flex justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span><h3 className="font-bold text-green-800 uppercase text-xs tracking-wider">Hoàn thành</h3></div>
                            <span className="bg-white px-2 py-0.5 rounded text-xs font-bold text-green-600 border border-green-200 shadow-sm">{tasksByStatus('COMPLETED').length}</span>
                        </div>
                        <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                            {tasksByStatus('COMPLETED').map((task: any) => (
                                <div key={task.id} onClick={() => openTaskDetail(task)} className="bg-white p-4 rounded-lg border border-green-200 shadow-sm hover:shadow-md cursor-pointer transition-all border-l-4 border-l-green-500 opacity-75 hover:opacity-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-800 mb-1 line-clamp-2 line-through decoration-gray-400 text-sm">{task.title}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                        <div className="flex items-center space-x-1">
                                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-[10px] text-green-600 font-bold">{(task.assignee?.fullName || 'U').charAt(0)}</div>
                                            <span className="text-xs text-gray-600 truncate max-w-[80px]">{task.assignee?.fullName || 'Chưa gán'}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 italic">Done</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!selectedProjectId && (
                <div className="text-center py-20">
                    <h3 className="text-lg font-medium text-gray-900">Vui lòng chọn một dự án để xem công việc.</h3>
                </div>
            )}

            {/* ===== MOBILE FLOATING BUTTONS ===== */}
            <div className="fixed bottom-6 right-6 z-40 lg:hidden flex flex-col gap-3 items-end">
                {/* Hoàn thành button */}
                {selectedProjectId && myInProgressTasks.length > 0 && (
                    <button
                        onClick={() => setShowMobileCompleteSheet(true)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3.5 rounded-full shadow-2xl font-bold text-sm transition-all active:scale-95"
                        style={{ boxShadow: '0 4px 24px rgba(22,163,74,0.45)' }}
                    >
                        <FaCheck className="text-lg" />
                        Hoàn thành
                        <span className="bg-white text-green-600 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center ml-1">
                            {myInProgressTasks.length}
                        </span>
                    </button>
                )}
                {/* Nhận việc button */}
                {selectedProjectId && availableTasks.length > 0 && (
                    <button
                        onClick={() => setShowMobileSheet(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3.5 rounded-full shadow-2xl font-bold text-sm transition-all active:scale-95"
                        style={{ boxShadow: '0 4px 24px rgba(37,99,235,0.45)' }}
                    >
                        <FaHandPointUp className="text-lg" />
                        Nhận việc
                        <span className="bg-white text-blue-600 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center ml-1">
                            {availableTasks.length}
                        </span>
                    </button>
                )}
            </div>

            {/* ===== MOBILE BOTTOM SHEET: HOÀN THÀNH ===== */}
            {showMobileCompleteSheet && (
                <div className="fixed inset-0 z-[100] lg:hidden flex flex-col justify-end">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowMobileCompleteSheet(false)}></div>
                    <div className="relative z-10 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]">
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                        </div>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                    <FaCheck className="text-green-600" /> Việc đang thực hiện
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">{myInProgressTasks.length} công việc cần hoàn thành</p>
                            </div>
                            <button onClick={() => setShowMobileCompleteSheet(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                                <FaXmark />
                            </button>
                        </div>
                        {/* Task List */}
                        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
                            {myInProgressTasks.map((task: any) => (
                                <div key={task.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className={`mt-0.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase whitespace-nowrap ${getPriorityColor(task.priority)}`}>
                                            {getPriorityLabel(task.priority)}
                                        </span>
                                        <h4 className="font-bold text-gray-800 text-sm leading-snug">{task.title}</h4>
                                    </div>
                                    {task.description && (
                                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
                                    )}
                                    {task.deadline && (
                                        <div className={`flex items-center text-xs mb-3 font-medium ${isOverdue(task.deadline) ? 'text-red-500' : 'text-gray-500'}`}>
                                            <FaRegClock className="mr-1.5" />
                                            Hạn: {formatDate(task.deadline)}
                                            {isOverdue(task.deadline) && <span className="ml-2 bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold">Quá hạn</span>}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { completeTask(task); if (myInProgressTasks.length <= 1) setShowMobileCompleteSheet(false); }}
                                            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <FaCheck /> Hoàn thành
                                        </button>
                                        <button
                                            onClick={() => { setShowMobileCompleteSheet(false); openTaskDetail(task); }}
                                            className="px-4 py-2.5 bg-white border border-gray-300 text-gray-600 rounded-xl font-bold text-sm transition hover:bg-gray-50 active:scale-95"
                                        >
                                            Chi tiết
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="h-6"></div>
                    </div>
                </div>
            )}

            {/* ===== MOBILE BOTTOM SHEET: NHẬN VIỆC ===== */}
            {showMobileSheet && (
                <div className="fixed inset-0 z-[100] lg:hidden flex flex-col justify-end">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowMobileSheet(false)}></div>

                    {/* Sheet */}
                    <div className="relative z-10 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]">
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                    <FaHandPointUp className="text-blue-600" /> Việc chờ nhận
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">{availableTasks.length} công việc đang chờ người nhận</p>
                            </div>
                            <button onClick={() => setShowMobileSheet(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                                <FaXmark />
                            </button>
                        </div>

                        {/* Task List */}
                        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
                            {availableTasks.map((task: any) => (
                                <div key={task.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                                    {/* Priority + Title */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className={`mt-0.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase whitespace-nowrap ${getPriorityColor(task.priority)}`}>
                                            {getPriorityLabel(task.priority)}
                                        </span>
                                        <h4 className="font-bold text-gray-800 text-sm leading-snug">{task.title}</h4>
                                    </div>

                                    {/* Description */}
                                    {task.description && (
                                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
                                    )}

                                    {/* Deadline */}
                                    {task.deadline && (
                                        <div className={`flex items-center text-xs mb-3 font-medium ${isOverdue(task.deadline) ? 'text-red-500' : 'text-gray-500'}`}>
                                            <FaRegClock className="mr-1.5" />
                                            Hạn: {formatDate(task.deadline)}
                                            {isOverdue(task.deadline) && <span className="ml-2 bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold">Quá hạn</span>}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => pickUpTask(task)}
                                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <FaHandPointUp /> Nhận việc này
                                        </button>
                                        <button
                                            onClick={() => { setShowMobileSheet(false); openTaskDetail(task); }}
                                            className="px-4 py-2.5 bg-white border border-gray-300 text-gray-600 rounded-xl font-bold text-sm transition hover:bg-gray-50 active:scale-95"
                                        >
                                            Chi tiết
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Safe area bottom padding */}
                        <div className="h-6"></div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowDetailModal(false)}></div>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                                    <div className="w-full mr-4">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getPriorityColor(selectedTask?.priority)}`}>{selectedTask?.priority}</span>
                                            <span className="text-xs text-gray-400">#{selectedTask?.id.slice(0, 8)}</span>
                                        </div>
                                        <input type="text" value={selectedTask.title} disabled={isReadOnly}
                                            onChange={(e) => { setSelectedTask({ ...selectedTask, title: e.target.value }); setErrors({ ...errors, detailTitle: null }); }}
                                            className={`text-xl font-bold text-gray-900 border rounded px-1 -ml-1 focus:outline-none w-full ${isReadOnly ? 'bg-transparent cursor-not-allowed border-transparent' : 'hover:border-gray-300 focus:border-blue-500 border-transparent'} ${errors.detailTitle ? 'border-red-500' : ''}`} />
                                        {errors.detailTitle && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.detailTitle}</p>}
                                    </div>
                                    <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-500"><FaXmark className="text-xl" /></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-700 mb-1">Mô tả</h4>
                                            <textarea value={selectedTask.description} disabled={isReadOnly}
                                                onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                                                rows={6} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none disabled:bg-gray-50"></textarea>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-700 mb-1">Độ ưu tiên</h4>
                                            <select value={selectedTask.priority} disabled={isReadOnly}
                                                onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm disabled:bg-gray-50">
                                                <option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-4 text-sm h-fit border border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 font-medium">Trạng thái:</span>
                                            <select value={selectedTask.status} disabled={isReadOnly}
                                                onChange={(e) => setSelectedTask({ ...selectedTask, status: e.target.value })}
                                                className="border border-gray-300 rounded px-2 py-1 text-sm font-bold w-40 disabled:bg-gray-100">
                                                <option value="PENDING">PENDING</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="COMPLETED">COMPLETED</option>
                                            </select>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 font-medium">Người thực hiện:</span>
                                            <select value={selectedTask.assigneeId} disabled={!hasAssignPermission}
                                                onChange={(e) => setSelectedTask({ ...selectedTask, assigneeId: e.target.value })}
                                                className="border border-gray-300 rounded px-2 py-1 text-sm w-40 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                                <option value="">-- Chưa gán --</option>
                                                {projectMembers.map((member: any) => (
                                                    <option key={member.id} value={member.id}>{member.fullName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="border-t border-gray-200"></div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 font-medium">Hạn chót:</span>
                                            <input type="datetime-local" value={selectedTask.deadlineInput} disabled={isReadOnly}
                                                onChange={(e) => setSelectedTask({ ...selectedTask, deadlineInput: e.target.value })}
                                                className="border border-gray-300 rounded px-2 py-1 text-sm w-40 disabled:bg-gray-100" />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 font-medium">Ước tính (giờ):</span>
                                            <input type="number" value={selectedTask.estimatedHours} disabled={isReadOnly}
                                                onChange={(e) => setSelectedTask({ ...selectedTask, estimatedHours: e.target.value })}
                                                className="border border-gray-300 rounded px-2 py-1 text-sm w-20 text-right disabled:bg-gray-100" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between border-t border-gray-100">
                                <div>{hasDeletePermission && <button onClick={deleteTask} className="text-red-600 font-bold text-sm px-4 py-2 border border-red-200 rounded hover:bg-red-50">Xóa Task</button>}</div>
                                <div className="flex space-x-3">
                                    <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50">Đóng</button>
                                    {!isReadOnly && <button onClick={updateTask} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-sm">Lưu Cập nhật</button>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">Tạo Công việc Mới</h3>
                                    <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-500"><FaXmark className="text-xl" /></button>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
                                    <input type="text" value={newTask.title}
                                        onChange={(e) => { setNewTask({ ...newTask, title: e.target.value }); setErrors({ ...errors, title: null }); }}
                                        className={`w-full border rounded-lg px-3 py-2 font-semibold focus:outline-none focus:ring-2 transition ${errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                                        placeholder="Nhập tên công việc..." />
                                    {errors.title && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.title}</p>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả</label>
                                            <textarea value={newTask.description}
                                                onChange={(e) => { setNewTask({ ...newTask, description: e.target.value }); setErrors({ ...errors, desc: null }); }}
                                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition ${errors.desc ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                                                rows={5}></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Độ ưu tiên</label>
                                            <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm">
                                                <option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-4 text-sm h-fit border border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 font-medium">Trạng thái:</span>
                                            <select value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value })} className="border border-gray-300 rounded px-2 py-1 text-sm font-bold w-40">
                                                <option value="PENDING">PENDING</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="COMPLETED">COMPLETED</option>
                                            </select>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 font-medium">Người thực hiện:</span>
                                            <select value={newTask.assigneeId} onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })} className="border border-gray-300 rounded px-2 py-1 text-sm w-40">
                                                <option value="">-- Chưa gán --</option>
                                                {projectMembers.map((member: any) => (
                                                    <option key={member.id} value={member.id}>{member.fullName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="border-t border-gray-200"></div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 font-medium">Hạn chót:</span>
                                            <input type="datetime-local" value={newTask.deadlineInput} onChange={(e) => setNewTask({ ...newTask, deadlineInput: e.target.value })} className="border border-gray-300 rounded px-2 py-1 text-sm w-40" />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 font-medium">Ước tính (giờ):</span>
                                            <input type="number" value={newTask.estimatedHours} min="0" onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })} className="border border-gray-300 rounded px-2 py-1 text-sm w-20 text-right" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
                                <button onClick={saveTask} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">Tạo Công việc</button>
                                <button onClick={() => setShowCreateModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Hủy</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Tasks;
