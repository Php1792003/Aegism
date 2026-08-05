import { useState, useEffect, useRef } from 'react';
import {
    HiOutlineMail, HiOutlineSearch, HiOutlineRefresh, HiOutlineFilter,
    HiOutlineChevronDown, HiOutlinePaperAirplane, HiOutlineTag,
    HiOutlineUser, HiOutlineClock, HiOutlineExclamation,
    HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineInboxIn
} from 'react-icons/hi';

const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' : 'https://api.aegism.online';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
});

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface Ticket {
    id: string;
    subject: string;
    customerEmail: string;
    customerName: string | null;
    status: TicketStatus;
    priority: TicketPriority;
    tags: string | null;
    assignedTo: { id: string; fullName: string; avatar: string | null } | null;
    createdAt: string;
    updatedAt: string;
    messages: { id: string; direction: string; bodyText: string | null; createdAt: string }[];
    _count: { messages: number };
}

interface TicketDetail extends Ticket {
    tenant: { id: string; name: string };
    messages: {
        id: string;
        direction: string;
        fromEmail: string;
        fromName: string | null;
        toEmail: string;
        subject: string | null;
        bodyHtml: string | null;
        bodyText: string | null;
        createdAt: string;
    }[];
}

interface Stats {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    todayCount: number;
}

const statusConfig: Record<TicketStatus, { label: string; color: string; bg: string; icon: any }> = {
    OPEN: { label: 'Mở', color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-800/50', icon: HiOutlineInboxIn },
    IN_PROGRESS: { label: 'Đang xử lý', color: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-800/50', icon: HiOutlineClock },
    RESOLVED: { label: 'Đã giải quyết', color: 'text-green-400', bg: 'bg-green-900/30 border-green-800/50', icon: HiOutlineCheckCircle },
    CLOSED: { label: 'Đã đóng', color: 'text-gray-400', bg: 'bg-gray-800 border-gray-700', icon: HiOutlineXCircle },
};

const priorityConfig: Record<TicketPriority, { label: string; color: string; bg: string }> = {
    LOW: { label: 'Thấp', color: 'text-gray-400', bg: 'bg-gray-800' },
    NORMAL: { label: 'Bình thường', color: 'text-blue-400', bg: 'bg-blue-900/30' },
    HIGH: { label: 'Cao', color: 'text-orange-400', bg: 'bg-orange-900/30' },
    URGENT: { label: 'Khẩn cấp', color: 'text-red-400', bg: 'bg-red-900/30' },
};

const Helpdesk = () => {
    const [stats, setStats] = useState<Stats>({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, todayCount: 0 });
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [priorityFilter, setPriorityFilter] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/helpdesk/stats`, { headers: getHeaders() });
            if (res.ok) setStats(await res.json());
        } catch { }
    };

    const fetchTickets = async (p = page) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p), limit: '20' });
            if (statusFilter) params.set('status', statusFilter);
            if (priorityFilter) params.set('priority', priorityFilter);
            if (search) params.set('search', search);
            const res = await fetch(`${apiUrl}/api/helpdesk/tickets?${params}`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                setTickets(data.data);
                setTotalPages(data.totalPages);
            }
        } catch { }
        setLoading(false);
    };

    const fetchTicketDetail = async (id: string) => {
        setDetailLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/helpdesk/tickets/${id}`, { headers: getHeaders() });
            if (res.ok) setSelectedTicket(await res.json());
        } catch { }
        setDetailLoading(false);
    };

    const handleReply = async () => {
        if (!selectedTicket || !replyContent.trim()) return;
        setSending(true);
        try {
            const res = await fetch(`${apiUrl}/api/helpdesk/tickets/${selectedTicket.id}/reply`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ content: replyContent }),
            });
            if (res.ok) {
                setReplyContent('');
                await fetchTicketDetail(selectedTicket.id);
                fetchTickets();
                fetchStats();
            }
        } catch { }
        setSending(false);
    };

    const handleUpdateTicket = async (field: string, value: string) => {
        if (!selectedTicket) return;
        try {
            const res = await fetch(`${apiUrl}/api/helpdesk/tickets/${selectedTicket.id}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ [field]: value }),
            });
            if (res.ok) {
                await fetchTicketDetail(selectedTicket.id);
                fetchTickets();
                fetchStats();
            }
        } catch { }
    };

    useEffect(() => { fetchStats(); fetchTickets(1); }, []);
    useEffect(() => { fetchTickets(1); setPage(1); }, [statusFilter, priorityFilter]);
    useEffect(() => { if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [selectedTicket?.messages]);

    const handleSearch = () => { setPage(1); fetchTickets(1); };

    const getInitials = (name: string | null, email: string) => {
        if (name) return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        return email.slice(0, 2).toUpperCase();
    };

    const formatTime = (d: string) => {
        const date = new Date(d);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        if (diff < 60000) return 'Vừa xong';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-full flex flex-col">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                    { label: 'Tổng Ticket', value: stats.total, color: 'from-blue-500 to-blue-600', icon: '📬' },
                    { label: 'Đang mở', value: stats.open, color: 'from-amber-500 to-amber-600', icon: '📨' },
                    { label: 'Đã giải quyết', value: stats.resolved, color: 'from-emerald-500 to-emerald-600', icon: '✅' },
                    { label: 'Hôm nay', value: stats.todayCount, color: 'from-purple-500 to-purple-600', icon: '📅' },
                ].map((s, i) => (
                    <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                                <p className="text-2xl font-bold text-gray-200 mt-1">{s.value}</p>
                            </div>
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-lg`}>
                                {s.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-4 min-h-0">
                {/* Ticket List (Left Panel) */}
                <div className="w-full md:w-96 flex flex-col bg-gray-900 rounded-xl border border-gray-800 shadow-sm overflow-hidden">
                    {/* Search & Filters */}
                    <div className="p-3 border-b border-gray-800 space-y-2">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo email, tiêu đề..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                />
                            </div>
                            <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-purple-900/30 border-purple-500 text-purple-400' : 'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                                <HiOutlineFilter className="w-4 h-4" />
                            </button>
                            <button onClick={() => { fetchTickets(); fetchStats(); }} className="p-2 rounded-lg border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors">
                                <HiOutlineRefresh className="w-4 h-4" />
                            </button>
                        </div>
                        {showFilters && (
                            <div className="flex gap-2">
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="flex-1 text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="">Tất cả trạng thái</option>
                                    {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                </select>
                                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="flex-1 text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="">Tất cả ưu tiên</option>
                                    {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Ticket Items */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                <HiOutlineMail className="w-10 h-10 mb-2" />
                                <p className="text-sm">Chưa có ticket nào</p>
                            </div>
                        ) : (
                            tickets.map(t => {
                                const sc = statusConfig[t.status];
                                const pc = priorityConfig[t.priority];
                                const isActive = selectedTicket?.id === t.id;
                                const lastMsg = t.messages[0];
                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => fetchTicketDetail(t.id)}
                                        className={`px-4 py-3 border-b border-gray-800 cursor-pointer transition-all hover:bg-gray-800/50 ${isActive ? 'bg-gray-800 border-l-4 border-l-purple-500' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                {getInitials(t.customerName, t.customerEmail)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-semibold text-gray-200 truncate">{t.customerName || t.customerEmail}</p>
                                                    <span className="text-[10px] text-gray-500 flex-shrink-0">{formatTime(t.updatedAt)}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 truncate mt-0.5 font-medium">{t.subject}</p>
                                                {lastMsg && <p className="text-xs text-gray-400 truncate mt-0.5">{lastMsg.bodyText?.slice(0, 80)}</p>}
                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${sc.bg} ${sc.color}`}>{sc.label}</span>
                                                    {t.priority !== 'NORMAL' && <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${pc.bg} ${pc.color}`}>{pc.label}</span>}
                                                    <span className="text-[10px] text-gray-400 ml-auto">{t._count.messages} tin</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-800 text-xs text-gray-400">
                            <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); fetchTickets(page - 1); }} className="px-2 py-1 rounded hover:bg-gray-800 disabled:opacity-40">← Trước</button>
                            <span>{page}/{totalPages}</span>
                            <button disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); fetchTickets(page + 1); }} className="px-2 py-1 rounded hover:bg-gray-800 disabled:opacity-40">Sau →</button>
                        </div>
                    )}
                </div>

                {/* Ticket Detail (Right Panel) */}
                <div className="hidden md:flex flex-1 flex-col bg-gray-900 rounded-xl border border-gray-800 shadow-sm overflow-hidden">
                    {!selectedTicket ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <HiOutlineMail className="w-16 h-16 mb-4 text-gray-700" />
                            <p className="text-lg font-medium text-gray-400">Chọn một ticket để xem chi tiết</p>
                            <p className="text-sm text-gray-500 mt-1">Danh sách email hỗ trợ từ khách hàng</p>
                        </div>
                    ) : detailLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
                        </div>
                    ) : (
                        <>
                            {/* Ticket Header */}
                            <div className="px-5 py-4 border-b border-gray-800">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-gray-200 truncate">{selectedTicket.subject}</h3>
                                        <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-400">
                                            <span className="flex items-center gap-1"><HiOutlineUser className="w-3.5 h-3.5" />{selectedTicket.customerName || selectedTicket.customerEmail}</span>
                                            <span className="flex items-center gap-1"><HiOutlineMail className="w-3.5 h-3.5" />{selectedTicket.customerEmail}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <div className="relative">
                                            <select
                                                value={selectedTicket.status}
                                                onChange={e => handleUpdateTicket('status', e.target.value)}
                                                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border appearance-none pr-7 cursor-pointer outline-none ${statusConfig[selectedTicket.status].bg} ${statusConfig[selectedTicket.status].color}`}
                                            >
                                                {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                            </select>
                                            <HiOutlineChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={selectedTicket.priority}
                                                onChange={e => handleUpdateTicket('priority', e.target.value)}
                                                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg appearance-none pr-7 cursor-pointer outline-none ${priorityConfig[selectedTicket.priority].bg} ${priorityConfig[selectedTicket.priority].color}`}
                                            >
                                                {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                            </select>
                                            <HiOutlineChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                                {selectedTicket.assignedTo && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                        <HiOutlineTag className="w-3.5 h-3.5" />
                                        <span>Phụ trách: <strong className="text-gray-300">{selectedTicket.assignedTo.fullName}</strong></span>
                                    </div>
                                )}
                            </div>

                            {/* Messages Timeline */}
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-950/50">
                                {selectedTicket.messages.map(msg => {
                                    const isInbound = msg.direction === 'INBOUND';
                                    return (
                                        <div key={msg.id} className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${isInbound
                                                ? 'bg-gray-800 border border-gray-700 rounded-tl-sm'
                                                : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-tr-sm'
                                                }`}>
                                                <div className={`flex items-center gap-2 mb-1.5 text-[11px] ${isInbound ? 'text-gray-400' : 'text-purple-100'}`}>
                                                    <span className="font-medium">{isInbound ? (msg.fromName || msg.fromEmail) : 'Bạn'}</span>
                                                    <span>•</span>
                                                    <span>{new Date(msg.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                                                </div>
                                                {msg.bodyHtml ? (
                                                    <div
                                                        className={`text-sm leading-relaxed ${isInbound ? 'text-gray-200' : 'text-white'}`}
                                                        dangerouslySetInnerHTML={{ __html: msg.bodyHtml }}
                                                    />
                                                ) : (
                                                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isInbound ? 'text-gray-200' : 'text-white'}`}>
                                                        {msg.bodyText || '(Không có nội dung)'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Editor */}
                            {selectedTicket.status !== 'CLOSED' && (
                                <div className="px-5 py-3 border-t border-gray-800 bg-gray-900">
                                    <div className="flex gap-3">
                                        <textarea
                                            value={replyContent}
                                            onChange={e => setReplyContent(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply(); }}
                                            placeholder="Nhập nội dung trả lời... (Ctrl+Enter để gửi)"
                                            rows={3}
                                            className="flex-1 resize-none bg-gray-800 text-gray-200 border border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500"
                                        />
                                        <button
                                            onClick={handleReply}
                                            disabled={sending || !replyContent.trim()}
                                            className="self-end px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow flex items-center gap-2"
                                        >
                                            {sending ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                            ) : (
                                                <HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />
                                            )}
                                            Gửi
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1.5">Gửi từ: contact@aegism.online • Ctrl+Enter để gửi nhanh</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Helpdesk;
