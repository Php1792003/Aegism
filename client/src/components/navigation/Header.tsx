import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    HiBars3,
    HiXMark,
    HiChevronDown,
    HiChevronRight,
    HiOutlineHome,
    HiOutlineSquares2X2,
    HiOutlineCog6Tooth,
    HiOutlineCreditCard,
    HiOutlineArrowRightOnRectangle,
    HiOutlineGlobeAlt,
    HiOutlineBuildingOffice2,
    HiOutlineSparkles,
    HiOutlinePhone,
    HiOutlineShieldCheck,
} from 'react-icons/hi2';
import Swal from 'sweetalert2';
import { gsap } from 'gsap';
import { getAvatar } from '@/utils/formatters';
import ThemeToggle from '@/components/ThemeToggle';

interface NavItem {
    path: string;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface UserInfo {
    name: string;
    avatar: string;
    isSuperAdmin?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    {
        path: '/',
        label: 'Trang chủ',
        desc: 'Tổng quan & trung tâm an ninh',
        icon: HiOutlineHome,
    },
    {
        path: '/about',
        label: 'Giới thiệu',
        desc: 'Sứ mệnh & giải pháp Aegism',
        icon: HiOutlineBuildingOffice2,
    },
    {
        path: '/pricing',
        label: 'Bảng giá',
        desc: 'Gói dịch vụ minh bạch & linh hoạt',
        icon: HiOutlineCreditCard,
    },
    {
        path: '/features',
        label: 'Tính năng',
        desc: 'Tuần tra QR, GPS & AI giám sát',
        icon: HiOutlineSparkles,
    },
    {
        path: '/contact',
        label: 'Liên hệ',
        desc: 'Tư vấn & Hỗ trợ kỹ thuật 24/7',
        icon: HiOutlinePhone,
    },
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
            return `block px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive
                    ? 'text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 font-bold'
                    : 'text-gray-700 dark:text-gray-200 hover:text-[#2563EB] dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                }`;
        }
        return isActive
            ? 'font-bold text-[#2563EB] dark:text-blue-400'
            : 'font-medium text-gray-600 dark:text-gray-300 hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors';
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
            className={`sticky top-0 z-50 font-sans transition-all duration-300 ${scrolled
                    ? 'bg-white/90 dark:bg-[#070d18]/90 backdrop-blur-md shadow-md border-b border-gray-100/80 dark:border-slate-800/80'
                    : 'bg-white dark:bg-[#070d18] shadow-sm dark:border-b dark:border-slate-800/50'
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

                    {/* Desktop Navigation */}
                    <nav
                        ref={navRef}
                        onMouseLeave={() => syncActiveIndicator(false)}
                        className="relative hidden lg:flex lg:items-center lg:gap-8 xl:gap-10 text-sm lg:text-base whitespace-nowrap py-1"
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
                            className="absolute bottom-0 left-0 m-0 h-[2.5px] bg-[#2563EB] dark:bg-blue-400 rounded-full shadow-[0_2px_8px_rgba(37,99,235,0.4)] pointer-events-none opacity-0"
                            style={{ left: 0, margin: 0 }}
                            aria-hidden="true"
                        />
                    </nav>

                    {/* CTA / User */}
                    <div ref={ctaRef} className="flex items-center gap-2 sm:gap-3">
                        <ThemeToggle compact />
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
                                    <span className="hidden md:block text-sm font-semibold text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
                                        {user.name}
                                    </span>
                                    <HiChevronDown
                                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {dropdownOpen && (
                                    <div
                                        ref={dropdownMenuRef}
                                        className="absolute right-0 mt-2.5 w-60 bg-white/95 dark:bg-[#0c1425]/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/70 border border-gray-100 dark:border-slate-800/80 z-50 overflow-hidden p-1.5 transition-all"
                                    >
                                        <div className="px-3.5 py-3 mb-1 rounded-xl bg-gray-50/80 dark:bg-slate-800/40 border border-gray-100/80 dark:border-slate-800/50">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                                                <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 truncate">
                                                    {user.isSuperAdmin ? 'Super Admin' : 'Thành viên'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="py-0.5 space-y-0.5">
                                            <Link
                                                to={user.isSuperAdmin ? '/super-admin/dashboard' : '/dashboard'}
                                                onClick={closeDropdown}
                                                className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            >
                                                <HiOutlineSquares2X2 className="w-4 h-4 text-gray-400 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                                <span>Vào Dashboard</span>
                                            </Link>
                                            <Link
                                                to="/profile"
                                                onClick={closeDropdown}
                                                className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            >
                                                <HiOutlineCog6Tooth className="w-4 h-4 text-gray-400 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                                <span>Cài đặt tài khoản</span>
                                            </Link>
                                            <Link
                                                to="/pricing"
                                                onClick={closeDropdown}
                                                className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            >
                                                <HiOutlineCreditCard className="w-4 h-4 text-gray-400 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                                <span>Nâng cấp gói</span>
                                            </Link>
                                        </div>

                                        <div className="pt-1 mt-1 border-t border-gray-100 dark:border-slate-800/60">
                                            <button
                                                onClick={() => {
                                                    closeDropdown();
                                                    handleLogout();
                                                }}
                                                className="group flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                            >
                                                <HiOutlineArrowRightOnRectangle className="w-4 h-4 text-rose-500 dark:text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                                                <span>Đăng xuất</span>
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
                                    className="hidden lg:inline-flex items-center justify-center px-4 xl:px-5 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 transition-all hover:shadow-blue-500/25 hover:shadow-lg active:scale-95"
                                >
                                    Dùng thử miễn phí
                                </Link>
                                <Link
                                    to="/login"
                                    onMouseEnter={handleCtaEnter}
                                    onMouseLeave={handleCtaLeave}
                                    className="hidden h-10 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-neutral-100 dark:bg-slate-800 px-4 text-sm font-semibold leading-normal text-neutral-700 dark:text-gray-200 transition-colors hover:bg-neutral-200 dark:hover:bg-slate-700 active:scale-95 lg:flex"
                                >
                                    Đăng nhập
                                </Link>
                            </>
                        )}

                        {/* Mobile & Tablet menu toggle button */}
                        <button
                            type="button"
                            onClick={toggleMobileMenu}
                            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
                            className="ml-1 lg:hidden inline-flex items-center justify-center p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800/80 focus:outline-none transition-all active:scale-95 border border-gray-200/50 dark:border-slate-800"
                        >
                            {!mobileMenuOpen ? (
                                <HiBars3 className="h-6 w-6" />
                            ) : (
                                <HiXMark className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile & Tablet Drawer Menu */}
                {mobileMenuOpen && (
                    <div
                        ref={mobileMenuRef}
                        className="lg:hidden border-t border-gray-100 dark:border-slate-800/80 bg-white/95 dark:bg-[#070d18]/95 backdrop-blur-xl px-3.5 sm:px-6 pt-3 pb-5 shadow-2xl shadow-blue-900/10 dark:shadow-black/70 overflow-hidden rounded-b-2xl"
                    >
                        {/* Navigation Cards List */}
                        <div className="space-y-1.5 py-1">
                            {NAV_ITEMS.map((item) => {
                                const isActive = location.pathname === item.path;
                                const IconComponent = item.icon || HiOutlineGlobeAlt;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        data-mobile-item
                                        onClick={() => closeMobileMenu()}
                                        className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                                            isActive
                                                ? 'bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 shadow-sm'
                                                : 'hover:bg-gray-50/80 dark:hover:bg-slate-800/40 border border-transparent hover:border-gray-200/50 dark:hover:border-slate-800/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                                                    isActive
                                                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                                                        : 'bg-gray-100 dark:bg-slate-800/90 text-gray-500 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                                }`}
                                            >
                                                <IconComponent className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p
                                                    className={`text-sm font-semibold truncate ${
                                                        isActive
                                                            ? 'text-blue-600 dark:text-blue-400 font-bold'
                                                            : 'text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                                    }`}
                                                >
                                                    {item.label}
                                                </p>
                                                {item.desc && (
                                                    <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                                                        {item.desc}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center pl-2 flex-shrink-0">
                                            {isActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/30">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                                                    Đang xem
                                                </span>
                                            ) : (
                                                <HiChevronRight className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* User or Guest Action Section */}
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800/80">
                            {isLoggedIn ? (
                                /* Logged-in profile preview card & actions */
                                <div data-mobile-item className="space-y-2.5">
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/80 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800/60">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="w-10 h-10 rounded-full object-cover border-2 border-blue-600 shadow-sm flex-shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                        {user.isSuperAdmin ? 'Super Admin' : 'Thành viên'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => closeMobileMenu(() => handleLogout())}
                                            className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition active:scale-95"
                                            title="Đăng xuất"
                                        >
                                            <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Link
                                            to={user.isSuperAdmin ? '/super-admin/dashboard' : '/dashboard'}
                                            onClick={() => closeMobileMenu()}
                                            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition"
                                        >
                                            <HiOutlineSquares2X2 className="w-4 h-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                        <Link
                                            to="/profile"
                                            onClick={() => closeMobileMenu()}
                                            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold text-xs active:scale-95 transition"
                                        >
                                            <HiOutlineCog6Tooth className="w-4 h-4" />
                                            <span>Tài khoản</span>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                /* Guest action buttons: 2-column grid */
                                <div data-mobile-item className="grid grid-cols-2 gap-2.5 pt-1">
                                    <Link
                                        to="/login"
                                        onClick={() => closeMobileMenu()}
                                        className="flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 rounded-xl font-semibold text-sm border border-gray-200 dark:border-slate-700/80 bg-gray-50/80 dark:bg-slate-800/80 text-gray-700 dark:text-gray-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-95"
                                    >
                                        <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
                                        <span>Đăng nhập</span>
                                    </Link>
                                    <Link
                                        to="/request-demo"
                                        onClick={() => closeMobileMenu()}
                                        className="flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_auto] hover:bg-right shadow-lg shadow-blue-500/25 active:scale-95 transition-all text-center"
                                    >
                                        <span>Dùng thử miễn phí</span>
                                        <HiChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            )}

                            {/* Trust & Hotline badge */}
                            <div data-mobile-item className="mt-3.5 pt-2.5 border-t border-gray-100/80 dark:border-slate-800/50 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 px-1">
                                <div className="flex items-center gap-1.5">
                                    <HiOutlineShieldCheck className="w-4 h-4 text-emerald-500" />
                                    <span className="font-medium text-gray-600 dark:text-slate-300">An ninh chuẩn ISO</span>
                                </div>
                                <a
                                    href="tel:0905441263"
                                    className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    <HiOutlinePhone className="w-3.5 h-3.5" />
                                    <span>Hotline: 0905 441 263</span>
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
