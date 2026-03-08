import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    HiBars3,
    HiXMark,
    HiOutlineBuildingOffice2,
    HiOutlineRocketLaunch,
    HiOutlineUserGroup,
    HiOutlineGlobeAlt,
    HiOutlineFlag,
    HiOutlineEye,
    HiOutlineHeart,
    HiCheckCircle,
    HiShieldCheck
} from 'react-icons/hi2';

const AboutPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const colors = {
        primary: 'text-[#2563EB]',
        bgPrimary: 'bg-[#2563EB]',
        bgPrimaryHover: 'hover:bg-blue-700',
        dark: 'text-[#1F2937]',
        lightBg: 'bg-[#F9FAFB]',
    };

    const timelineEvents = [
        {
            year: "Giai đoạn 1",
            title: "Xây dựng nền tảng",
            desc: "Nghiên cứu thị trường và phát triển lõi công nghệ giám sát thời gian thực (Real-time Monitoring Core).",
        },
        {
            year: "Giai đoạn 2",
            title: "Ra mắt thị trường",
            desc: "Triển khai thí điểm thành công hệ thống tuần tra QR Code cho 10+ tòa nhà văn phòng tại Đà Nẵng.",
        },
        {
            year: "Giai đoạn 3",
            title: "Mở rộng hệ sinh thái",
            desc: "Tích hợp AI Camera và các thiết bị IoT, hoàn thiện giải pháp quản trị vận hành toàn diện.",
        },
        {
            year: "Tương lai",
            title: "Vươn tầm khu vực",
            desc: "Hướng tới mục tiêu trở thành nền tảng Security Tech số 1 Đông Nam Á.",
        }
    ];

    const coreValues = [
        {
            title: "Tiên phong Đổi mới",
            desc: "Không ngừng nghiên cứu và ứng dụng công nghệ mới nhất (AI, IoT) vào sản phẩm.",
            icon: <HiOutlineRocketLaunch className="h-8 w-8" />,
            style: "text-blue-600 bg-blue-50"
        },
        {
            title: "Cam kết Tin cậy",
            desc: "Bảo mật dữ liệu và sự ổn định hệ thống là ưu tiên hàng đầu trong mọi quyết định.",
            icon: <HiShieldCheck className="h-8 w-8" />,
            style: "text-green-600 bg-green-50"
        },
        {
            title: "Khách hàng là Trọng tâm",
            desc: "Lắng nghe, thấu hiểu và giải quyết triệt để nỗi đau của khách hàng.",
            icon: <HiOutlineHeart className="h-8 w-8" />,
            style: "text-red-600 bg-red-50"
        }
    ];

    const teamMembers = [
        {
            name: "Ban Lãnh Đạo",
            role: "Founder Team",
            bio: "Những chuyên gia với hơn 10 năm kinh nghiệm trong lĩnh vực Công nghệ & An ninh.",
            avatar: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
            name: "Đội ngũ Kỹ thuật",
            role: "Engineering Team",
            bio: "Tập hợp các kỹ sư Full-stack, DevOps và Mobile Developer tài năng.",
            avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
            name: "Khối Vận hành",
            role: "Operations & Support",
            bio: "Đội ngũ CSKH tận tâm, sẵn sàng hỗ trợ 24/7 để đảm bảo hệ thống luôn ổn định.",
            avatar: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        }
    ];

    return (
        <div className="bg-white text-gray-800 font-sans">
            <main>
                <section className="relative py-20 lg:py-28 bg-white overflow-hidden">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="text-center max-w-4xl mx-auto">
                            <h1 className={`text-4xl md:text-6xl font-extrabold ${colors.dark} tracking-tight leading-tight mb-6`}>
                                Chúng tôi là <span className="text-blue-600">AEGISM</span>
                            </h1>
                            <p className="text-xl text-gray-500 leading-relaxed mb-10">
                                Nền tảng công nghệ tiên phong giúp doanh nghiệp số hóa quy trình
                                <span className="font-semibold text-gray-700"> Giám sát An ninh</span> và
                                <span className="font-semibold text-gray-700"> Quản lý Vận hành</span>.
                                <br className="hidden md:block" /> Đơn giản, Hiệu quả và Minh bạch.
                            </p>
                        </div>
                        <div className="mt-10 relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                            <img
                                src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"
                                alt="Văn phòng làm việc hiện đại"
                                className="w-full h-[400px] md:h-[500px] object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent flex items-end justify-center pb-10">
                                <p className="text-white/90 text-lg font-medium tracking-wide">Kiến tạo giải pháp từ Đà Nẵng, Việt Nam</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20 bg-gray-50">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="relative order-2 md:order-1">
                                <div className="absolute inset-0 bg-blue-600 rounded-2xl -rotate-3 opacity-10"></div>
                                <img
                                    src="../img/img_about_us.png"
                                    alt="Sứ mệnh & Tầm nhìn"
                                    className="relative rounded-2xl shadow-xl w-full object-cover"
                                />
                            </div>
                            <div className="space-y-8 order-1 md:order-2">
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><HiOutlineFlag className="w-6 h-6" /></div>
                                        <h3 className="text-2xl font-bold text-gray-900">Sứ mệnh</h3>
                                    </div>
                                    <p className="text-gray-600 text-lg leading-relaxed">
                                        Cung cấp giải pháp công nghệ toàn diện, giúp doanh nghiệp chuyển đổi số quy trình an ninh một cách dễ dàng, minh bạch và hiệu quả.
                                    </p>
                                </div>
                                <hr className="border-gray-200" />
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><HiOutlineEye className="w-6 h-6" /></div>
                                        <h3 className="text-2xl font-bold text-gray-900">Tầm nhìn</h3>
                                    </div>
                                    <p className="text-gray-600 text-lg leading-relaxed">
                                        Trở thành nền tảng quản lý vận hành & an ninh số 1 tại Việt Nam, vươn tầm khu vực Đông Nam Á vào năm 2028.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20 bg-[#1e293b] text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                            <div className="lg:w-1/2">
                                <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 border border-blue-400 text-blue-300 text-xs font-bold uppercase tracking-wider mb-6">
                                    Đối tác chiến lược
                                </span>
                                <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                                    Sức mạnh cộng hưởng cùng <br />
                                    <span className="text-blue-400">Đại Sơn Long</span>
                                </h2>
                                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                                    Sự kết hợp giữa nền tảng công nghệ hiện đại của AEGISM và kinh nghiệm vận hành thực chiến dày dặn của Đại Sơn Long. Chúng tôi cam kết mang đến giải pháp an ninh tối ưu nhất cho khách hàng.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        "Chuẩn hóa quy trình vận hành",
                                        "Am hiểu thị trường Việt Nam",
                                        "Công nghệ giám sát 24/7",
                                        "Đội ngũ phản ứng nhanh"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <HiCheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                            <span className="text-gray-200 text-sm font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:w-1/2 w-full">
                                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-700 group">
                                    <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                    <img
                                        src="/img/argism_contract.png"
                                        alt="Lễ ký kết hợp tác chiến lược"
                                        className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                                        onError={(e) => e.currentTarget.src = 'https://placehold.co/600x400/1e3a8a/FFFFFF?text=Strategic+Partnership'}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-white">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className={`text-3xl font-extrabold ${colors.dark}`}>Giá trị cốt lõi</h2>
                            <p className="mt-4 text-gray-500">Kim chỉ nam cho mọi hành động của chúng tôi</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {coreValues.map((val, idx) => (
                                <div key={idx} className="group bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all duration-300">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${val.style}`}>
                                        {val.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{val.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{val.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- 5. TIMELINE (ROADMAP) --- */}
                <section className="py-24 bg-gray-50 overflow-hidden">
                    <div className="container mx-auto max-w-4xl px-4">
                        <div className="text-center mb-16">
                            <h2 className={`text-3xl font-extrabold ${colors.dark}`}>Lộ trình phát triển</h2>
                            <p className="mt-4 text-gray-500">Hành trình nỗ lực không ngừng nghỉ</p>
                        </div>

                        <div className="relative space-y-12">
                            {/* The Line */}
                            <div className="absolute top-0 bottom-0 left-6 md:left-1/2 w-0.5 bg-gray-200 transform md:-translate-x-1/2"></div>

                            {timelineEvents.map((event, idx) => (
                                <div key={idx} className={`relative flex items-center md:justify-between w-full group`}>

                                    {/* The Dot */}
                                    <div className="absolute left-6 md:left-1/2 w-4 h-4 bg-white border-4 border-blue-600 rounded-full z-10 transform -translate-x-1/2 shadow-sm group-hover:scale-125 transition-transform duration-300"></div>

                                    {/* Spacer */}
                                    <div className={`hidden md:block w-5/12 ${idx % 2 === 0 ? 'order-2' : 'order-1'}`}></div>

                                    {/* Content Card */}
                                    <div className={`w-full pl-16 md:pl-0 md:w-5/12 ${idx % 2 === 0 ? 'md:text-right md:pr-12 order-1' : 'md:text-left md:pl-12 order-2'}`}>
                                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-md group-hover:border-blue-200 transition-all duration-300">
                                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2">{event.year}</span>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                                {event.title}
                                            </h3>
                                            <p className="text-gray-600 text-sm leading-relaxed">{event.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- 6. TEAM SECTION --- */}
                <section className="py-24 bg-white">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className={`text-3xl font-extrabold ${colors.dark}`}>Đội ngũ chuyên gia</h2>
                            <p className="mt-4 text-gray-500">Những người đứng sau sự thành công của AEGISM</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {teamMembers.map((member, idx) => (
                                <div key={idx} className="group relative overflow-hidden rounded-2xl cursor-pointer shadow-lg">
                                    <img
                                        src={member.avatar}
                                        alt={member.name}
                                        className="w-full h-96 object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-90"></div>
                                    <div className="absolute bottom-0 left-0 p-8 w-full">
                                        <h3 className="text-2xl font-bold text-white mb-1">{member.name}</h3>
                                        <p className="text-blue-300 font-medium text-sm mb-3 uppercase tracking-wider">{member.role}</p>
                                        <p className="text-gray-300 text-sm border-t border-gray-600 pt-3 mt-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                            {member.bio}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-gray-50 py-20 border-t border-gray-100">
                    <div className="container mx-auto max-w-4xl text-center px-4">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Sẵn sàng chuyển đổi số cùng AEGISM?</h2>
                        <div className="flex justify-center gap-4">
                            <Link to="/contact" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">Liên hệ hợp tác</Link>
                            <Link to="/features" className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition">Xem tính năng</Link>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default AboutPage;