import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Camera, Save, Loader2, Key, Eye, EyeOff } from 'lucide-react';

const ProfilePage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const [user, setUser] = useState<any>({
        id: '',
        fullName: '',
        email: '',
        avatar: '',
        role: null,
        tenant: null,
        isTenantAdmin: false,
        isSuperAdmin: false,
    });

    const [formData, setFormData] = useState({
        fullName: '',
        avatar: '',
    });

    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: '',
    });

    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000'
        : 'https://api.aegism.online';

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API_URL}/api/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setFormData({
                    fullName: data.fullName || '',
                    avatar: data.avatar || '',
                });
            }
        } catch (e) {
            console.error('Lỗi fetch profile:', e);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        try {
            const token = localStorage.getItem('accessToken');
            const fd = new FormData();
            fd.append('file', file);

            const res = await fetch(`${API_URL}/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                body: fd,
            });

            if (res.ok) {
                const data = await res.json();
                const avatarUrl = data.avatar?.startsWith('/uploads')
                    ? `${API_URL}${data.avatar}`
                    : data.avatar;
                setUser((prev: any) => ({ ...prev, avatar: avatarUrl }));
                setFormData(prev => ({ ...prev, avatar: data.avatar }));
                localStorage.setItem('user', JSON.stringify({ ...user, avatar: data.avatar }));
            }
        } catch (e) {
            console.error('Lỗi upload avatar:', e);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            const token = localStorage.getItem('accessToken');

            // Validate password nếu có nhập
            if (passwordData.newPassword) {
                if (passwordData.newPassword !== passwordData.confirmPassword) {
                    setErrorMsg('Mật khẩu xác nhận không khớp.');
                    setIsLoading(false);
                    return;
                }
                if (passwordData.newPassword.length < 6) {
                    setErrorMsg('Mật khẩu tối thiểu 6 ký tự.');
                    setIsLoading(false);
                    return;
                }
            }

            const body: any = {
                fullName: formData.fullName,
            };

            if (passwordData.newPassword) {
                body.password = passwordData.newPassword;
            }

            const res = await fetch(`${API_URL}/api/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('user', JSON.stringify({ ...user, fullName: data.fullName }));
                setSuccessMsg('Cập nhật thông tin thành công!');
                setPasswordData({ newPassword: '', confirmPassword: '' });
                fetchProfile();
            } else {
                const err = await res.json();
                setErrorMsg(err.message || 'Có lỗi xảy ra khi cập nhật.');
            }
        } catch (error) {
            setErrorMsg('Không thể kết nối đến máy chủ.');
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleDisplay = () => {
        if (user.isSuperAdmin) return 'Super Admin';
        if (user.isTenantAdmin) return 'Quản trị viên';
        return user.role?.name || 'Nhân viên';
    };

    const getAvatarUrl = () => {
        if (!user.avatar) {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'User')}&background=1B6FFF&color=fff&size=128`;
        }
        if (user.avatar.startsWith('/uploads')) return `${API_URL}${user.avatar}`;
        return user.avatar;
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                {/* Header Banner */}
                <div className="relative h-32 bg-gradient-to-r from-blue-600 to-blue-400">
                    <div className="absolute -bottom-12 left-8">
                        <div className="relative">
                            <img
                                src={getAvatarUrl()}
                                alt="Avatar"
                                className="w-24 h-24 rounded-full border-4 border-white object-cover bg-gray-100 shadow-md"
                            />
                            <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full border-2 border-white hover:bg-blue-700 transition-colors cursor-pointer">
                                {isUploadingAvatar
                                    ? <Loader2 size={14} className="animate-spin text-white" />
                                    : <Camera size={14} className="text-white" />
                                }
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="pt-16 px-8 pb-8">
                    {/* User Info Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">{user.fullName || 'Người dùng'}</h1>
                        <div className="flex items-center gap-2 mt-1 text-blue-600">
                            <Shield size={14} />
                            <span className="text-xs font-bold uppercase tracking-wider">{getRoleDisplay()}</span>
                            {user.tenant && (
                                <span className="text-xs text-gray-400 normal-case font-normal">· {user.tenant.name}</span>
                            )}
                        </div>
                    </div>

                    {/* Success / Error */}
                    {successMsg && (
                        <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                            ✅ {successMsg}
                        </div>
                    )}
                    {errorMsg && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            ❌ {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSaveProfile} className="space-y-6">

                        {/* Thông tin cơ bản */}
                        <div>
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Thông tin cơ bản</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Họ và Tên</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                            placeholder="Nhập họ và tên"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Email (không thể thay đổi)</label>
                                    <div className="relative opacity-60">
                                        <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <input
                                            type="email"
                                            value={user.email}
                                            disabled
                                            className="w-full border border-gray-200 bg-gray-50 rounded-lg py-2.5 pl-10 pr-4 cursor-not-allowed text-gray-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Đổi mật khẩu */}
                        <div>
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Đổi mật khẩu</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Mật khẩu mới</label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                            placeholder="Để trống nếu không đổi"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                                            placeholder="Nhập lại mật khẩu mới"
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Tối thiểu 6 ký tự. Để trống nếu không muốn đổi mật khẩu.</p>
                        </div>

                        {/* Thông tin gói */}
                        {user.tenant && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Thông tin gói dịch vụ</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Công ty: <span className="font-semibold">{user.tenant.name}</span></span>
                                    <span className="text-sm font-bold text-blue-600 uppercase">{user.tenant.subscriptionPlan}</span>
                                </div>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="pt-2 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData({ fullName: user.fullName, avatar: user.avatar });
                                    setPasswordData({ newPassword: '', confirmPassword: '' });
                                    setSuccessMsg('');
                                    setErrorMsg('');
                                }}
                                className="px-6 py-2.5 rounded-lg text-gray-600 font-semibold hover:bg-gray-100 transition-all border border-gray-200"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-all disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                Lưu thông tin
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;