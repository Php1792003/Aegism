import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { marked } from 'marked';

// --- Type Definitions (Optional: Giúp code rõ ràng hơn) ---
interface User {
    name: string;
    avatar: string;
    role: string;
    isSuperAdmin: boolean;
    isTenantAdmin: boolean;
}

interface Stats {
    totalIncidents: number;
    taskCompletionRate: number;
    activeStaff: number;
    totalPatrols: number;
    patrolGrowth: number;
}

interface Staff {
    name: string;
    scans: number;
    score: number;
}

interface Project {
    id: string;
    name: string;
}

const ReportDashboard: React.FC = () => {
    // --- State Management (Tương đương x-data) ---
    const apiUrl = 'https://api.aegism.online';

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState('starter');
    const [user, setUser] = useState<User>({ name: 'User', avatar: '', role: 'User', isSuperAdmin: false, isTenantAdmin: false });
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const [stats, setStats] = useState<Stats>({ totalIncidents: 0, taskCompletionRate: 0, activeStaff: 0, totalPatrols: 0, patrolGrowth: 0 });
    const [topStaff, setTopStaff] = useState<Staff[]>([]);

    const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Refs để quản lý Chart instance (để destroy khi vẽ lại)
    const patrolChartRef = useRef<HTMLCanvasElement>(null);
    const incidentChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstances = useRef<{ patrol: Chart | null; incident: Chart | null }>({ patrol: null, incident: null });

    // --- Lifecycle (Tương đương init()) ---
    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }

            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userData = JSON.parse(userStr);
                let avatar = '';
                const name = userData.fullName || 'Người dùng';

                if (userData.avatar && userData.avatar.trim() !== '') {
                    avatar = userData.avatar;
                } else {
                    avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563EB&color=fff`;
                }

                const isSuper = userData.isSuperAdmin === true || userData.isSuperAdmin === 'true' || userData.isSuperAdmin === 1;
                const isTenant = userData.isTenantAdmin === true || userData.isTenantAdmin === 'true' || userData.isTenantAdmin === 1;

                let role = 'Nhân viên';
                if (isSuper) role = 'Super Admin';
                else if (isTenant) role = 'Quản trị viên';
                else if (userData.role && userData.role.name) role = userData.role.name;

                let plan = 'starter';
                if (userData.tenant) {
                    plan = userData.tenant.subscriptionPlan?.toLowerCase() || 'starter';
                }

                setUser({ name, avatar, role, isSuperAdmin: isSuper, isTenantAdmin: isTenant });
                setCurrentPlan(plan);
            }

            const now = new Date();
            const end = now.toISOString().split('T')[0];
            const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            setDateRange({ start, end });

            await fetchProjects(start, end);
        };

        init();

        // Cleanup charts on unmount
        return () => {
            if (chartInstances.current.patrol) chartInstances.current.patrol.destroy();
            if (chartInstances.current.incident) chartInstances.current.incident.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Methods ---

    const fetchProjects = async (start: string, end: string) => {
        try {
            const res = await fetch(`${apiUrl}/api/projects`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
                if (data.length > 0) {
                    const firstProjectId = data[0].id;
                    setSelectedProjectId(firstProjectId);
                    // Gọi updateStats ngay sau khi có project (truyền tham số trực tiếp vì state update là async)
                    updateStats(firstProjectId, start, end);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const updateStats = async (
        pId = selectedProjectId,
        dStart = dateRange.start,
        dEnd = dateRange.end
    ) => {
        if (!pId) return;
        const token = localStorage.getItem('accessToken');

        const params = new URLSearchParams({
            projectId: pId,
            startDate: dStart,
            endDate: dEnd
        });

        try {
            const res = await fetch(`${apiUrl}/api/reports/dashboard?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setStats(data.stats || { totalIncidents: 0, taskCompletionRate: 0, activeStaff: 0, totalPatrols: 0, patrolGrowth: 0 });
                setTopStaff(data.topStaff || []);
                renderCharts(data.charts);
            }
        } catch (e) {
            console.error("Lỗi tải báo cáo:", e);
        }
    };

    const renderCharts = (chartsData: any) => {
        if (!chartsData) return;

        // Destroy old charts
        if (chartInstances.current.patrol) {
            chartInstances.current.patrol.destroy();
            chartInstances.current.patrol = null;
        }
        if (chartInstances.current.incident) {
            chartInstances.current.incident.destroy();
            chartInstances.current.incident = null;
        }

        // Render Patrol Chart
        if (patrolChartRef.current && chartsData.patrol?.labels?.length > 0) {
            chartInstances.current.patrol = new Chart(patrolChartRef.current, {
                type: 'line',
                data: {
                    labels: chartsData.patrol.labels,
                    datasets: [{
                        label: 'Số lượng sự cố',
                        data: chartsData.patrol.actual,
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#EF4444',
                        pointRadius: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // Render Incident Chart
        if (incidentChartRef.current && chartsData.incident?.labels?.length > 0) {
            chartInstances.current.incident = new Chart(incidentChartRef.current, {
                type: 'doughnut',
                data: {
                    labels: chartsData.incident.labels,
                    datasets: [{
                        data: chartsData.incident.data,
                        backgroundColor: ['#EF4444', '#EAB308', '#3B82F6', '#8B5CF6', '#10B981'],
                        borderWidth: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, cutout: '75%' }
            });
        }
    };

    const exportReport = async () => {
        if (!selectedProjectId) return;
        const token = localStorage.getItem('accessToken');
        const params = new URLSearchParams({
            projectId: selectedProjectId,
            startDate: dateRange.start,
            endDate: dateRange.end
        });
        try {
            const res = await fetch(`${apiUrl}/api/reports/export?${params.toString()}`, {
                method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = "Report.xlsx";
                a.click();
            } else { alert("Lỗi xuất file"); }
        } catch (e) { alert("Lỗi kết nối"); }
    };

    const analyzeWithAI = async () => {
        if (!selectedProjectId) return;
        setIsAnalyzing(true);
        setAiAnalysisResult(null);
        const params = new URLSearchParams({
            projectId: selectedProjectId,
            startDate: dateRange.start,
            endDate: dateRange.end
        });
        try {
            const res = await fetch(`${apiUrl}/api/reports/ai-analyze?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAiAnalysisResult(data.analysis);
            } else {
                const err = await res.json();
                alert("Lỗi AI: " + err.message);
            }
        } catch (e) { alert("Lỗi kết nối AI"); } finally { setIsAnalyzing(false); }
    };

    const logout = () => {
        localStorage.clear();
        window.location.href = '/login.html';
    };

    // --- Render ---
    return (
        <div className="bg-gray-50 text-gray-800 font-sans h-screen flex overflow-hidden">
            {/* Custom Styles from HTML head */}
            <style>{`
                .prose ul { list-style-type: disc; padding-left: 1.5em; margin-top: 0.5em; margin-bottom: 0.5em; }
                .prose li { margin-bottom: 0.25em; }
                .prose strong { color: #1e40af; font-weight: 700; }
                
                .ai-gradient-border {
                    position: relative;
                    background: white;
                    border-radius: 0.75rem;
                    z-index: 1;
                }
                .ai-gradient-border::before {
                    content: "";
                    position: absolute;
                    inset: -2px;
                    border-radius: 0.85rem;
                    background: linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899);
                    z-index: -1;
                    opacity: 0.7;
                }
                
                .chart-container {
                    position: relative;
                    height: 300px;
                    width: 100%;
                }
            `}</style>

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                            <div className="flex flex-col">
                                <label className="text-xs text-gray-500 mb-1 font-semibold">Dự án</label>
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => {
                                        const newVal = e.target.value;
                                        setSelectedProjectId(newVal);
                                        updateStats(newVal, dateRange.start, dateRange.end);
                                    }}
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opsera-primary font-semibold bg-white w-full sm:w-64"
                                >
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>{project.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 items-end">
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 mb-1 font-semibold">Từ ngày</label>
                                    <input
                                        type="date"
                                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opsera-primary text-sm"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 mb-1 font-semibold">Đến ngày</label>
                                    <input
                                        type="date"
                                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opsera-primary text-sm"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    />
                                </div>
                                <button onClick={() => updateStats(selectedProjectId, dateRange.start, dateRange.end)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm h-[38px]">Lọc</button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={exportReport} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm text-sm">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                Xuất Excel
                            </button>
                            <button onClick={analyzeWithAI} disabled={isAnalyzing} className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 text-sm">
                                {!isAnalyzing && <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>}
                                {isAnalyzing && <svg className="animate-spin w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                <span>{isAnalyzing ? 'Đang phân tích...' : 'AI Đánh giá'}</span>
                            </button>
                        </div>
                    </div>

                    {aiAnalysisResult && (
                        <div className="mb-8 ai-gradient-border p-1">
                            <div className="bg-white rounded-xl p-6">
                                <h4 className="text-xl font-bold text-purple-900 mb-3 flex items-center">
                                    <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                    Phân tích thông minh từ Google AI
                                </h4>
                                <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: marked.parse(aiAnalysisResult) as string }}></div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Tổng số sự cố</p>
                                    <h4 className="text-2xl font-bold text-opsera-dark mt-2">{stats.totalIncidents || 0}</h4>
                                </div>
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Tỷ lệ hoàn thành Task</p>
                                    <h4 className="text-2xl font-bold text-opsera-dark mt-2">{(stats.taskCompletionRate || 0) + '%'}</h4>
                                </div>
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: (stats.taskCompletionRate || 0) + '%' }}></div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Nhân sự dự án</p>
                                    <h4 className="text-2xl font-bold text-opsera-dark mt-2">{stats.activeStaff || 0}</h4>
                                </div>
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Dự án đang chọn</p>
                                    <h4 className="text-lg font-bold text-opsera-primary mt-2 truncate">
                                        {projects.find(p => p.id === selectedProjectId)?.name || 'Chưa chọn'}
                                    </h4>
                                </div>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {selectedProjectId && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
                                <h4 className="text-lg font-bold text-gray-800 mb-4">Tổng số lần sự cố (theo ngày)</h4>
                                <div className="relative h-80 w-full chart-container">
                                    <canvas ref={patrolChartRef} id="patrolChart"></canvas>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h4 className="text-lg font-bold text-gray-800 mb-4">Phân loại sự cố theo Role (%)</h4>
                                <div className="relative h-64 w-full flex justify-center chart-container">
                                    <canvas ref={incidentChartRef} id="incidentChart"></canvas>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedProjectId ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                <h4 className="font-bold text-gray-800">Bảng đánh giá thành viên (Top Performance)</h4>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                                            <th className="px-6 py-3">Xếp hạng</th>
                                            <th className="px-6 py-3">Nhân viên</th>
                                            <th className="px-6 py-3 text-center">Task hoàn thành</th>
                                            <th className="px-6 py-3 text-right">Tổng điểm</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {topStaff.map((staff, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${index === 0 ? 'bg-yellow-400' : (index === 1 ? 'bg-gray-400' : (index === 2 ? 'bg-orange-400' : 'bg-blue-100 text-blue-600'))
                                                        }`}>
                                                        {index + 1}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{staff.name}</td>
                                                <td className="px-6 py-4 text-center text-gray-500">{staff.scans}</td>
                                                <td className="px-6 py-4 text-right font-bold text-opsera-primary">{staff.score}</td>
                                            </tr>
                                        ))}
                                        {topStaff.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Chưa có dữ liệu trong khoảng thời gian này.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-gray-500">Vui lòng chọn dự án để xem báo cáo.</p>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
};

export default ReportDashboard;