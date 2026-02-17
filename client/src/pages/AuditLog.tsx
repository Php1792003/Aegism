import React, { useState, useEffect, useCallback } from 'react';

// Cấu hình API URL
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://aegism.online';

// Định nghĩa kiểu dữ liệu cơ bản để fix lỗi TypeScript
interface User {
    name: string;
    avatar: string;
    role: string;
    isSuperAdmin: boolean;
    isTenantAdmin: boolean;
    email?: string;
    fullName?: string;
}

interface Log {
    id: string;
    action: string;
    user?: {
        fullName: string;
        email: string;
    };
    entity: string;
    entityId: string;
    details: any;
    createdAt: string;
}

const AuditLog: React.FC = () => {
    // --- State Management ---
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState('starter');
    const [user, setUser] = useState<User>({
        name: 'User',
        avatar: '',
        role: 'User',
        isSuperAdmin: false,
        isTenantAdmin: false
    });

    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [logs, setLogs] = useState<Log[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 20;

    // --- Helpers & Logic (Đã thêm type : string, : any để fix lỗi) ---

    // Hàm lấy label hành động
    const getActionLabel = (action: string) => {
        const map: { [key: string]: string } = {
            'USER_LOGIN_SUCCESS': 'Đăng nhập',
            'USER_LOGIN_FAILED': 'Lỗi Login',
            'CREATE_MEMBER': 'Tạo NV',
            'UPDATE_MEMBER': 'Sửa NV',
            'DELETE_MEMBER': 'Xóa NV',
            'UPDATE_PROJECT': 'Sửa Dự án',
            'CREATE_TASK': 'Tạo Task',
            'UPDATE_TASK': 'Sửa Task',
        };
        return map[action] || action.split('_')[0];
    };

    // Hàm lấy style hành động
    const getActionStyle = (action: string) => {
        if (action.includes('LOGIN_SUCCESS')) return {
            className: 'bg-green-100 text-green-700 border-green-200',
            icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3" /></svg>
        };
        if (action.includes('LOGIN_FAILED')) return {
            className: 'bg-red-100 text-red-700 border-red-200',
            icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        };
        if (action.includes('CREATE')) return {
            className: 'bg-blue-100 text-blue-700 border-blue-200',
            icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
        };
        if (action.includes('UPDATE')) return {
            className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        };
        return {
            className: 'bg-gray-100 text-gray-700 border-gray-200',
            icon: null
        };
    };

    // Hàm tạo chuỗi update (Fix lỗi parameter implicitly has 'any' type)
    const generateUpdateString = (details: any, fieldMap: any, contextName: string) => {
        const changes = details.changes || details;
        const changeList: string[] = [];
        const ignoreKeys = ['id', 'updatedAt', 'createdAt', 'tenantId', 'password', 'memberId', 'taskId', 'projectId'];

        for (const [key, value] of Object.entries(changes)) {
            if (ignoreKeys.includes(key) || value === undefined || value === null) continue;

            const fieldName = fieldMap[key] || key;
            let displayValue = value;
            if (typeof value === 'string' && value.startsWith('data:image')) displayValue = '[Hình ảnh mới]';
            if (key === 'status' || key === 'priority') displayValue = `<span class="font-bold uppercase">${value}</span>`;

            changeList.push(`đổi ${fieldName} thành ${displayValue}`);
        }

        if (changeList.length === 0) return `Cập nhật ${contextName} (Chi tiết ẩn)`;
        const result = `Cập nhật ${contextName}: ${changeList.join(', ')}.`;
        return result.charAt(0).toUpperCase() + result.slice(1);
    };

    // Hàm format mô tả (Fix lỗi parameter 'log')
    const formatDescription = (log: Log) => {
        try {
            let details = log.details;
            if (typeof details === 'string') {
                try { details = JSON.parse(details); } catch (e) { return details; }
            }
            if (!details) return 'Không có chi tiết';
            if (details.message) return details.message;

            const fieldMap = {
                fullName: 'Họ tên', email: 'Email', title: 'Tiêu đề task', name: 'Tên',
                status: 'Trạng thái', priority: 'Độ ưu tiên', description: 'Mô tả',
                deadline: 'Hạn chót', roleId: 'Quyền hạn (Role)', assigneeId: 'Người thực hiện',
                projectId: 'Dự án'
            };

            if (log.action === 'USER_LOGIN_SUCCESS') return `<span class="text-green-600 font-bold">Đăng nhập thành công</span> vào hệ thống.`;
            if (log.action === 'USER_LOGIN_FAILED') return `<span class="text-red-600 font-bold">Đăng nhập thất bại</span> (Sai thông tin).`;

            if (log.action === 'CREATE_MEMBER') return `Thêm nhân sự mới: <b>${details.fullName || details.email || 'N/A'}</b>`;
            if (log.action === 'DELETE_MEMBER') return `Xóa nhân sự: <span class="text-red-600 font-bold">${details.originalEmail || details.email || 'N/A'}</span> khỏi hệ thống.`;
            if (log.action === 'UPDATE_MEMBER') return generateUpdateString(details, fieldMap, 'thông tin nhân sự');

            if (log.action === 'CREATE_TASK') return `Tạo công việc mới: <b>"${details.taskTitle || details.title}"</b>`;
            if (log.action === 'UPDATE_TASK') return generateUpdateString(details, fieldMap, 'công việc');
            if (log.action === 'DELETE_TASK') return `Xóa công việc: <b>"${details.taskTitle || details.title || 'N/A'}"</b>`;
            if (log.action === 'ACCEPT_TASK') return `Đã tiếp nhận xử lý công việc.`;

            if (log.action === 'CREATE_PROJECT') return `Khởi tạo dự án mới: <b>${details.projectName || details.name}</b>`;
            if (log.action === 'UPDATE_PROJECT') return generateUpdateString(details, fieldMap, 'dự án');
            if (log.action === 'DELETE_PROJECT') return `Xóa dự án: <b>${details.projectName || details.name}</b>`;

            if (log.action === 'CREATE_ROLE') return `Tạo vai trò mới: <b>${details.roleName || details.name}</b>`;
            if (log.action === 'DELETE_ROLE') return `Xóa vai trò: <b>${details.roleName || details.name}</b>`;

            if (log.action === 'REPORT_INCIDENT') return `Báo cáo sự cố mới tại: <b>${details.qrCode || 'Vị trí chưa xác định'}</b>`;
            if (log.action === 'ASSIGN_INCIDENT') return `Phân công xử lý sự cố cho: <b>${details.assignedTo || details.role || 'Bộ phận liên quan'}</b>`;

            return `Thực hiện: ${log.action}`;
        } catch (e) {
            return 'Dữ liệu log không hợp lệ.';
        }
    };

    // Fetch Logs Function
    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams({ page: currentPage.toString(), limit: limit.toString() });
            if (searchQuery) params.append('action', searchQuery);
            if (selectedProjectId) params.append('projectId', selectedProjectId);

            const res = await fetch(`${API_URL}/api/audit/tenant-activities?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, limit, searchQuery, selectedProjectId]);

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) { window.location.href = '/login.html'; return; }

            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userData = JSON.parse(userStr);

                let avatar = userData.avatar;
                if (!avatar || avatar.trim() === '') {
                    avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName || 'User')}&background=2563EB&color=fff`;
                }

                let role = 'Nhân viên';
                const isSuper = userData.isSuperAdmin === true || userData.isSuperAdmin === 'true' || userData.isSuperAdmin === 1;
                const isTenant = userData.isTenantAdmin === true || userData.isTenantAdmin === 'true' || userData.isTenantAdmin === 1;

                if (isSuper) role = 'Super Admin';
                else if (isTenant) role = 'Quản trị viên';
                else if (userData.role && userData.role.name) role = userData.role.name;

                setUser({
                    name: userData.fullName || 'Người dùng',
                    avatar: avatar,
                    role: role,
                    isSuperAdmin: isSuper,
                    isTenantAdmin: isTenant
                });

                if (userData.tenant) {
                    setCurrentPlan(userData.tenant.subscriptionPlan?.toLowerCase() || 'starter');
                }
            }

            // Fetch Projects
            try {
                const res = await fetch(`${API_URL}/api/projects`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProjects(data);
                }
            } catch (e) { }
        };
        init();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchLogs]);

    const logout = () => {
        localStorage.clear();
        window.location.href = '/login.html';
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-800 font-sans">
            {/* Custom Styles to match Tailwind Config colors if not set in project */}
            <style>{`
                .text-opsera-primary { color: #2563EB; }
                .bg-opsera-primary { background-color: #2563EB; }
                .border-opsera-primary { border-color: #2563EB; }
                .focus\\:ring-opsera-primary:focus { --tw-ring-color: #2563EB; }
                .focus\\:border-opsera-primary:focus { border-color: #2563EB; }
                .text-opsera-dark { color: #1F2937; }
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: #f1f1f1; }
                ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
                ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
            {/* Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center w-full md:w-auto gap-4">
                            <div className="w-full md:w-64">
                                <label className="text-xs text-gray-500 mb-1 font-semibold block uppercase tracking-wide">Lọc theo Dự án</label>
                                <select value={selectedProjectId} onChange={(e) => { setSelectedProjectId(e.target.value); setCurrentPage(1); }} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-opsera-primary focus:border-opsera-primary sm:text-sm rounded-lg bg-gray-50 text-gray-700 font-bold shadow-sm">
                                    <option value="">Tất cả dự án</option>
                                    {projects.map((project: any) => (
                                        <option key={project.id} value={project.id}>{project.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-full md:w-64">
                                <label className="text-xs text-gray-500 mb-1 font-semibold block uppercase tracking-wide">Tìm kiếm</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                    <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Tên, hành động..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-opsera-primary focus:border-opsera-primary sm:text-sm shadow-sm" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 italic">
                            Hiển thị <span className="font-bold text-gray-800 mx-1">{logs.length}</span> hoạt động gần nhất
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <svg className="animate-spin h-8 w-8 text-opsera-primary" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold border-b border-gray-200">
                                            <th className="px-6 py-4">Người thực hiện</th>
                                            <th className="px-6 py-4">Hành động</th>
                                            <th className="px-6 py-4 w-1/2">Chi tiết</th>
                                            <th className="px-6 py-4 text-right">Thời gian</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {logs.map(log => {
                                            const actionStyle = getActionStyle(log.action);
                                            return (
                                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 mr-3 flex-shrink-0 border border-blue-200">
                                                                {(log.user?.fullName || 'Unknown').charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900">{log.user?.fullName || 'Unknown User'}</div>
                                                                <div className="text-xs text-gray-400 truncate max-w-[150px]">{log.user?.email || 'N/A'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center w-fit gap-1.5 transition-all hover:shadow-sm ${actionStyle.className}`}>
                                                            {actionStyle.icon}
                                                            <span>{getActionLabel(log.action)}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">
                                                        <div className="text-sm font-medium text-gray-800 mb-1" dangerouslySetInnerHTML={{ __html: formatDescription(log) }}></div>
                                                        <div className="text-xs text-gray-400 flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                                            {log.entity} #{log.entityId ? log.entityId.slice(0, 8) : '...'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="text-gray-900 font-medium">{new Date(log.createdAt).toLocaleTimeString('vi-VN')}</div>
                                                        <div className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleDateString('vi-VN')}</div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {logs.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                        <p>Không có hoạt động nào khớp với bộ lọc.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                                <span className="text-sm text-gray-500">Trang <span className="font-bold text-gray-900">{currentPage}</span> / {totalPages}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage <= 1} className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors">Trước</button>
                                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage >= totalPages} className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors">Sau</button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AuditLog;