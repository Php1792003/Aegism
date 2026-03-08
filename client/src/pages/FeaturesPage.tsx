import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    HiBars3,
    HiXMark,
    HiOutlineQrCode,
    HiOutlineClipboardDocumentList,
    HiOutlineChartBarSquare,
    HiCheckCircle,
    HiMap,
    HiShieldCheck,
    HiBolt
} from 'react-icons/hi2';

const colors = {
    primary: 'text-[#2563EB]',
    bgPrimary: 'bg-[#2563EB]',
    bgPrimaryHover: 'hover:bg-blue-700',
    dark: 'text-[#1F2937]',
    lightBg: 'bg-[#F9FAFB]',
    white: 'bg-white',
};

const featuresData = [
    {
        id: 'feature-management',
        title: 'Trung Tâm Chỉ Huy & Quản Lý Vận Hành',
        description: 'Dashboard trung tâm giúp bạn nắm bắt toàn bộ hoạt động của đội ngũ bảo vệ/nhân viên hiện trường theo thời gian thực. Phân công nhiệm vụ và theo dõi tiến độ chỉ với vài cú click.',
        icon: <HiOutlineClipboardDocumentList className="w-6 h-6 text-white" />,
        image: '../img/img_tinh_nang_1.jpg',
        reverse: false,
        subFeatures: [
            {
                title: 'Bản đồ số (Digital Map)',
                desc: 'Hiển thị vị trí nhân viên, điểm mục tiêu và sự cố ngay trên bản đồ trực quan.'
            },
            {
                title: 'Quy trình tự động (Workflow)',
                desc: 'Thiết lập quy trình tuần tra, kiểm tra thiết bị (PCCC, Kỹ thuật) tự động lặp lại hàng ngày.'
            },
            {
                title: 'Phân quyền đa cấp',
                desc: 'Quản lý chi tiết quyền hạn cho Trưởng ca, Giám sát vùng và Ban quản lý.'
            }
        ]
    },
    {
        id: 'feature-qr',
        title: 'Giám Sát Tuần Tra Thông Minh (QR & GPS)',
        description: 'Công nghệ lõi giúp loại bỏ gian lận. Nhân viên sử dụng ứng dụng di động để quét QR Code tại các điểm chốt, hệ thống tự động đối chiếu vị trí GPS để xác thực.',
        icon: <HiOutlineQrCode className="w-6 h-6 text-white" />,
        image: '../img/img_tinh_nang_2.png',
        reverse: true,
        bgGray: true,
        subFeatures: [
            {
                title: 'Chống gian lận vị trí',
                desc: 'Cảnh báo ngay lập tức nếu nhân viên quét QR nhưng GPS không khớp với điểm mục tiêu.'
            },
            {
                title: 'Giám sát lộ trình (Live Tracking)',
                desc: 'Vẽ lại lộ trình di chuyển của nhân viên bảo vệ trong ca làm việc.'
            },
            {
                title: 'Báo cáo sự cố tức thì',
                desc: 'Gửi ảnh, video, ghi âm hiện trường về trung tâm ngay khi phát hiện bất thường.'
            }
        ]
    },
    {
        id: 'feature-analytics',
        title: 'Hệ Thống Báo Cáo & Phân Tích Dữ Liệu',
        description: 'Biến dữ liệu thô thành thông tin giá trị. Hệ thống tự động tổng hợp báo cáo giúp Ban quản lý đánh giá hiệu suất nhân sự và chất lượng dịch vụ.',
        icon: <HiOutlineChartBarSquare className="w-6 h-6 text-white" />,
        image: '../img/img_tinh_nang_3.png',
        reverse: false,
        subFeatures: [
            {
                title: 'Dashboard trực quan',
                desc: 'Biểu đồ tròn, cột thể hiện tỷ lệ hoàn thành ca trực, số lượng sự cố theo thời gian.'
            },
            {
                title: 'Xuất báo cáo đa định dạng',
                desc: 'Hỗ trợ xuất Excel, PDF chi tiết phục vụ công tác tính lương và báo cáo khách hàng.'
            },
            {
                title: 'KPI Nhân viên',
                desc: 'Tự động chấm điểm hiệu suất nhân viên dựa trên độ chuyên cần và mức độ hoàn thành nhiệm vụ.'
            }
        ]
    }
];

const FeaturesPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-white text-gray-800 font-sans">
            <main>
                <section className="relative bg-gray-50 pt-24 pb-20 overflow-hidden">
                    <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0 pointer-events-none">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                    </div>

                    <div className="relative container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center z-10">
                        <h1 className={`text-4xl md:text-5xl font-extrabold ${colors.dark} tracking-tight mb-6`}>
                            Công Nghệ Hóa Quy Trình <br className="hidden md:block" />
                            <span className={colors.primary}>Giám Sát & Vận Hành An Ninh</span>
                        </h1>
                        <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                            Khám phá bộ công cụ mạnh mẽ của AEGISM giúp bạn quản lý đội ngũ từ xa, minh bạch hóa hoạt động tuần tra và xử lý sự cố tức thì.
                        </p>

                        <div className="mt-10 flex flex-wrap justify-center gap-4">
                            <button onClick={() => scrollToSection('feature-management')} className="flex items-center px-6 py-3 rounded-full bg-white shadow-md text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition border border-gray-100">
                                <HiMap className="mr-2 text-blue-500" /> Quản lý Vận hành
                            </button>
                            <button onClick={() => scrollToSection('feature-qr')} className="flex items-center px-6 py-3 rounded-full bg-white shadow-md text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition border border-gray-100">
                                <HiShieldCheck className="mr-2 text-green-500" /> Tuần tra QR
                            </button>
                            <button onClick={() => scrollToSection('feature-analytics')} className="flex items-center px-6 py-3 rounded-full bg-white shadow-md text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition border border-gray-100">
                                <HiBolt className="mr-2 text-yellow-500" /> Báo cáo & KPI
                            </button>
                        </div>
                    </div>
                </section>

                {featuresData.map((feature) => (
                    <section
                        key={feature.id}
                        id={feature.id}
                        className={`py-16 md:py-24 ${feature.bgGray ? 'bg-gray-50' : 'bg-white'}`}
                    >
                        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center`}>

                                <div className={`relative ${feature.reverse ? 'lg:order-1' : 'lg:order-2'}`}>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl transform rotate-2 opacity-10 blur-lg"></div>
                                    <img
                                        src={feature.image}
                                        alt={feature.title}
                                        className="relative w-full rounded-2xl shadow-2xl border border-gray-100 transform transition-transform duration-500 hover:scale-[1.02]"
                                    />
                                    <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-gray-100 hidden md:block">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 rounded-full">
                                                <HiCheckCircle className="w-6 h-6 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Trạng thái</p>
                                                <p className="font-bold text-gray-800">Đang hoạt động</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={`${feature.reverse ? 'lg:order-2' : 'lg:order-1'}`}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className={`p-3 rounded-lg ${colors.bgPrimary} shadow-lg shadow-blue-500/30`}>
                                            {feature.icon}
                                        </div>
                                        <span className={`text-sm font-bold uppercase tracking-wider ${colors.primary}`}>
                                            Tính năng nổi bật
                                        </span>
                                    </div>

                                    <h2 className={`text-3xl md:text-4xl font-extrabold ${colors.dark} mb-6 leading-tight`}>
                                        {feature.title}
                                    </h2>
                                    <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                        {feature.description}
                                    </p>

                                    <div className="space-y-6">
                                        {feature.subFeatures.map((sub, index) => (
                                            <div key={index} className="flex">
                                                <div className="flex-shrink-0">
                                                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-50">
                                                        <HiCheckCircle className={`h-6 w-6 ${colors.primary}`} />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <h4 className={`text-lg font-bold ${colors.dark}`}>
                                                        {sub.title}
                                                    </h4>
                                                    <p className="mt-1 text-gray-600">
                                                        {sub.desc}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </section>
                ))}

                {/* --- CTA SECTION --- */}
                <section className={`${colors.bgPrimary} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="container mx-auto max-w-5xl py-20 px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
                            Sẵn sàng tối ưu hóa vận hành doanh nghiệp?
                        </h2>
                        <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-10">
                            Trải nghiệm sức mạnh của AEGISM ngay hôm nay. Hệ thống quản lý an ninh và vận hành số 1 dành cho doanh nghiệp hiện đại.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/request-demo" className="inline-flex items-center justify-center px-8 py-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-blue-700 bg-white hover:bg-gray-50 transition transform hover:-translate-y-1">
                                Đăng ký Demo miễn phí
                            </Link>
                            <Link to="/contact" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white rounded-xl shadow-sm text-lg font-bold text-white hover:bg-blue-700 transition">
                                Liên hệ tư vấn
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default FeaturesPage;