import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('accessToken');

    const goHome = () => {
        if (token) navigate('/dashboard');
        else navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
            <div className="text-center max-w-lg w-full">
                {/* Animated 404 */}
                <div className="relative mb-8">
                    <div className="text-[160px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-blue-400 leading-none select-none">
                        404
                    </div>
                    <div className="absolute inset-0 text-[160px] font-black text-blue-500/10 blur-xl leading-none select-none">
                        404
                    </div>
                </div>

                {/* Icon */}
                <div className="w-20 h-20 bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                {/* Text */}
                <h1 className="text-2xl font-bold text-white mb-3">Trang không tồn tại</h1>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.<br />
                    Hãy kiểm tra lại đường dẫn hoặc quay về trang chủ.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={goHome}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Về trang chủ
                    </button>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-200 border border-gray-700"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Quay lại
                    </button>
                </div>

                {/* Brand */}
                <p className="mt-12 text-xs text-gray-600 font-medium tracking-widest uppercase">
                    Powered by AEGISM Platform
                </p>
            </div>
        </div>
    );
};

export default NotFoundPage;
