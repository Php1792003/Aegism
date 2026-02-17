import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiBars3, HiXMark } from 'react-icons/hi2';

const Header = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation(); // Hook lấy đường dẫn hiện tại

    // Hàm xử lý class active cho Desktop và Mobile
    const getLinkClass = (path: string, isMobile = false) => {
        const isActive = location.pathname === path;

        if (isMobile) {
            // Style cho Mobile Menu
            return `block px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive
                    ? 'text-[#4F46E5] bg-indigo-50 font-bold' // Active: Màu xanh + nền nhạt
                    : 'text-gray-700 hover:text-[#4F46E5] hover:bg-gray-50' // Inactive
                }`;
        }

        // Style cho Desktop Menu
        return isActive
            ? 'font-bold text-[#4F46E5] border-b-2 border-[#4F46E5] pb-1 transition-all' // Active: Đậm + gạch chân
            : 'font-medium text-gray-600 hover:text-[#4F46E5] transition-colors'; // Inactive
    };

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50 font-sans">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/">
                            <img src="/img/aegism_logo.png" alt="Logo AEGISM" className="h-[210px] w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex md:items-center md:space-x-10">
                        <Link to="/" className={getLinkClass('/')}>Trang chủ</Link>
                        <Link to="/about" className={getLinkClass('/about')}>Giới thiệu</Link>
                        <Link to="/pricing" className={getLinkClass('/pricing')}>Bảng giá</Link>
                        <Link to="/features" className={getLinkClass('/features')}>Tính năng</Link>
                        <Link to="/contact" className={getLinkClass('/contact')}>Liên hệ</Link>
                    </nav>

                    {/* CTA Button */}
                    <div className="flex items-center gap-2">
                        <Link to="/request-demo" className="hidden md:inline-flex items-center justify-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#4F46E5] hover:bg-indigo-700 transition-colors">
                            <span className="truncate">Dùng thử miễn phí</span>
                        </Link>
                        <Link to="/login" className="hidden h-10 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-neutral-100 px-4 text-sm font-bold leading-normal tracking-[0.015em] text-neutral-700 transition-colors hover:bg-neutral-200 sm:flex">
                            <span className="truncate">Đăng nhập</span>
                        </Link>

                        {/* Mobile menu button */}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="ml-2 md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#4F46E5]"
                            aria-expanded={mobileMenuOpen}
                        >
                            <span className="sr-only">Mở menu</span>
                            {!mobileMenuOpen ? (
                                <HiBars3 className="h-6 w-6" />
                            ) : (
                                <HiXMark className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-100" id="mobile-menu">
                        <div className="pt-2 pb-3 space-y-1">
                            <Link to="/" className={getLinkClass('/', true)} onClick={() => setMobileMenuOpen(false)}>Trang chủ</Link>
                            <Link to="/about" className={getLinkClass('/about', true)} onClick={() => setMobileMenuOpen(false)}>Giới thiệu</Link>
                            <Link to="/pricing" className={getLinkClass('/pricing', true)} onClick={() => setMobileMenuOpen(false)}>Bảng giá</Link>
                            <Link to="/features" className={getLinkClass('/features', true)} onClick={() => setMobileMenuOpen(false)}>Tính năng</Link>
                            <Link to="/contact" className={getLinkClass('/contact', true)} onClick={() => setMobileMenuOpen(false)}>Liên hệ</Link>

                            <div className="border-t border-gray-100 my-2 pt-2">
                                <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#4F46E5] hover:bg-gray-50">Đăng nhập</Link>
                                <Link to="/request-demo" className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-[#4F46E5] hover:bg-indigo-700 mt-1">
                                    Dùng thử miễn phí
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;