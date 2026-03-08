import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const API_URL = 'https://api.aegism.online';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, {
                email,
                password
            });

            const data = response.data;

            // 1. Lưu Token & User vào LocalStorage
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('user', JSON.stringify(data.user));

            // 2. Xử lý gói dịch vụ (Tenant Plan)
            if (data.user.tenant && data.user.tenant.subscriptionPlan) {
                localStorage.setItem('userPlan', data.user.tenant.subscriptionPlan.toLowerCase());
            } else {
                localStorage.setItem('userPlan', 'starter');
            }

            // 3. Chuyển hướng
            // Nếu là SuperAdmin -> Vào trang Admin, ngược lại vào Dashboard thường
            if (data.user.isSuperAdmin) {
                navigate('/dashboard');
            } else {
                navigate('/dashboard');
            }

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.status === 401) {
                setError('Email hoặc mật khẩu không chính xác.');
            } else {
                setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-100 flex items-center justify-center min-h-screen p-4 font-sans">
            <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl grid grid-cols-1 lg:grid-cols-2 overflow-hidden">

                {/* CỘT TRÁI: HÌNH ẢNH & LOGO */}
                <div className="hidden lg:block relative p-12 bg-gray-900 text-white">
                    <div
                        className="absolute inset-0 w-full h-full object-cover opacity-100"
                        style={{
                            backgroundImage: "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80')",
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            maskImage: 'linear-gradient(to bottom, white 60%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, white 60%, transparent 100%)'
                        }}
                    ></div>

                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            {/* Logo Placeholder - Thay thế bằng file logo thật của bạn trong folder public/img */}
                            <img
                                src="/img/aegism_logo_mini.png"
                                alt="Logo AEGISM"
                                className="h-[29px] w-auto"
                                onError={(e) => {
                                    // Fallback nếu chưa có ảnh
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                        <div className="mt-auto">
                            <h2 className="text-3xl font-bold">An ninh Thông minh</h2>
                            <p className="mt-3 text-lg text-gray-300 max-w-lg">
                                Nền tảng giám sát an ninh và tối ưu hóa vận hành hàng đầu dành cho doanh nghiệp.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: FORM ĐĂNG NHẬP */}
                <div className="flex flex-col justify-center py-12 px-4 sm:px-12 lg:px-16">
                    <div className="mx-auto w-full max-w-md">
                        <h1 className="text-3xl font-extrabold text-gray-800">Đăng nhập</h1>
                        <p className="mt-2 text-base text-gray-600">Chào mừng quay trở lại hệ thống AEGISM.</p>

                        {/* Thông báo lỗi */}
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center animate-pulse">
                                <span className="font-medium mr-1">Lỗi:</span> {error}
                            </div>
                        )}

                        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                            {/* Email Input */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        className="block w-full pl-10 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <input
                                        id="password"
                                        type={showPass ? "text" : "password"}
                                        required
                                        className="block w-full pl-10 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {!showPass ? (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        ) : (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.054 10.054 0 01-3.77 4.58l3.057 3.057 3-3" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white 
                    ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors`}
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        'Đăng nhập'
                                    )}
                                </button>
                            </div>
                        </form>

                        <p className="mt-10 text-center text-sm text-gray-600">
                            Bạn chưa có tài khoản?{' '}
                            {/* Nếu bạn chưa làm trang register thì để #, còn nếu có rồi thì dùng Link */}
                            <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                                Đăng ký ngay
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;