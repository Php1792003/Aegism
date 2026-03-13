import React, { useState, useRef, useEffect } from 'react';

const API_URL = 'https://api.aegism.online';

const Branding: React.FC = () => {
    const [appName, setAppName] = useState('OPSERA');
    const [primaryColor, setPrimaryColor] = useState('#2563EB');
    const [logo, setLogo] = useState<string | null>(null);
    const [domain, setDomain] = useState('');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentPlan = localStorage.getItem('userPlan') || 'starter';
    const isEnterprise = currentPlan === 'enterprise';

    useEffect(() => {
        const saved = localStorage.getItem('brandingConfig');
        if (saved) {
            try {
                const cfg = JSON.parse(saved);
                if (cfg.appName) setAppName(cfg.appName);
                if (cfg.primaryColor) setPrimaryColor(cfg.primaryColor);
                if (cfg.logo) setLogo(cfg.logo);
                if (cfg.domain) setDomain(cfg.domain);
            } catch { }
        }
    }, []);

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { showToast('File quá lớn, tối đa 2MB', 'error'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => setLogo(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            localStorage.setItem('brandingConfig', JSON.stringify({ appName, primaryColor, logo, domain }));
            await new Promise(r => setTimeout(r, 600));
            showToast('Đã lưu thay đổi thành công!', 'success');
        } catch { showToast('Lưu thất bại', 'error'); }
        finally { setSaving(false); }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">

            {/* Overlay nếu không phải enterprise */}
            {!isEnterprise && (
                <div className="absolute inset-0 z-40 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg text-center border border-gray-200 mx-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 mb-6">
                            <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Nâng cấp lên Gói Enterprise</h2>
                        <p className="text-gray-600 mb-6">Tính năng Tùy chỉnh Thương hiệu giúp bạn xây dựng hình ảnh chuyên nghiệp riêng biệt.</p>
                        <div className="flex gap-3 justify-center">
                            <button className="px-6 py-3 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 transition-colors">
                                Liên hệ Kinh doanh
                            </button>
                            <button onClick={() => window.history.back()} className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                                Quay lại
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold flex items-center gap-2 transition-all ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {toast.type === 'success'
                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    }
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <header className="flex justify-between items-center py-4 px-6 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-800">Tùy chỉnh Thương hiệu (White Label)</h2>
            </header>

            {/* Main */}
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">

                    {/* Left Panel */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Cấu hình giao diện */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-base font-bold text-gray-800 mb-5">Cấu hình Giao diện</h3>

                            {/* Logo */}
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Logo Doanh nghiệp</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                                        {logo
                                            ? <img src={logo} className="w-full h-full object-contain p-1" alt="logo" />
                                            : <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        }
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                            Tải lên Logo
                                        </button>
                                        {logo && (
                                            <button onClick={() => setLogo(null)} className="text-xs text-red-500 hover:text-red-700 text-left">Xóa logo</button>
                                        )}
                                    </div>
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Định dạng: PNG, JPG, SVG. Tối đa 2MB.</p>
                            </div>

                            {/* Tên thương hiệu */}
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tên Thương hiệu</label>
                                <input type="text" value={appName} onChange={e => setAppName(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
                            </div>

                            {/* Màu chủ đạo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Màu chủ đạo</label>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0 cursor-pointer"
                                        onClick={() => document.getElementById('colorPicker')?.click()}>
                                        <div className="w-full h-full" style={{ backgroundColor: primaryColor }}></div>
                                        <input id="colorPicker" type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                    </div>
                                    <input type="text" value={primaryColor} onChange={e => {
                                        if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setPrimaryColor(e.target.value);
                                    }}
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-pink-500" maxLength={7} />
                                </div>
                                {/* Color presets */}
                                <div className="flex gap-2 mt-3 flex-wrap">
                                    {['#2563EB', '#7C3AED', '#DC2626', '#059669', '#D97706', '#0891B2', '#BE185D', '#374151'].map(c => (
                                        <button key={c} onClick={() => setPrimaryColor(c)}
                                            className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${primaryColor === c ? 'border-gray-800 scale-110' : 'border-gray-200'}`}
                                            style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Custom Domain */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-base font-bold text-gray-800 mb-5">Tên miền riêng (Custom Domain)</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Domain của bạn</label>
                                <div className="flex rounded-lg overflow-hidden border border-gray-300">
                                    <span className="inline-flex items-center px-3 bg-gray-50 text-gray-500 text-sm border-r border-gray-300">
                                        https://
                                    </span>
                                    <input type="text" value={domain} onChange={e => setDomain(e.target.value)}
                                        placeholder="portal.yourcompany.com"
                                        className="flex-1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                            </div>
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 rounded-r-lg">
                                <p className="text-xs text-blue-700">
                                    Vui lòng tạo bản ghi <strong>CNAME</strong> trỏ về <code className="bg-blue-100 px-1 rounded">custom.opsera.vn</code> tại nhà cung cấp tên miền của bạn.
                                </p>
                            </div>
                            <button className="w-full px-4 py-2 bg-gray-800 text-white text-sm font-bold rounded-lg hover:bg-gray-900 transition-colors">
                                Xác thực Tên miền
                            </button>
                        </div>

                        {/* Save button */}
                        <div className="flex justify-end">
                            <button onClick={handleSave} disabled={saving}
                                className="px-8 py-3 bg-pink-600 text-white text-sm font-bold rounded-xl hover:bg-pink-700 shadow-lg transition-all hover:scale-105 disabled:opacity-60 disabled:scale-100 flex items-center gap-2">
                                {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                                {saving ? 'Đang lưu...' : 'Lưu Thay đổi'}
                            </button>
                        </div>
                    </div>

                    {/* Right - Live Preview */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
                            <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Xem trước (Live Preview)
                            </h3>

                            <div className="border border-gray-300 rounded-xl overflow-hidden flex-1 flex flex-col bg-gray-100 shadow-inner" style={{ minHeight: 400 }}>
                                {/* Browser bar */}
                                <div className="bg-gray-200 px-4 py-2 border-b border-gray-300 flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                    </div>
                                    <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-500 font-mono text-center truncate mx-2">
                                        https://{domain || 'portal.opsera.vn'}/dashboard
                                    </div>
                                </div>

                                {/* App Preview */}
                                <div className="flex flex-1 overflow-hidden">
                                    {/* Sidebar preview */}
                                    <div className="w-44 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
                                        <div className="h-14 border-b border-gray-100 flex items-center justify-center px-3">
                                            {logo
                                                ? <img src={logo} className="h-7 object-contain" alt="logo" />
                                                : <span className="text-base font-black tracking-wider" style={{ color: primaryColor }}>{appName || 'OPSERA'}</span>
                                            }
                                        </div>
                                        <div className="p-2 space-y-1">
                                            <div className="h-8 w-full rounded-lg flex items-center px-2 text-xs font-bold text-white" style={{ backgroundColor: primaryColor }}>
                                                <span className="w-3 h-3 bg-white/30 rounded mr-2 flex-shrink-0"></span> Tổng quan
                                            </div>
                                            {['Dự án', 'Nhân sự', 'Công việc'].map(item => (
                                                <div key={item} className="h-8 w-full rounded-lg flex items-center px-2 text-xs text-gray-500 hover:bg-gray-50">
                                                    <span className="w-3 h-3 bg-gray-300 rounded mr-2 flex-shrink-0"></span> {item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Content preview */}
                                    <div className="flex-1 bg-gray-50 p-4 flex flex-col gap-3 overflow-hidden">
                                        <div className="h-7 w-1/3 bg-gray-200 rounded-lg"></div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[true, false, false].map((active, i) => (
                                                <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 shadow-sm p-3 overflow-hidden">
                                                    <div className="h-2 w-1/2 bg-gray-200 rounded mb-2"></div>
                                                    {active && (
                                                        <>
                                                            <div className="h-5 w-2/3 rounded mb-1" style={{ backgroundColor: primaryColor, opacity: 0.15 }}></div>
                                                            <div className="h-5 w-10 rounded" style={{ backgroundColor: primaryColor }}></div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                                            <div className="h-2 w-1/4 bg-gray-200 rounded mb-3"></div>
                                            {[80, 60, 70, 50].map((w, i) => (
                                                <div key={i} className="h-2 bg-gray-100 rounded mb-2" style={{ width: `${w}%` }}></div>
                                            ))}
                                            <div className="mt-3 flex gap-2">
                                                <div className="h-7 w-16 rounded-lg" style={{ backgroundColor: primaryColor }}></div>
                                                <div className="h-7 w-16 rounded-lg border border-gray-200"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Color info */}
                            <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: primaryColor }}></div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-700">Màu chủ đạo: <span className="font-mono uppercase">{primaryColor}</span></p>
                                    <p className="text-xs text-gray-400">Tên thương hiệu: {appName || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Branding;
