import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// Trang này xử lý khi nhân viên quét QR bằng camera điện thoại (ngoài app)
// URL: https://aegism.online/scan?id=QR_POINT_ID

const ScanRedirect = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'checking' | 'login' | 'checkin' | 'success' | 'error'>('checking');
    const [message, setMessage] = useState('');
    const [pointName, setPointName] = useState('');

    const apiUrl = 'https://api.aegism.online';
    const qrId = searchParams.get('id');

    useEffect(() => {
        if (!qrId) { setStatus('error'); setMessage('Mã QR không hợp lệ.'); return; }
        const token = localStorage.getItem('accessToken');
        if (!token) {
            // Chưa đăng nhập → lưu redirect rồi chuyển về login
            localStorage.setItem('scanRedirect', window.location.href);
            window.location.href = '/login';
            return;
        }
        autoCheckIn(token);
    }, [qrId]);

    const autoCheckIn = async (token: string) => {
        setStatus('checkin');
        setMessage('Đang xử lý check-in...');
        try {
            // Lấy vị trí GPS
            let lat: number | undefined, lng: number | undefined;
            try {
                const pos = await new Promise<GeolocationPosition>((res, rej) =>
                    navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
            } catch {}

            const res = await fetch(`${apiUrl}/api/scans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    qrCodeData: qrId,
                    status: 'VALID',
                    location: lat ? `${lat},${lng}` : 'Unknown',
                    latitude: lat, longitude: lng,
                })
            });

            const data = await res.json();
            if (res.ok) {
                setPointName(data.qrCode?.name || data.name || '');
                setStatus('success');
                setMessage('Check-in thành công!');
                // Auto redirect về app sau 3s
                setTimeout(() => window.location.href = '/qrcodes', 3000);
            } else {
                setStatus('error');
                setMessage(data.message || 'Check-in thất bại.');
            }
        } catch {
            setStatus('error');
            setMessage('Lỗi kết nối. Vui lòng thử lại.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            {/* Logo */}
            <div className="mb-8">
                <img src="/logo.png" alt="AEGISM" className="h-12 mx-auto" onError={(e: any) => e.target.style.display='none'} />
                <p className="text-center text-gray-500 text-sm mt-2 font-medium">AEGISM Platform</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
                {status === 'checking' || status === 'checkin' ? (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Đang xử lý</h2>
                        <p className="text-gray-500 text-sm">{message || 'Vui lòng chờ...'}</p>
                    </>
                ) : status === 'success' ? (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-green-700 mb-1">Check-in thành công!</h2>
                        {pointName && <p className="text-gray-600 font-medium mb-3">{pointName}</p>}
                        <p className="text-gray-400 text-xs">Đang chuyển về ứng dụng...</p>
                        <div className="mt-4 w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                            <div className="h-1 bg-green-500 rounded-full animate-[width_3s_linear_forwards]" style={{ width: '100%', transition: 'width 3s linear' }}></div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-red-600 mb-2">Không thể check-in</h2>
                        <p className="text-gray-500 text-sm mb-6">{message}</p>
                        <button onClick={() => window.location.href = '/qrcodes'}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
                            Mở ứng dụng
                        </button>
                    </>
                )}
            </div>

            <p className="mt-6 text-xs text-gray-400">Powered by AEGISM</p>
        </div>
    );
};

export default ScanRedirect;
