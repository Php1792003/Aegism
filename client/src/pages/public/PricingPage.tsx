import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HiCheck, HiXMark, HiChevronDown, HiShieldCheck, HiOutlineSparkles, HiOutlineTag, HiOutlineArrowRight } from 'react-icons/hi2';
import SEO from '@/components/seo/SEO';
import { BreadcrumbSchema, FAQSchema } from '@/components/seo/StructuredData';
import { usePageAnimations } from '@/hooks/useGsap';
import { SplitWords } from '@/components/ui/SplitWords';

const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' : 'https://api.aegism.online';

interface UserInfo { fullName: string; email: string; phone: string; company: string; }
const DISCOUNT_CODES: Record<string, { type: 'percent' | 'fixed', value: number, label: string }> = {
    'AEGISM20': { type: 'percent', value: 20, label: 'Giảm 20%' },
    'WELCOME': { type: 'fixed', value: 100000, label: 'Giảm 100.000đ' },
    'SALE50': { type: 'percent', value: 50, label: 'Giảm 50%' },
    'NEW100': { type: 'fixed', value: 200000, label: 'Giảm 200.000đ' },
};

const toPlanKey = (k: string) => k.toLowerCase();
const toApiPlanKey = (k: string) => k.toUpperCase();

interface PlanConfig {
    planKey: string;
    displayName: string;
    monthlyPrice: number;
    yearlyPrice: number;
    maxUsers: number;
    maxProjects: number;
    maxQRCodes: number;
    features: string[];
    isActive: boolean;
}

const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const applyDiscount = (price: number, discount: { type: 'percent' | 'fixed', value: number } | null) => {
    if (!discount) return price;
    if (discount.type === 'percent') return Math.max(0, price - Math.round(price * discount.value / 100));
    return Math.max(0, price - discount.value);
};
const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const faqItems = [
    {
        question: "Làm thế nào để nâng cấp gói dịch vụ khi quy mô tăng?",
        answer: "Bạn có thể nâng cấp bất cứ lúc nào từ Dashboard hoặc liên hệ bộ phận hỗ trợ. Hệ thống sẽ tự động tính bù trừ số ngày sử dụng còn lại của gói cũ."
    },
    {
        question: "Chính sách hoàn tiền của AEGISM như thế nào?",
        answer: "Chúng tôi cam kết hoàn tiền 100% trong vòng 14 ngày đầu tiên nếu hệ thống không đáp ứng được nhu cầu vận hành thực tế của bạn."
    },
    {
        question: "AEGISM có hỗ trợ hóa đơn VAT không?",
        answer: "Có! Toàn bộ các gói dịch vụ đều được xuất hóa đơn điện tử (VAT) hợp lệ gửi về email công ty của bạn ngay sau khi thanh toán thành công."
    },
    {
        question: "Tôi có thể thanh toán qua những hình thức nào?",
        answer: "Hệ thống hỗ trợ thanh toán trực tuyến qua cổng PayOS (mã VietQR mọi ngân hàng quét tự động xác nhận trong 10 giây) hoặc chuyển khoản hợp đồng doanh nghiệp."
    }
];

const PricingPage = () => {
    const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlanKey, setSelectedPlanKey] = useState<string>('STARTER');
    const [paymentStep, setPaymentStep] = useState<'info' | 'processing' | 'waiting' | 'success' | 'error'>('info');
    const [orderCode, setOrderCode] = useState('');
    const [checkoutUrl, setCheckoutUrl] = useState('');
    const [countdown, setCountdown] = useState(600);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [discountCode, setDiscountCode] = useState('');
    const [discountResult, setDiscountResult] = useState<{ valid: boolean; type: 'percent' | 'fixed'; value: number; message: string } | null>(null);
    const [checkingCode, setCheckingCode] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo>({ fullName: '', email: '', phone: '', company: '' });
    const pollingRef = useRef<any>(null);
    const countdownRef = useRef<any>(null);
    const [dynamicPlans, setDynamicPlans] = useState<PlanConfig[]>([]);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const containerRef = usePageAnimations<HTMLDivElement>();

    const selectedPlanObj = dynamicPlans.find(p => p.planKey === selectedPlanKey) || null;

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (token && user.id) {
            setIsLoggedIn(true);
            setUserInfo({ fullName: user.name || user.fullName || '', email: user.email || '', phone: user.phone || '', company: user.tenantName || user.tenant?.name || '' });
        }
        fetch(`${apiUrl}/api/payment/plan-config`)
            .then(r => r.json())
            .then((configs: PlanConfig[]) => {
                const active = configs.filter(c => c.isActive);
                setDynamicPlans(active);
                const firstPaid = active.find(c => c.monthlyPrice > 0);
                if (firstPaid) setSelectedPlanKey(firstPaid.planKey);
            })
            .catch(() => {
                setDynamicPlans([
                    { planKey: 'STARTER', displayName: 'Starter', monthlyPrice: 499000, yearlyPrice: 399000, maxUsers: 10, maxProjects: 3, maxQRCodes: 100, features: ['Tối đa 10 người dùng', 'Tối đa 3 dự án', '100 mã QR', 'Hỗ trợ email 24/7'], isActive: true },
                    { planKey: 'BUSINESS', displayName: 'Business', monthlyPrice: 999000, yearlyPrice: 799000, maxUsers: 50, maxProjects: 20, maxQRCodes: 500, features: ['Tối đa 50 người dùng', 'Dự án không giới hạn', '500 mã QR', 'Hỗ trợ ưu tiên 24/7', 'Bản đồ số GPS', 'Báo cáo SLA Excel/PDF'], isActive: true },
                    { planKey: 'ENTERPRISE', displayName: 'Enterprise', monthlyPrice: 0, yearlyPrice: 0, maxUsers: 999, maxProjects: 999, maxQRCodes: 9999, features: ['Không giới hạn User', 'Server riêng On-premise', 'Tùy chỉnh tính năng', 'Tích hợp API hệ thống', 'Đào tạo nhân viên tận nơi'], isActive: true },
                ]);
            });
        return () => { clearInterval(pollingRef.current); clearInterval(countdownRef.current); };
    }, []);

    const getPlanPrice = () => selectedPlanObj ? (cycle === 'monthly' ? selectedPlanObj.monthlyPrice : selectedPlanObj.yearlyPrice) : 0;
    const calculateSubTotal = () => cycle === 'yearly' ? getPlanPrice() * 12 : getPlanPrice();

    const openModal = (planKey: string) => {
        if (!isLoggedIn) { setShowLoginModal(true); return; }
        setSelectedPlanKey(planKey); setPaymentStep('info'); setOrderCode(''); setCheckoutUrl(''); setIsModalOpen(true);
    };

    const checkDiscountCode = async () => {
        if (!discountCode.trim()) return;
        setCheckingCode(true);
        await new Promise(r => setTimeout(r, 400));
        const code = discountCode.trim().toUpperCase();
        const found = DISCOUNT_CODES[code];
        if (found) {
            setDiscountResult({ valid: true, type: found.type, value: found.value, message: `✅ Áp dụng thành công: ${found.label}` });
        } else {
            setDiscountResult({ valid: false, type: 'percent', value: 0, message: '❌ Mã giảm giá không hợp lệ hoặc đã hết hạn' });
        }
        setCheckingCode(false);
    };

    const getFinalPrice = () => {
        const base = calculateSubTotal();
        if (!discountResult?.valid) return base;
        return applyDiscount(base, discountResult);
    };

    const closeModal = () => {
        clearInterval(pollingRef.current); clearInterval(countdownRef.current);
        setIsModalOpen(false); setPaymentStep('info'); setOrderCode(''); setCheckoutUrl('');
        setDiscountCode(''); setDiscountResult(null);
    };

    const handlePay = async () => {
        if (!userInfo.fullName || !userInfo.email) return;
        setPaymentStep('processing');
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${apiUrl}/api/payment/payos/create`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: toApiPlanKey(selectedPlanKey), discountCode: discountResult?.valid ? discountCode.toUpperCase() : undefined }),
            });
            if (!res.ok) throw new Error('Lỗi');
            const data = await res.json();
            setOrderCode(String(data.orderCode)); setCheckoutUrl(data.checkoutUrl || '');
            setCountdown(600); setPaymentStep('waiting');
            startPolling(String(data.orderCode));
        } catch { setPaymentStep('error'); }
    };

    const startPolling = (code: string) => {
        clearInterval(pollingRef.current); clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => setCountdown(p => p > 0 ? p - 1 : 0), 1000);
        pollingRef.current = setInterval(async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await fetch(`${apiUrl}/api/payment/payos/status?orderCode=${code}`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.status === 'PAID') {
                        clearInterval(pollingRef.current); clearInterval(countdownRef.current);
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        if (user.tenant) {
                            user.tenant.subscriptionPlan = toApiPlanKey(selectedPlanKey);
                            const exp = new Date(); exp.setDate(exp.getDate() + 30);
                            user.tenant.subscriptionExpiresAt = exp.toISOString();
                            localStorage.setItem('user', JSON.stringify(user));
                            localStorage.setItem('userPlan', toPlanKey(selectedPlanKey));
                        }
                        localStorage.removeItem('tenantLimits');
                        setPaymentStep('success');
                    }
                }
            } catch { }
        }, 3000);
    };

    return (
        <div ref={containerRef} className="overflow-x-clip bg-white text-gray-900 font-sans selection:bg-blue-600 selection:text-white">
            <SEO
                title="Bảng Giá AEGISM - Gói Dịch Vụ Tuần Tra & Quản Trị An Ninh"
                description="Bảng giá các gói Starter, Business, Enterprise của AEGISM. Không chi phí ẩn, miễn phí dùng thử 14 ngày, tiết kiệm 20% khi thanh toán theo năm."
                url="/pricing"
                keywords="bảng giá AEGISM, chi phí phần mềm an ninh, gói cước tuần tra QR, phần mềm quản lý bảo vệ giá rẻ"
            />
            <BreadcrumbSchema items={[{ name: 'Trang chủ', url: '/' }, { name: 'Bảng giá', url: '/pricing' }]} />
            <FAQSchema items={faqItems} />

            {/* Scroll progress bar */}
            <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1">
                <div data-progress className="h-full origin-left scale-x-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400" />
            </div>

            <main>
                {/* --- HERO & BILLING TOGGLE --- */}
                <section className="pt-14 pb-16 bg-gradient-to-b from-blue-50/60 via-white to-white">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                        <div data-hero-entrance="badge" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
                            <HiOutlineSparkles className="w-4 h-4 text-blue-600" />
                            <span>Đầu tư hiệu quả cho an ninh bền vững</span>
                        </div>

                        <h1 data-hero-entrance="title" className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.15]">
                            <SplitWords text="Bảng Giá Dịch Vụ" />
                            <br />
                            <SplitWords
                                text="Minh Bạch & Linh Hoạt"
                                innerClassName="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 bg-clip-text text-transparent"
                            />
                        </h1>

                        <p data-hero-entrance="desc" className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            Chọn gói dịch vụ phù hợp với quy mô nhân sự của bạn. Nâng cấp hoặc thay đổi số lượng điểm chốt bất kỳ khi nào bạn muốn.
                        </p>

                        {/* Billing Switch */}
                        <div data-reveal="up" className="flex justify-center items-center gap-4 mt-8">
                            <span className={`text-sm font-semibold ${cycle === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>
                                Thanh toán hàng tháng
                            </span>
                            <button
                                onClick={() => setCycle(c => c === 'monthly' ? 'yearly' : 'monthly')}
                                className="w-14 h-7 bg-blue-600 rounded-full p-1 transition-colors duration-200 focus:outline-none relative flex items-center"
                                aria-label="Chuyển đổi chu kỳ thanh toán"
                            >
                                <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 transform ${cycle === 'yearly' ? 'translate-x-7' : ''}`} />
                            </button>
                            <span className={`text-sm font-semibold flex items-center gap-1.5 ${cycle === 'yearly' ? 'text-blue-600' : 'text-gray-400'}`}>
                                Thanh toán hàng năm
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    Tiết kiệm 20%
                                </span>
                            </span>
                        </div>

                        {/* Promo Voucher Banner */}
                        <div data-reveal="up" className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                            <HiOutlineTag className="w-4 h-4 text-amber-600" />
                            <span>Nhập mã <strong className="text-amber-700 font-mono">AEGISM20</strong> để nhận thêm ưu đãi 20% trong hôm nay!</span>
                        </div>
                    </div>
                </section>

                {/* --- PRICING CARDS --- */}
                <section className="pb-20">
                    <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                        <div data-stagger-group className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                            {dynamicPlans.map((plan, index) => {
                                const isEnterprise = plan.planKey === 'ENTERPRISE' || (plan.monthlyPrice === 0 && plan.yearlyPrice === 0);
                                const priceStr = isEnterprise
                                    ? 'Liên hệ'
                                    : cycle === 'monthly'
                                        ? formatMoney(plan.monthlyPrice)
                                        : formatMoney(plan.yearlyPrice);
                                const isHighlighted = plan.planKey === 'BUSINESS';

                                return (
                                    <div
                                        key={index}
                                        data-stagger-item
                                        className={`
                                            relative flex flex-col p-8 bg-white rounded-3xl transition-all duration-300
                                            ${isHighlighted
                                                ? 'border-2 border-blue-600 shadow-2xl scale-[1.03] z-10'
                                                : 'border border-gray-200 shadow-md hover:shadow-xl'
                                            }
                                        `}
                                    >
                                        {isHighlighted && (
                                            <div className="absolute top-0 right-0 -mt-3.5 mr-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-black px-3.5 py-1 rounded-full shadow-md uppercase tracking-wider">
                                                Phổ biến nhất
                                            </div>
                                        )}

                                        <div className="mb-4">
                                            <h3 className={`text-2xl font-black ${isHighlighted ? 'text-blue-600' : 'text-gray-900'}`}>{plan.displayName}</h3>
                                            <p className="text-xs text-gray-500 mt-2 min-h-[36px]">
                                                {plan.planKey === 'STARTER' && 'Mục tiêu đơn lẻ, đội tuần tra vừa và nhỏ dưới 10 nhân sự.'}
                                                {plan.planKey === 'BUSINESS' && 'Tòa nhà văn phòng, khu chung cư và công ty an ninh chuyên nghiệp.'}
                                                {plan.planKey === 'ENTERPRISE' && 'Tập đoàn đa chi nhánh, server riêng và cam kết SLA chặt chẽ.'}
                                            </p>
                                        </div>

                                        <div className="mb-6 flex items-baseline">
                                            <span className="text-3xl sm:text-4xl font-black text-gray-900">{priceStr}</span>
                                            {!isEnterprise && <span className="text-gray-500 font-medium ml-1.5 text-sm">/tháng</span>}
                                        </div>

                                        <ul className="mb-8 space-y-3.5 flex-1 border-t border-gray-100 pt-6">
                                            <li className="flex items-center text-sm font-semibold text-gray-700">
                                                <HiCheck className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                                                <span>Tối đa {plan.maxUsers} người dùng</span>
                                            </li>
                                            <li className="flex items-center text-sm font-semibold text-gray-700">
                                                <HiCheck className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                                                <span>Tối đa {plan.maxProjects} dự án</span>
                                            </li>
                                            <li className="flex items-center text-sm font-semibold text-gray-700">
                                                <HiCheck className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                                                <span>Tối đa {plan.maxQRCodes} điểm quét QR</span>
                                            </li>
                                            {(Array.isArray(plan.features) ? plan.features : []).map((f: string, idx: number) => (
                                                <li key={idx} className="flex items-center text-sm text-gray-600">
                                                    <HiCheck className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                                                    <span>{f}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {isEnterprise ? (
                                            <Link
                                                to="/contact"
                                                className="w-full block text-center py-3.5 rounded-xl font-bold transition-all text-sm bg-gray-900 text-white hover:bg-gray-800"
                                            >
                                                Liên hệ chuyên viên
                                            </Link>
                                        ) : (
                                            <button
                                                onClick={() => openModal(plan.planKey)}
                                                className={`
                                                    w-full block text-center py-3.5 rounded-xl font-bold transition-all text-sm
                                                    ${isHighlighted
                                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25'
                                                        : 'bg-gray-100 text-gray-800 hover:bg-blue-50 hover:text-blue-600'
                                                    }
                                                `}
                                            >
                                                Nâng cấp gói này
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* --- FAQ ACCORDION --- */}
                <section className="bg-gray-50 py-20 border-t border-gray-100">
                    <div className="container mx-auto max-w-4xl px-4 sm:px-6">
                        <div data-reveal="up" className="text-center mb-12">
                            <span className="text-blue-600 text-xs font-bold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                Thắc mắc thường gặp
                            </span>
                            <h2 data-split className="mt-3 text-3xl font-extrabold text-gray-900">
                                <SplitWords text="Giải Đáp Về Bảng Giá & Thanh Toán" />
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {faqItems.map((faq, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <div
                                        key={idx}
                                        data-reveal="up"
                                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
                                    >
                                        <button
                                            onClick={() => setOpenFaq(isOpen ? null : idx)}
                                            className="w-full text-left px-6 py-4 flex items-center justify-between font-bold text-gray-900 hover:text-blue-600 transition"
                                        >
                                            <span className="text-base">{faq.question}</span>
                                            <HiChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                                        </button>
                                        {isOpen && (
                                            <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                                                {faq.answer}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </main>

            {/* PAYMENT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" onClick={['info', 'waiting', 'error'].includes(paymentStep) ? closeModal : undefined}>
                            <div className="absolute inset-0 bg-gray-900/75 backdrop-blur-sm"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative">
                            {['info', 'waiting', 'error'].includes(paymentStep) && (
                                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"><HiXMark className="text-2xl" /></button>
                            )}
                            <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
                                <div className="lg:col-span-5 bg-gray-50 p-6 border-r border-gray-200 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Tóm Tắt Đơn Hàng</h3>
                                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">Gói dịch vụ</p>
                                                    <h4 className="text-xl font-bold text-blue-600">{selectedPlanObj?.displayName || selectedPlanKey}</h4>
                                                </div>
                                                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full uppercase">{cycle === 'yearly' ? 'Năm' : 'Tháng'}</span>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-gray-100 text-sm space-y-1">
                                                <div className="flex justify-between"><span className="text-gray-500">Đơn giá:</span><span className="font-semibold">{formatMoney(getPlanPrice())}</span></div>
                                                <div className="flex justify-between"><span className="text-gray-500">Chu kỳ:</span><span className="font-semibold">{cycle === 'yearly' ? '12 tháng (-20%)' : '30 ngày'}</span></div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4">
                                            <p className="text-xs text-gray-500 mb-2 font-semibold">Mã ưu đãi / Voucher:</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={discountCode}
                                                    onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscountResult(null); }}
                                                    placeholder="VD: AEGISM20"
                                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold outline-none focus:border-blue-600 uppercase"
                                                />
                                                <button
                                                    onClick={checkDiscountCode}
                                                    disabled={checkingCode || !discountCode.trim()}
                                                    className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg font-bold disabled:opacity-40 hover:bg-blue-700 transition"
                                                >
                                                    {checkingCode ? '...' : 'Áp dụng'}
                                                </button>
                                            </div>
                                            {discountResult && <p className={`text-xs mt-1.5 font-medium ${discountResult.valid ? 'text-emerald-600' : 'text-rose-500'}`}>{discountResult.message}</p>}
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-4 mt-4">
                                        {discountResult?.valid && (
                                            <div className="space-y-1 text-sm text-gray-500 mb-2">
                                                <div className="flex justify-between"><span>Tạm tính:</span><span>{formatMoney(calculateSubTotal())}</span></div>
                                                <div className="flex justify-between text-emerald-600 font-semibold"><span>Giảm giá:</span><span>-{formatMoney(calculateSubTotal() - getFinalPrice())}</span></div>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                            <span className="font-bold text-gray-900">Tổng thanh toán:</span>
                                            <span className="text-2xl font-black text-blue-600">{formatMoney(getFinalPrice())}</span>
                                        </div>
                                        <p className="mt-3 text-[11px] text-gray-400">🔒 Cổng thanh toán bảo mật PayOS & VietQR</p>
                                    </div>
                                </div>

                                <div className="lg:col-span-7 p-6 sm:p-8 relative">
                                    {paymentStep === 'info' && (
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4">Thông Tin Khách Hàng</h3>
                                            <div className="space-y-4 mb-6">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1">Họ và tên *</label>
                                                    <input type="text" value={userInfo.fullName} onChange={e => setUserInfo(p => ({ ...p, fullName: e.target.value }))} className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:border-blue-600 text-sm" placeholder="Nguyễn Văn A" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1">Email nhận thông báo kích hoạt *</label>
                                                    <input type="email" value={userInfo.email} onChange={e => setUserInfo(p => ({ ...p, email: e.target.value }))} className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:border-blue-600 text-sm" placeholder="admin@doanhnghiep.com" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại</label>
                                                        <input type="tel" value={userInfo.phone} onChange={e => setUserInfo(p => ({ ...p, phone: e.target.value }))} className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:border-blue-600 text-sm" placeholder="0901..." />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-700 mb-1">Công ty / Tổ chức</label>
                                                        <input type="text" value={userInfo.company} onChange={e => setUserInfo(p => ({ ...p, company: e.target.value }))} className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:border-blue-600 text-sm" placeholder="Tên đơn vị" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border border-blue-200 bg-blue-50/60 rounded-xl p-4 mb-6 text-xs text-blue-900 leading-relaxed">
                                                Hệ thống sẽ tạo mã QR thanh toán tức thời. Ngay sau khi ngân hàng xác nhận, gói dịch vụ của bạn sẽ được kích hoạt tự động.
                                            </div>

                                            <button
                                                onClick={handlePay}
                                                disabled={!userInfo.fullName || !userInfo.email}
                                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                Tạo mã VietQR thanh toán ({formatMoney(getFinalPrice())})
                                            </button>
                                        </div>
                                    )}

                                    {paymentStep === 'processing' && (
                                        <div className="h-full flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
                                            <div className="w-14 h-14 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                                            <p className="font-bold text-gray-800">Đang khởi tạo giao dịch PayOS...</p>
                                            <p className="text-xs text-gray-500 mt-1">Vui lòng không tắt trình duyệt.</p>
                                        </div>
                                    )}

                                    {paymentStep === 'waiting' && (
                                        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold mb-4">
                                                ⏱️ Hết hạn trong {fmtCountdown(countdown)}
                                            </div>
                                            <h4 className="text-xl font-bold text-gray-900 mb-2">Quét Mã VietQR Để Kích Hoạt</h4>
                                            <p className="text-xs text-gray-500 mb-4 max-w-sm">Mở ứng dụng ngân hàng bất kỳ để quét mã. Đơn hàng sẽ tự động duyệt trong giây lát.</p>

                                            {checkoutUrl && (
                                                <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-md mb-4">
                                                    <iframe
                                                        src={checkoutUrl}
                                                        className="w-72 sm:w-80 h-80 border-0 rounded-xl"
                                                        title="Cổng thanh toán PayOS"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex gap-3 mt-2">
                                                <a
                                                    href={checkoutUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
                                                >
                                                    Mở trang PayOS rời ↗
                                                </a>
                                                <button
                                                    onClick={closeModal}
                                                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50"
                                                >
                                                    Đóng
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {paymentStep === 'success' && (
                                        <div className="h-full flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
                                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 text-3xl">
                                                ✓
                                            </div>
                                            <h4 className="text-2xl font-black text-gray-900">Kích Hoạt Thành Công!</h4>
                                            <p className="text-sm text-gray-600 mt-2 max-w-sm">Gói {selectedPlanObj?.displayName} đã được kích hoạt cho tổ chức của bạn.</p>
                                            <Link
                                                to="/dashboard"
                                                onClick={closeModal}
                                                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition"
                                            >
                                                Vào Dashboard ngay
                                            </Link>
                                        </div>
                                    )}

                                    {paymentStep === 'error' && (
                                        <div className="h-full flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
                                            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 text-3xl">
                                                ✕
                                            </div>
                                            <h4 className="text-xl font-bold text-gray-900">Khởi Tạo Thất Bại</h4>
                                            <p className="text-xs text-gray-500 mt-2 max-w-sm">Đã có sự cố kết nối tới cổng PayOS. Vui lòng thử lại hoặc liên hệ hỗ trợ.</p>
                                            <button onClick={() => setPaymentStep('info')} className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
                                                Thử lại
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LOGIN PROMPT MODAL */}
            {showLoginModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                            🔒
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">Yêu Cầu Đăng Nhập</h4>
                        <p className="text-xs text-gray-500 mt-2 mb-6">Bạn cần đăng nhập hoặc tạo tài khoản trước khi thực hiện thanh toán gói dịch vụ.</p>
                        <div className="space-y-2">
                            <Link to="/login" className="w-full block py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700">
                                Đăng nhập tài khoản
                            </Link>
                            <Link to="/register" className="w-full block py-2.5 border border-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-50">
                                Đăng ký tài khoản mới
                            </Link>
                            <button onClick={() => setShowLoginModal(false)} className="text-xs text-gray-400 mt-2 hover:underline">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PricingPage;
