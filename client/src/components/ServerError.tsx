import React from 'react';
import { useNavigate } from 'react-router-dom';

const ServerError: React.FC = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('accessToken');

    const goHome = () => {
        if (token) navigate('/dashboard');
        else navigate('/');
    };

    const reloadPage = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-red-50 flex items-center justify-center px-4">
            <div className="max-w-4xl w-full flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16">

                {/* Illustration */}
                <div className="w-full lg:w-1/2 flex justify-center animate-[float_6s_ease-in-out_infinite]">
                    <svg className="w-72 h-72 lg:w-80 lg:h-80" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Background circle */}
                        <circle cx="200" cy="200" r="160" fill="#FEF2F2" />
                        <circle cx="200" cy="200" r="120" fill="#FEE2E2" />

                        {/* Server box */}
                        <rect x="130" y="100" width="140" height="200" rx="10" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />

                        {/* Server slots */}
                        <rect x="150" y="125" width="100" height="22" rx="4" fill="#DBEAFE" />
                        <rect x="150" y="157" width="100" height="22" rx="4" fill="#DBEAFE" />
                        <rect x="150" y="189" width="100" height="22" rx="4" fill="#FEE2E2" />
                        <rect x="150" y="221" width="100" height="22" rx="4" fill="#DBEAFE" />
                        <rect x="150" y="253" width="100" height="22" rx="4" fill="#DBEAFE" />

                        {/* Status LEDs - green */}
                        <circle cx="162" cy="136" r="3.5" fill="#34D399" />
                        <circle cx="174" cy="136" r="3.5" fill="#34D399" opacity="0.5">
                            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="162" cy="168" r="3.5" fill="#34D399" />
                        <circle cx="174" cy="168" r="3.5" fill="#34D399" />

                        {/* Status LEDs - red (error slot) */}
                        <circle cx="162" cy="200" r="3.5" fill="#EF4444">
                            <animate attributeName="r" values="3.5;5;3.5" dur="1s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="174" cy="200" r="3.5" fill="#EF4444" />

                        {/* Status LEDs - green */}
                        <circle cx="162" cy="232" r="3.5" fill="#34D399" />
                        <circle cx="174" cy="232" r="3.5" fill="#34D399" />
                        <circle cx="162" cy="264" r="3.5" fill="#34D399" />
                        <circle cx="174" cy="264" r="3.5" fill="#34D399" opacity="0.5">
                            <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
                        </circle>

                        {/* 500 overlay text */}
                        <text x="200" y="200" dominantBaseline="middle" textAnchor="middle" fontSize="100" fontWeight="900" fill="#2563EB" opacity="0.85" style={{ filter: 'drop-shadow(3px 3px 0px rgba(37,99,235,0.15))' }}>
                            500
                        </text>

                        {/* Warning triangle */}
                        <g transform="translate(290, 120)">
                            <polygon points="0,-20 18,14 -18,14" fill="#FBBF24" stroke="#D97706" strokeWidth="2" strokeLinejoin="round" />
                            <text x="0" y="10" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#92400E">!</text>
                            <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
                        </g>

                        {/* Floating gear top-left */}
                        <g opacity="0.5">
                            <circle cx="85" cy="110" r="18" fill="none" stroke="#93C5FD" strokeWidth="3" strokeDasharray="8 6">
                                <animateTransform attributeName="transform" type="rotate" from="0 85 110" to="360 85 110" dur="12s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="85" cy="110" r="6" fill="#93C5FD" />
                        </g>

                        {/* Floating gear bottom-right */}
                        <g opacity="0.4">
                            <circle cx="320" cy="310" r="14" fill="none" stroke="#FCA5A5" strokeWidth="3" strokeDasharray="6 5">
                                <animateTransform attributeName="transform" type="rotate" from="360 320 310" to="0 320 310" dur="10s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="320" cy="310" r="5" fill="#FCA5A5" />
                        </g>

                        {/* Floating dots */}
                        <circle cx="330" cy="130" r="7" fill="#60A5FA" opacity="0.4">
                            <animate attributeName="cy" values="130;120;130" dur="4s" repeatCount="indefinite" />
                        </circle>
                        <rect x="70" cy="280" width="12" height="12" rx="2" fill="#F87171" opacity="0.3" y="290" transform="rotate(-10 76 296)">
                            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="4s" repeatCount="indefinite" />
                        </rect>
                    </svg>
                </div>

                {/* Text Content */}
                <div className="w-full lg:w-1/2 text-center lg:text-left space-y-5">
                    <div className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-red-600 uppercase bg-red-100 rounded-full">
                        Lỗi máy chủ
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                        Xin lỗi, có sự cố<br />
                        <span className="text-blue-600">từ phía chúng tôi.</span>
                    </h1>

                    <p className="text-gray-500 text-base lg:text-lg max-w-md mx-auto lg:mx-0 leading-relaxed">
                        Máy chủ đang gặp trục trặc kỹ thuật. Đội ngũ kỹ thuật của chúng tôi đã được thông báo và đang nỗ lực khắc phục. Vui lòng thử lại sau ít phút.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                        <button
                            onClick={reloadPage}
                            className="w-full sm:w-auto px-7 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Tải lại trang
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

export default ServerError;
