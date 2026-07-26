import { useState, useEffect, useCallback, useRef } from 'react';
import {
    HiOutlineShieldCheck, HiOutlineLockClosed, HiOutlineLockOpen,
    HiOutlineEye, HiOutlineRefresh, HiOutlineServer, HiOutlineExclamation,
    HiOutlineX, HiOutlineChip, HiOutlineGlobe, HiOutlineClock,
    HiOutlineDocumentReport, HiOutlineBan, HiOutlineCheckCircle
} from 'react-icons/hi';
import Swal from 'sweetalert2';

const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://api.aegism.online';

const hdrs = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
});

const fmtDate = (d: string) => new Date(d).toLocaleString('vi-VN');

// Severity từ aiAnalysis text
const parseSeverity = (aiText: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | null => {
    if (!aiText) return null;
    if (aiText.includes('[CRITICAL]')) return 'CRITICAL';
    if (aiText.includes('[HIGH]')) return 'HIGH';
    if (aiText.includes('[MEDIUM]')) return 'MEDIUM';
    return 'HIGH'; // default nếu có aiAnalysis nhưng không rõ
};

const severityConfig = {
    CRITICAL: { label: 'CRITICAL', color: '#ff2d55', bg: 'rgba(255,45,85,0.1)', border: 'rgba(255,45,85,0.3)', dot: '#ff2d55' },
    HIGH: { label: 'HIGH', color: '#ff9500', bg: 'rgba(255,149,0,0.1)', border: 'rgba(255,149,0,0.3)', dot: '#ff9500' },
    MEDIUM: { label: 'MEDIUM', color: '#ffd60a', bg: 'rgba(255,214,10,0.1)', border: 'rgba(255,214,10,0.3)', dot: '#ffd60a' },
};

// Attack type labels từ aiAnalysis
const parseAttackType = (aiText: string): string => {
    if (!aiText) return '';
    const types: Record<string, string> = {
        'SQL Injection': 'SQL',
        'XSS': 'XSS',
        'NoSQL Injection': 'NoSQL',
        'Path Traversal': 'Path',
        'Command Injection': 'CMD',
        'SSRF': 'SSRF',
        'Prototype Pollution': 'Proto',
    };
    for (const [key, short] of Object.entries(types)) {
        if (aiText.includes(key)) return short;
    }
    return 'ATK';
};

// Live scan animation component
function ScannerLine() {
    return (
        <div style={{ position: 'relative', height: '2px', background: 'rgba(139,92,246,0.15)', borderRadius: '1px', overflow: 'hidden' }}>
            <div style={{
                position: 'absolute', top: 0, left: 0, height: '100%', width: '40%',
                background: 'linear-gradient(90deg, transparent, #8b5cf6, transparent)',
                animation: 'scan 2s linear infinite',
            }} />
            <style>{`@keyframes scan { 0% { left: -40% } 100% { left: 140% } }`}</style>
        </div>
    );
}

// Threat score ring
function ThreatRing({ score }: { score: number }) {
    const r = 28, circ = 2 * Math.PI * r;
    const pct = Math.min(score, 100) / 100;
    const color = score >= 90 ? '#ff2d55' : score >= 60 ? '#ff9500' : score >= 30 ? '#ffd60a' : '#34c759';
    return (
        <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                strokeLinecap="round" transform="rotate(-90 36 36)"
                style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease', filter: `drop-shadow(0 0 6px ${color})` }}
            />
            <text x="36" y="40" textAnchor="middle" fill={color} fontSize="14" fontWeight="700" fontFamily="'JetBrains Mono', monospace">{score}</text>
        </svg>
    );
}

// Stats card
function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent: string }) {
    return (
        <div style={{
            background: 'rgba(17,17,27,0.8)', border: `1px solid rgba(255,255,255,0.07)`,
            borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px',
            backdropFilter: 'blur(12px)', position: 'relative', overflow: 'hidden',
        }}>
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            }} />
            <div style={{
                width: '44px', height: '44px', borderRadius: '12px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                background: `${accent}18`, color: accent, border: `1px solid ${accent}30`,
            }}>{icon}</div>
            <div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff', lineHeight: 1.1, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
            </div>
        </div>
    );
}

export default function SuperAdminSecurity() {
    const [activeTab, setActiveTab] = useState<'audit' | 'blacklist'>('audit');
    const [logs, setLogs] = useState<any[]>([]);
    const [ips, setIps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [suspiciousOnly, setSuspiciousOnly] = useState(false);
    const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
    const [threatScore, setThreatScore] = useState(0);
    const [stats, setStats] = useState({ total: 0, suspicious: 0, blocked: 0 });
    const pulseRef = useRef<any>(null);

    const loadLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/security/audit-logs?suspicious=${suspiciousOnly}&limit=100`, { headers: hdrs() });
            const json = await res.json();
            const data = json.data || [];
            setLogs(data);
            const suspicious = data.filter((l: any) => l.isSuspicious).length;
            setStats(s => ({ ...s, total: json.total || data.length, suspicious }));
            // Tính threat score tổng
            const recent = data.slice(0, 20);
            const score = Math.min(Math.round((suspicious / Math.max(recent.length, 1)) * 100 * 1.5), 100);
            setThreatScore(score);
        } catch { } finally { setLoading(false); }
    }, [suspiciousOnly]);

    const loadIPs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/security/blacklisted-ips`, { headers: hdrs() });
            const data = await res.json();
            setIps(data);
            setStats(s => ({ ...s, blocked: data.filter((i: any) => i.isBlocked).length }));
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (activeTab === 'audit') loadLogs();
        else loadIPs();
    }, [activeTab, loadLogs, loadIPs]);

    // Auto-refresh mỗi 30s
    useEffect(() => {
        pulseRef.current = setInterval(() => {
            if (activeTab === 'audit') loadLogs();
            else loadIPs();
        }, 30000);
        return () => clearInterval(pulseRef.current);
    }, [activeTab, loadLogs, loadIPs]);

    const handleUnblock = async (id: string, ip: string) => {
        const c = await Swal.fire({
            title: `Mở khóa IP ${ip}?`, icon: 'question', showCancelButton: true,
            confirmButtonText: 'Mở khóa', cancelButtonText: 'Hủy',
            background: '#0d0d15', color: '#e5e7eb',
            confirmButtonColor: '#8b5cf6',
        });
        if (!c.isConfirmed) return;
        try {
            await fetch(`${apiUrl}/api/security/unblock-ip/${id}`, { method: 'POST', headers: hdrs() });
            await Swal.fire({ icon: 'success', title: 'Đã mở khóa IP', timer: 1200, showConfirmButton: false, background: '#0d0d15', color: '#e5e7eb' });
            loadIPs();
        } catch { }
    };

    const threatColor = threatScore >= 90 ? '#ff2d55' : threatScore >= 60 ? '#ff9500' : threatScore >= 30 ? '#ffd60a' : '#34c759';
    const threatLabel = threatScore >= 90 ? 'CRITICAL' : threatScore >= 60 ? 'HIGH' : threatScore >= 30 ? 'MEDIUM' : 'LOW';

    return (
        <div style={{ minHeight: '100vh', background: '#080810', color: '#e5e7eb', fontFamily: "'Inter', 'SF Pro Display', sans-serif", padding: '24px' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 4px; height: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 4px; }
                @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
                @keyframes pulse-dot { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.5; transform:scale(0.85) } }
                @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
                @keyframes slideIn { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }
                .log-row { animation: fadeIn 0.3s ease both; }
                .log-row:hover { background: rgba(139,92,246,0.04) !important; }
                .tab-btn { transition: all 0.2s ease; }
                .action-btn { transition: all 0.15s ease; }
                .action-btn:hover { transform: translateY(-1px); }
            `}</style>

            {/* ── HEADER ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                        }}>
                            <HiOutlineShieldCheck />
                        </div>
                        <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0, letterSpacing: '-0.3px' }}>Security Operations</h1>
                        {/* Live indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.25)', borderRadius: '20px', padding: '3px 10px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34c759', animation: 'pulse-dot 2s infinite' }} />
                            <span style={{ fontSize: '11px', color: '#34c759', fontWeight: '600', letterSpacing: '0.08em' }}>LIVE</span>
                        </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Giám sát mối đe dọa & quản lý tường lửa — cập nhật mỗi 30 giây</p>
                </div>

                {/* Threat Level Gauge */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    background: 'rgba(17,17,27,0.8)', border: `1px solid ${threatColor}30`,
                    borderRadius: '16px', padding: '14px 20px', backdropFilter: 'blur(12px)',
                }}>
                    <ThreatRing score={threatScore} />
                    <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Threat Level</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: threatColor, letterSpacing: '-0.5px' }}>{threatLabel}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>dựa trên 20 request gần nhất</div>
                    </div>
                </div>
            </div>

            {/* ── STATS ROW ──────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                <StatCard icon={<HiOutlineDocumentReport />} label="Tổng nhật ký" value={stats.total.toLocaleString()} accent="#8b5cf6" />
                <StatCard icon={<HiOutlineExclamation />} label="Cảnh báo tấn công" value={stats.suspicious} accent="#ff2d55" />
                <StatCard icon={<HiOutlineBan />} label="IP bị chặn" value={stats.blocked} accent="#ff9500" />
            </div>

            {/* ── TAB BAR ────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
                {([['audit', 'Nhật ký hoạt động', HiOutlineDocumentReport], ['blacklist', 'IP Firewall', HiOutlineServer]] as const).map(([id, label, Icon]) => (
                    <button key={id} className="tab-btn" onClick={() => setActiveTab(id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                            borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                            background: activeTab === id ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'transparent',
                            color: activeTab === id ? '#fff' : 'rgba(255,255,255,0.4)',
                            boxShadow: activeTab === id ? '0 2px 12px rgba(124,58,237,0.3)' : 'none',
                        }}>
                        <Icon style={{ fontSize: '15px' }} /> {label}
                        {id === 'audit' && stats.suspicious > 0 && (
                            <span style={{ background: '#ff2d55', color: '#fff', fontSize: '10px', fontWeight: '700', borderRadius: '10px', padding: '1px 6px', minWidth: '18px', textAlign: 'center' }}>
                                {stats.suspicious}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── AUDIT LOG TAB ──────────────────────────────────────── */}
            {activeTab === 'audit' && (
                <div style={{ background: 'rgba(13,13,21,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '68vh', backdropFilter: 'blur(12px)' }}>
                    {/* Toolbar */}
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: 'rgba(255,255,255,0.02)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <ScannerLine />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <div style={{
                                    position: 'relative', width: '36px', height: '20px',
                                    background: suspiciousOnly ? '#ff2d55' : 'rgba(255,255,255,0.12)',
                                    borderRadius: '10px', transition: 'background 0.2s', cursor: 'pointer',
                                }} onClick={() => setSuspiciousOnly(v => !v)}>
                                    <div style={{
                                        position: 'absolute', top: '3px', left: suspiciousOnly ? '19px' : '3px',
                                        width: '14px', height: '14px', borderRadius: '50%',
                                        background: '#fff', transition: 'left 0.2s',
                                    }} />
                                </div>
                                <span style={{ fontSize: '13px', color: suspiciousOnly ? '#ff2d55' : 'rgba(255,255,255,0.4)', fontWeight: '600' }}>
                                    Chỉ hiển thị tấn công
                                </span>
                            </label>
                        </div>
                        <button onClick={loadLogs} className="action-btn" style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
                            color: '#8b5cf6', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                        }}>
                            <HiOutlineRefresh /> Làm mới
                        </button>
                    </div>

                    {/* Table */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr style={{ background: 'rgba(13,13,21,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['Thời gian', 'Người dùng', 'IP Address', 'Method · Endpoint', 'Attack Type', 'Mức độ', ''].map(h => (
                                        <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', border: '2px solid rgba(139,92,246,0.3)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                            <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
                                            Đang tải dữ liệu...
                                        </div>
                                    </td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.2)' }}>
                                        <HiOutlineCheckCircle style={{ fontSize: '32px', marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                                        Không có log nào
                                    </td></tr>
                                ) : logs.map((l, idx) => {
                                    const sev = l.isSuspicious ? parseSeverity(l.aiAnalysis) || 'HIGH' : null;
                                    const sevCfg = sev ? severityConfig[sev] : null;
                                    const attackType = l.isSuspicious ? parseAttackType(l.aiAnalysis) : null;
                                    return (
                                        <tr key={l.id} className="log-row" style={{
                                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                                            background: l.isSuspicious ? `${sevCfg!.color}08` : 'transparent',
                                            animationDelay: `${idx * 0.02}s`,
                                        }}>
                                            {/* Time */}
                                            <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
                                                    <HiOutlineClock style={{ flexShrink: 0 }} />
                                                    {fmtDate(l.createdAt)}
                                                </div>
                                            </td>
                                            {/* User */}
                                            <td style={{ padding: '12px 16px', maxWidth: '200px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {l.user?.fullName || 'Guest / Unauthenticated'}
                                                    </span>
                                                    {l.user?.email && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.user.email}</span>}
                                                </div>
                                            </td>
                                            {/* IP */}
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {l.isSuspicious && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: sevCfg!.color, flexShrink: 0, boxShadow: `0 0 6px ${sevCfg!.color}`, animation: 'pulse-dot 2s infinite' }} />}
                                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: '700', color: l.isSuspicious ? sevCfg!.color : 'rgba(255,255,255,0.7)' }}>{l.ipAddress}</span>
                                                </div>
                                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                                                    {l.action}
                                                </div>
                                            </td>
                                            {/* Method · Endpoint */}
                                            <td style={{ padding: '12px 16px', maxWidth: '260px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{
                                                        padding: '2px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace',
                                                        background: l.method === 'DELETE' ? 'rgba(255,45,85,0.15)' : l.method === 'POST' ? 'rgba(139,92,246,0.15)' : l.method === 'PUT' ? 'rgba(255,149,0,0.15)' : 'rgba(255,255,255,0.08)',
                                                        color: l.method === 'DELETE' ? '#ff2d55' : l.method === 'POST' ? '#a78bfa' : l.method === 'PUT' ? '#ff9500' : 'rgba(255,255,255,0.5)',
                                                        border: '1px solid currentColor', opacity: 0.9,
                                                    }}>{l.method}</span>
                                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.endpoint}</span>
                                                </div>
                                            </td>
                                            {/* Attack Type badge */}
                                            <td style={{ padding: '12px 16px' }}>
                                                {attackType ? (
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                        padding: '3px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace',
                                                        background: sevCfg!.bg, color: sevCfg!.color, border: `1px solid ${sevCfg!.border}`,
                                                    }}>
                                                        <HiOutlineChip /> {attackType}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px' }}>—</span>
                                                )}
                                            </td>
                                            {/* Severity */}
                                            <td style={{ padding: '12px 16px' }}>
                                                {sev ? (
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                        padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em',
                                                        background: sevCfg!.bg, color: sevCfg!.color, border: `1px solid ${sevCfg!.border}`,
                                                    }}>
                                                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sevCfg!.color, animation: 'blink 1.5s infinite' }} />
                                                        {sev}
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                        padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '600',
                                                        background: 'rgba(52,199,89,0.08)', color: '#34c759', border: '1px solid rgba(52,199,89,0.2)',
                                                    }}>
                                                        <HiOutlineCheckCircle /> OK
                                                    </span>
                                                )}
                                            </td>
                                            {/* View */}
                                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                <button onClick={() => setSelectedEvidence(l)} className="action-btn" style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                                                    color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '11px', fontWeight: '600',
                                                }}>
                                                    <HiOutlineEye /> Detail
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── BLACKLIST TAB ──────────────────────────────────────── */}
            {activeTab === 'blacklist' && (
                <div style={{ background: 'rgba(13,13,21,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '68vh', backdropFilter: 'blur(12px)' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>
                            <HiOutlineServer style={{ color: '#ff2d55' }} /> Danh sách IP bị chặn
                            <span style={{ background: 'rgba(255,45,85,0.15)', color: '#ff2d55', border: '1px solid rgba(255,45,85,0.3)', borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: '700' }}>
                                {ips.filter(i => i.isBlocked).length} active
                            </span>
                        </div>
                        <button onClick={loadIPs} className="action-btn" style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
                            color: '#8b5cf6', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                        }}>
                            <HiOutlineRefresh /> Làm mới
                        </button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr style={{ background: 'rgba(13,13,21,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['IP Address', 'Loại tấn công', 'Thời gian chặn', 'Trạng thái', ''].map(h => (
                                        <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.2)' }}>Đang tải...</td></tr>
                                ) : ips.map((ip, idx) => (
                                    <tr key={ip.id} className="log-row" style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                        background: ip.isBlocked ? 'rgba(255,45,85,0.04)' : 'transparent',
                                        animationDelay: `${idx * 0.03}s`,
                                    }}>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: ip.isBlocked ? 'rgba(255,45,85,0.12)' : 'rgba(255,255,255,0.05)',
                                                    border: `1px solid ${ip.isBlocked ? 'rgba(255,45,85,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                                }}>
                                                    <HiOutlineGlobe style={{ color: ip.isBlocked ? '#ff2d55' : 'rgba(255,255,255,0.3)', fontSize: '15px' }} />
                                                </div>
                                                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: '700', color: ip.isBlocked ? '#ff6b7a' : 'rgba(255,255,255,0.5)' }}>{ip.ipAddress}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{ fontSize: '12px', color: 'rgba(255,149,0,0.85)', fontFamily: 'JetBrains Mono, monospace' }}>{ip.reason || '—'}</span>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>
                                                <HiOutlineClock /> {fmtDate(ip.createdAt)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            {ip.isBlocked ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(255,45,85,0.1)', color: '#ff2d55', border: '1px solid rgba(255,45,85,0.25)' }}>
                                                    <HiOutlineLockClosed /> Đang chặn
                                                </span>
                                            ) : (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                    <HiOutlineLockOpen /> Đã mở
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                            {ip.isBlocked && (
                                                <button onClick={() => handleUnblock(ip.id, ip.ipAddress)} className="action-btn" style={{
                                                    background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
                                                    color: '#a78bfa', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                                                }}>
                                                    Mở khóa
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── EVIDENCE MODAL ─────────────────────────────────────── */}
            {selectedEvidence && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
                }} onClick={e => { if (e.target === e.currentTarget) setSelectedEvidence(null); }}>
                    <div style={{
                        background: '#0d0d15', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
                        width: '100%', maxWidth: '780px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 40px 80px rgba(0,0,0,0.6)', animation: 'slideIn 0.25s ease',
                    }}>
                        {/* Modal Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <HiOutlineDocumentReport style={{ color: '#8b5cf6' }} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '15px' }}>Chi tiết Nhật ký</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>ID: {selectedEvidence.id?.slice(0, 16)}...</div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedEvidence(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <HiOutlineX style={{ fontSize: '16px' }} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {/* AI Security Report */}
                            {selectedEvidence.aiAnalysis && (
                                <div style={{
                                    background: 'rgba(255,45,85,0.06)', border: '1px solid rgba(255,45,85,0.25)',
                                    borderRadius: '14px', padding: '16px',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                                        <HiOutlineChip style={{ color: '#ff2d55', fontSize: '16px' }} />
                                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#ff2d55', letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI Security Analysis</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'rgba(255,45,85,0.6)', background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.2)', borderRadius: '20px', padding: '2px 8px' }}>Auto-detected</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,150,160,0.9)', lineHeight: 1.6, fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap' }}>{selectedEvidence.aiAnalysis}</p>
                                </div>
                            )}

                            {/* Meta Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {[
                                    ['Thời gian', fmtDate(selectedEvidence.createdAt), HiOutlineClock],
                                    ['IP Address', selectedEvidence.ipAddress, HiOutlineGlobe],
                                    ['Người dùng', selectedEvidence.user?.fullName ? `${selectedEvidence.user.fullName} - ${selectedEvidence.user.email}` : 'Guest / Unauthenticated', HiOutlineDocumentReport],
                                ].map(([label, value, Icon]: any) => (
                                    <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                            <Icon /> {label}
                                        </div>
                                        <div style={{ fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>{value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Request Info */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px' }}>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Request</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <span style={{
                                        padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace',
                                        background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)',
                                    }}>{selectedEvidence.method}</span>
                                    <span style={{ fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', color: '#a78bfa' }}>{selectedEvidence.endpoint}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all' }}>{selectedEvidence.userAgent}</div>
                            </div>

                            {/* Payload */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px' }}>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Payload</div>
                                <pre style={{
                                    margin: 0, fontSize: '11px', fontFamily: 'JetBrains Mono, monospace',
                                    color: '#34d399', background: 'rgba(0,0,0,0.3)', borderRadius: '8px',
                                    padding: '12px', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '160px', overflowY: 'auto',
                                }}>{selectedEvidence.payload || '(trống)'}</pre>
                            </div>

                            {/* Headers */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px' }}>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Headers</div>
                                <pre style={{
                                    margin: 0, fontSize: '10px', fontFamily: 'JetBrains Mono, monospace',
                                    color: 'rgba(255,255,255,0.35)', background: 'rgba(0,0,0,0.3)', borderRadius: '8px',
                                    padding: '12px', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '120px', overflowY: 'auto',
                                }}>{selectedEvidence.headers || '(trống)'}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}