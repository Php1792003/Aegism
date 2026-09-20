import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import SEO from '@/components/seo/SEO';
import { BreadcrumbSchema, SoftwareApplicationSchema } from '@/components/seo/StructuredData';
import { usePageAnimations } from '@/hooks/useGsap';
import { SplitWords } from '@/components/ui/SplitWords';
import {
    HiOutlineDevicePhoneMobile,
    HiOutlineComputerDesktop,
    HiArrowDownTray,
    HiCheckCircle,
    HiOutlineQrCode,
    HiOutlineSparkles,
    HiOutlineShieldCheck
} from 'react-icons/hi2';

interface AppVersion {
    version: string;
    versionCode: number;
    platform: string;
    downloadUrl: string;
    size?: number;
    releaseDate: string;
    changelog?: string;
}

const DownloadPage = () => {
    const [androidVersion, setAndroidVersion] = useState<AppVersion | null>(null);
    const [desktopVersion, setDesktopVersion] = useState<AppVersion | null>(null);
    const [loading, setLoading] = useState(true);

    const root = usePageAnimations<HTMLDivElement>();

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                const response = await axios.get('/api/mobile/version');
                if (response.data && Array.isArray(response.data)) {
                    const versions = response.data;
                    setAndroidVersion(versions.find((v: any) => v.platform === 'ANDROID'));
                    setDesktopVersion(versions.find((v: any) => v.platform === 'WINDOWS'));
                }
            } catch {
                setAndroidVersion({
                    version: '1.2.4',
                    versionCode: 24,
                    platform: 'ANDROID',
                    downloadUrl: 'https://aegism.online/downloads/aegism-mobile-latest.apk',
                    size: 42000000,
                    releaseDate: new Date().toISOString(),
                    changelog: '• Tối ưu tốc độ quét QR trong môi trường thiếu sáng\n• Cập nhật thuật toán Geofencing tiết kiệm pin 35%\n• Hỗ trợ chế độ Offline Cache tự đồng bộ khi có 4G/Wifi'
                });
                setDesktopVersion({
                    version: '1.1.0',
                    versionCode: 10,
                    platform: 'WINDOWS',
                    downloadUrl: 'https://aegism.online/downloads/aegism-desktop-setup.exe',
                    size: 98000000,
                    releaseDate: new Date().toISOString(),
                    changelog: '• Bản build Electron 64-bit tối ưu hiệu năng RAM\n• Tự động khởi động cùng Windows cho phòng điều khiển\n• Cảnh báo chuông SOS toàn màn hình khi có sự cố khẩn'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchVersions();
    }, []);

    const formatSize = (bytes?: number) => {
        if (!bytes) return '42 MB';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    return (
        <div ref={root} className="overflow-x-clip bg-white text-gray-900 font-sans selection:bg-blue-600 selection:text-white">
            <SEO
                title="Tải Ứng Dụng AEGISM - Mobile APK & Desktop Windows Mới Nhất"
                description="Tải ứng dụng AEGISM chính thức cho điện thoại Android (file APK cài đặt trực tiếp) và máy tính Windows. Số hóa tuần tra an ninh tức thì."
                url="/download"
                keywords="tải AEGISM, download AEGISM APK, phần mềm tuần tra bảo vệ cho android, ứng dụng an ninh windows"
            />
            <BreadcrumbSchema items={[{ name: 'Trang chủ', url: '/' }, { name: 'Tải ứng dụng', url: '/download' }]} />
            <SoftwareApplicationSchema />

            {/* Scroll progress bar */}
            <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1">
                <div data-progress className="h-full origin-left scale-x-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400" />
            </div>

            <main>
                {/* --- HERO BANNER --- */}
                <section className="pt-14 pb-16 bg-gradient-to-b from-blue-50/60 via-white to-white dark:from-slate-900/60 dark:via-[#070d18] dark:to-[#070d18] text-center transition-colors">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div data-hero-entrance="badge" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6">
                            <HiOutlineSparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span>Bộ công cụ đa nền tảng</span>
                        </div>

                        <h1 data-hero-entrance="title" className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.15]">
                            <SplitWords text="Tải Ứng Dụng" />
                            <br />
                            <SplitWords
                                text="AEGISM Platform"
                                innerClassName="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 dark:from-blue-400 dark:via-cyan-300 dark:to-sky-300 bg-clip-text text-transparent"
                            />
                        </h1>

                        <p data-hero-entrance="desc" className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                            Cài đặt ứng dụng di động cho lực lượng bảo vệ hiện trường và ứng dụng máy tính cho phòng điều khiển trung tâm.
                        </p>
                    </div>
                </section>

                {/* --- DOWNLOAD CARDS --- */}
                <section className="pb-24">
                    <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="w-12 h-12 border-4 border-gray-200 dark:border-slate-700 border-t-blue-600 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div data-stagger-group className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                                {/* Android Mobile Card */}
                                <div data-stagger-item className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-200/80 dark:border-slate-800 shadow-lg flex flex-col justify-between relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-950/30 rounded-bl-full -z-10" />

                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                                <HiOutlineDevicePhoneMobile className="w-8 h-8" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                                Dành cho Điện thoại
                                            </span>
                                        </div>

                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">AEGISM Mobile (Android APK)</h3>
                                        <p className="text-sm text-gray-600 dark:text-slate-300 mb-6">
                                            Trang bị cho nhân viên tuần tra: Quét mã QR siêu tốc, kiểm tra tọa độ GPS, chụp ảnh bằng chứng và báo cáo sự cố ngay tại hiện trường.
                                        </p>

                                        {/* Specs */}
                                        <div className="space-y-3 mb-6 bg-gray-50/80 dark:bg-slate-800/80 p-4 rounded-2xl text-xs text-gray-700 dark:text-slate-200 font-semibold border border-transparent dark:border-slate-700/50">
                                            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Phiên bản mới nhất:</span><span className="font-bold text-gray-900 dark:text-white">{androidVersion?.version || '1.2.4'}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Dung lượng file:</span><span>{formatSize(androidVersion?.size)}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Yêu cầu hệ điều hành:</span><span>Android 8.0 trở lên</span></div>
                                            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Ngày phát hành:</span><span>{androidVersion ? formatDate(androidVersion.releaseDate) : '20/09/2026'}</span></div>
                                        </div>

                                        {/* QR Code Quick Scan for Mobile */}
                                        <div className="flex items-center gap-4 p-4 rounded-2xl border border-dashed border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 mb-6">
                                            <div className="bg-white p-2 rounded-xl shadow-sm">
                                                <QRCodeSVG value={androidVersion?.downloadUrl || 'https://aegism.online/downloads/aegism-mobile-latest.apk'} size={72} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1">
                                                    <HiOutlineQrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                    Quét để tải trực tiếp
                                                </p>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                                    Dùng camera điện thoại quét mã QR bên cạnh để tải file APK về máy ngay tức thì.
                                                </p>
                                            </div>
                                        </div>

                                        {androidVersion?.changelog && (
                                            <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl text-xs text-gray-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed border border-transparent dark:border-slate-700/50">
                                                <p className="font-bold text-gray-800 dark:text-white mb-1">Cải tiến trong bản này:</p>
                                                {androidVersion.changelog}
                                            </div>
                                        )}
                                    </div>

                                    <a
                                        href={androidVersion?.downloadUrl || '#'}
                                        download="aegism-mobile-latest.apk"
                                        className="w-full flex items-center justify-center px-6 py-4 rounded-xl text-white font-bold text-sm bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25 transition gap-2"
                                    >
                                        <HiArrowDownTray className="w-5 h-5" />
                                        Tải file cài đặt APK ({formatSize(androidVersion?.size)})
                                    </a>
                                </div>

                                {/* Windows Desktop Card */}
                                <div data-stagger-item className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-200/80 dark:border-slate-800 shadow-lg flex flex-col justify-between relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-950/30 rounded-bl-full -z-10" />

                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                <HiOutlineComputerDesktop className="w-8 h-8" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                                                Dành cho Máy tính
                                            </span>
                                        </div>

                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">AEGISM Desktop (Windows)</h3>
                                        <p className="text-sm text-gray-600 dark:text-slate-300 mb-6">
                                            Dành cho ban chỉ huy và phòng điều hành trung tâm. Chạy độc lập, âm thanh cảnh báo SOS lớn và tự động cập nhật phiên bản mới.
                                        </p>

                                        {/* Specs */}
                                        <div className="space-y-3 mb-6 bg-gray-50/80 dark:bg-slate-800/80 p-4 rounded-2xl text-xs text-gray-700 dark:text-slate-200 font-semibold border border-transparent dark:border-slate-700/50">
                                            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Phiên bản:</span><span className="font-bold text-gray-900 dark:text-white">{desktopVersion?.version || '1.1.0'}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Dung lượng file:</span><span>{formatSize(desktopVersion?.size)}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Tương thích:</span><span>Windows 10 / 11 (64-bit)</span></div>
                                            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Loại cài đặt:</span><span>Stand-alone Installer (.exe)</span></div>
                                        </div>

                                        <div className="space-y-2 mb-6">
                                            <div className="flex items-center text-xs font-semibold text-gray-700 dark:text-slate-200 gap-2">
                                                <HiCheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                <span>Hỗ trợ đa màn hình giám sát camera & bản đồ</span>
                                            </div>
                                            <div className="flex items-center text-xs font-semibold text-gray-700 dark:text-slate-200 gap-2">
                                                <HiCheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                <span>Phát âm thanh chuông báo động khi có cảnh báo khẩn</span>
                                            </div>
                                            <div className="flex items-center text-xs font-semibold text-gray-700 dark:text-slate-200 gap-2">
                                                <HiCheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                <span>Bảo mật chống tắt nhầm ứng dụng trong ca trực</span>
                                            </div>
                                        </div>

                                        {desktopVersion?.changelog && (
                                            <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl text-xs text-gray-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed border border-transparent dark:border-slate-700/50">
                                                <p className="font-bold text-gray-800 dark:text-white mb-1">Cải tiến trong bản này:</p>
                                                {desktopVersion.changelog}
                                            </div>
                                        )}
                                    </div>

                                    <a
                                        href={desktopVersion?.downloadUrl || '#'}
                                        download="aegism-desktop-setup.exe"
                                        className="w-full flex items-center justify-center px-6 py-4 rounded-xl text-white font-bold text-sm bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition gap-2"
                                    >
                                        <HiArrowDownTray className="w-5 h-5" />
                                        Tải cho Windows (.exe - {formatSize(desktopVersion?.size)})
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default DownloadPage;
