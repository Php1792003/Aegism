import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    HiEye,
    HiEyeSlash,
    HiCheckCircle
} from 'react-icons/hi2';

const colors = {
    primary: 'text-[#2563EB]',
    bgPrimary: 'bg-[#2563EB]',
    bgPrimaryHover: 'hover:bg-blue-700',
    dark: 'text-[#1F2937]',
    inputBg: 'bg-[#F3F4F6]',
    borderError: 'border-red-500 focus:ring-red-500',
    borderNormal: 'border-gray-300 focus:ring-[#2563EB]',
};

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'http://52.220.122.42:3000';

const RegisterPage = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        companyName: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.fullname.trim()) newErrors.fullname = "Họ và tên là bắt buộc.";
        if (!formData.companyName.trim()) newErrors.companyName = "Tên công ty là bắt buộc.";

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) newErrors.email = "Email là bắt buộc.";
        else if (!emailRegex.test(formData.email)) newErrors.email = "Email không đúng định dạng.";

        const passwordRegex = /^(?=.*[A-Z])(?=.*[\W_]).{6,}$/;
        if (!formData.password) newErrors.password = "Mật khẩu là bắt buộc.";
        else if (!passwordRegex.test(formData.password)) newErrors.password = "Mật khẩu yếu (Cần chữ hoa, ký tự đặc biệt, min 6 ký tự).";

        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullname,
                    companyName: formData.companyName,
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    setErrors(prev => ({ ...prev, email: "Email này đã được sử dụng." }));
                } else {
                    alert(data.message || "Đăng ký thất bại. Vui lòng thử lại.");
                }
                return;
            }

            setShowSuccessModal(true);

        } catch (error) {
            console.error("Lỗi mạng:", error);
            alert("Không thể kết nối đến máy chủ. Hãy kiểm tra Backend.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 font-sans bg-white">

            <div className="flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-md">
                    <div className="flex items-center mb-10">
                        <Link to="/">
                            <img src="/img/aegism_logo_mini.png" alt="Logo AEGISM" className="h-[30px] w-auto" />
                        </Link>
                    </div>

                    <h1 className={`text-3xl font-extrabold ${colors.dark}`}>Bắt đầu với AEGISM</h1>
                    <p className="mt-2 text-base text-gray-600">
                        Tạo tài khoản để tối ưu hóa vận hành và giám sát an ninh.
                    </p>

                    <div className="mt-8">
                        <form className="space-y-6" onSubmit={handleSubmit}>

                            <div>
                                <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-2">Họ và Tên</label>
                                <input
                                    id="fullname" name="fullname" type="text"
                                    value={formData.fullname} onChange={handleChange}
                                    className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${errors.fullname ? colors.borderError : colors.borderNormal}`}
                                    placeholder="Nhập họ và tên của bạn"
                                />
                                {errors.fullname && <p className="mt-1 text-sm text-red-600">{errors.fullname}</p>}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ Email</label>
                                <input
                                    id="email" name="email" type="email"
                                    value={formData.email} onChange={handleChange}
                                    className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${errors.email ? colors.borderError : colors.borderNormal}`}
                                    placeholder="Nhập địa chỉ email"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <div>
                                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">Tên Công ty / Tổ chức</label>
                                <input
                                    id="companyName" name="companyName" type="text"
                                    value={formData.companyName} onChange={handleChange}
                                    className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${errors.companyName ? colors.borderError : colors.borderNormal}`}
                                    placeholder="Ví dụ: Công ty AEGISM"
                                />
                                {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
                                <div className="relative">
                                    <input
                                        id="password" name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password} onChange={handleChange}
                                        className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${errors.password ? colors.borderError : colors.borderNormal}`}
                                        placeholder="Tạo mật khẩu của bạn"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                                    >
                                        {showPassword ? <HiEyeSlash className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                <p className="mt-1 text-xs text-gray-500">Tối thiểu 6 ký tự, 1 chữ hoa, 1 ký tự đặc biệt.</p>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Nhập lại Mật khẩu</label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword" name="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.confirmPassword} onChange={handleChange}
                                        className={`block w-full px-4 py-3 bg-white border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${errors.confirmPassword ? colors.borderError : colors.borderNormal}`}
                                        placeholder="Xác nhận mật khẩu"
                                    />
                                </div>
                                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white ${colors.bgPrimary} ${colors.bgPrimaryHover} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Đang xử lý...
                                        </div>
                                    ) : 'Tạo tài khoản'}
                                </button>
                            </div>

                            <p className="text-center text-sm text-gray-500">
                                Bằng việc đăng ký, bạn đồng ý với <Link to="#" className={`font-medium ${colors.primary} hover:text-blue-700`}>Điều khoản dịch vụ</Link> và <Link to="/policy" className={`font-medium ${colors.primary} hover:text-blue-700`}>Chính sách bảo mật</Link> của chúng tôi.
                            </p>
                        </form>
                    </div>

                    <p className="mt-10 text-center text-sm text-gray-600">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className={`font-medium ${colors.primary} hover:text-blue-700`}>
                            Đăng nhập ngay
                        </Link>
                    </p>
                </div>
            </div>

            <div className="hidden lg:block relative bg-gray-900">
                <div className="absolute inset-0 w-full h-full">
                    <img
                        src="/img/signup_bg.png"
                        alt="Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-60"></div>
                </div>
                <div className="absolute bottom-16 left-10 right-10 z-10">
                    <h2 className="text-3xl font-bold text-white">
                        Tối ưu vận hành. Giám sát an toàn.
                    </h2>
                    <p className="mt-3 text-lg text-gray-300 max-w-lg">
                        Nền tảng toàn diện giúp bạn quản lý hiệu quả và bảo vệ hệ thống một cách chủ động.
                    </p>
                </div>
            </div>

            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 p-4 animate-fade-in">
                    <div className="bg-white rounded-lg px-8 pt-8 pb-6 overflow-hidden shadow-xl transform transition-all sm:max-w-md sm:w-full">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                                <HiCheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Đăng ký thành công!
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        Chúc mừng bạn đã tạo tài khoản AEGISM thành công! Email xác nhận đã được gửi đến địa chỉ của bạn.
                                    </p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Vui lòng đăng nhập để bắt đầu trải nghiệm.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${colors.bgPrimary} text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm`}
                            >
                                Đăng nhập ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegisterPage;