import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeCanvas } from 'qrcode.react';
import {
    FaPlus, FaTrashCan, FaCamera, FaSatelliteDish, FaTriangleExclamation,
    FaRotate, FaLocationDot, FaCheck, FaLocationCrosshairs, FaCircleNotch,
    FaBan, FaXmark, FaClockRotateLeft, FaDownload, FaMagnifyingGlass
} from 'react-icons/fa6';

const LOGS_PER_PAGE = 10;

const QrCodes = () => {
    const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000' : 'https://api.aegism.online';

    const [currentView, setCurrentView] = useState('list');
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [currentProjectQrPoints, setCurrentProjectQrPoints] = useState<any[]>([]);
    const [scanLogs, setScanLogs] = useState<any[]>([]);
    const [issues, setIssues] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [user, setUser] = useState<any>({ name: 'Loading...', permissions: [] });
    const [scannerActive, setScannerActive] = useState(false);
    const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
    const [pendingScanData, setPendingScanData] = useState<string | null>(null);
    const [scanResult, setScanResult] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [lastScanTime, setLastScanTime] = useState(0);
    const [userLocation, setUserLocation] = useState<any>(null);
    const [distanceToTarget, setDistanceToTarget] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showGpsErrorModal, setShowGpsErrorModal] = useState(false);
    const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '', location: '' });
    const [incidentForm, setIncidentForm] = useState<{ description: string, images: string[] }>({ description: '', images: [] });
    const [previewImageSrc, setPreviewImageSrc] = useState('');
    const [tempAssign, setTempAssign] = useState('');
    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<any>({});

    // New states
    const [selectedQrIds, setSelectedQrIds] = useState<string[]>([]);
    const [searchQr, setSearchQr] = useState('');
    const [searchLog, setSearchLog] = useState('');
    const [currentLogPage, setCurrentLogPage] = useState(1);

    const qrScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) { window.location.href = '/login'; return; }
            const userStr = localStorage.getItem('user');
            if (userStr) updateUserUI(JSON.parse(userStr));
            await fetchUserProfile();
            await fetchProjects();
            watchLocation();
        };
        init();
        return () => {
            if (html5QrCode) html5QrCode.stop().catch(() => {});
        };
    }, []);

    useEffect(() => {
        if (selectedProjectId) changeProject();
    }, [selectedProjectId]);

    const updateUserUI = (u: any) => {
        let permissions: string[] = [];
        if (u.isSuperAdmin || u.isTenantAdmin) permissions = ['ALL'];
        else if (u.role) {
            try { permissions = Array.isArray(u.role.permissions) ? u.role.permissions : JSON.parse(u.role.permissions); }
            catch { permissions = []; }
        }
        setUser({ ...u, permissions });
    };

    const hasPermission = (perm: string) => {
        if (perm === 'SCAN_QR' || perm === 'VIEW_QR') return true;
        if (user.isSuperAdmin || user.isTenantAdmin) return true;
        if (user.permissions.includes('ALL')) return true;
        return user.permissions.includes(perm);
    };

    const checkPermissionAction = (perm: string) => {
        if (!hasPermission(perm)) {
            Swal.fire({ icon: 'error', title: 'Truy cập bị từ chối', text: 'Bạn không có quyền thực hiện chức năng này.' });
            return false;
        }
        return true;
    };

    const validateInput = (value: string, type: 'strict' | 'desc') => {
        if (!value || !value.trim()) return 'Không được để trống.';
        const strictRegex = /^[a-zA-Z0-9\s\u00C0-\u1EF9]+$/;
        const descRegex = /^[a-zA-Z0-9\s\u00C0-\u1EF9.,\-\n?]+$/;
        if (type === 'strict' && !strictRegex.test(value)) return 'Không được chứa ký tự đặc biệt.';
        if (type === 'desc' && !descRegex.test(value)) return 'Chứa ký tự không hợp lệ.';
        return null;
    };

    const getImageUrl = (imagePath: string) => {
        if (!imagePath) return 'https://via.placeholder.com/150';
        if (imagePath.startsWith('data:') || imagePath.startsWith('http')) return imagePath;
        return apiUrl + imagePath;
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    const fetchUserProfile = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/users/profile`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) { const u = await res.json(); localStorage.setItem('user', JSON.stringify(u)); updateUserUI(u); }
        } catch (e) { console.error(e); }
    };

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/projects`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
                if (data.length > 0 && !selectedProjectId) setSelectedProjectId(data[0].id);
            }
        } catch (e) { console.error(e); }
        setIsLoading(false);
    };

    const changeProject = () => {
        if (!selectedProjectId) return;
        fetchQrCodes(); fetchLogs(); fetchRoles();
        if (currentView === 'incidents') fetchIncidents();
    };

    const fetchQrCodes = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/qrcodes`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) {
                const all = await res.json();
                setCurrentProjectQrPoints(all.filter((q: any) => q.projectId === selectedProjectId));
            }
        } catch (e) {}
    };

    const fetchRoles = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/roles?projectId=${selectedProjectId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            setRoles(res.ok ? await res.json() : []);
        } catch { setRoles([]); }
    };

    const fetchLogs = async () => {
        try {
            const resLogs = await fetch(`${apiUrl}/api/qrcodes/logs`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            const logsData = resLogs.ok ? await resLogs.json() : [];
            const logsArray = Array.isArray(logsData) ? logsData : (logsData.logs || []);
            const projectLogs = logsArray.filter((l: any) => l.qrCode && l.qrCode.projectId === selectedProjectId);
            setScanLogs(projectLogs.sort((a: any, b: any) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()));
            setCurrentLogPage(1);
        } catch (e) { console.error(e); }
    };

    const fetchIncidents = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/incidents?projectId=${selectedProjectId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            if (res.ok) {
                const raw = await res.json();
                setIssues(raw.map((inc: any) => ({
                    id: inc.id, qrCodeName: inc.qrCode, location: inc.location,
                    description: inc.description || 'Không có mô tả', reporterName: inc.reporter,
                    department: inc.department || 'Unassigned', hasTask: inc.hasTask,
                    thumbnail: inc.image, images: inc.images || [],
                    reportedAt: inc.reportedAt || inc.createdAt || new Date().toISOString()
                })));
            }
        } catch { setIssues([]); }
    };

    const switchView = (view: string) => {
        if (currentView === 'scan' && view !== 'scan') stopScanner();
        setCurrentView(view);
        if (view === 'list') { fetchQrCodes(); fetchLogs(); }
        if (view === 'incidents') fetchIncidents();
    };

    const watchLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
                (err) => console.warn(err),
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
        }
    };

    const startScanner = () => {
        if (!userLocation) { Swal.fire({ icon: 'warning', title: 'Chưa có GPS', text: 'Đang lấy vị trí GPS...', timer: 2000, showConfirmButton: false }); return; }
        setScannerActive(true);
        setTimeout(async () => {
            try {
                const instance = new Html5Qrcode("reader");
                setHtml5QrCode(instance);
                await instance.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (txt) => onScanSuccess(txt), () => {});
            } catch (err: any) { Swal.fire('Lỗi Camera', err.message, 'error'); setScannerActive(false); }
        }, 100);
    };

    const stopScanner = async () => {
        if (html5QrCode) { try { await html5QrCode.stop(); html5QrCode.clear(); setHtml5QrCode(null); } catch (e) {} }
        setScannerActive(false); setScanResult(null); setPendingScanData(null); setIsProcessing(false);
    };

    const onScanSuccess = async (txt: string) => {
        if (isProcessing) return;
        const now = Date.now();
        if (now - lastScanTime < 30000) {
            const remain = Math.ceil((30000 - (now - lastScanTime)) / 1000);
            Swal.fire({ icon: 'warning', title: 'Thao tác quá nhanh', text: `Vui lòng đợi ${remain} giây.`, timer: 2000, showConfirmButton: false });
            return;
        }
        setIsProcessing(true);
        if (html5QrCode) html5QrCode.pause();
        setPendingScanData(txt);
        const targetPoint = currentProjectQrPoints.find(p => p.data === txt || p.id === txt);
        if (targetPoint?.latitude && targetPoint?.longitude && userLocation) {
            const dist = calculateDistance(userLocation.lat, userLocation.lng, targetPoint.latitude, targetPoint.longitude);
            setDistanceToTarget(Math.round(dist));
            if (dist > 100) { setShowGpsErrorModal(true); submitScanLog(txt, "INVALID_LOCATION"); return; }
        }
        setScanResult({ qrCode: { name: targetPoint ? targetPoint.name : 'Mã Mới' } });
    };

    const resumeScanning = () => {
        setScanResult(null); setPendingScanData(null); setIsProcessing(false); setShowGpsErrorModal(false);
        if (html5QrCode) html5QrCode.resume();
    };

    const confirmCheckIn = async () => {
        const loc = userLocation ? `${userLocation.lat},${userLocation.lng}` : "Unknown";
        if (pendingScanData) await submitScanLog(pendingScanData, "VALID", loc);
    };

    const submitScanLog = async (qrData: string, status: string, location = "") => {
        try {
            const res = await fetch(`${apiUrl}/api/scans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
                body: JSON.stringify({ qrCodeData: qrData, location, status, latitude: userLocation?.lat, longitude: userLocation?.lng })
            });
            if (res.ok) {
                if (status === 'VALID') { Swal.fire({ icon: 'success', title: 'Check-in thành công!', timer: 1500, showConfirmButton: false }); setLastScanTime(Date.now()); }
                fetchLogs(); resumeScanning();
            } else { const err = await res.json(); Swal.fire('Lỗi', err.message, 'error'); resumeScanning(); }
        } catch { resumeScanning(); }
    };

    const openCreateModal = () => {
        if (!checkPermissionAction('CREATE_QR') && !checkPermissionAction('MANAGE_QRCODE')) return;
        setIsEdit(false); setFormData({ id: null, name: '', location: '' }); setErrors({}); setShowModal(true);
    };

    const openEditModal = (pt: any) => {
        if (!hasPermission('EDIT_QR') && !hasPermission('UPDATE_QRCODE') && !hasPermission('MANAGE_QRCODE')) {
            return Swal.fire({ icon: 'error', title: 'Từ chối', text: 'Bạn không có quyền sửa.' });
        }
        setIsEdit(true); setFormData({ id: pt.id, name: pt.name, location: pt.location }); setErrors({}); setShowModal(true);
    };

    const saveQr = async () => {
        const nameErr = validateInput(formData.name, 'strict');
        const locErr = validateInput(formData.location, 'strict');
        if (nameErr || locErr) { setErrors({ name: nameErr, location: locErr }); return; }
        const url = isEdit ? `${apiUrl}/api/qrcodes/${formData.id}` : `${apiUrl}/api/qrcodes`;
        try {
            await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
                body: JSON.stringify({ ...formData, projectId: selectedProjectId })
            });
            Swal.fire({ icon: 'success', title: 'Thành công', timer: 1500, showConfirmButton: false });
            setShowModal(false); fetchQrCodes();
        } catch { Swal.fire('Lỗi', 'Không thể lưu.', 'error'); }
    };

    const deleteQr = async (id: string) => {
        if (!checkPermissionAction('DELETE_QR') && !checkPermissionAction('MANAGE_QRCODE')) return;
        const result = await Swal.fire({ title: 'Bạn có chắc?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' });
        if (result.isConfirmed) {
            try {
                await fetch(`${apiUrl}/api/qrcodes/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
                Swal.fire('Đã xóa!', '', 'success'); fetchQrCodes();
            } catch { Swal.fire('Lỗi', 'Không thể xóa.', 'error'); }
        }
    };

    const downloadQrById = (id: string, name: string) => {
        const canvas = document.getElementById(`qrcode-${id}`)?.querySelector('canvas');
        if (canvas) {
            const a = document.createElement('a');
            a.href = canvas.toDataURL("image/png");
            a.download = `QR-${name}.png`;
            a.click();
        }
    };

    const downloadSelectedQrs = () => {
        if (selectedQrIds.length === 0) { Swal.fire('Thông báo', 'Chưa chọn mã QR nào.', 'info'); return; }
        selectedQrIds.forEach(id => {
            const point = currentProjectQrPoints.find(p => p.id === id);
            if (point) downloadQrById(id, point.name);
        });
    };

    const downloadAllQrs = () => {
        currentProjectQrPoints.forEach(p => downloadQrById(p.id, p.name));
    };

    const toggleSelectQr = (id: string) => {
        setSelectedQrIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const openReportModal = () => { setShowIssueModal(true); setScanResult(null); };

    const handleImageSelect = (event: any) => {
        const files = Array.from(event.target.files);
        const remaining = 5 - incidentForm.images.length;
        files.slice(0, remaining).forEach((file: any) => {
            const reader = new FileReader();
            reader.onload = (e: any) => setIncidentForm(prev => ({ ...prev, images: [...prev.images, e.target.result] }));
            reader.readAsDataURL(file);
        });
        event.target.value = '';
    };

    const submitIncident = async () => {
        const descErr = validateInput(incidentForm.description, 'desc');
        if (descErr) { setErrors({ description: descErr }); return; }
        setIsSubmitting(true);
        try {
            const res = await fetch(`${apiUrl}/api/scans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
                body: JSON.stringify({
                    qrCodeData: pendingScanData, status: 'ISSUE',
                    location: userLocation ? `${userLocation.lat},${userLocation.lng}` : '',
                    latitude: userLocation?.lat, longitude: userLocation?.lng,
                    issueDescription: incidentForm.description, images: incidentForm.images
                })
            });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Đã báo cáo sự cố!', timer: 1500, showConfirmButton: false });
                setShowIssueModal(false); setIncidentForm({ description: '', images: [] });
                fetchLogs(); fetchIncidents(); resumeScanning();
            } else { const err = await res.json(); Swal.fire('Lỗi', err.message, 'error'); }
        } catch { Swal.fire('Lỗi', 'Không thể gửi báo cáo', 'error'); }
        setIsSubmitting(false);
    };

    const confirmAssign = async () => {
        if (!tempAssign || !selectedIssue) return;
        try {
            const res = await fetch(`${apiUrl}/api/incidents/${selectedIssue.id}/assign`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
                body: JSON.stringify({ department: tempAssign })
            });
            if (res.ok) { Swal.fire({ icon: 'success', title: 'Đã phân công!', timer: 1500, showConfirmButton: false }); setShowAssignModal(false); fetchIncidents(); }
            else { const err = await res.json(); Swal.fire('Lỗi', err.message, 'error'); }
        } catch { Swal.fire('Lỗi', 'Không thể phân công', 'error'); }
    };

    // Filtered & paginated data
    const filteredQrPoints = currentProjectQrPoints.filter(p =>
        p.name?.toLowerCase().includes(searchQr.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchQr.toLowerCase())
    );

    const filteredLogs = scanLogs.filter(l =>
        l.qrCode?.name?.toLowerCase().includes(searchLog.toLowerCase()) ||
        l.user?.fullName?.toLowerCase().includes(searchLog.toLowerCase()) ||
        l.location?.toLowerCase().includes(searchLog.toLowerCase())
    );

    const totalLogPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
    const paginatedLogs = filteredLogs.slice((currentLogPage - 1) * LOGS_PER_PAGE, currentLogPage * LOGS_PER_PAGE);

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 h-full font-sans text-gray-800">
            {/* TOOLBAR */}
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 m-6">
                <div className="flex items-center w-full sm:w-auto">
                    <span className="mr-3 font-medium">Dự án:</span>
                    <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="border rounded-lg px-3 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 outline-none">
                        {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        {['list', 'scan', 'incidents'].map(v => (
                            <button key={v} onClick={() => switchView(v)}
                                className={`px-4 py-1.5 rounded-md text-sm transition-all duration-200 ${currentView === v ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}>
                                {v === 'list' ? 'Danh sách' : v === 'scan' ? 'Quét QR' : 'Sự cố'}
                            </button>
                        ))}
                    </div>
                    {currentView === 'list' && (hasPermission('CREATE_QR') || hasPermission('MANAGE_QRCODE')) && (
                        <button onClick={openCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-blue-700 flex items-center">
                            <FaPlus className="mr-2" /> Thêm QR
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-x-hidden overflow-y-auto px-6 pb-6">
                {!isLoading && selectedProjectId && (
                    <>
                        {/* VIEW 1: LIST */}
                        {currentView === 'list' && (
                            <div className="space-y-8">
                                {/* Search & Actions Bar */}
                                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                                    <div className="relative w-full sm:w-72">
                                        <FaMagnifyingGlass className="absolute left-3 top-3 text-gray-400 text-sm" />
                                        <input type="text" value={searchQr} onChange={e => setSearchQr(e.target.value)}
                                            placeholder="Tìm kiếm mã QR..."
                                            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedQrIds.length > 0 && (
                                            <button onClick={downloadSelectedQrs}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition">
                                                <FaDownload /> Tải {selectedQrIds.length} mã
                                            </button>
                                        )}
                                        <button onClick={downloadAllQrs}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-sm font-bold hover:bg-blue-100 transition">
                                            <FaDownload /> Tải tất cả
                                        </button>
                                    </div>
                                </div>

                                {/* QR Cards - Horizontal Scroll */}
                                <div ref={qrScrollRef} className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
                                    style={{ scrollbarWidth: 'thin' }}>
                                    {filteredQrPoints.map((point: any) => (
                                        <div key={point.id}
                                            className={`flex-shrink-0 w-56 bg-white p-5 rounded-xl shadow-sm border-2 transition duration-200 relative group flex flex-col items-center text-center snap-start cursor-pointer
                                                ${selectedQrIds.includes(point.id) ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 hover:border-blue-300 hover:shadow-md'}`}
                                            onClick={() => toggleSelectQr(point.id)}>
                                            {/* Checkbox */}
                                            <div className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition
                                                ${selectedQrIds.includes(point.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                                {selectedQrIds.includes(point.id) && <FaCheck className="text-white text-xs" />}
                                            </div>

                                            {(hasPermission('DELETE_QR') || hasPermission('MANAGE_QRCODE')) && (
                                                <button onClick={(e) => { e.stopPropagation(); deleteQr(point.id); }}
                                                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1">
                                                    <FaTrashCan />
                                                </button>
                                            )}

                                            <div className="mb-3 mt-2" id={`qrcode-${point.id}`}>
                                                <div className="p-2 bg-white border border-gray-100 rounded-lg shadow-inner">
                                                    <QRCodeCanvas value={point.data || point.id} size={90} />
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-base truncate w-full px-2">{point.name}</h4>
                                            <p className="text-xs text-gray-500 mb-3 truncate w-full">{point.location || 'Chưa cập nhật'}</p>
                                            <div className="flex w-full gap-2 mt-auto">
                                                {(hasPermission('EDIT_QR') || hasPermission('MANAGE_QRCODE')) && (
                                                    <button onClick={(e) => { e.stopPropagation(); openEditModal(point); }}
                                                        className="flex-1 bg-gray-50 text-gray-600 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 transition">Sửa</button>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); downloadQrById(point.id, point.name); }}
                                                    className="flex-1 bg-blue-50 text-blue-600 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition">Tải về</button>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredQrPoints.length === 0 && (
                                        <div className="w-full text-center py-16 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 min-w-full">
                                            Không tìm thấy mã QR nào.
                                        </div>
                                    )}
                                </div>

                                {/* Logs Table */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <h3 className="font-bold text-gray-800 flex items-center">
                                                <FaClockRotateLeft className="mr-2 text-blue-600" /> Nhật ký quét gần đây
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <FaMagnifyingGlass className="absolute left-3 top-2.5 text-gray-400 text-xs" />
                                                    <input type="text" value={searchLog} onChange={e => { setSearchLog(e.target.value); setCurrentLogPage(1); }}
                                                        placeholder="Tìm kiếm log..."
                                                        className="pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-48" />
                                                </div>
                                                <button onClick={fetchLogs} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                                                    <FaRotate className="mr-1" /> Làm mới
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-100 text-xs uppercase text-gray-500 font-semibold">
                                                <tr>
                                                    <th className="px-6 py-3">Thời gian</th>
                                                    <th className="px-6 py-3">Điểm quét</th>
                                                    <th className="px-6 py-3">Vị trí</th>
                                                    <th className="px-6 py-3">Nhân viên</th>
                                                    <th className="px-6 py-3">Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 text-sm">
                                                {paginatedLogs.map((log: any) => (
                                                    <tr key={log.id} className="hover:bg-blue-50/30 transition">
                                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{new Date(log.scannedAt).toLocaleString('vi-VN')}</td>
                                                        <td className="px-6 py-4 font-bold text-gray-700">{log.qrCode?.name || 'Unknown'}</td>
                                                        <td className="px-6 py-4 text-gray-500">{log.location || 'N/A'}</td>
                                                        <td className="px-6 py-4 font-medium text-blue-600">{log.user?.fullName || 'N/A'}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded text-xs font-bold ${log.status === 'VALID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {log.status === 'VALID' ? 'Hợp lệ' : log.status === 'INVALID_LOCATION' ? 'Sai vị trí' : 'Sự cố'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {paginatedLogs.length === 0 && (
                                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">Chưa có dữ liệu nhật ký.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {totalLogPages > 1 && (
                                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                            <span className="text-sm text-gray-500">
                                                Hiển thị {(currentLogPage - 1) * LOGS_PER_PAGE + 1}–{Math.min(currentLogPage * LOGS_PER_PAGE, filteredLogs.length)} / {filteredLogs.length} bản ghi
                                            </span>
                                            <div className="flex gap-1">
                                                <button onClick={() => setCurrentLogPage(p => Math.max(1, p - 1))} disabled={currentLogPage === 1}
                                                    className="px-3 py-1.5 rounded border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition">‹</button>
                                                {Array.from({ length: totalLogPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalLogPages || Math.abs(p - currentLogPage) <= 1).map((p, idx, arr) => (
                                                    <>
                                                        {idx > 0 && arr[idx-1] !== p - 1 && <span key={`dots-${p}`} className="px-2 py-1.5 text-gray-400">...</span>}
                                                        <button key={p} onClick={() => setCurrentLogPage(p)}
                                                            className={`px-3 py-1.5 rounded border text-sm font-medium transition ${currentLogPage === p ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}>
                                                            {p}
                                                        </button>
                                                    </>
                                                ))}
                                                <button onClick={() => setCurrentLogPage(p => Math.min(totalLogPages, p + 1))} disabled={currentLogPage === totalLogPages}
                                                    className="px-3 py-1.5 rounded border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition">›</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* VIEW 2: SCANNER */}
                        {currentView === 'scan' && (
                            <div className="flex flex-col items-center justify-center py-10">
                                <div className="relative w-full max-w-md aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800">
                                    <div id="reader" className="w-full h-full"></div>
                                    {scannerActive && (
                                        <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-3xl">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-blue-500 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                                                <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 animate-pulse"></div>
                                            </div>
                                            <div className="absolute bottom-6 left-0 w-full text-center text-white/80 text-sm font-medium">Đang tìm mã QR...</div>
                                        </div>
                                    )}
                                    {!scannerActive && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                                            <button onClick={startScanner} className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 transition flex items-center">
                                                <FaCamera className="mr-2" /> Bắt đầu Quét
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className={`mt-4 text-xs font-mono px-3 py-1 bg-white border rounded-full flex items-center shadow-sm ${userLocation ? 'text-green-600' : 'text-orange-500'}`}>
                                    <FaSatelliteDish className="mr-1" />
                                    {userLocation ? `GPS: ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)} (±${Math.round(userLocation.accuracy)}m)` : 'Đang lấy tọa độ GPS...'}
                                </div>
                            </div>
                        )}

                        {/* VIEW 3: INCIDENTS */}
                        {currentView === 'incidents' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <h3 className="font-bold text-gray-800 flex items-center">
                                        <FaTriangleExclamation className="mr-2 text-red-500" /> Quản lý Sự cố
                                    </h3>
                                    <button onClick={fetchIncidents} className="text-sm text-blue-600 hover:underline flex items-center">
                                        <FaRotate className="mr-1" /> Làm mới
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                                <th className="px-6 py-3">Hình ảnh</th>
                                                <th className="px-6 py-3">Thời gian</th>
                                                <th className="px-6 py-3">Điểm quét</th>
                                                <th className="px-6 py-3">Mô tả</th>
                                                <th className="px-6 py-3">Người báo cáo</th>
                                                <th className="px-6 py-3">Phân công</th>
                                                <th className="px-6 py-3">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-sm">
                                            {issues.map((issue: any) => (
                                                <tr key={issue.id} className="hover:bg-red-50/20 transition">
                                                    <td className="px-6 py-4">
                                                        <div className="h-12 w-16 bg-gray-200 rounded overflow-hidden border cursor-pointer hover:opacity-80"
                                                            onClick={() => { setPreviewImageSrc(getImageUrl(issue.thumbnail)); setShowImageModal(true); }}>
                                                            <img src={getImageUrl(issue.thumbnail)} className="w-full h-full object-cover" alt="Thumb"
                                                                onError={(e: any) => e.target.src = 'https://via.placeholder.com/150?text=No+Img'} />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-700">{new Date(issue.reportedAt).toLocaleDateString('vi-VN')}</div>
                                                        <div className="text-xs text-gray-500">{new Date(issue.reportedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-gray-800">{issue.qrCodeName || 'Điểm chưa định danh'}</div>
                                                        <div className="text-xs text-gray-500 flex items-center mt-0.5"><FaLocationDot className="mr-1" />{issue.location || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{issue.description}</td>
                                                    <td className="px-6 py-4 text-gray-500">{issue.reporterName || 'N/A'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${issue.department !== 'Unassigned' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                                                            {issue.department !== 'Unassigned' ? issue.department : 'Chưa phân công'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {!issue.hasTask && (hasPermission('ASSIGN_TASK') || hasPermission('MANAGE_TASK')) ? (
                                                            <button onClick={() => { setSelectedIssue(issue); setTempAssign(''); setShowAssignModal(true); }}
                                                                className="text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition">Phân công</button>
                                                        ) : issue.hasTask ? (
                                                            <span className="text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-bold border border-green-200 flex items-center w-fit">
                                                                <FaCheck className="mr-1" /> Đã tạo Task
                                                            </span>
                                                        ) : null}
                                                    </td>
                                                </tr>
                                            ))}
                                            {issues.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400 italic">Không có sự cố nào.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* MODALS */}
            {scanResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={resumeScanning}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 p-6 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaCheck className="text-2xl text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Đã tìm thấy mã!</h3>
                        <p className="text-sm font-mono bg-gray-100 p-2 rounded mb-4 break-all">{pendingScanData}</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={confirmCheckIn} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition">Check-in</button>
                            <button onClick={openReportModal} className="w-full py-3 bg-white border-2 border-red-100 text-red-500 rounded-xl font-bold hover:bg-red-50 transition">Báo Sự cố</button>
                        </div>
                        <button onClick={resumeScanning} className="mt-4 text-gray-400 hover:text-gray-600 text-sm">Bỏ qua, tiếp tục quét</button>
                    </div>
                </div>
            )}

            {showGpsErrorModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-red-900/70 backdrop-blur-md"></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 p-6 text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaLocationCrosshairs className="text-4xl text-red-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-red-600 mb-3">⚠️ Vị trí không hợp lệ!</h3>
                        <p className="text-gray-700 mb-6">Bạn đang ở <b className="text-red-600">{distanceToTarget} mét</b> cách điểm quét.</p>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowGpsErrorModal(false); resumeScanning(); }} className="flex-1 py-3 bg-gray-600 text-white rounded-xl font-bold hover:bg-gray-700 transition">Tiếp tục Quét</button>
                            <button onClick={() => { setShowGpsErrorModal(false); switchView('list'); }} className="flex-1 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition">Xem Danh sách</button>
                        </div>
                    </div>
                </div>
            )}

            {showIssueModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowIssueModal(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b bg-red-50 rounded-t-2xl flex justify-between items-center">
                            <h3 className="font-bold text-red-600 flex items-center text-lg"><FaTriangleExclamation className="mr-2" /> Báo cáo Sự cố</h3>
                            <button onClick={() => setShowIssueModal(false)} className="text-red-400 hover:text-red-600 text-xl">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="mb-5">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả chi tiết <span className="text-red-500">*</span></label>
                                <textarea value={incidentForm.description}
                                    onChange={(e) => { setIncidentForm({ ...incidentForm, description: e.target.value }); setErrors({ ...errors, description: null }); }}
                                    className={`w-full border rounded-xl p-3 focus:ring-2 focus:outline-none resize-none bg-gray-50 ${errors.description ? 'border-red-500' : 'border-gray-200 focus:ring-blue-500'}`}
                                    rows={4} placeholder="Mô tả hiện trạng sự cố..." />
                                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Hình ảnh (Tối đa 5)</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {incidentForm.images.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square border rounded-xl overflow-hidden group">
                                            <img src={img} className="w-full h-full object-cover" alt="" />
                                            <button onClick={() => { const imgs = [...incidentForm.images]; imgs.splice(idx, 1); setIncidentForm({ ...incidentForm, images: imgs }); }}
                                                className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">&times;</button>
                                        </div>
                                    ))}
                                    {incidentForm.images.length < 5 && (
                                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer min-h-[80px] hover:bg-gray-50 transition">
                                            <FaCamera className="text-2xl text-gray-300 mb-1" />
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Thêm ảnh</span>
                                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                            <button onClick={() => setShowIssueModal(false)} className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl font-bold hover:bg-white transition">Hủy bỏ</button>
                            <button onClick={submitIncident} disabled={isSubmitting} className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 transition flex items-center">
                                {isSubmitting && <FaCircleNotch className="mr-2 animate-spin" />} Gửi Báo Cáo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm" onClick={() => setShowAssignModal(false)}></div>
                    <div className="bg-white rounded-xl p-6 w-full max-w-md relative z-10 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Phân công xử lý</h3>
                        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                            {roles.map((role: any) => (
                                <label key={role.id} className={`flex items-center p-3 border rounded-xl cursor-pointer hover:bg-blue-50 transition ${tempAssign === role.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                    <input type="radio" name="dept" value={role.name} checked={tempAssign === role.name} onChange={() => setTempAssign(role.name)} className="h-4 w-4 text-blue-600" />
                                    <span className="ml-3 font-medium text-gray-700">{role.name}</span>
                                </label>
                            ))}
                            {roles.length === 0 && <div className="text-center text-gray-500 italic">Không tìm thấy bộ phận nào.</div>}
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button onClick={() => setShowAssignModal(false)} className="px-5 py-2.5 text-gray-500 font-bold hover:text-gray-800">Hủy</button>
                            <button onClick={confirmAssign} disabled={!tempAssign} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition">Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg relative z-10 shadow-2xl">
                        <h3 className="text-xl font-bold mb-6 text-gray-800">{isEdit ? 'Cập nhật Điểm Quét' : 'Tạo Điểm Quét Mới'}</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Tên điểm quét <span className="text-red-500">*</span></label>
                                <input type="text" value={formData.name} onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrors({ ...errors, name: null }); }}
                                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:outline-none bg-gray-50 ${errors.name ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                                    placeholder="Ví dụ: Cổng chính..." />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Vị trí <span className="text-red-500">*</span></label>
                                <input type="text" value={formData.location} onChange={(e) => { setFormData({ ...formData, location: e.target.value }); setErrors({ ...errors, location: null }); }}
                                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:outline-none bg-gray-50 ${errors.location ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                                    placeholder="Ví dụ: Tòa nhà A..." />
                                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3 pt-5 border-t">
                            <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition">Hủy</button>
                            <button onClick={saveQr} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">Lưu Thông Tin</button>
                        </div>
                    </div>
                </div>
            )}

            {showUnauthorizedModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm"></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 p-6 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <FaBan className="text-red-600 text-xl" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Truy cập bị từ chối</h3>
                        <p className="mt-2 text-sm text-gray-500">Bạn không có quyền thực hiện thao tác này.</p>
                        <div className="mt-6"><button onClick={() => setShowUnauthorizedModal(false)} className="w-full bg-red-600 text-white font-bold rounded py-2 hover:bg-red-700 transition">Đóng</button></div>
                    </div>
                </div>
            )}

            {showImageModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95" onClick={() => setShowImageModal(false)}>
                    <img src={previewImageSrc} className="max-w-full max-h-full rounded shadow-2xl" alt="Preview" />
                    <button className="absolute top-4 right-4 text-white hover:text-gray-300"><FaXmark className="text-2xl" /></button>
                </div>
            )}
        </div>
    );
};

export default QrCodes;
