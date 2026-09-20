import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/seo/SEO';
import { BreadcrumbSchema, SoftwareApplicationSchema } from '@/components/seo/StructuredData';
import { usePageAnimations } from '@/hooks/useGsap';
import { SplitWords } from '@/components/ui/SplitWords';
import {
    HiOutlineQrCode,
    HiOutlineClipboardDocumentList,
    HiOutlineChartBarSquare,
    HiCheckCircle,
    HiXCircle,
    HiMap,
    HiShieldCheck,
    HiBolt,
    HiOutlineSparkles,
    HiOutlineArrowRight
} from 'react-icons/hi2';

const featuresData = [
    {
        id: 'feature-management',
        title: 'Trung Tâm Chỉ Huy & Quản Lý Vận Hành',
        badge: 'Chỉ Huy Trực Tuyến',
        description: 'Dashboard trung tâm hiển thị toàn diện mọi hoạt động của lực lượng an ninh theo thời gian thực. Phân công ca trực, chỉ đạo hiện trường và điều phối nhân sự chỉ với một màn hình điều khiển duy nhất.',
        icon: <HiOutlineClipboardDocumentList className="w-6 h-6 text-white" />,
        image: '/img/img_tinh_nang_1.jpg',
        reverse: false,
        bgGray: false,
        subFeatures: [
            { title: 'Bản đồ số đa tầng (Digital Map)', desc: 'Hiển thị vị trí nhân sự, các điểm chốt tuần tra và các sự cố cần xử lý trực tiếp trên bản đồ số trực quan.' },
            { title: 'Lịch trình tuần tra tự động (Workflow)', desc: 'Thiết lập ca trực, định tuyến điểm tuần tra theo giờ, tự động lặp lại hàng ngày mà không cần nhắc nhở thủ công.' },
            { title: 'Phân quyền đa cấp linh hoạt', desc: 'Thiết lập vai trò riêng biệt cho Ban giám đốc, Chỉ huy trưởng ca, Giám sát vùng và Nhân viên trực tiếp.' }
        ]
    },
    {
        id: 'feature-qr',
        title: 'Giám Sát Tuần Tra Thông Minh (QR & GPS)',
        badge: 'Chống Gian Lận',
        description: 'Giải pháp triệt tiêu hoàn toàn tình trạng tuần tra đối phó, bỏ chốt hoặc nhờ người quét hộ. Nhân viên sử dụng ứng dụng di động quét mã QR được mã hóa động kết hợp định vị vệ tinh GPS.',
        icon: <HiOutlineQrCode className="w-6 h-6 text-white" />,
        image: '/img/img_tinh_nang_2.png',
        reverse: true,
        bgGray: true,
        subFeatures: [
            { title: 'Kiểm soát bán kính GPS (Geofencing)', desc: 'Hệ thống tự động từ chối và cảnh báo nếu tọa độ thực tế của thiết bị không khớp với vị trí điểm chốt được cấu hình.' },
            { title: 'Mã QR mã hóa chống chụp lại', desc: 'Mã QR được gắn nhãn bảo vệ, ngăn ngừa tình trạng nhân viên chụp ảnh lại mã để quét từ xa.' },
            { title: 'Chế độ quét Offline thông minh', desc: 'Vẫn ghi nhận đầy đủ thời gian và hình ảnh khi nhân viên tuần tra tại tầng hầm, tự động đồng bộ ngay khi có Internet.' }
        ]
    },
    {
        id: 'feature-incident',
        title: 'Báo Cáo Sự Cố Tức Thời & Báo Động SOS',
        badge: 'Phản Ứng Nhanh',
        description: 'Khi phát hiện dấu hiệu bất thường (chập cháy, đột nhập, thiết bị hư hỏng, cửa mở sai quy định), nhân viên ghi nhận và gửi thông báo khẩn cấp về trung tâm chỉ huy trong vòng 5 giây.',
        icon: <HiShieldCheck className="w-6 h-6 text-white" />,
        image: '/img/img_tinh_nang_3.png',
        reverse: false,
        bgGray: false,
        subFeatures: [
            { title: 'Hình ảnh & Video bằng chứng hiện trường', desc: 'Chụp ảnh trực tiếp từ camera của app, đính kèm dấu mốc thời gian và tọa độ để tránh gian lận hình ảnh cũ.' },
            { title: 'Phát tín hiệu SOS khẩn cấp', desc: 'Nhân viên có thể gửi cảnh báo nguy hiểm chỉ bằng một nút bấm, gửi vị trí hiện tại đến toàn bộ đội ứng cứu.' },
            { title: 'Quy trình xử lý khép kín', desc: 'Theo dõi tiến độ xử lý sự cố từ lúc phát hiện -> phân công nhân sự -> hoàn tất khắc phục.' }
        ]
    },
    {
        id: 'feature-analytics',
        title: 'Phân Tích Dữ Liệu & Báo Cáo SLA Tự Động',
        badge: 'Báo Cáo Thông Minh',
        description: 'Không còn phải tổng hợp số liệu thủ công mỗi cuối tuần hay cuối tháng. AEGISM tự động tổng hợp toàn bộ dữ liệu thành các báo cáo trực quan, sẵn sàng gửi đến Ban quản lý tòa nhà.',
        icon: <HiOutlineChartBarSquare className="w-6 h-6 text-white" />,
        image: '/img/ana_rp.png',
        reverse: true,
        bgGray: true,
        subFeatures: [
            { title: 'Đánh giá KPI từng nhân viên', desc: 'Thống kê tỷ lệ hoàn thành ca trực, thời gian tuần tra trung bình và số lượng lỗi vi phạm theo từng cá nhân.' },
            { title: 'Biểu đồ trực quan và đo lường SLA', desc: 'Nắm bắt các khung giờ hay xảy ra sự cố nhất, các điểm chốt hay bị bỏ sót để kịp thời điều chỉnh phương án an ninh.' },
            { title: 'Xuất báo cáo PDF/Excel trong 1 cú click', desc: 'Báo cáo mẫu chuyên nghiệp, đính kèm đầy đủ biểu đồ và chữ ký số phục vụ công tác nghiệm thu hợp đồng.' }
        ]
    }
];

const comparisonData = [
    { feature: 'Phương thức xác thực điểm tuần tra', traditional: 'Ký sổ tay hoặc máy tuần tra bấm thẻ chip cơ học (dễ nhờ người bấm hộ)', aegism: 'Mã QR mã hóa động + Đối chiếu tọa độ GPS thực tế (chống gian lận 100%)' },
    { feature: 'Thời gian phát hiện nhân viên bỏ vị trí', traditional: 'Chỉ phát hiện sau khi hết ca hoặc có sự cố xảy ra', aegism: 'Cảnh báo tức thời trên bản đồ số khi quá giờ quy định chưa check-in' },
    { feature: 'Báo cáo sự cố hiện trường', traditional: 'Báo qua bộ đàm hoặc ghi chép, không có ảnh chụp mốc thời gian', aegism: 'Gửi báo cáo kèm ảnh chụp thực tế có gắn watermark thời gian & tọa độ' },
    { feature: 'Tổng hợp báo cáo định kỳ cho Ban quản lý', traditional: 'Mất 2-3 ngày để gom sổ sách, dễ sai sót số liệu', aegism: 'Tự động xuất báo cáo PDF/Excel chuẩn mực chỉ trong 30 giây' },
    { feature: 'Chi phí đầu tư thiết bị ban đầu', traditional: 'Mua máy tuần tra chuyên dụng đắt tiền, chi phí sửa chữa cao', aegism: 'Sử dụng ngay trên điện thoại thông minh hiện có của nhân viên' }
];

const FeaturesPage = () => {
    const root = usePageAnimations<HTMLDivElement>();

    return (
        <div ref={root} className="overflow-x-clip bg-white text-gray-900 font-sans selection:bg-blue-600 selection:text-white">
            <SEO
                title="Tính Năng AEGISM - Bộ Giải Pháp Số Hóa Tuần Tra & Giám Sát An Ninh"
                description="Khám phá trọn bộ tính năng vượt trội của AEGISM: Tuần tra QR Code, Bản đồ số GPS, Báo cáo sự cố khẩn cấp và Dashboard phân tích dữ liệu tự động."
                url="/features"
                keywords="tính năng AEGISM, tuần tra QR Code, giám sát an ninh GPS, báo cáo sự cố bảo vệ, phần mềm quản lý vận hành tòa nhà"
            />
            <SoftwareApplicationSchema />
            <BreadcrumbSchema items={[{ name: 'Trang chủ', url: '/' }, { name: 'Tính năng', url: '/features' }]} />

            {/* Scroll progress bar */}
            <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1">
                <div data-progress className="h-full origin-left scale-x-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400" />
            </div>

            <main>
                {/* --- HERO SECTION --- */}
                <section className="relative bg-gradient-to-b from-blue-50/60 via-white to-white pt-14 pb-20 overflow-hidden">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div data-hero-entrance="badge" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
                            <HiOutlineSparkles className="w-4 h-4 text-blue-600" />
                            <span>Khám phá công nghệ lõi</span>
                        </div>

                        <h1 data-hero-entrance="title" className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.15]">
                            <SplitWords text="Công Nghệ Hóa Toàn Diện" />
                            <br />
                            <SplitWords
                                text="Quy Trình Giám Sát An Ninh"
                                innerClassName="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 bg-clip-text text-transparent"
                            />
                        </h1>

                        <p data-hero-entrance="desc" className="mt-6 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Trang bị cho đội ngũ của bạn công nghệ hiện đại nhất: chuyển từ quản lý bị động sang kiểm soát chủ động và minh bạch theo thời gian thực.
                        </p>

                        {/* Quick Jump Pills */}
                        <div data-hero-entrance="pills" data-stagger-group className="mt-10 flex flex-wrap justify-center gap-3">
                            <a data-stagger-item href="#feature-management" className="inline-flex items-center px-5 py-2.5 rounded-xl bg-white shadow-sm text-xs font-bold text-gray-700 hover:text-blue-600 hover:shadow-md transition border border-gray-200">
                                <HiMap className="mr-2 text-blue-600 w-4 h-4" /> Trung tâm chỉ huy
                            </a>
                            <a data-stagger-item href="#feature-qr" className="inline-flex items-center px-5 py-2.5 rounded-xl bg-white shadow-sm text-xs font-bold text-gray-700 hover:text-blue-600 hover:shadow-md transition border border-gray-200">
                                <HiOutlineQrCode className="mr-2 text-emerald-600 w-4 h-4" /> Tuần tra QR Code
                            </a>
                            <a data-stagger-item href="#feature-incident" className="inline-flex items-center px-5 py-2.5 rounded-xl bg-white shadow-sm text-xs font-bold text-gray-700 hover:text-blue-600 hover:shadow-md transition border border-gray-200">
                                <HiShieldCheck className="mr-2 text-rose-600 w-4 h-4" /> Xử lý sự cố SOS
                            </a>
                            <a data-stagger-item href="#feature-analytics" className="inline-flex items-center px-5 py-2.5 rounded-xl bg-white shadow-sm text-xs font-bold text-gray-700 hover:text-blue-600 hover:shadow-md transition border border-gray-200">
                                <HiBolt className="mr-2 text-amber-500 w-4 h-4" /> Báo cáo SLA
                            </a>
                        </div>
                    </div>
                </section>

                {/* --- 4 CORE PILLARS SECTIONS --- */}
                {featuresData.map((feature) => (
                    <section
                        key={feature.id}
                        id={feature.id}
                        className={`py-20 border-t border-gray-100 ${feature.bgGray ? 'bg-gray-50/70' : 'bg-white'}`}
                    >
                        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                                {/* Visual Mockup */}
                                <div data-reveal={feature.reverse ? 'right' : 'left'} className={`lg:col-span-6 ${feature.reverse ? 'lg:order-2' : 'lg:order-1'}`}>
                                    <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200/80 bg-white">
                                        <img
                                            src={feature.image}
                                            alt={feature.title}
                                            className="w-full h-auto object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div data-reveal={feature.reverse ? 'left' : 'right'} className={`lg:col-span-6 ${feature.reverse ? 'lg:order-1' : 'lg:order-2'}`}>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
                                        <span>{feature.badge}</span>
                                    </div>

                                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
                                        {feature.title}
                                    </h2>

                                    <p className="mt-4 text-base text-gray-600 leading-relaxed">
                                        {feature.description}
                                    </p>

                                    <div className="mt-8 space-y-5">
                                        {feature.subFeatures.map((sub, idx) => (
                                            <div key={idx} className="flex items-start gap-4">
                                                <div className="p-1 rounded-full bg-blue-50 text-blue-600 mt-1 flex-shrink-0">
                                                    <HiCheckCircle className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-gray-900">{sub.title}</h3>
                                                    <p className="mt-1 text-sm text-gray-600 leading-relaxed">{sub.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                ))}

                {/* --- COMPARISON TABLE SECTION --- */}
                <section className="py-20 bg-gray-50 border-t border-gray-100">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div data-reveal="up" className="text-center max-w-3xl mx-auto mb-16">
                            <span className="text-blue-600 text-xs font-bold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                So sánh hiệu quả
                            </span>
                            <h2 data-split className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900">
                                <SplitWords text="Phương Pháp Truyền Thống vs Nền Tảng AEGISM" />
                            </h2>
                            <p className="mt-3 text-gray-600">
                                Nhìn rõ sự khác biệt giữa phương thức quản lý cơ học cũ và công nghệ số hóa thế hệ mới.
                            </p>
                        </div>

                        <div data-reveal="scale" className="overflow-x-auto bg-white rounded-3xl border border-gray-200 shadow-lg">
                            <table className="w-full text-left border-collapse min-w-[640px]">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="p-6 text-sm font-bold text-gray-900 w-1/3">Tiêu chí so sánh</th>
                                        <th className="p-6 text-sm font-bold text-rose-600 w-1/3">Cách làm truyền thống</th>
                                        <th className="p-6 text-sm font-bold text-blue-600 w-1/3 bg-blue-50/50">Giải pháp AEGISM</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {comparisonData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="p-6 font-bold text-gray-900">{row.feature}</td>
                                            <td className="p-6 text-gray-600">
                                                <div className="flex items-start gap-2.5">
                                                    <HiXCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                                                    <span>{row.traditional}</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-gray-800 font-semibold bg-blue-50/20">
                                                <div className="flex items-start gap-2.5">
                                                    <HiCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                                    <span>{row.aegism}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* --- BOTTOM CTA --- */}
                <section className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-700 text-white py-16">
                    <div data-reveal="up" className="container mx-auto max-w-4xl px-4 text-center">
                        <h2 data-split className="text-3xl sm:text-4xl font-black">
                            <SplitWords text="Sẵn Sàng Trải Nghiệm Các Tính Năng Này?" />
                        </h2>
                        <p className="mt-4 text-blue-100 text-base max-w-xl mx-auto">
                            Đội ngũ chuyên gia của chúng tôi sẵn sàng đồng hành hướng dẫn trực tiếp quy trình triển khai cho doanh nghiệp của bạn.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                to="/request-demo"
                                className="px-8 py-3.5 bg-white text-blue-700 rounded-xl font-bold shadow-lg hover:bg-blue-50 transition"
                            >
                                Đăng ký Demo trực tiếp
                            </Link>
                            <Link
                                to="/pricing"
                                className="px-8 py-3.5 border border-white/80 text-white rounded-xl font-bold hover:bg-white/10 transition"
                            >
                                Xem bảng giá chi tiết
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default FeaturesPage;