import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [step, setStep] = useState<1 | 2>(1);
    
    // Step 1 states
    const [email, setEmail] = useState('');
    
    // Step 2 states
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const navigate = useNavigate();

    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000'
        : 'https://api.aegism.online';

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
            setSuccessMsg(response.data.message || 'Mã OTP đã được gửi đến email của bạn.');
            setStep(2);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
                email,
                otp,
                newPassword
            });

            setSuccessMsg(response.data.message || 'Đổi mật khẩu thành công. Đang chuyển hướng...');
            
            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng kiểm tra lại mã OTP.');
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
                            <img
                                src="/img/aegism_logo_mini.png"
                                alt="Logo AEGISM"
                                className="h-[29px] w-auto"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        </div>
                        <div className="mt-auto">
                            <h2 className="text-3xl font-bold">Khôi phục truy cập</h2>
                            <p className="mt-3 text-lg text-gray-300 max-w-lg">
                                Đừng lo lắng, chúng tôi sẽ giúp bạn lấy lại mật khẩu để tiếp tục quản lý an ninh hiệu quả.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: FORM */}
                <div className="flex flex-col justify-center py-12 px-4 sm:px-12 lg:px-16">
                    <div className="mx-auto w-full max-w-md">
                        <Link to="/login" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 mb-6 transition-colors">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            Quay lại đăng nhập
                        </Link>
                        
                        <h1 className="text-3xl font-extrabold text-gray-800">Quên mật khẩu</h1>
                        <p className="mt-2 text-base text-gray-600">
                            {step === 1 ? 'Nhập email của bạn để nhận mã khôi phục.' : 'Nhập mã OTP được gửi đến email và mật khẩu mới.'}
                        </p>

                        {/* Thông báo lỗi & thành công */}
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center animate-pulse">
                                <span className="font-medium mr-1">Lỗi:</span> {error}
                            </div>
                        )}
                        {successMsg && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {successMsg}
                            </div>
                        )}

                        {step === 1 ? (
                            <form className="mt-8 space-y-6" onSubmit={handleSendOtp}>
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

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading || !email}
                                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white 
                                        ${(loading || !email) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} 
                                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors`}
                                    >
                                        {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form className="mt-8 space-y-5" onSubmit={handleResetPassword}>
                                <div>
                                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">Mã OTP (6 chữ số)</label>
                                    <input
                                        id="otp"
                                        type="text"
                                        required
                                        maxLength={6}
                                        className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition text-center tracking-widest font-mono text-xl"
                                        placeholder="------"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
                                    <div className="relative">
                                        <input
                                            id="newPassword"
                                            type={showPass ? "text" : "password"}
                                            required
                                            minLength={6}
                                            className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showPass ? 'Ẩn' : 'Hiện'}
                                        </button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu</label>
                                    <div className="relative">
                                        <input
                                            id="confirmPassword"
                                            type={showPass ? "text" : "password"}
                                            required
                                            minLength={6}
                                            className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading || !otp || !newPassword || !confirmPassword}
                                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white 
                                        ${(loading || !otp || !newPassword || !confirmPassword) ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} 
                                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-colors`}
                                    >
                                        {loading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
