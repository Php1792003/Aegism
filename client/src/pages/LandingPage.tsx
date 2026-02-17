import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    HiBars3,
    HiXMark,
    HiChartPie,
    HiComputerDesktop,
    HiShieldCheck,
    HiBolt,
    HiCheck,
    HiQrCode,
    HiMap
} from 'react-icons/hi2';

const LandingPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // --- CONFIG ---
    const colors = {
        primary: 'text-[#4F46E5]',
        bgPrimary: 'bg-[#4F46E5]',
        bgPrimaryHover: 'hover:bg-indigo-700',
        dark: 'text-[#111827]',
        lightBg: 'bg-[#F9FAFB]',
        cardBg: 'bg-white',
        borderPrimary: 'border-[#4F46E5]'
    };

    // Dữ liệu Bảng giá (Đồng bộ với trang Pricing)
    const pricingPlans = [
        {
            name: "Starter",
            price: "475.000",
            period: "/tháng",
            desc: "Dành cho đội nhóm nhỏ mới bắt đầu số hóa.",
            features: [
                "Tối đa 05 Người dùng",
                "Chấm công QR Code & GPS",
                "Giám sát vị trí cơ bản",
                "Lưu trữ dữ liệu 30 ngày"
            ],
            cta: "Dùng thử ngay",
            link: "/register?plan=starter",
            highlight: false
        },
        {
            name: "Business",
            price: "1.225.000",
            period: "/tháng",
            desc: "Giải pháp tiêu chuẩn cho doanh nghiệp SMEs.",
            features: [
                "Tối đa 20 Người dùng",
                "Quản lý Task & Sự cố",
                "Phân quyền chuyên sâu",
                "Hỗ trợ ưu tiên 24/7"
            ],
            cta: "Đăng ký ngay",
            link: "/register?plan=business",
            highlight: true // Gói nổi bật
        },
        {
            name: "Enterprise",
            price: "Liên hệ",
            period: "",
            desc: "Hệ thống riêng biệt, bảo mật tuyệt đối.",
            features: [
                "Không giới hạn User",
                "Server riêng (On-premise)",
                "Tùy chỉnh tính năng",
                "Tích hợp API hệ thống"
            ],
            cta: "Liên hệ tư vấn",
            link: "/contact",
            highlight: false
        }
    ];

    return (
        <div className="bg-white text-gray-800 font-sans">
            <main>
                {/* --- HERO SECTION --- */}
                <section className="bg-white py-16 md:py-24 relative overflow-hidden">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                            <div className="text-center md:text-left z-10">
                                <h1 className={`text-4xl md:text-6xl font-extrabold ${colors.dark} tracking-tight leading-tight`}>
                                    Quản lý Vận hành & <br />
                                    <span className={colors.primary}>An ninh Thông minh</span>
                                </h1>
                                <p className="mt-6 text-lg text-gray-600 max-w-2xl">
                                    Nền tảng AEGISM giúp số hóa quy trình tuần tra, giám sát nhân sự thời gian thực và xử lý sự cố tức thì bằng công nghệ QR Code & GPS.
                                </p>
                                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                    <Link to="/register" className={`inline-flex items-center justify-center px-8 py-3.5 border border-transparent rounded-xl shadow-lg text-base font-bold text-white ${colors.bgPrimary} ${colors.bgPrimaryHover} transition-transform hover:-translate-y-1`}>
                                        Bắt đầu miễn phí
                                    </Link>
                                    <Link to="/features" className="inline-flex items-center justify-center px-8 py-3.5 border border-gray-200 rounded-xl text-base font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                                        Tìm hiểu thêm
                                    </Link>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-300 to-purple-300 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                                <img
                                    src="/img/aegism_dashboard.png"
                                    alt="AEGISM Dashboard"
                                    className="relative w-full h-auto rounded-2xl shadow-2xl border border-gray-100 transform hover:scale-[1.02] transition duration-500"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- LOGO CLOUD --- */}
                <section className="bg-gray-50 py-10 border-y border-gray-100">
                    <div className="container mx-auto max-w-7xl px-4 text-center">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Tin dùng bởi các doanh nghiệp hàng đầu</p>
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                            {['VinGroup', 'SunGroup', 'Novaland', 'DatXanh', 'HungThinh'].map((brand, i) => (
                                <span key={i} className="text-xl font-bold text-gray-400 hover:text-indigo-600 transition">{brand}</span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- FEATURES SECTION (Bám sát hệ thống) --- */}
                <section className="bg-white py-16 md:py-24">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto">
                            <h2 className={`text-3xl font-extrabold ${colors.dark}`}>
                                Công cụ mạnh mẽ cho <span className={colors.primary}>Bộ phận An ninh</span>
                            </h2>
                            <p className="mt-4 text-lg text-gray-600">
                                AEGISM cung cấp bộ công cụ toàn diện giúp bạn chuyển đổi số quy trình tuần tra và quản lý sự cố.
                            </p>
                        </div>

                        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                {
                                    title: "Tuần tra QR Code",
                                    desc: "Check-in điểm tuần tra bằng mã QR, chống gian lận vị trí tuyệt đối.",
                                    icon: <HiQrCode className="h-6 w-6" />
                                },
                                {
                                    title: "Bản đồ số GPS",
                                    desc: "Giám sát vị trí nhân viên bảo vệ trên bản đồ thời gian thực (Live Map).",
                                    icon: <HiMap className="h-6 w-6" />
                                },
                                {
                                    title: "Quản lý Sự cố",
                                    desc: "Báo cáo sự cố kèm hình ảnh/video ngay tại hiện trường, gửi về trung tâm.",
                                    icon: <HiShieldCheck className="h-6 w-6" />
                                },
                                {
                                    title: "Dashboard Phân tích",
                                    desc: "Biểu đồ trực quan về hiệu suất ca trực, tỷ lệ hoàn thành và rủi ro.",
                                    icon: <HiChartPie className="h-6 w-6" />
                                }
                            ].map((feature, index) => (
                                <div key={index} className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
                                    <div className={`flex items-center justify-center h-14 w-14 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300`}>
                                        {feature.icon}
                                    </div>
                                    <h3 className="mt-6 text-xl font-bold text-gray-900">{feature.title}</h3>
                                    <p className="mt-3 text-gray-600 leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- PRICING SECTION (ĐÃ CẬP NHẬT) --- */}
                <section className={`${colors.lightBg} py-16 md:py-24`}>
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className={`text-3xl font-extrabold ${colors.dark}`}>
                                Bảng giá linh hoạt & minh bạch
                            </h2>
                            <p className="mt-4 text-lg text-gray-600">
                                Không phí ẩn. Chọn gói dịch vụ phù hợp nhất với quy mô đội ngũ của bạn.
                            </p>
                        </div>

                        {/* Pricing Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                            {pricingPlans.map((plan, index) => (
                                <div
                                    key={index}
                                    className={`
                                        relative flex flex-col p-8 bg-white rounded-2xl transition-all duration-300
                                        ${plan.highlight
                                            ? 'border-2 border-indigo-500 shadow-2xl scale-105 z-10'
                                            : 'border border-gray-200 shadow-lg hover:-translate-y-2'
                                        }
                                    `}
                                >
                                    {plan.highlight && (
                                        <div className="absolute top-0 right-0 -mt-4 mr-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wide">
                                            Phổ biến nhất
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <h3 className={`text-xl font-bold ${plan.highlight ? 'text-indigo-600' : 'text-gray-900'}`}>{plan.name}</h3>
                                        <p className="text-sm text-gray-500 mt-2 min-h-[40px]">{plan.desc}</p>
                                    </div>

                                    <div className="mb-6 flex items-baseline">
                                        <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                                        {plan.price !== 'Liên hệ' && <span className="text-gray-500 font-medium ml-1">đ{plan.period}</span>}
                                    </div>

                                    <ul className="mb-8 space-y-4 flex-1">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start">
                                                <HiCheck className={`flex-shrink-0 h-5 w-5 ${plan.highlight ? 'text-indigo-600' : 'text-green-500'}`} />
                                                <span className="ml-3 text-gray-600 text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        to={plan.link}
                                        className={`
                                            w-full block text-center py-3 rounded-xl font-bold transition-all
                                            ${plan.highlight
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30'
                                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                            }
                                        `}
                                    >
                                        {plan.cta}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- TESTIMONIALS --- */}
                <section className="bg-white py-16 md:py-24">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-12">Khách hàng nói gì về AEGISM?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 relative">
                                <svg className="absolute top-6 left-6 w-8 h-8 text-gray-200" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.0547 15.1953 15.125 16.3359 14.625C15.5469 14.2188 14.9375 13.5625 14.6562 12.5938C14.2812 11.2344 14.5625 9.73438 15.4219 8.71875C16.2344 7.73438 17.5156 7.21875 18.7969 7.21875H19.5V10.2188H18.7969C17.9531 10.2188 17.2969 10.875 17.2969 11.7188V12.7188H19.5V21H14.017ZM6.01719 21L6.01719 18C6.01719 16.0547 7.19531 15.125 8.33594 14.625C7.54688 14.2188 6.9375 13.5625 6.65625 12.5938C6.28125 11.2344 6.5625 9.73438 7.42188 8.71875C8.23438 7.73438 9.51562 7.21875 10.7969 7.21875H11.5V10.2188H10.7969C9.95312 10.2188 9.29688 10.875 9.29688 11.7188V12.7188H11.5V21H6.01719Z" /></svg>
                                <p className="text-gray-700 text-lg italic mt-6 relative z-10">"AEGISM giúp chúng tôi cắt giảm 30% chi phí vận hành đội bảo vệ nhờ việc tối ưu lộ trình và loại bỏ tình trạng nhân viên rời vị trí."</p>
                                <div className="mt-6 flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">M</div>
                                    <div className="ml-3">
                                        <p className="font-bold text-gray-900">Anh Minh</p>
                                        <p className="text-sm text-gray-500">Giám đốc Vận hành, TechPark</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 relative">
                                <svg className="absolute top-6 left-6 w-8 h-8 text-gray-200" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.0547 15.1953 15.125 16.3359 14.625C15.5469 14.2188 14.9375 13.5625 14.6562 12.5938C14.2812 11.2344 14.5625 9.73438 15.4219 8.71875C16.2344 7.73438 17.5156 7.21875 18.7969 7.21875H19.5V10.2188H18.7969C17.9531 10.2188 17.2969 10.875 17.2969 11.7188V12.7188H19.5V21H14.017ZM6.01719 21L6.01719 18C6.01719 16.0547 7.19531 15.125 8.33594 14.625C7.54688 14.2188 6.9375 13.5625 6.65625 12.5938C6.28125 11.2344 6.5625 9.73438 7.42188 8.71875C8.23438 7.73438 9.51562 7.21875 10.7969 7.21875H11.5V10.2188H10.7969C9.95312 10.2188 9.29688 10.875 9.29688 11.7188V12.7188H11.5V21H6.01719Z" /></svg>
                                <p className="text-gray-700 text-lg italic mt-6 relative z-10">"Giao diện trực quan, dễ sử dụng cho cả nhân viên lớn tuổi. Chức năng báo cáo sự cố qua hình ảnh thực sự rất hữu ích."</p>
                                <div className="mt-6 flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold">H</div>
                                    <div className="ml-3">
                                        <p className="font-bold text-gray-900">Chị Hằng</p>
                                        <p className="text-sm text-gray-500">Quản lý Tòa nhà, Green Building</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- CTA BOTTOM --- */}
                <section className={`${colors.bgPrimary} py-16`}>
                    <div className="container mx-auto max-w-4xl px-4 text-center">
                        <h2 className="text-3xl font-extrabold text-white">Sẵn sàng nâng cấp quy trình an ninh?</h2>
                        <p className="mt-4 text-indigo-100 text-lg">Đăng ký ngay hôm nay để trải nghiệm miễn phí 14 ngày gói Business.</p>
                        <div className="mt-8 flex justify-center gap-4">
                            <Link to="/register" className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-bold shadow hover:bg-gray-50 transition">Đăng ký ngay</Link>
                            <Link to="/contact" className="px-8 py-3 border border-white text-white rounded-lg font-bold hover:bg-indigo-700 transition">Liên hệ sales</Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default LandingPage;