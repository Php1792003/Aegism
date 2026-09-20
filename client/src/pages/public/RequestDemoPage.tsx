import React, { useState } from 'react';
import SEO from '@/components/seo/SEO';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import { usePageAnimations } from '@/hooks/useGsap';
import { SplitWords } from '@/components/ui/SplitWords';
import {
    HiCheckCircle,
    HiOutlineSparkles,
    HiOutlineArrowRight,
    HiOutlineClock,
    HiOutlineUserGroup,
    HiOutlineShieldCheck
} from 'react-icons/hi2';

const RequestDemoPage = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        fullname: '',
        phone: '',
        email: '',
        company: '',
        teamSize: '10-50',
        goal: 'Tối ưu tuần tra QR & giảm gian lận'
    });

    const root = usePageAnimations<HTMLDivElement>();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await fetch('https://api.aegism.online/api/emails/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: formData.email,
                    to: 'contact@aegism.online',
                    subject: `[Yêu cầu Demo] ${formData.fullname} - ${formData.company || 'Doanh nghiệp'}`,
                    raw: `Họ tên: ${formData.fullname}\nEmail: ${formData.email}\nSĐT: ${formData.phone}\nDoanh nghiệp: ${formData.company}\nQuy mô: ${formData.teamSize}\nMục tiêu: ${formData.goal}`,
                }),
            });
        } catch {
            // Fallback gracefully
        } finally {
            setIsSubmitting(false);
            setSubmitted(true);
        }
    };

    return (
        <div ref={root} className="overflow-x-clip bg-white text-gray-900 font-sans selection:bg-blue-600 selection:text-white">
            <SEO
                title="Đăng Ký Demo AEGISM Miễn Phí - Trải Nghiệm Hệ Thống Trong 30 Phút"
                description="Đăng ký nhận buổi demo 1-1 chuyên sâu từ chuyên gia AEGISM. Khám phá cách số hóa tuần tra QR, bản đồ GPS và báo cáo SLA tự động."
                url="/request-demo"
                keywords="demo AEGISM, dùng thử phần mềm an ninh, đăng ký demo miễn phí, trải nghiệm phần mềm bảo vệ"
            />
            <BreadcrumbSchema items={[{ name: 'Trang chủ', url: '/' }, { name: 'Yêu cầu Demo', url: '/request-demo' }]} />

            {/* Scroll progress bar */}
            <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1">
                <div data-progress className="h-full origin-left scale-x-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400" />
            </div>

            <main className="py-14 sm:py-20 bg-gradient-to-b from-blue-50/60 via-white to-white min-h-[85vh]">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        {/* LEFT COLUMN: Value proposition */}
                        <div data-reveal="left" className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
                            <div>
                                <div data-hero-entrance="badge" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
                                    <HiOutlineSparkles className="w-4 h-4 text-blue-600" />
                                    <span>Tư vấn 1-1 trực tuyến</span>
                                </div>
                                <h1 data-hero-entrance="title" className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                                    <SplitWords text="Trải Nghiệm Trực Tiếp" />
                                    <br />
                                    <SplitWords
                                        text="Nền Tảng AEGISM"
                                        innerClassName="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"
                                    />
                                </h1>
                                <p data-hero-entrance="desc" className="mt-4 text-base text-gray-600 leading-relaxed">
                                    Chỉ trong 30 phút, chuyên gia an ninh của AEGISM sẽ phân tích mô hình quản lý hiện tại và demo trực tiếp các kịch bản tuần tra tối ưu nhất cho tòa nhà của bạn.
                                </p>
                            </div>

                            {/* What to expect card */}
                            <div data-reveal="up" className="bg-white p-7 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
                                <h3 className="text-base font-bold text-gray-900">Quyền Lợi Dành Riêng Cho Bạn:</h3>
                                <div className="space-y-3.5 text-sm text-gray-700">
                                    <div className="flex items-start gap-3">
                                        <HiCheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <span>Phân tích miễn phí lỗ hổng gian lận trong lộ trình tuần tra</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <HiCheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <span>Tạo trước môi trường thử nghiệm (PoC) với mã QR mẫu</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <HiCheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <span>Cài đặt ứng dụng di động trực tiếp cho nhân viên trải nghiệm</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <HiCheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <span>Nhận chính sách giá ưu đãi độc quyền sau buổi Demo</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div data-stagger-group className="grid grid-cols-3 gap-3 text-center">
                                <div data-stagger-item className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
                                    <div className="text-xl font-black text-blue-600">30p</div>
                                    <div className="text-[11px] text-gray-500 font-semibold mt-0.5">Thời lượng</div>
                                </div>
                                <div data-stagger-item className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
                                    <div className="text-xl font-black text-blue-600">100%</div>
                                    <div className="text-[11px] text-gray-500 font-semibold mt-0.5">Miễn phí</div>
                                </div>
                                <div data-stagger-item className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
                                    <div className="text-xl font-black text-blue-600">50+</div>
                                    <div className="text-[11px] text-gray-500 font-semibold mt-0.5">Đã triển khai</div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Demo Form */}
                        <div data-reveal="right" className="lg:col-span-7">
                            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-200/80 shadow-xl relative">
                                {submitted ? (
                                    <div className="py-12 text-center space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
                                            ✓
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900">Đăng Ký Thành Công!</h3>
                                        <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                                            Cảm ơn bạn đã quan tâm. Chuyên viên AEGISM sẽ liên hệ qua số điện thoại <strong>{formData.phone}</strong> trong vòng 2 giờ làm việc để xếp lịch hẹn thuận tiện nhất cho bạn.
                                        </p>
                                        <button
                                            onClick={() => setSubmitted(false)}
                                            className="mt-6 px-6 py-2.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-100 transition"
                                        >
                                            Gửi thêm yêu cầu khác
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-blue-600 text-xs font-bold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                            Đăng ký trực tuyến
                                        </span>
                                        <h3 className="text-2xl font-black text-gray-900 mt-3 mb-2">Đặt Lịch Xem Demo Trực Tiếp</h3>
                                        <p className="text-sm text-gray-500 mb-8">Vui lòng cung cấp thông tin để chúng tôi chuẩn bị kịch bản demo sát thực tế nhất.</p>

                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div>
                                                    <label htmlFor="fullname" className="block text-xs font-bold text-gray-700 mb-1.5">Họ và tên *</label>
                                                    <input type="text" id="fullname" required value={formData.fullname} onChange={e => setFormData({ ...formData, fullname: e.target.value })} placeholder="Nguyễn Văn A" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-600 outline-none text-sm" />
                                                </div>
                                                <div>
                                                    <label htmlFor="phone" className="block text-xs font-bold text-gray-700 mb-1.5">Số điện thoại *</label>
                                                    <input type="tel" id="phone" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="0905..." className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-600 outline-none text-sm" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div>
                                                    <label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-1.5">Email công việc *</label>
                                                    <input type="email" id="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="name@company.com" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-600 outline-none text-sm" />
                                                </div>
                                                <div>
                                                    <label htmlFor="company" className="block text-xs font-bold text-gray-700 mb-1.5">Tên đơn vị / Tòa nhà *</label>
                                                    <input type="text" id="company" required value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} placeholder="Công ty An ninh ABC" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-600 outline-none text-sm" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div>
                                                    <label htmlFor="teamSize" className="block text-xs font-bold text-gray-700 mb-1.5">Quy mô đội an ninh / bảo vệ</label>
                                                    <select id="teamSize" value={formData.teamSize} onChange={e => setFormData({ ...formData, teamSize: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-600 outline-none text-sm bg-white cursor-pointer">
                                                        <option value="under-10">Dưới 10 nhân sự</option>
                                                        <option value="10-50">Từ 10 - 50 nhân sự</option>
                                                        <option value="50-200">Từ 50 - 200 nhân sự</option>
                                                        <option value="over-200">Trên 200 nhân sự</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label htmlFor="goal" className="block text-xs font-bold text-gray-700 mb-1.5">Mục tiêu ưu tiên hàng đầu</label>
                                                    <select id="goal" value={formData.goal} onChange={e => setFormData({ ...formData, goal: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-600 outline-none text-sm bg-white cursor-pointer">
                                                        <option value="Tối ưu tuần tra QR & giảm gian lận">Chống gian lận tuần tra QR</option>
                                                        <option value="Giám sát vị trí Live GPS">Bản đồ vệ tinh giám sát GPS</option>
                                                        <option value="Báo cáo SLA nghiệm thu">Tự động hóa báo cáo cho CĐT</option>
                                                        <option value="Quản lý sự cố hiện trường">Báo cáo sự cố tức thời & SOS</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <span>Đang xử lý đăng ký...</span>
                                                ) : (
                                                    <>
                                                        <span>Xác nhận đăng ký Demo</span>
                                                        <HiOutlineArrowRight className="w-5 h-5" />
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RequestDemoPage;