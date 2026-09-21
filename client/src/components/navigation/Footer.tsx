import React from 'react';
import { Link } from 'react-router-dom';
import {
    HiOutlineSparkles,
    HiOutlineArrowSmallUp,
    HiOutlineArrowDownTray,
} from 'react-icons/hi2';

const Footer: React.FC = () => {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-white dark:bg-[#060c18] border-t border-gray-200/80 dark:border-slate-800/80 font-sans transition-colors duration-200">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-5">
                <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
                    {/* Brand Column */}
                    <div className="space-y-1.5 lg:col-span-4">
                        <Link to="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
                            <img
                                src="/img/aegism_logo_mini.png"
                                alt="Logo AEGISM"
                                className="h-6 sm:h-7 w-auto object-contain object-left"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        </Link>

                        <p className="text-xs sm:text-[13px] text-gray-600 dark:text-slate-300 leading-relaxed max-w-sm">
                            Nền tảng quản lý tuần tra bảo vệ số hóa bằng mã QR động và GPS thời gian thực, tối ưu vận hành an ninh cho tòa nhà & doanh nghiệp.
                        </p>

                        {/* Compact Contact Information */}
                        <div className="space-y-0.5 text-xs text-gray-500 dark:text-slate-400">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                                <a href="tel:0905441263" className="hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors">
                                    Hotline: (+84) 905 441 263
                                </a>
                                <span>•</span>
                                <a href="mailto:contact@aegism.vn" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    contact@aegism.vn
                                </a>
                            </div>
                            <p className="truncate">Khu Công nghệ cao, TP. Thủ Đức, TP. Hồ Chí Minh</p>
                        </div>

                        {/* Compact Server Status */}
                        <div className="pt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Hệ thống vận hành ổn định: 99.98%</span>
                        </div>
                    </div>

                    {/* Navigation Link Columns */}
                    <div className="mt-4 lg:mt-0 lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
                        {/* Col 1: Features */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white tracking-wider uppercase flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                                <span>Giải pháp</span>
                            </h4>
                            <ul className="mt-1.5 space-y-1 text-xs sm:text-[12.5px]">
                                <li>
                                    <Link to="/features" className="text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        Tuần tra QR Code động
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/features" className="text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        Bản đồ số GPS thời gian thực
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/features" className="text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        Báo cáo sự cố & SOS tức thì
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/features" className="text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        Đo lường SLA & ca trực
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/download" className="inline-flex items-center gap-1 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        <HiOutlineArrowDownTray className="w-3 h-3 text-blue-500" />
                                        <span>Tải ứng dụng Android</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Col 2: Pricing */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white tracking-wider uppercase flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400" />
                                <span>Bảng giá & Dịch vụ</span>
                            </h4>
                            <ul className="mt-1.5 space-y-1 text-xs sm:text-[12.5px]">
                                <li>
                                    <Link to="/pricing" className="text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        Gói Starter (Đội nhỏ)
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/pricing" className="text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        Gói Business (Tòa nhà)
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/pricing" className="text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        Gói Enterprise (Doanh nghiệp)
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/register" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                                        <HiOutlineSparkles className="w-3 h-3" />
                                        <span>Dùng thử miễn phí 14 ngày</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/request-demo" className="text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        Đặt lịch Demo trực tiếp
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Col 3: Company */}
                        <div className="col-span-2 sm:col-span-1">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white tracking-wider uppercase flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                                <span>Về chúng tôi</span>
                            </h4>
                            <ul className="mt-1.5 space-y-1 text-xs sm:text-[12.5px]">
                                <li>
                                    <Link to="/about" className="text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        Sứ mệnh & Giải pháp Aegism
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/contact" className="text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        Liên hệ & Tư vấn kỹ thuật
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/terms" className="text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        Điều khoản dịch vụ
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/policy" className="text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        Chính sách bảo mật dữ liệu
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/login" className="text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        Cổng đăng nhập hệ thống
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Legal & Copyright Bar - Ultra Compact */}
                <div className="mt-4 pt-2.5 border-t border-gray-100 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] sm:text-xs text-gray-500 dark:text-slate-400">
                    <p className="text-center sm:text-left">
                        &copy; {new Date().getFullYear()} AEGISM Platform. Bản quyền thuộc về Đội ngũ Công nghệ Aegism.
                    </p>

                    <div className="flex items-center gap-3 flex-wrap justify-center">
                        <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Điều khoản
                        </Link>
                        <span>•</span>
                        <Link to="/policy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Bảo mật
                        </Link>
                        <span>•</span>
                        <Link to="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Hỗ trợ
                        </Link>
                        <span>•</span>
                        <button
                            type="button"
                            onClick={scrollToTop}
                            className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                            <span>Lên đầu trang</span>
                            <HiOutlineArrowSmallUp className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;