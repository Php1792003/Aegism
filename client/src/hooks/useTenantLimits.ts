import { useState, useEffect } from 'react';

export interface TenantLimits {
    maxUsers: number;
    maxProjects: number;
    maxQRCodes: number;
    plan: string;
}

const CACHE_KEY = 'tenantLimits';
const CACHE_TTL_MS = 60 * 1000;

const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' : 'https://api.aegism.online';

export function useTenantLimits(): { limits: TenantLimits; loading: boolean; refetch: () => void } {
    const defaultLimits: TenantLimits = { maxUsers: 5, maxProjects: 1, maxQRCodes: 100, plan: 'STARTER' };

    const [limits, setLimits] = useState<TenantLimits>(() => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const u = JSON.parse(userStr);
                if (u.tenant && u.tenant.maxUsers !== undefined) {
                    return {
                        maxUsers: u.tenant.maxUsers,
                        maxProjects: u.tenant.maxProjects ?? 1,
                        maxQRCodes: u.tenant.maxQRCodes ?? 100,
                        plan: u.tenant.subscriptionPlan ?? 'STARTER'
                    };
                }
            }
            // 2. Khởi tạo từ cache nếu có
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data } = JSON.parse(cached);
                if (data) return data as TenantLimits;
            }
        } catch { /* ignore */ }
        return defaultLimits;
    });

    const [loading, setLoading] = useState(false);

    const fetchLimits = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/dashboard/summary`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                if (data?.tenantLimits) {
                    const l: TenantLimits = data.tenantLimits;
                    setLimits(l);
                    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: l, ts: Date.now() }));

                    // Đồng bộ ngược lại đối tượng user trong localStorage
                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        try {
                            const u = JSON.parse(userStr);
                            if (u.tenant) {
                                u.tenant.maxUsers = l.maxUsers;
                                u.tenant.maxProjects = l.maxProjects;
                                u.tenant.maxQRCodes = l.maxQRCodes;
                                u.tenant.subscriptionPlan = l.plan;
                                localStorage.setItem('user', JSON.stringify(u));
                                localStorage.setItem('userPlan', l.plan.toLowerCase());
                            }
                        } catch { }
                    }
                }
            }
        } catch (e) {
            console.error('[useTenantLimits] fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLimits();
    }, []);

    return { limits, loading, refetch: fetchLimits };
}
