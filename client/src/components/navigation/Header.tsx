import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiBars3, HiXMark } from 'react-icons/hi2';
import Swal from 'sweetalert2';
import { gsap } from 'gsap';
import { getAvatar } from '@/utils/formatters';

interface NavItem {
    path: string;
    label: string;
}

interface UserInfo {
    name: string;
    avatar: string;
    isSuperAdmin?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { path: '/', label: 'Trang chủ' },
    { path: '/about', label: 'Giới thiệu' },
    { path: '/pricing', label: 'Bảng giá' },
    { path: '/features', label: 'Tính năng' },
    { path: '/contact', label: 'Liên hệ' },
];

const getStoredUser = (): { isLoggedIn: boolean; user: UserInfo } => {
    try {
        const token = localStorage.getItem('accessToken');
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (token && u.id) {
            return {
                isLoggedIn: true,
                user: {
                    name: u.fullName || u.name || 'Người dùng',
                    avatar: getAvatar(u),
                    isSuperAdmin: Boolean(u.isSuperAdmin),
                },
            };
        }
    } catch {
        // Fallback on JSON parse error
    }
    return { isLoggedIn: false, user: { name: '', avatar: '' } };
};

const Header = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [initialState] = useState(getStoredUser);
    const [isLoggedIn, setIsLoggedIn] = useState(initialState.isLoggedIn);
    const [user, setUser] = useState<UserInfo>(initialState.user);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const headerRef = useRef<HTMLElement>(null);
    const logoRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLElement>(null);
    const indicatorRef = useRef<HTMLSpanElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dropdownMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    const location = useLocation();
    const navigate = useNavigate();

    const syncUser = useCallback(() => {
        const stored = getStoredUser();
        setIsLoggedIn(stored.isLoggedIn);
        setUser(stored.user);
    }, []);

    useEffect(() => {
        const handleSync = () => syncUser();
        window.addEventListener('user-profile-updated', handleSync);
        window.addEventListener('storage', handleSync);
        return () => {
            window.removeEventListener('user-profile-updated', handleSync);
            window.removeEventListener('storage', handleSync);
        };
    }, [syncUser]);

    useEffect(() => {
        const timer = setTimeout(() => {
            syncUser();
        }, 0);
        return () => clearTimeout(timer);
    }, [location.pathname, syncUser]);

    // Lắng nghe cuộn trang để kích hoạt hiệu ứng kính mờ (glassmorphism)
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Di chuyển sliding indicator chuẩn xác 100% theo offsetLeft/offsetWidth của chữ
    const moveIndicatorTo = useCallback((el: HTMLElement | null, immediate = false) => {
        if (!indicatorRef.current || !navRef.current) return;
        if (!el) {
            gsap.to(indicatorRef.current, {
                opacity: 0,
                duration: 0.2,
                ease: 'power2.out',
                overwrite: 'auto',
            });
            return;
        }

        const left = el.offsetLeft;
        const width = el.offsetWidth;

        if (immediate) {
            gsap.set(indicatorRef.current, { x: left, width, opacity: 1 });
        } else {
            gsap.to(indicatorRef.current, {
                x: left,
                width,
                opacity: 1,
                duration: 0.28,
                ease: 'power2.out',
                overwrite: 'auto',
            });
        }
    }, []);

    // Cập nhật vị trí indicator khi đổi route hoặc resize màn hình
    const syncActiveIndicator = useCallback((immediate = false) => {
        if (!navRef.current) return;
        const activeLink = navRef.current.querySelector(`[data-path="${location.pathname}"]`) as HTMLElement | null;
        moveIndicatorTo(activeLink, immediate);
    }, [location.pathname, moveIndicatorTo]);

    useEffect(() => {
        syncActiveIndicator(false);
    }, [location.pathname, syncActiveIndicator]);

    // Cập nhật lại khi font chữ tải xong để đo kích thước chính xác tuyệt đối
    useEffect(() => {
        if (document.fonts) {
            document.fonts.ready.then(() => {
                syncActiveIndicator(true);
            });
        }
        const handleResize = () => syncActiveIndicator(true);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [syncActiveIndicator]);

    // GSAP Header Entrance Animation khi tải trang
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                defaults: { ease: 'power3.out' },
                onComplete: () => syncActiveIndicator(true),
            });

            // 1. Thanh menu trượt từ trên xuống
            tl.from(headerRef.current, {
                y: -60,
                opacity: 0,
                duration: 0.7,
            })
            // 2. Logo bung ra với hiệu ứng lò xo nhẹ
            .from(logoRef.current, {
                scale: 0.85,
                opacity: 0,
                duration: 0.5,
                ease: 'back.out(1.7)',
            }, '-=0.4')
            // 3. Các mục điều hướng rơi nhẹ lần lượt
            .from('[data-nav-link]', {
                y: -14,
                opacity: 0,
                duration: 0.45,
                stagger: 0.06,
            }, '-=0.35')
            // 4. Cụm nút hành động / Đăng nhập xuất hiện
            .from(ctaRef.current, {
                scale: 0.92,
                opacity: 0,
                duration: 0.5,
                ease: 'back.out(1.5)',
            }, '-=0.3');
        }, headerRef);

        return () => ctx.revert();
    }, [syncActiveIndicator]);

    // GSAP Dropdown Animation (Mở có nảy nhẹ, đóng có hiệu ứng thu gọn)
    useEffect(() => {
        if (dropdownOpen && dropdownMenuRef.current) {
            gsap.fromTo(
                dropdownMenuRef.current,
                { y: -10, scale: 0.95, opacity: 0 },
                { y: 0, scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(1.6)' }
            );
            const items = dropdownMenuRef.current.querySelectorAll('a, button');
            if (items.length) {
                gsap.fromTo(
                    items,
                    { opacity: 0, x: -6 },
                    { opacity: 1, x: 0, duration: 0.18, stagger: 0.02, ease: 'power2.out', delay: 0.04 }
                );
            }
        }
    }, [dropdownOpen]);

    const closeDropdown = () => {
        if (dropdownMenuRef.current) {
            gsap.to(dropdownMenuRef.current, {
                y: -8,
                scale: 0.96,
                opacity: 0,
                duration: 0.16,
                ease: 'power2.in',
                onComplete: () => setDropdownOpen(false),
            });
        } else {
            setDropdownOpen(false);
        }
    };

    const toggleDropdown = () => {
        if (dropdownOpen) {
            closeDropdown();
        } else {
            setDropdownOpen(true);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                if (dropdownOpen) closeDropdown();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen]);

    // GSAP Mobile Menu Animation (Mở êm, đóng êm)
    useEffect(() => {
        if (mobileMenuOpen && mobileMenuRef.current) {
            gsap.fromTo(
                mobileMenuRef.current,
                { height: 0, opacity: 0 },
                { height: 'auto', opacity: 1, duration: 0.32, ease: 'power2.out' }
            );
            gsap.fromTo(
                mobileMenuRef.current.querySelectorAll('[data-mobile-item]'),
                { x: -16, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.25, stagger: 0.035, ease: 'power2.out', delay: 0.06 }
            );
        }
    }, [mobileMenuOpen]);

    const closeMobileMenu = (callback?: () => void) => {
        if (mobileMenuRef.current) {
            gsap.to(mobileMenuRef.current, {
                height: 0,
                opacity: 0,
                duration: 0.22,
                ease: 'power2.in',
                onComplete: () => {
                    setMobileMenuOpen(false);
                    if (callback) callback();
                },
            });
        } else {
            setMobileMenuOpen(false);
            if (callback) callback();
        }
    };

    const toggleMobileMenu = () => {
        if (mobileMenuOpen) {
            closeMobileMenu();
        } else {
            setMobileMenuOpen(true);
        }
    };

    const handleLogout = () => {
        Swal.fire({
            title: 'Đăng xuất?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563EB',
            confirmButtonText: 'Đăng xuất',
            cancelButtonText: 'Ở lại',
        }).then((r) => {
            if (r.isConfirmed) {
                localStorage.clear();
                setIsLoggedIn(false);
                navigate('/');
            }
        });
    };

    const getLinkClass = (path: string, isMobile = false) => {
        const isActive = location.pathname === path;
        if (isMobile) {
            return `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive
                    ? 'text-[#2563EB] bg-blue-50 font-bold'
                    : 'text-gray-700 hover:text-[#2563EB] hover:bg-gray-50'
            }`;
        }
        return isActive
            ? 'font-bold text-[#2563EB]'
            : 'font-medium text-gray-600 hover:text-[#2563EB] transition-colors';
    };

    // Micro-interactions cho nút CTA (hover scale nhẹ nhàng bằng GSAP, không tracking theo chuột)
    const handleCtaEnter = (e: React.MouseEvent<HTMLElement>) => {
        gsap.to(e.currentTarget, { scale: 1.03, duration: 0.2, ease: 'power2.out' });
    };
    const handleCtaLeave = (e: React.MouseEvent<HTMLElement>) => {
        gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: 'power2.out' });
    };

    return (
        <header
            ref={headerRef}
            className={`sticky top-0 z-50 font-sans transition-all duration-300 ${
                scrolled
                    ? 'bg-white/85 backdrop-blur-md shadow-md border-b border-gray-100/70'
                    : 'bg-white shadow-sm'
            }`}
        >
            <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
                <div className={`flex justify-between items-center transition-all duration-300 ${scrolled ? 'h-14' : 'h-16'}`}>
                    {/* Logo */}
                    <div ref={logoRef} className="flex-shrink-0 flex items-center">
                        <Link to="/" className="transition-transform duration-200 hover:scale-105 active:scale-95">
                            <img
                                src="/img/aegism_logo_mini.png"
                                alt="Logo AEGISM"
                                className="h-8 sm:h-10 w-auto"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation - Giữ nguyên chữ như cũ, căn chuẩn 100% */}
                    <nav
                        ref={navRef}
                        onMouseLeave={() => syncActiveIndicator(false)}
                        className="relative hidden md:flex md:items-center md:gap-4 lg:gap-10 text-sm lg:text-base whitespace-nowrap py-1"
                    >
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                data-nav-link
                                data-path={item.path}
                                onMouseEnter={(e) => moveIndicatorTo(e.currentTarget)}
                                className={`pb-1 transition-colors duration-200 ${getLinkClass(item.path)}`}
                            >
                                {item.label}
                            </Link>
                        ))}

                        {/* Thanh chỉ báo trượt GSAP chuẩn xác: left-0, m-0, không bị lệch */}
                        <span
                            ref={indicatorRef}
                            className="absolute bottom-0 left-0 m-0 h-[2.5px] bg-[#2563EB] rounded-full shadow-[0_2px_8px_rgba(37,99,235,0.4)] pointer-events-none opacity-0"
                            style={{ left: 0, margin: 0 }}
                            aria-hidden="true"
                        />
                    </nav>

                    {/* CTA / User */}
                    <div ref={ctaRef} className="flex items-center gap-3">
                        {isLoggedIn ? (
                            /* Avatar dropdown khi đã đăng nhập */
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={toggleDropdown}
                                    className="flex items-center gap-2 focus:outline-none transition-transform hover:scale-105"
                                >
                                    <img
                                        src={user.avatar}
                                        alt="Avatar"
                                        className="w-9 h-9 rounded-full object-cover border-2 border-[#2563EB] shadow-sm"
                                    />
                                    <span className="hidden md:block text-sm font-semibold text-gray-700 max-w-[120px] truncate">
                                        {user.name}
                                    </span>
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {dropdownOpen && (
                                    <div
                                        ref={dropdownMenuRef}
                                        className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                                    >
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {user.isSuperAdmin ? 'Super Admin' : 'Thành viên'}
                                            </p>
                                        </div>
                                        <div className="md:hidden py-1 border-b border-gray-100">
                                            <Link
                                                to="/"
                                                onClick={closeDropdown}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#2563EB] transition-colors"
                                            >
                                                🌐 Trang chủ
                                            </Link>
                                            <Link
                                                to="/about"
                                                onClick={closeDropdown}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#2563EB] transition-colors"
                                            >
                                                🏢 Giới thiệu
                                            </Link>
                                            <Link
                                                to="/features"
                                                onClick={closeDropdown}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#2563EB] transition-colors"
                                            >
                                                ⭐ Tính năng
                                            </Link>
                                            <Link
                                                to="/contact"
                                                onClick={closeDropdown}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#2563EB] transition-colors"
                                            >
                                                📞 Liên hệ
                                            </Link>
                                        </div>
                                        <div className="py-1">
                                            <Link
                                                to={user.isSuperAdmin ? '/super-admin/dashboard' : '/dashboard'}
                                                onClick={closeDropdown}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#2563EB] transition-colors"
                                            >
                                                🏠 Vào Dashboard
                                            </Link>
                                            <Link
                                                to="/profile"
                                                onClick={closeDropdown}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#2563EB] transition-colors"
                                            >
                                                ⚙️ Cài đặt tài khoản
                                            </Link>
                                            <Link
                                                to="/pricing"
                                                onClick={closeDropdown}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#2563EB] transition-colors"
                                            >
                                                💳 Nâng cấp gói
                                            </Link>
                                        </div>
                                        <div className="border-t border-gray-100 py-1">
                                            <button
                                                onClick={() => {
                                                    closeDropdown();
                                                    handleLogout();
                                                }}
                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                🚪 Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Nút đăng nhập/dùng thử khi chưa đăng nhập */
                            <>
                                <Link
                                    to="/request-demo"
                                    onMouseEnter={handleCtaEnter}
                                    onMouseLeave={handleCtaLeave}
                                    className="hidden md:inline-flex items-center justify-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 transition-shadow hover:shadow-blue-500/25 hover:shadow-lg active:scale-95"
                                >
                                    Dùng thử miễn phí
                                </Link>
                                <Link
                                    to="/login"
                                    onMouseEnter={handleCtaEnter}
                                    onMouseLeave={handleCtaLeave}
                                    className="hidden h-10 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-neutral-100 px-4 text-sm font-bold leading-normal tracking-[0.015em] text-neutral-700 transition-colors hover:bg-neutral-200 active:scale-95 sm:flex"
                                >
                                    Đăng nhập
                                </Link>
                            </>
                        )}

                        {/* Mobile menu button */}
                        {!isLoggedIn && (
                            <button
                                type="button"
                                onClick={toggleMobileMenu}
                                aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
                                className="ml-2 md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none transition-transform active:scale-95"
                            >
                                {!mobileMenuOpen ? <HiBars3 className="h-6 w-6" /> : <HiXMark className="h-6 w-6" />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div ref={mobileMenuRef} className="md:hidden border-t border-gray-100 overflow-hidden">
                        <div className="pt-2 pb-3 space-y-1">
                            {NAV_ITEMS.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    data-mobile-item
                                    className={getLinkClass(item.path, true)}
                                    onClick={() => closeMobileMenu()}
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <div className="border-t border-gray-100 my-2 pt-2">
                                {isLoggedIn ? (
                                    <>
                                        <Link
                                            to="/dashboard"
                                            data-mobile-item
                                            onClick={() => closeMobileMenu()}
                                            className="block px-3 py-2 rounded-md text-base font-medium text-[#2563EB] hover:bg-blue-50"
                                        >
                                            🏠 Vào Dashboard
                                        </Link>
                                        <button
                                            data-mobile-item
                                            onClick={() => closeMobileMenu(() => handleLogout())}
                                            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                                        >
                                            🚪 Đăng xuất
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/login"
                                            data-mobile-item
                                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#2563EB] hover:bg-gray-50"
                                            onClick={() => closeMobileMenu()}
                                        >
                                            Đăng nhập
                                        </Link>
                                        <Link
                                            to="/request-demo"
                                            data-mobile-item
                                            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-[#2563EB] hover:bg-blue-700 mt-1"
                                            onClick={() => closeMobileMenu()}
                                        >
                                            Dùng thử miễn phí
                                        </Link>
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
