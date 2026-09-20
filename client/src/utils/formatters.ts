export const getAvatar = (user: any) => {
    if (user && user.avatar && user.avatar.trim() !== '') {
        const avatar = user.avatar.trim();
        if (avatar.startsWith('data:') || avatar.startsWith('http')) {
            return avatar;
        }
        const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:3000' : 'https://api.aegism.online';
        const normalized = avatar.startsWith('/') ? avatar : `/${avatar}`;
        return API_URL + normalized;
    }
    const name = user?.fullName || user?.name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff&bold=true&size=128`;
};


export const formatDateTime = (isoString: string, short = false) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const timeStr = d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    if (short) return timeStr;
    return `${timeStr} - ${d.getDate()}/${d.getMonth() + 1}`;
};

export const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
};