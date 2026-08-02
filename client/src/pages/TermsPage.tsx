import React from 'react';
import { Link } from 'react-router-dom';
import { HiDocumentText, HiCheckCircle, HiExclamationTriangle, HiChevronRight } from 'react-icons/hi2';
import SEO from '../components/SEO';
import { BreadcrumbSchema } from '../components/StructuredData';

const TermsPage = () => {
    return (
        <div className="bg-gradient-to-b from-gray-50 to-white font-sans text-gray-800 py-16 px-4 sm:px-6 lg:px-8">
            <SEO
                title="Điều khoản sử dụng - AEGISM"
                description="Điều khoản và điều kiện sử dụng dịch vụ AEGISM. Quy định về quyền và nghĩa vụ của người dùng khi sử dụng nền tảng."
                url="/terms"
                keywords="điều khoản sử dụng AEGISM, điều kiện dịch vụ, quy định sử dụng"
            />
            <BreadcrumbSchema items={[{ name: 'Trang chủ', url: '/' }, { name: 'Điều khoản sử dụng', url: '/terms' }]} />
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex p-3 bg-indigo-50 rounded-full text-[#4F46E5] mb-4">
                        <HiDocumentText className="w-10 h-10 animate-pulse" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                        Điều khoản Dịch vụ
                    </h1>
                    <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
                        Chào mừng bạn đến với AEGISM. Bằng việc truy cập hoặc sử dụng hệ thống, bạn đồng ý tuân thủ các điều khoản và điều kiện được quy định dưới đây.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">Cập nhật lần cuối: Ngày 25 tháng 5 năm 2026</p>
                </div>

                {/* Content Sections */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden p-8 sm:p-12 space-y-10">
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-lg font-bold text-gray-900">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-[#4F46E5] font-extrabold">1</span>
                            <h2>Định nghĩa & Chấp nhận điều khoản</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed pl-11">
                            AEGISM là giải pháp SaaS cung cấp dịch vụ quản lý vận hành dự án, điểm quét mã QR, theo dõi nhân sự, báo cáo thống kê và bảo mật hệ thống. Điều khoản này áp dụng cho mọi cá nhân, doanh nghiệp đăng ký sử dụng tài khoản (bao gồm Super Admin, Quản trị viên chi nhánh và Nhân viên).
                        </p>
                    </section>

                    <div className="border-t border-gray-100 my-8"></div>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-lg font-bold text-gray-900">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-[#4F46E5] font-extrabold">2</span>
                            <h2>Đăng ký & Quản lý tài khoản</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed pl-11">
                            Để sử dụng đầy đủ chức năng, bạn cần đăng ký một tài khoản hợp lệ. Bạn cam kết cung cấp thông tin trung thực, chính xác và tự chịu trách nhiệm bảo mật thông tin đăng nhập của mình.
                        </p>
                        <div className="pl-11 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                                <HiCheckCircle className="w-5 h-5 text-[#4F46E5] mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">Giới hạn theo gói đăng ký</h4>
                                    <p className="text-xs text-gray-500 mt-1">Các gói dịch vụ (Starter, Business, Enterprise) đi kèm giới hạn số lượng dự án, điểm quét và nhân sự tối đa trong hệ thống.</p>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                                <HiExclamationTriangle className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">Chính sách Khóa tài khoản</h4>
                                    <p className="text-xs text-gray-500 mt-1">Tài khoản vi phạm chính sách bảo mật, spam mã QR, hoặc chậm trễ gia hạn phí dịch vụ có thể bị tạm khóa hoặc đình chỉ hoạt động.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="border-t border-gray-100 my-8"></div>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-lg font-bold text-gray-900">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-[#4F46E5] font-extrabold">3</span>
                            <h2>Thanh toán & Hoàn phí</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed pl-11">
                            AEGISM cung cấp các gói dịch vụ trả phí định kỳ theo tháng hoặc theo năm. Giá của các gói dịch vụ được hiển thị công khai trên trang bảng giá. 
                        </p>
                        <ul className="list-disc pl-16 space-y-2 text-gray-600">
                            <li><strong>Hủy dịch vụ:</strong> Bạn có thể hủy gói dịch vụ trả phí bất kỳ lúc nào để ngừng gia hạn cho chu kỳ tiếp theo.</li>
                            <li><strong>Hoàn tiền:</strong> Chính sách hỗ trợ hoàn tiền trong vòng 14 ngày đầu sử dụng nếu phát hiện lỗi hệ thống nghiêm trọng mà không thể khắc phục được.</li>
                        </ul>
                    </section>

                    <div className="border-t border-gray-100 my-8"></div>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-lg font-bold text-gray-900">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-[#4F46E5] font-extrabold">4</span>
                            <h2>Trách nhiệm pháp lý & Cam kết chất lượng</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed pl-11">
                            Chúng tôi nỗ lực duy trì tính khả dụng của nền tảng ở mức cao nhất (&gt;99.9% Uptime). Tuy nhiên, AEGISM không chịu trách nhiệm đối với các tổn thất gián tiếp phát sinh từ sự cố mạng internet khu vực, hỏng hóc phần cứng thiết bị của bạn hoặc hành động cố ý gian lận báo cáo quét mã từ phía nhân sự của doanh nghiệp.
                        </p>
                    </section>
                </div>

                {/* Back Link */}
                <div className="mt-8 text-center">
                    <Link to="/" className="inline-flex items-center text-[#4F46E5] hover:text-indigo-700 font-bold transition-colors">
                        Quay lại trang chủ <HiChevronRight className="w-5 h-5 ml-1" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TermsPage;
