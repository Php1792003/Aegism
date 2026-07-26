import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineX, HiOutlineStar, HiOutlineCheck, HiOutlineSparkles } from 'react-icons/hi';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Campaign {
    id: string;
    title: string;
    description: string;
    type: 'BANNER_TOP' | 'MODAL' | 'TOAST' | 'BANNER_BOTTOM';
    benefits: string | null;
    targetPlanKey: string | null;
    discountPercent: number | null;
    voucherCode: string | null;
    ctaLabel: string;
    ctaUrl: string;
    endDate: string;
}

interface PromoContextType {
    campaigns: Campaign[];
    dismissCampaign: (id: string, type: 'CLOSED' | 'NEVER_SHOW') => void;
    trackClick: (id: string) => void;
}

const PromoContext = createContext<PromoContextType>({ campaigns: [], dismissCampaign: () => { }, trackClick: () => { } });

const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' : 'https://api.aegism.online';

const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

export const PromoProvider = ({ children }: { children: ReactNode }) => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const navigate = useNavigate();

    const fetchCampaigns = useCallback(async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;
            const plan = localStorage.getItem('userPlan') || 'STARTER';
            const res = await fetch(`${apiUrl}/api/promotions/active?plan=${plan.toUpperCase()}`, { headers: hdrs() });
            if (res.ok) {
                const data = await res.json();
                setCampaigns(data);
                // Track impressions
                data.forEach((c: Campaign) => {
                    fetch(`${apiUrl}/api/promotions/${c.id}/track`, {
                        method: 'POST', headers: hdrs(), body: JSON.stringify({ action: 'impression' }),
                    }).catch(() => { });
                });
            }
        } catch { }
    }, []);

    useEffect(() => {
        const timer = setTimeout(fetchCampaigns, 2000); // Delay 2s to not block initial load
        const interval = setInterval(fetchCampaigns, 30 * 60 * 1000); // Refresh every 30min
        return () => { clearTimeout(timer); clearInterval(interval); };
    }, [fetchCampaigns]);

    const dismissCampaign = useCallback(async (id: string, type: 'CLOSED' | 'NEVER_SHOW') => {
        setCampaigns(prev => prev.filter(c => c.id !== id));
        try {
            await fetch(`${apiUrl}/api/promotions/${id}/track`, {
                method: 'POST', headers: hdrs(), body: JSON.stringify({ action: 'dismiss', dismissType: type }),
            });
        } catch { }
    }, []);

    const trackClick = useCallback(async (id: string) => {
        try {
            await fetch(`${apiUrl}/api/promotions/${id}/track`, {
                method: 'POST', headers: hdrs(), body: JSON.stringify({ action: 'click' }),
            });
        } catch { }
    }, []);

    const [activeIndex, setActiveIndex] = useState(0);

    const handleAutoNext = useCallback(() => {
        setActiveIndex(prev => prev + 1);
    }, []);

    // Split campaigns by type
    const bannerTops = campaigns.filter(c => c.type === 'BANNER_TOP');
    const bannerTop = bannerTops.length > 0 ? bannerTops[activeIndex % bannerTops.length] : undefined;

    const bannerBottoms = campaigns.filter(c => c.type === 'BANNER_BOTTOM');
    const bannerBottom = bannerBottoms.length > 0 ? bannerBottoms[activeIndex % bannerBottoms.length] : undefined;

    const modal = campaigns.find(c => c.type === 'MODAL');
    const toast = campaigns.find(c => c.type === 'TOAST');

    const handleCta = (campaign: Campaign) => {
        trackClick(campaign.id);
        if (campaign.ctaUrl.startsWith('/')) navigate(campaign.ctaUrl);
        else window.open(campaign.ctaUrl, '_blank');
    };

    return (
        <PromoContext.Provider value={{ campaigns, dismissCampaign, trackClick }}>
            {bannerTop && (
                <PromoBanner key={`top-${bannerTop.id}-${activeIndex}`} campaign={bannerTop} position="top" onDismiss={dismissCampaign} onCta={handleCta} onAutoNext={bannerTops.length > 1 ? handleAutoNext : undefined} />
            )}
            {children}
            {bannerBottom && (
                <PromoBanner key={`bottom-${bannerBottom.id}-${activeIndex}`} campaign={bannerBottom} position="bottom" onDismiss={dismissCampaign} onCta={handleCta} onAutoNext={bannerBottoms.length > 1 ? handleAutoNext : undefined} />
            )}
            {toast && (
                <PromoToast key={`toast-${toast.id}`} campaign={toast} onDismiss={dismissCampaign} onCta={handleCta} />
            )}
            {modal && (
                <PromoModal key={`modal-${modal.id}`} campaign={modal} onDismiss={dismissCampaign} onCta={handleCta} />
            )}
        </PromoContext.Provider>
    );
};


// ─── BANNER COMPONENT ─────────────────────────────────────────────────────────

const PromoBanner = ({ campaign, position, onDismiss, onCta, onAutoNext }: {
    campaign: Campaign; position: 'top' | 'bottom';
    onDismiss: (id: string, type: 'CLOSED' | 'NEVER_SHOW') => void;
    onCta: (c: Campaign) => void;
    onAutoNext?: () => void;
}) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setTimeout(() => setVisible(true), 300);

        if (onAutoNext) {
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onAutoNext, 500);
            }, 8000); // 8 seconds per slide
            return () => clearTimeout(timer);
        }
    }, [onAutoNext]);

    const handleDismiss = (type: 'CLOSED' | 'NEVER_SHOW') => {
        setVisible(false);
        setTimeout(() => onDismiss(campaign.id, type), 500);
    };

    return (
        <div className={`w-full z-[60] transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 ' + (position === 'top' ? '-translate-y-full' : 'translate-y-full')}`}>
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white px-4 py-2.5 relative overflow-hidden pr-10">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-30" />

                <button onClick={() => handleDismiss('CLOSED')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors z-10">
                    <HiOutlineX className="w-4 h-4" />
                </button>

                <div className="relative flex items-center justify-center gap-3 flex-wrap">
                    <HiOutlineSparkles className="w-4 h-4 flex-shrink-0 animate-pulse" />
                    <span className="text-sm font-semibold">{campaign.title}</span>
                    <span className="text-xs opacity-80 hidden sm:inline">— {campaign.description}</span>
                    {campaign.discountPercent && (
                        <span className="bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold animate-bounce">
                            -{campaign.discountPercent}%
                        </span>
                    )}
                    <button onClick={() => onCta(campaign)}
                        className="bg-white text-purple-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-purple-50 transition-colors flex-shrink-0">
                        {campaign.ctaLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── TOAST COMPONENT ──────────────────────────────────────────────────────────

const PromoToast = ({ campaign, onDismiss, onCta }: {
    campaign: Campaign;
    onDismiss: (id: string, type: 'CLOSED' | 'NEVER_SHOW') => void;
    onCta: (c: Campaign) => void;
}) => {
    const [visible, setVisible] = useState(false);

    const handleDismiss = useCallback((type: 'CLOSED' | 'NEVER_SHOW') => {
        setVisible(false);
        setTimeout(() => onDismiss(campaign.id, type), 500);
    }, [campaign.id, onDismiss]);

    useEffect(() => {
        setTimeout(() => setVisible(true), 1000);
        const timer = setTimeout(() => handleDismiss('CLOSED'), 10000);
        return () => clearTimeout(timer);
    }, [handleDismiss]);

    return (
        <div className={`fixed bottom-4 right-4 z-[70] max-w-sm transition-all duration-500 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-1" />
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <HiOutlineStar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900">{campaign.title}</h4>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{campaign.description}</p>
                            <button onClick={() => onCta(campaign)}
                                className="mt-2 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors">
                                {campaign.ctaLabel} →
                            </button>
                        </div>
                        <button onClick={() => handleDismiss('CLOSED')}
                            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0">
                            <HiOutlineX className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── MODAL COMPONENT ──────────────────────────────────────────────────────────

const PromoModal = ({ campaign, onDismiss, onCta }: {
    campaign: Campaign;
    onDismiss: (id: string, type: 'CLOSED' | 'NEVER_SHOW') => void;
    onCta: (c: Campaign) => void;
}) => {
    const [visible, setVisible] = useState(false);
    useEffect(() => { setTimeout(() => setVisible(true), 3000); }, []); // Show after 3s delay

    const handleDismiss = (type: 'CLOSED' | 'NEVER_SHOW') => {
        setVisible(false);
        setTimeout(() => onDismiss(campaign.id, type), 300); // 300ms for scaleOut animation
    };

    const benefits: string[] = (() => {
        try { return JSON.parse(campaign.benefits || '[]'); } catch { return []; }
    })();

    return (
        <div className={`fixed inset-0 z-[80] flex items-center justify-center p-4 transition-opacity duration-300 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => handleDismiss('CLOSED')}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-300 ${visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}
                onClick={e => e.stopPropagation()}>
                {/* Header gradient */}
                <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                    <button onClick={() => handleDismiss('CLOSED')}
                        className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/20 transition-colors">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                    <HiOutlineStar className="w-10 h-10 mb-3 text-yellow-300" />
                    <h2 className="text-xl font-bold">{campaign.title}</h2>
                    <p className="text-sm text-white/80 mt-1">{campaign.description}</p>
                    {campaign.discountPercent && (
                        <div className="mt-3 inline-flex items-center bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                            🔥 Giảm {campaign.discountPercent}%
                        </div>
                    )}
                </div>

                {/* Benefits */}
                {benefits.length > 0 && (
                    <div className="px-6 py-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quyền lợi khi nâng cấp</p>
                        <ul className="space-y-2">
                            {benefits.map((b, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                    <HiOutlineCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    {b}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Voucher code */}
                {campaign.voucherCode && (
                    <div className="mx-6 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-xs text-purple-500">Mã khuyến mãi</p>
                            <p className="text-lg font-bold text-purple-700 tracking-widest">{campaign.voucherCode}</p>
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(campaign.voucherCode!); }}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium px-3 py-1 rounded-lg hover:bg-purple-100 transition-colors">
                            Sao chép
                        </button>
                    </div>
                )}

                {/* Actions */}
                <div className="p-6 space-y-3">
                    <button onClick={() => onCta(campaign)}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl">
                        {campaign.ctaLabel}
                    </button>
                    <div className="flex items-center justify-between">
                        <button onClick={() => handleDismiss('CLOSED')}
                            className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                            Để sau
                        </button>
                        <button onClick={() => handleDismiss('NEVER_SHOW')}
                            className="text-xs text-gray-300 hover:text-gray-500 transition-colors">
                            Không hiển thị nữa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

