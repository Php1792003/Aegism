import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('accessToken');

    const goHome = () => {
        if (token) navigate('/dashboard');
        else navigate('/');
    };

    const goBack = () => {
        window.history.back();
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex items-center justify-center px-4">
            <div className="max-w-4xl w-full flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16">

                {/* Illustration */}
                <div className="w-full lg:w-1/2 flex justify-center animate-[float_6s_ease-in-out_infinite]">
                    <svg className="w-72 h-72 lg:w-80 lg:h-80" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Background circle */}
                        <circle cx="200" cy="200" r="160" fill="#EBF5FF" />
                        <circle cx="200" cy="200" r="120" fill="#DBEAFE" />

                        {/* 404 Text */}
                        <text x="200" y="195" dominantBaseline="middle" textAnchor="middle" fontSize="110" fontWeight="900" fill="#2563EB" style={{ filter: 'drop-shadow(3px 3px 0px rgba(37,99,235,0.15))' }}>
                            404
                        </text>

                        {/* Disconnected cable left */}
                        <g>
                            <rect x="95" y="275" width="50" height="14" rx="4" fill="#6B7280" />
                            <rect x="140" y="272" width="8" height="20" rx="2" fill="#EF4444" />
                            <rect x="140" y="277" width="8" height="3" rx="1" fill="#FCA5A5" />
                        </g>

                        {/* Disconnected cable right */}
                        <g>
                            <rect x="255" y="275" width="50" height="14" rx="4" fill="#6B7280" />
                            <rect x="252" y="272" width="8" height="20" rx="2" fill="#EF4444" />
                            <rect x="252" y="277" width="8" height="3" rx="1" fill="#FCA5A5" />
                        </g>

                        {/* Spark X between cables */}
                        <path d="M172 282 L185 290 M172 290 L185 282" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round">
                            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                        </path>
                        <path d="M215 282 L228 290 M215 290 L228 282" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round">
                            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
                        </path>

                        {/* Floating dots */}
                        <circle cx="80" cy="90" r="8" fill="#93C5FD" opacity="0.5">
                            <animate attributeName="cy" values="90;80;90" dur="4s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="320" cy="100" r="12" fill="#60A5FA" opacity="0.4">
                            <animate attributeName="cy" values="100;110;100" dur="5s" repeatCount="indefinite" />
                        </circle>
                        <rect x="310" y="300" width="16" height="16" rx="3" fill="#3B82F6" opacity="0.3" transform="rotate(20 318 308)">
                            <animate attributeName="opacity" values="0.3;0.5;0.3" dur="3s" repeatCount="indefinite" />
                        </rect>
                        <rect x="70" y="280" width="12" height="12" rx="2" fill="#2563EB" opacity="0.3" transform="rotate(-15 76 286)">
                            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="4s" repeatCount="indefinite" />
                        </rect>

                        {/* Question mark */}
                        <text x="200" y="240" textAnchor="middle" fontSize="28" fontWeight="700" fill="#93C5FD">
                            ?
                            <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
                        </text>
                    </svg>
                </div>

                {/* Text Content */}
                <div className="w-full lg:w-1/2 text-center lg:text-left space-y-5">
                    <div className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-blue-600 uppercase bg-blue-100 rounded-full">
                        Lỗi hệ thống
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                        Oops! Trang này<br />
                        <span className="text-blue-600">không tồn tại.</span>
                    </h1>

                    <p className="text-gray-500 text-base lg:text-lg max-w-md mx-auto lg:mx-0 leading-relaxed">
                        Có vẻ như đường dẫn bạn truy cập đã bị hỏng hoặc trang này đã được di chuyển. Hãy kiểm tra lại URL hoặc quay về trang chủ.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                        <button
                            onClick={goBack}
                            className="w-full sm:w-auto px-7 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Quay lại
                        </button>

                        <button
                            onClick={goHome}
                            className="w-full sm:w-auto px-7 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center hover:-translate-y-0.5"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Về Trang chủ
                        </button>
                    </div>

                    <p className="pt-4 text-xs text-gray-400 font-medium tracking-widest uppercase">
                        Powered by AEGISM Platform
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
