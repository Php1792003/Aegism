import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    HiBars3,
    HiXMark,
    HiEnvelope,
    HiPhone,
    HiMapPin,
    HiChatBubbleLeftRight,
    HiClock,
    HiPaperAirplane
} from 'react-icons/hi2';

// --- CONFIG ---
const colors = {
    primary: 'text-[#2563EB]',
    bgPrimary: 'bg-[#2563EB]',
    bgPrimaryHover: 'hover:bg-blue-700',
    dark: 'text-[#1F2937]',
    lightBg: 'bg-[#F9FAFB]',
    border: 'border-gray-200',
};

const ContactPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // State cho Form
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: 'tu-van', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Giả lập gửi form
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            alert("Cảm ơn bạn! Chúng tôi đã nhận được tin nhắn.");
            setIsSubmitting(false);
            setFormData({ name: '', email: '', phone: '', subject: 'tu-van', message: '' });
        }, 1500);
    };

    return (
        <div className="bg-white text-gray-800 font-sans min-h-screen flex flex-col">
            <main className="flex-grow">
                <section className="bg-gray-50 py-16 md:py-24">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <span className="text-blue-600 font-semibold tracking-wider uppercase text-sm">Hỗ trợ 24/7</span>
                            <h1 className="mt-3 text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                                Kết nối với đội ngũ <span className="text-blue-600">AEGISM</span>
                            </h1>
                            <p className="mt-4 text-lg text-gray-500">
                                Chúng tôi luôn sẵn sàng lắng nghe. Dù bạn quan tâm đến bản Demo, báo giá hay cần hỗ trợ kỹ thuật, hãy gửi tin nhắn ngay bên dưới.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

                            {/* LEFT COLUMN: Contact Info & Support (Sticky) */}
                            <div className="lg:col-span-1 space-y-8">
                                {/* Info Card */}
                                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Thông tin liên hệ</h3>

                                    <div className="space-y-6">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                                <HiEnvelope className="w-5 h-5" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-900">Email Hỗ Trợ</p>
                                                <a href="mailto:support@aegism.com" className="text-base text-gray-600 hover:text-blue-600 transition">support@aegism.com</a>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                                <HiPhone className="w-5 h-5" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-900">Hotline Tư Vấn</p>
                                                <a href="tel:0905441263" className="text-base text-gray-600 hover:text-blue-600 transition">(+84) 905 441 263</a>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                                                <HiMapPin className="w-5 h-5" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-900">Văn phòng chính</p>
                                                <p className="text-base text-gray-600">36 Cẩm Bắc 11, Cẩm Lệ,<br />Đà Nẵng, Việt Nam</p>
                                            </div>
                                        </div>

                                        <hr className="border-gray-100" />

                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                                <HiClock className="w-5 h-5" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-900">Giờ làm việc</p>
                                                <p className="text-sm text-gray-600">Thứ 2 - Thứ 6: 08:00 - 17:30</p>
                                                <p className="text-sm text-gray-600">Thứ 7: 08:00 - 12:00</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Map Widget (Styled) */}
                                <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-100 overflow-hidden h-64">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.646894356612!2d108.2195!3d16.0321!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c792252a13%3A0x123456789!2zMzYgQ-G6qW0gQuG6r2MgMTEsIEPhuqltIEzhu4csIMSQw6CgTuG6tW5n!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                        className="rounded-xl"
                                        title="AEGISM Map"
                                    ></iframe>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: The Form */}
                            <div className="lg:col-span-2">
                                <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
                                    {/* Decorative Blob */}
                                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                                    <h2 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Gửi yêu cầu hỗ trợ</h2>
                                    <p className="text-gray-500 mb-8 relative z-10">Điền thông tin bên dưới, chúng tôi sẽ phản hồi trong vòng 2 giờ làm việc.</p>

                                    <form onSubmit={handleSubmit} className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Full Name */}
                                        <div className="col-span-1">
                                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên</label>
                                            <input
                                                type="text" id="name" required
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                                                placeholder="Nguyễn Văn A"
                                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>

                                        {/* Email */}
                                        <div className="col-span-1">
                                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email công việc</label>
                                            <input
                                                type="email" id="email" required
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                                                placeholder="name@company.com"
                                                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>

                                        {/* Phone */}
                                        <div className="col-span-1">
                                            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                                            <input
                                                type="tel" id="phone" required
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                                                placeholder="0905..."
                                                value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>

                                        {/* Subject Select */}
                                        <div className="col-span-1">
                                            <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">Vấn đề quan tâm</label>
                                            <div className="relative">
                                                <select
                                                    id="subject"
                                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none appearance-none cursor-pointer"
                                                    value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                                >
                                                    <option value="tu-van">Tư vấn giải pháp</option>
                                                    <option value="demo">Yêu cầu Demo</option>
                                                    <option value="bao-gia">Báo giá dịch vụ</option>
                                                    <option value="ky-thuat">Hỗ trợ kỹ thuật</option>
                                                    <option value="khac">Khác</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Message */}
                                        <div className="col-span-1 md:col-span-2">
                                            <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">Nội dung chi tiết</label>
                                            <textarea
                                                id="message" rows={5}
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none resize-none"
                                                placeholder="Hãy mô tả nhu cầu của bạn hoặc vấn đề bạn đang gặp phải..."
                                                value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })}
                                            ></textarea>
                                        </div>

                                        {/* Submit Button */}
                                        <div className="col-span-1 md:col-span-2 mt-4">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2
                                                    ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                        Đang gửi...
                                                    </>
                                                ) : (
                                                    <>
                                                        Gửi tin nhắn ngay <HiPaperAirplane />
                                                    </>
                                                )}
                                            </button>
                                            <p className="text-center text-xs text-gray-400 mt-4">
                                                Thông tin của bạn được bảo mật theo <Link to="#" className="underline hover:text-blue-500">Chính sách riêng tư</Link> của chúng tôi.
                                            </p>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section - Thêm phần này để tăng tính chuyên nghiệp */}
                <section className="bg-white py-20 border-t border-gray-100">
                    <div className="container mx-auto max-w-4xl px-4 text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-10">Câu hỏi thường gặp</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                            <div className="p-6 bg-gray-50 rounded-xl">
                                <h4 className="font-bold text-gray-900 mb-2">AEGISM có bản dùng thử không?</h4>
                                <p className="text-gray-600 text-sm">Có. Chúng tôi cung cấp gói Starter miễn phí trọn đời cho các đội nhóm nhỏ dưới 5 người.</p>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-xl">
                                <h4 className="font-bold text-gray-900 mb-2">Thời gian triển khai bao lâu?</h4>
                                <p className="text-gray-600 text-sm">Với hệ thống Cloud, bạn có thể bắt đầu ngay lập tức sau khi đăng ký tài khoản.</p>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-xl">
                                <h4 className="font-bold text-gray-900 mb-2">Tôi có thể yêu cầu tính năng riêng?</h4>
                                <p className="text-gray-600 text-sm">Được. Gói Enterprise cho phép tùy chỉnh tính năng và triển khai Server riêng theo nhu cầu.</p>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-xl">
                                <h4 className="font-bold text-gray-900 mb-2">Hỗ trợ kỹ thuật như thế nào?</h4>
                                <p className="text-gray-600 text-sm">Chúng tôi hỗ trợ qua Email, Zalo, và Hotline 24/7 đối với gói Business trở lên.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ContactPage;