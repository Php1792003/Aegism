import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-200 font-sans">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Column 1: Logo & Info */}
                    <div>
                        <Link to="/">
                            <img src="/img/aegism_logo_mini.png" alt="Logo AEGISM" className="h-[30px] w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
                            <span className="text-xl font-bold text-gray-800 ml-2 md:hidden">AEGISM</span>
                        </Link>
                        <p className="mt-2 text-sm text-gray-500">
                            Giải pháp toàn diện cho vận hành và giám sát an ninh.
                        </p>
                        <p className="mt-4 text-sm text-gray-500">
                            &copy; 2025 AEGISM. All rights reserved.
                        </p>
                    </div>
                    {/* Column 2: Platform */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Nền tảng</h4>
                        <ul className="mt-4 space-y-2">
                            <li><Link to="/features" className="text-base text-gray-500 hover:text-gray-900">Vận hành</Link></li>
                            <li><Link to="/features" className="text-base text-gray-500 hover:text-gray-900">Giám sát</Link></li>
                            <li><Link to="/features" className="text-base text-gray-500 hover:text-gray-900">An ninh</Link></li>
                            <li><Link to="/pricing" className="text-base text-gray-500 hover:text-gray-900">Bảng giá</Link></li>
                        </ul>
                    </div>
                    {/* Column 3: Company */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Công ty</h4>
                        <ul className="mt-4 space-y-2">
                            <li><Link to="/about" className="text-base text-gray-500 hover:text-gray-900">Về chúng tôi</Link></li>
                            <li><Link to="/careers" className="text-base text-gray-500 hover:text-gray-900">Tuyển dụng</Link></li>
                            <li><Link to="/blog" className="text-base text-gray-500 hover:text-gray-900">Blog</Link></li>
                            <li><Link to="/partners" className="text-base text-gray-500 hover:text-gray-900">Đối tác</Link></li>
                        </ul>
                    </div>
                    {/* Column 4: Contact */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Liên hệ</h4>
                        <ul className="mt-4 space-y-2">
                            <li><Link to="/support" className="text-base text-gray-500 hover:text-gray-900">Hỗ trợ</Link></li>
                            <li><Link to="/sales" className="text-base text-gray-500 hover:text-gray-900">Bán hàng</Link></li>
                            <li><Link to="/press" className="text-base text-gray-500 hover:text-gray-900">Liên hệ báo chí</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;