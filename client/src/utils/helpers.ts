export const getAvatar = (user: any) => {
    if (user && user.avatar && !user.avatar.includes('ui-avatars.com')) {
        if (user.avatar.startsWith('/uploads')) {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            return API_URL + user.avatar;
        }
        return user.avatar;
    }
    const name = user?.name || user?.fullName || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true&size=128&font-size=0.33`;
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