import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiCheck, HiXMark, HiChevronDown, HiCheckCircle } from 'react-icons/hi2';

const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' : 'https://api.aegism.online';

interface Colors { primary: string; bgPrimary: string; bgPrimaryHover: string; dark: string; lightBg: string; cardBg: string; borderPrimary: string; }
interface UserInfo { fullName: string; email: string; phone: string; company: string; }
const PLAN_KEY_MAP: Record<string, string> = { starter: 'STARTER', business: 'PROFESSIONAL' };
const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const PricingPage = () => {
    const navigate = useNavigate();
    const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'starter' | 'business'>('starter');
    const [paymentStep, setPaymentStep] = useState<'info' | 'processing' | 'waiting' | 'success' | 'error'>('info');
    const [orderCode, setOrderCode] = useState('');
    const [checkoutUrl, setCheckoutUrl] = useState('');
    const [countdown, setCountdown] = useState(600);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo>({ fullName: '', email: '', phone: '', company: '' });
    const pollingRef = useRef<any>(null);
    const countdownRef = useRef<any>(null);

    const plans = { starter: { monthly: 499000, yearly: 399000 }, business: { monthly: 999000, yearly: 799000 } };
    const colors: Colors = { primary: 'text-[#4F46E5]', bgPrimary: 'bg-[#4F46E5]', bgPrimaryHover: 'hover:bg-[#4338ca]', dark: 'text-[#1e293b]', lightBg: 'bg-[#f8fafc]', cardBg: 'bg-white', borderPrimary: 'border-[#4F46E5]' };

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (token && user.id) {
            setIsLoggedIn(true);
            setUserInfo({ fullName: user.name || user.fullName || '', email: user.email || '', phone: user.phone || '', company: user.tenantName || user.tenant?.name || '' });
        }
        return () => { clearInterval(pollingRef.current); clearInterval(countdownRef.current); };
    }, []);

    const getPlanPrice = () => plans[selectedPlan][cycle];
    const calculateSubTotal = () => cycle === 'yearly' ? getPlanPrice() * 12 : getPlanPrice();
    const toggleCycle = () => setCycle(p => p === 'monthly' ? 'yearly' : 'monthly');

    const openModal = (plan: 'starter' | 'business') => {
        if (!isLoggedIn) { navigate('/login'); return; }
        setSelectedPlan(plan); setPaymentStep('info'); setOrderCode(''); setCheckoutUrl(''); setIsModalOpen(true);
    };

    const closeModal = () => {
        clearInterval(pollingRef.current); clearInterval(countdownRef.current);
        setIsModalOpen(false); setPaymentStep('info'); setOrderCode(''); setCheckoutUrl('');
    };

    const handlePay = async () => {
        if (!userInfo.fullName || !userInfo.email) return;
        setPaymentStep('processing');
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${apiUrl}/api/payment/payos/create`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: PLAN_KEY_MAP[selectedPlan] || 'STARTER' }),
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
                            user.tenant.subscriptionPlan = PLAN_KEY_MAP[selectedPlan];
                            const exp = new Date(); exp.setDate(exp.getDate() + 30);
                            user.tenant.subscriptionExpiresAt = exp.toISOString();
                            localStorage.setItem('user', JSON.stringify(user));
                            localStorage.setItem('userPlan', selectedPlan);
                        }
                        setPaymentStep('success');
                    }
                }
            } catch {}
        }, 3000);
    };

    return (
        <div className="bg-white text-gray-800 font-sans">
            <main className={colors.lightBg}>
                <section className="bg-white pt-16 pb-12">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className={`text-4xl md:text-5xl font-extrabold ${colors.dark} tracking-tight`}>Gói dịch vụ phù hợp cho mọi quy mô</h1>
                        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">Chọn gói phù hợp nhất với nhu cầu của bạn. Nâng cấp, hạ cấp hoặc hủy bỏ bất cứ lúc nào.</p>
                        {!isLoggedIn && (
                            <div className="mt-4 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-lg text-sm">
                                ⚠️ Bạn cần <Link to="/login" className="font-bold underline ml-1">đăng nhập</Link> để mua gói
                            </div>
                        )}
                        <div className="mt-10 flex justify-center items-center space-x-4 cursor-pointer" onClick={toggleCycle}>
                            <span className={`font-medium ${cycle === 'monthly' ? colors.dark : 'text-gray-400'}`}>Hàng tháng</span>
                            <div className="relative inline-block w-14 align-middle select-none">
                                <div className={`block overflow-hidden h-6 rounded-full ${cycle === 'yearly' ? colors.bgPrimary : 'bg-gray-300'}`}></div>
                                <div className={`absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-300 top-0 transition-all duration-300 ${cycle === 'yearly' ? 'right-0 border-[#4F46E5]' : 'left-0'}`}></div>
                            </div>
                            <span className={`font-medium ${cycle === 'yearly' ? colors.primary : 'text-gray-400'}`}>Hàng năm <span className="text-green-500 text-sm font-bold ml-1">(-20%)</span></span>
                        </div>
                    </div>
                </section>

                <section className="py-16 md:py-20 relative z-10">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                            {planConfig.map((plan) => {
                                const isBusiness = plan.id === 'business';
                                const priceDisplay = plan.price ? formatMoney(cycle === 'monthly' ? plan.price.monthly : plan.price.yearly) : 'Liên hệ';
                                return (
                                    <div key={plan.id} className={`group relative flex flex-col p-8 bg-white rounded-3xl border transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] ${isBusiness ? 'border-[#4F46E5] ring-1 ring-[#4F46E5] shadow-xl z-10 scale-105 md:scale-110' : 'border-gray-100 shadow-lg'}`}>
                                        {plan.isPopular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#4F46E5] to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase">Khuyên dùng</div>}
                                        <div className="mb-6">
                                            <h3 className={`text-2xl font-bold ${isBusiness ? 'text-[#4F46E5]' : 'text-gray-900'}`}>{plan.name}</h3>
                                            <p className="text-gray-500 text-sm mt-2 min-h-[40px]">{plan.description}</p>
                                        </div>
                                        <div className="mb-6 flex items-baseline">
                                            <span className="text-4xl font-extrabold text-gray-900">{priceDisplay}</span>
                                            {plan.price && <span className="ml-1 text-xl text-gray-500">/tháng</span>}
                                        </div>
                                        {cycle === 'yearly' && plan.price && <p className="text-xs text-green-600 font-semibold mb-6 bg-green-50 w-fit px-2 py-1 rounded">Tiết kiệm {formatMoney((plan.price.monthly - plan.price.yearly) * 12)} /năm</p>}
                                        <button onClick={() => plan.price ? openModal(plan.id as 'starter' | 'business') : window.location.href = '/contact'}
                                            className={`w-full py-3 px-4 rounded-xl font-bold transition-all ${isBusiness ? 'bg-[#4F46E5] text-white hover:bg-[#4338ca] shadow-md' : 'bg-indigo-50 text-[#4F46E5] hover:bg-indigo-100'}`}>
                                            {plan.buttonText}
                                        </button>
                                        <div className="border-t border-gray-100 my-8"></div>
                                        <ul className="space-y-4 flex-1">
                                            {plan.features.map((f, i) => (
                                                <li key={i} className="flex items-start">
                                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isBusiness ? 'bg-indigo-100' : 'bg-green-100'}`}>
                                                        <HiCheck className={`w-4 h-4 ${isBusiness ? 'text-[#4F46E5]' : 'text-green-600'}`} />
                                                    </div>
                                                    <span className="ml-3 text-gray-600 text-sm font-medium">{f}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="bg-white py-16 md:py-24 border-t border-gray-100">
                    <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12"><h2 className={`text-3xl font-extrabold ${colors.dark}`}>Câu hỏi thường gặp</h2></div>
                        <div className="space-y-4">
                            <FAQItem question="Làm thế nào để nâng cấp gói dịch vụ?" answer="Bạn có thể nâng cấp bất cứ lúc nào, hệ thống sẽ tự động tính phí chênh lệch." colors={colors} />
                            <FAQItem question="Chính sách hoàn tiền?" answer="Chúng tôi hoàn tiền trong 14 ngày đầu nếu bạn không hài lòng." colors={colors} />
                        </div>
                    </div>
                </section>
            </main>

            {/* PAYMENT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" onClick={paymentStep === 'info' ? closeModal : undefined}>
                            <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full relative">
                            {(paymentStep === 'info' || paymentStep === 'error') && (
                                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"><HiXMark className="text-2xl" /></button>
                            )}
                            <div className="grid grid-cols-1 lg:grid-cols-12 h-full lg:min-h-[600px]">
                                {/* Sidebar */}
                                <div className="lg:col-span-4 bg-gray-50 p-6 border-r border-gray-200 flex flex-col">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6">Đơn hàng của bạn</h3>
                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold">Gói dịch vụ</p>
                                                <h4 className={`text-xl font-bold ${colors.primary} capitalize`}>{selectedPlan}</h4>
                                            </div>
                                            <span className={`px-2 py-1 bg-blue-100 ${colors.primary} text-xs font-bold rounded uppercase`}>{cycle === 'yearly' ? 'Năm' : 'Tháng'}</span>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                                            <div className="flex justify-between mb-1"><span className="text-gray-600">Đơn giá:</span><span className="font-medium">{formatMoney(getPlanPrice())}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">Thời hạn:</span><span className="font-medium">30 ngày</span></div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-200 mb-auto">
                                        <p className="text-xs text-gray-500 mb-2 font-medium">Thay đổi chu kỳ:</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setCycle('monthly')} className={`flex-1 py-1 text-sm rounded border ${cycle === 'monthly' ? `${colors.bgPrimary} text-white` : 'bg-gray-50 text-gray-600 border-gray-200'}`}>Tháng</button>
                                            <button onClick={() => setCycle('yearly')} className={`flex-1 py-1 text-sm rounded border ${cycle === 'yearly' ? `${colors.bgPrimary} text-white` : 'bg-gray-50 text-gray-600 border-gray-200'}`}>Năm (-20%)</button>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-200 pt-4 mt-6">
                                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                            <span className="font-bold text-gray-900">Tổng cộng:</span>
                                            <span className={`text-2xl font-bold ${colors.primary}`}>{formatMoney(calculateSubTotal())}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xs text-gray-400">🔒 Bảo mật bởi PayOS & VietQR</div>
                                </div>

                                {/* Main */}
                                <div className="lg:col-span-8 p-6 lg:p-8 relative">
                                    {paymentStep === 'info' && (
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-6">Thông tin thanh toán</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                                                    <input type="text" value={userInfo.fullName} onChange={e => setUserInfo(p => ({ ...p, fullName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#4F46E5]" placeholder="Nguyễn Văn A" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                                    <input type="email" value={userInfo.email} onChange={e => setUserInfo(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#4F46E5]" placeholder="email@example.com" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                                    <input type="tel" value={userInfo.phone} onChange={e => setUserInfo(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#4F46E5]" placeholder="090..." />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Công ty / Tổ chức</label>
                                                    <input type="text" value={userInfo.company} onChange={e => setUserInfo(p => ({ ...p, company: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#4F46E5]" placeholder="Tên công ty" />
                                                </div>
                                            </div>
                                            <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4 mb-6 flex items-center gap-4">
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-sm">Thanh toán qua PayOS</p>
                                                    <p className="text-xs text-gray-500">Hỗ trợ VietQR & chuyển khoản ngân hàng. Xác nhận tự động.</p>
                                                </div>
                                            </div>
                                            <button onClick={handlePay} disabled={!userInfo.fullName || !userInfo.email}
                                                className="w-full py-4 bg-[#4F46E5] text-white rounded-lg font-bold text-lg hover:bg-indigo-700 shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                                                Thanh toán {formatMoney(calculateSubTotal())} qua PayOS
                                            </button>
                                            {(!userInfo.fullName || !userInfo.email) && <p className="text-xs text-red-500 mt-2 text-center">* Vui lòng điền đầy đủ họ tên và email</p>}
                                        </div>
                                    )}

                                    {paymentStep === 'processing' && (
                                        <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center p-8 text-center">
                                            <div className="w-16 h-16 border-4 border-gray-200 border-t-[#4F46E5] rounded-full animate-spin mb-6"></div>
                                            <h3 className="text-xl font-bold text-gray-900">Đang kết nối cổng thanh toán...</h3>
                                            <p className="text-gray-500 mt-2">Vui lòng không tắt trình duyệt.</p>
                                        </div>
                                    )}

                                    {paymentStep === 'waiting' && (
                                        <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center p-8 text-center">
                                            <h3 className="text-lg font-bold mb-2">Quét mã VietQR để thanh toán</h3>
                                            <p className="text-sm text-gray-500 mb-4">Dùng app ngân hàng quét mã hoặc mở trang PayOS</p>
                                            <div className="border-4 border-[#4F46E5] rounded-2xl p-3 bg-white shadow-lg inline-block mb-4">
                                                <img src={`https://img.vietqr.io/image/MB-12345678-compact2.png?amount=${calculateSubTotal()}&addInfo=AEGISM${selectedPlan.toUpperCase()}${orderCode}&accountName=AEGISM`} alt="VietQR" className="w-48 h-48 object-contain" />
                                            </div>
                                            {checkoutUrl && (
                                                <a href={checkoutUrl} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-6 py-2 bg-[#4F46E5] text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors mb-4">
                                                    🔗 Mở trang thanh toán PayOS
                                                </a>
                                            )}
                                            <div className={`text-sm font-medium mb-3 ${countdown < 60 ? 'text-red-500' : 'text-gray-500'}`}>⏱ Hết hạn sau: {fmtCountdown(countdown)}</div>
                                            <div className="flex items-center gap-2 justify-center text-xs text-gray-400">
                                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                                Đang chờ xác nhận thanh toán tự động...
                                            </div>
                                        </div>
                                    )}

                                    {paymentStep === 'success' && (
                                        <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center p-8 text-center">
                                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <HiCheckCircle className="text-5xl text-green-500" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h3>
                                            <p className="text-gray-600 mb-2">Gói <span className={`font-bold ${colors.primary} capitalize`}>{selectedPlan}</span> đã được kích hoạt.</p>
                                            <p className="text-gray-500 text-sm mb-6">Gia hạn thêm <span className="font-bold text-green-600">30 ngày</span> cho tài khoản của bạn.</p>
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left w-full max-w-sm mb-6 space-y-2">
                                                <div className="flex justify-between text-sm"><span className="text-gray-600">Người mua</span><span className="font-semibold">{userInfo.fullName}</span></div>
                                                <div className="flex justify-between text-sm"><span className="text-gray-600">Email</span><span className="font-semibold">{userInfo.email}</span></div>
                                                <div className="flex justify-between text-sm"><span className="text-gray-600">Số tiền</span><span className="font-bold">{formatMoney(calculateSubTotal())}</span></div>
                                            </div>
                                            <Link to="/dashboard" className="px-8 py-3 bg-[#4F46E5] text-white font-bold rounded-lg shadow hover:bg-indigo-700">🚀 Vào Dashboard</Link>
                                        </div>
                                    )}

                                    {paymentStep === 'error' && (
                                        <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center p-8 text-center">
                                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">❌</span></div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h3>
                                            <p className="text-gray-500 mb-6">Không thể tạo đơn hàng. Vui lòng thử lại.</p>
                                            <button onClick={() => setPaymentStep('info')} className="px-6 py-2 bg-[#4F46E5] text-white rounded-lg font-bold hover:bg-indigo-700">Thử lại</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface FAQProps { question: string; answer: string; colors: Colors; }
const FAQItem: React.FC<FAQProps> = ({ question, answer, colors }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setOpen(!open)} className="flex justify-between items-center w-full text-left px-6 py-4 bg-gray-50 hover:bg-gray-100 focus:outline-none">
                <span className={`text-lg font-medium ${colors.dark}`}>{question}</span>
                <HiChevronDown className={`text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && <div className="px-6 py-4 text-base text-gray-600 bg-white border-t border-gray-200">{answer}</div>}
        </div>
    );
};

const planConfig = [
    { id: 'starter', name: 'Starter', description: 'Dành cho đội nhóm nhỏ bắt đầu số hóa.', price: { monthly: 499000, yearly: 399000 }, features: ['Tối đa 05 Nhân sự', 'Chấm công QR Code & GPS', 'Giám sát lộ trình cơ bản', 'Lưu trữ dữ liệu 30 ngày', 'Hỗ trợ qua Email'], isPopular: false, buttonText: 'Dùng thử ngay' },
    { id: 'business', name: 'Business', description: 'Giải pháp toàn diện cho doanh nghiệp.', price: { monthly: 999000, yearly: 799000 }, features: ['Tối đa 20 Nhân sự', 'Tất cả tính năng gói Starter', 'Quản lý Công việc & Task', 'Xuất báo cáo Excel/PDF', 'Hỗ trợ ưu tiên 24/7'], isPopular: true, buttonText: 'Đăng ký ngay' },
    { id: 'enterprise', name: 'Enterprise', description: 'Hệ thống riêng biệt, bảo mật tuyệt đối.', price: null, features: ['Không giới hạn Nhân sự', 'Triển khai Server riêng (On-premise)', 'Tích hợp API hệ thống ERP', 'Tùy chỉnh tính năng theo yêu cầu', 'Chuyên viên hỗ trợ 1:1'], isPopular: false, buttonText: 'Liên hệ tư vấn' },
];

export default PricingPage;
