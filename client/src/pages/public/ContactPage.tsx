import React, { useState } from 'react';
import SEO from '@/components/seo/SEO';
import { BreadcrumbSchema, LocalBusinessSchema } from '@/components/seo/StructuredData';
import { usePageAnimations } from '@/hooks/useGsap';
import { SplitWords } from '@/components/ui/SplitWords';
import {
    HiEnvelope,
    HiPhone,
    HiMapPin,
    HiClock,
    HiPaperAirplane,
    HiShieldCheck,
    HiOutlineSparkles,
    HiCheckCircle
} from 'react-icons/hi2';

const ContactPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: 'tu-van', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalState, setModalState] = useState<{ isOpen: boolean; type: 'success' | 'error'; message: string }>({ isOpen: false, type: 'success', message: '' });

    const root = usePageAnimations<HTMLDivElement>();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('https://api.aegism.online/api/emails/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: formData.email,
                    to: 'contact@aegism.online',
                    subject: `[Liên hệ Website] ${formData.name} - ${formData.subject.toUpperCase()}`,
                    raw: `Họ tên: ${formData.name}\nEmail: ${formData.email}\nSố điện thoại: ${formData.phone}\nVấn đề: ${formData.subject}\n\nNội dung:\n${formData.message}`,
                }),
            });

            if (response.ok) {
                setModalState({ isOpen: true, type: 'success', message: 'Cảm ơn bạn đã liên hệ! Đội ngũ chuyên viên AEGISM sẽ phản hồi trong vòng 2 giờ làm việc.' });
                setFormData({ name: '', email: '', phone: '', subject: 'tu-van', message: '' });
            } else {
                setModalState({ isOpen: true, type: 'error', message: 'Lỗi gửi yêu cầu. Vui lòng thử lại hoặc gọi trực tiếp Hotline!' });
            }
        } catch {
            setModalState({ isOpen: true, type: 'error', message: 'Lỗi gửi yêu cầu. Vui lòng thử lại hoặc gọi trực tiếp Hotline!' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div ref={root} className="overflow-x-clip bg-white text-gray-900 font-sans selection:bg-blue-600 selection:text-white">
            <SEO
                title="Liên Hệ AEGISM - Tư Vấn & Hỗ Trợ Kỹ Thuật 24/7"
                description="Liên hệ với đội ngũ chuyên gia AEGISM tại Đà Nẵng để được tư vấn giải pháp quản lý an ninh tòa nhà và nhận báo giá triển khai chi tiết."
                url="/contact"
                keywords="liên hệ AEGISM, hotline AEGISM, hỗ trợ kỹ thuật an ninh, địa chỉ AEGISM Đà Nẵng"
            />
            <LocalBusinessSchema />
            <BreadcrumbSchema items={[{ name: 'Trang chủ', url: '/' }, { name: 'Liên hệ', url: '/contact' }]} />

            {/* Scroll progress bar */}
            <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1">
                <div data-progress className="h-full origin-left scale-x-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400" />
            </div>

            <main>
                {/* --- HERO BANNER --- */}
                <section className="pt-14 pb-16 bg-gradient-to-b from-blue-50/60 via-white to-white dark:from-slate-900/60 dark:via-[#070d18] dark:to-[#070d18] transition-colors">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                        <div data-hero-entrance="badge" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6">
                            <HiOutlineSparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span>Đội ngũ tư vấn sẵn sàng hỗ trợ</span>
                        </div>

                        <h1 data-hero-entrance="title" className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.15]">
                            <SplitWords text="Kết Nối Trực Tiếp Với" />
                            <br />
                            <SplitWords
                                text="Đội Ngũ AEGISM"
                                innerClassName="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 dark:from-blue-400 dark:via-cyan-300 dark:to-sky-300 bg-clip-text text-transparent"
                            />
                        </h1>

                        <p data-hero-entrance="desc" className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                            Chúng tôi luôn sẵn sàng lắng nghe mọi thắc mắc và đồng hành cùng doanh nghiệp của bạn trong quá trình số hóa quản lý an ninh.
                        </p>
                    </div>
                </section>

                {/* --- CONTENT & FORM SECTION --- */}
                <section className="pb-24">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                            {/* LEFT COLUMN: Contact Cards & Map */}
                            <div data-reveal="left" className="lg:col-span-5 space-y-6">
                                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Thông Tin Liên Hệ Trực Tiếp</h3>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                                            <HiPhone className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Hotline tư vấn 24/7</p>
                                            <a href="tel:0905441263" className="text-lg font-black text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition">
                                                (+84) 905 441 263
                                            </a>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Hỗ trợ khẩn cấp cả ngày lễ & chủ nhật</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                                            <HiEnvelope className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Email tiếp nhận yêu cầu</p>
                                            <a href="mailto:support@aegism.online" className="text-base font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition">
                                                support@aegism.online
                                            </a>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Phản hồi trong vòng 2 giờ làm việc</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center flex-shrink-0">
                                            <HiMapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Trụ sở phát triển</p>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                                                36 Cẩm Bắc 11, Phường Hòa Thọ Đông, Quận Cẩm Lệ, TP. Đà Nẵng, Việt Nam
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 border-t border-gray-100 dark:border-slate-800 pt-5">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                                            <HiClock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Thời gian làm việc</p>
                                            <p className="text-xs text-gray-700 dark:text-slate-300 font-medium">Thứ 2 - Thứ 6: 08:00 - 17:30</p>
                                            <p className="text-xs text-gray-700 dark:text-slate-300 font-medium">Thứ 7: 08:00 - 12:00</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Map Widget */}
                                <div data-reveal="scale" className="bg-white dark:bg-slate-900 p-2.5 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-sm overflow-hidden h-64">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.646894356612!2d108.2195!3d16.0321!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c792252a13%3A0x123456789!2zMzYgQ-G6qW0gQuG6r2MgMTEsIEPhuqltIEzhu4csIMSQw6CgTuG6tW5n!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                        className="rounded-2xl"
                                        title="Bản đồ chỉ dẫn văn phòng AEGISM Đà Nẵng"
                                    />
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Inquiry Form */}
                            <div data-reveal="right" className="lg:col-span-7">
                                <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-lg relative">
                                    <span className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                                        Gửi thư trực tuyến
                                    </span>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-3 mb-2">Để Lại Tin Nhắn Cho Chúng Tôi</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Điền thông tin vào mẫu bên dưới, chuyên viên phụ trách sẽ liên hệ lại với bạn sớm nhất.</p>

                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label htmlFor="name" className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">Họ và tên *</label>
                                                <input type="text" id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nguyễn Văn A" className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-600 outline-none text-sm" />
                                            </div>
                                            <div>
                                                <label htmlFor="email" className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">Email công việc *</label>
                                                <input type="email" id="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@company.com" className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-600 outline-none text-sm" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label htmlFor="phone" className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">Số điện thoại *</label>
                                                <input type="tel" id="phone" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="0905..." className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-600 outline-none text-sm" />
                                            </div>
                                            <div>
                                                <label htmlFor="subject" className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">Nhu cầu của bạn</label>
                                                <select id="subject" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-600 outline-none text-sm cursor-pointer">
                                                    <option value="tu-van">Tư vấn giải pháp tuần tra</option>
                                                    <option value="demo">Đăng ký xem Demo thực tế</option>
                                                    <option value="bao-gia">Nhận báo giá dự án</option>
                                                    <option value="ky-thuat">Hỗ trợ kỹ thuật / Tích hợp API</option>
                                                    <option value="khac">Khác</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="message" className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">Nội dung chi tiết</label>
                                            <textarea id="message" rows={4} value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} placeholder="Mô tả quy mô mục tiêu, số lượng bảo vệ hoặc yêu cầu đặc thù của bạn..." className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-600 outline-none text-sm resize-none" />
                                        </div>

                                        <button type="submit" disabled={isSubmitting} className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50">
                                            {isSubmitting ? (
                                                <span>Đang gửi thông tin...</span>
                                            ) : (
                                                <>
                                                    <span>Gửi yêu cầu tư vấn</span>
                                                    <HiPaperAirplane className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* FEEDBACK MODAL */}
            {modalState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 text-center shadow-2xl border border-gray-200 dark:border-slate-800">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${modalState.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'}`}>
                            {modalState.type === 'success' ? <HiCheckCircle className="w-10 h-10" /> : <HiShieldCheck className="w-10 h-10" />}
                        </div>
                        <h4 className="text-2xl font-black text-gray-900 dark:text-white">
                            {modalState.type === 'success' ? 'Gửi Thành Công!' : 'Có Lỗi Xảy Ra'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-slate-300 mt-2 mb-6 leading-relaxed">
                            {modalState.message}
                        </p>
                        <button
                            onClick={() => setModalState({ ...modalState, isOpen: false })}
                            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition"
                        >
                            Đã hiểu
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactPage;