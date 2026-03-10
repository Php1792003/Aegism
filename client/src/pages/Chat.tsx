import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
    HiPhone, HiXMark, HiMagnifyingGlass, HiPlus,
    HiArrowLeft, HiEllipsisVertical, HiPaperClip, HiPaperAirplane,
    HiFaceSmile, HiPhoneXMark, HiChatBubbleLeftRight
} from 'react-icons/hi2';
import {
    MdMic, MdMicOff, MdVideocam, MdVideocamOff, MdCallEnd,
    MdPhoneMissed, MdPhoneInTalk, MdPhoneDisabled, MdFiberManualRecord
} from 'react-icons/md';
import {
    RiGroupLine, RiUserLine, RiMessage3Line, RiFileLine,
    RiPhoneLine, RiVideoLine
} from 'react-icons/ri';

const API_URL = 'https://api.aegism.online';

// TURN server - Metered.ca (global.relay.metered.ca)
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.relay.metered.ca:80' },
        { urls: 'stun:stun.l.google.com:19302' },
        {
            urls: 'turn:global.relay.metered.ca:80',
            username: 'b78169ee2cdf707a7814fd06',
            credential: 'WOKWqiWViSRfXziL'
        },
        {
            urls: 'turn:global.relay.metered.ca:80?transport=tcp',
            username: 'b78169ee2cdf707a7814fd06',
            credential: 'WOKWqiWViSRfXziL'
        },
        {
            urls: 'turn:global.relay.metered.ca:443',
            username: 'b78169ee2cdf707a7814fd06',
            credential: 'WOKWqiWViSRfXziL'
        },
        {
            urls: 'turns:global.relay.metered.ca:443?transport=tcp',
            username: 'b78169ee2cdf707a7814fd06',
            credential: 'WOKWqiWViSRfXziL'
        }
    ],
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all' as RTCIceTransportPolicy
};

interface User {
    id: string; name: string; email?: string; avatar?: string;
    roleName?: string; isSuperAdmin?: boolean; isTenantAdmin?: boolean;
    permissions?: string[]; tenant?: any;
}
interface Message {
    id: string; senderId: string; content: string;
    type: 'TEXT' | 'IMAGE' | 'FILE' | 'CALL_LOG';
    createdAt: string; sender: any; conversationId: string;
    reactions?: any[]; seenBy?: any[];
}
interface Conversation {
    id: string; name: string; avatar?: string; lastMessage?: string;
    lastTime?: string; unreadCount?: number; online?: boolean;
    type?: string; members?: any[];
}

const Chat: React.FC = () => {
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'members'>('chat');
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [user, setUser] = useState<User>({
        id: '', name: 'User', avatar: '', roleName: 'User',
        isSuperAdmin: false, isTenantAdmin: false, permissions: []
    });
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConv, setCurrentConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [availableMembers, setAvailableMembers] = useState<any[]>([]);
    const [globalSearch, setGlobalSearch] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [toasts, setToasts] = useState<any[]>([]);

    // Call state
    const [isInCall, setIsInCall] = useState(false);
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [isRemoteCamOn, setIsRemoteCamOn] = useState(true);
    const [callStatus, setCallStatus] = useState('Sẵn sàng');
    const [callDuration, setCallDuration] = useState(0);
    const [targetUser, setTargetUser] = useState<any>(null);

    // Refs
    const userIdRef = useRef<string>(''); // Track userId để tránh stale closure
    const callDurationRef = useRef<number>(0); // Track duration để tránh stale closure trong endCall
    const socketRef = useRef<Socket | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatMessagesRef = useRef<HTMLDivElement>(null);
    const targetUserIdForCallRef = useRef<string | null>(null);
    const currentConvRef = useRef<Conversation | null>(null);
    const callTimerIntervalRef = useRef<any>(null);
    const callTimeoutRef = useRef<any>(null);
    const remoteCandidatesQueue = useRef<RTCIceCandidate[]>([]);
    const isInCallRef = useRef(false);

    // Sound refs - dùng ref để tránh tạo lại Audio object
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);
    const waitingRef = useRef<HTMLAudioElement | null>(null);
    const notificationRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (typeof Audio !== 'undefined') {
            ringtoneRef.current = new Audio('/sound/bell.mp3');
            ringtoneRef.current.loop = true;
            waitingRef.current = new Audio('/sound/wait.mp3');
            waitingRef.current.loop = true;
            notificationRef.current = new Audio('/sound/notification.mp3');
        }
        return () => {
            stopAllCallSounds();
        };
    }, []);

    useEffect(() => { currentConvRef.current = currentConv; }, [currentConv]);
    useEffect(() => { isInCallRef.current = isInCall; }, [isInCall]);

    useEffect(() => {
        const initSystem = async () => {
            const token = localStorage.getItem('accessToken') || '';
            if (!token) return;
            await fetchUserProfile(token);
            await fetchAllMembers(token);
            await fetchConversations(token);
            initSocket(token);
        };
        initSystem();
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            stopAllCallSounds();
            if (callTimerIntervalRef.current) clearInterval(callTimerIntervalRef.current);
        };
    }, []);

    // ─── API ───────────────────────────────────────────────────────────────

    const fetchUserProfile = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/api/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) { const u = await res.json(); updateUserUI(u); }
        } catch (e) { console.error(e); }
    };

    const updateUserUI = (u: any) => {
        let roleDisplay = 'Nhân viên';
        let permissions: string[] = [];
        const isSuper = u.isSuperAdmin === true || u.isSuperAdmin === 'true';
        const isTenant = u.isTenantAdmin === true || u.isTenantAdmin === 'true';
        if (isSuper) { roleDisplay = 'Super Admin'; permissions = ['ALL']; }
        else if (isTenant) { roleDisplay = 'Quản trị viên'; permissions = ['ALL']; }
        else if (u.role) {
            roleDisplay = u.role.name;
            try {
                if (Array.isArray(u.role.permissions)) permissions = u.role.permissions;
                else if (typeof u.role.permissions === 'string') {
                    try { permissions = JSON.parse(u.role.permissions); }
                    catch { permissions = u.role.permissions.split(',').map((p: string) => p.trim()); }
                }
            } catch { permissions = []; }
        }
        let avatarUrl = u.avatar || '';
        if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:')) {
            avatarUrl = avatarUrl.startsWith('/') ? API_URL + avatarUrl : API_URL + '/' + avatarUrl;
        }
        if (!avatarUrl) {
            avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'U')}&background=2563EB&color=fff`;
        }
        userIdRef.current = u.id; // Cập nhật ref TRƯỚC setState
        setUser({
            id: u.id, name: u.fullName || 'User', email: u.email,
            avatar: avatarUrl, roleName: roleDisplay,
            isSuperAdmin: isSuper, isTenantAdmin: isTenant,
            permissions, tenant: u.tenant
        });
    };

    const fetchAllMembers = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/api/chat/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setAvailableMembers(await res.json());
        } catch { }
    };

    const fetchConversations = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/api/chat/conversations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConversations(data.sort((a: any, b: any) =>
                    new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
                ));
            }
        } catch { }
    };

    // ─── HELPERS ───────────────────────────────────────────────────────────

    const getAvatar = (u: any) => {
        if (!u) return `https://ui-avatars.com/api/?name=U&background=64748b&color=fff`;
        let src = u.avatar;
        if (!src) return `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || u.name || 'U')}&background=2563EB&color=fff`;
        if (!src.startsWith('http') && !src.startsWith('data:') && !src.includes('ui-avatars')) {
            src = src.startsWith('/') ? API_URL + src : API_URL + '/' + src;
        }
        return src;
    };

    const handleImageError = (e: any) => {
        e.target.onerror = null;
        e.target.src = `https://ui-avatars.com/api/?name=U&background=64748b&color=fff`;
    };

    const formatDateTime = (isoString: string, short = false) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        const timeStr = d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
        if (short) return timeStr;
        return `${timeStr} ${d.getDate()}/${d.getMonth() + 1}`;
    };

    const formatDuration = (s: number) =>
        `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    // ─── SOUND ─────────────────────────────────────────────────────────────

    const playRingtone = () => {
        try { ringtoneRef.current?.play().catch(() => {}); } catch { }
    };
    const playWaiting = () => {
        try { waitingRef.current?.play().catch(() => {}); } catch { }
    };
    const playNotification = () => {
        try { notificationRef.current?.play().catch(() => {}); } catch { }
    };
    const stopRingtone = () => {
        try { if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current.currentTime = 0; } } catch { }
    };
    const stopWaiting = () => {
        try { if (waitingRef.current) { waitingRef.current.pause(); waitingRef.current.currentTime = 0; } } catch { }
    };
    const stopAllCallSounds = () => {
        stopRingtone();
        stopWaiting();
    };

    const showToast = (type: string, title: string, msg: string, avatar: string | null = null) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, title, msg, avatar }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            if (chatMessagesRef.current) {
                chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
            }
        }, 100);
    };

    // ─── SOCKET ────────────────────────────────────────────────────────────

    const initSocket = (token: string) => {
        const socket = io(API_URL, { query: { token }, transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => console.log('Socket Connected:', socket.id));

        socket.on('newMessage', (msg) => {
            if (currentConvRef.current?.id === msg.conversationId) {
                setMessages(prev => [...prev, msg]);
                scrollToBottom();
                socket.emit('markSeen', {
                    conversationId: currentConvRef.current?.id,
                    messageId: msg.id
                });
            }
            setConversations(prev => {
                const newConvs = [...prev];
                const idx = newConvs.findIndex(c => c.id === msg.conversationId);
                if (idx !== -1) {
                    const updated = { ...newConvs[idx] };
                    updated.lastMessage = msg.type === 'IMAGE' ? '📷 Hình ảnh'
                        : msg.type === 'FILE' ? '📎 Tệp tin' : msg.content;
                    updated.lastTime = msg.createdAt;
                    if (!currentConvRef.current || currentConvRef.current.id !== msg.conversationId) {
                        updated.unreadCount = (updated.unreadCount || 0) + 1;
                    }
                    newConvs.splice(idx, 1);
                    newConvs.unshift(updated);
                    return newConvs;
                } else {
                    fetchConversations(token);
                    return prev;
                }
            });
            // Dùng userIdRef tránh stale closure
            if (msg.senderId !== userIdRef.current && msg.type !== 'CALL_LOG') {
                playNotification();
                showToast('message', msg.sender.fullName,
                    msg.type === 'TEXT' ? msg.content : '[Media]', getAvatar(msg.sender));
            }
        });

        socket.on('messageSeen', (data) => {
            if (currentConvRef.current?.id === data.conversationId) {
                setMessages(prev => prev.map(m => {
                    if (m.id === data.messageId) {
                        const seenBy = m.seenBy || [];
                        if (!seenBy.some((v: any) => v.user.id === data.userId)) {
                            return { ...m, seenBy: [...seenBy, { user: data.user || { id: data.userId, fullName: 'User' } }] };
                        }
                    }
                    return m;
                }));
            }
        });

        socket.on('messageReactionUpdate', (data) =>
            setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, reactions: data.reactions } : m))
        );

        socket.on('messageUpdated', (updatedMsg) => {
            setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
            fetchConversations(token);
        });

        socket.on('call-made', async (data) => {
            if (isInCallRef.current) {
                socket.emit('call-busy', { toUser: data.fromUserId, conversationId: currentConvRef.current?.id });
                return;
            }
            setIncomingCall(data);
            playRingtone();
        });

        socket.on('user-busy', () => {
            showToast('warning', 'Người nhận đang bận', 'Đang trong cuộc gọi khác.');
            stopWaiting();
            if (currentConvRef.current) {
                socket.emit('sendMessage', {
                    conversationId: currentConvRef.current.id,
                    content: '📞 Cuộc gọi nhỡ (Người nhận bận)',
                    type: 'CALL_LOG'
                });
            }
            endCall(false, 'BUSY', false);
        });

        socket.on('answer-made', async (data) => {
            console.log('answer-made received');
            if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
            stopWaiting();
            if (peerConnection.current) {
                try {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                    await processBufferedCandidates();
                    setCallStatus('Đang kết nối...');
                    // Timer sẽ được bật khi ICE connected
                } catch (e) {
                    console.error('setRemoteDescription error:', e);
                }
            }
        });

        socket.on('ice-candidate', async (data) => {
            const candidate = new RTCIceCandidate(data.candidate);
            if (peerConnection.current?.remoteDescription?.type) {
                await peerConnection.current.addIceCandidate(candidate);
            } else {
                remoteCandidatesQueue.current.push(candidate);
            }
        });

        socket.on('call-ended', () => {
            endCall(true);
            showToast('info', 'Cuộc gọi kết thúc', '');
        });

        socket.on('remote-camera-toggled', (status) => setIsRemoteCamOn(status));
    };

    // ─── WEBRTC ────────────────────────────────────────────────────────────

    const processBufferedCandidates = async () => {
        if (remoteCandidatesQueue.current.length > 0 && peerConnection.current) {
            for (const c of remoteCandidatesQueue.current) {
                try { await peerConnection.current.addIceCandidate(c); } catch { }
            }
            remoteCandidatesQueue.current = [];
        }
    };

    const startCallTimer = () => {
        if (callTimerIntervalRef.current) return; // Tránh chạy trùng
        callDurationRef.current = 0;
        setCallDuration(0);
        callTimerIntervalRef.current = setInterval(() => {
            callDurationRef.current += 1;
            setCallDuration(callDurationRef.current);
        }, 1000);
    };

    const createPeerConnection = () => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnection.current = pc;

        pc.onicecandidate = (e) => {
            if (e.candidate && targetUserIdForCallRef.current && socketRef.current) {
                socketRef.current.emit('ice-candidate', {
                    candidate: e.candidate,
                    toUser: targetUserIdForCallRef.current
                });
            }
        };

        pc.ontrack = (e) => {
            if (remoteVideoRef.current) {
                if (e.streams?.[0]) {
                    remoteVideoRef.current.srcObject = e.streams[0];
                } else {
                    if (!remoteVideoRef.current.srcObject) {
                        remoteVideoRef.current.srcObject = new MediaStream();
                    }
                    (remoteVideoRef.current.srcObject as MediaStream).addTrack(e.track);
                }
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('Connection state:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                setCallStatus('Đã kết nối');
                startCallTimer();
            }
            if (pc.connectionState === 'failed') {
                showToast('error', 'Kết nối thất bại', 'Không thể kết nối - kiểm tra mạng internet');
                endCall();
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('ICE state:', pc.iceConnectionState);
            if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                setCallStatus('Đã kết nối');
                // Đảm bảo timer chạy dù onconnectionstatechange không fire
                if (callTimerIntervalRef.current === null) startCallTimer();
            }
            if (pc.iceConnectionState === 'failed') {
                showToast('error', 'ICE thất bại', 'Không relay được qua TURN server');
                endCall();
            }
        };

        return pc;
    };

    // Lấy media với fallback audio-only nếu camera lỗi
    const setupLocalMedia = async (videoEnabled: boolean): Promise<boolean> => {
        if (!navigator.mediaDevices?.getUserMedia) {
            showToast('error', 'Không hỗ trợ', 'Vui lòng dùng Chrome/Firefox mới nhất trên HTTPS');
            endCall();
            return false;
        }
        try {
            let stream: MediaStream;
            let actualVideo = videoEnabled;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true },
                    video: videoEnabled ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
                });
            } catch (err1: any) {
                console.warn('Primary media failed:', err1.name);
                // Fallback: thử audio-only
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    actualVideo = false;
                    if (videoEnabled) showToast('warning', 'Camera không khả dụng', 'Đã chuyển sang gọi thoại');
                } catch (err2: any) {
                    showToast('error', 'Lỗi Microphone', `${err2.name}: Kiểm tra quyền trình duyệt`);
                    endCall();
                    return false;
                }
            }
            localStream.current = stream;
            setTimeout(() => {
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    localVideoRef.current.style.display = actualVideo ? 'block' : 'none';
                }
            }, 100);
            setIsCamOn(actualVideo);
            setIsMicOn(true);
            return true;
        } catch (err: any) {
            showToast('error', 'Lỗi Media', err.message);
            endCall();
            return false;
        }
    };

    const startCall = async (videoEnabled: boolean) => {
        if (!currentConv) return;
        const member = currentConv.members?.find(m => m.userId !== userIdRef.current);
        if (!member) {
            showToast('error', 'Lỗi', 'Không tìm thấy người nhận');
            return;
        }

        targetUserIdForCallRef.current = member.userId;
        setTargetUser(member.user || member);
        setIsInCall(true);
        setCallStatus(videoEnabled ? 'Đang gọi video...' : 'Đang gọi thoại...');
        playWaiting();
        setIsRemoteCamOn(true);

        const ok = await setupLocalMedia(videoEnabled);
        if (!ok) return;

        const pc = createPeerConnection();
        if (localStream.current) {
            localStream.current.getTracks().forEach(t => pc.addTrack(t, localStream.current!));
        }

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketRef.current?.emit('call-user', {
                userToCall: targetUserIdForCallRef.current,
                signalData: offer,
                fromUser: user,
                isVideoCall: videoEnabled
            });
            callTimeoutRef.current = setTimeout(() => endCall(false, 'MISSED'), 30000);
        } catch (e) {
            console.error('startCall error:', e);
            endCall();
        }
    };

    const acceptCall = async () => {
        const data = incomingCall;
        setIncomingCall(null);
        stopRingtone();
        setIsInCall(true);
        setCallStatus('Đang kết nối...');
        targetUserIdForCallRef.current = data.fromUserId;
        setTargetUser({ fullName: data.fromUserName, avatar: data.fromUserAvatar });

        const isVideo = data.isVideoCall || false;
        setIsCamOn(isVideo);
        setIsRemoteCamOn(isVideo);

        const ok = await setupLocalMedia(isVideo);
        if (!ok) return;

        const pc = createPeerConnection();
        if (localStream.current) {
            localStream.current.getTracks().forEach(t => pc.addTrack(t, localStream.current!));
        }

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            await processBufferedCandidates();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socketRef.current?.emit('make-answer', { signal: answer, toUser: data.fromUserId });
            if (!isVideo) {
                socketRef.current?.emit('toggle-camera', { toUser: data.fromUserId, status: false });
            }
            // Timer sẽ tự start khi ICE connected (oniceconnectionstatechange)
        } catch (e) {
            console.error('acceptCall error:', e);
            endCall();
        }
    };

    const rejectCall = () => {
        if (incomingCall && socketRef.current) {
            socketRef.current.emit('end-call', {
                toUser: incomingCall.fromUserId,
                conversationId: currentConv?.id,
                status: 'REJECTED',
                duration: 0
            });
        }
        setIncomingCall(null);
        stopRingtone();
    };

    const endCall = (isRemote = false, statusOverride: string | null = null, sendSignal = true) => {
        // Dùng ref để lấy duration chính xác, tránh stale closure
        const dur = callDurationRef.current;
        const status = statusOverride || (dur > 0 ? 'ENDED' : 'MISSED');
        if (!isRemote && targetUserIdForCallRef.current && sendSignal && socketRef.current) {
            socketRef.current.emit('end-call', {
                toUser: targetUserIdForCallRef.current,
                conversationId: currentConvRef.current?.id,
                duration: dur,
                status
            });
        }
        if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
        stopAllCallSounds();
        if (callTimerIntervalRef.current) clearInterval(callTimerIntervalRef.current);
        callTimerIntervalRef.current = null;

        setIsInCall(false);
        setIncomingCall(null);
        targetUserIdForCallRef.current = null;
        callDurationRef.current = 0;
        setCallDuration(0);
        setTargetUser(null);

        if (peerConnection.current) { peerConnection.current.close(); peerConnection.current = null; }
        if (localStream.current) { localStream.current.getTracks().forEach(t => t.stop()); localStream.current = null; }
        remoteCandidatesQueue.current = [];
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };

    const toggleMic = () => {
        if (localStream.current) {
            const n = !isMicOn;
            setIsMicOn(n);
            localStream.current.getAudioTracks().forEach(t => t.enabled = n);
        }
    };

    const toggleCamera = async () => {
        if (!localStream.current) return;
        const n = !isCamOn;
        if (n && localStream.current.getVideoTracks().length === 0) {
            // Audio-only call - cần thêm video track mới
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } }
                });
                const videoTrack = videoStream.getVideoTracks()[0];
                localStream.current.addTrack(videoTrack);
                if (peerConnection.current) {
                    peerConnection.current.addTrack(videoTrack, localStream.current);
                }
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = localStream.current;
                    localVideoRef.current.style.display = 'block';
                }
                setIsCamOn(true);
                socketRef.current?.emit('toggle-camera', { toUser: targetUserIdForCallRef.current, status: true });
            } catch (err: any) {
                showToast('error', 'Không mở được camera', err.message);
            }
        } else {
            localStream.current.getVideoTracks().forEach(t => { t.enabled = n; });
            if (localVideoRef.current) {
                localVideoRef.current.style.display = n ? 'block' : 'none';
            }
            setIsCamOn(n);
            socketRef.current?.emit('toggle-camera', { toUser: targetUserIdForCallRef.current, status: n });
        }
    };

    // ─── CHAT ACTIONS ──────────────────────────────────────────────────────

    const selectConversation = async (conv: Conversation) => {
        setCurrentConv(conv);
        setIsMobileChatOpen(true);
        setMessages([]);
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
        socketRef.current?.emit('joinConversation', { conversationId: conv.id });

        const token = localStorage.getItem('accessToken') || '';
        fetch(`${API_URL}/api/chat/conversations/${conv.id}/read`, {
            method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
        });

        try {
            const res = await fetch(`${API_URL}/api/chat/conversations/${conv.id}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const msgs = await res.json();
                setMessages(msgs);
                scrollToBottom();
                const lastMsg = msgs[msgs.length - 1];
                if (lastMsg && lastMsg.senderId !== userIdRef.current && socketRef.current) {
                    socketRef.current.emit('markSeen', { conversationId: conv.id, messageId: lastMsg.id });
                }
            }
        } catch { }
    };

    const startDirectChat = async (member: any) => {
        try {
            const token = localStorage.getItem('accessToken') || '';
            const res = await fetch(`${API_URL}/api/chat/direct`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ targetUserId: member.userId })
            });
            if (res.ok) {
                const rawConv = await res.json();
                const existingIdx = conversations.findIndex(c => c.id === rawConv.id);
                let convToUse: Conversation;
                if (existingIdx !== -1) {
                    const newConvs = [...conversations];
                    newConvs.splice(existingIdx, 1);
                    convToUse = { ...conversations[existingIdx], ...rawConv, name: member.fullName || member.name, avatar: getAvatar(member), online: member.online };
                    newConvs.unshift(convToUse);
                    setConversations(newConvs);
                } else {
                    convToUse = {
                        ...rawConv, name: member.fullName || member.name,
                        avatar: getAvatar(member), online: member.online,
                        type: 'DIRECT', unreadCount: 0,
                        lastMessage: 'Bắt đầu cuộc trò chuyện',
                        lastTime: new Date().toISOString()
                    };
                    if (!convToUse.members?.length) {
                        convToUse.members = [{ userId: userIdRef.current }, { userId: member.userId, user: member }];
                    }
                    setConversations(prev => [convToUse, ...prev]);
                }
                setActiveTab('chat');
                setGlobalSearch('');
                setTimeout(() => selectConversation(convToUse), 50);
            }
        } catch (e) { console.error(e); }
    };

    const sendMessage = () => {
        if (!newMessage.trim() || !currentConv) return;
        socketRef.current?.emit('sendMessage', { conversationId: currentConv.id, content: newMessage });
        setNewMessage('');
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentConv) return;
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('accessToken') || '';
        try {
            const uploadRes = await fetch(`${API_URL}/api/chat/upload`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
            });
            if (uploadRes.ok) {
                const data = await uploadRes.json();
                socketRef.current?.emit('sendMessage', {
                    conversationId: currentConv.id,
                    content: data.url,
                    type: data.type === 'IMAGE' ? 'IMAGE' : 'FILE'
                });
            }
        } catch { } finally { if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    const createGroup = async () => {
        if (!groupName) return;
        try {
            const token = localStorage.getItem('accessToken') || '';
            const res = await fetch(`${API_URL}/api/chat/groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: groupName, memberIds: selectedMembers })
            });
            if (res.ok) {
                showToast('success', 'Thành công', 'Đã tạo nhóm');
                setShowCreateGroupModal(false);
                fetchConversations(token);
                setGroupName('');
                setSelectedMembers([]);
            }
        } catch { }
    };

    const reactToMessage = (messageId: string, type: string) => {
        if (!currentConv || !socketRef.current) return;
        socketRef.current.emit('addReaction', { messageId, type, conversationId: currentConv.id });
    };

    const editMessage = async (msg: Message) => {
        const newContent = prompt('Sửa:', msg.content);
        if (newContent) {
            try {
                const token = localStorage.getItem('accessToken') || '';
                await fetch(`${API_URL}/api/chat/messages/${msg.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ content: newContent })
                });
            } catch { }
        }
    };

    const deleteMessage = async (msg: Message) => {
        if (confirm('Xóa tin nhắn này?')) {
            try {
                const token = localStorage.getItem('accessToken') || '';
                await fetch(`${API_URL}/api/chat/messages/${msg.id}`, {
                    method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch { }
        }
    };

    // ─── COMPUTED ──────────────────────────────────────────────────────────

    const filteredMembers = availableMembers.filter(m =>
        m.id !== userIdRef.current && m.name.toLowerCase().includes(globalSearch.toLowerCase())
    );
    const filteredConversations = conversations.filter(c =>
        c.name.toLowerCase().includes(globalSearch.toLowerCase())
    );

    const getUniqueReactions = (reactions: any[]) => {
        if (!reactions?.length) return [];
        const map: any = { 'LIKE': '👍', 'LOVE': '❤️', 'HAHA': '😂', 'WOW': '😮', 'SAD': '😢', 'ANGRY': '😡' };
        const grouped = reactions.reduce((acc: any, curr: any) => {
            if (!acc[curr.type]) acc[curr.type] = { icon: map[curr.type], count: 0, users: [] };
            acc[curr.type].count++;
            acc[curr.type].users.push(curr.user?.fullName);
            return acc;
        }, {});
        return Object.values(grouped).map((g: any) => ({ ...g, users: g.users.join(', ') }));
    };

    // myId dùng để phân biệt tin nhắn trái/phải - ưu tiên ref để tránh stale
    const myId = userIdRef.current || user.id;

    // ─── RENDER ────────────────────────────────────────────────────────────

    return (
        <div className="h-full flex overflow-hidden bg-gray-50 font-sans" style={{ minHeight: 0 }}>

            {/* Toasts */}
            <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id}
                        onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                        className="bg-white border border-gray-200 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px] pointer-events-auto cursor-pointer">
                        <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : toast.type === 'message' ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
                        {toast.type === 'message' && toast.avatar &&
                            <img src={toast.avatar} onError={handleImageError} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                        }
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{toast.title}</p>
                            {toast.msg && <p className="text-xs text-gray-500 truncate">{toast.msg}</p>}
                        </div>
                        <HiXMark className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                ))}
            </div>

            {/* Incoming Call Modal */}
            {incomingCall && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-80 text-center">
                        <div className="relative w-20 h-20 mx-auto mb-5">
                            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-25"></div>
                            <img src={getAvatar({ fullName: incomingCall.fromUserName, avatar: incomingCall.fromUserAvatar })}
                                onError={handleImageError}
                                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md relative z-10" alt="" />
                        </div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            {incomingCall.isVideoCall ? 'Cuộc gọi video đến' : 'Cuộc gọi thoại đến'}
                        </p>
                        <h3 className="text-xl font-bold text-gray-800 mb-8">{incomingCall.fromUserName}</h3>
                        <div className="flex gap-6 justify-center">
                            <button onClick={rejectCall} className="flex flex-col items-center gap-2">
                                <div className="w-14 h-14 rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                                    <HiPhoneXMark className="w-6 h-6" />
                                </div>
                                <span className="text-xs text-gray-500">Từ chối</span>
                            </button>
                            <button onClick={acceptCall} className="flex flex-col items-center gap-2">
                                <div className="w-14 h-14 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all flex items-center justify-center shadow-lg shadow-green-200">
                                    <HiPhone className="w-6 h-6" />
                                </div>
                                <span className="text-xs text-gray-500">Chấp nhận</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* In Call Interface */}
            {isInCall && (
                <div className="fixed inset-0 bg-gray-900 z-[100] flex flex-col">
                    <div className="relative w-full h-full overflow-hidden">
                        {/* Remote video */}
                        <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline
                            style={{ display: isRemoteCamOn ? 'block' : 'none' }}></video>

                        {/* Remote camera off - show avatar */}
                        {!isRemoteCamOn && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
                                <img src={getAvatar(targetUser)} onError={handleImageError}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-600 mb-4" alt="" />
                                <h3 className="text-xl font-bold text-white">{targetUser?.fullName || targetUser?.name || '...'}</h3>
                                <p className="text-gray-400 text-sm mt-1 font-mono">{formatDuration(callDuration)}</p>
                            </div>
                        )}

                        {/* Local video PiP */}
                        <video ref={localVideoRef}
                            className="absolute bottom-24 right-6 w-36 h-24 object-cover rounded-xl border-2 border-gray-600 shadow-xl z-20"
                            autoPlay playsInline muted
                            style={{ transform: 'scaleX(-1)', display: isCamOn ? 'block' : 'none' }}></video>
                        {!isCamOn && (
                            <div className="absolute bottom-24 right-6 w-36 h-24 rounded-xl border-2 border-gray-600 bg-gray-700 z-20 flex items-center justify-center">
                                <img src={getAvatar(user)} onError={handleImageError} className="w-10 h-10 rounded-full opacity-60" alt="" />
                            </div>
                        )}

                        {/* Status bar */}
                        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
                            <MdFiberManualRecord className={`text-sm ${callStatus === 'Đã kết nối' ? 'text-green-400' : 'text-yellow-400 animate-pulse'}`} />
                            <span className="text-white text-sm font-medium">{callStatus}</span>
                            {callDuration > 0 && (
                                <span className="text-white/70 font-mono text-sm ml-2 pl-2 border-l border-white/20">
                                    {formatDuration(callDuration)}
                                </span>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 items-center bg-black/40 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10">
                            <button onClick={toggleMic}
                                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}>
                                {isMicOn ? <MdMic className="text-xl" /> : <MdMicOff className="text-xl" />}
                            </button>
                            <button onClick={toggleCamera}
                                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isCamOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}>
                                {isCamOn ? <MdVideocam className="text-xl" /> : <MdVideocamOff className="text-xl" />}
                            </button>
                            <button onClick={() => endCall()}
                                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg">
                                <MdCallEnd className="text-2xl" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── SIDEBAR ─────────────────────────────────────────────── */}
            <div className={`w-full md:w-72 lg:w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
                <div className="px-4 pt-4 pb-3 border-b border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2 text-base">
                            <RiMessage3Line className="text-blue-600 text-lg" /> Tin nhắn
                        </h2>
                        {activeTab === 'chat' && (
                            <button
                                onClick={() => { setGroupName(''); setSelectedMembers([]); setShowCreateGroupModal(true); }}
                                title="Tạo nhóm mới"
                                className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors">
                                <HiPlus className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)}
                            placeholder="Tìm kiếm..."
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none placeholder-gray-400" />
                    </div>
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setActiveTab('chat')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === 'chat' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <RiMessage3Line className="text-sm" /> Hội thoại
                        </button>
                        <button onClick={() => setActiveTab('members')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === 'members' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <RiGroupLine className="text-sm" /> Thành viên
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {activeTab === 'chat' && (
                        <>
                            {filteredConversations.map(conv => (
                                <div key={conv.id} onClick={() => selectConversation(conv)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all mb-0.5 ${currentConv?.id === conv.id ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50 border border-transparent'}`}>
                                    <div className="relative flex-shrink-0">
                                        <img src={getAvatar({ fullName: conv.name, avatar: conv.avatar })}
                                            onError={handleImageError} className="w-10 h-10 rounded-full object-cover" alt="" />
                                        {conv.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <span className={`text-sm truncate ${(conv.unreadCount || 0) > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                {conv.name}
                                            </span>
                                            <span className="text-[10px] text-gray-400 ml-1 flex-shrink-0">
                                                {formatDateTime(conv.lastTime || '', true)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <p className={`text-xs truncate ${(conv.unreadCount || 0) > 0 ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>
                                                {conv.lastMessage}
                                            </p>
                                            {(conv.unreadCount || 0) > 0 && (
                                                <span className="ml-1 flex-shrink-0 bg-blue-600 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredConversations.length === 0 && (
                                <div className="text-center py-16">
                                    <RiMessage3Line className="text-4xl text-gray-200 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">Chưa có hội thoại</p>
                                </div>
                            )}
                        </>
                    )}
                    {activeTab === 'members' && (
                        <>
                            {filteredMembers.map(member => (
                                <div key={member.id} onClick={() => startDirectChat(member)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all mb-0.5 group">
                                    <div className="relative flex-shrink-0">
                                        <img src={getAvatar({ fullName: member.name, avatar: member.avatar })}
                                            onError={handleImageError} className="w-9 h-9 rounded-full object-cover" alt="" />
                                        {member.online && <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{member.name}</p>
                                        <p className="text-xs text-gray-400 truncate">{member.role}</p>
                                    </div>
                                    <RiMessage3Line className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                                </div>
                            ))}
                            {filteredMembers.length === 0 && (
                                <div className="text-center py-16">
                                    <RiUserLine className="text-4xl text-gray-200 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">Không tìm thấy</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── CHAT AREA ────────────────────────────────────────────── */}
            <div className={`flex-1 flex flex-col overflow-hidden ${isMobileChatOpen || (typeof window !== 'undefined' && window.innerWidth >= 768) ? 'flex' : 'hidden md:flex'}`}>
                {currentConv ? (
                    <>
                        {/* Header */}
                        <div className="h-16 px-5 flex items-center justify-between bg-white border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsMobileChatOpen(false)} className="md:hidden text-gray-500 mr-1">
                                    <HiArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="relative flex-shrink-0">
                                    <img src={getAvatar({ fullName: currentConv.name, avatar: currentConv.avatar })}
                                        onError={handleImageError} className="w-9 h-9 rounded-full object-cover" alt="" />
                                    {currentConv.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800 leading-tight">{currentConv.name}</h3>
                                    <p className={`text-xs leading-tight ${currentConv.online ? 'text-green-500 font-medium' : 'text-gray-400'}`}>
                                        {currentConv.online ? 'Đang hoạt động' : currentConv.type === 'GROUP' ? 'Nhóm' : 'Ngoại tuyến'}
                                    </p>
                                </div>
                            </div>
                            {(!currentConv.type || currentConv.type === 'DIRECT') && (
                                <div className="flex items-center gap-1">
                                    <button onClick={() => startCall(false)} title="Gọi thoại"
                                        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                        <RiPhoneLine className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => startCall(true)} title="Gọi video"
                                        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                        <RiVideoLine className="w-4 h-4" />
                                    </button>
                                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                    <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all">
                                        <HiEllipsisVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Messages */}
                        <div ref={chatMessagesRef}
                            className="flex-1 overflow-y-auto px-5 py-4 space-y-2 bg-gray-50"
                            style={{ minHeight: 0 }}>
                            {messages.map(msg => {
                                const isMine = msg.senderId === myId;
                                return (
                                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                        {msg.type === 'CALL_LOG' ? (
                                            <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm max-w-xs">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.content.includes('nhỡ') || msg.content.includes('từ chối') ? 'bg-red-50 text-red-400' : msg.content.includes('bận') ? 'bg-amber-50 text-amber-400' : 'bg-blue-50 text-blue-400'}`}>
                                                    {msg.content.includes('nhỡ') ? <MdPhoneMissed className="text-sm" />
                                                        : msg.content.includes('video') ? <MdVideocam className="text-sm" />
                                                            : msg.content.includes('bận') ? <MdPhoneDisabled className="text-sm" />
                                                                : <MdPhoneInTalk className="text-sm" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-700">
                                                        {msg.content.includes('bận') ? 'Đang bận'
                                                            : msg.content.includes('nhỡ') ? 'Cuộc gọi nhỡ'
                                                                : isMine ? 'Cuộc gọi đi' : 'Cuộc gọi đến'}
                                                    </p>
                                                    {(() => {
                                                        // Parse duration từ content backend: "...duration:Xs" hoặc "(Xs)" hoặc "Xm Ys"
                                                        const m = msg.content.match(/duration:(\d+)|\((\d+)s\)|\b(\d+):(\d{2})\b/);
                                                        let secs = 0;
                                                        if (m) {
                                                            if (m[1]) secs = parseInt(m[1]);
                                                            else if (m[2]) secs = parseInt(m[2]);
                                                            else if (m[3]) secs = parseInt(m[3]) * 60 + parseInt(m[4]);
                                                        }
                                                        return secs > 0 ? (
                                                            <p className="text-[10px] text-blue-500 font-medium">{formatDuration(secs)}</p>
                                                        ) : null;
                                                    })()}
                                                    <p className="text-[10px] text-gray-400">{formatDateTime(msg.createdAt)}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`flex gap-2 items-end max-w-[70%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {/* Avatar chỉ hiện bên trái (tin nhắn người khác) */}
                                                {!isMine && (
                                                    <img src={getAvatar(msg.sender)} onError={handleImageError}
                                                        className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1" alt="" />
                                                )}
                                                <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                                    {!isMine && currentConv?.type === 'GROUP' && (
                                                        <span className="text-[10px] text-gray-400 font-medium mb-0.5 ml-1">
                                                            {msg.sender?.fullName}
                                                        </span>
                                                    )}
                                                    <div className={`relative group flex items-end gap-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                                                        <div className="relative">
                                                            {msg.type === 'IMAGE' && (
                                                                <div className="rounded-xl overflow-hidden border border-gray-200 cursor-pointer max-w-[220px]"
                                                                    onClick={() => window.open(`${API_URL}${msg.content}`, '_blank')}>
                                                                    <img src={`${API_URL}${msg.content}`} className="block max-w-full" onError={handleImageError} alt="" />
                                                                </div>
                                                            )}
                                                            {msg.type === 'FILE' && (
                                                                <a href={`${API_URL}${msg.content}`} target="_blank" rel="noreferrer"
                                                                    className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors shadow-sm max-w-[220px]">
                                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                                        <RiFileLine className="text-blue-500 text-sm" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-semibold text-gray-700">Tệp đính kèm</p>
                                                                        <p className="text-[10px] text-blue-500">Tải xuống</p>
                                                                    </div>
                                                                </a>
                                                            )}
                                                            {msg.type === 'TEXT' && (
                                                                <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words max-w-sm ${isMine
                                                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                                                    : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-sm'}`}>
                                                                    {msg.content}
                                                                </div>
                                                            )}
                                                            {(msg.reactions?.length || 0) > 0 && (
                                                                <div className={`absolute -bottom-3 flex gap-0.5 ${isMine ? 'right-1' : 'left-1'}`}>
                                                                    {getUniqueReactions(msg.reactions || []).map((r: any, i: number) => (
                                                                        <div key={i} className="bg-white border border-gray-200 rounded-full px-1.5 py-0.5 shadow-sm text-[10px] flex items-center gap-0.5">
                                                                            <span>{r.icon}</span>
                                                                            <span className="text-gray-600 font-semibold">{r.count}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 mb-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                                                            <ReactionButton onReact={type => reactToMessage(msg.id, type)} isSelf={isMine} />
                                                            {isMine && <MessageOptions onEdit={() => editMessage(msg)} onDelete={() => deleteMessage(msg)} />}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-1 px-1">
                                                        <span className="text-[10px] text-gray-400">{formatDateTime(msg.createdAt)}</span>
                                                        {isMine && (msg.seenBy?.length || 0) > 0 && (
                                                            currentConv?.type === 'DIRECT'
                                                                ? <span className="text-[10px] text-blue-400 font-medium">• Đã xem</span>
                                                                : <div className="flex -space-x-1">
                                                                    {msg.seenBy?.filter((v: any) => v.user.id !== myId).map((v: any) => (
                                                                        <img key={v.user.id} src={getAvatar(v.user)} onError={handleImageError}
                                                                            className="w-3 h-3 rounded-full border border-white" alt="" />
                                                                    ))}
                                                                </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input */}
                        <div className="px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
                            <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-blue-400 focus-within:bg-white transition-all">
                                <button onClick={() => fileInputRef.current?.click()}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-all flex-shrink-0 mb-0.5">
                                    <HiPaperClip className="w-4 h-4" />
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="*/*" onChange={handleFileUpload} />
                                <textarea
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                    rows={1}
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-700 placeholder-gray-400 resize-none max-h-24 outline-none py-1"
                                    placeholder="Nhập tin nhắn..."
                                    style={{ lineHeight: '1.5' }}
                                />
                                <button onClick={sendMessage} disabled={!newMessage.trim()}
                                    className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-all flex-shrink-0 mb-0.5">
                                    <HiPaperAirplane className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm border border-gray-200">
                            <HiChatBubbleLeftRight className="w-7 h-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-semibold text-gray-500">Chọn một hội thoại</p>
                        <p className="text-xs text-gray-400 mt-1">hoặc bắt đầu cuộc trò chuyện mới</p>
                    </div>
                )}
            </div>

            {/* Create Group Modal */}
            {showCreateGroupModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                                <RiGroupLine className="text-blue-600" /> Tạo nhóm chat
                            </h3>
                            <button onClick={() => setShowCreateGroupModal(false)}
                                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                                <HiXMark className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tên nhóm</label>
                                <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none text-sm transition-all"
                                    placeholder="Nhập tên nhóm..." />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                                    Thành viên ({selectedMembers.length} đã chọn)
                                </label>
                                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-50">
                                    {availableMembers.map(member => (
                                        <label key={member.userId} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
                                            <input type="checkbox" value={member.userId}
                                                checked={selectedMembers.includes(member.userId)}
                                                onChange={e => {
                                                    if (e.target.checked) setSelectedMembers(prev => [...prev, member.userId]);
                                                    else setSelectedMembers(prev => prev.filter(id => id !== member.userId));
                                                }}
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                                            <img src={getAvatar({ fullName: member.name, avatar: member.avatar })}
                                                onError={handleImageError} className="w-7 h-7 rounded-full object-cover" alt="" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-700 truncate">{member.name}</p>
                                                <p className="text-xs text-gray-400">{member.role}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
                            <button onClick={() => setShowCreateGroupModal(false)}
                                className="px-4 py-2 text-sm text-gray-500 font-medium hover:text-gray-800 transition-colors">Hủy</button>
                            <button onClick={createGroup} disabled={!groupName}
                                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all">
                                Tạo nhóm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── SUB COMPONENTS ────────────────────────────────────────────────────────────

const ReactionButton = ({ onReact, isSelf }: { onReact: (type: string) => void, isSelf: boolean }) => {
    const [show, setShow] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setShow(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    return (
        <div ref={ref} className="relative">
            <button onClick={() => setShow(!show)}
                className="w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-colors">
                <HiFaceSmile className="w-3.5 h-3.5" />
            </button>
            {show && (
                <div className={`absolute bottom-full mb-1.5 bg-white rounded-full shadow-lg border border-gray-200 p-1 flex gap-0.5 z-50 ${isSelf ? 'right-0' : 'left-0'}`}>
                    {[['LIKE', '👍'], ['LOVE', '❤️'], ['HAHA', '😂'], ['WOW', '😮'], ['SAD', '😢'], ['ANGRY', '😡']].map(([type, icon]) => (
                        <button key={type} onClick={() => { onReact(type); setShow(false); }}
                            className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-transform hover:scale-125 text-base">
                            {icon}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const MessageOptions = ({ onEdit, onDelete }: { onEdit: () => void, onDelete: () => void }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    return (
        <div ref={ref} className="relative">
            <button onClick={() => setOpen(!open)}
                className="w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-colors">
                <HiEllipsisVertical className="w-3.5 h-3.5" />
            </button>
            {open && (
                <div className="absolute bottom-full mb-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden py-1 z-20 w-24 right-full mr-1">
                    <button onClick={() => { onEdit(); setOpen(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Chỉnh sửa</button>
                    <button onClick={() => { onDelete(); setOpen(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">Xóa</button>
                </div>
            )}
        </div>
    );
};

export default Chat;
