import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-200 font-sans">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="xl:grid xl:grid-cols-4 xl:gap-8">
                    {/* Column 1: Logo & Info */}
                    <div className="space-y-6 xl:col-span-1">
                        <Link to="/" className="inline-block">
                            <img 
                                src="/img/aegism_logo_mini.png" 
                                alt="Logo AEGISM" 
                                className="h-12 w-auto object-contain object-left" 
                                onError={(e) => e.currentTarget.style.display = 'none'} 
                            />
                        </Link>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                            Giải pháp toàn diện cho vận hành và giám sát an ninh bằng công nghệ tiên tiến.
                        </p>
                        <div className="flex items-center gap-x-4">
                            <Link to="/terms" className="text-sm text-gray-400 hover:text-[#2563EB] transition-colors font-medium">Điều khoản</Link>
                            <span className="text-gray-300">|</span>
                            <Link to="/policy" className="text-sm text-gray-400 hover:text-[#2563EB] transition-colors font-medium">Bảo mật</Link>
                        </div>
                    </div>
                    
                    {/* Columns 2-4: Links */}
                    <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-3 xl:mt-0 md:grid-cols-3">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Nền tảng</h4>
                            <ul className="mt-6 space-y-4">
                                <li><Link to="/features" className="text-sm text-gray-500 hover:text-[#2563EB] transition-colors">Vận hành</Link></li>
                                <li><Link to="/features" className="text-sm text-gray-500 hover:text-[#2563EB] transition-colors">Giám sát</Link></li>
                                <li><Link to="/features" className="text-sm text-gray-500 hover:text-[#2563EB] transition-colors">An ninh</Link></li>
                                <li><Link to="/pricing" className="text-sm text-gray-500 hover:text-[#2563EB] transition-colors">Bảng giá</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Công ty</h4>
                            <ul className="mt-6 space-y-4">
                                <li><Link to="/about" className="text-sm text-gray-500 hover:text-[#2563EB] transition-colors">Về chúng tôi</Link></li>
                                <li><Link to="/careers" className="text-sm text-gray-500 hover:text-[#2563EB] transition-colors">Tuyển dụng</Link></li>
                                <li><Link to="/blog" className="text-sm text-gray-500 hover:text-[#2563EB] transition-colors">Blog</Link></li>
                                <li><Link to="/partners" className="text-sm text-gray-500 hover:text-[#2563EB] transition-colors">Đối tác</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Liên hệ</h4>
                            <ul className="mt-6 space-y-4">
                                <li><Link to="/contact" className="text-sm text-gray-500 hover:text-[#2563EB] transition-colors">Hỗ trợ</Link></li>
                                <li><Link to="/contact" className="text-sm text-gray-500 hover:text-[#2563EB] transition-colors">Bán hàng</Link></li>
                                <li><Link to="/contact" className="text-sm text-gray-500 hover:text-[#2563EB] transition-colors">Liên hệ báo chí</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div className="mt-12 border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-400">
                        &copy; 2025 AEGISM. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;