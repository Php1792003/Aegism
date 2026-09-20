import React, { useState, useRef, useLayoutEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import {
    HiOutlineEnvelope,
    HiOutlineLockClosed,
    HiEye,
    HiEyeSlash,
    HiCheck,
    HiOutlineShieldCheck,
    HiOutlineExclamationCircle,
    HiXMark,
    HiShieldCheck,
    HiCpuChip,
    HiBolt,
    HiArrowRight,
    HiSparkles
} from 'react-icons/hi2';
import { gsap } from 'gsap';
import ThemeToggle from '@/components/ThemeToggle';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'portal'>('idle');
    const [userName, setUserName] = useState('');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [showSuspendedToast, setShowSuspendedToast] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const pulseRingRef = useRef<HTMLDivElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000'
        : 'https://api.aegism.online';

    // GSAP Entry & Ambient Floating Animation
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            // Ambient background orbs float continuously
            gsap.to('.orb-1', {
                x: 60,
                y: -40,
                scale: 1.15,
                duration: 7,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
            gsap.to('.orb-2', {
                x: -50,
                y: 50,
                scale: 1.1,
                duration: 9,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
            gsap.to('.orb-3', {
                x: 30,
                y: 30,
                scale: 1.2,
                duration: 8,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });

            // Card entrance
            tl.from(cardRef.current, {
                opacity: 0,
                y: 40,
                scale: 0.96,
                duration: 0.9,
            })
            // Left column stagger
            .from('.login-left-stagger', {
                opacity: 0,
                x: -30,
                stagger: 0.08,
                duration: 0.6,
            }, '-=0.6')
            // Right column form inputs stagger
            .from('.login-right-stagger', {
                opacity: 0,
                y: 20,
                stagger: 0.06,
                duration: 0.5,
            }, '-=0.5');

            // Radar sweep animation
            gsap.to('.radar-sweep', {
                rotate: 360,
                duration: 4,
                repeat: -1,
                ease: 'none',
                transformOrigin: 'center center'
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    // Haptic shake on error
    const triggerShake = () => {
        if (!cardRef.current) return;
        gsap.timeline()
            .to(cardRef.current, { x: -12, duration: 0.05 })
            .to(cardRef.current, { x: 12, duration: 0.05 })
            .to(cardRef.current, { x: -8, duration: 0.05 })
            .to(cardRef.current, { x: 8, duration: 0.05 })
            .to(cardRef.current, { x: -4, duration: 0.05 })
            .to(cardRef.current, { x: 4, duration: 0.05 })
            .to(cardRef.current, { x: 0, duration: 0.05 });
    };

    // Revert button back to normal if error occurs
    const revertButton = () => {
        setStatus('idle');
        if (btnRef.current) {
            gsap.to(btnRef.current, {
                width: '100%',
                borderRadius: '16px',
                backgroundColor: '',
                boxShadow: '',
                duration: 0.35,
                ease: 'power3.out'
            });
        }
    };

    // Morphing Button -> Portal -> Dashboard sequence
    const executeMorphingToDashboard = (dest: string, displayName: string) => {
        setStatus('success');
        setUserName(displayName);

        if (!btnRef.current) {
            navigate(dest);
            return;
        }

        const tl = gsap.timeline();

        // 1. Button turns into glowing emerald pill
        tl.to(btnRef.current, {
            width: '60px',
            height: '60px',
            borderRadius: '9999px',
            backgroundColor: '#10b981',
            boxShadow: '0 0 45px rgba(16, 185, 129, 0.8), 0 0 90px rgba(16, 185, 129, 0.4)',
            duration: 0.35,
            ease: 'back.out(1.5)'
        });

        // 2. Shockwave pulse ring expands from button
        if (pulseRingRef.current) {
            tl.fromTo(pulseRingRef.current, 
                { scale: 1, opacity: 0.9 },
                { scale: 3.5, opacity: 0, duration: 0.6, ease: 'power2.out' },
                '-=0.2'
            );
        }

        // 3. Smooth morph into Portal Overlay
        tl.call(() => {
            setStatus('portal');
        })
        .fromTo(portalRef.current, 
            { opacity: 0, scale: 0.85, filter: 'blur(10px)' },
            { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out' }
        );

        // 4. Futuristic progress bar loader animation
        const prog = { val: 0 };
        tl.to(prog, {
            val: 100,
            duration: 1.1,
            ease: 'power2.inOut',
            onUpdate: () => {
                setProgress(Math.round(prog.val));
            }
        });

        // 5. Final transition into Dashboard
        tl.to(portalRef.current, {
            opacity: 0,
            scale: 1.05,
            duration: 0.35,
            ease: 'power2.in',
            onComplete: () => {
                navigate(dest);
            }
        });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status !== 'idle') return;

        setError('');

        // Step 1: Morph button into compact circular spinner
        setStatus('loading');
        if (btnRef.current) {
            gsap.to(btnRef.current, {
                width: '52px',
                height: '52px',
                borderRadius: '9999px',
                duration: 0.3,
                ease: 'power2.inOut'
            });
        }

        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, {
                email,
                password
            });

            const data = response.data;

            // 1. Lưu Token & User vào LocalStorage
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('user', JSON.stringify(data.user));

            // 2. Lưu thông tin gói dịch vụ (Tenant Plan)
            if (data.user?.tenant?.subscriptionPlan) {
                localStorage.setItem('userPlan', data.user.tenant.subscriptionPlan.toLowerCase());
            } else {
                localStorage.setItem('userPlan', 'starter');
            }

            // 3. Kích hoạt hiệu ứng Morphing Button và tải vào Dashboard
            const targetUrl = data.user?.isSuperAdmin ? '/super-admin/dashboard' : '/dashboard';
            const name = data.user?.fullName || data.user?.name || email.split('@')[0];
            executeMorphingToDashboard(targetUrl, name);

        } catch (err: any) {
            console.error(err);
            revertButton();
            triggerShake();

            if (err.response && err.response.status === 401) {
                setError('Email hoặc mật khẩu không chính xác.');
            } else if (err.response && err.response.status === 403 &&
                (err.response.data?.message === 'USER_SUSPENDED' || err.response.data?.message === 'TENANT_SUSPENDED')) {
                setError('Vi phạm chính sách bảo mật của hệ thống nên đã tạm khoá tài khoản vui lòng liên hệ admin để được hỗ trợ.');
                setShowSuspendedToast(true);
            } else {
                setError(err.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ, vui lòng thử lại.');
            }
        }
    };

    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-slate-100 dark:bg-[#030712] text-slate-800 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans select-none transition-colors duration-300"
        >
            {/* FLOATING THEME TOGGLE AT TOP RIGHT */}
            <div className="absolute top-5 right-5 z-30">
                <ThemeToggle showLabel />
            </div>

            {/* VIVID DYNAMIC LIVING BACKGROUND ORBS */}
            <div className="orb-1 absolute -top-40 -left-40 w-[550px] h-[550px] bg-gradient-to-br from-blue-600/25 via-indigo-600/20 to-transparent rounded-full blur-[140px] pointer-events-none" />
            <div className="orb-2 absolute -bottom-48 -right-48 w-[600px] h-[600px] bg-gradient-to-tl from-cyan-500/20 via-blue-700/25 to-transparent rounded-full blur-[160px] pointer-events-none" />
            <div className="orb-3 absolute top-1/3 left-2/3 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-indigo-500/15 rounded-full blur-[130px] pointer-events-none" />

            {/* CYBER BACKGROUND HIGH-TECH GRID OVERLAY */}
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, #38bdf8 1px, transparent 1px),
                        linear-gradient(to bottom, #38bdf8 1px, transparent 1px)
                    `,
                    backgroundSize: '48px 48px'
                }}
            />

            {/* IRIDESCENT BORDER CARD WRAPPER */}
            <div
                ref={cardRef}
                className="relative w-full max-w-5xl rounded-[28px] p-[1px] bg-gradient-to-br from-blue-500/30 via-slate-300/60 to-cyan-500/30 dark:from-blue-500/40 dark:via-slate-800/60 dark:to-cyan-500/30 shadow-2xl shadow-blue-900/10 dark:shadow-[0_0_80px_rgba(14,165,233,0.15)] z-10 my-6"
            >
                <div className="w-full bg-white/95 dark:bg-[#0b1222]/90 backdrop-blur-3xl rounded-[27px] overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200/80 dark:border-transparent">
                    
                    {/* CỘT TRÁI: HI-TECH BRANDING & RADAR SECURITY HUB (lg:col-span-5) */}
                    <div className="lg:col-span-5 relative p-8 sm:p-10 lg:p-11 bg-gradient-to-b from-[#0e172a] via-[#090f1d] to-[#040711] border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between overflow-hidden">
                        
                        {/* Glow accent */}
                        <div className="absolute -top-10 -left-10 w-44 h-44 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

                        <div className="relative z-10">
                            {/* Logo AEGISM */}
                            <div className="login-left-stagger flex items-center justify-between">
                                <Link to="/" className="inline-flex items-center group">
                                    <img
                                        src="/img/aegism_logo_mini.png"
                                        alt="AEGISM"
                                        className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_2px_8px_rgba(56,189,248,0.3)]"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </Link>

                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                    SHIELD v2.4
                                </div>
                            </div>

                            {/* Section Title */}
                            <div className="mt-8 lg:mt-12">
                                <div className="login-left-stagger inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
                                    <HiOutlineShieldCheck className="w-4 h-4 text-cyan-400" />
                                    Nền tảng An ninh Số Doanh nghiệp
                                </div>

                                <h2 className="login-left-stagger text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                                    Quản trị tập trung, <br />
                                    <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
                                        Bảo vệ toàn diện.
                                    </span>
                                </h2>

                                <p className="login-left-stagger mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
                                    Hệ thống giám sát phân tán, tuần tra mã QR chống giả mạo và phân tích rủi ro an ninh theo thời gian thực.
                                </p>
                            </div>

                            {/* HI-TECH RADAR & TELEMETRY VISUALIZATION */}
                            <div className="login-left-stagger mt-7 p-4 rounded-2xl bg-[#070c18]/80 border border-slate-800/80 relative overflow-hidden">
                                <div className="flex items-center gap-4">
                                    {/* Animated Radar Circle */}
                                    <div className="relative w-16 h-16 rounded-full border border-cyan-500/40 bg-cyan-950/20 flex items-center justify-center flex-shrink-0">
                                        {/* Radar rings */}
                                        <div className="absolute inset-2 rounded-full border border-cyan-500/20" />
                                        <div className="absolute inset-4 rounded-full border border-cyan-500/15" />
                                        {/* Rotating sweep line */}
                                        <div className="radar-sweep absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(6,182,212,0.4)_360deg)] pointer-events-none" />
                                        {/* Center dot */}
                                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8] z-10" />
                                        {/* Blip 1 */}
                                        <span className="absolute top-3 left-4 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-200">Aegism Patrol Telemetry</span>
                                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">LIVE</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1">12 Trạm giám sát tuần tra đang hoạt động</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full w-[94%]" />
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-400">99.98%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3 Tech Badges */}
                            <div className="login-left-stagger mt-4 space-y-2">
                                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
                                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                                        <HiShieldCheck className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-300">Xác thực Zero-Trust Đa lớp</span>
                                </div>
                                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
                                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                                        <HiCpuChip className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-300">Mã hóa dữ liệu 256-bit AES</span>
                                </div>
                            </div>
                        </div>

                        {/* Node status bottom */}
                        <div className="login-left-stagger mt-8 pt-5 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="font-mono">Node VN-HCM #01</span>
                            </div>
                            <span className="font-mono text-slate-500">Latency: 14ms</span>
                        </div>
                    </div>

                    {/* CỘT PHẢI: FORM ĐĂNG NHẬP (lg:col-span-7) */}
                    <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-center relative bg-slate-50/50 dark:bg-[#0b1222]/60 transition-colors duration-200">
                        <div className="max-w-md w-full mx-auto">
                            
                            {/* Form Header */}
                            <div className="login-right-stagger">
                                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-blue-600 dark:text-cyan-400 uppercase mb-1">
                                    <HiSparkles className="w-3.5 h-3.5" />
                                    Cổng Đăng Nhập Doanh Nghiệp
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                                    Đăng nhập hệ thống
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                                    Chào mừng bạn trở lại. Vui lòng nhập thông tin xác thực.
                                </p>
                            </div>

                            {/* Error Alert Box */}
                            {error && (
                                <div className="login-right-stagger mt-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-300 text-xs sm:text-sm flex items-start gap-2.5 shadow-lg shadow-red-950/20">
                                    <HiOutlineExclamationCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <span className="font-bold">Lỗi xác thực:</span> {error}
                                    </div>
                                </div>
                            )}

                            <form className="mt-7 space-y-4" onSubmit={handleLogin}>
                                {/* Email Input */}
                                <div className="login-right-stagger">
                                    <label
                                        htmlFor="email"
                                        className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                                    >
                                        Địa chỉ Email
                                    </label>
                                    <div className="relative rounded-xl shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                            <HiOutlineEnvelope className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            disabled={status !== 'idle'}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="admin@aegism.online"
                                            className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-[#070d1a]/80 border border-slate-300 dark:border-slate-700/70 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div className="login-right-stagger">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label
                                            htmlFor="password"
                                            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                                        >
                                            Mật khẩu
                                        </label>
                                        <Link
                                            to="/forgot-password"
                                            className="text-xs font-medium text-blue-600 dark:text-cyan-400 hover:text-blue-500 dark:hover:text-cyan-300 transition-colors"
                                        >
                                            Quên mật khẩu?
                                        </Link>
                                    </div>
                                    <div className="relative rounded-xl shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                            <HiOutlineLockClosed className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="password"
                                            type={showPass ? 'text' : 'password'}
                                            required
                                            disabled={status !== 'idle'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="block w-full pl-11 pr-11 py-3 bg-white dark:bg-[#070d1a]/80 border border-slate-300 dark:border-slate-700/70 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm disabled:opacity-50"
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() => setShowPass(!showPass)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                                        >
                                            {showPass ? (
                                                <HiEyeSlash className="w-5 h-5" />
                                            ) : (
                                                <HiEye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Remember Me */}
                                <div className="login-right-stagger flex items-center pt-1">
                                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="w-4 h-4 rounded bg-white dark:bg-[#070d1a] border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                                        />
                                        <span>Ghi nhớ thiết bị này trong 30 ngày</span>
                                    </label>
                                </div>

                                {/* SPECTACULAR MORPHING SUBMIT BUTTON */}
                                <div className="login-right-stagger pt-4 flex justify-center relative">
                                    {/* Expanding shockwave ring when success */}
                                    <div
                                        ref={pulseRingRef}
                                        className="absolute w-14 h-14 rounded-full border-2 border-emerald-400 pointer-events-none opacity-0"
                                    />

                                    <button
                                        ref={btnRef}
                                        type="submit"
                                        disabled={status !== 'idle'}
                                        className={`relative w-full h-12 flex items-center justify-center rounded-2xl font-bold text-sm tracking-wide text-white transition-colors duration-200 overflow-hidden shadow-lg ${
                                            status === 'success'
                                                ? 'bg-emerald-500'
                                                : status === 'loading'
                                                ? 'bg-blue-600/90 shadow-blue-500/30 cursor-wait'
                                                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-500/25 active:scale-[0.99] cursor-pointer'
                                        }`}
                                    >
                                        {/* State 1: Normal idle */}
                                        {status === 'idle' && (
                                            <div className="flex items-center gap-2 whitespace-nowrap px-6">
                                                <span>Đăng nhập hệ thống</span>
                                                <HiArrowRight className="w-4 h-4" />
                                            </div>
                                        )}

                                        {/* State 2: Loading circular spinner */}
                                        {status === 'loading' && (
                                            <div className="flex items-center justify-center">
                                                <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                            </div>
                                        )}

                                        {/* State 3: Success tick circle */}
                                        {status === 'success' && (
                                            <div className="flex items-center justify-center text-white">
                                                <HiCheck className="w-7 h-7 stroke-[3]" />
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </form>

                            {/* Register Link */}
                            <div className="login-right-stagger mt-8 pt-5 border-t border-slate-200 dark:border-slate-800/80 text-center">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Chưa có tài khoản doanh nghiệp?{' '}
                                    <Link
                                        to="/register"
                                        className="font-bold text-blue-600 dark:text-cyan-400 hover:text-blue-500 dark:hover:text-cyan-300 underline underline-offset-4 decoration-blue-500/40 dark:decoration-cyan-500/40 transition-colors"
                                    >
                                        Khởi tạo tài khoản mới
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FULLSCREEN HI-TECH PORTAL TRANSITION OVERLAY */}
            {status === 'portal' && (
                <div
                    ref={portalRef}
                    className="fixed inset-0 z-50 bg-[#030712]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 select-none"
                >
                    {/* Glowing portal background effect */}
                    <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-blue-600/30 to-emerald-500/30 rounded-full blur-[120px] pointer-events-none animate-pulse" />

                    <div className="relative z-10 max-w-md w-full text-center flex flex-col items-center">
                        {/* Success Icon */}
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-[0_0_50px_rgba(16,185,129,0.7)] mb-6 flex items-center justify-center animate-bounce">
                            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                                <HiCheck className="w-10 h-10 text-emerald-400 stroke-[3]" />
                            </div>
                        </div>

                        {/* Title & Greeting */}
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            Xác thực thành công!
                        </h2>
                        <p className="mt-2 text-sm text-slate-300 font-medium">
                            Chào mừng <span className="text-cyan-300 font-bold">{userName}</span> trở lại hệ thống.
                        </p>

                        {/* Status message */}
                        <p className="mt-4 text-xs font-mono text-cyan-400 tracking-wider uppercase">
                            Khởi chạy AEGISM OS • Đang nạp Bảng Điều Khiển...
                        </p>

                        {/* Futuristic Loading Bar */}
                        <div className="w-full mt-4 bg-slate-900/90 rounded-full h-2.5 p-0.5 border border-slate-700/80 shadow-inner overflow-hidden">
                            <div
                                ref={progressBarRef}
                                className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 rounded-full transition-all duration-75 shadow-[0_0_15px_#38bdf8]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <div className="mt-2 text-right w-full">
                            <span className="font-mono text-xs font-bold text-slate-400">{progress}%</span>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST THÔNG BÁO TÀI KHOẢN BỊ KHÓA */}
            {showSuspendedToast && (
                <div className="fixed bottom-5 right-5 z-50 max-w-md w-full bg-red-950/95 border border-red-800 backdrop-blur-md p-4 rounded-2xl shadow-2xl flex gap-3.5 transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-red-900/50 flex items-center justify-center flex-shrink-0 text-red-400 border border-red-800/50">
                        <HiOutlineExclamationCircle className="w-6 h-6 animate-bounce" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-white font-bold text-sm tracking-wide uppercase">Tài khoản bị khóa</h4>
                        <p className="text-red-200 text-xs mt-1.5 leading-relaxed font-medium">
                            Vi phạm chính sách bảo mật của hệ thống nên đã tạm khoá tài khoản vui lòng liên hệ admin để được hỗ trợ.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowSuspendedToast(false)}
                        className="p-1 rounded-lg text-red-400 hover:text-white hover:bg-red-900/30 transition-colors self-start"
                    >
                        <HiXMark className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default LoginPage;