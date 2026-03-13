import React, { useState, useEffect } from 'react';

interface ApiKey {
    id: number;
    name: string;
    prefix: string;
    suffix: string;
    created: string;
    status: 'Active' | 'Revoked';
}

interface Webhook {
    id: number;
    event: string;
    url: string;
    status: 'Active' | 'Inactive';
}

const ApiIntegration: React.FC = () => {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([
        { id: 1, name: 'ERP Integration', prefix: 'op_live_', suffix: '9d8a', created: '2025-10-15', status: 'Active' },
        { id: 2, name: 'Mobile App Dev', prefix: 'op_test_', suffix: '2b4c', created: '2025-11-01', status: 'Active' },
    ]);
    const [webhooks, setWebhooks] = useState<Webhook[]>([
        { id: 1, event: 'Sự cố (Incident) Created', url: 'https://my-erp.system/hooks/opsera-incidents', status: 'Active' },
    ]);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [showNewKeyModal, setShowNewKeyModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [showWebhookModal, setShowWebhookModal] = useState(false);
    const [newWebhookUrl, setNewWebhookUrl] = useState('');
    const [newWebhookEvent, setNewWebhookEvent] = useState('incident.created');
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const currentPlan = localStorage.getItem('userPlan') || 'starter';
    const isEnterprise = currentPlan === 'enterprise';

    const BASE_URL = 'https://api.opsera.vn/v1';

    const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const copyToClipboard = (text: string, id?: number) => {
        navigator.clipboard.writeText(text).then(() => {
            if (id !== undefined) setCopiedId(id);
            showToast('Đã sao chép!', 'info');
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const createApiKey = () => {
        if (!newKeyName.trim()) return;
        const newKey: ApiKey = {
            id: Date.now(),
            name: newKeyName.trim(),
            prefix: 'op_live_',
            suffix: Math.random().toString(16).substr(2, 4),
            created: new Date().toISOString().split('T')[0],
            status: 'Active',
        };
        setApiKeys(prev => [...prev, newKey]);
        setNewKeyName('');
        setShowNewKeyModal(false);
        showToast('Tạo API Key thành công!', 'success');
    };

    const revokeKey = (id: number) => {
        setApiKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'Revoked' } : k));
        showToast('Đã thu hồi API Key', 'info');
    };

    const addWebhook = () => {
        if (!newWebhookUrl.trim()) return;
        setWebhooks(prev => [...prev, {
            id: Date.now(),
            event: newWebhookEvent,
            url: newWebhookUrl.trim(),
            status: 'Active',
        }]);
        setNewWebhookUrl('');
        setShowWebhookModal(false);
        showToast('Đã thêm Webhook!', 'success');
    };

    const deleteWebhook = (id: number) => {
        setWebhooks(prev => prev.filter(w => w.id !== id));
        showToast('Đã xóa Webhook', 'info');
    };

    const testWebhook = (url: string) => {
        showToast(`Đã gửi test tới ${url}`, 'info');
    };

    const activeKeys = apiKeys.filter(k => k.status === 'Active').length;
    const usagePercent = 15;

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">

            {/* Overlay non-enterprise */}
            {!isEnterprise && (
                <div className="absolute inset-0 z-40 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg text-center border border-gray-200 mx-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-6">
                            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Nâng cấp lên Gói Enterprise</h2>
                        <p className="text-gray-600 mb-6">Tính năng Tích hợp API và Webhooks chỉ dành cho khách hàng doanh nghiệp cấp cao.</p>
                        <div className="flex gap-3 justify-center">
                            <button className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">Liên hệ Kinh doanh</button>
                            <button onClick={() => window.history.back()} className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">Quay lại</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold flex items-center gap-2 transition-all
                    ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-indigo-500'}`}>
                    {toast.type === 'success' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                    {toast.type === 'info' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <header className="flex justify-between items-center py-4 px-6 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-800">Cổng Tích hợp API (Developer)</h2>
            </header>

            {/* Main */}
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Base URL Card */}
                        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-base font-bold text-gray-800 mb-1">Thông tin kết nối</h3>
                            <p className="text-sm text-gray-500 mb-4">Sử dụng Base URL bên dưới để thực hiện các cuộc gọi API. Tham khảo tài liệu để biết thêm về authentication và rate limits.</p>

                            <div className="bg-gray-900 rounded-xl p-4 flex items-center justify-between">
                                <code className="text-green-400 font-mono text-sm">{BASE_URL}</code>
                                <button onClick={() => copyToClipboard(BASE_URL)}
                                    className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
                                    title="Sao chép">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-4">
                                <a href="#" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                    Xem Tài liệu API (Swagger)
                                </a>
                                <a href="#" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                    Tải Postman Collection
                                </a>
                            </div>

                            {/* Stats row */}
                            <div className="mt-5 flex gap-4">
                                <div className="flex-1 bg-indigo-50 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-bold text-indigo-600">{activeKeys}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">API Keys Active</p>
                                </div>
                                <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-bold text-green-600">{webhooks.filter(w => w.status === 'Active').length}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Webhooks Active</p>
                                </div>
                                <div className="flex-1 bg-orange-50 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-bold text-orange-600">{usagePercent}%</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Rate Limit</p>
                                </div>
                            </div>
                        </div>

                        {/* Rate Limit Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center">
                            <h3 className="text-base font-bold text-gray-800 mb-4 self-start">Giới hạn Rate Limit</h3>
                            <div className="relative w-32 h-32">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <path stroke="#e5e7eb" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3" />
                                    <path stroke="#4f46e5" strokeDasharray={`${usagePercent}, 100`}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-gray-800">{usagePercent}%</span>
                                    <span className="text-xs text-gray-500">Đã dùng</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-4 text-center">Gói Enterprise: <span className="font-bold text-indigo-600">10,000 req/phút</span></p>
                            <p className="text-xs text-gray-400 mt-1">Reset mỗi 1 phút</p>
                        </div>
                    </div>

                    {/* API Keys Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-base font-bold text-gray-800">Danh sách API Key</h3>
                            <button onClick={() => setShowNewKeyModal(true)}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Tạo Key Mới
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold border-b border-gray-100">
                                        <th className="px-6 py-3">Tên Key</th>
                                        <th className="px-6 py-3">Token</th>
                                        <th className="px-6 py-3">Ngày tạo</th>
                                        <th className="px-6 py-3">Trạng thái</th>
                                        <th className="px-6 py-3 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {apiKeys.map(key => (
                                        <tr key={key.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-gray-900">{key.name}</td>
                                            <td className="px-6 py-4 font-mono text-gray-500 text-xs">
                                                <span>{key.prefix}****************{key.suffix}</span>
                                                <button onClick={() => copyToClipboard(`${key.prefix}...${key.suffix}`, key.id)}
                                                    className="ml-2 text-indigo-400 hover:text-indigo-600 transition-colors" title="Copy">
                                                    {copiedId === key.id
                                                        ? <svg className="w-4 h-4 inline text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        : <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                                    }
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{key.created}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${key.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {key.status === 'Active' ? '● Active' : '○ Revoked'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {key.status === 'Active' && (
                                                    <button onClick={() => revokeKey(key.id)}
                                                        className="text-red-500 hover:text-red-700 text-xs border border-red-200 px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 transition-colors font-semibold">
                                                        Revoke
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Webhooks */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-base font-bold text-gray-800">Webhooks</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Nhận thông báo thời gian thực về hệ thống của bạn.</p>
                            </div>
                            <button onClick={() => setShowWebhookModal(true)}
                                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Thêm Webhook
                            </button>
                        </div>
                        <div className="p-6 space-y-3">
                            {webhooks.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm">Chưa có Webhook nào. Thêm mới để bắt đầu.</div>
                            )}
                            {webhooks.map(hook => (
                                <div key={hook.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-indigo-300 transition-colors group">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg flex-shrink-0">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-semibold text-gray-800 text-sm">{hook.event}</h4>
                                            <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{hook.url}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${hook.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {hook.status}
                                        </span>
                                        <button onClick={() => testWebhook(hook.url)}
                                            className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold px-2 py-1 rounded hover:bg-indigo-50 transition-colors">
                                            Test
                                        </button>
                                        <button onClick={() => deleteWebhook(hook.id)}
                                            className="text-xs text-red-400 hover:text-red-600 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors">
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </main>

            {/* Modal: Tạo API Key */}
            {showNewKeyModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Tạo API Key Mới</h3>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tên Key</label>
                        <input type="text" value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                            placeholder="VD: Mobile App Production"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-5"
                            onKeyDown={e => e.key === 'Enter' && createApiKey()} autoFocus />
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => { setShowNewKeyModal(false); setNewKeyName(''); }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                                Hủy
                            </button>
                            <button onClick={createApiKey} disabled={!newKeyName.trim()}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                                Tạo Key
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Thêm Webhook */}
            {showWebhookModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Thêm Webhook</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sự kiện</label>
                            <select value={newWebhookEvent} onChange={e => setNewWebhookEvent(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="incident.created">Sự cố (Incident) Created</option>
                                <option value="incident.updated">Sự cố (Incident) Updated</option>
                                <option value="task.completed">Công việc (Task) Completed</option>
                                <option value="user.joined">Thành viên mới tham gia</option>
                            </select>
                        </div>
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-700 mb-2">URL Endpoint</label>
                            <input type="url" value={newWebhookUrl} onChange={e => setNewWebhookUrl(e.target.value)}
                                placeholder="https://your-server.com/hooks/opsera"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => { setShowWebhookModal(false); setNewWebhookUrl(''); }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                                Hủy
                            </button>
                            <button onClick={addWebhook} disabled={!newWebhookUrl.trim()}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                                Thêm Webhook
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApiIntegration;
