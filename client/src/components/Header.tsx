import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiBars3, HiXMark } from 'react-icons/hi2';
import Swal from 'sweetalert2';

const Header = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<any>({ name: '', avatar: '' });
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (token && u.id) {
            setIsLoggedIn(true);
            const avatarUrl = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.fullName || 'User')}&background=4F46E5&color=fff`;
            setUser({ name: u.name || u.fullName || 'Người dùng', avatar: avatarUrl, isSuperAdmin: u.isSuperAdmin });
        }
    }, [location]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        Swal.fire({ title: 'Đăng xuất?', icon: 'question', showCancelButton: true, confirmButtonColor: '#4F46E5', confirmButtonText: 'Đăng xuất', cancelButtonText: 'Ở lại' })
            .then(r => { if (r.isConfirmed) { localStorage.clear(); setIsLoggedIn(false); navigate('/'); } });
    };

    const getLinkClass = (path: string, isMobile = false) => {
        const isActive = location.pathname === path;
        if (isMobile) return `block px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive ? 'text-[#4F46E5] bg-indigo-50 font-bold' : 'text-gray-700 hover:text-[#4F46E5] hover:bg-gray-50'}`;
        return isActive ? 'font-bold text-[#4F46E5] border-b-2 border-[#4F46E5] pb-1 transition-all' : 'font-medium text-gray-600 hover:text-[#4F46E5] transition-colors';
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

                    {/* CTA / User */}
                    <div className="flex items-center gap-3">
                        {isLoggedIn ? (
                            /* Avatar dropdown khi đã đăng nhập */
                            <div className="relative" ref={dropdownRef}>
                                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 focus:outline-none">
                                    <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-full object-cover border-2 border-[#4F46E5] shadow-sm" />
                                    <span className="hidden md:block text-sm font-semibold text-gray-700 max-w-[120px] truncate">{user.name}</span>
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{user.isSuperAdmin ? 'Super Admin' : 'Thành viên'}</p>
                                        </div>
                                        <div className="py-1">
                                            <Link to={user.isSuperAdmin ? '/super-admin/dashboard' : '/dashboard'} onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-[#4F46E5] transition-colors">
                                                🏠 Vào Dashboard
                                            </Link>
                                            <Link to="/profile" onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-[#4F46E5] transition-colors">
                                                ⚙️ Cài đặt tài khoản
                                            </Link>
                                            <Link to="/pricing" onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-[#4F46E5] transition-colors">
                                                💳 Nâng cấp gói
                                            </Link>
                                        </div>
                                        <div className="border-t border-gray-100 py-1">
                                            <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                                🚪 Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Nút đăng nhập/dùng thử khi chưa đăng nhập */
                            <>
                                <Link to="/request-demo" className="hidden md:inline-flex items-center justify-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#4F46E5] hover:bg-indigo-700 transition-colors">
                                    Dùng thử miễn phí
                                </Link>
                                <Link to="/login" className="hidden h-10 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-neutral-100 px-4 text-sm font-bold leading-normal tracking-[0.015em] text-neutral-700 transition-colors hover:bg-neutral-200 sm:flex">
                                    Đăng nhập
                                </Link>
                            </>
                        )}

                        {/* Mobile menu button */}
                        <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="ml-2 md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none">
                            {!mobileMenuOpen ? <HiBars3 className="h-6 w-6" /> : <HiXMark className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-100">
                        <div className="pt-2 pb-3 space-y-1">
                            <Link to="/" className={getLinkClass('/', true)} onClick={() => setMobileMenuOpen(false)}>Trang chủ</Link>
                            <Link to="/about" className={getLinkClass('/about', true)} onClick={() => setMobileMenuOpen(false)}>Giới thiệu</Link>
                            <Link to="/pricing" className={getLinkClass('/pricing', true)} onClick={() => setMobileMenuOpen(false)}>Bảng giá</Link>
                            <Link to="/features" className={getLinkClass('/features', true)} onClick={() => setMobileMenuOpen(false)}>Tính năng</Link>
                            <Link to="/contact" className={getLinkClass('/contact', true)} onClick={() => setMobileMenuOpen(false)}>Liên hệ</Link>
                            <div className="border-t border-gray-100 my-2 pt-2">
                                {isLoggedIn ? (
                                    <>
                                        <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-[#4F46E5] hover:bg-indigo-50">🏠 Vào Dashboard</Link>
                                        <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">🚪 Đăng xuất</button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#4F46E5] hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Đăng nhập</Link>
                                        <Link to="/request-demo" className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-[#4F46E5] hover:bg-indigo-700 mt-1" onClick={() => setMobileMenuOpen(false)}>Dùng thử miễn phí</Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
