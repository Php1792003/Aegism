import React, { useEffect, useState } from 'react';
import { Download as DownloadIcon, Smartphone as PhoneIcon, Monitor as MonitorIcon, CheckCircle2 as CheckIcon, Package as PackageIcon } from 'lucide-react';
import axios from 'axios';
import SEO from '@/components/seo/SEO';
import { BreadcrumbSchema, SoftwareApplicationSchema } from '@/components/seo/StructuredData';

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

  useEffect(() => {
    // In a real scenario, this fetches from /api/mobile/version or /api/app/version
    // For this prototype we will mock the response or call the actual endpoint if it exists
    const fetchVersions = async () => {
      try {
        const response = await axios.get('/api/mobile/version');
        if (response.data) {
          // Assuming the endpoint returns the latest versions for all platforms
          const versions = response.data;
          setAndroidVersion(versions.find((v: any) => v.platform === 'ANDROID'));
          setDesktopVersion(versions.find((v: any) => v.platform === 'WINDOWS'));
        }
      } catch (error) {
        // Fallback mock data if endpoint is not fully populated yet
        setAndroidVersion({
          version: '1.0.0',
          versionCode: 1,
          platform: 'ANDROID',
          downloadUrl: 'https://aegism.online/downloads/aegism-mobile-v1.0.0.apk',
          size: 45000000,
          releaseDate: new Date().toISOString(),
          changelog: '- Initial release\n- QR Scanning\n- Offline mode support'
        });
        setDesktopVersion({
          version: '1.0.0',
          versionCode: 1,
          platform: 'WINDOWS',
          downloadUrl: 'https://aegism.online/downloads/aegism-desktop-setup-v1.0.0.exe',
          size: 110000000,
          releaseDate: new Date().toISOString(),
          changelog: '- Windows desktop wrapper\n- Native window management\n- Auto-updates enabled'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, []);

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  return (
    <div className="bg-slate-50 min-h-screen py-24">
      <SEO
        title="Tải ứng dụng AEGISM - Mobile & Desktop"
        description="Tải ứng dụng AEGISM cho Android và Windows. Quản lý tuần tra QR Code, giám sát GPS và báo cáo sự cố mọi lúc mọi nơi."
        url="/download"
        canonical="/download"
        keywords="tải AEGISM, download AEGISM, ứng dụng bảo vệ, phần mềm tuần tra mobile"
      />
      <BreadcrumbSchema items={[
        { name: 'Trang chủ', url: '/' },
        { name: 'Tải ứng dụng', url: '/download' },
      ]} />
      <SoftwareApplicationSchema />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
            Tải Ứng Dụng AEGISM
          </h1>
          <p className="mt-4 text-xl text-slate-600">
            Quản lý, giám sát và vận hành hệ thống của bạn mọi lúc, mọi nơi với các ứng dụng chuyên dụng cho Mobile và Desktop.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

            {/* Mobile App Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform transition hover:-translate-y-1">
              <div className="p-8">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <PhoneIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Android App (APK)</h3>
                <p className="text-slate-600 mb-6">
                  Dành cho nhân viên bảo vệ và quản lý hiện trường. Quét mã QR, báo cáo sự cố và hoạt động ngoại tuyến.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-sm text-slate-700">
                    <CheckIcon className="w-5 h-5 text-emerald-500 mr-3" />
                    <span>Phiên bản: <strong className="text-slate-900">{androidVersion?.version}</strong></span>
                  </div>
                  <div className="flex items-center text-sm text-slate-700">
                    <CheckIcon className="w-5 h-5 text-emerald-500 mr-3" />
                    <span>Cập nhật: <strong className="text-slate-900">{androidVersion ? formatDate(androidVersion.releaseDate) : ''}</strong></span>
                  </div>
                  <div className="flex items-center text-sm text-slate-700">
                    <CheckIcon className="w-5 h-5 text-emerald-500 mr-3" />
                    <span>Dung lượng: <strong className="text-slate-900">{formatSize(androidVersion?.size)}</strong></span>
                  </div>
                </div>

                <a
                  href={androidVersion?.downloadUrl || '#'}
                  className="w-full flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30 transition-all"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Tải xuống APK
                </a>

                {androidVersion?.changelog && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Có gì mới:</h4>
                    <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">
                      {androidVersion.changelog}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop App Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform transition hover:-translate-y-1">
              <div className="p-8">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                  <MonitorIcon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Windows Desktop</h3>
                <p className="text-slate-600 mb-6">
                  Dành cho ban quản lý. Trải nghiệm mượt mà, độc lập với trình duyệt và tự động cập nhật.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-sm text-slate-700">
                    <CheckIcon className="w-5 h-5 text-emerald-500 mr-3" />
                    <span>Phiên bản: <strong className="text-slate-900">{desktopVersion?.version}</strong></span>
                  </div>
                  <div className="flex items-center text-sm text-slate-700">
                    <CheckIcon className="w-5 h-5 text-emerald-500 mr-3" />
                    <span>Cập nhật: <strong className="text-slate-900">{desktopVersion ? formatDate(desktopVersion.releaseDate) : ''}</strong></span>
                  </div>
                  <div className="flex items-center text-sm text-slate-700">
                    <CheckIcon className="w-5 h-5 text-emerald-500 mr-3" />
                    <span>Dung lượng: <strong className="text-slate-900">{formatSize(desktopVersion?.size)}</strong></span>
                  </div>
                </div>

                <a
                  href={desktopVersion?.downloadUrl || '#'}
                  className="w-full flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all"
                >
                  <PackageIcon className="w-5 h-5 mr-2" />
                  Tải xuống cho Windows
                </a>

                {desktopVersion?.changelog && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Có gì mới:</h4>
                    <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">
                      {desktopVersion.changelog}
                    </pre>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadPage;
