import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/seo/SEO';
import { BreadcrumbSchema, OrganizationSchema } from '@/components/seo/StructuredData';
import { usePageAnimations } from '@/hooks/useGsap';
import { SplitWords } from '@/components/ui/SplitWords';
import {
    HiOutlineRocketLaunch,
    HiOutlineFlag,
    HiOutlineEye,
    HiOutlineHeart,
    HiCheckCircle,
    HiShieldCheck,
    HiBolt,
    HiOutlineDevicePhoneMobile,
    HiOutlineLockClosed,
    HiOutlineSparkles,
    HiOutlineArrowRight
} from 'react-icons/hi2';

const AboutPage = () => {
    const root = usePageAnimations<HTMLDivElement>();

    const timelineEvents = [
        {
            phase: "Giai đoạn 1",
            year: "2024 - Khởi đầu",
            title: "Nghiên Cứu & Phát Triển Lõi",
            desc: "Khởi tạo kiến trúc giám sát thời gian thực (Real-time Core), thuật toán mã hóa QR động và cơ chế Geofencing chống giả lập vị trí.",
        },
        {
            phase: "Giai đoạn 2",
            year: "2025 - Thử nghiệm diện rộng",
            title: "Triển Khai Thí Điểm 10+ Tòa Nhà",
            desc: "Hợp tác chiến lược cùng Đại Sơn Long Security, triển khai kiểm thử tại các tổ hợp văn phòng, trung tâm thương mại tại Đà Nẵng.",
        },
        {
            phase: "Giai đoạn 3",
            year: "2026 - Mở rộng toàn diện",
            title: "Hệ Sinh Thái An Ninh Đa Nền Tảng",
            desc: "Ra mắt trọn bộ ứng dụng Web, Android APK và Desktop Windows, tích hợp hệ thống báo động SOS và phân tích SLA tự động.",
        },
        {
            phase: "Tương lai",
            year: "2027 - 2028",
            title: "Vươn Tầm Khu Vực Đông Nam Á",
            desc: "Ứng dụng AI Camera và thiết bị IoT tuần tra, hướng tới trở thành nền tảng Security Tech dẫn đầu khu vực.",
        }
    ];

    const coreValues = [
        {
            title: "Minh Bạch Tuyệt Đối",
            desc: "Mọi lượt quét mã, tọa độ GPS di chuyển và mốc thời gian check-in được ghi nhận bất biến theo thời gian thực. Loại bỏ hoàn toàn tình trạng báo cáo khống hay tuần tra đối phó.",
            icon: <HiShieldCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />,
            badge: "Integrity",
            tag: "Chống gian lận GPS",
            iconBg: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-800"
        },
        {
            title: "Tiên Phong Công Nghệ",
            desc: "Không ngừng ứng dụng điện toán đám mây, kiến trúc Real-time WebSocket và định vị vệ tinh chính xác cao vào lĩnh vực quản trị an ninh bảo vệ hiện trường.",
            icon: <HiOutlineRocketLaunch className="h-7 w-7 text-blue-600 dark:text-blue-400" />,
            badge: "Innovation",
            tag: "Real-time Cloud Core",
            iconBg: "bg-blue-50 dark:bg-blue-950/50 border-blue-100 dark:border-blue-800"
        },
        {
            title: "Phản Ứng Tức Thì (< 5s)",
            desc: "Mỗi giây đều là an toàn tính mạng và tài sản. Tín hiệu SOS khẩn cấp và báo cáo sự cố được phân phối trực tiếp đến toàn bộ đội ứng cứu trong vòng dưới 5 giây.",
            icon: <HiBolt className="h-7 w-7 text-amber-500 dark:text-amber-400" />,
            badge: "Speed & Safety",
            tag: "Báo động SOS tức thời",
            iconBg: "bg-amber-50 dark:bg-amber-950/50 border-amber-100 dark:border-amber-800"
        },
        {
            title: "Đồng Hành & Hỗ Trợ 24/7",
            desc: "Lấy hiệu quả vận hành thực tế và sự an tâm của khách hàng làm thước đo thành công. Đội ngũ chuyên gia kỹ thuật hỗ trợ liên tục và đào tạo nghiệp vụ tận nơi.",
            icon: <HiOutlineHeart className="h-7 w-7 text-rose-600 dark:text-rose-400" />,
            badge: "Commitment",
            tag: "Hỗ trợ hiện trường 24/7",
            iconBg: "bg-rose-50 dark:bg-rose-950/50 border-rose-100 dark:border-rose-800"
        },
        {
            title: "Tối Giản & Thân Thiện",
            desc: "Giao diện được thiết kế trực quan, dễ hiểu tối đa để ngay cả các chú bảo vệ lớn tuổi cũng chỉ mất 15 phút làm quen thao tác quét QR và gửi báo cáo trơn tru.",
            icon: <HiOutlineDevicePhoneMobile className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />,
            badge: "User Centric",
            tag: "15 phút làm quen",
            iconBg: "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100 dark:border-indigo-800"
        },
        {
            title: "Bảo Mật Tiêu Chuẩn Doanh Nghiệp",
            desc: "Mã hóa đường truyền TLS/SSL 256-bit, sao lưu tự động định kỳ 24h và lưu trữ trên cụm máy chủ tiêu chuẩn Tier-3, đảm bảo an toàn tuyệt đối thông tin vận hành.",
            icon: <HiOutlineLockClosed className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />,
            badge: "Enterprise Security",
            tag: "Mã hóa SSL 256-bit",
            iconBg: "bg-cyan-50 dark:bg-cyan-950/50 border-cyan-100 dark:border-cyan-800"
        }
    ];

    return (
        <div ref={root} className="overflow-x-clip bg-white text-gray-900 font-sans selection:bg-blue-600 selection:text-white">
            <SEO
                title="Về Chúng Tôi - AEGISM | Sứ Mệnh Số Hóa Quản Lý An Ninh"
                description="Tìm hiểu về AEGISM - nền tảng công nghệ tiên phong tại Việt Nam giúp các tòa nhà và đơn vị an ninh số hóa quy trình tuần tra và quản trị vận hành."
                url="/about"
                keywords="về AEGISM, sứ mệnh AEGISM, đội ngũ an ninh số, công ty công nghệ an ninh Việt Nam, Đại Sơn Long AEGISM"
            />
            <OrganizationSchema />
            <BreadcrumbSchema items={[{ name: 'Trang chủ', url: '/' }, { name: 'Về chúng tôi', url: '/about' }]} />

            {/* Scroll progress bar */}
            <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1">
                <div data-progress className="h-full origin-left scale-x-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400" />
            </div>

            <main>
                {/* --- HERO SECTION --- */}
                <section className="relative py-16 lg:py-24 bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-slate-900/60 dark:via-[#070d18] dark:to-[#070d18] overflow-hidden transition-colors">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="text-center max-w-3xl mx-auto">
                            <div data-hero-entrance="badge" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6">
                                <HiOutlineSparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span>Câu chuyện & Sứ mệnh</span>
                            </div>

                            <h1 data-hero-entrance="title" className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.15]">
                                <SplitWords text="Chúng Tôi Là" />
                                <br />
                                <SplitWords
                                    text="AEGISM Platform"
                                    innerClassName="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 dark:from-blue-400 dark:via-cyan-300 dark:to-sky-300 bg-clip-text text-transparent"
                                />
                            </h1>

                            <p data-hero-entrance="desc" className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-slate-300 leading-relaxed">
                                Kiến tạo nền tảng công nghệ chuyên sâu giúp các doanh nghiệp Việt Nam chuyển đổi số quy trình
                                <span className="font-bold text-gray-900 dark:text-white"> Giám sát An ninh </span>và
                                <span className="font-bold text-gray-900 dark:text-white"> Quản lý Vận hành hiện trường</span>:
                                Minh bạch, Chuẩn xác và Tối ưu chi phí.
                            </p>
                        </div>

                        {/* Banner Image */}
                        <div data-reveal="scale" className="mt-12 relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200/80 dark:border-slate-800">
                            <img
                                src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"
                                alt="Văn phòng làm việc hiện đại AEGISM"
                                className="w-full h-80 sm:h-[450px] object-cover"
                                loading="eager"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/30 to-transparent flex flex-col justify-end p-8 sm:p-12 text-white">
                                <span className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-1">Trụ sở phát triển</span>
                                <h3 className="text-2xl sm:text-3xl font-black">Kiến tạo giải pháp công nghệ từ Đà Nẵng, Việt Nam</h3>
                                <p className="text-gray-300 text-sm mt-2 max-w-xl">Hội tụ đội ngũ kỹ sư phần mềm giàu nhiệt huyết cùng các chuyên gia an ninh dày dặn kinh nghiệm thực chiến.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- MISSION & VISION --- */}
                <section className="py-20 bg-gray-50 dark:bg-[#0b1220] border-y border-gray-100 dark:border-slate-800 transition-colors">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            <div data-reveal="left" className="lg:col-span-6 space-y-6">
                                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 rounded-2xl text-blue-600 dark:text-blue-400">
                                            <HiOutlineFlag className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Sứ Mệnh Của Chúng Tôi</h3>
                                    </div>
                                    <p className="text-gray-600 dark:text-slate-300 leading-relaxed text-base">
                                        Loại bỏ sự phiền hà của sổ sách ghi chép thủ công và máy tuần tra cồng kềnh. Chúng tôi trao quyền cho các nhà quản trị khả năng kiểm soát an ninh theo thời gian thực chỉ trên chiếc điện thoại di động và máy tính.
                                    </p>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-800 rounded-2xl text-cyan-600 dark:text-cyan-400">
                                            <HiOutlineEye className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Tầm Nhìn Đến 2028</h3>
                                    </div>
                                    <p className="text-gray-600 dark:text-slate-300 leading-relaxed text-base">
                                        Trở thành giải pháp SaaS tiêu chuẩn vàng cho hơn 1.000 tòa nhà, trung tâm thương mại và công ty bảo vệ tại Việt Nam, từng bước khẳng định năng lực công nghệ vươn tầm Đông Nam Á.
                                    </p>
                                </div>
                            </div>

                            <div data-reveal="right" className="lg:col-span-6">
                                <div className="relative rounded-3xl overflow-hidden shadow-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                    <img
                                        src="/img/img_about_us.png"
                                        alt="Tầm nhìn và giải pháp AEGISM"
                                        className="w-full h-auto object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- STRATEGIC PARTNER --- */}
                <section className="py-20 bg-gray-900 dark:bg-[#070d18] text-white relative overflow-hidden border-b border-gray-800 dark:border-slate-800">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            <div data-reveal="left" className="lg:col-span-7">
                                <span className="inline-block py-1 px-3.5 rounded-full bg-blue-600/20 border border-blue-400 text-blue-300 text-xs font-bold uppercase tracking-wider mb-6">
                                    Đối tác chiến lược toàn diện
                                </span>
                                <h2 data-split className="text-3xl sm:text-4xl font-black mb-6 leading-tight">
                                    <SplitWords text="Cộng Hưởng Sức Mạnh Cùng" />
                                    <br />
                                    <SplitWords text="Đại Sơn Long Security" innerClassName="text-blue-400" />
                                </h2>
                                <p className="text-gray-300 text-base leading-relaxed mb-8">
                                    Sự kết hợp hoàn hảo giữa năng lực phát triển công nghệ cao của AEGISM và kinh nghiệm thực chiến điều hành hàng trăm dự án an ninh trọng điểm của Tập đoàn Đại Sơn Long.
                                </p>
                                <div data-stagger-group className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        "Thử nghiệm trên các dự án quy mô lớn",
                                        "Tối ưu trải nghiệm cho nhân sự hiện trường",
                                        "Công nghệ đối soát dữ liệu 24/7",
                                        "Quy chuẩn hóa SLA vận hành an ninh"
                                    ].map((item, i) => (
                                        <div key={i} data-stagger-item className="flex items-center gap-3">
                                            <HiCheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                            <span className="text-gray-200 text-sm font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div data-reveal="right" className="lg:col-span-5 flex justify-center">
                                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-700 dark:border-slate-700 w-full max-w-md aspect-square bg-gray-800 dark:bg-slate-900">
                                    <img
                                        src="/img/argism_contract.png"
                                        alt="Lễ ký kết hợp tác chiến lược AEGISM và Đại Sơn Long"
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onError={(e) => { e.currentTarget.src = '/img/aegism_dashboard.png'; }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- CORE VALUES --- */}
                <section className="py-20 bg-white dark:bg-[#070d18] transition-colors">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div data-reveal="up" className="text-center max-w-2xl mx-auto mb-16">
                            <span className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                                Giá trị cốt lõi
                            </span>
                            <h2 data-split className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                                <SplitWords text="Kim Chỉ Nam Cho Mọi Hành Động" />
                            </h2>
                            <p className="mt-3 text-gray-600 dark:text-slate-300">Những nguyên tắc định hình cách chúng tôi xây dựng sản phẩm và phục vụ khách hàng.</p>
                        </div>

                        {/* 6 Core Value Cards Grid */}
                        <div data-reveal="up" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                            {coreValues.map((val, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 flex flex-col justify-between group"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${val.iconBg}`}>
                                                {val.icon}
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-gray-100 dark:border-slate-700">
                                                {val.badge}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {val.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-slate-300 leading-relaxed text-sm">
                                            {val.desc}
                                        </p>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                            <HiCheckCircle className="w-4 h-4 text-emerald-500" />
                                            {val.tag}
                                        </span>
                                        <span className="text-xs font-mono font-bold text-gray-300 dark:text-slate-600">0{idx + 1}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quality Commitment Callout Banner */}
                        <div data-reveal="up" className="mt-16 rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 p-8 sm:p-10 text-white shadow-xl border border-blue-500/30 dark:border-blue-800/60 relative overflow-hidden">
                            <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
                            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                                <div className="lg:col-span-8 space-y-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 dark:bg-blue-500/20 text-blue-100 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                                        <HiShieldCheck className="w-4 h-4" /> Cam kết chất lượng dịch vụ
                                    </span>
                                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                        Chuẩn Hóa An Ninh Hiện Trường Cùng AEGISM
                                    </h3>
                                    <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed max-w-2xl">
                                        Chúng tôi không chỉ cung cấp phần mềm, chúng tôi mang đến một phương thức quản trị minh bạch, chuẩn mực hóa SLA và nâng cao vị thế chuyên nghiệp cho mọi lực lượng bảo vệ.
                                    </p>
                                </div>
                                <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center lg:items-end">
                                    <Link
                                        to="/request-demo"
                                        className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white dark:bg-blue-600 dark:hover:bg-blue-500 text-blue-700 dark:text-white font-bold text-sm shadow-lg hover:bg-blue-50 transition transform hover:-translate-y-0.5 text-center"
                                    >
                                        Đăng ký trải nghiệm thử <HiOutlineArrowRight className="ml-2 w-4 h-4" />
                                    </Link>
                                    <Link
                                        to="/contact"
                                        className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-white font-semibold text-sm border border-white/20 dark:border-slate-700 transition text-center"
                                    >
                                        Liên hệ hợp tác
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- ROADMAP / TIMELINE --- */}
                <section className="py-20 bg-gray-50 dark:bg-[#0b1220] border-t border-gray-100 dark:border-slate-800 transition-colors">
                    <div className="container mx-auto max-w-5xl px-4 sm:px-6">
                        <div data-reveal="up" className="text-center max-w-2xl mx-auto mb-16">
                            <span className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                                Chặng đường phát triển
                            </span>
                            <h2 data-split className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                                <SplitWords text="Hành Trình Kiến Tạo AEGISM" />
                            </h2>
                        </div>

                        <div data-stagger-group className="relative border-l-2 border-blue-200 dark:border-blue-800 ml-4 md:ml-32 space-y-10">
                            {timelineEvents.map((evt, idx) => (
                                <div key={idx} data-stagger-item className="relative pl-8 sm:pl-10">
                                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-white dark:border-slate-900 shadow" />
                                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-sm">
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md">
                                                {evt.phase}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-400 dark:text-gray-400">{evt.year}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">{evt.title}</h3>
                                        <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed mt-2">{evt.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- BOTTOM CTA --- */}
                <section className="py-16 sm:py-20 bg-gray-50/60 dark:bg-[#070d18] transition-colors">
                    <div className="container mx-auto max-w-5xl px-4 sm:px-6">
                        <div data-reveal="up" className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-[#132347] dark:via-[#1e3264] dark:to-[#0f1d3d] p-10 sm:p-14 text-center text-white shadow-2xl border border-blue-400/30 dark:border-blue-500/40">
                            {/* Ambient Background Glows */}
                            <div aria-hidden="true" className="absolute -left-12 -top-12 w-64 h-64 rounded-full bg-cyan-400/25 dark:bg-cyan-400/20 blur-3xl pointer-events-none" />
                            <div aria-hidden="true" className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-blue-400/30 dark:bg-blue-400/25 blur-3xl pointer-events-none" />

                            <div className="relative z-10 max-w-3xl mx-auto space-y-4">
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 dark:bg-white/10 backdrop-blur-md text-blue-100 dark:text-blue-200 text-xs font-bold uppercase tracking-wider border border-white/20">
                                    🚀 Bắt đầu chuyển đổi số an ninh
                                </span>
                                <h2 data-split className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                                    <SplitWords text="Cùng AEGISM Đưa An Ninh Vào Kỷ Nguyên Số" />
                                </h2>
                                <p className="text-blue-100 dark:text-blue-100/90 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                                    Liên hệ ngay hôm nay để nhận tư vấn chuyên sâu và xây dựng phương án cấu hình tuần tra riêng biệt cho tòa nhà của bạn.
                                </p>
                                <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
                                    <Link
                                        to="/request-demo"
                                        className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl shadow-xl hover:bg-blue-50 transition transform hover:-translate-y-0.5 text-sm"
                                    >
                                        Đăng ký Demo trực tiếp
                                    </Link>
                                    <Link
                                        to="/contact"
                                        className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/30 backdrop-blur-md transition text-sm"
                                    >
                                        Liên hệ chúng tôi
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AboutPage;