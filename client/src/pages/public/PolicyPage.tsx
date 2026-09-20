import React from 'react';
import { Link } from 'react-router-dom';
import { HiShieldCheck, HiLockClosed, HiEye, HiOutlineDocumentText, HiOutlineArrowTopRightOnSquare } from 'react-icons/hi2';
import SEO from '@/components/seo/SEO';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import { usePageAnimations } from '@/hooks/useGsap';
import { SplitWords } from '@/components/ui/SplitWords';

const sections = [
    { id: 'thu-thap-du-lieu', title: '1. Dữ liệu thu thập', desc: 'Các loại thông tin tài khoản, tọa độ và thiết bị được hệ thống ghi nhận.' },
    { id: 'muc-dich-su-dung', title: '2. Mục đích sử dụng', desc: 'Quy chuẩn sử dụng dữ liệu phục vụ vận hành và đối chiếu minh bạch.' },
    { id: 'bao-mat-luu-tru', title: '3. Bảo mật & Lưu trữ', desc: 'Tiêu chuẩn mã hóa TLS/SSL và hạ tầng đám mây an toàn.' },
    { id: 'chia-se-ben-thu-ba', title: '4. Chia sẻ dữ liệu', desc: 'Cam kết không bán hoặc chia sẻ thông tin cho bất kỳ bên thứ ba nào.' },
    { id: 'quyen-cua-nguoi-dung', title: '5. Quyền của người dùng', desc: 'Quyền yêu cầu trích xuất, chỉnh sửa hoặc xóa dữ liệu cá nhân.' },
    { id: 'thay-doi-chinh-sach', title: '6. Thay đổi điều khoản', desc: 'Thông báo khi có cập nhật chính sách quyền riêng tư mới.' },
];

const PolicyPage = () => {
    const root = usePageAnimations<HTMLDivElement>();

    return (
        <div ref={root} className="overflow-x-clip bg-white dark:bg-[#070d18] text-gray-900 dark:text-white font-sans selection:bg-blue-600 selection:text-white transition-colors">
            <SEO
                title="Chính Sách Bảo Mật & Quyền Riêng Tư - AEGISM"
                description="Chính sách bảo mật dữ liệu của nền tảng AEGISM. Cam kết bảo vệ an toàn thông tin khách hàng, dữ liệu tuần tra và lịch sử vận hành."
                url="/policy"
                keywords="chính sách bảo mật AEGISM, quyền riêng tư, an toàn dữ liệu tuần tra, bảo mật an ninh tòa nhà"
            />
            <BreadcrumbSchema items={[{ name: 'Trang chủ', url: '/' }, { name: 'Chính sách bảo mật', url: '/policy' }]} />

            {/* Scroll progress bar */}
            <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1">
                <div data-progress className="h-full origin-left scale-x-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400" />
            </div>

            <main className="py-14 sm:py-20 bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-slate-900/60 dark:via-[#070d18] dark:to-[#070d18] transition-colors">
                <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div data-hero-entrance="badge" className="inline-flex p-3 bg-blue-50 dark:bg-blue-950/60 rounded-2xl text-blue-600 dark:text-blue-400 mb-4 border border-blue-100 dark:border-blue-800">
                            <HiShieldCheck className="w-8 h-8" />
                        </div>
                        <h1 data-hero-entrance="title" className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                            <SplitWords text="Chính Sách Bảo Mật Thông Tin" />
                        </h1>
                        <p data-hero-entrance="desc" className="mt-4 text-base text-gray-600 dark:text-slate-300 leading-relaxed">
                            AEGISM cam kết bảo vệ dữ liệu và quyền riêng tư của mọi tổ chức, ban quản trị và nhân viên vận hành trên nền tảng.
                        </p>
                        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-500 font-medium">
                            <span>Có hiệu lực từ: 01/01/2026</span>
                            <span>•</span>
                            <span>Thời gian đọc ước tính: 4 phút</span>
                        </div>
                    </div>

                    {/* Layout with Sticky TOC */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                        {/* Table of Contents - Desktop Sticky */}
                        <div data-reveal="left" className="hidden lg:block lg:col-span-4 sticky top-24 bg-gray-50/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-gray-200/80 dark:border-slate-800">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                                Mục lục chính sách
                            </h3>
                            <nav className="space-y-1">
                                {sections.map(sec => (
                                    <a
                                        key={sec.id}
                                        href={`#${sec.id}`}
                                        className="block px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 transition"
                                    >
                                        {sec.title}
                                    </a>
                                ))}
                            </nav>

                            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800 text-xs text-gray-500 dark:text-gray-400 space-y-2">
                                <p className="font-bold text-gray-800 dark:text-slate-200">Cần hỗ trợ về bảo mật?</p>
                                <p>Email: <a href="mailto:privacy@aegism.online" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">privacy@aegism.online</a></p>
                                <Link to="/terms" className="inline-flex items-center text-blue-600 dark:text-blue-400 font-bold hover:underline pt-2">
                                    Xem Điều khoản dịch vụ <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5 ml-1" />
                                </Link>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div data-reveal="right" className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-10 text-gray-700 dark:text-slate-300 leading-relaxed text-sm">
                            <section id="thu-thap-du-lieu" className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">1</span>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dữ Liệu Chúng Tôi Thu Thập</h2>
                                </div>
                                <p>
                                    Để cung cấp dịch vụ quản lý an ninh chính xác nhất, AEGISM chỉ thu thập các dữ liệu cần thiết phục vụ vận hành:
                                </p>
                                <ul className="list-disc pl-6 space-y-1.5 text-gray-600 dark:text-slate-300">
                                    <li><strong className="text-gray-900 dark:text-white">Thông tin tài khoản:</strong> Họ tên, email, số điện thoại, vai trò quyền hạn và mật khẩu được băm mã hóa một chiều (bcrypt).</li>
                                    <li><strong className="text-gray-900 dark:text-white">Dữ liệu tổ chức (Tenant):</strong> Tên doanh nghiệp, gói cước dịch vụ, danh sách các mục tiêu tòa nhà cần bảo vệ.</li>
                                    <li><strong className="text-gray-900 dark:text-white">Dữ liệu vận hành hiện trường:</strong> Tọa độ GPS tại thời điểm quét mã QR, thời gian check-in, hình ảnh đính kèm báo cáo sự cố và thông tin thiết bị (model, phiên bản hệ điều hành).</li>
                                </ul>
                            </section>

                            <div className="border-t border-gray-100 dark:border-slate-800" />

                            <section id="muc-dich-su-dung" className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">2</span>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mục Đích Sử Dụng Dữ Liệu</h2>
                                </div>
                                <p>Chúng tôi cam kết sử dụng thông tin thu thập được đúng mục đích:</p>
                                <ul className="list-disc pl-6 space-y-1.5 text-gray-600 dark:text-slate-300">
                                    <li>Xác thực vị trí tuần tra và phòng chống gian lận trong công tác bảo vệ.</li>
                                    <li>Gửi thông báo khẩn cấp và chuông báo động SOS khi phát hiện sự cố cháy nổ, đột nhập.</li>
                                    <li>Tự động tổng hợp số liệu báo cáo KPI, bảng chấm công và chứng chỉ nghiệm thu cho Ban quản lý.</li>
                                    <li>Hỗ trợ xử lý các khiếu nại kỹ thuật và nâng cấp trải nghiệm người dùng.</li>
                                </ul>
                            </section>

                            <div className="border-t border-gray-100 dark:border-slate-800" />

                            <section id="bao-mat-luu-tru" className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">3</span>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bảo Mật & Tiêu Chuẩn Lưu Trữ</h2>
                                </div>
                                <div className="bg-blue-50/60 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/60 flex items-start gap-3">
                                    <HiLockClosed className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                                        Mọi luồng dữ liệu truyền tải giữa Mobile App, Desktop và Server đều được mã hóa bằng giao thức SSL/TLS 256-bit. Cơ sở dữ liệu được sao lưu định kỳ 24 giờ một lần và lưu trữ tại trung tâm dữ liệu tiêu chuẩn Tier-3 tại Việt Nam.
                                    </p>
                                </div>
                            </section>

                            <div className="border-t border-gray-100 dark:border-slate-800" />

                            <section id="chia-se-ben-thu-ba" className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">4</span>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cam Kết Không Chia Sẻ Bên Thứ Ba</h2>
                                </div>
                                <p>
                                    AEGISM cam đoan không bán, trao đổi hoặc thương mại hóa bất kỳ thông tin cá nhân hay lộ trình an ninh nào của khách hàng cho các bên quảng cáo thứ ba. Dữ liệu chỉ được cung cấp cho cơ quan có thẩm quyền khi có văn bản yêu cầu chính thức theo quy định của pháp luật Việt Nam.
                                </p>
                            </section>

                            <div className="border-t border-gray-100 dark:border-slate-800" />

                            <section id="quyen-cua-nguoi-dung" className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">5</span>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quyền Của Người Dùng</h2>
                                </div>
                                <p>
                                    Người dùng và tổ chức có toàn quyền truy xuất, xuất file sao lưu dữ liệu tuần tra hoặc yêu cầu hủy bỏ/xóa tài khoản vĩnh viễn khỏi hệ thống bất cứ lúc nào thông qua trang Cài đặt hoặc gửi email tới hòm thư hỗ trợ.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PolicyPage;
