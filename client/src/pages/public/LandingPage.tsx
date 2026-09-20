import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { IconType } from 'react-icons';
import SEO from '@/components/seo/SEO';
import {
    OrganizationSchema,
    SoftwareApplicationSchema,
    WebSiteSchema,
    FAQSchema,
    BreadcrumbSchema,
} from '@/components/seo/StructuredData';
import {
    HiShieldCheck,
    HiBolt,
    HiCheck,
    HiQrCode,
    HiMap,
    HiChartPie,
    HiOutlineBuildingOffice2,
    HiOutlineDevicePhoneMobile,
    HiOutlineCheckBadge,
    HiOutlineArrowRight,
    HiOutlineSparkles,
    HiOutlineShieldCheck,
    HiOutlineBellAlert,
    HiOutlineMapPin,
    HiChevronDown,
} from 'react-icons/hi2';

gsap.registerPlugin(ScrollTrigger);

/* -------------------------------------------------------------------------- */
/*  DATA                                                                      */
/* -------------------------------------------------------------------------- */

interface Plan {
    planKey: string;
    displayName: string;
    monthlyPrice: number;
    yearlyPrice: number;
    maxUsers: number;
    maxProjects: number;
    maxQRCodes: number;
    features?: string[];
    isActive: boolean;
}

const fallbackPlans: Plan[] = [
    { planKey: 'STARTER', displayName: 'Starter', monthlyPrice: 499000, yearlyPrice: 399000, maxUsers: 10, maxProjects: 3, maxQRCodes: 100, features: ['Hỗ trợ email 24/7'], isActive: true },
    { planKey: 'BUSINESS', displayName: 'Business', monthlyPrice: 999000, yearlyPrice: 799000, maxUsers: 50, maxProjects: 20, maxQRCodes: 500, features: ['Hỗ trợ ưu tiên 24/7', 'Bản đồ số GPS Real-time', 'Xuất báo cáo PDF/Excel'], isActive: true },
    { planKey: 'ENTERPRISE', displayName: 'Enterprise', monthlyPrice: 0, yearlyPrice: 0, maxUsers: 999, maxProjects: 999, maxQRCodes: 9999, features: ['Máy chủ riêng (On-premise)', 'Tùy chỉnh tính năng & SLA', 'Tích hợp API hệ thống', 'Đào tạo nhân sự tận nơi'], isActive: true },
];

const planDescriptions: Record<string, string> = {
    STARTER: 'Cho một mục tiêu đơn lẻ hoặc đội tuần tra vừa và nhỏ.',
    BUSINESS: 'Tiêu chuẩn cho tòa nhà thương mại, chung cư và công ty an ninh chuyên nghiệp.',
    ENTERPRISE: 'Cho tập đoàn cần tùy chỉnh tính năng, máy chủ riêng và cam kết SLA.',
};

const faqItems = [
    {
        question: 'AEGISM hỗ trợ triển khai trên những thiết bị nào?',
        answer: 'AEGISM hoạt động đa nền tảng: ứng dụng Web quản trị trên máy tính (Chrome, Edge, Safari), ứng dụng Desktop cho Windows, và ứng dụng di động cho lực lượng tuần tra hiện trường (Android APK, hỗ trợ quét mã QR cực nhanh ngay cả khi offline).',
    },
    {
        question: 'Hệ thống kiểm soát gian lận vị trí tuần tra như thế nào?',
        answer: 'Mỗi khi nhân viên quét mã QR tại điểm chốt, hệ thống tự động đối chiếu tọa độ GPS thực tế của thiết bị với tọa độ đã ghim trước đó. Nếu khoảng cách lệch khỏi bán kính cho phép (geofence), hệ thống sẽ cảnh báo vi phạm ngay lập tức.',
    },
    {
        question: 'Tôi có thể dùng thử trước khi trả phí không?',
        answer: 'Có! AEGISM cung cấp gói dùng thử miễn phí 14 ngày đầy đủ tính năng của gói Business hoặc bạn có thể đăng ký Demo trực tiếp để đội ngũ chuyên gia thiết lập cấu hình riêng cho tòa nhà của bạn.',
    },
    {
        question: 'Dữ liệu an ninh của chúng tôi có được bảo mật không?',
        answer: 'Toàn bộ dữ liệu được mã hóa SSL/TLS khi truyền tải, lưu trữ trên hạ tầng điện toán đám mây riêng biệt với sao lưu tự động hàng ngày, phân quyền vai trò chặt chẽ và ghi log vết kiểm toán (Audit Trail).',
    },
    {
        question: 'Nếu mất kết nối Internet tại tầng hầm thì có tuần tra được không?',
        answer: 'Được. Ứng dụng di động AEGISM hỗ trợ chế độ Offline Cache: nhân viên vẫn có thể quét mã QR và ghi nhận trạng thái kiểm tra. Dữ liệu sẽ tự động đồng bộ lên máy chủ ngay khi thiết bị có kết nối mạng trở lại.',
    },
];

const previewTabs = [
    {
        id: 'qr-patrol',
        title: 'Tuần tra QR Code',
        short: 'Check-in tại từng điểm chốt',
        icon: <HiQrCode className="h-5 w-5" aria-hidden="true" />,
        desc: 'Nhân viên check-in tức thì tại các điểm chốt với mã QR động, đối chiếu GPS để chặn gian lận vị trí.',
        image: '/img/ae_qr_log.png',
        alt: 'Nhật ký tuần tra QR Code theo thời gian thực trên AEGISM',
        bullets: ['Chống gian lận vị trí với GPS Geofencing', 'Quét offline khi ở tầng hầm', 'Ghi chú hiện trường kèm hình ảnh thực'],
    },
    {
        id: 'live-map',
        title: 'Bản đồ số GPS',
        short: 'Vị trí đội bảo vệ theo thời gian thực',
        icon: <HiMap className="h-5 w-5" aria-hidden="true" />,
        desc: 'Quan sát toàn cảnh vị trí đội bảo vệ trên bản đồ vệ tinh, xem lại lộ trình đã đi của từng ca trực.',
        image: '/img/background_features_1.png',
        alt: 'Bản đồ số GPS theo dõi vị trí nhân viên bảo vệ',
        bullets: ['Định vị nhân viên theo thời gian thực', 'Theo dõi lộ trình di chuyển chi tiết', 'Cảnh báo khi nhân viên rời khu vực trực'],
    },
    {
        id: 'incident',
        title: 'Báo cáo sự cố',
        short: 'Khai báo trong 5 giây, kèm ảnh',
        icon: <HiShieldCheck className="h-5 w-5" aria-hidden="true" />,
        desc: 'Khai báo sự cố an ninh, cháy nổ, hỏng hóc kỹ thuật kèm ảnh chụp và mức độ nghiêm trọng.',
        image: '/img/img_tinh_nang_2.png',
        alt: 'Màn hình báo cáo sự cố và cảnh báo SOS trong AEGISM',
        bullets: ['Phát chuông báo động SOS tức thì', 'Tự động gán nhiệm vụ cho nhân sự ứng cứu', 'Lưu nhật ký xử lý minh bạch'],
    },
    {
        id: 'analytics',
        title: 'Trung tâm chỉ huy',
        short: 'Báo cáo SLA và chỉ số an ninh',
        icon: <HiChartPie className="h-5 w-5" aria-hidden="true" />,
        desc: 'Báo cáo SLA, tỷ lệ hoàn thành ca trực và các chỉ số an ninh dưới dạng biểu đồ tương tác.',
        image: '/img/ana_rp.png',
        alt: 'Bảng phân tích báo cáo SLA và tỷ lệ hoàn thành ca trực',
        bullets: ['Đo năng suất từng nhân viên', 'Tự động tạo báo cáo gửi Ban quản lý', 'Phân tích xu hướng rủi ro định kỳ'],
    },
];

const steps = [
    { title: 'Tạo dự án và điểm chốt', desc: 'Khai báo tòa nhà, ca trực và các điểm tuần tra trên bản đồ chỉ trong vài phút.' },
    { title: 'Gắn mã QR tại hiện trường', desc: 'In mã QR riêng cho từng điểm chốt, dán cố định hoặc dùng mã động chống chụp lại.' },
    { title: 'Tuần tra bằng ứng dụng', desc: 'Nhân viên quét mã, hệ thống đối chiếu GPS và ghi ảnh, ghi chú, sự cố, kể cả khi offline.' },
    { title: 'Giám sát và nhận báo cáo', desc: 'Theo dõi trực tiếp, nhận cảnh báo tức thì và báo cáo SLA tự động gửi ban quản lý.' },
];

const stats = [
    { value: 50, suffix: '+', decimals: 0, label: 'Tòa nhà và khu đô thị' },
    { value: 10000, suffix: '+', decimals: 0, label: 'Điểm tuần tra đã số hóa' },
    { value: 99.98, suffix: '%', decimals: 2, label: 'Độ chính xác lộ trình' },
    { value: 0, suffix: '', decimals: 0, label: 'Sự cố gian lận vị trí' },
];

const logos: { name: string; Icon: IconType }[] = [
    { name: 'Đại Sơn Long Security', Icon: HiOutlineShieldCheck },
    { name: 'TechPark Operations', Icon: HiOutlineBuildingOffice2 },
    { name: 'Aegis Global Guard', Icon: HiShieldCheck },
    { name: 'Green Building PM', Icon: HiOutlineDevicePhoneMobile },
];

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const formatMoney = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

/* -------------------------------------------------------------------------- */
/*  SMALL PIECES                                                              */
/* -------------------------------------------------------------------------- */

/** Tách chữ thành từng từ để GSAP animate. Nội dung vẫn là text thường trong DOM (tốt cho SEO). */
const SplitWords: React.FC<{ text: string; innerClassName?: string }> = ({ text, innerClassName = '' }) => (
    <>
        {text.split(' ').map((word, wIdx) => (
            <span key={wIdx} className="inline-block whitespace-nowrap overflow-visible">
                <span className={`inline-block pb-[0.28em] -mb-[0.28em] pt-[0.1em] -mt-[0.1em] overflow-visible ${innerClassName}`}>
                    {word.split('').map((char, cIdx) => (
                        <span key={cIdx} className="split-char inline-block opacity-0">{char}</span>
                    ))}
                </span>
                <span className="inline-block">&nbsp;</span>
            </span>
        ))}
    </>
);

const PREFIX_TEXT = 'Phần mềm quản lý tuần tra';
const SUFFIX_TEXT = 'QR Code & GPS thời gian thực';
const FULL_TEXT = `${PREFIX_TEXT} ${SUFFIX_TEXT}`;

/** Hiệu ứng máy đánh chữ: gõ ra toàn bộ -> dừng lại để đọc -> xoá lùi sạch 100% từ đầu đến cuối cả dòng -> con trỏ di chuyển bám sát ký tự */
const HeroTypewriter: React.FC = () => {
    const [charCount, setCharCount] = useState(FULL_TEXT.length);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        if (!isDeleting) {
            if (charCount < FULL_TEXT.length) {
                timeout = setTimeout(() => {
                    setCharCount((prev) => prev + 1);
                }, 50);
            } else {
                timeout = setTimeout(() => {
                    setIsDeleting(true);
                }, 2600);
            }
        } else {
            if (charCount > 0) {
                timeout = setTimeout(() => {
                    setCharCount((prev) => prev - 1);
                }, 25);
            } else {
                timeout = setTimeout(() => {
                    setIsDeleting(false);
                }, 400);
            }
        }

        return () => clearTimeout(timeout);
    }, [charCount, isDeleting]);

    const prefixPart = charCount <= PREFIX_TEXT.length
        ? PREFIX_TEXT.slice(0, charCount)
        : PREFIX_TEXT;

    const hasSpace = charCount > PREFIX_TEXT.length;

    const suffixPart = charCount > PREFIX_TEXT.length + 1
        ? SUFFIX_TEXT.slice(0, charCount - PREFIX_TEXT.length - 1)
        : '';

    return (
        <span className="inline">
            <span className="text-white">{prefixPart}</span>
            {hasSpace && <span> </span>}
            {suffixPart && (
                <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
                    {suffixPart}
                </span>
            )}
            <span
                data-cursor
                aria-hidden="true"
                className="inline-block ml-1 text-cyan-400 font-light select-none align-baseline animate-pulse"
            >
                |
            </span>
        </span>
    );
};


interface SectionHeadingProps {
    id: string;
    title: string;
    desc?: string;
    dark?: boolean;
    center?: boolean;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ id, title, desc, dark = false, center = true }) => (
    <div className={`max-w-3xl ${center ? 'mx-auto text-center' : ''}`}>
        <h2
            id={id}
            data-split
            className={`text-3xl font-black leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl ${dark ? 'text-white' : 'text-gray-950'}`}
        >
            <SplitWords text={title} />
        </h2>
        {desc && (
            <p data-reveal="up" className={`mt-5 text-base leading-relaxed sm:text-lg ${dark ? 'text-blue-100/80' : 'text-gray-600'}`}>
                {desc}
            </p>
        )}
    </div>
);

const ShieldMark: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg
        aria-hidden="true"
        viewBox="0 0 100 110"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth=".4"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path data-shield-path pathLength={1} style={{ strokeDasharray: 1 }} d="M50 4 L92 20 V52 C92 78 72 98 50 106 C28 98 8 78 8 52 V20 Z" />
        <path data-shield-path pathLength={1} style={{ strokeDasharray: 1 }} d="M50 14 L82 26 V52 C82 72 67 88 50 95 C33 88 18 72 18 52 V26 Z" />
        <path data-shield-path pathLength={1} style={{ strokeDasharray: 1 }} d="M36 54 L46 64 L66 42" strokeWidth=".9" />
    </svg>
);

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

const LandingPage: React.FC = () => {
    const root = useRef<HTMLDivElement>(null);
    const tabFirst = useRef(true);
    const cycleFirst = useRef(true);
    const faqFirst = useRef(true);

    const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [plans, setPlans] = useState<Plan[]>(fallbackPlans);
    const [activeTab, setActiveTab] = useState(0);
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    /* ---------- Load plans (có sẵn dữ liệu dự phòng nên không bị trống / nhảy layout) ---------- */
    useEffect(() => {
        const apiUrl =
            window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000'
                : 'https://api.aegism.online';
        const ctrl = new AbortController();

        fetch(`${apiUrl}/api/payment/plan-config`, { signal: ctrl.signal })
            .then((r) => {
                if (!r.ok) throw new Error('plan-config failed');
                return r.json();
            })
            .then((configs: Plan[]) => {
                const active = configs.filter((c) => c.isActive && c.planKey !== 'NONE');
                if (active.length) setPlans(active);
            })
            .catch(() => {
                /* giữ nguyên fallbackPlans */
            });

        return () => ctrl.abort();
    }, []);

    /* ---------- MAIN GSAP TIMELINE (scoped, tự dọn dẹp, tôn trọng reduced-motion) ---------- */
    useLayoutEffect(() => {
        const el = root.current;
        if (!el) return;

        const mm = gsap.matchMedia();

        mm.add(
            { ok: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 1024px)' },
            (context) => {
                const { ok, desktop } = context.conditions as { ok: boolean; desktop: boolean };
                if (!ok) return;

                const q = gsap.utils.selector(el);
                const qa = (s: string) => q(s) as HTMLElement[];
                const cleanups: Array<() => void> = [];

                /* 1. Thanh tiến độ cuộn */
                gsap.fromTo(
                    qa('[data-progress]'),
                    { scaleX: 0 },
                    { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } }
                );

                /* 2. HERO: tiêu đề và các phần tử hero */
                const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });
                heroTl
                    .from(qa('[data-hero="badge"]'), { y: 20, autoAlpha: 0, duration: 0.7 })
                    .from(qa('[data-hero="title"]'), { y: 24, autoAlpha: 0, duration: 0.8 }, '-=0.4')
                    .from(qa('[data-hero="sub"]'), { y: 24, autoAlpha: 0, duration: 0.8 }, '-=0.4')
                    .from(qa('[data-hero="cta"] > *'), { y: 20, autoAlpha: 0, duration: 0.7, stagger: 0.1 }, '-=0.5')
                    .from(qa('[data-hero="trust"] li'), { y: 12, autoAlpha: 0, duration: 0.5, stagger: 0.08 }, '-=0.4')
                    .from(qa('[data-hero="visual"]'), { y: 90, scale: 0.92, autoAlpha: 0, duration: 1.4, ease: 'expo.out' }, 0.5)
                    .from(qa('[data-hero="chip"]'), { scale: 0.6, autoAlpha: 0, duration: 0.8, stagger: 0.15, ease: 'back.out(1.7)' }, '-=0.6');

                // Con trỏ nhấp nháy liên tục
                gsap.to(qa('[data-cursor]'), {
                    opacity: 0,
                    duration: 0.5,
                    repeat: -1,
                    yoyo: true,
                    ease: 'power1.inOut',
                });

                gsap.fromTo(
                    qa('[data-hero-section] [data-shield-path]'),
                    { strokeDashoffset: 1 },
                    { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut', stagger: 0.35, delay: 0.2 }
                );

                qa('[data-hero="chip"]').forEach((chip, i) => {
                    gsap.to(chip, { y: i % 2 ? -14 : 14, duration: 2.4 + i * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
                });

                qa('[data-orb]').forEach((orb, i) => {
                    gsap.to(orb, { x: i % 2 ? 70 : -70, y: i % 2 ? -50 : 50, duration: 9 + i * 2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
                });

                gsap.to(qa('[data-hero="visual"]'), {
                    yPercent: -8,
                    ease: 'none',
                    scrollTrigger: { trigger: qa('[data-hero-section]')[0], start: 'top top', end: 'bottom top', scrub: true },
                });

                /* 3. Số liệu đếm lên */
                qa('[data-count]').forEach((node) => {
                    const target = parseFloat(node.dataset.count || '0');
                    const dec = parseInt(node.dataset.decimals || '0', 10);
                    const suffix = node.dataset.suffix || '';
                    if (!target) return;
                    const fmt = (v: number) =>
                        v.toLocaleString('vi-VN', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
                    const obj = { v: 0 };
                    node.textContent = fmt(0);
                    gsap.to(obj, {
                        v: target,
                        duration: 2.2,
                        ease: 'power2.out',
                        scrollTrigger: { trigger: node, start: 'top 92%', once: true },
                        onUpdate: () => {
                            node.textContent = fmt(obj.v);
                        },
                    });
                });

                /* 4. Marquee logo (dừng khi rê chuột vào) */
                const track = qa('[data-marquee]')[0];
                if (track) {
                    const tween = gsap.to(track, { xPercent: -50, duration: 34, ease: 'none', repeat: -1 });
                    const wrap = track.parentElement;
                    const pause = () => tween.pause();
                    const play = () => tween.play();
                    wrap?.addEventListener('mouseenter', pause);
                    wrap?.addEventListener('mouseleave', play);
                    cleanups.push(() => {
                        wrap?.removeEventListener('mouseenter', pause);
                        wrap?.removeEventListener('mouseleave', play);
                    });
                }

                /* 5. Tiêu đề section: từng từ trồi lên -> typewriter effect */
                qa('[data-split]').forEach((h) => {
                    const chars = h.querySelectorAll('.split-char');
                    if (chars.length) {
                        gsap.fromTo(chars, 
                            { opacity: 0 },
                            {
                                opacity: 1,
                                duration: 0.2,
                                ease: 'none',
                                stagger: 0.03,
                                scrollTrigger: { trigger: h, start: 'top 85%', once: true },
                            }
                        );
                    }
                });

                /* 6. Reveal theo lô, trái/phải, thu phóng, mở ảnh bằng clip-path */
                const upEls = qa('[data-reveal="up"]');
                gsap.set(upEls, { autoAlpha: 0, y: 48 });
                ScrollTrigger.batch(upEls, {
                    start: 'top 90%',
                    once: true,
                    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, overwrite: true }),
                });

                qa('[data-reveal="left"]').forEach((n) =>
                    gsap.from(n, { x: -90, autoAlpha: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: n, start: 'top 85%', once: true } })
                );
                qa('[data-reveal="right"]').forEach((n) =>
                    gsap.from(n, { x: 90, autoAlpha: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: n, start: 'top 85%', once: true } })
                );
                qa('[data-reveal="scale"]').forEach((n) =>
                    gsap.from(n, { scale: 0.9, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: n, start: 'top 85%', once: true } })
                );

                /* 7. Bento: đường quét QR, sóng GPS, xung SOS, cột biểu đồ */
                qa('[data-scan]').forEach((n) =>
                    gsap.fromTo(n, { top: '8%' }, { top: '88%', duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 })
                );
                qa('[data-ping]').forEach((n, i) =>
                    gsap.fromTo(n, { scale: 0.4, autoAlpha: 0.9 }, { scale: 1.7, autoAlpha: 0, duration: 2.4, ease: 'power1.out', repeat: -1, delay: (i % 3) * 0.8 })
                );
                const bars = qa('[data-bar]');
                if (bars.length) {
                    gsap.from(bars, {
                        scaleY: 0,
                        transformOrigin: '50% 100%',
                        duration: 1.2,
                        ease: 'elastic.out(1, 0.6)',
                        stagger: 0.08,
                        scrollTrigger: { trigger: qa('[data-bars]')[0], start: 'top 85%', once: true },
                    });
                }

                /* 8. Quy trình: desktop ghim màn hình + timeline scrub, mobile reveal thường */
                const how = qa('[data-how]')[0];
                const stepEls = qa('[data-step]');
                if (how && stepEls.length) {
                    if (desktop) {
                        gsap.set(stepEls, { opacity: 0.25, y: 30 });
                        const tl = gsap.timeline({
                            defaults: { ease: 'none' },
                            scrollTrigger: { trigger: how, start: 'top top', end: '+=130%', pin: true, scrub: 0.7, anticipatePin: 1 },
                        });
                        tl.fromTo(qa('[data-how-line]'), { scaleX: 0 }, { scaleX: 1, duration: stepEls.length - 1 });
                        stepEls.forEach((s, i) => {
                            const at = Math.max(0, i - 0.3);
                            tl.to(s, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, at);
                            const dot = s.querySelector('[data-step-dot]');
                            if (dot) tl.to(dot, { backgroundColor: '#2563eb', color: '#ffffff', scale: 1.12, duration: 0.4, ease: 'power2.out' }, at);
                        });
                        tl.to({}, { duration: 0.6 });
                    } else {
                        gsap.from(stepEls, {
                            y: 40,
                            autoAlpha: 0,
                            duration: 0.8,
                            stagger: 0.15,
                            ease: 'power3.out',
                            scrollTrigger: { trigger: how, start: 'top 80%', once: true },
                        });
                    }
                }

                /* 9. CTA cuối: khiên vẽ nét khi cuộn tới */
                qa('[data-cta-section] [data-shield-path]').forEach((p, i) =>
                    gsap.fromTo(
                        p,
                        { strokeDashoffset: 1 },
                        { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut', delay: i * 0.3, scrollTrigger: { trigger: qa('[data-cta-section]')[0], start: 'top 75%', once: true } }
                    )
                );

                /* Sắp xếp lại trigger theo vị trí (do có pin) rồi tính lại */
                ScrollTrigger.sort();
                ScrollTrigger.refresh();
                const onLoad = () => ScrollTrigger.refresh();
                window.addEventListener('load', onLoad);
                cleanups.push(() => window.removeEventListener('load', onLoad));

                return () => cleanups.forEach((fn) => fn());
            },
            el
        );

        return () => mm.revert();
    }, []);

    /* ---------- Chuyển tab: nội dung + ảnh chuyển cảnh ---------- */
    useEffect(() => {
        if (tabFirst.current) {
            tabFirst.current = false;
            return;
        }
        const el = root.current;
        if (!el || prefersReducedMotion()) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(
                '[data-tab-panel]:not([hidden]) [data-tab-anim]',
                { y: 24, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out' }
            );
            gsap.fromTo(
                '[data-tab-panel]:not([hidden]) [data-tab-img]',
                { scale: 1.1, autoAlpha: 0, clipPath: 'inset(0 100% 0 0)' },
                { scale: 1, autoAlpha: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'expo.out' }
            );
        }, el);
        return () => ctx.revert();
    }, [activeTab]);

    /* ---------- Bảng giá: thẻ trồi lên khi cuộn tới ---------- */
    useEffect(() => {
        const el = root.current;
        if (!el || prefersReducedMotion()) return;
        const ctx = gsap.context(() => {
            gsap.from('[data-plan]', {
                y: 70,
                autoAlpha: 0,
                duration: 1,
                stagger: 0.15,
                ease: 'power3.out',
                scrollTrigger: { trigger: '[data-plans]', start: 'top 82%', once: true },
            });
        }, el);
        ScrollTrigger.refresh();
        return () => ctx.revert();
    }, [plans.length]);

    /* ---------- Đổi chu kỳ thanh toán: giá lật lên ---------- */
    useEffect(() => {
        if (cycleFirst.current) {
            cycleFirst.current = false;
            return;
        }
        const el = root.current;
        if (!el || prefersReducedMotion()) return;
        const ctx = gsap.context(() => {
            gsap.fromTo('[data-price]', { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.06, ease: 'power3.out' });
        }, el);
        return () => ctx.revert();
    }, [cycle]);

    /* ---------- FAQ accordion: nội dung luôn có trong DOM, chỉ thu gọn chiều cao ---------- */
    useEffect(() => {
        const el = root.current;
        if (!el) return;
        const duration = faqFirst.current || prefersReducedMotion() ? 0 : 0.45;
        faqFirst.current = false;
        el.querySelectorAll<HTMLElement>('[data-faq-answer]').forEach((node, i) => {
            const open = i === openFaq;
            gsap.to(node, { height: open ? 'auto' : 0, opacity: open ? 1 : 0, duration, ease: 'power2.inOut', overwrite: true });
        });
        const t = window.setTimeout(() => ScrollTrigger.refresh(), duration * 1000 + 50);
        return () => window.clearTimeout(t);
    }, [openFaq]);

    const onTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
        const next = (activeTab + dir + previewTabs.length) % previewTabs.length;
        setActiveTab(next);
        document.getElementById(`tab-${previewTabs[next].id}`)?.focus();
    };

    const focusRing =
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';

    return (
        <div ref={root} className="overflow-x-clip bg-white font-sans text-gray-900 selection:bg-blue-600 selection:text-white">
            <SEO
                title="AEGISM - Phần Mềm Quản Lý Tuần Tra Bảo Vệ QR Code & GPS"
                description="AEGISM số hóa tuần tra bằng mã QR, định vị GPS thời gian thực và quản lý sự cố cho tòa nhà, khu đô thị, công ty bảo vệ. Dùng thử miễn phí 14 ngày."
                url="/"
                keywords="phần mềm quản lý bảo vệ, phần mềm tuần tra QR Code, giám sát an ninh GPS, quản lý tòa nhà, phần mềm an ninh thông minh, AEGISM"
            />
            <OrganizationSchema />
            <SoftwareApplicationSchema />
            <WebSiteSchema />
            <BreadcrumbSchema items={[{ name: 'Trang chủ', url: '/' }]} />
            <FAQSchema items={faqItems} />

            {/* Thanh tiến độ cuộn (trang trí) */}
            <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1">
                <div data-progress className="h-full origin-left scale-x-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400" />
            </div>

            <main>
                {/* ================= HERO ================= */}
                <section
                    data-hero-section
                    aria-labelledby="hero-title"
                    className="relative isolate overflow-hidden bg-[#071328] pb-24 pt-16 text-white lg:pb-32 lg:pt-24"
                >
                    {/* nền: lưới + quầng sáng + khiên Aegis */}
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
                    />
                    <div aria-hidden="true" data-orb className="absolute -left-24 top-10 -z-10 h-96 w-96 rounded-full bg-blue-600/25 blur-3xl" />
                    <div aria-hidden="true" data-orb className="absolute -right-24 top-40 -z-10 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
                    <ShieldMark className="pointer-events-none absolute left-1/2 top-24 -z-10 h-[46rem] w-[46rem] -translate-x-1/2 text-blue-300/30" />

                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-5xl lg:max-w-6xl text-center">
                            <div
                                data-hero="badge"
                                className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-white/5 px-4 py-1.5 text-sm font-medium text-blue-100 backdrop-blur"
                            >
                                <HiOutlineSparkles className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                                <span>Nền tảng quản lý an ninh số cho tòa nhà và doanh nghiệp bảo vệ</span>
                            </div>

                            <h1
                                id="hero-title"
                                data-hero="title"
                                className="min-h-[2.8em] sm:min-h-[2.5em] text-2xl font-black leading-[1.25] tracking-tight sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
                            >
                                <HeroTypewriter />
                            </h1>

                            <p data-hero="sub" className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-blue-100/80">
                                Bảo vệ quét mã QR tại từng điểm chốt, hệ thống đối chiếu vị trí GPS để loại bỏ tuần tra đối phó, xử lý sự cố tức thì và gửi báo cáo tự động cho ban quản lý.
                            </p>

                            <div data-hero="cta" className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
                                <Link
                                    to="/register"
                                    className={`inline-flex items-center justify-center rounded-xl bg-blue-600 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500 ${focusRing} focus-visible:ring-offset-[#071328]`}
                                >
                                    Dùng thử miễn phí 14 ngày
                                    <HiOutlineArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                                </Link>
                                <Link
                                    to="/request-demo"
                                    className={`inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-base font-bold text-white backdrop-blur transition hover:bg-white/10 ${focusRing} focus-visible:ring-offset-[#071328]`}
                                >
                                    Đặt lịch xem demo
                                </Link>
                            </div>

                            <ul data-hero="trust" className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-blue-100/70">
                                {['Miễn phí 14 ngày', 'Không cần thẻ tín dụng', 'Triển khai trong 24 giờ'].map((t) => (
                                    <li key={t} className="flex items-center gap-1.5">
                                        <HiCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Mockup dashboard + thẻ nổi */}
                        <div data-hero="visual" className="relative mx-auto mt-16 max-w-5xl">
                            <div aria-hidden="true" className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-blue-500/35 via-cyan-500/30 to-sky-400/35 blur-2xl" />
                            <figure className="relative rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-blue-950/60 backdrop-blur">
                                <div aria-hidden="true" className="flex items-center gap-1.5 px-3 pb-2 pt-1">
                                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                                </div>
                                <img
                                    src="/img/aegism_dashboard.png"
                                    alt="Giao diện dashboard quản lý tuần tra và giám sát an ninh AEGISM"
                                    width={1600}
                                    height={900}
                                    className="h-auto w-full rounded-xl object-cover"
                                    loading="eager"
                                    decoding="async"
                                    fetchPriority="high"
                                />
                                <figcaption className="sr-only">Bảng điều khiển AEGISM hiển thị tuần tra, vị trí GPS và cảnh báo sự cố</figcaption>
                            </figure>

                            <div aria-hidden="true" data-hero="chip" className="absolute -left-4 top-1/4 hidden items-center gap-3 rounded-xl border border-white/10 bg-[#0c1e3d]/90 px-4 py-3 shadow-xl backdrop-blur md:flex lg:-left-10">
                                <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300"><HiCheck className="h-5 w-5" /></span>
                                <span className="text-left text-sm"><span className="block font-bold text-white">Đã quét 128/130 điểm</span><span className="text-xs text-blue-200/70">Ca đêm, Tòa A</span></span>
                            </div>
                            <div aria-hidden="true" data-hero="chip" className="absolute -right-4 top-10 hidden items-center gap-3 rounded-xl border border-white/10 bg-[#0c1e3d]/90 px-4 py-3 shadow-xl backdrop-blur md:flex lg:-right-10">
                                <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-400/15 text-red-300"><HiOutlineBellAlert className="h-5 w-5" /></span>
                                <span className="text-left text-sm"><span className="block font-bold text-white">Cảnh báo SOS</span><span className="text-xs text-blue-200/70">Tầng hầm B2, vừa xong</span></span>
                            </div>
                            <div aria-hidden="true" data-hero="chip" className="absolute -right-2 bottom-12 hidden items-center gap-3 rounded-xl border border-white/10 bg-[#0c1e3d]/90 px-4 py-3 shadow-xl backdrop-blur md:flex lg:-right-8">
                                <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-400/15 text-blue-300"><HiOutlineMapPin className="h-5 w-5" /></span>
                                <span className="text-left text-sm"><span className="block font-bold text-white">GPS sai lệch 3 m</span><span className="text-xs text-blue-200/70">Đúng vị trí điểm chốt</span></span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= SỐ LIỆU ================= */}
                <section aria-label="Số liệu nổi bật của AEGISM" className="border-t border-white/10 bg-[#071328] py-12 text-white">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 text-center lg:grid-cols-4 lg:divide-x lg:divide-white/10">
                            {stats.map((s) => (
                                <div key={s.label} className="flex flex-col-reverse gap-2 px-2">
                                    <dt className="text-sm font-medium text-blue-200/70">{s.label}</dt>
                                    <dd
                                        data-count={s.value}
                                        data-decimals={s.decimals}
                                        data-suffix={s.suffix}
                                        className="bg-gradient-to-b from-white to-blue-300 bg-clip-text text-4xl font-black text-transparent sm:text-5xl"
                                    >
                                        {s.value.toLocaleString('vi-VN', { minimumFractionDigits: s.decimals, maximumFractionDigits: s.decimals })}
                                        {s.suffix}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>

                {/* ================= KHÁCH HÀNG (MARQUEE) ================= */}
                <section aria-labelledby="clients-title" className="border-b border-gray-100 bg-white py-12">
                    <h2 id="clients-title" className="mb-8 px-4 text-center text-base font-semibold text-gray-500">
                        Được các đơn vị quản trị an ninh và tòa nhà tin dùng
                    </h2>
                    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
                        <div data-marquee className="flex w-max">
                            {[0, 1].map((copy) => (
                                <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
                                    {[...logos, ...logos].map(({ name, Icon }, i) => (
                                        <li key={`${copy}-${i}`} className="mx-8 flex items-center gap-3 text-lg font-bold text-gray-400 md:mx-12">
                                            <Icon className="h-7 w-7 text-blue-500" aria-hidden="true" />
                                            <span className="whitespace-nowrap">{name}</span>
                                        </li>
                                    ))}
                                </ul>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ================= 4 TRỤ CỘT (BENTO) ================= */}
                <section id="tinh-nang" aria-labelledby="pillars-title" className="bg-white py-24">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <SectionHeading
                            id="pillars-title"
                            title="Quản lý an ninh hiện đại trong một nền tảng"
                            desc="Thiết kế theo quy trình vận hành của các đơn vị an ninh hàng đầu Việt Nam: từ điểm chốt, vị trí, sự cố đến báo cáo."
                        />

                        <div className="mt-16 grid grid-cols-1 gap-5 lg:grid-cols-6">
                            {/* QR */}
                            <article data-reveal="up" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-sky-700 p-8 text-white lg:col-span-4 lg:p-10">
                                <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
                                    <div className="max-w-md">
                                        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
                                            <HiQrCode className="h-4 w-4" aria-hidden="true" /> Chống gian lận
                                        </span>
                                        <h3 className="mt-5 text-2xl font-black sm:text-3xl">Check-in QR siêu tốc</h3>
                                        <p className="mt-3 leading-relaxed text-blue-100">
                                            Quét mã QR tại từng trạm tuần tra. Mã động chống chụp lại và đối chiếu bán kính GPS ngay khi quét.
                                        </p>
                                    </div>
                                    <div aria-hidden="true" className="relative grid h-44 w-44 shrink-0 place-items-center rounded-2xl border border-white/25 bg-white/10 backdrop-blur">
                                        <HiQrCode className="h-24 w-24 text-white/90" />
                                        <span data-scan style={{ top: '8%' }} className="absolute inset-x-3 h-0.5 rounded bg-emerald-300 shadow-[0_0_16px_4px_rgba(110,231,183,0.8)]" />
                                    </div>
                                </div>
                            </article>

                            {/* GPS */}
                            <article data-reveal="up" className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 p-8 lg:col-span-2">
                                <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                                    <HiMap className="h-4 w-4" aria-hidden="true" /> Thời gian thực
                                </span>
                                <h3 className="mt-5 text-2xl font-black text-gray-950">Giám sát live GPS</h3>
                                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                                    Xem vị trí nhân sự trên bản đồ vệ tinh, biết ngay khi có người rời khu vực trực.
                                </p>
                                <div aria-hidden="true" className="relative mx-auto mt-6 grid h-32 w-32 place-items-center">
                                    {[0, 1, 2].map((i) => (
                                        <span key={i} data-ping className="absolute inset-0 rounded-full border-2 border-blue-400" />
                                    ))}
                                    <span className="relative grid h-12 w-12 place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/40">
                                        <HiMap className="h-6 w-6" />
                                    </span>
                                </div>
                            </article>

                            {/* SOS */}
                            <article data-reveal="up" className="relative overflow-hidden rounded-3xl border border-red-100 bg-red-50/60 p-8 lg:col-span-2">
                                <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                                    <HiBolt className="h-4 w-4" aria-hidden="true" /> Ứng cứu tức thời
                                </span>
                                <h3 className="mt-5 text-2xl font-black text-gray-950">Báo cáo sự cố và SOS</h3>
                                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                                    Phát hiện cháy nổ, cửa mở, hư hỏng thiết bị và gửi cảnh báo khẩn đến ban quản lý trong 3 giây.
                                </p>
                                <div aria-hidden="true" className="relative mx-auto mt-6 grid h-28 w-28 place-items-center">
                                    {[0, 1, 2].map((i) => (
                                        <span key={i} data-ping className="absolute inset-0 rounded-full border-2 border-red-400" />
                                    ))}
                                    <span className="relative grid h-12 w-12 place-items-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/40">
                                        <HiOutlineBellAlert className="h-6 w-6" />
                                    </span>
                                </div>
                            </article>

                            {/* SLA */}
                            <article data-reveal="up" className="relative overflow-hidden rounded-3xl bg-[#071328] p-8 text-white lg:col-span-4 lg:p-10">
                                <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
                                    <div className="max-w-md">
                                        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                                            <HiChartPie className="h-4 w-4" aria-hidden="true" /> Báo cáo thông minh
                                        </span>
                                        <h3 className="mt-5 text-2xl font-black sm:text-3xl">Phân tích SLA tự động</h3>
                                        <p className="mt-3 leading-relaxed text-blue-100/80">
                                            Biểu đồ hoàn thành ca trực, thống kê vi phạm và xuất file Excel/PDF gửi đối tác mỗi tháng.
                                        </p>
                                    </div>
                                    <div aria-hidden="true" data-bars className="flex h-32 w-full max-w-xs items-end gap-2">
                                        {[40, 65, 50, 80, 70, 95].map((h, i) => (
                                            <span
                                                key={i}
                                                data-bar
                                                style={{ height: `${h}%` }}
                                                className={`flex-1 rounded-t-md ${i === 5 ? 'bg-emerald-400' : 'bg-blue-400/70'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </article>
                        </div>

                        <p data-reveal="up" className="mt-10 text-center">
                            <Link to="/features" className={`inline-flex items-center rounded-md text-base font-bold text-blue-600 hover:text-blue-800 ${focusRing}`}>
                                Xem đầy đủ tính năng của AEGISM
                                <HiOutlineArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                            </Link>
                        </p>
                    </div>
                </section>

                {/* ================= XEM HỆ THỐNG (TABS DỌC) ================= */}
                <section id="he-thong" aria-labelledby="preview-title" className="border-y border-gray-100 bg-gray-50 py-24">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <SectionHeading
                            id="preview-title"
                            title="Xem AEGISM vận hành từng khâu tuần tra"
                            desc="Chọn một phân hệ để xem giao diện thực tế trên web quản trị."
                        />

                        <div className="mt-14 grid gap-8 lg:grid-cols-12">
                            <div
                                role="tablist"
                                aria-label="Các phân hệ chính của AEGISM"
                                aria-orientation="vertical"
                                data-reveal="left"
                                className="flex gap-3 overflow-x-auto pb-2 lg:col-span-4 lg:flex-col lg:overflow-visible lg:pb-0"
                            >
                                {previewTabs.map((tab, idx) => {
                                    const selected = activeTab === idx;
                                    return (
                                        <button
                                            key={tab.id}
                                            id={`tab-${tab.id}`}
                                            role="tab"
                                            type="button"
                                            aria-selected={selected}
                                            aria-controls={`panel-${tab.id}`}
                                            tabIndex={selected ? 0 : -1}
                                            onClick={() => setActiveTab(idx)}
                                            onKeyDown={onTabKeyDown}
                                            className={`flex min-w-[15rem] items-center gap-4 rounded-2xl border p-4 text-left transition lg:min-w-0 ${focusRing} ${selected
                                                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                                                }`}
                                        >
                                            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${selected ? 'bg-white/15' : 'bg-blue-50 text-blue-600'}`}>
                                                {tab.icon}
                                            </span>
                                            <span>
                                                <span className="block font-bold">{tab.title}</span>
                                                <span className={`block text-sm ${selected ? 'text-blue-100' : 'text-gray-500'}`}>{tab.short}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div data-reveal="right" className="lg:col-span-8">
                                {previewTabs.map((tab, idx) => (
                                    <div
                                        key={tab.id}
                                        id={`panel-${tab.id}`}
                                        role="tabpanel"
                                        aria-labelledby={`tab-${tab.id}`}
                                        data-tab-panel
                                        hidden={activeTab !== idx}
                                    >
                                        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-xl sm:p-6">
                                            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-100">
                                                <img
                                                    data-tab-img
                                                    src={tab.image}
                                                    alt={tab.alt}
                                                    width={1200}
                                                    height={750}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="aspect-[16/10] w-full object-cover object-top"
                                                />
                                            </div>
                                            <div className="mt-6 grid gap-6 md:grid-cols-2">
                                                <div>
                                                    <h3 data-tab-anim className="text-2xl font-black text-gray-950">{tab.title}</h3>
                                                    <p data-tab-anim className="mt-3 leading-relaxed text-gray-600">{tab.desc}</p>
                                                </div>
                                                <ul className="space-y-3">
                                                    {tab.bullets.map((b) => (
                                                        <li key={b} data-tab-anim className="flex items-start gap-3 text-sm font-semibold text-gray-700">
                                                            <HiOutlineCheckBadge className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                                                            <span>{b}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= QUY TRÌNH (PIN + SCRUB) ================= */}
                <section
                    data-how
                    id="quy-trinh"
                    aria-labelledby="how-title"
                    className="bg-white py-24 lg:flex lg:min-h-screen lg:items-center lg:py-0"
                >
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <SectionHeading
                            id="how-title"
                            title="Từ lúc cài đặt đến báo cáo đầu tiên chỉ trong một ngày"
                            desc="Bốn bước để đưa tuần tra hiện trường lên số hóa."
                        />

                        <ol className="relative mt-20 grid gap-12 lg:grid-cols-4 lg:gap-8">
                            <div aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-0.5 bg-gray-200 lg:block">
                                <div data-how-line className="h-full origin-left bg-gradient-to-r from-blue-600 to-cyan-500" />
                            </div>
                            {steps.map((s, i) => (
                                <li key={s.title} data-step className="relative text-center">
                                    <span
                                        data-step-dot
                                        className="relative z-10 mx-auto grid h-14 w-14 place-items-center rounded-full border-2 border-blue-200 bg-white text-xl font-black text-blue-600"
                                    >
                                        {i + 1}
                                    </span>
                                    <h3 className="mt-6 text-xl font-bold text-gray-950">{s.title}</h3>
                                    <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-gray-600">{s.desc}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* ================= BẢNG GIÁ ================= */}
                <section id="bang-gia" aria-labelledby="pricing-title" className="border-t border-gray-100 bg-gray-50 py-24">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <SectionHeading
                            id="pricing-title"
                            title="Bảng giá rõ ràng, nâng cấp khi doanh nghiệp lớn lên"
                            desc="Không chi phí ẩn. Đổi gói hoặc thay đổi quy mô bất cứ lúc nào."
                        />

                        <div data-reveal="up" className="mt-10 flex flex-wrap items-center justify-center gap-4">
                            <span className={`text-sm font-semibold ${cycle === 'monthly' ? 'text-gray-950' : 'text-gray-400'}`}>Thanh toán hàng tháng</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={cycle === 'yearly'}
                                aria-label="Chuyển sang thanh toán hàng năm"
                                onClick={() => setCycle((c) => (c === 'monthly' ? 'yearly' : 'monthly'))}
                                className={`relative h-8 w-14 rounded-full bg-blue-600 p-1 transition ${focusRing}`}
                            >
                                <span className={`block h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${cycle === 'yearly' ? 'translate-x-6' : ''}`} />
                            </button>
                            <span className={`flex items-center gap-2 text-sm font-semibold ${cycle === 'yearly' ? 'text-blue-600' : 'text-gray-400'}`}>
                                Thanh toán hàng năm
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">Tiết kiệm 20%</span>
                            </span>
                        </div>

                        <div data-plans className="mx-auto mt-14 grid max-w-6xl grid-cols-1 items-stretch gap-6 md:grid-cols-3">
                            {plans.map((plan) => {
                                const isEnterprise = plan.planKey === 'ENTERPRISE' || (plan.monthlyPrice === 0 && plan.yearlyPrice === 0);
                                const highlight = plan.planKey === 'BUSINESS';
                                const price = isEnterprise ? 'Liên hệ' : formatMoney(cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice);
                                const ctaLink = isEnterprise ? '/contact' : `/register?plan=${plan.planKey.toLowerCase()}`;
                                const extra = (Array.isArray(plan.features) ? plan.features : []).slice(0, 4);

                                return (
                                    <article
                                        key={plan.planKey}
                                        data-plan
                                        className={`relative flex flex-col rounded-3xl bg-white p-8 ${highlight
                                                ? 'border-2 border-blue-600 shadow-2xl shadow-blue-500/15 md:py-12'
                                                : 'border border-gray-200 shadow-md'
                                            }`}
                                    >
                                        {highlight && (
                                            <span className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-3.5 py-1 text-xs font-black text-white shadow-md">
                                                Được chọn nhiều nhất
                                            </span>
                                        )}
                                        <h3 className={`text-2xl font-black ${highlight ? 'text-blue-600' : 'text-gray-950'}`}>{plan.displayName}</h3>
                                        <p className="mt-2 min-h-[40px] text-sm text-gray-500">{planDescriptions[plan.planKey] ?? ''}</p>

                                        <p className="mb-6 mt-5 flex items-baseline">
                                            <span data-price className="text-3xl font-black text-gray-950 sm:text-4xl">{price}</span>
                                            {!isEnterprise && <span className="ml-1.5 text-sm font-medium text-gray-500">/tháng</span>}
                                        </p>

                                        <ul className="mb-8 flex-1 space-y-3.5 border-t border-gray-100 pt-6">
                                            {[
                                                `Tối đa ${plan.maxUsers} người dùng`,
                                                `Tối đa ${plan.maxProjects} dự án mục tiêu`,
                                                `Tối đa ${plan.maxQRCodes} điểm quét QR`,
                                            ].map((t) => (
                                                <li key={t} className="flex items-center text-sm font-semibold text-gray-700">
                                                    <HiCheck className="mr-3 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                                                    {t}
                                                </li>
                                            ))}
                                            {extra.map((f) => (
                                                <li key={f} className="flex items-center text-sm text-gray-600">
                                                    <HiCheck className="mr-3 h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>

                                        <Link
                                            to={ctaLink}
                                            className={`block w-full rounded-xl py-3.5 text-center text-sm font-bold transition ${focusRing} ${highlight
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700'
                                                    : 'bg-gray-100 text-gray-800 hover:bg-blue-50 hover:text-blue-600'
                                                }`}
                                        >
                                            {isEnterprise ? 'Liên hệ tư vấn' : `Đăng ký gói ${plan.displayName}`}
                                        </Link>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ================= NHẬN XÉT ================= */}
                <section aria-labelledby="reviews-title" className="border-b border-gray-100 bg-white py-24">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <SectionHeading id="reviews-title" title="Các nhà quản lý nói gì về AEGISM" />

                        <div className="mx-auto mt-14 grid max-w-5xl gap-8 md:grid-cols-2">
                            <figure data-reveal="left" className="relative rounded-3xl border border-gray-200 bg-gradient-to-br from-blue-50/60 to-white p-8">
                                <span aria-hidden="true" className="absolute right-6 top-2 text-8xl font-black leading-none text-blue-200">&rdquo;</span>
                                <blockquote className="relative text-base italic leading-relaxed text-gray-700">
                                    Từ khi áp dụng AEGISM, tình trạng bảo vệ bỏ chốt hoặc tuần tra đối phó đã giảm về 0. Tỷ lệ hoàn thành nhiệm vụ theo ca trực hiển thị minh bạch giúp chúng tôi dễ dàng nghiệm thu với chủ đầu tư.
                                </blockquote>
                                <figcaption className="mt-6 flex items-center gap-3">
                                    <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">TM</span>
                                    <span>
                                        <span className="block text-sm font-bold text-gray-950">Anh Trần Minh</span>
                                        <span className="text-xs text-gray-500">Giám đốc Vận hành, Tập đoàn Đại Sơn Long</span>
                                    </span>
                                </figcaption>
                            </figure>

                            <figure data-reveal="right" className="relative rounded-3xl border border-gray-200 bg-gradient-to-br from-sky-50/60 to-white p-8">
                                <span aria-hidden="true" className="absolute right-6 top-2 text-8xl font-black leading-none text-sky-200">&rdquo;</span>
                                <blockquote className="relative text-base italic leading-relaxed text-gray-700">
                                    Giao diện app di động rất dễ dùng, ngay cả các chú bảo vệ lớn tuổi cũng chỉ mất 15 phút là quen thao tác quét QR và chụp ảnh báo cáo sự cố. Rất đáng đồng tiền.
                                </blockquote>
                                <figcaption className="mt-6 flex items-center gap-3">
                                    <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full bg-sky-600 text-sm font-bold text-white">LH</span>
                                    <span>
                                        <span className="block text-sm font-bold text-gray-950">Chị Lê Hoàng</span>
                                        <span className="text-xs text-gray-500">Trưởng ban Quản lý Tòa nhà TechPark Đà Nẵng</span>
                                    </span>
                                </figcaption>
                            </figure>
                        </div>
                    </div>
                </section>

                {/* ================= FAQ ================= */}
                <section id="cau-hoi" aria-labelledby="faq-title" className="bg-gray-50 py-24">
                    <div className="container mx-auto max-w-6xl px-4 sm:px-6">
                        <div className="grid gap-12 lg:grid-cols-12">
                            <div className="lg:col-span-4">
                                <div className="lg:sticky lg:top-28">
                                    <SectionHeading id="faq-title" title="Câu hỏi thường gặp" center={false} />
                                    <p data-reveal="up" className="mt-6 text-gray-600">
                                        Chưa thấy câu trả lời bạn cần?{' '}
                                        <Link to="/contact" className={`rounded font-bold text-blue-600 underline-offset-4 hover:underline ${focusRing}`}>
                                            Liên hệ chuyên viên tư vấn
                                        </Link>
                                        .
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 lg:col-span-8">
                                {faqItems.map((faq, idx) => {
                                    const isOpen = openFaq === idx;
                                    return (
                                        <div key={faq.question} data-reveal="up" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                            <h3>
                                                <button
                                                    type="button"
                                                    id={`faq-q-${idx}`}
                                                    aria-expanded={isOpen}
                                                    aria-controls={`faq-a-${idx}`}
                                                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                                                    className={`flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-bold text-gray-950 transition hover:text-blue-600 ${focusRing}`}
                                                >
                                                    <span className="text-base">{faq.question}</span>
                                                    <HiChevronDown
                                                        aria-hidden="true"
                                                        className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'}`}
                                                    />
                                                </button>
                                            </h3>
                                            <div id={`faq-a-${idx}`} role="region" aria-labelledby={`faq-q-${idx}`} data-faq-answer className="h-0 overflow-hidden opacity-0">
                                                <p className="border-t border-gray-100 px-6 pb-6 pt-4 text-sm leading-relaxed text-gray-600">{faq.answer}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= CTA CUỐI ================= */}
                <section data-cta-section aria-labelledby="cta-title" className="relative isolate overflow-hidden bg-[#071328] py-24 text-white">
                    <div aria-hidden="true" data-orb className="absolute -left-20 top-0 -z-10 h-80 w-80 rounded-full bg-blue-600/25 blur-3xl" />
                    <div aria-hidden="true" data-orb className="absolute -right-20 bottom-0 -z-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
                    <ShieldMark className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 text-blue-300/25" />

                    <div data-reveal="scale" className="container mx-auto max-w-4xl px-4 text-center">
                        <h2 id="cta-title" className="text-3xl font-black leading-tight sm:text-5xl">
                            Sẵn sàng số hóa tuần tra cho tòa nhà của bạn?
                        </h2>
                        <p className="mx-auto mt-5 max-w-xl text-base text-blue-100/80 sm:text-lg">
                            Tham gia cùng hơn 50 đơn vị đã chuyển quy trình tuần tra sang AEGISM. Cài đặt trong 24 giờ, không cần thẻ tín dụng.
                        </p>
                        <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
                            <Link
                                to="/register"
                                className={`rounded-xl bg-white px-8 py-3.5 font-bold text-blue-700 shadow-lg transition hover:bg-blue-50 ${focusRing} focus-visible:ring-offset-[#071328]`}
                            >
                                Đăng ký dùng thử ngay
                            </Link>
                            <Link
                                to="/contact"
                                className={`rounded-xl border border-white/40 px-8 py-3.5 font-bold text-white transition hover:bg-white/10 ${focusRing} focus-visible:ring-offset-[#071328]`}
                            >
                                Liên hệ chuyên viên tư vấn
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default LandingPage;