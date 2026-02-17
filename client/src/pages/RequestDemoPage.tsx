import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    HiBars3,
    HiXMark,
    HiShieldCheck,
    HiChartBar,
    HiBolt,
    HiRocketLaunch,
    HiCheckCircle
} from 'react-icons/hi2';

// --- CONFIG ---
const colors = {
    primary: 'text-[#2563EB]',
    bgPrimary: 'bg-[#2563EB]',
    bgPrimaryHover: 'hover:bg-blue-700',
    dark: 'text-[#1F2937]',
    lightBg: 'bg-[#F9FAFB]',
    inputBg: 'bg-[#F9FAFB]', // Nền input sáng hơn chút cho hiện đại
    border: 'border-[#E5E7EB]',
};

const RequestDemoPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- FORM HANDLER ---
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Giả lập gọi API
        setTimeout(() => {
            alert("Đăng ký thành công! Chuyên viên tư vấn sẽ liên hệ với bạn trong vòng 2h làm việc.");
            setIsSubmitting(false);
        }, 1500);
    };

    return (
        <div className="bg-white text-gray-800 font-sans min-h-screen flex flex-col">
            <main className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white flex-grow">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        <div className="lg:col-span-5 space-y-8 sticky top-24">
                            <div>
                                <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">
                                    Demo Miễn Phí
                                </span>
                                <h1 className={`text-4xl md:text-5xl font-extrabold ${colors.dark} tracking-tight leading-tight`}>
                                    Trải nghiệm sức mạnh <br /><span className={colors.primary}>Quản trị An ninh 4.0</span>
                                </h1>
                                <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                                    Đăng ký để được chuyên gia AEGISM tư vấn 1-1 và demo trực tiếp giải pháp phù hợp nhất với mô hình vận hành của bạn.
                                </p>
                            </div>

                            {/* Benefits List */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Quyền lợi khi đăng ký Demo:</h3>
                                <ul className="space-y-4">
                                    {[
                                        "Tư vấn lộ trình chuyển đổi số miễn phí",
                                        "Trải nghiệm Full tính năng gói Enterprise",
                                        "Nhận báo giá ưu đãi dành riêng cho bạn",
                                        "Hỗ trợ thiết lập hệ thống mẫu (PoC)"
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-start">
                                            <HiCheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                                            <span className="ml-3 text-gray-700 text-sm font-medium">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Trust Badge */}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"></div>
                                    ))}
                                </div>
                                <p>Hơn <strong>500+</strong> doanh nghiệp đã tin dùng</p>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: THE FORM */}
                        <div className="lg:col-span-7">
                            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden">
                                {/* Decor Blob */}
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                                <h2 className="text-2xl font-bold text-gray-900 mb-6 relative z-10">Thông tin đăng ký</h2>

                                <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="fullname" className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên *</label>
                                            <input
                                                type="text" id="fullname" required placeholder="Nguyễn Văn A"
                                                className={`block w-full px-4 py-3 ${colors.inputBg} border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại *</label>
                                            <input
                                                type="tel" id="phone" required placeholder="0905..."
                                                className={`block w-full px-4 py-3 ${colors.inputBg} border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email công việc *</label>
                                            <input
                                                type="email" id="email" required placeholder="name@company.com"
                                                className={`block w-full px-4 py-3 ${colors.inputBg} border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-2">Tên Doanh nghiệp</label>
                                            <input
                                                type="text" id="company" placeholder="Công ty ABC..."
                                                className={`block w-full px-4 py-3 ${colors.inputBg} border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="size" className="block text-sm font-semibold text-gray-700 mb-2">Quy mô nhân sự</label>
                                            <div className="relative">
                                                <select id="size" className={`block w-full px-4 py-3 ${colors.inputBg} border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer`}>
                                                    <option>Dưới 10 nhân sự</option>
                                                    <option>10 - 50 nhân sự</option>
                                                    <option>50 - 200 nhân sự</option>
                                                    <option>Trên 200 nhân sự</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">Chức vụ của bạn</label>
                                            <input
                                                type="text" id="role" placeholder="VD: CEO, HR Manager..."
                                                className={`block w-full px-4 py-3 ${colors.inputBg} border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="note" className="block text-sm font-semibold text-gray-700 mb-2">Nhu cầu cụ thể (Không bắt buộc)</label>
                                        <textarea
                                            id="note" rows={3} placeholder="Bạn đang gặp khó khăn gì trong quản lý? Hoặc mong muốn tính năng nào cụ thể?"
                                            className={`block w-full px-4 py-3 ${colors.inputBg} border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none`}
                                        ></textarea>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={`
                                                w-full flex items-center justify-center px-8 py-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white 
                                                transition-all transform hover:-translate-y-1 active:translate-y-0
                                                ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}
                                            `}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                    Đang xử lý...
                                                </>
                                            ) : (
                                                <>
                                                    Gửi Yêu Cầu Demo <HiRocketLaunch className="ml-2 h-5 w-5" />
                                                </>
                                            )}
                                        </button>
                                        <p className="text-center text-xs text-gray-400 mt-4">
                                            Chúng tôi cam kết bảo mật thông tin của bạn 100%.
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default RequestDemoPage;