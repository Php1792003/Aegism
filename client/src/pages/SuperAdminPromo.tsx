import { useState, useEffect, useCallback } from 'react';
import {
    HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX,
    HiOutlineEye, HiOutlineSpeakerphone, HiOutlineLightningBolt,
    HiOutlineChartBar, HiOutlineCursorClick, HiOutlineSparkles
} from 'react-icons/hi';
import Swal from 'sweetalert2';

const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' : 'https://api.aegism.online';
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` });
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const fmtNum = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

const TYPE_OPTIONS = [
    { value: 'BANNER_TOP', label: 'Banner trên', emoji: '🔝' },
    { value: 'BANNER_BOTTOM', label: 'Banner dưới', emoji: '⬇️' },
    { value: 'MODAL', label: 'Modal popup', emoji: '🪟' },
    { value: 'TOAST', label: 'Toast thông báo', emoji: '🔔' },
];

const TRIGGER_OPTIONS = [
    { value: 'APP_OPEN', label: 'Khi mở app' },
    { value: 'LOGIN', label: 'Khi đăng nhập' },
    { value: 'LIMIT_REACHED', label: 'Hết giới hạn' },
    { value: 'PREMIUM_FEATURE', label: 'Tính năng Premium' },
    { value: 'SCHEDULED', label: 'Theo lịch' },
    { value: 'NEW_FEATURE', label: 'Tính năng mới' },
];

const CampaignModal = ({ campaign, onClose, onSave }: {
    campaign: any | null; onClose: () => void;
    onSave: (data: any) => Promise<void>;
}) => {
    const isNew = !campaign;
    const [form, setForm] = useState({
        title: campaign?.title || '',
        description: campaign?.description || '',
        type: campaign?.type || 'BANNER_TOP',
        benefits: (() => { try { return JSON.parse(campaign?.benefits || '[]').join('\n'); } catch { return ''; } })(),
        targetPlanKey: campaign?.targetPlanKey || '',
        discountPercent: campaign?.discountPercent || '',
        voucherCode: campaign?.voucherCode || '',
        ctaLabel: campaign?.ctaLabel || 'Nâng cấp ngay',
        ctaUrl: campaign?.ctaUrl || '/pricing',
        targetAudience: (() => { try { return (JSON.parse(campaign?.targetAudience || '{}').plans || []).join(', '); } catch { return ''; } })(),
        triggerEvent: campaign?.triggerEvent || 'APP_OPEN',
        isActive: campaign?.isActive ?? true,
        startDate: campaign?.startDate ? new Date(campaign.startDate).toISOString().slice(0, 16) : '',
        endDate: campaign?.endDate ? new Date(campaign.endDate).toISOString().slice(0, 16) : '',
        priority: campaign?.priority || 0,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const plans = form.targetAudience.split(',').map((s: string) => s.trim()).filter(Boolean);
        const benefitsList = form.benefits.split('\n').map((s: string) => s.trim()).filter(Boolean);
        await onSave({
            ...form,
            benefits: JSON.stringify(benefitsList),
            targetAudience: JSON.stringify({ plans }),
            discountPercent: form.discountPercent ? parseInt(String(form.discountPercent)) : null,
            priority: parseInt(String(form.priority)),
        });
        setSaving(false);
    };

    const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
                    <h2 className="text-white font-bold text-lg">{isNew ? '🚀 Tạo chiến dịch mới' : '✏️ Chỉnh sửa chiến dịch'}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"><HiOutlineX className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Title & Description */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Tiêu đề *</label>
                            <input value={form.title} onChange={e => set('title', e.target.value)} required
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                                placeholder="VD: Giảm 30% gói Business" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Mô tả *</label>
                            <textarea value={form.description} onChange={e => set('description', e.target.value)} required rows={2}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
                                placeholder="Mô tả ngắn gọn về chiến dịch" />
                        </div>
                    </div>

                    {/* Type & Trigger */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Kiểu hiển thị</label>
                            <select value={form.type} onChange={e => set('type', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-purple-500 outline-none">
                                {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Sự kiện trigger</label>
                            <select value={form.triggerEvent} onChange={e => set('triggerEvent', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-purple-500 outline-none">
                                {TRIGGER_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* CTA & Discount */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Nhãn nút CTA</label>
                            <input value={form.ctaLabel} onChange={e => set('ctaLabel', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-purple-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">URL CTA</label>
                            <input value={form.ctaUrl} onChange={e => set('ctaUrl', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-purple-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Giảm giá (%)</label>
                            <input type="number" value={form.discountPercent} onChange={e => set('discountPercent', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-purple-500 outline-none"
                                placeholder="30" />
                        </div>
                    </div>

                    {/* Voucher & Target Plan */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Mã voucher (nếu có)</label>
                            <input value={form.voucherCode} onChange={e => set('voucherCode', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-purple-500 outline-none"
                                placeholder="SUMMER2025" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Đối tượng (plans, cách nhau bởi dấu phẩy)</label>
                            <input value={form.targetAudience} onChange={e => set('targetAudience', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-purple-500 outline-none"
                                placeholder="NONE, STARTER" />
                        </div>
                    </div>

                    {/* Benefits */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Quyền lợi (mỗi dòng 1 quyền lợi)</label>
                        <textarea value={form.benefits} onChange={e => set('benefits', e.target.value)} rows={3}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-purple-500 outline-none resize-none"
                            placeholder="Không giới hạn dự án&#10;Hỗ trợ 24/7&#10;Báo cáo nâng cao" />
                    </div>

                    {/* Dates & Priority */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Bắt đầu *</label>
                            <input type="datetime-local" value={form.startDate} onChange={e => set('startDate', e.target.value)} required
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-purple-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Kết thúc *</label>
                            <input type="datetime-local" value={form.endDate} onChange={e => set('endDate', e.target.value)} required
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-purple-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Độ ưu tiên</label>
                            <input type="number" value={form.priority} onChange={e => set('priority', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-purple-500 outline-none" />
                        </div>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => set('isActive', !form.isActive)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-600'}`}>
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'left-[22px]' : 'left-0.5'}`} />
                        </button>
                        <span className="text-sm text-gray-300">{form.isActive ? 'Đang bật' : 'Đã tắt'}</span>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-colors">Huỷ</button>
                        <button type="submit" disabled={saving}
                            className="flex-1 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-colors disabled:opacity-50">
                            {saving ? 'Đang lưu...' : isNew ? 'Tạo chiến dịch' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const SuperAdminPromo = () => {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalData, setModalData] = useState<{ open: boolean; campaign: any | null }>({ open: false, campaign: null });

    const fetchCampaigns = useCallback(async () => {
        try {
            const res = await fetch(`${apiUrl}/api/master-admin/promotions`, { headers: hdrs() });
            if (res.ok) setCampaigns(await res.json());
        } catch { }
        setLoading(false);
    }, []);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

    const handleSave = async (data: any) => {
        const isNew = !modalData.campaign;
        const url = isNew ? `${apiUrl}/api/master-admin/promotions` : `${apiUrl}/api/master-admin/promotions/${modalData.campaign.id}`;
        const method = isNew ? 'POST' : 'PUT';
        try {
            const res = await fetch(url, { method, headers: hdrs(), body: JSON.stringify(data) });
            if (res.ok) {
                setModalData({ open: false, campaign: null });
                fetchCampaigns();
                Swal.fire({ icon: 'success', title: isNew ? 'Đã tạo!' : 'Đã lưu!', timer: 1500, showConfirmButton: false });
            }
        } catch { }
    };

    const handleToggle = async (id: string) => {
        await fetch(`${apiUrl}/api/master-admin/promotions/${id}/toggle`, { method: 'PATCH', headers: hdrs() });
        fetchCampaigns();
    };

    const handleDelete = async (c: any) => {
        const result = await Swal.fire({
            title: 'Xoá chiến dịch?', text: `"${c.title}" sẽ bị xoá vĩnh viễn.`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444',
            confirmButtonText: 'Xoá', cancelButtonText: 'Huỷ',
        });
        if (result.isConfirmed) {
            await fetch(`${apiUrl}/api/master-admin/promotions/${c.id}`, { method: 'DELETE', headers: hdrs() });
            fetchCampaigns();
        }
    };

    const handleAiGenerate = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/api/master-admin/promotions/ai/generate`, { method: 'POST', headers: hdrs() });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Đã tạo!', text: 'AI đã phân tích dữ liệu và đề xuất 1 chiến lược.', timer: 2000, showConfirmButton: false });
                fetchCampaigns();
            } else {
                Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể kết nối đến AI hoặc xảy ra lỗi phân tích.' });
            }
        } catch { }
        setLoading(false);
    };

    const handleAiApprove = async (id: string) => {
        await fetch(`${apiUrl}/api/master-admin/promotions/${id}/approve`, { method: 'PATCH', headers: hdrs() });
        fetchCampaigns();
    };

    const handleAiReject = async (id: string) => {
        await fetch(`${apiUrl}/api/master-admin/promotions/${id}/reject`, { method: 'PATCH', headers: hdrs() });
        fetchCampaigns();
    };

    // Stats
    const standardCampaigns = campaigns.filter(c => c.status !== 'PENDING_APPROVAL');
    const pendingCampaigns = campaigns.filter(c => c.status === 'PENDING_APPROVAL');
    const totalCampaigns = standardCampaigns.length;
    const activeCampaigns = standardCampaigns.filter(c => c.isActive).length;
    const totalImpressions = standardCampaigns.reduce((s, c) => s + (c.impressions || 0), 0);
    const totalClicks = standardCampaigns.reduce((s, c) => s + (c.clicks || 0), 0);
    const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';

    const typeInfo = (t: string) => TYPE_OPTIONS.find(o => o.value === t) || { label: t, emoji: '📢' };

    return (
        <div className="min-h-screen p-4 md:p-6 lg:p-8 text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">🎯 Chiến dịch Quảng bá</h1>
                    <p className="text-sm text-gray-400 mt-1">Quản lý thông báo quảng bá gói dịch vụ</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleAiGenerate} disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg disabled:opacity-50">
                        <HiOutlineSparkles className="w-4 h-4" /> {loading ? 'Đang phân tích...' : 'AI Tạo chiến lược'}
                    </button>
                    <button onClick={() => setModalData({ open: true, campaign: null })}
                        className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg">
                        <HiOutlinePlus className="w-4 h-4" /> Tạo chiến dịch
                    </button>
                </div>
            </div>

            {/* AI Proposals Section */}
            {pendingCampaigns.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                        <HiOutlineSparkles /> Đề xuất từ AI chờ duyệt ({pendingCampaigns.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingCampaigns.map(c => (
                            <div key={c.id} className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg text-white">{c.title}</h3>
                                    <p className="text-sm text-gray-300 mt-1">{c.description}</p>

                                    <div className="mt-4 p-3 bg-black/30 rounded-lg border border-white/5">
                                        <div className="text-xs font-semibold text-blue-300 mb-1 flex items-center gap-1">
                                            <HiOutlineChartBar className="w-3 h-3" /> Lý do đề xuất:
                                        </div>
                                        <p className="text-sm text-gray-300 italic">"{c.aiReasoning}"</p>
                                    </div>

                                    <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                                        <div>Loại: <span className="text-white font-medium">{typeInfo(c.type).label}</span></div>
                                        {c.discountPercent && <div>Giảm: <span className="text-yellow-400 font-bold">{c.discountPercent}%</span></div>}
                                        {c.targetPlanKey && <div>Gói: <span className="text-white font-medium">{c.targetPlanKey}</span></div>}
                                    </div>

                                    <div className="mt-5 flex gap-3">
                                        <button onClick={() => handleAiApprove(c.id)}
                                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-bold transition-colors">
                                            Phê duyệt & Chạy
                                        </button>
                                        <button onClick={() => handleAiReject(c.id)}
                                            className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-200 py-2 rounded-lg text-sm font-bold transition-colors border border-red-900/50">
                                            Từ chối
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Tổng chiến dịch', value: totalCampaigns, icon: <HiOutlineSpeakerphone className="w-5 h-5" />, color: 'purple' },
                    { label: 'Đang chạy', value: activeCampaigns, icon: <HiOutlineLightningBolt className="w-5 h-5" />, color: 'green' },
                    { label: 'Lượt hiển thị', value: fmtNum(totalImpressions), icon: <HiOutlineEye className="w-5 h-5" />, color: 'blue' },
                    { label: 'CTR trung bình', value: `${avgCtr}%`, icon: <HiOutlineCursorClick className="w-5 h-5" />, color: 'orange' },
                ].map((s, i) => (
                    <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                            {s.icon} {s.label}
                        </div>
                        <div className="text-2xl font-bold text-white">{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Chiến dịch</th>
                                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Kiểu</th>
                                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Thời gian</th>
                                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                                <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hiển thị</th>
                                <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nhấp</th>
                                <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nâng cấp</th>
                                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-16 text-gray-500">Đang tải...</td></tr>
                            ) : campaigns.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-16 text-gray-500">
                                    <HiOutlineSpeakerphone className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                                    <p className="font-medium">Chưa có chiến dịch nào</p>
                                    <p className="text-xs mt-1">Nhấn "Tạo chiến dịch" để bắt đầu</p>
                                </td></tr>
                            ) : campaigns.map(c => {
                                const ti = typeInfo(c.type);
                                const now = new Date();
                                const isRunning = c.isActive && new Date(c.startDate) <= now && new Date(c.endDate) >= now;
                                const isExpired = new Date(c.endDate) < now;
                                return (
                                    <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="text-white font-semibold text-sm">{c.title}</div>
                                            <div className="text-gray-500 text-xs mt-0.5 line-clamp-1">{c.description}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
                                                {ti.emoji} {ti.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-gray-400 text-xs">
                                            <div>{fmtDate(c.startDate)}</div>
                                            <div>→ {fmtDate(c.endDate)}</div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {isExpired ? (
                                                <span className="px-2 py-1 bg-gray-800 text-gray-500 rounded-full text-xs">Hết hạn</span>
                                            ) : isRunning ? (
                                                <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs">Đang chạy</span>
                                            ) : c.isActive ? (
                                                <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded-full text-xs">Chờ</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-800 text-gray-500 rounded-full text-xs">Đã tắt</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-right text-gray-300">{fmtNum(c.impressions || 0)}</td>
                                        <td className="px-4 py-4 text-right text-gray-300">{fmtNum(c.clicks || 0)}</td>
                                        <td className="px-4 py-4 text-right text-gray-300">{fmtNum(c.conversions || 0)}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleToggle(c.id)} title={c.isActive ? 'Tắt' : 'Bật'}
                                                    className={`p-1.5 rounded-lg transition-colors ${c.isActive ? 'hover:bg-yellow-900/50 text-yellow-400' : 'hover:bg-green-900/50 text-green-400'}`}>
                                                    <HiOutlineLightningBolt className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setModalData({ open: true, campaign: c })} title="Sửa"
                                                    className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                                                    <HiOutlinePencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(c)} title="Xoá"
                                                    className="p-1.5 rounded-lg hover:bg-red-900/50 text-gray-400 hover:text-red-400 transition-colors">
                                                    <HiOutlineTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {modalData.open && (
                <CampaignModal
                    campaign={modalData.campaign}
                    onClose={() => setModalData({ open: false, campaign: null })}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default SuperAdminPromo;
