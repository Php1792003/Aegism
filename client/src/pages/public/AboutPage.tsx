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
            title: "Tiên Phong Đổi Mới",
            desc: "Không ngừng ứng dụng công nghệ điện toán đám mây và mobile tân tiến nhất vào lĩnh vực an ninh bảo vệ truyền thống.",
            icon: <HiOutlineRocketLaunch className="h-7 w-7 text-blue-600" />,
            badge: "Innovation"
        },
        {
            title: "Minh Bạch Tuyệt Đối",
            desc: "Mọi lượt quét mã, tọa độ di chuyển và thời gian xử lý sự cố đều được ghi nhận trung thực, không thể can thiệp làm sai lệch.",
            icon: <HiShieldCheck className="h-7 w-7 text-emerald-600" />,
            badge: "Integrity"
        },
        {
            title: "Đồng Hành Tận Tâm",
            desc: "Lấy hiệu quả vận hành của khách hàng làm thước đo thành công. Hỗ trợ kỹ thuật và đào tạo nhân viên hiện trường 24/7.",
            icon: <HiOutlineHeart className="h-7 w-7 text-rose-600" />,
            badge: "Commitment"
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
                <section className="relative py-16 lg:py-24 bg-gradient-to-b from-blue-50/50 via-white to-white overflow-hidden">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="text-center max-w-3xl mx-auto">
                            <div data-hero-entrance="badge" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
                                <HiOutlineSparkles className="w-4 h-4 text-blue-600" />
                                <span>Câu chuyện & Sứ mệnh</span>
                            </div>

                            <h1 data-hero-entrance="title" className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.15]">
                                <SplitWords text="Chúng Tôi Là" />
                                <br />
                                <SplitWords
                                    text="AEGISM Platform"
                                    innerClassName="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 bg-clip-text text-transparent"
                                />
                            </h1>

                            <p data-hero-entrance="desc" className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                                Kiến tạo nền tảng công nghệ chuyên sâu giúp các doanh nghiệp Việt Nam chuyển đổi số quy trình
                                <span className="font-bold text-gray-900"> Giám sát An ninh </span>và
                                <span className="font-bold text-gray-900"> Quản lý Vận hành hiện trường</span>:
                                Minh bạch, Chuẩn xác và Tối ưu chi phí.
                            </p>
                        </div>

                        {/* Banner Image */}
                        <div data-reveal="scale" className="mt-12 relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200/80">
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
                <section className="py-20 bg-gray-50 border-y border-gray-100">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            <div data-reveal="left" className="lg:col-span-6 space-y-6">
                                <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-sm">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600">
                                            <HiOutlineFlag className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">Sứ Mệnh Của Chúng Tôi</h3>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed text-base">
                                        Loại bỏ sự phiền hà của sổ sách ghi chép thủ công và máy tuần tra cồng kềnh. Chúng tôi trao quyền cho các nhà quản trị khả năng kiểm soát an ninh theo thời gian thực chỉ trên chiếc điện thoại di động và máy tính.
                                    </p>
                                </div>

                                <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-sm">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-sky-50 border border-sky-100 rounded-2xl text-cyan-600">
                                            <HiOutlineEye className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">Tầm Nhìn Đến 2028</h3>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed text-base">
                                        Trở thành giải pháp SaaS tiêu chuẩn vàng cho hơn 1.000 tòa nhà, trung tâm thương mại và công ty bảo vệ tại Việt Nam, từng bước khẳng định năng lực công nghệ vươn tầm Đông Nam Á.
                                    </p>
                                </div>
                            </div>

                            <div data-reveal="right" className="lg:col-span-6">
                                <div className="relative rounded-3xl overflow-hidden shadow-xl border border-gray-200 bg-white">
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
                <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
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
                                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-700 w-full max-w-md aspect-square bg-gray-800">
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
                <section className="py-20 bg-white">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div data-reveal="up" className="text-center max-w-2xl mx-auto mb-16">
                            <span className="text-blue-600 text-xs font-bold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                Giá trị cốt lõi
                            </span>
                            <h2 data-split className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900">
                                <SplitWords text="Kim Chỉ Nam Cho Mọi Hành Động" />
                            </h2>
                            <p className="mt-3 text-gray-600">Những nguyên tắc định hình cách chúng tôi xây dựng sản phẩm và phục vụ khách hàng.</p>
                        </div>

                        <div data-stagger-group className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {coreValues.map((val, idx) => (
                                <div
                                    key={idx}
                                    data-stagger-item
                                    className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 relative"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                            {val.icon}
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md">
                                            {val.badge}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{val.title}</h3>
                                    <p className="text-gray-600 leading-relaxed text-sm">{val.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- ROADMAP / TIMELINE --- */}
                <section className="py-20 bg-gray-50 border-t border-gray-100">
                    <div className="container mx-auto max-w-5xl px-4 sm:px-6">
                        <div data-reveal="up" className="text-center max-w-2xl mx-auto mb-16">
                            <span className="text-blue-600 text-xs font-bold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                Chặng đường phát triển
                            </span>
                            <h2 data-split className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900">
                                <SplitWords text="Hành Trình Kiến Tạo AEGISM" />
                            </h2>
                        </div>

                        <div data-stagger-group className="relative border-l-2 border-blue-200 ml-4 md:ml-32 space-y-10">
                            {timelineEvents.map((evt, idx) => (
                                <div key={idx} data-stagger-item className="relative pl-8 sm:pl-10">
                                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow" />
                                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm">
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                                                {evt.phase}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-400">{evt.year}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mt-2">{evt.title}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed mt-2">{evt.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- BOTTOM CTA --- */}
                <section className="bg-blue-600 text-white py-16">
                    <div data-reveal="up" className="container mx-auto max-w-4xl px-4 text-center">
                        <h2 data-split className="text-3xl font-black">
                            <SplitWords text="Cùng AEGISM Đưa An Ninh Vào Kỷ Nguyên Số" />
                        </h2>
                        <p className="mt-3 text-blue-100 text-base max-w-lg mx-auto">
                            Liên hệ ngay hôm nay để nhận tư vấn chuyên sâu về phương án triển khai phần mềm cho tòa nhà của bạn.
                        </p>
                        <div className="mt-8 flex justify-center gap-4">
                            <Link to="/request-demo" className="px-8 py-3.5 bg-white text-blue-700 rounded-xl font-bold shadow-lg hover:bg-blue-50 transition">
                                Đăng ký Demo trực tiếp
                            </Link>
                            <Link to="/contact" className="px-8 py-3.5 border border-white text-white rounded-xl font-bold hover:bg-white/10 transition">
                                Liên hệ chúng tôi
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AboutPage;