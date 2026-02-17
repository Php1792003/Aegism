import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    HiCheck,
    HiXMark,
    HiChevronDown,
    HiCheckCircle
} from 'react-icons/hi2';

// --- Type Definitions (FIX LỖI TYPESCRIPT) ---
interface PlanPrice {
    monthly: number;
    yearly: number;
}

interface Plans {
    starter: PlanPrice;
    business: PlanPrice;
    [key: string]: PlanPrice; // Cho phép truy cập bằng string index
}

interface Colors {
    primary: string;
    bgPrimary: string;
    bgPrimaryHover: string;
    dark: string;
    lightBg: string;
    cardBg: string;
    borderPrimary: string;
}

const PricingPage = () => {
    // --- STATE CONFIGURATION ---
    const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Payment State
    const [selectedPlan, setSelectedPlan] = useState<'starter' | 'business'>('starter');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'momo' | 'vnpay'>('card');
    const [gatewayState, setGatewayState] = useState<'input' | 'processing' | 'action' | 'success'>('input');
    const [countdown, setCountdown] = useState(300);

    // FIX LỖI: Định nghĩa kiểu cho billing
    const [billing, setBilling] = useState<{ name: string, email: string, phone: string }>({ name: '', email: '', phone: '' });

    // Constants
    const plans: Plans = {
        starter: { monthly: 475000, yearly: 375000 },
        business: { monthly: 1225000, yearly: 975000 }
    };

    const colors: Colors = {
        primary: 'text-[#4F46E5]',
        bgPrimary: 'bg-[#4F46E5]',
        bgPrimaryHover: 'hover:bg-[#4338ca]',
        dark: 'text-[#1e293b]', // Slate-800
        lightBg: 'bg-[#f8fafc]', // Slate-50
        cardBg: 'bg-white',
        borderPrimary: 'border-[#4F46E5]'
    };

    // --- LOGIC FUNCTIONS ---

    const toggleCycle = () => {
        setCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly');
    };

    const openModal = (plan: 'starter' | 'business') => {
        setSelectedPlan(plan);
        setGatewayState('input');
        setBilling({ name: '', email: '', phone: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCountdown(300);
    };

    const getPlanPrice = () => {
        return plans[selectedPlan][cycle];
    };

    const calculateSubTotal = () => {
        const price = getPlanPrice();
        return cycle === 'yearly' ? price * 12 : price;
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const getQRLink = () => {
        const total = calculateSubTotal() * 1.1; // VAT 10%
        const desc = `AEGISM ${selectedPlan.toUpperCase()}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PAYMENT|${total}|${desc}`;
    };

    const processPayment = () => {
        if (!billing.name || !billing.email) {
            alert("Vui lòng nhập thông tin hóa đơn!");
            return;
        }
        setGatewayState('processing');

        setTimeout(() => {
            setGatewayState('action');
            if (paymentMethod !== 'card') {
                setCountdown(300);
            }
        }, 1500);
    };

    const simulateSuccess = () => {
        setGatewayState('processing');
        setTimeout(() => {
            setGatewayState('success');
        }, 1500);
    };

    // Timer Effect (FIX LỖI NodeJS.Timeout)
    useEffect(() => {
        let timer: any; // Dùng 'any' để tránh lỗi namespace NodeJS
        if (isModalOpen && gatewayState === 'action' && paymentMethod !== 'card' && countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isModalOpen, gatewayState, paymentMethod, countdown]);

    return (
        <div className="bg-white text-gray-800 font-sans">
            <main className={colors.lightBg}>
                {/* Header Section */}
                <section className="bg-white pt-16 pb-12">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className={`text-4xl md:text-5xl font-extrabold ${colors.dark} tracking-tight`}>
                            Gói dịch vụ phù hợp cho mọi quy mô
                        </h1>
                        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
                            Chọn gói phù hợp nhất với nhu cầu của bạn. Nâng cấp, hạ cấp hoặc hủy bỏ bất cứ lúc nào.
                        </p>

                        {/* Toggle */}
                        <div className="mt-10 flex justify-center items-center space-x-4 cursor-pointer" onClick={toggleCycle}>
                            <span className={`font-medium transition-colors duration-300 ${cycle === 'monthly' ? colors.dark : 'text-gray-400'}`}>Hàng tháng</span>
                            <div className="relative inline-block w-14 align-middle select-none transition duration-200 ease-in">
                                <div className={`block overflow-hidden h-6 rounded-full cursor-pointer ${cycle === 'yearly' ? colors.bgPrimary : 'bg-gray-300'}`}></div>
                                <div className={`absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 transition-all duration-300 top-0 ${cycle === 'yearly' ? 'right-0 border-[#4F46E5]' : 'left-0'}`}></div>
                            </div>
                            <span className={`font-medium transition-colors duration-300 ${cycle === 'yearly' ? colors.primary : 'text-gray-400'}`}>
                                Hàng năm <span className="text-green-500 text-sm font-bold ml-1">(-20%)</span>
                            </span>
                        </div>
                    </div>
                </section>

                {/* Pricing Cards */}
                <section className="py-16 md:py-20 relative z-10">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {/* Grid 3 cột cân đối */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

                            {planConfig.map((plan) => {
                                const isBusiness = plan.id === 'business';
                                // Logic tính giá
                                const priceDisplay = plan.price
                                    ? formatMoney(cycle === 'monthly' ? plan.price.monthly : plan.price.yearly)
                                    : 'Liên hệ';

                                return (
                                    <div
                                        key={plan.id}
                                        className={`
                                            group relative flex flex-col p-8 bg-white rounded-3xl border 
                                            transition-all duration-500 ease-out
                                            /* Hiệu ứng 3D khi Hover: Bay lên + Bóng đổ sâu */
                                            hover:-translate-y-4 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)]
                                            ${isBusiness
                                                ? `border-[#4F46E5] ring-1 ring-[#4F46E5] shadow-xl z-10 scale-105 md:scale-110`
                                                : 'border-gray-100 shadow-lg hover:border-gray-200'
                                            }
                                        `}
                                    >
                                        {/* Badge Phổ biến */}
                                        {plan.isPopular && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#4F46E5] to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg tracking-wide uppercase">
                                                Khuyên dùng
                                            </div>
                                        )}

                                        {/* Header Card */}
                                        <div className="mb-6">
                                            <h3 className={`text-2xl font-bold ${isBusiness ? 'text-[#4F46E5]' : 'text-gray-900'}`}>
                                                {plan.name}
                                            </h3>
                                            <p className="text-gray-500 text-sm mt-2 min-h-[40px]">{plan.description}</p>
                                        </div>

                                        {/* Giá tiền */}
                                        <div className="mb-6 flex items-baseline">
                                            <span className={`text-4xl font-extrabold tracking-tight ${isBusiness ? 'text-gray-900' : 'text-gray-900'}`}>
                                                {priceDisplay}
                                            </span>
                                            {plan.price && (
                                                <span className="ml-1 text-xl font-medium text-gray-500">
                                                    /{cycle === 'monthly' ? 'tháng' : 'tháng'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Note chu kỳ năm */}
                                        {cycle === 'yearly' && plan.price && (
                                            <p className="text-xs text-green-600 font-semibold mb-6 bg-green-50 w-fit px-2 py-1 rounded">
                                                Tiết kiệm {formatMoney((plan.price.monthly - plan.price.yearly) * 12)} /năm
                                            </p>
                                        )}

                                        {/* Nút bấm */}
                                        <button
                                            onClick={() => plan.price ? openModal(plan.id as 'starter' | 'business') : window.location.href = '/contact'}
                                            className={`
                                                w-full py-3 px-4 rounded-xl font-bold transition-all duration-300
                                                ${isBusiness
                                                    ? 'bg-[#4F46E5] text-white hover:bg-[#4338ca] shadow-md hover:shadow-lg'
                                                    : 'bg-indigo-50 text-[#4F46E5] hover:bg-indigo-100'
                                                }
                                            `}
                                        >
                                            {plan.buttonText}
                                        </button>

                                        {/* Divider */}
                                        <div className="border-t border-gray-100 my-8"></div>

                                        {/* Danh sách tính năng */}
                                        <ul className="space-y-4 flex-1">
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start">
                                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isBusiness ? 'bg-indigo-100' : 'bg-green-100'}`}>
                                                        <HiCheck className={`w-4 h-4 ${isBusiness ? 'text-[#4F46E5]' : 'text-green-600'}`} />
                                                    </div>
                                                    <span className="ml-3 text-gray-600 text-sm font-medium">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="bg-white py-16 md:py-24 border-t border-gray-100">
                    <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className={`text-3xl font-extrabold ${colors.dark}`}>Câu hỏi thường gặp</h2>
                        </div>
                        <div className="space-y-4">
                            <FAQItem question="Làm thế nào để nâng cấp gói dịch vụ?" answer="Bạn có thể nâng cấp bất cứ lúc nào, hệ thống sẽ tự động tính phí chênh lệch." colors={colors} />
                            <FAQItem question="Chính sách hoàn tiền?" answer="Chúng tôi hoàn tiền trong 14 ngày đầu nếu bạn không hài lòng." colors={colors} />
                        </div>
                    </div>
                </section>
            </main>
            {/* --- PAYMENT MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={closeModal}>
                            <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full relative">
                            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                                <HiXMark className="text-2xl" />
                            </button>

                            <div className="grid grid-cols-1 lg:grid-cols-12 h-full lg:min-h-[600px]">
                                {/* Sidebar Info */}
                                <div className="lg:col-span-4 bg-gray-50 p-6 border-r border-gray-200 flex flex-col">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6">Đơn hàng của bạn</h3>

                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold">Gói dịch vụ</p>
                                                <h4 className={`text-xl font-bold ${colors.primary} capitalize`}>{selectedPlan}</h4>
                                            </div>
                                            <span className={`px-2 py-1 bg-blue-100 ${colors.primary} text-xs font-bold rounded uppercase`}>
                                                {cycle === 'yearly' ? 'Năm' : 'Tháng'}
                                            </span>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-gray-600">Đơn giá:</span>
                                                <span className="font-medium">{formatMoney(getPlanPrice())}</span>
                                            </div>
                                            {cycle === 'yearly' && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Thời hạn:</span>
                                                    <span className="font-medium">12 Tháng</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded-lg border border-gray-200 mb-auto">
                                        <p className="text-xs text-gray-500 mb-2 font-medium">Thay đổi chu kỳ:</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setCycle('monthly')} className={`flex-1 py-1 text-sm rounded border ${cycle === 'monthly' ? `${colors.bgPrimary} text-white ${colors.borderPrimary}` : 'bg-gray-50 text-gray-600 border-gray-200'}`}>Tháng</button>
                                            <button onClick={() => setCycle('yearly')} className={`flex-1 py-1 text-sm rounded border ${cycle === 'yearly' ? `${colors.bgPrimary} text-white ${colors.borderPrimary}` : 'bg-gray-50 text-gray-600 border-gray-200'}`}>Năm (-20%)</button>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-4 mt-6">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600">Tạm tính:</span>
                                            <span className="font-medium">{formatMoney(calculateSubTotal())}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mb-4">
                                            <span className="text-gray-600">VAT (10%):</span>
                                            <span className="font-medium">{formatMoney(calculateSubTotal() * 0.1)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                            <span className="font-bold text-gray-900">Tổng cộng:</span>
                                            <span className={`text-2xl font-bold ${colors.primary}`}>{formatMoney(calculateSubTotal() * 1.1)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Payment Content */}
                                <div className="lg:col-span-8 p-6 lg:p-8 relative">

                                    {/* STATE: INPUT INFO */}
                                    {gatewayState === 'input' && (
                                        <div className="animate-fade-in">
                                            <h3 className="text-xl font-bold text-gray-900 mb-6">Thông tin thanh toán</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                                <div className="col-span-1 md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên Doanh nghiệp / Cá nhân</label>
                                                    <input type="text" value={billing.name} onChange={e => setBilling({ ...billing, name: e.target.value })} className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#4F46E5] focus:border-[#4F46E5] outline-none`} placeholder="Nhập tên..." />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                                    <input type="email" value={billing.email} onChange={e => setBilling({ ...billing, email: e.target.value })} className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#4F46E5] focus:border-[#4F46E5] outline-none`} placeholder="email@example.com" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                                    <input type="tel" value={billing.phone} onChange={e => setBilling({ ...billing, phone: e.target.value })} className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#4F46E5] focus:border-[#4F46E5] outline-none`} placeholder="090..." />
                                                </div>
                                            </div>

                                            <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide border-b pb-2">Phương thức thanh toán</h4>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                                <PaymentOption id="card" label="Thẻ Quốc tế" icon="data:image/png;base64,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" selected={paymentMethod === 'card'} onClick={() => setPaymentMethod('card')} activeColor="#4F46E5" />
                                                <PaymentOption id="momo" label="Ví MoMo" icon="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAP0AAADECAMAAABjnterAAAAaVBMVEWlAGT////SgLKpDWu4N4XrxtzpwNnHYJ6xJHm1LoC7QIuvHXW9RI325O7ZlL7v0ePQeq7eocbw0+TATpPUhrX46/Pgp8njsM/EWZr68PbXjrrz3uvMbqfmt9OsFHD89fnGXZzOdavcnMNTQrnjAAAD8UlEQVR4nO3c52KqQBCGYRCUZg3RqDGW3P9FHhXUGYpSPLqa9/m5soRPEQZwYlkAAAAAAAAAAAAAAAAAAAAAAAAAzOH4gRsGvqOHQlcPlYnccC9Y/6+t+6/85chODYbRcSicTU9Do6V/bXI07tnn2bPtI7b3noIvW5msLXekh75K8897ekl7cf29Ms3KzprOckO2Vzg3/s4veXz7XkVB0kLD/FSnbO6i//gcjYwrhi/49KOP8oXHz8hSm1s5vL0J9NRgem3pyXPy1FP4vS0xUjP9q+ELvymm8WqEt+1YTr2y2yfmzwpV2aBWevnhf95cemH6kT+sFd62L2dyv8LSpn/1b3+A2uo8M1vjFHKfGK0CVdHtovVcH8kGsROpM+LPaWJ2p5ltA2ftjjMV4s+1v/18clOPhzR/I0YWx4pfHhgHp4k/Ont0Gu/rA4nZNa/Y0GkyIkv+9Hsr35B03lpllOe2SMXvPDJMXY7Y0G4yJI8En8mQ3J3TD1mdKLtqnap8+nhgmNoK0nfyn1xXDKXHMVXfZ3bvpXzN5JNe4/Ry987WdGv5TQkflqW+punlvPxpTR46iq+LzdA0fSBGNrm1rvKrMNI90n/n1hqLV02+1LlH+vxhXR71Z4+K0kDT9LLIH+TW2hevmlzqN02vip3cWmUx8I57vqqQcye1iXjR5BtcjdPL8u83u9KFeNHkOxyN0w/lhx/plaqrZpMvcxqnn8uEPbVOVedPHximtsbpVbGn9v1gUPaKcRqnzzwCGZ3vde/UuNFlfov02ccAs3ngrMNx5j5vt/CvmqJ5+szNnRJmP89qkb7KPd2vZ2SqrkX6CreDN1HBnzRIm/S3n+WYfG1/0Cr9red4Rp/tDlqlt1xZ0uaYfHWXaJfe8l/7+X3L9JaT+cHP2dTsc12ibfp9wV/4/P/X5BvZZ+3TF/xma/pp8oWd4PQu0rswnhjaJkNDMRQUrMXvXN6f70lcsMSbc8JxZ29ueH0DAIBlrfvz1djryyot6nvj1bZfpXBzd4cznvcidU4G3QkX+7LP/8PdCaNdbojuhBy6E0q8wN0Ni+6E6uhOuKA74Sq6E4xGd8LZjxcPM5s/jD31sPZ9uxOWh4FYbf2xZvkVA2/bnZD+3lbu0ckTaPUrlXTe23UnpMdz+ev6tDtBntrSw/hf6E5Iq1X5NCMt9+hOOKE7QaE7IbMKI9Gd0DY93Qka3Qkn77jn051wRneCRHfCCd0JxqI7oVl6uhNuM/t5Ft0JDdPTnXCDydf2B3QnNE5Pd0J5eJMvb1J0J7RJT3fCC3cn3CE93Qn7dyA8/ifpKv90GgAAAAAAAAAAAAAAAAAAAAAAAMBD/QME3zldES6vtwAAAABJRU5ErkJggg==" selected={paymentMethod === 'momo'} onClick={() => setPaymentMethod('momo')} activeColor="#A50064" />
                                                <PaymentOption id="vnpay" label="VNPAY-QR" icon="https://vnpay.vn/s1/statics.vnpay.vn/2023/6/0oxhzjmxbksr1686814746087.png" selected={paymentMethod === 'vnpay'} onClick={() => setPaymentMethod('vnpay')} activeColor="#005BAA" />
                                            </div>

                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                                                {paymentMethod === 'card' ? (
                                                    <div className="animate-fade-in">
                                                        <div className="mb-3">
                                                            <input type="text" placeholder="Số thẻ (Demo: 4242...)" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#4F46E5]" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <input type="text" placeholder="MM/YY" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#4F46E5]" />
                                                            <input type="text" placeholder="CVC" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#4F46E5]" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-sm text-gray-600 animate-fade-in">
                                                        <p>Sau khi bấm <span className="font-bold">Thanh toán</span>, mã QR sẽ hiển thị để bạn quét.</p>
                                                    </div>
                                                )}
                                            </div>

                                            <button onClick={processPayment} className={`w-full py-4 bg-[#4F46E5] text-white rounded-lg font-bold text-lg hover:bg-indigo-700 shadow-lg transition-transform active:scale-95 flex items-center justify-center`}>
                                                Thanh toán <span className="ml-2 bg-indigo-800 px-2 py-0.5 rounded text-sm">{formatMoney(calculateSubTotal() * 1.1)}</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* STATE: PROCESSING / ACTION / SUCCESS */}
                                    {gatewayState !== 'input' && (
                                        <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center p-8 text-center animate-fade-in">

                                            {gatewayState === 'processing' && (
                                                <>
                                                    <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-[#4F46E5] rounded-full animate-spin mb-6 mx-auto"></div>
                                                    <h3 className="text-xl font-bold text-gray-900">Đang kết nối cổng thanh toán...</h3>
                                                    <p className="text-gray-500 mt-2">Vui lòng không tắt trình duyệt.</p>
                                                </>
                                            )}

                                            {gatewayState === 'action' && (
                                                <div className="w-full max-w-sm mx-auto">
                                                    {paymentMethod !== 'card' ? (
                                                        <>
                                                            <h3 className="text-lg font-bold mb-4">Quét mã để thanh toán</h3>
                                                            <div className="border-2 border-dashed border-gray-300 p-2 rounded-lg inline-block mb-4">
                                                                <img src={getQRLink()} className="w-48 h-48 object-contain" alt="QR Code" />
                                                            </div>
                                                            <p className={`font-bold text-xl ${colors.primary} mb-2`}>{formatMoney(calculateSubTotal() * 1.1)}</p>
                                                            <div className="bg-yellow-50 text-yellow-800 text-sm py-2 px-4 rounded mb-6">
                                                                Hết hạn trong: <span className="font-mono font-bold">{countdown}s</span>
                                                            </div>
                                                            <button onClick={simulateSuccess} className="text-xs text-gray-400 underline hover:text-gray-600">(Giả lập: Đã quét xong)</button>
                                                        </>
                                                    ) : (
                                                        <div className="text-left">
                                                            <div className="flex justify-center mb-4"><img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-6" alt="Visa" /></div>
                                                            <h3 className="text-center font-bold mb-2">Xác thực 3D Secure</h3>
                                                            <p className="text-center text-sm text-gray-500 mb-6">Nhập mã OTP gửi về số điện thoại.</p>
                                                            <input type="text" className={`w-full text-center text-2xl tracking-[0.5em] font-bold border rounded-lg py-3 mb-4 focus:ring-[#4F46E5] focus:border-[#4F46E5]`} placeholder="000000" />
                                                            <button onClick={simulateSuccess} className={`w-full py-3 ${colors.bgPrimary} text-white font-bold rounded-lg`}>Xác nhận</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {gatewayState === 'success' && (
                                                <div className="animate-bounce-in">
                                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                        <HiCheckCircle className="text-4xl text-green-500" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h3>
                                                    <p className="text-gray-600 mb-8">Gói dịch vụ <span className={`font-bold ${colors.primary}`}>{selectedPlan}</span> đã được kích hoạt.</p>
                                                    <Link to="/dashboard" className={`px-8 py-3 ${colors.bgPrimary} text-white font-bold rounded-lg shadow hover:bg-indigo-700`}>Vào Dashboard</Link>
                                                </div>
                                            )}
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

// --- SUB-COMPONENTS (FIX LỖI 'any') ---

interface FAQProps {
    question: string;
    answer: string;
    colors: Colors;
}

const FAQItem: React.FC<FAQProps> = ({ question, answer, colors }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setOpen(!open)} className="flex justify-between items-center w-full text-left px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none">
                <span className={`text-lg font-medium ${colors.dark}`}>{question}</span>
                <HiChevronDown className={`text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="px-6 py-4 text-base text-gray-600 bg-white border-t border-gray-200">
                    {answer}
                </div>
            )}
        </div>
    );
};

interface PaymentOptionProps {
    id: string;
    label: string;
    icon: string;
    selected: boolean;
    onClick: () => void;
    activeColor: string;
}

const PaymentOption: React.FC<PaymentOptionProps> = ({ label, icon, selected, onClick, activeColor }) => (
    <div onClick={onClick} className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center transition-all hover:shadow-md relative ${selected ? `border-[${activeColor}] bg-blue-50 ring-1 ring-[${activeColor}]` : 'border-gray-200'}`} style={{ borderColor: selected ? activeColor : '#e5e7eb' }}>
        <img src={icon} className="h-6 object-contain mb-2" alt={label} />
        <span className="font-bold text-sm">{label}</span>
        {selected && <div className="absolute top-2 right-2" style={{ color: activeColor }}><HiCheckCircle /></div>}
    </div>
);

const planConfig = [
    {
        id: 'starter',
        name: 'Starter',
        description: 'Dành cho đội nhóm nhỏ bắt đầu số hóa.',
        price: { monthly: 475000, yearly: 375000 },
        features: [
            'Tối đa 05 Nhân sự',
            'Chấm công QR Code & GPS',
            'Giám sát lộ trình cơ bản',
            'Lưu trữ dữ liệu 30 ngày',
            'Hỗ trợ qua Email'
        ],
        isPopular: false,
        buttonText: 'Dùng thử ngay'
    },
    {
        id: 'business',
        name: 'Business',
        description: 'Giải pháp toàn diện cho doanh nghiệp.',
        price: { monthly: 1225000, yearly: 975000 },
        features: [
            'Tối đa 20 Nhân sự',
            'Tất cả tính năng gói Starter',
            'Quản lý Công việc & Task',
            'Xuất báo cáo Excel/PDF',
            'Hỗ trợ ưu tiên 24/7'
        ],
        isPopular: true, // Gói nổi bật
        buttonText: 'Đăng ký ngay'
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Hệ thống riêng biệt, bảo mật tuyệt đối.',
        price: null, // null để hiển thị Liên hệ
        features: [
            'Không giới hạn Nhân sự',
            'Triển khai Server riêng (On-premise)',
            'Tích hợp API hệ thống ERP',
            'Tùy chỉnh tính năng theo yêu cầu',
            'Chuyên viên hỗ trợ 1:1'
        ],
        isPopular: false,
        buttonText: 'Liên hệ tư vấn'
    }
];
export default PricingPage;