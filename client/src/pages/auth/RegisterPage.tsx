import React, { useState, useRef, useLayoutEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    HiOutlineEnvelope,
    HiOutlineLockClosed,
    HiOutlineUser,
    HiOutlineBuildingOffice2,
    HiEye,
    HiEyeSlash,
    HiCheck,
    HiOutlineShieldCheck,
    HiOutlineExclamationCircle,
    HiShieldCheck,
    HiSparkles,
    HiArrowRight,
    HiCpuChip
} from 'react-icons/hi2';
import { gsap } from 'gsap';
import ThemeToggle from '@/components/ThemeToggle';

const RegisterPage = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        companyName: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [generalError, setGeneralError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'portal'>('idle');
    const [progress, setProgress] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const pulseRingRef = useRef<HTMLDivElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);

    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000'
        : 'https://api.aegism.online';

    // GSAP Entry & Ambient Floating Animation
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            // Ambient background orbs
            gsap.to('.orb-1', {
                x: -50,
                y: 45,
                scale: 1.15,
                duration: 8,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
            gsap.to('.orb-2', {
                x: 60,
                y: -50,
                scale: 1.1,
                duration: 9,
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
            .from('.register-left-stagger', {
                opacity: 0,
                x: -30,
                stagger: 0.08,
                duration: 0.6,
            }, '-=0.6')
            // Right column form inputs stagger
            .from('.register-right-stagger', {
                opacity: 0,
                y: 18,
                stagger: 0.05,
                duration: 0.5,
            }, '-=0.5');

            // Radar sweep
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

    // Revert button back to normal
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
    const executeMorphingToDashboard = (dest: string) => {
        setStatus('success');

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
        if (generalError) setGeneralError('');
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.fullname.trim()) newErrors.fullname = "Họ và tên là bắt buộc.";
        if (!formData.companyName.trim()) newErrors.companyName = "Tên công ty / tổ chức là bắt buộc.";

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) newErrors.email = "Email là bắt buộc.";
        else if (!emailRegex.test(formData.email)) newErrors.email = "Email không đúng định dạng.";

        const passwordRegex = /^(?=.*[A-Z])(?=.*[\W_]).{6,}$/;
        if (!formData.password) newErrors.password = "Mật khẩu là bắt buộc.";
        else if (!passwordRegex.test(formData.password)) {
            newErrors.password = "Tối thiểu 6 ký tự, gồm 1 chữ hoa và 1 ký tự đặc biệt.";
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status !== 'idle') return;

        if (!validateForm()) {
            triggerShake();
            return;
        }

        setGeneralError('');

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
            const response = await axios.post(`${API_URL}/api/auth/register`, {
                fullName: formData.fullname,
                companyName: formData.companyName,
                email: formData.email,
                password: formData.password
            });

            const data = response.data;

            // 1. Lưu Token & User vào LocalStorage
            if (data.accessToken) {
                localStorage.setItem('accessToken', data.accessToken);
            }
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            // 2. Thiết lập gói dịch vụ mặc định Starter cho Tenant mới
            if (data.user?.tenant?.subscriptionPlan) {
                localStorage.setItem('userPlan', data.user.tenant.subscriptionPlan.toLowerCase());
            } else {
                localStorage.setItem('userPlan', 'starter');
            }

            // 3. Kích hoạt Morphing Button và chuyển thẳng vào Dashboard
            const targetUrl = data.user?.isSuperAdmin ? '/super-admin/dashboard' : '/dashboard';
            executeMorphingToDashboard(targetUrl);

        } catch (error: any) {
            console.error("Lỗi đăng ký:", error);
            revertButton();
            triggerShake();

            if (error.response && error.response.status === 409) {
                setErrors(prev => ({ ...prev, email: "Email này đã được sử dụng trên hệ thống." }));
            } else {
                setGeneralError(error.response?.data?.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin kết nối.");
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
            <div className="orb-1 absolute -top-40 -right-40 w-[550px] h-[550px] bg-gradient-to-bl from-cyan-600/25 via-blue-600/20 to-transparent rounded-full blur-[140px] pointer-events-none" />
            <div className="orb-2 absolute -bottom-48 -left-48 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/20 via-blue-700/25 to-transparent rounded-full blur-[160px] pointer-events-none" />

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
                className="relative w-full max-w-5xl rounded-[28px] p-[1px] bg-gradient-to-br from-cyan-500/30 via-slate-300/60 to-blue-500/30 dark:from-cyan-500/40 dark:via-slate-800/60 dark:to-blue-500/30 shadow-2xl shadow-cyan-900/10 dark:shadow-[0_0_80px_rgba(6,182,212,0.15)] z-10 my-6"
            >
                <div className="w-full bg-white/95 dark:bg-[#0b1222]/90 backdrop-blur-3xl rounded-[27px] overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200/80 dark:border-transparent">
                    
                    {/* CỘT TRÁI: BRANDING & PERKS (lg:col-span-5) */}
                    <div className="lg:col-span-5 relative p-8 sm:p-10 lg:p-11 bg-gradient-to-b from-[#0e172a] via-[#090f1d] to-[#040711] border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between overflow-hidden">
                        
                        <div className="absolute -top-10 -left-10 w-44 h-44 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

                        <div className="relative z-10">
                            {/* Logo AEGISM */}
                            <div className="register-left-stagger flex items-center justify-between">
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

                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                                    <HiSparkles className="w-3.5 h-3.5" />
                                    14 NGÀY THỬ NGHIỆM
                                </div>
                            </div>

                            {/* Heading */}
                            <div className="mt-8 lg:mt-12">
                                <div className="register-left-stagger inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
                                    <HiOutlineShieldCheck className="w-4 h-4 text-cyan-400" />
                                    Khởi tạo Workspace Tổ chức
                                </div>

                                <h2 className="register-left-stagger text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                                    Nâng tầm an ninh, <br />
                                    <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                                        Khởi đầu thần tốc.
                                    </span>
                                </h2>

                                <p className="register-left-stagger mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
                                    Thiết lập không gian an ninh số cho tổ chức của bạn chỉ trong 30 giây. Trải nghiệm đầy đủ tính năng tuần tra mã QR và quản trị nhân sự.
                                </p>
                            </div>

                            {/* PROVISIONING RADAR CARD */}
                            <div className="register-left-stagger mt-7 p-4 rounded-2xl bg-[#070c18]/80 border border-slate-800/80 relative overflow-hidden">
                                <div className="flex items-center gap-4">
                                    <div className="relative w-16 h-16 rounded-full border border-emerald-500/40 bg-emerald-950/20 flex items-center justify-center flex-shrink-0">
                                        <div className="absolute inset-2 rounded-full border border-emerald-500/20" />
                                        <div className="radar-sweep absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(16,185,129,0.4)_360deg)] pointer-events-none" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] z-10" />
                                        <span className="absolute bottom-3 right-4 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-200">Aegism Auto-Provisioning</span>
                                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">READY</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1">Cấu hình sẵn quyền Tenant Admin & Dashboard</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full w-[100%]" />
                                            </div>
                                            <span className="text-[10px] font-mono text-emerald-400">100% Instant</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3 Highlights */}
                            <div className="register-left-stagger mt-4 space-y-2">
                                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
                                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                        <HiShieldCheck className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-300">Không yêu cầu thẻ tín dụng</span>
                                </div>
                                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
                                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                                        <HiCpuChip className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-300">Dữ liệu Tenant cách ly tuyệt đối</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Info */}
                        <div className="register-left-stagger mt-8 pt-5 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400">
                            <span>© {new Date().getFullYear()} AEGISM Inc.</span>
                            <span className="font-mono text-slate-500">ISO/IEC 27001</span>
                        </div>
                    </div>

                    {/* CỘT PHẢI: FORM ĐĂNG KÝ (lg:col-span-7) */}
                    <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center relative bg-slate-50/50 dark:bg-[#0b1222]/60 transition-colors duration-200">
                        <div className="max-w-md w-full mx-auto">
                            
                            {/* Header */}
                            <div className="register-right-stagger">
                                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-blue-600 dark:text-cyan-400 uppercase mb-1">
                                    <HiSparkles className="w-3.5 h-3.5" />
                                    Đăng Ký Tổ Chức Mới
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                                    Tạo tài khoản AEGISM
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                                    Điền thông tin để bắt đầu trải nghiệm hệ thống an ninh thông minh.
                                </p>
                            </div>

                            {/* General Error Alert */}
                            {generalError && (
                                <div className="register-right-stagger mt-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-300 text-xs sm:text-sm flex items-start gap-2.5 shadow-lg shadow-red-950/20">
                                    <HiOutlineExclamationCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <span className="font-bold">Lỗi:</span> {generalError}
                                    </div>
                                </div>
                            )}

                            <form className="mt-6 space-y-3.5" onSubmit={handleSubmit}>
                                {/* Full Name */}
                                <div className="register-right-stagger">
                                    <label
                                        htmlFor="fullname"
                                        className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                                    >
                                        Họ và Tên
                                    </label>
                                    <div className="relative rounded-xl shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                            <HiOutlineUser className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="fullname"
                                            name="fullname"
                                            type="text"
                                            required
                                            disabled={status !== 'idle'}
                                            value={formData.fullname}
                                            onChange={handleChange}
                                            placeholder="Nguyễn Văn A"
                                            className={`block w-full pl-11 pr-4 py-2.5 bg-white dark:bg-[#070d1a]/80 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all text-sm disabled:opacity-50 ${
                                                errors.fullname
                                                    ? 'border-red-500 focus:ring-red-500/20'
                                                    : 'border-slate-300 dark:border-slate-700/70 focus:border-cyan-500 focus:ring-cyan-500/20'
                                            }`}
                                        />
                                    </div>
                                    {errors.fullname && (
                                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.fullname}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="register-right-stagger">
                                    <label
                                        htmlFor="email"
                                        className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                                    >
                                        Địa chỉ Email Doanh nghiệp
                                    </label>
                                    <div className="relative rounded-xl shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                            <HiOutlineEnvelope className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            disabled={status !== 'idle'}
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="admin@company.com"
                                            className={`block w-full pl-11 pr-4 py-2.5 bg-white dark:bg-[#070d1a]/80 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all text-sm disabled:opacity-50 ${
                                                errors.email
                                                    ? 'border-red-500 focus:ring-red-500/20'
                                                    : 'border-slate-300 dark:border-slate-700/70 focus:border-cyan-500 focus:ring-cyan-500/20'
                                            }`}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.email}</p>
                                    )}
                                </div>

                                {/* Company Name */}
                                <div className="register-right-stagger">
                                    <label
                                        htmlFor="companyName"
                                        className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                                    >
                                        Tên Doanh nghiệp / Tổ chức
                                    </label>
                                    <div className="relative rounded-xl shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                            <HiOutlineBuildingOffice2 className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="companyName"
                                            name="companyName"
                                            type="text"
                                            required
                                            disabled={status !== 'idle'}
                                            value={formData.companyName}
                                            onChange={handleChange}
                                            placeholder="Tập đoàn An ninh ABC"
                                            className={`block w-full pl-11 pr-4 py-2.5 bg-white dark:bg-[#070d1a]/80 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all text-sm disabled:opacity-50 ${
                                                errors.companyName
                                                    ? 'border-red-500 focus:ring-red-500/20'
                                                    : 'border-slate-300 dark:border-slate-700/70 focus:border-cyan-500 focus:ring-cyan-500/20'
                                            }`}
                                        />
                                    </div>
                                    {errors.companyName && (
                                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.companyName}</p>
                                    )}
                                </div>

                                {/* Password Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Password */}
                                    <div className="register-right-stagger">
                                        <label
                                            htmlFor="password"
                                            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                                        >
                                            Mật khẩu
                                        </label>
                                        <div className="relative rounded-xl shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                <HiOutlineLockClosed className="w-5 h-5" />
                                            </div>
                                            <input
                                                id="password"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                disabled={status !== 'idle'}
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                className={`block w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#070d1a]/80 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all text-sm disabled:opacity-50 ${
                                                    errors.password
                                                        ? 'border-red-500 focus:ring-red-500/20'
                                                        : 'border-slate-300 dark:border-slate-700/70 focus:border-cyan-500 focus:ring-cyan-500/20'
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                tabIndex={-1}
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                                            >
                                                {showPassword ? (
                                                    <HiEyeSlash className="w-4 h-4" />
                                                ) : (
                                                    <HiEye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="register-right-stagger">
                                        <label
                                            htmlFor="confirmPassword"
                                            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                                        >
                                            Xác nhận Mật khẩu
                                        </label>
                                        <div className="relative rounded-xl shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                <HiOutlineLockClosed className="w-5 h-5" />
                                            </div>
                                            <input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                required
                                                disabled={status !== 'idle'}
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                className={`block w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#070d1a]/80 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all text-sm disabled:opacity-50 ${
                                                    errors.confirmPassword
                                                        ? 'border-red-500 focus:ring-red-500/20'
                                                        : 'border-slate-300 dark:border-slate-700/70 focus:border-cyan-500 focus:ring-cyan-500/20'
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                tabIndex={-1}
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                                            >
                                                {showConfirmPassword ? (
                                                    <HiEyeSlash className="w-4 h-4" />
                                                ) : (
                                                    <HiEye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Password validation feedback */}
                                {(errors.password || errors.confirmPassword) ? (
                                    <p className="text-xs text-red-500 dark:text-red-400">
                                        {errors.password || errors.confirmPassword}
                                    </p>
                                ) : (
                                    <p className="register-right-stagger text-[11px] text-slate-500 dark:text-slate-400">
                                        Tối thiểu 6 ký tự, gồm ít nhất 1 chữ hoa và 1 ký tự đặc biệt.
                                    </p>
                                )}

                                {/* Terms agreement */}
                                <div className="register-right-stagger pt-1 text-center">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Bằng việc đăng ký, bạn đồng ý với{' '}
                                        <Link to="/terms" className="text-blue-600 dark:text-cyan-400 hover:text-blue-500 dark:hover:text-cyan-300 underline underline-offset-2">
                                            Điều khoản
                                        </Link>{' '}
                                        và{' '}
                                        <Link to="/policy" className="text-blue-600 dark:text-cyan-400 hover:text-blue-500 dark:hover:text-cyan-300 underline underline-offset-2">
                                            Chính sách bảo mật
                                        </Link>{' '}
                                        của AEGISM.
                                    </p>
                                </div>

                                {/* SPECTACULAR MORPHING SUBMIT BUTTON */}
                                <div className="register-right-stagger pt-3 flex justify-center relative">
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
                                                : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-cyan-500/25 active:scale-[0.99] cursor-pointer'
                                        }`}
                                    >
                                        {status === 'idle' && (
                                            <div className="flex items-center gap-2 whitespace-nowrap px-6">
                                                <span>Khởi tạo Workspace Doanh nghiệp</span>
                                                <HiArrowRight className="w-4 h-4" />
                                            </div>
                                        )}

                                        {status === 'loading' && (
                                            <div className="flex items-center justify-center">
                                                <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                            </div>
                                        )}

                                        {status === 'success' && (
                                            <div className="flex items-center justify-center text-white">
                                                <HiCheck className="w-7 h-7 stroke-[3]" />
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </form>

                            {/* Link to Login */}
                            <div className="register-right-stagger mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 text-center">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Đã có tài khoản doanh nghiệp?{' '}
                                    <Link
                                        to="/login"
                                        className="font-bold text-blue-600 dark:text-cyan-400 hover:text-blue-500 dark:hover:text-cyan-300 underline underline-offset-4 decoration-blue-500/40 dark:decoration-cyan-500/40 transition-colors"
                                    >
                                        Đăng nhập ngay
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
                    <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-cyan-600/30 to-emerald-500/30 rounded-full blur-[120px] pointer-events-none animate-pulse" />

                    <div className="relative z-10 max-w-md w-full text-center flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-[0_0_50px_rgba(16,185,129,0.7)] mb-6 flex items-center justify-center animate-bounce">
                            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                                <HiCheck className="w-10 h-10 text-emerald-400 stroke-[3]" />
                            </div>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            Khởi tạo Workspace Thành công!
                        </h2>
                        <p className="mt-2 text-sm text-slate-300 font-medium">
                            Chào mừng <span className="text-cyan-300 font-bold">{formData.companyName}</span> gia nhập hệ sinh thái AEGISM.
                        </p>

                        <p className="mt-4 text-xs font-mono text-cyan-400 tracking-wider uppercase">
                            Cấu hình đặc quyền Tenant Admin • Đang nạp Dashboard...
                        </p>

                        <div className="w-full mt-4 bg-slate-900/90 rounded-full h-2.5 p-0.5 border border-slate-700/80 shadow-inner overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 rounded-full transition-all duration-75 shadow-[0_0_15px_#10b981]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <div className="mt-2 text-right w-full">
                            <span className="font-mono text-xs font-bold text-slate-400">{progress}%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegisterPage;