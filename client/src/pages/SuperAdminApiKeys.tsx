import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    suffix: string;
    createdAt: string;
    isActive: boolean;
    revokedAt?: string;
    revokedBy?: string;
    revokeReason?: string;
    tenant: { id: string; name: string; subscriptionPlan: string; };
    createdBy: { id: string; fullName: string; email: string; };
}

const SuperAdminApiKeys: React.FC = () => {
    const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000' : 'https://api.aegism.online';

    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        fetchKeys();
    }, [page, search]);

    const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchKeys = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${apiUrl}/api/api-integration/superadmin/api-keys?page=${page}&limit=20&search=${search}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setApiKeys(data.keys);
                setTotalPages(data.totalPages);
            } else {
                showToast(data.message || 'Lỗi khi tải danh sách', 'error');
            }
        } catch (error) {
            showToast('Lỗi kết nối máy chủ', 'error');
        } finally {
            setLoading(false);
        }
    };

    const revokeKey = async (id: string) => {
        const { value: reason } = await Swal.fire({
            title: 'Thu hồi API Key (Bắt buộc)',
            input: 'text',
            inputLabel: 'Lý do thu hồi (VD: Vi phạm chính sách spam, Lạm dụng request...)',
            inputPlaceholder: 'Nhập lý do thu hồi...',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Đồng ý thu hồi',
            cancelButtonText: 'Hủy',
            inputValidator: (value) => {
                if (!value) {
                    return 'Bạn cần nhập lý do để thu hồi key này!';
                }
            }
        });

        if (reason) {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await fetch(`${apiUrl}/api/api-integration/superadmin/api-keys/${id}/revoke`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ reason })
                });

                if (res.ok) {
                    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, isActive: false, revokeReason: reason } : k));
                    showToast('Đã thu hồi API Key thành công', 'success');
                } else {
                    const data = await res.json();
                    showToast(data.message || 'Lỗi khi thu hồi API Key', 'error');
                }
            } catch (error) {
                showToast('Lỗi kết nối máy chủ', 'error');
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-transparent p-6">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold flex items-center gap-2 transition-all
                    ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-indigo-500'}`}>
                    {toast.msg}
                </div>
            )}

            <div className="max-w-7xl mx-auto w-full space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Quản lý API Keys</h2>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Tìm kiếm key, tên KH, email..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-72 pl-10 pr-4 py-2 border border-gray-800 bg-gray-900 text-gray-300 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm text-sm"
                            />
                            <svg className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-800/50 text-xs text-gray-400 uppercase font-semibold border-b border-gray-800">
                                    <th className="px-6 py-4">API Key</th>
                                    <th className="px-6 py-4">Tổ chức (Tenant)</th>
                                    <th className="px-6 py-4">Người tạo</th>
                                    <th className="px-6 py-4">Trạng thái</th>
                                    <th className="px-6 py-4 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 text-sm">
                                {loading && (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
                                )}
                                {!loading && apiKeys.length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Không tìm thấy API Key nào.</td></tr>
                                )}
                                {!loading && apiKeys.map(key => (
                                    <tr key={key.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-gray-200">{key.name}</p>
                                            <p className="text-xs font-mono text-gray-500 mt-0.5">{key.prefix}****************{key.suffix}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-gray-300">{key.tenant.name}</p>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-900/30 text-purple-400 border border-purple-800/50 uppercase">{key.tenant.subscriptionPlan}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-300">{key.createdBy.fullName}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{key.createdBy.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {key.isActive ? (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-900/30 text-green-400 border border-green-800/50">● Active</span>
                                            ) : (
                                                <div>
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-900/30 text-red-400 border border-red-800/50">○ Revoked</span>
                                                    {key.revokeReason && <p className="text-[11px] text-red-500 mt-1 max-w-[150px] truncate" title={key.revokeReason}>{key.revokeReason}</p>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {key.isActive && (
                                                <button onClick={() => revokeKey(key.id)}
                                                    className="text-red-400 hover:text-white border border-red-900/50 hover:bg-red-600 px-4 py-1.5 rounded-lg transition-colors font-semibold text-xs shadow-sm">
                                                    Thu hồi Key
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between bg-gray-900/50">
                            <span className="text-sm text-gray-500">Trang {page} / {totalPages}</span>
                            <div className="flex gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="px-3 py-1 border border-gray-700 bg-gray-800 text-gray-300 rounded text-sm disabled:opacity-50 font-medium hover:bg-gray-700">Trước</button>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                    className="px-3 py-1 border border-gray-700 bg-gray-800 text-gray-300 rounded text-sm disabled:opacity-50 font-medium hover:bg-gray-700">Sau</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminApiKeys;
