import React from 'react';
import { Link } from 'react-router-dom';
import { HiShieldCheck, HiLockClosed, HiEye, HiChevronRight } from 'react-icons/hi2';
import SEO from '../components/SEO';
import { BreadcrumbSchema } from '../components/StructuredData';

const PolicyPage = () => {
    return (
        <div className="bg-gradient-to-b from-gray-50 to-white font-sans text-gray-800 py-16 px-4 sm:px-6 lg:px-8">
            <SEO
                title="Chính sách bảo mật - AEGISM"
                description="Chính sách bảo mật và quyền riêng tư của AEGISM. Cam kết bảo vệ dữ liệu người dùng theo tiêu chuẩn bảo mật quốc tế."
                url="/policy"
                keywords="chính sách bảo mật AEGISM, quyền riêng tư, bảo vệ dữ liệu"
            />
            <BreadcrumbSchema items={[{ name: 'Trang chủ', url: '/' }, { name: 'Chính sách bảo mật', url: '/policy' }]} />
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex p-3 bg-indigo-50 rounded-full text-[#4F46E5] mb-4">
                        <HiShieldCheck className="w-10 h-10 animate-pulse" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                        Chính sách Bảo mật
                    </h1>
                    <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
                        AEGISM cam kết bảo vệ thông tin và quyền riêng tư của bạn. Dưới đây là cách chúng tôi thu thập, sử dụng và bảo mật dữ liệu của bạn.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">Cập nhật lần cuối: Ngày 25 tháng 5 năm 2026</p>
                </div>

                {/* Content Sections */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden p-8 sm:p-12 space-y-10">
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-lg font-bold text-gray-900">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-[#4F46E5] font-extrabold">1</span>
                            <h2>Thông tin chúng tôi thu thập</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed pl-11">
                            Để cung cấp dịch vụ tốt nhất trên nền tảng AEGISM, chúng tôi thu thập thông tin khi bạn đăng ký tài khoản, cấu hình công ty, hoặc thực hiện các hoạt động quét mã QR và điểm tuần tra. Các thông tin bao gồm:
                        </p>
                        <ul className="list-disc pl-16 space-y-2 text-gray-600">
                            <li>Thông tin tài khoản: Họ tên, Email, số điện thoại, mật khẩu mã hóa.</li>
                            <li>Dữ liệu tổ chức (Tenant): Tên công ty, gói đăng ký, số lượng nhân sự, thông tin thanh toán.</li>
                            <li>Dữ liệu vận hành: Tên dự án, lịch trình tuần tra, lịch sử quét mã QR, dữ liệu thiết bị thực hiện thao tác.</li>
                        </ul>
                    </section>

                    <div className="border-t border-gray-100 my-8"></div>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-lg font-bold text-gray-900">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-[#4F46E5] font-extrabold">2</span>
                            <h2>Cách chúng tôi sử dụng thông tin</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed pl-11">
                            Chúng tôi cam kết sử dụng thông tin thu thập được đúng mục đích phục vụ khách hàng và cải tiến dịch vụ:
                        </p>
                        <ul className="list-disc pl-16 space-y-2 text-gray-600">
                            <li>Vận hành nền tảng: Xác thực người dùng, định tuyến quyền hạn theo phân vai trò (Admin, Nhân viên).</li>
                            <li>Cải tiến chất lượng: Theo dõi hiệu suất quét mã, xuất báo cáo thống kê hoạt động, đề xuất tối ưu hóa quy trình thông qua AI.</li>
                            <li>Hỗ trợ & Thông báo: Liên hệ khi có thông báo về thời hạn đăng ký, bảo mật tài khoản hoặc thay đổi dịch vụ.</li>
                        </ul>
                    </section>

                    <div className="border-t border-gray-100 my-8"></div>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-lg font-bold text-gray-900">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-[#4F46E5] font-extrabold">3</span>
                            <h2>Bảo mật dữ liệu của bạn</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed pl-11">
                            AEGISM áp dụng các biện pháp bảo mật cấp doanh nghiệp nghiêm ngặt nhất để ngăn chặn rò rỉ dữ liệu:
                        </p>
                        <div className="pl-11 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                                <HiLockClosed className="w-5 h-5 text-[#4F46E5] mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">Mã hóa nâng cao</h4>
                                    <p className="text-xs text-gray-500 mt-1">Tất cả mật khẩu và dữ liệu truyền tải đều được mã hóa bằng thuật toán SSL/TLS và bcrypt.</p>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                                <HiEye className="w-5 h-5 text-[#4F46E5] mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">Giám sát & Chặn IP xấu</h4>
                                    <p className="text-xs text-gray-500 mt-1">Hệ thống Firewall tự động phát hiện và chặn đứng các truy cập xâm phạm chính sách bảo mật.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="border-t border-gray-100 my-8"></div>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-lg font-bold text-gray-900">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-[#4F46E5] font-extrabold">4</span>
                            <h2>Chia sẻ thông tin với bên thứ ba</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed pl-11">
                            Chúng tôi <strong>TUYỆT ĐỐI KHÔNG</strong> mua bán, trao đổi hoặc cho bên thứ ba thuê thông tin cá nhân hay dữ liệu doanh nghiệp của bạn. Thông tin thanh toán (như thẻ tín dụng, chuyển khoản qua mã QR ngân hàng) được xử lý trực tiếp bởi các cổng thanh toán an toàn đối tác của chúng tôi (PayOS, VNPay) tuân thủ tiêu chuẩn PCI-DSS toàn cầu.
                        </p>
                    </section>

                    <div className="border-t border-gray-100 my-8"></div>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-lg font-bold text-gray-900">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-[#4F46E5] font-extrabold">5</span>
                            <h2>Quyền của bạn đối với dữ liệu</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed pl-11">
                            Bạn luôn có toàn quyền kiểm soát dữ liệu của mình. Bạn có thể yêu cầu xem, sửa đổi hoặc xóa tài khoản cá nhân thông qua trung tâm cài đặt tài khoản. Đối với yêu cầu xóa vĩnh viễn dữ liệu doanh nghiệp (Tenant), quản trị viên có thể liên hệ trực tiếp với bộ phận chăm sóc khách hàng của AEGISM để được xử lý.
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

export default PolicyPage;
