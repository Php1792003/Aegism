import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeCanvas } from 'qrcode.react';
import {
    FaPlus, FaTrashCan, FaCamera, FaSatelliteDish, FaTriangleExclamation,
    FaRotate, FaLocationDot, FaCheck, FaLocationCrosshairs, FaCircleNotch,
    FaBan, FaXmark, FaClockRotateLeft, FaDownload, FaMagnifyingGlass,
    FaShield, FaCircleExclamation, FaWifi
} from 'react-icons/fa6';

const LOGS_PER_PAGE = 10;
const RATE_LIMIT_MS = 30000;
const GEOFENCE_RADIUS_M = 3;
const MIN_GPS_ACCURACY = 1;   // Fix: đổi từ 3 → 1, fake GPS mới = 0
const MAX_GPS_ACCURACY = 100;
const MAX_SPEED_MPS = 30;

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserLocation {
    lat: number;
    lng: number;
    accuracy: number;
    altitude: number | null;
    timestamp: number;
}

interface GpsValidation {
    isValid: boolean;
    reason?: string;
    suspicionScore: number;
}

// ─── GPS Anti-Cheat Helper ────────────────────────────────────────────────────
const validateGps = (
    current: UserLocation,
    previous: UserLocation | null,
): GpsValidation => {
    let suspicionScore = 0;

    // 1. Accuracy check
    if (current.accuracy < MIN_GPS_ACCURACY) {
        return {
            isValid: false,
            reason: `Tín hiệu GPS bất thường (độ chính xác: ${current.accuracy.toFixed(1)}m). Vui lòng tắt ứng dụng giả mạo vị trí nếu có.`,
            suspicionScore: 100,
        };
    }
    if (current.accuracy > MAX_GPS_ACCURACY) {
        return {
            isValid: false,
            reason: `Tín hiệu GPS quá yếu (±${Math.round(current.accuracy)}m). Hãy ra ngoài trời và thử lại.`,
            suspicionScore: 0,
        };
    }

    // 2. Accuracy cực tốt → nghi ngờ fake
    if (current.accuracy < 5) suspicionScore += 30;

    // 3. Speed check
    if (previous) {
        const timeDiffS = (current.timestamp - previous.timestamp) / 1000;
        if (timeDiffS > 0) {
            const dist = calculateHorizDistance(
                previous.lat, previous.lng,
                current.lat, current.lng,
            );
            const speedMps = dist / timeDiffS;

            if (speedMps > MAX_SPEED_MPS) {
                return {
                    isValid: false,
                    reason: `Phát hiện di chuyển bất thường (${(speedMps * 3.6).toFixed(0)} km/h). Vui lòng thử lại tại vị trí thực tế.`,
                    suspicionScore: 100,
                };
            }
            if (speedMps > 5) suspicionScore += 40;
        }
    }

    // 4. Quét đúng giờ chẵn → bot pattern
    const minute = new Date().getMinutes();
    if (minute === 0 || minute === 30) suspicionScore += 10;

    return { isValid: true, suspicionScore: Math.min(suspicionScore, 100) };
};

const calculateHorizDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calculate3DDistance = (
    lat1: number, lon1: number, alt1: number | null,
    lat2: number, lon2: number, alt2: number | null,
): number => {
    const horiz = calculateHorizDistance(lat1, lon1, lat2, lon2);
    const altDiff = alt1 != null && alt2 != null ? Math.abs(alt1 - alt2) : 0;
    return Math.sqrt(horiz ** 2 + altDiff ** 2);
};

// ─── Main Component ───────────────────────────────────────────────────────────
const QrCodes = () => {
    const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000' : 'https://api.aegism.online';

    const loadJSZip = (): Promise<any> => new Promise((resolve) => {
        if ((window as any).JSZip) { resolve((window as any).JSZip); return; }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve((window as any).JSZip);
        document.head.appendChild(script);
    });

    // ─── State ─────────────────────────────────────────────────────────────────
    const [currentView, setCurrentView] = useState('list');
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [currentProjectQrPoints, setCurrentProjectQrPoints] = useState<any[]>([]);
    const routerLocation = useLocation();
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

    // GPS State
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [prevLocation, setPrevLocation] = useState<UserLocation | null>(null);
    const [gpsStatus, setGpsStatus] = useState<'waiting' | 'ok' | 'weak' | 'error'>('waiting');
    const [distanceToTarget, setDistanceToTarget] = useState(0);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showGpsErrorModal, setShowGpsErrorModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showCalibrationModal, setShowCalibrationModal] = useState(false);
    const [calibrationQrData, setCalibrationQrData] = useState<string | null>(null);
    const [calibrationQrName, setCalibrationQrName] = useState('');
    const [gpsErrorMessage, setGpsErrorMessage] = useState('');
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '', location: '' });
    const [incidentForm, setIncidentForm] = useState<{ description: string; images: string[] }>({ description: '', images: [] });
    const [previewImageSrc, setPreviewImageSrc] = useState('');
    const [tempAssign, setTempAssign] = useState('');
    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [selectedQrIds, setSelectedQrIds] = useState<string[]>([]);
    const [searchQr, setSearchQr] = useState('');
    const [searchLog, setSearchLog] = useState('');
    const [currentLogPage, setCurrentLogPage] = useState(1);

    const qrScrollRef = useRef<HTMLDivElement>(null);

    // ─── Init ───────────────────────────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) { window.location.href = '/login'; return; }
            const userStr = localStorage.getItem('user');
            if (userStr) updateUserUI(JSON.parse(userStr));
            await fetchUserProfile();
            await fetchProjects();
            startWatchingLocation();
        };
        init();
        return () => { if (html5QrCode) html5QrCode.stop().catch(() => {}); };
    }, []);

    useEffect(() => { if (selectedProjectId) changeProject(); }, [selectedProjectId]);

    useEffect(() => {
        const params = new URLSearchParams(routerLocation.search);
        const autoScanData = params.get('autoScan');
        if (autoScanData && currentProjectQrPoints.length > 0) {
            setCurrentView('scan');
            setTimeout(() => {
                const targetPoint = currentProjectQrPoints.find(p => p.data === autoScanData);
                if (targetPoint) {
                    setIsProcessing(true);
                    setPendingScanData(autoScanData);
                    setScanResult({ qrCode: { name: targetPoint.name } });
                } else {
                    Swal.fire({ icon: 'error', title: 'Mã không hợp lệ', text: 'QR code này không thuộc dự án đang chọn.' });
                }
            }, 500);
        }
    }, [routerLocation.search, currentProjectQrPoints]);

    useEffect(() => {
        if (!selectedProjectId) return;
        const interval = setInterval(() => {
            if (currentView === 'list') { fetchQrCodes(); fetchLogs(); }
            else if (currentView === 'incidents') fetchIncidents();
        }, 15000);
        return () => clearInterval(interval);
    }, [selectedProjectId, currentView]);

    // ─── GPS Watching (Anti-Cheat) ──────────────────────────────────────────────
    const startWatchingLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setGpsStatus('error');
            return;
        }

        navigator.geolocation.watchPosition(
            (pos) => {
                const newLoc: UserLocation = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    altitude: pos.coords.altitude,
                    timestamp: pos.timestamp,
                };

                if (newLoc.accuracy > MAX_GPS_ACCURACY) {
                    setGpsStatus('weak');
                } else if (newLoc.accuracy < MIN_GPS_ACCURACY) {
                    setGpsStatus('error');
                } else {
                    setGpsStatus('ok');
                }

                setUserLocation(prev => {
                    if (prev) setPrevLocation(prev);
                    return newLoc;
                });
            },
            (err) => {
                console.warn('GPS error:', err);
                setGpsStatus('error');
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
        );
    }, []);

    // ─── Helpers ────────────────────────────────────────────────────────────────
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
        if (user.permissions?.includes('ALL')) return true;
        return user.permissions?.includes(perm);
    };

    const checkPermissionAction = (perm: string) => {
        if (!hasPermission(perm)) {
            Swal.fire({ icon: 'error', title: 'Truy cập bị từ chối', text: 'Bạn không có quyền thực hiện chức năng này.' });
            return false;
        }
        return true;
    };

    const validateInput = (value: string, type: 'strict' | 'desc') => {
        if (!value?.trim()) return 'Không được để trống.';
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

    // ─── API Calls ───────────────────────────────────────────────────────────────
    const authHeaders = () => ({
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json',
    });

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
            const res = await fetch(`${apiUrl}/api/scans`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
            const data = res.ok ? await res.json() : [];
            const arr = Array.isArray(data) ? data : (data.logs || data.data || []);
            const projectLogs = arr.filter((l: any) => l.qrCode?.projectId === selectedProjectId);
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

    // ─── Scanner ─────────────────────────────────────────────────────────────────
    const switchView = (view: string) => {
        if (currentView === 'scan' && view !== 'scan') stopScanner();
        setCurrentView(view);
        if (view === 'list') { fetchQrCodes(); fetchLogs(); }
        if (view === 'incidents') fetchIncidents();
    };

    const startScanner = () => {
        if (!userLocation) {
            Swal.fire({ icon: 'warning', title: 'Chưa có GPS', text: 'Đang lấy vị trí GPS, vui lòng thử lại sau vài giây.', timer: 2500, showConfirmButton: false });
            return;
        }
        if (gpsStatus === 'error') {
            Swal.fire({ icon: 'error', title: 'GPS không hợp lệ', text: 'Tín hiệu GPS bất thường. Vui lòng tắt ứng dụng giả mạo vị trí nếu có.' });
            return;
        }
        if (gpsStatus === 'weak') {
            Swal.fire({ icon: 'warning', title: 'GPS yếu', text: `Tín hiệu GPS quá yếu (±${Math.round(userLocation.accuracy)}m). Hãy ra ngoài trời và thử lại.` });
            return;
        }

        setScannerActive(true);
        setTimeout(async () => {
            try {
                const instance = new Html5Qrcode('reader');
                setHtml5QrCode(instance);
                await instance.start(
                    { facingMode: 'environment' },
                    { fps: 10 },
                    (txt) => onScanSuccess(txt),
                    () => {},
                );
                const nukeOverlays = () => {
                    const reader = document.getElementById('reader');
                    if (!reader) return;
                    reader.querySelectorAll('svg, #qr-shaded-region').forEach(el => el.remove());
                    reader.querySelectorAll('div[style]').forEach((el: any) => {
                        el.style.border = 'none';
                        el.style.borderTop = 'none';
                        el.style.borderLeft = 'none';
                        el.style.borderRight = 'none';
                        el.style.borderBottom = 'none';
                        el.style.boxShadow = 'none';
                        el.style.outline = 'none';
                        if (el.style.background && el.style.background !== 'transparent') el.style.background = 'transparent';
                    });
                    reader.querySelectorAll('video').forEach((v: any) => {
                        v.style.border = 'none';
                        v.style.outline = 'none';
                        v.style.width = '100%';
                        v.style.height = '100%';
                        v.style.objectFit = 'cover';
                        v.style.position = 'absolute';
                        v.style.top = '0';
                        v.style.left = '0';
                    });
                };
                nukeOverlays();
                [200, 500, 1000].forEach(t => setTimeout(nukeOverlays, t));
            } catch (err: any) {
                Swal.fire('Lỗi Camera', err.message, 'error');
                setScannerActive(false);
            }
        }, 100);
    };

    const stopScanner = async () => {
        if (html5QrCode) { try { await html5QrCode.stop(); html5QrCode.clear(); setHtml5QrCode(null); } catch (e) {} }
        setScannerActive(false); setScanResult(null); setPendingScanData(null); setIsProcessing(false);
    };

    const onScanSuccess = async (txt: string) => {
        if (isProcessing) return;

        // ── Rate limit (frontend) ──
        const now = Date.now();
        if (now - lastScanTime < RATE_LIMIT_MS) {
            const remain = Math.ceil((RATE_LIMIT_MS - (now - lastScanTime)) / 1000);
            Swal.fire({ icon: 'warning', title: 'Thao tác quá nhanh', text: `Vui lòng đợi ${remain} giây.`, timer: 2000, showConfirmButton: false });
            return;
        }

        // ── GPS Validation ──
        if (!userLocation) {
            Swal.fire({ icon: 'warning', title: 'Chưa có GPS', text: 'Vui lòng bật GPS và thử lại.' });
            return;
        }

        const gpsValidation = validateGps(userLocation, prevLocation);
        if (!gpsValidation.isValid) {
            setGpsErrorMessage(gpsValidation.reason || 'GPS không hợp lệ.');
            setShowGpsErrorModal(true);
            if (html5QrCode) html5QrCode.pause();
            return;  // ← KHÔNG ghi log khi GPS bất thường, chỉ block
        }

        setIsProcessing(true);
        if (html5QrCode) html5QrCode.pause();

        // Parse QR data
        let qrData = txt;
        try {
            const urlObj = new URL(txt);
            const parts = urlObj.pathname.split('/').filter(Boolean);
            if (parts[0] === 'scan' && parts[1]) qrData = parts[1];
        } catch { /* dùng thẳng */ }

        setPendingScanData(qrData);
        const targetPoint = currentProjectQrPoints.find(p => p.data === qrData);

        // ── Geofencing: để backend xử lý hoàn toàn ──
        // Frontend không check geofence nữa → tránh double-check và race condition
        // Backend sẽ trả __invalidLocation nếu sai vị trí

        setScanResult({ qrCode: { name: targetPoint?.name || 'Mã Mới' }, suspicionScore: gpsValidation.suspicionScore });
    };

    const resumeScanning = () => {
        setScanResult(null); setPendingScanData(null); setIsProcessing(false); setShowGpsErrorModal(false);
        if (html5QrCode) html5QrCode.resume();
    };

    const confirmCheckIn = async () => {
        if (!pendingScanData) return;
        const loc = userLocation ? `${userLocation.lat},${userLocation.lng}` : 'Unknown';
        await submitScanLog(pendingScanData, 'VALID', loc);
    };

    // ─── submitScanLog ────────────────────────────────────────────────────────
    const submitScanLog = async (qrData: string, status: string, location = '') => {
        try {
            const gpsValidation = userLocation ? validateGps(userLocation, prevLocation) : { suspicionScore: 0 };

            const res = await fetch(`${apiUrl}/api/scans`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    qrCodeData: qrData,
                    location,
                    status,
                    latitude: userLocation?.lat,
                    longitude: userLocation?.lng,
                    altitude: userLocation?.altitude ?? null,
                    accuracy: userLocation?.accuracy ?? null,
                    suspicionScore: (gpsValidation as any).suspicionScore ?? 0,
                }),
            });

            // ── Parse body dù thành công hay lỗi ──
            let resBody: any = {};
            try { resBody = await res.json(); } catch { /* body rỗng */ }

            if (res.ok || res.status === 201) {

                // ── CALIBRATION: QR chưa có tọa độ → hỏi xác nhận ──
                if (resBody.__needsCalibration) {
                    setCalibrationQrData(qrData);
                    setCalibrationQrName(resBody.qrCodeName || 'Điểm quét');
                    setShowCalibrationModal(true);
                    setScanResult(null);
                    if (html5QrCode) html5QrCode.pause();
                    return;
                }

                // ── INVALID LOCATION: backend trả về object thay vì throw ──
                // (tránh vào catch, tránh spam modal lỗi)
                if (resBody.__invalidLocation) {
                    setGpsErrorMessage(`Vui lòng di chuyển đến đúng vị trí mã đã được bố trí (cách ${resBody.distance}m).`);
                    setShowGpsErrorModal(true);
                    setScanResult(null);
                    if (html5QrCode) html5QrCode.pause();
                    return;
                }

                // ── CHECK-IN VALID thành công ──
                if (status === 'VALID') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Check-in thành công!',
                        html: `<p class="text-sm text-gray-500">Đã ghi nhận tại <b>${resBody.qrCode?.name || 'điểm quét'}</b></p>`,
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    setLastScanTime(Date.now());
                }
                fetchLogs();
                resumeScanning();

            } else {
                // ── Lỗi từ server (4xx, 5xx) ──
                const errMsg: string = resBody?.message || 'Có lỗi xảy ra.';

                if (res.status === 400 && errMsg.includes('Thao tác quá nhanh')) {
                    Swal.fire({ icon: 'warning', title: '⏱ Quá nhanh!', text: errMsg, timer: 2500, showConfirmButton: false });
                    resumeScanning();
                } else if (res.status === 403) {
                    Swal.fire({ icon: 'error', title: 'Không có quyền', text: errMsg });
                    resumeScanning();
                } else {
                    Swal.fire({ icon: 'error', title: 'Lỗi', text: errMsg });
                    resumeScanning();
                }
            }

        } catch (e: any) {
            // Lỗi mạng thật sự (offline, timeout) — KHÔNG hiện "Kết nối bị gián đoạn" khi đã check-in xong
            console.error('Network error:', e);
            // Thử fetch lại logs để xem check-in có thực sự thành công không
            await fetchLogs();
            // Nếu status VALID → kiểm tra log mới nhất
            if (status === 'VALID') {
                // Không hiện lỗi, fetchLogs sẽ cập nhật bảng — user tự thấy kết quả
                Swal.fire({
                    icon: 'warning',
                    title: 'Mất kết nối tạm thời',
                    text: 'Vui lòng kiểm tra nhật ký để xác nhận check-in.',
                    timer: 2500,
                    showConfirmButton: false,
                });
            }
            resumeScanning();
        }
    };

    // ─── Calibration: lưu tọa độ cho QR point ────────────────────────────────────
    const confirmCalibration = async () => {
        if (!calibrationQrData || !userLocation) return;
        try {
            const res = await fetch(`${apiUrl}/api/scans`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    qrCodeData: calibrationQrData,
                    status: 'VALID',
                    location: `${userLocation.lat},${userLocation.lng}`,
                    latitude: userLocation.lat,
                    longitude: userLocation.lng,
                    altitude: userLocation.altitude ?? null,
                    accuracy: userLocation.accuracy ?? null,
                    confirmSetLocation: true,   // ← flag báo backend lưu tọa độ
                }),
            });
            if (res.ok || res.status === 201) {
                Swal.fire({
                    icon: 'success',
                    title: 'Đã lưu vị trí!',
                    html: `<p class="text-sm text-gray-600">Tọa độ của <b>${calibrationQrName}</b> đã được lưu.<br/>Từ nay nhân viên phải đứng trong vòng <b>10m</b> mới quét được.</p>`,
                    confirmButtonText: 'OK',
                });
                setLastScanTime(Date.now());
                fetchLogs();
                fetchQrCodes();
            } else {
                Swal.fire('Lỗi', 'Không thể lưu tọa độ.', 'error');
            }
        } catch {
            Swal.fire('Lỗi kết nối', 'Không thể kết nối máy chủ.', 'error');
        }
        setShowCalibrationModal(false);
        setCalibrationQrData(null);
        resumeScanning();
    };

    const skipCalibration = async () => {
        // Bỏ qua calibration → vẫn check-in nhưng không lưu tọa độ
        if (!calibrationQrData || !userLocation) { setShowCalibrationModal(false); resumeScanning(); return; }
        try {
            await fetch(`${apiUrl}/api/scans`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    qrCodeData: calibrationQrData,
                    status: 'VALID',
                    location: `${userLocation.lat},${userLocation.lng}`,
                    latitude: userLocation.lat,
                    longitude: userLocation.lng,
                    accuracy: userLocation.accuracy ?? null,
                    confirmSetLocation: false,
                }),
            });
            // Gọi lại với flag false → backend sẽ cần xử lý
            // (tạm thời chỉ thông báo)
        } catch { /* ignore */ }
        Swal.fire({ icon: 'info', title: 'Đã bỏ qua', text: 'Check-in không có tọa độ. Geofence chưa hoạt động cho điểm này.', timer: 2000, showConfirmButton: false });
        setLastScanTime(Date.now());
        setShowCalibrationModal(false);
        setCalibrationQrData(null);
        fetchLogs();
        resumeScanning();
    };

    // ─── QR CRUD ─────────────────────────────────────────────────────────────────
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
                headers: authHeaders(),
                body: JSON.stringify({ ...formData, projectId: selectedProjectId }),
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

    // ─── QR Download ─────────────────────────────────────────────────────────────
    const AEGISM_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABQCAYAAABcbTqwAAA/EklEQVR4nO29eZhcx3Uf+jun6t5epmcfDAb7ToAASRAESYnrDClREheREskmZdmSlViRE8lJ/CWWl3iZGb18eXZiPzt2nFjy59iOLEvCaLEkyqR2DCmZFGlwEwVuAEjsywCYvbvvrapz3h+3BxiAM1hIUPZ7mt/3XXSj5y5VdetUneVXp4A5zGEOc5jDHOYwhznMYQ5zmMMc5jCHOczhnzvon9Fz9E0vxRzm8M8RRDTjwczg+id6e/mfupxzmMPpeLNnEEI2MxCA5jOckwCovMllmcMczhtvroD09jL6+3HDL//GFzrXXXpLcD4wMSsUUAFLAhezsHdj27/5rZ966Wtf+kH9GnlTyzWHOZwj7Jt14+7uXjvY3++X3VZ+1+b3f/C98fK18C6AmaEAjBIiArwJKDTZ5jSt/NuXvvalH/T29HD/nIDM4Z8J3rQZRFWZiPS63/mDr17xi//m9kqlEljUKBREBJAFIUbkWU1bno4Ofu3w395754tYZjCHWfHmCEhvL6MqJRs23fbyWCXaHwkCYELSCX2DiSISgFq2SRQQ2RQ3YSF29fTywXdtYmIPt0k2sOczgvvDkC0t3Lqkp2w6bbXt5bicZHkhC4gFTi7NAcUkQQCajaBFVX0dyiZVj4lk13A0BvX9+bUqw5zOF88eYISE+fANDCirXvnRzPY8/O/RRiQYoaHKVIOYGKwqYWE8Yh+BrnHLBgycJ3Ash94m1v8/jJxWjmMIdZ8WYISKGfBPPmdfGKjdfBWhx4YYcJaiEiUBFQEJAP8GBoiEABXPVe8isuWdJ+zU3XqQhQLs/FRebwT44L3wnrHbt5840b4hXrCtwQ6+E9B1Ad9yCy0ABoAIIqEg2AI6gyKi6R4pLVWH7ddXcBQO9HPzo3g8zhnxwX3s1bLgMDA0xNS/+jaW3XfOMRmd17wBw/cBiLV3XB+yoUBLACShACSBQaPNtCA1rXXHwHgF/r6+lJ+i944X7qwEC5PtAMKICfvPu8XDZllHFk/Y9PDHiD2zco1v9Y/78Q77rQAkK47/4AoJEWXXR1yhGZpgJDDfa9uhdLViyGCwrDBAoEJQUoMzYIwknVSePKdSsar7pqExE9inLZYGAgXOAynr0O5TJ3Hzly8oUCwOCgfx334nK5TEem3Wv6Pbun7l3/PhsGz+/ZjHKZMLBegX4BBqb9qZdR3j7tb2cFlctlnl7+wc5OPad3Ui4b3bJFiCgMnFKGaaVR5a09fTw42B8wi1tfVanvNHu0v68Pb0i4env5dEfQbPe8sGpMPQpub3zbVY13/voP0LHI+OEDPP70LrQsaMJt99wKzwlYDQgGygHMBFUFM2BM3kfG20f/56/91+1/8ie/1t2bBRsvaBn/f42yAU523vYFF63LNTW1AcD4+LGj4wdeeenkub0M9CvehHhTecsWM3DffQEAbOfqty676tqLEsWdoqTqHCE2nz74+MN7cHT3UwBATNB77v1JDYZT9KdzwoWeQRiA5JZffrfp6Iq8c57zJbaNTRgdGsexw8fQuqgZ3ikMFDr1eghQBXyacqGlEfNXXnrHduA3tvb1BervP68KvQEQAG1dsHJpvrH1l4oNHT+KDCa9YZocPSoHX3ji6wDSc7yXARAWrb7k5+J8441NzV0PiqTGiRcACAEA6n0hZN+MyS4zBjCoh4GsgZsYk8qxnd/Yt29fFbO/XALKDAyEQtvqxe2d8++Cjd4nhKtCkJyqotiypNo2b8W2tFLZ75LJ/3p0T/+T2aW9PMNsQgB05crLOqml/YOFQuNO7z2ZnEH1+OFk13OPP3SyAqdep6ogotCw8cabVr/jtt+at3TlzfGCZTANbXDGwCOARobu2fiuOzF+6NDD+5598i9e/fpffg0DA8OAEkBZ/eraw5rbf+aXlrzlpp+pTBzyNXEcR43Y/ey23z784S99u/SvoCwOsiqHYOAUC0b+tDQFP/F+7n45itf5TLpr+fQvPmG29qWr1+ha8kkks8Cxt4o5kq63nWGeRCCAiBWTBvXomXr1ntSGAUrIR6pydQZBHFMQQORITD//gcl97RAtEYrFmlSRXKFoQqNBSIqiE0Ll89f+XP3nHjrs/89d+Xy1t4YOC+C+/u7e5mDA5KoSH/bpNvNBD1BmqhQkGUiBkEYi+kHBfWtS1fc9XxV+mHON01enYISFlD8kz10PP/69Q/4OGp767a7zNGSHt7BP2DHBca71RbVFJhqzUAVglW1U+aidGDvz+y95lfO718lQNPPlABHmleuul/Rc2dP2Oi9qokk4XayN5frR3YuXdK+JC5shE8oAyAtC6deoqAbG5t5W1A0AXLr47ybeoLg7oWel2TKUEiUCroYd9LOiHWnXEKcWqhxALdSr71bBQa4cNgICB5IpOqfCiCgCPCUfFHzWHdVP3pJlFQgakXGCpqkCcUuFZm0xJuYClcrQCcUuwPIKBSCbsCKmLYuSaQQlS4lQShQBYgLAINmqaiygHBFfHs2YoYJ0RoqiUgwC3Cw/ky+4U29AqIeJRcTQ4SoJcG6BYTt2yEGJXUSAVJqr+SiZaFgFl3jFp4aRh+NNUI55hM0Z5fLqS+lGOkJ4A8yjpGJCgqMJwp1WuIY/Mrc/9GG0KSsTKMjn0M3QjMlTdJopjjYNPH8pgb/nF6+58Zmx7z5zrv3lXauMMfEamqPSe5BKRO0VJqiMoJJ4aUx/xoUNt3qP/FtBLWfNTx1pj7FU8IQNQ1a0hPQr2FkQ1qbB6JA2bqRe3GzIx7cNANdZk18B+UNQ17b4RQcQTbxjpQaggOGf26IaA3eNbFkBuIq6e8PmE2NuX7PfPH/e9F0ZaRXfbr5k6eSp9CqBpuGc7qGLnDCvBb1XlCVMpwXNfV6M01VHBfWqIVF0aOjgZg97qWFDhMpBSqCe5n0AHgegaVt0eVU/mNSsalsFibk/LlGLxNIqV2IeD04WMX3R4bj8ZiMCdg0gNX08JQsM9AFAk7tO2cHl3kBISYMCSwx9D3RXgiqB0F2hJdJNiAtmFIGIpVlrOtIqzQmK2TLwvbEL89oXf2bSsPXLHi/xsePOJBi30h59HRTbPdE6jNPuCoWbOTw1eXX1i+M+X2jO8f0vDarR7pLH79vQFxZbAMWDGCiFJMEoCCfMd1GBEM';

    const buildQrCanvas = (point: any): Promise<HTMLCanvasElement> => {
        return new Promise((resolve) => {
            const QR_SIZE = 560;
            const LABEL_H = 68;
            const DASH_PAD = 16;
            const TOTAL_W = QR_SIZE + DASH_PAD * 2;
            const TOTAL_H = QR_SIZE + LABEL_H + DASH_PAD * 2;
            const canvas = document.createElement('canvas');
            canvas.width = TOTAL_W; canvas.height = TOTAL_H;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, TOTAL_W, TOTAL_H);
            ctx.save(); ctx.strokeStyle = '#aab4c0'; ctx.lineWidth = 2.5;
            ctx.setLineDash([10, 6]); ctx.strokeRect(3, 3, TOTAL_W - 6, TOTAL_H - 6); ctx.restore();
            const srcCanvas = document.getElementById(`qrcode-${point.id}`)?.querySelector('canvas') as HTMLCanvasElement;
            if (srcCanvas) ctx.drawImage(srcCanvas, DASH_PAD, DASH_PAD, QR_SIZE, QR_SIZE);
            ctx.fillStyle = '#1e293b'; ctx.font = 'bold 26px Inter, ui-sans-serif, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(point.name, TOTAL_W / 2, DASH_PAD + QR_SIZE + LABEL_H / 2);
            resolve(canvas);
        });
    };

    const downloadQrById = async (id: string, name: string) => {
        const point = currentProjectQrPoints.find(p => p.id === id);
        if (!point) return;
        const canvas = await buildQrCanvas(point);
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png'); a.download = `QR-${name}.png`; a.click();
    };

    const downloadSelectedQrs = async () => {
        if (selectedQrIds.length === 0) { Swal.fire('Thông báo', 'Chưa chọn mã QR nào.', 'info'); return; }
        if (selectedQrIds.length === 1) { const p = currentProjectQrPoints.find(p => p.id === selectedQrIds[0]); if (p) await downloadQrById(p.id, p.name); return; }
        Swal.fire({ title: 'Đang tạo file ZIP...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
        try {
            const JSZip = await loadJSZip(); const zip = new JSZip();
            for (const id of selectedQrIds) {
                const point = currentProjectQrPoints.find(p => p.id === id); if (!point) continue;
                const canvas = await buildQrCanvas(point);
                const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/png'));
                zip.file(`QR-${point.name}.png`, blob);
            }
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(zipBlob);
            a.download = `QR-codes-${selectedQrIds.length}.zip`; a.click(); Swal.close();
        } catch (e) { Swal.fire('Lỗi', 'Không thể tạo file ZIP', 'error'); }
    };

    const downloadAllQrs = async () => {
        if (currentProjectQrPoints.length === 0) return;
        if (currentProjectQrPoints.length === 1) { await downloadQrById(currentProjectQrPoints[0].id, currentProjectQrPoints[0].name); return; }
        Swal.fire({ title: 'Đang tạo file ZIP...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
        try {
            const JSZip = await loadJSZip(); const zip = new JSZip();
            for (const point of currentProjectQrPoints) {
                const canvas = await buildQrCanvas(point);
                const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/png'));
                zip.file(`QR-${point.name}.png`, blob);
            }
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(zipBlob);
            a.download = `QR-all-${currentProjectQrPoints.length}.zip`; a.click(); Swal.close();
        } catch (e) { Swal.fire('Lỗi', 'Không thể tạo file ZIP', 'error'); }
    };

    const toggleSelectQr = (id: string) => setSelectedQrIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    // ─── Incident ─────────────────────────────────────────────────────────────────
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
                headers: authHeaders(),
                body: JSON.stringify({
                    qrCodeData: pendingScanData, status: 'ISSUE',
                    location: userLocation ? `${userLocation.lat},${userLocation.lng}` : '',
                    latitude: userLocation?.lat, longitude: userLocation?.lng,
                    accuracy: userLocation?.accuracy ?? null,
                    issueDescription: incidentForm.description, images: incidentForm.images,
                }),
            });
            if (res.ok || res.status === 201) {
                Swal.fire({ icon: 'success', title: 'Đã báo cáo sự cố!', timer: 1500, showConfirmButton: false });
                setShowIssueModal(false); setIncidentForm({ description: '', images: [] });
                fetchLogs(); fetchIncidents(); resumeScanning();
            } else {
                const err = await res.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Không thể báo cáo', text: err.message || 'Vui lòng thử lại.' });
            }
        } catch { Swal.fire({ icon: 'error', title: 'Lỗi kết nối', text: 'Không thể kết nối máy chủ.' }); }
        setIsSubmitting(false);
    };

    const confirmAssign = async () => {
        if (!tempAssign || !selectedIssue) return;
        try {
            const res = await fetch(`${apiUrl}/api/incidents/${selectedIssue.id}/assign`, {
                method: 'PUT', headers: authHeaders(),
                body: JSON.stringify({ department: tempAssign }),
            });
            if (res.ok) { Swal.fire({ icon: 'success', title: 'Đã phân công!', timer: 1500, showConfirmButton: false }); setShowAssignModal(false); fetchIncidents(); }
            else { const err = await res.json(); Swal.fire('Lỗi', err.message, 'error'); }
        } catch { Swal.fire('Lỗi', 'Không thể phân công', 'error'); }
    };

    // ─── Filtered data ────────────────────────────────────────────────────────────
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

    // ─── GPS Status UI ────────────────────────────────────────────────────────────
    const gpsStatusConfig = {
        waiting: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <FaCircleNotch className="animate-spin" />, text: 'Đang lấy tọa độ GPS...' },
        ok: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <FaSatelliteDish />, text: `GPS OK (±${Math.round(userLocation?.accuracy ?? 0)}m)` },
        weak: { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: <FaWifi />, text: `GPS yếu (±${Math.round(userLocation?.accuracy ?? 0)}m) — Ra ngoài trời` },
        error: { color: 'bg-red-50 text-red-700 border-red-200', icon: <FaCircleExclamation />, text: 'GPS bất thường — Kiểm tra ứng dụng vị trí' },
    }[gpsStatus];

    // ─── Render ───────────────────────────────────────────────────────────────────
    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 h-full font-sans text-gray-800">

            {/* ── TOOLBAR ── */}
            <div className="bg-white px-6 py-4 border-b border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 m-6 rounded-xl">
                <div className="flex items-center w-full sm:w-auto gap-3">
                    <span className="font-semibold text-gray-600 text-sm">Dự án:</span>
                    <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50">
                        {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        {['list', 'scan', 'incidents'].map(v => (
                            <button key={v} onClick={() => switchView(v)}
                                className={`px-4 py-1.5 rounded-md text-sm transition-all duration-200 ${currentView === v ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}>
                                {v === 'list' ? 'Danh sách' : v === 'scan' ? 'Quét QR' : 'Sự cố'}
                            </button>
                        ))}
                    </div>
                    {currentView === 'list' && (hasPermission('CREATE_QR') || hasPermission('MANAGE_QRCODE')) && (
                        <button onClick={openCreateModal}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-blue-700 flex items-center gap-2 text-sm transition">
                            <FaPlus /> Thêm QR
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-x-hidden overflow-y-auto px-6 pb-6">
                {!isLoading && selectedProjectId && (
                    <>
                        {/* ════════════════════════════════ VIEW: LIST ════════════════════════════════ */}
                        {currentView === 'list' && (
                            <div className="space-y-8">
                                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                                    <div className="relative w-full sm:w-72">
                                        <FaMagnifyingGlass className="absolute left-3 top-3 text-gray-400 text-sm" />
                                        <input type="text" value={searchQr} onChange={e => setSearchQr(e.target.value)}
                                            placeholder="Tìm kiếm mã QR..."
                                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white" />
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedQrIds.length > 0 && (
                                            <button onClick={downloadSelectedQrs}
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition shadow-sm">
                                                <FaDownload /> Tải {selectedQrIds.length} mã
                                            </button>
                                        )}
                                        <button onClick={downloadAllQrs}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-sm font-bold hover:bg-blue-100 transition">
                                            <FaDownload /> Tải tất cả
                                        </button>
                                    </div>
                                </div>

                                {/* QR Cards */}
                                <div ref={qrScrollRef} className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'thin' }}>
                                    {filteredQrPoints.map((point: any) => (
                                        <div key={point.id}
                                            className={`flex-shrink-0 w-56 bg-white p-5 rounded-xl shadow-sm border-2 transition duration-200 relative group flex flex-col items-center text-center snap-start cursor-pointer
                                                ${selectedQrIds.includes(point.id) ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 hover:border-blue-300 hover:shadow-md'}`}
                                            onClick={() => toggleSelectQr(point.id)}>
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
                                            <div className="mb-3 mt-2">
                                                <div className="p-2 bg-white border border-gray-100 rounded-lg shadow-inner">
                                                    <QRCodeCanvas value={`https://aegism.online/scan/${point.data}`} size={90} />
                                                </div>
                                                <div id={`qrcode-${point.id}`} style={{ position: 'absolute', left: -9999, top: -9999 }}>
                                                    <QRCodeCanvas value={`https://aegism.online/scan/${point.data}`} size={480} />
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
                                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                                <FaClockRotateLeft className="text-blue-600" /> Nhật ký quét gần đây
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <FaMagnifyingGlass className="absolute left-3 top-2.5 text-gray-400 text-xs" />
                                                    <input type="text" value={searchLog} onChange={e => { setSearchLog(e.target.value); setCurrentLogPage(1); }}
                                                        placeholder="Tìm kiếm log..."
                                                        className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-48 bg-white" />
                                                </div>
                                                <button onClick={fetchLogs} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                                                    <FaRotate /> Làm mới
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                                <tr>
                                                    <th className="px-6 py-3">Thời gian</th>
                                                    <th className="px-6 py-3">Điểm quét</th>
                                                    <th className="px-6 py-3">Vị trí</th>
                                                    <th className="px-6 py-3">Bộ phận</th>
                                                    <th className="px-6 py-3">Nhân viên</th>
                                                    <th className="px-6 py-3">Trạng thái</th>
                                                    <th className="px-6 py-3">Nghi ngờ</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 text-sm">
                                                {paginatedLogs.map((log: any) => (
                                                    <tr key={log.id} className="hover:bg-blue-50/20 transition">
                                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs whitespace-nowrap">{new Date(log.scannedAt).toLocaleString('vi-VN')}</td>
                                                        <td className="px-6 py-4 font-bold text-gray-700">{log.qrCode?.name || 'Unknown'}</td>
                                                        <td className="px-6 py-4 text-gray-500 text-xs">{log.location || 'N/A'}</td>
                                                        <td className="px-6 py-4">
                                                            {log.user?.role?.name
                                                                ? <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">{log.user.role.name}</span>
                                                                : <span className="text-gray-400 text-xs">—</span>}
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-blue-600">{log.user?.fullName || 'N/A'}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded text-xs font-bold ${log.status === 'VALID' ? 'bg-emerald-100 text-emerald-700' : log.status === 'INVALID_LOCATION' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                                                {log.status === 'VALID' ? 'Hợp lệ' : log.status === 'INVALID_LOCATION' ? 'Sai vị trí' : 'Sự cố'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {log.suspicionScore > 0 && (
                                                                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full
                                                                    ${log.suspicionScore >= 70 ? 'bg-red-100 text-red-700' : log.suspicionScore >= 40 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                    <FaShield className="text-xs" /> {log.suspicionScore}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {paginatedLogs.length === 0 && (
                                                    <tr><td colSpan={7} className="p-8 text-center text-gray-400 italic">Chưa có dữ liệu nhật ký.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {totalLogPages > 1 && (
                                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                            <span className="text-sm text-gray-500">
                                                {(currentLogPage - 1) * LOGS_PER_PAGE + 1}–{Math.min(currentLogPage * LOGS_PER_PAGE, filteredLogs.length)} / {filteredLogs.length} bản ghi
                                            </span>
                                            <div className="flex gap-1">
                                                <button onClick={() => setCurrentLogPage(p => Math.max(1, p - 1))} disabled={currentLogPage === 1}
                                                    className="px-3 py-1.5 rounded border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition">‹</button>
                                                {Array.from({ length: totalLogPages }, (_, i) => i + 1)
                                                    .filter(p => p === 1 || p === totalLogPages || Math.abs(p - currentLogPage) <= 1)
                                                    .map((p, idx, arr) => (
                                                        <span key={p}>
                                                            {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-2 py-1.5 text-gray-400">...</span>}
                                                            <button onClick={() => setCurrentLogPage(p)}
                                                                className={`px-3 py-1.5 rounded border text-sm font-medium transition ${currentLogPage === p ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}>
                                                                {p}
                                                            </button>
                                                        </span>
                                                    ))}
                                                <button onClick={() => setCurrentLogPage(p => Math.min(totalLogPages, p + 1))} disabled={currentLogPage === totalLogPages}
                                                    className="px-3 py-1.5 rounded border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition">›</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ════════════════════════════════ VIEW: SCAN ════════════════════════════════ */}
                        {currentView === 'scan' && (
                            <div className="flex flex-col items-center gap-4">
                                <style>{`
                                    #reader { border: none !important; padding: 0 !important; }
                                    #reader video { border: none !important; outline: none !important; width: 100% !important; height: 100% !important; object-fit: cover !important; }
                                    #reader__scan_region { border: none !important; background: transparent !important; padding: 0 !important; }
                                    #reader__scan_region > img { display: none !important; }
                                    #reader__scan_region > div { display: none !important; }
                                    #reader__dashboard { display: none !important; }
                                    #reader__header_message { display: none !important; }
                                    #reader__status_span { display: none !important; }
                                    #qr-shaded-region { display: none !important; }
                                `}</style>

                                <div className="relative bg-black overflow-hidden shadow-2xl w-full md:w-[480px]"
                                    style={{ aspectRatio: '1/1', borderRadius: '20px' }}>
                                    <div id="reader" className="w-full h-full" />
                                    {scannerActive && (
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: '65%', height: '65%' }}>
                                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
                                                <div className="absolute left-0 right-0 h-0.5 bg-blue-400 opacity-80 animate-bounce" style={{ top: '50%' }} />
                                            </div>
                                            <div className="absolute inset-0" style={{
                                                background: 'linear-gradient(rgba(0,0,0,0.5) 17.5%,transparent 17.5%,transparent 82.5%,rgba(0,0,0,0.5) 82.5%),linear-gradient(90deg,rgba(0,0,0,0.5) 17.5%,transparent 17.5%,transparent 82.5%,rgba(0,0,0,0.5) 82.5%)'
                                            }} />
                                            <div className="absolute bottom-5 left-0 w-full text-center text-white/90 text-sm font-semibold">Đưa mã QR vào khung để quét</div>
                                        </div>
                                    )}
                                    {!scannerActive && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-10 gap-4">
                                            <div className="w-20 h-20 rounded-2xl bg-blue-600/20 border-2 border-blue-500/50 flex items-center justify-center">
                                                <FaCamera className="text-3xl text-blue-400" />
                                            </div>
                                            <button onClick={startScanner}
                                                className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition flex items-center gap-2">
                                                <FaCamera /> Bắt đầu Quét
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className={`text-xs px-4 py-2.5 rounded-full flex items-center gap-2 shadow-sm border font-medium ${gpsStatusConfig.color}`}>
                                    {gpsStatusConfig.icon}
                                    <span>{gpsStatusConfig.text}</span>
                                    {gpsStatus === 'ok' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-100 px-4 py-2 rounded-full">
                                    <FaShield className="text-blue-400" />
                                    <span>Hệ thống phát hiện giả mạo vị trí đang hoạt động</span>
                                </div>
                            </div>
                        )}

                        {/* ════════════════════════════════ VIEW: INCIDENTS ════════════════════════════ */}
                        {currentView === 'incidents' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                        <FaTriangleExclamation className="text-red-500" /> Quản lý Sự cố
                                    </h3>
                                    <button onClick={fetchIncidents} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                        <FaRotate /> Làm mới
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
                                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><FaLocationDot />{issue.location || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{issue.description}</td>
                                                    <td className="px-6 py-4 text-gray-500">{issue.reporterName || 'N/A'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${issue.department !== 'Unassigned' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                                                            {issue.department !== 'Unassigned' ? issue.department : 'Chưa phân công'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {!issue.hasTask && (hasPermission('ASSIGN_TASK') || hasPermission('MANAGE_TASK'))
                                                            ? <button onClick={() => { setSelectedIssue(issue); setTempAssign(''); setShowAssignModal(true); }}
                                                                className="text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition">Phân công</button>
                                                            : issue.hasTask
                                                                ? <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1 w-fit"><FaCheck /> Đã tạo Task</span>
                                                                : null}
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

            {/* ══════════════════════════════════ MODALS ══════════════════════════════════ */}

            {/* Check-in Confirm */}
            {scanResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={resumeScanning} />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 p-6 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaCheck className="text-2xl text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Đã tìm thấy mã!</h3>
                        <p className="text-sm font-medium text-gray-600 mb-1">{scanResult.qrCode?.name}</p>
                        <p className="text-xs font-mono bg-gray-100 p-2 rounded mb-1 break-all text-gray-500">{pendingScanData}</p>
                        {scanResult.suspicionScore > 0 && (
                            <p className={`text-xs mb-3 flex items-center justify-center gap-1 font-bold ${scanResult.suspicionScore >= 70 ? 'text-red-600' : 'text-orange-500'}`}>
                                <FaShield /> Điểm nghi ngờ: {scanResult.suspicionScore}/100
                            </p>
                        )}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button onClick={confirmCheckIn} className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition">Check-in</button>
                            <button onClick={openReportModal} className="py-3 bg-white border-2 border-red-100 text-red-500 rounded-xl font-bold hover:bg-red-50 transition">Báo Sự cố</button>
                        </div>
                        <button onClick={resumeScanning} className="mt-4 text-gray-400 hover:text-gray-600 text-sm">Bỏ qua, tiếp tục quét</button>
                    </div>
                </div>
            )}

            {/* GPS Error */}
            {showGpsErrorModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-red-900/70 backdrop-blur-md" />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 p-6 text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaLocationCrosshairs className="text-4xl text-red-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-red-600 mb-3">⚠️ Vị trí không hợp lệ</h3>
                        <p className="text-gray-700 mb-6 text-sm leading-relaxed">{gpsErrorMessage}</p>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowGpsErrorModal(false); resumeScanning(); }}
                                className="flex-1 py-3 bg-gray-600 text-white rounded-xl font-bold hover:bg-gray-700 transition">Tiếp tục Quét</button>
                            <button onClick={() => { setShowGpsErrorModal(false); switchView('list'); }}
                                className="flex-1 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition">Xem Danh sách</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Issue Report */}
            {showIssueModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowIssueModal(false)} />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b bg-red-50 rounded-t-2xl flex justify-between items-center">
                            <h3 className="font-bold text-red-600 flex items-center gap-2 text-lg"><FaTriangleExclamation /> Báo cáo Sự cố</h3>
                            <button onClick={() => setShowIssueModal(false)} className="text-red-400 hover:text-red-600 text-xl"><FaXmark /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-5">
                            <div>
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
                                                className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"><FaXmark /></button>
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
                            <button onClick={submitIncident} disabled={isSubmitting}
                                className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-2">
                                {isSubmitting && <FaCircleNotch className="animate-spin" />} Gửi Báo Cáo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign */}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm" onClick={() => setShowAssignModal(false)} />
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
                            <button onClick={confirmAssign} disabled={!tempAssign}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition">Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit QR */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
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

            {/* ── CALIBRATION MODAL: Lưu tọa độ QR point ── */}
            {showCalibrationModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-blue-900/70 backdrop-blur-md" />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 p-6 text-center">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaLocationDot className="text-4xl text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có tọa độ</h3>
                        <p className="text-sm text-gray-600 mb-1">
                            Điểm <span className="font-bold text-blue-600">{calibrationQrName}</span> chưa được gắn tọa độ GPS.
                        </p>
                        <p className="text-sm text-gray-500 mb-5">
                            Bạn có muốn lưu vị trí hiện tại <span className="font-bold text-emerald-600">(±{Math.round(userLocation?.accuracy ?? 0)}m)</span> làm tọa độ chuẩn cho điểm này không?
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-xs text-amber-700 text-left">
                            <b>⚠️ Lưu ý:</b> Sau khi lưu, nhân viên phải đứng trong vòng <b>10m</b> mới quét được điểm này. Hãy chắc chắn bạn đang đứng đúng chỗ dán mã.
                        </div>
                        <div className="flex gap-3">
                            <button onClick={skipCalibration}
                                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition text-sm">
                                Bỏ qua
                            </button>
                            <button onClick={confirmCalibration}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition text-sm flex items-center justify-center gap-2">
                                <FaLocationDot /> Lưu vị trí này
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview */}
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
