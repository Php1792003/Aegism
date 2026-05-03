import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' : 'https://api.aegism.online';

const PLANS = [
    { key: 'STARTER', name: 'Starter', price: 499000, badge: 'bg-blue-100 text-blue-700', border: 'border-blue-500', bg: 'bg-blue-50', features: ['5 người dùng', '1 dự án', '100 mã QR'] },
    { key: 'PROFESSIONAL', name: 'Professional', price: 999000, badge: 'bg-orange-100 text-orange-700', border: 'border-orange-500', bg: 'bg-orange-50', features: ['20 người dùng', '5 dự án', '500 mã QR', 'Báo cáo'] },
    { key: 'ENTERPRISE', name: 'Enterprise', price: 1499000, badge: 'bg-purple-100 text-purple-700', border: 'border-purple-500', bg: 'bg-purple-50', features: ['Không giới hạn', 'Tích hợp API', 'Thương hiệu', 'Hỗ trợ ưu tiên'] },
];

const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';

interface PaymentModalProps {
    isOpen: boolean;
    onClose?: () => void;
    isExpired?: boolean;
}

type Step = 'select' | 'qr' | 'success';

export default function PaymentModal({ isOpen, onClose, isExpired = true }: PaymentModalProps) {
    const [step, setStep] = useState<Step>('select');
    const [selectedPlan, setSelectedPlan] = useState('STARTER');
    const [loading, setLoading] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState('');
    const [orderCode, setOrderCode] = useState('');
    const [countdown, setCountdown] = useState(300);
    const pollingRef = useRef<any>(null);
    const countdownRef = useRef<any>(null);

    const plan = PLANS.find(p => p.key === selectedPlan)!;

    useEffect(() => {
        if (step === 'qr' && orderCode) {
            setCountdown(300);
            countdownRef.current = setInterval(() => setCountdown(prev => prev > 0 ? prev - 1 : 0), 1000);
            pollingRef.current = setInterval(async () => {
                try {
                    const token = localStorage.getItem('accessToken');
                    const res = await fetch(`${apiUrl}/api/payment/payos/status?orderCode=${orderCode}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data?.status === 'PAID') {
                            clearInterval(pollingRef.current);
                            clearInterval(countdownRef.current);
                            const user = JSON.parse(localStorage.getItem('user') || '{}');
                            if (user.tenant) {
                                user.tenant.subscriptionPlan = selectedPlan;
                                const newExp = new Date();
                                newExp.setDate(newExp.getDate() + 30);
                                user.tenant.subscriptionExpiresAt = newExp.toISOString();
                                localStorage.setItem('user', JSON.stringify(user));
                                localStorage.setItem('userPlan', selectedPlan.toLowerCase());
                            }
                            setStep('success');
                        }
                    }
                } catch {}
            }, 3000);
            return () => { clearInterval(pollingRef.current); clearInterval(countdownRef.current); };
        }
    }, [step, orderCode]);

    const handleCreatePayment = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${apiUrl}/api/payment/payos/create`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: selectedPlan })
            });
            if (res.ok) {
                const data = await res.json();
                setCheckoutUrl(data.checkoutUrl);
                setOrderCode(String(data.orderCode));
                setStep('qr');
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleSuccess = () => {
        setStep('select');
        setOrderCode('');
        setCheckoutUrl('');
        if (onClose) onClose();
        window.location.reload();
    };

    const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={!isExpired ? onClose : undefined} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {step === 'select' && (isExpired ? '⚠️ Tài khoản hết hạn' : '💳 Nâng cấp gói')}
                                {step === 'qr' && '📱 Quét mã VietQR'}
                                {step === 'success' && '🎉 Thanh toán thành công!'}
                            </h2>
                            {step === 'select' && isExpired && <p className="text-sm text-red-500 mt-0.5">Vui lòng gia hạn để tiếp tục sử dụng</p>}
                        </div>
                        {!isExpired && onClose && step !== 'success' && (
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">✕</button>
                        )}
                    </div>
                    {step !== 'success' && (
                        <div className="flex items-center gap-2 mt-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'select' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'}`}>
                                {step === 'qr' ? '✓' : '1'}
                            </div>
                            <span className="text-xs text-gray-500">Chọn gói</span>
                            <div className="w-8 h-0.5 bg-gray-200" />
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'qr' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                            <span className="text-xs text-gray-500">Thanh toán</span>
                        </div>
                    )}
                </div>

                <div className="p-6">
                    {/* STEP 1: Chọn gói */}
                    {step === 'select' && (
                        <div className="space-y-4">
                            <div className="grid gap-3">
                                {PLANS.map(p => (
                                    <div key={p.key} onClick={() => setSelectedPlan(p.key)}
                                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedPlan === p.key ? `${p.border} ${p.bg}` : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedPlan === p.key ? 'border-blue-600' : 'border-gray-300'}`}>
                                                    {selectedPlan === p.key && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-gray-900">{p.name}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.badge}`}>{p.key}</span>
                                                    </div>
                                                    <div className="flex gap-2 mt-1 flex-wrap">
                                                        {p.features.map(f => <span key={f} className="text-xs text-gray-500">✓ {f}</span>)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right ml-3 flex-shrink-0">
                                                <div className="font-bold text-gray-900 text-sm">{fmt(p.price)}</div>
                                                <div className="text-xs text-gray-400">/tháng</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex justify-between text-sm"><span className="text-gray-500">Gói</span><span className="font-semibold">{plan.name}</span></div>
                                <div className="flex justify-between text-sm mt-1"><span className="text-gray-500">Thời hạn</span><span className="font-semibold">30 ngày</span></div>
                                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
                                    <span className="font-bold text-gray-700">Tổng</span>
                                    <span className="font-bold text-blue-600 text-lg">{fmt(plan.price)}</span>
                                </div>
                            </div>

                            <button onClick={handleCreatePayment} disabled={loading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang tạo...</> : 'Tiếp tục thanh toán →'}
                            </button>
                        </div>
                    )}

                    {/* STEP 2: VietQR */}
                    {step === 'qr' && (
                        <div className="text-center space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex justify-between text-sm">
                                <span className="text-gray-600">Gói {plan.name}</span>
                                <span className="font-bold text-blue-600">{fmt(plan.price)}</span>
                            </div>

                            <p className="text-sm text-gray-600">Quét mã QR bằng app ngân hàng hoặc ví VietQR</p>

                            <div className="flex flex-col items-center gap-3">
                                <div className="border-4 border-blue-600 rounded-2xl p-3 bg-white shadow-lg inline-block">
                                    <iframe
                                        src={checkoutUrl}
                                        className="w-52 h-52 border-none"
                                        title="PayOS QR"
                                        sandbox="allow-scripts allow-same-origin"
                                    />
                                </div>
                                <a href={checkoutUrl} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                                    🔗 Mở trang thanh toán PayOS
                                </a>
                            </div>

                            <div className={`text-sm font-medium ${countdown < 60 ? 'text-red-500' : 'text-gray-500'}`}>
                                ⏱ Hết hạn sau: {fmtCountdown(countdown)}
                            </div>

                            <div className="flex items-center gap-2 justify-center text-xs text-gray-400">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                Đang chờ xác nhận thanh toán...
                            </div>

                            <button onClick={() => { setStep('select'); clearInterval(pollingRef.current); clearInterval(countdownRef.current); }}
                                className="text-sm text-gray-400 hover:text-gray-600 underline">
                                ← Quay lại chọn gói
                            </button>
                        </div>
                    )}

                    {/* STEP 3: Thành công */}
                    {step === 'success' && (
                        <div className="text-center space-y-5 py-4">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                                <span className="text-5xl">✅</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Thanh toán thành công!</h3>
                                <p className="text-gray-500 mt-2">Tài khoản đã được gia hạn thêm <span className="font-bold text-green-600">30 ngày</span></p>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left space-y-2">
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Gói kích hoạt</span><span className="font-bold text-green-700">{plan.name}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Gia hạn</span><span className="font-bold">30 ngày</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Số tiền</span><span className="font-bold">{fmt(plan.price)}</span></div>
                            </div>
                            <button onClick={handleSuccess} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors">
                                🚀 Bắt đầu sử dụng
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
