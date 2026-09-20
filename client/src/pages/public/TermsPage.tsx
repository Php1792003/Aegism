import React from 'react';
import { Link } from 'react-router-dom';
import { HiDocumentText, HiOutlineShieldCheck, HiOutlineCheckBadge, HiOutlineArrowTopRightOnSquare } from 'react-icons/hi2';
import SEO from '@/components/seo/SEO';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import { usePageAnimations } from '@/hooks/useGsap';
import { SplitWords } from '@/components/ui/SplitWords';

const sections = [
    { id: 'chap-nhan-dieu-khoan', title: '1. Chấp nhận điều khoản', desc: 'Phạm vi áp dụng đối với người dùng và tổ chức.' },
    { id: 'tai-khoan-bao-mat', title: '2. Tài khoản & Bảo mật', desc: 'Trách nhiệm giữ kín thông tin đăng nhập và quyền truy cập.' },
    { id: 'goi-dich-vu-thanh-toan', title: '3. Gói dịch vụ & Phí', desc: 'Giới hạn người dùng, mã QR và quy định chu kỳ cước.' },
    { id: 'cam-ket-sla', title: '4. Cam kết chất lượng (SLA)', desc: 'Chỉ số uptime 99.9% và thời gian hỗ trợ kỹ thuật.' },
    { id: 'so-huu-tri-tue', title: '5. Sở hữu trí tuệ', desc: 'Bản quyền công nghệ, mã nguồn và logo thương hiệu AEGISM.' },
    { id: 'cham-dut-dich-vu', title: '6. Chấm dứt & Hủy tài khoản', desc: 'Điều kiện tạm ngừng cung cấp dịch vụ hoặc thanh lý hợp đồng.' },
];

const TermsPage = () => {
    const root = usePageAnimations<HTMLDivElement>();

    return (
        <div ref={root} className="overflow-x-clip bg-white text-gray-900 font-sans selection:bg-blue-600 selection:text-white">
            <SEO
                title="Điều Khoản Dịch Vụ - AEGISM | Quy Định & Cam Kết Sử Dụng"
                description="Điều khoản và điều kiện dịch vụ của AEGISM. Quy định rõ ràng về quyền lợi, nghĩa vụ và cam kết SLA giữa khách hàng và nhà cung cấp."
                url="/terms"
                keywords="điều khoản dịch vụ AEGISM, cam kết SLA an ninh, quy định sử dụng phần mềm bảo vệ"
            />
            <BreadcrumbSchema items={[{ name: 'Trang chủ', url: '/' }, { name: 'Điều khoản dịch vụ', url: '/terms' }]} />

            {/* Scroll progress bar */}
            <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1">
                <div data-progress className="h-full origin-left scale-x-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400" />
            </div>

            <main className="py-14 sm:py-20 bg-gradient-to-b from-blue-50/50 via-white to-white">
                <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div data-hero-entrance="badge" className="inline-flex p-3 bg-blue-50 rounded-2xl text-blue-600 mb-4 border border-blue-100">
                            <HiDocumentText className="w-8 h-8" />
                        </div>
                        <h1 data-hero-entrance="title" className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
                            <SplitWords text="Điều Khoản Dịch Vụ" />
                        </h1>
                        <p data-hero-entrance="desc" className="mt-4 text-base text-gray-600 leading-relaxed">
                            Chào mừng bạn đến với AEGISM. Bằng việc truy cập hoặc sử dụng ứng dụng, bạn đồng ý tuân thủ các quy định được công bố dưới đây.
                        </p>
                        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400 font-medium">
                            <span>Có hiệu lực từ: 01/01/2026</span>
                            <span>•</span>
                            <span>Thời gian đọc ước tính: 5 phút</span>
                        </div>
                    </div>

                    {/* Layout with Sticky TOC */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                        {/* Table of Contents */}
                        <div data-reveal="left" className="hidden lg:block lg:col-span-4 sticky top-24 bg-gray-50/80 p-6 rounded-3xl border border-gray-200/80">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                                Các điều khoản chính
                            </h3>
                            <nav className="space-y-1">
                                {sections.map(sec => (
                                    <a
                                        key={sec.id}
                                        href={`#${sec.id}`}
                                        className="block px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:text-blue-600 hover:bg-white transition"
                                    >
                                        {sec.title}
                                    </a>
                                ))}
                            </nav>

                            <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-500 space-y-2">
                                <p className="font-bold text-gray-800">Cần ký hợp đồng pháp nhân?</p>
                                <p>Email: <a href="mailto:legal@aegism.online" className="text-blue-600 font-semibold hover:underline">legal@aegism.online</a></p>
                                <Link to="/policy" className="inline-flex items-center text-blue-600 font-bold hover:underline pt-2">
                                    Xem Chính sách bảo mật <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5 ml-1" />
                                </Link>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div data-reveal="right" className="lg:col-span-8 bg-white p-8 sm:p-12 rounded-3xl border border-gray-200/80 shadow-sm space-y-10 text-gray-700 leading-relaxed text-sm">
                            <section id="chap-nhan-dieu-khoan" className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">1</span>
                                    <h2 className="text-xl font-bold text-gray-900">Chấp Nhận Điều Khoản</h2>
                                </div>
                                <p>
                                    AEGISM là nền tảng SaaS chuyên sâu phục vụ công tác quản lý an ninh, tuần tra QR Code và giám sát hiện trường. Khi đăng ký tài khoản (bao gồm cả tài khoản dùng thử lẫn tài khoản doanh nghiệp chính thức), bạn xác nhận đã đọc, hiểu và cam kết tuân thủ bản Điều khoản này.
                                </p>
                            </section>

                            <div className="border-t border-gray-100" />

                            <section id="tai-khoan-bao-mat" className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">2</span>
                                    <h2 className="text-xl font-bold text-gray-900">Quản Lý Tài Khoản & Quyền Bảo Mật</h2>
                                </div>
                                <p>
                                    Người dùng có trách nhiệm tự bảo mật mật khẩu và tài khoản của mình. Mọi thao tác được thực hiện từ tài khoản quản trị viên (Admin) hoặc tài khoản nhân viên được coi là do chính cá nhân hoặc người được ủy quyền của doanh nghiệp thực hiện.
                                </p>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                                    <HiOutlineShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Nghiêm cấm các hành vi chia sẻ tài khoản cho đối tượng bên ngoài, cố tình đảo ngược mã nguồn (reverse engineering) hoặc can thiệp giả lập tọa độ GPS ảo trên thiết bị di động.
                                    </p>
                                </div>
                            </section>

                            <div className="border-t border-gray-100" />

                            <section id="goi-dich-vu-thanh-toan" className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">3</span>
                                    <h2 className="text-xl font-bold text-gray-900">Gói Dịch Vụ, Hạn Ngạch & Thanh Toán</h2>
                                </div>
                                <p>
                                    Mỗi gói cước (Starter, Business, Enterprise) đi kèm giới hạn số lượng người dùng, số dự án và điểm quét QR tối đa. Phí dịch vụ được thanh toán trước theo chu kỳ Tháng hoặc Năm. Hệ thống tự động gửi thông báo gia hạn trước 7 ngày khi gói cước sắp hết hạn.
                                </p>
                            </section>

                            <div className="border-t border-gray-100" />

                            <section id="cam-ket-sla" className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">4</span>
                                    <h2 className="text-xl font-bold text-gray-900">Cam Kết Chất Lượng Dịch Vụ (SLA)</h2>
                                </div>
                                <p>
                                    AEGISM cam kết duy trì tính sẵn sàng của hệ thống máy chủ đạt tối thiểu <strong>99.9%</strong> mỗi tháng (trừ các khoảng thời gian bảo trì định kỳ đã được thông báo trước ít nhất 24 giờ).
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs">
                                        <p className="font-bold text-blue-900">Thời gian phản hồi sự cố nghiêm trọng:</p>
                                        <p className="text-blue-700 mt-1">Dưới 30 phút (24/7)</p>
                                    </div>
                                    <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs">
                                        <p className="font-bold text-blue-900">Hỗ trợ hướng dẫn kỹ thuật thông thường:</p>
                                        <p className="text-blue-700 mt-1">Dưới 2 giờ làm việc</p>
                                    </div>
                                </div>
                            </section>

                            <div className="border-t border-gray-100" />

                            <section id="so-huu-tri-tue" className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">5</span>
                                    <h2 className="text-xl font-bold text-gray-900">Sở Hữu Trí Tuệ</h2>
                                </div>
                                <p>
                                    Toàn bộ mã nguồn phần mềm, thiết kế giao diện, cơ sở dữ liệu thuật toán, logo và thương hiệu AEGISM thuộc quyền sở hữu trí tuệ độc quyền của AEGISM. Dữ liệu vận hành (danh sách nhân sự, lịch trình, nhật ký quét mã) thuộc quyền sở hữu tuyệt đối của Quý khách hàng.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TermsPage;
