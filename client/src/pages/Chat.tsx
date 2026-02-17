import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Import bộ icon React (Phosphor Icons)
import {
    PiCheckBold, PiPhoneSlashBold, PiWarningBold, PiXBold,
    PiPhoneXBold, PiPhoneCallBold, PiVideoCameraSlashFill,
    PiMicrophoneFill, PiMicrophoneSlashFill, PiVideoCameraFill,
    PiPhoneDisconnectFill, PiList, PiMagnifyingGlass,
    PiPlusCircleBold, PiChatCircleTextFill, PiArrowLeftBold,
    PiPhoneFill, PiDotsThreeVerticalFill, PiChatsCircleDuotone,
    PiProhibitFill, PiFileTextFill, PiPaperPlaneRightFill,
    PiPaperclipBold, PiDotsThreeVerticalBold, PiPhoneSlashFill,
    PiPhoneCallFill, PiSmileyBold
} from "react-icons/pi";

// Cấu hình API URL
const API_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:3000'
    : 'https://aegism.online';

// Interface cơ bản
interface User {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    roleName?: string;
    isSuperAdmin?: boolean;
    isTenantAdmin?: boolean;
    permissions?: string[];
    tenant?: any;
}

interface Message {
    id: string;
    senderId: string;
    content: string;
    type: 'TEXT' | 'IMAGE' | 'FILE' | 'CALL_LOG';
    createdAt: string;
    sender: any;
    conversationId: string;
    reactions?: any[];
    seenBy?: any[];
}

interface Conversation {
    id: string;
    name: string;
    avatar?: string;
    lastMessage?: string;
    lastTime?: string;
    unreadCount?: number;
    online?: boolean;
    type?: string;
    members?: any[];
}

const Chat: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'members'>('chat');
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

    const [user, setUser] = useState<User>({ id: '', name: 'User', avatar: '', roleName: 'User', isSuperAdmin: false, isTenantAdmin: false, permissions: [] });
    const [currentPlan, setCurrentPlan] = useState('starter');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConv, setCurrentConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [availableMembers, setAvailableMembers] = useState<any[]>([]);

    const [globalSearch, setGlobalSearch] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [toasts, setToasts] = useState<any[]>([]);

    // --- CALL STATE ---
    const [isInCall, setIsInCall] = useState(false);
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [isRemoteCamOn, setIsRemoteCamOn] = useState(true);
    const [callStatus, setCallStatus] = useState('Sẵn sàng');
    const [callDuration, setCallDuration] = useState(0);
    const [targetUser, setTargetUser] = useState<any>(null);

    // --- REFS ---
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

    // Audio Refs
    const sounds = useRef({
        notification: typeof Audio !== "undefined" ? new Audio('/sound/notification.mp3') : null,
        ringtone: typeof Audio !== "undefined" ? new Audio('/sound/bell.mp3') : null,
        waiting: typeof Audio !== "undefined" ? new Audio('/sound/wait.mp3') : null
    });

    useEffect(() => {
        if (sounds.current.ringtone) sounds.current.ringtone.loop = true;
        if (sounds.current.waiting) sounds.current.waiting.loop = true;
    }, []);

    useEffect(() => { currentConvRef.current = currentConv; }, [currentConv]);
    useEffect(() => { isInCallRef.current = isInCall; }, [isInCall]);

    // --- INITIALIZATION ---
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

    // --- API FUNCTIONS ---
    const fetchUserProfile = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/api/users/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const u = await res.json();
                updateUserUI(u);
            }
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
                    try { permissions = JSON.parse(u.role.permissions); } catch { permissions = u.role.permissions.split(',').map((p: string) => p.trim()); }
                }
            } catch (e) { permissions = []; }
        }

        let avatarUrl = u.avatar || '';
        if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:')) {
            if (avatarUrl.startsWith('/')) avatarUrl = API_URL + avatarUrl;
            else avatarUrl = API_URL + '/' + avatarUrl;
        }
        if (!avatarUrl) {
            avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}&background=2563EB&color=fff`;
        }

        setUser({
            id: u.id,
            name: u.fullName || 'User',
            email: u.email,
            avatar: avatarUrl,
            roleName: roleDisplay,
            isSuperAdmin: isSuper,
            isTenantAdmin: isTenant,
            permissions: permissions,
            tenant: u.tenant
        });
        if (u.tenant) setCurrentPlan(u.tenant.subscriptionPlan?.toLowerCase() || 'starter');
    };

    const fetchAllMembers = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/api/chat/members`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setAvailableMembers(data);
            }
        } catch (e) { }
    };

    const fetchConversations = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/api/chat/conversations`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setConversations(data.sort((a: any, b: any) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()));
            }
        } catch (e) { }
    };

    // --- HELPER FUNCTIONS ---
    const getAvatar = (u: any) => {
        if (!u) return `https://ui-avatars.com/api/?name=User&background=random&color=fff`;
        let src = u.avatar;
        if (!src) {
            const name = u.fullName || u.name || 'User';
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
        }
        if (!src.startsWith('http') && !src.startsWith('data:') && !src.includes('ui-avatars.com')) {
            if (src.startsWith('/')) src = API_URL + src;
            else src = API_URL + '/' + src;
        }
        return src;
    };

    const handleImageError = (e: any) => {
        e.target.onerror = null;
        e.target.src = `https://ui-avatars.com/api/?name=User&background=random&color=fff`;
    };

    const hasPermission = (perm: string) => {
        if (user.isSuperAdmin || user.isTenantAdmin) return true;
        if (user.permissions?.includes('ALL')) return true;
        return user.permissions?.includes(perm);
    };

    const formatDateTime = (isoString: string, short = false) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        const timeStr = d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
        if (short) return timeStr;
        return `${timeStr} - ${d.getDate()}/${d.getMonth() + 1}`;
    };

    const formatDuration = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const playSound = (name: 'notification' | 'ringtone' | 'waiting') => {
        try { sounds.current[name]?.play().catch(() => { }); } catch (e) { }
    };

    const stopSound = (name: 'notification' | 'ringtone' | 'waiting') => {
        try {
            const sound = sounds.current[name];
            if (sound) {
                sound.pause();
                sound.currentTime = 0;
            }
        } catch (e) { }
    };

    const stopAllCallSounds = () => {
        stopSound('ringtone');
        stopSound('waiting');
    };

    const showToast = (type: string, title: string, msg: string, avatar: string | null = null) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, title, msg, avatar }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            if (chatMessagesRef.current) {
                chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
            }
        }, 100);
    };

    // --- SOCKET.IO & WEBRTC LOGIC ---
    const initSocket = (token: string) => {
        const socket = io(API_URL, { query: { token }, transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => console.log('Socket Connected'));

        socket.on('newMessage', (msg) => {
            if (currentConvRef.current && currentConvRef.current.id === msg.conversationId) {
                setMessages(prev => [...prev, msg]);
                scrollToBottom();
                socket.emit('markSeen', { conversationId: currentConvRef.current.id, messageId: msg.id });
            }

            setConversations(prev => {
                const newConvs = [...prev];
                const convIndex = newConvs.findIndex(c => c.id === msg.conversationId);
                if (convIndex !== -1) {
                    const updatedConv = { ...newConvs[convIndex] };
                    let preview = msg.content;
                    if (msg.type === 'IMAGE') preview = '[Hình ảnh]';
                    else if (msg.type === 'FILE') preview = '[Tệp tin]';
                    else if (msg.type === 'CALL_LOG') preview = msg.content;

                    updatedConv.lastMessage = preview;
                    updatedConv.lastTime = msg.createdAt;

                    if (!currentConvRef.current || currentConvRef.current.id !== msg.conversationId) {
                        updatedConv.unreadCount = (updatedConv.unreadCount || 0) + 1;
                    }
                    newConvs.splice(convIndex, 1);
                    newConvs.unshift(updatedConv);
                    return newConvs;
                } else {
                    fetchConversations(token);
                    return prev;
                }
            });

            if (msg.senderId !== user.id && msg.type !== 'CALL_LOG') {
                playSound('notification');
                showToast('message', msg.sender.fullName, msg.type === 'TEXT' ? msg.content : '[Media]', getAvatar(msg.sender));
            }
        });

        socket.on('messageSeen', (data) => {
            if (currentConvRef.current && currentConvRef.current.id === data.conversationId) {
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

        socket.on('messageReactionUpdate', (data) => {
            setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, reactions: data.reactions } : m));
        });

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
            playSound('ringtone');
        });

        socket.on('user-busy', () => {
            showToast('warning', 'Người nhận đang bận', 'Người dùng đang trong cuộc gọi khác.');
            stopSound('waiting');
            if (currentConvRef.current) {
                socket.emit('sendMessage', { conversationId: currentConvRef.current.id, content: '📞 Cuộc gọi nhỡ (Người nhận bận)', type: 'CALL_LOG' });
            }
            endCall(false, 'BUSY', false);
        });

        socket.on('answer-made', async (data) => {
            if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
            if (peerConnection.current) {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                await processBufferedCandidates();
            }
            setCallStatus('Đã kết nối');
            stopSound('waiting');
            startCallTimer();
        });

        socket.on('ice-candidate', async (data) => {
            const candidate = new RTCIceCandidate(data.candidate);
            if (peerConnection.current && peerConnection.current.remoteDescription && peerConnection.current.remoteDescription.type) {
                await peerConnection.current.addIceCandidate(candidate);
                if (peerConnection.current.connectionState === 'connected') setCallStatus('Đã kết nối');
            } else {
                remoteCandidatesQueue.current.push(candidate);
            }
        });

        socket.on('call-ended', () => {
            endCall(true);
            showToast('info', 'Thông báo', 'Cuộc gọi đã kết thúc');
        });

        socket.on('remote-camera-toggled', (status) => {
            setIsRemoteCamOn(status);
        });
    };

    // --- WEBRTC FUNCTIONS ---
    const processBufferedCandidates = async () => {
        if (remoteCandidatesQueue.current.length > 0 && peerConnection.current) {
            for (const candidate of remoteCandidatesQueue.current) {
                try { await peerConnection.current.addIceCandidate(candidate); } catch (e) { console.error(e); }
            }
            remoteCandidatesQueue.current = [];
        }
    };

    const startCallTimer = () => {
        setCallDuration(0);
        if (callTimerIntervalRef.current) clearInterval(callTimerIntervalRef.current);
        callTimerIntervalRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    };

    const createPeerConnection = () => {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }] });
        peerConnection.current = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate && targetUserIdForCallRef.current && socketRef.current) {
                socketRef.current.emit('ice-candidate', { candidate: event.candidate, toUser: targetUserIdForCallRef.current });
            }
        };

        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
            } else {
                if (remoteVideoRef.current) {
                    if (!remoteVideoRef.current.srcObject) remoteVideoRef.current.srcObject = new MediaStream();
                    (remoteVideoRef.current.srcObject as MediaStream).addTrack(event.track);
                }
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') setCallStatus('Đã kết nối');
        };
    };

    const setupLocalMedia = async (videoEnabled: boolean) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: videoEnabled ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
            });
            localStream.current = stream;

            setTimeout(() => {
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    localVideoRef.current.style.display = videoEnabled ? 'block' : 'none';
                }
            }, 100);

            setIsCamOn(videoEnabled);
            setIsMicOn(true);
        } catch (err: any) {
            showToast('error', 'Lỗi', err.message);
            endCall();
        }
    };

    const startCall = async (videoEnabled: boolean) => {
        if (!currentConv) return;
        const member = currentConv.members?.find(m => m.userId !== user.id);
        if (!member) return alert("Không tìm thấy");

        targetUserIdForCallRef.current = member.userId;
        setTargetUser(member.user || member);
        setIsInCall(true);
        setCallStatus(videoEnabled ? 'Đang gọi video...' : 'Đang gọi thoại...');
        playSound('waiting');
        setIsRemoteCamOn(true);

        await setupLocalMedia(videoEnabled);
        createPeerConnection();

        if (localStream.current && peerConnection.current) {
            localStream.current.getTracks().forEach(track => peerConnection.current?.addTrack(track, localStream.current!));
        }

        try {
            const offer = await peerConnection.current!.createOffer();
            await peerConnection.current!.setLocalDescription(offer);

            if (socketRef.current) {
                socketRef.current.emit('call-user', {
                    userToCall: targetUserIdForCallRef.current,
                    signalData: offer,
                    fromUser: user,
                    isVideoCall: videoEnabled
                });
            }

            callTimeoutRef.current = setTimeout(() => {
                endCall(false, 'MISSED');
            }, 30000);
        } catch (e) {
            endCall();
        }
    };

    const acceptCall = async () => {
        const data = incomingCall;
        setIncomingCall(null);
        stopSound('ringtone');
        setIsInCall(true);
        setCallStatus('Đang kết nối...');

        targetUserIdForCallRef.current = data.fromUserId;
        setTargetUser({ fullName: data.fromUserName, avatar: data.fromUserAvatar });

        const isVideo = data.isVideoCall || false;
        setIsCamOn(isVideo);
        setIsRemoteCamOn(isVideo);

        await setupLocalMedia(isVideo);
        createPeerConnection();

        if (localStream.current && peerConnection.current) {
            localStream.current.getTracks().forEach(track => peerConnection.current?.addTrack(track, localStream.current!));
        }

        if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.offer));
            await processBufferedCandidates();
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            if (socketRef.current) {
                socketRef.current.emit('make-answer', { signal: answer, toUser: data.fromUserId });
                if (!isVideo) {
                    socketRef.current.emit('toggle-camera', { toUser: data.fromUserId, status: false });
                }
            }
            startCallTimer();
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
        stopSound('ringtone');
    };

    const endCall = (isRemote = false, statusOverride: string | null = null, sendSignal = true) => {
        let status = statusOverride;
        if (!status) {
            status = (callDuration > 0) ? 'ENDED' : 'MISSED';
        }

        if (!isRemote && targetUserIdForCallRef.current && sendSignal && socketRef.current) {
            socketRef.current.emit('end-call', {
                toUser: targetUserIdForCallRef.current,
                conversationId: currentConvRef.current?.id,
                duration: callDuration,
                status: status
            });
        }

        if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
        stopAllCallSounds();
        if (callTimerIntervalRef.current) clearInterval(callTimerIntervalRef.current);

        setIsInCall(false);
        setIncomingCall(null);
        targetUserIdForCallRef.current = null;
        setCallDuration(0);
        setTargetUser(null);

        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
            localStream.current = null;
        }
        remoteCandidatesQueue.current = [];

        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };

    const toggleMic = () => {
        if (localStream.current) {
            const newStatus = !isMicOn;
            setIsMicOn(newStatus);
            localStream.current.getAudioTracks()[0].enabled = newStatus;
        }
    };

    const toggleCamera = () => {
        if (localStream.current) {
            const newStatus = !isCamOn;
            setIsCamOn(newStatus);
            if (localStream.current.getVideoTracks().length > 0) {
                localStream.current.getVideoTracks()[0].enabled = newStatus;
            }
            if (targetUserIdForCallRef.current && socketRef.current) {
                socketRef.current.emit('toggle-camera', { toUser: targetUserIdForCallRef.current, status: newStatus });
            }
        }
    };

    // --- CHAT INTERACTION ---
    const selectConversation = async (conv: Conversation) => {
        setCurrentConv(conv);
        setIsMobileChatOpen(true);
        setMessages([]);
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));

        if (socketRef.current) socketRef.current.emit('joinConversation', { conversationId: conv.id });

        const token = localStorage.getItem('accessToken') || '';
        fetch(`${API_URL}/api/chat/conversations/${conv.id}/read`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });

        try {
            const res = await fetch(`${API_URL}/api/chat/conversations/${conv.id}/messages`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const msgs = await res.json();
                setMessages(msgs);
                scrollToBottom();
                const lastMsg = msgs[msgs.length - 1];
                if (lastMsg && lastMsg.senderId !== user.id && socketRef.current) {
                    socketRef.current.emit('markSeen', { conversationId: conv.id, messageId: lastMsg.id });
                }
            }
        } catch (e) { }
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
                let rawConv = await res.json();
                const existingIdx = conversations.findIndex(c => c.id === rawConv.id);

                let convToUse: Conversation;

                if (existingIdx !== -1) {
                    const existing = conversations[existingIdx];
                    const newConvs = [...conversations];
                    newConvs.splice(existingIdx, 1);
                    convToUse = { ...existing, ...rawConv, name: member.fullName || member.name, avatar: getAvatar(member), online: member.online };
                    newConvs.unshift(convToUse);
                    setConversations(newConvs);
                } else {
                    convToUse = {
                        ...rawConv,
                        name: member.fullName || member.name,
                        avatar: getAvatar(member),
                        online: member.online,
                        type: 'DIRECT',
                        unreadCount: 0,
                        lastMessage: 'Bắt đầu cuộc trò chuyện',
                        lastTime: new Date().toISOString()
                    };
                    if (!convToUse.members || convToUse.members.length === 0) {
                        convToUse.members = [{ userId: user.id }, { userId: member.userId, user: member }];
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
        if (socketRef.current) {
            socketRef.current.emit('sendMessage', { conversationId: currentConv.id, content: newMessage });
        }
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
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (uploadRes.ok) {
                const data = await uploadRes.json();
                const type = data.type === 'IMAGE' ? 'IMAGE' : 'FILE';
                if (socketRef.current) {
                    socketRef.current.emit('sendMessage', { conversationId: currentConv.id, content: data.url, type: type });
                }
            }
        } catch (e) { } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
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
        } catch (e) { }
    };

    const reactToMessage = (messageId: string, type: string) => {
        if (!currentConv || !socketRef.current) return;
        socketRef.current.emit('addReaction', { messageId, type, conversationId: currentConv.id });
    };

    const editMessage = async (msg: Message) => {
        const newContent = prompt("Sửa:", msg.content);
        if (newContent) {
            try {
                const token = localStorage.getItem('accessToken') || '';
                await fetch(`${API_URL}/api/chat/messages/${msg.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ content: newContent })
                });
            } catch (e) { }
        }
    };

    const deleteMessage = async (msg: Message) => {
        if (confirm("Xóa?")) {
            try {
                const token = localStorage.getItem('accessToken') || '';
                await fetch(`${API_URL}/api/chat/messages/${msg.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) { }
        }
    };

    const logout = () => {
        localStorage.clear();
        window.location.href = '/login.html';
    };

    // Filter Logic
    const filteredMembers = availableMembers.filter(m => m.id !== user.id && m.name.toLowerCase().includes(globalSearch.toLowerCase()));
    const filteredConversations = conversations.filter(c => c.name.toLowerCase().includes(globalSearch.toLowerCase()));

    // Group reactions for display
    const getUniqueReactions = (reactions: any[]) => {
        if (!reactions || reactions.length === 0) return [];
        const map: any = { 'LIKE': '👍', 'LOVE': '❤️', 'HAHA': '😂', 'WOW': '😮', 'SAD': '😢', 'ANGRY': '😡' };
        const grouped = reactions.reduce((acc: any, curr: any) => {
            if (!acc[curr.type]) acc[curr.type] = { icon: map[curr.type], count: 0, users: [] };
            acc[curr.type].count++;
            acc[curr.type].users.push(curr.user?.fullName);
            return acc;
        }, {});
        return Object.values(grouped).map((g: any) => ({ ...g, users: g.users.join(', ') }));
    };

    return (
        <div className="h-screen flex overflow-hidden text-slate-600 bg-luxury-pattern font-sans antialiased bg-[#f3f4f6]">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[100px]"></div>
            </div>

            {/* Toasts */}
            <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="bg-white/90 backdrop-blur-xl border border-white/60 p-4 pr-5 rounded-2xl shadow-2xl flex items-start gap-4 min-w-[320px] max-w-[380px] pointer-events-auto animate-pop cursor-pointer hover:bg-white transition-colors relative overflow-hidden group">
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${toast.type === 'success' ? 'bg-green-500' : (toast.type === 'error' ? 'bg-red-500' : (toast.type === 'message' ? 'bg-blue-500' : 'bg-amber-500'))}`}></div>
                        <div className="shrink-0 relative">
                            {toast.type === 'message' ? (
                                <img src={toast.avatar} onError={handleImageError} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" alt="" />
                            ) : (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${toast.type === 'success' ? 'bg-green-100 text-green-600' : (toast.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600')}`}>
                                    {toast.type === 'success' ? <PiCheckBold className="text-xl" /> : (toast.type === 'warning' ? <PiPhoneSlashBold className="text-xl" /> : <PiWarningBold className="text-xl" />)}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h4 className="font-bold text-sm text-slate-800 leading-tight mb-0.5 truncate">{toast.title}</h4>
                            <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{toast.msg}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setToasts(prev => prev.filter(t => t.id !== toast.id)) }} className="absolute top-2 right-2 text-slate-300 hover:text-slate-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <PiXBold className="text-xs" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Incoming Call Modal */}
            {incomingCall && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-white/50 p-3 pr-6 rounded-full shadow-2xl z-[100] flex items-center gap-4 animate-pop min-w-[340px]">
                    <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                        <img src={getAvatar({ fullName: incomingCall.fromUserName, avatar: incomingCall.fromUserAvatar })} onError={handleImageError} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md relative z-10 bg-slate-200" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-0.5">{incomingCall.isVideoCall ? 'Video Call' : 'Cuộc gọi thoại'}</p>
                        <p className="font-bold text-slate-800 text-lg truncate">{incomingCall.fromUserName}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={rejectCall} className="w-10 h-10 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"><PiPhoneXBold className="text-lg" /></button>
                        <button onClick={acceptCall} className="w-10 h-10 rounded-full bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/30 transition-all flex items-center justify-center animate-pulse"><PiPhoneCallBold className="text-lg" /></button>
                    </div>
                </div>
            )}

            {/* In Call Interface */}
            {isInCall && (
                <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col animate-pop">
                    <div className="video-wrapper relative w-full h-full bg-black overflow-hidden">
                        <video ref={remoteVideoRef} id="remoteVideo" className="w-full h-full object-cover bg-black" autoPlay playsInline style={{ display: isRemoteCamOn ? 'block' : 'none' }}></video>
                        {!isRemoteCamOn && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 text-white z-10">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.3)] mb-6 relative">
                                    <img src={getAvatar(targetUser)} onError={handleImageError} className="w-full h-full object-cover" alt="" />
                                    <div className="absolute inset-0 bg-blue-500/20 animate-pulse"></div>
                                </div>
                                <h3 className="text-2xl font-bold tracking-tight">{targetUser?.fullName || targetUser?.name || 'Đang kết nối...'}</h3>
                                <p className="text-slate-400 text-sm mt-2 font-mono">{formatDuration(callDuration)}</p>
                            </div>
                        )}
                        <video ref={localVideoRef} id="localVideo" className="absolute bottom-28 right-8 w-40 h-28 object-cover rounded-2xl border-2 border-white/20 shadow-2xl z-20 hover:scale-110 transition-transform cursor-pointer" autoPlay playsInline muted style={{ transform: 'scaleX(-1)', display: isCamOn ? 'block' : 'none' }}></video>
                        {!isCamOn && (
                            <div className="absolute bottom-28 right-8 w-40 h-28 rounded-2xl border-2 border-white/10 bg-slate-800 shadow-2xl z-20 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                                <img src={getAvatar(user)} onError={handleImageError} className="w-12 h-12 rounded-full object-cover opacity-80" alt="" />
                                <div className="absolute bottom-1 right-1 bg-red-500 rounded-full p-1"><PiVideoCameraSlashFill className="text-[10px] text-white" /></div>
                            </div>
                        )}
                        <div className="absolute top-8 left-8 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3 z-30">
                            <div className={`w-2 h-2 rounded-full ${callStatus === 'Đã kết nối' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                            <span className="text-white font-medium text-sm">{callStatus}</span>
                            {callDuration > 0 && <span className="text-white/80 font-mono text-sm border-l border-white/20 pl-3">{formatDuration(callDuration)}</span>}
                        </div>
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-xl border border-white/10 p-3 rounded-full flex gap-4 shadow-2xl z-30">
                            <button onClick={toggleMic} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMicOn ? 'bg-white/10 text-white' : 'bg-white text-red-600'}`}>
                                {isMicOn ? <PiMicrophoneFill className="text-xl" /> : <PiMicrophoneSlashFill className="text-xl" />}
                            </button>
                            <button onClick={toggleCamera} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCamOn ? 'bg-white/10 text-white' : 'bg-white text-red-600'}`}>
                                {isCamOn ? <PiVideoCameraFill className="text-xl" /> : <PiVideoCameraSlashFill className="text-xl" />}
                            </button>
                            <div className="w-px h-8 bg-white/10 my-auto mx-1"></div>
                            <button onClick={() => endCall()} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg"><PiPhoneDisconnectFill className="text-2xl" /></button>
                        </div>
                    </div>
                </div>
            )}
            {/* Main Content */}
            {/* FIX: Thêm h-full cho container này và flex-1 cho nội dung bên trong */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 min-h-0">
                <main className="flex-1 p-4 lg:p-6 overflow-hidden flex gap-6 min-h-0">
                    <div className={`w-full md:w-[320px] bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl flex flex-col shadow-glass overflow-hidden ${!isMobileChatOpen || window.innerWidth >= 768 ? 'block' : 'hidden'}`}>
                        <div className="p-5 border-b border-slate-100 shrink-0">
                            <div className="relative group mb-4">
                                <PiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                                <input type="text" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="Tìm kiếm hội thoại & người dùng..." className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder-slate-400" />
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button onClick={() => setActiveTab('chat')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'chat' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Hội thoại</button>
                                <button onClick={() => setActiveTab('members')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'members' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Thành viên</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 scrollbar-custom space-y-1">
                            {activeTab === 'chat' && (
                                <>
                                    <button onClick={() => { setGroupName(''); setSelectedMembers([]); setShowCreateGroupModal(true); }} className="w-full py-3 mb-3 border border-dashed border-blue-300 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group">
                                        <PiPlusCircleBold className="text-lg group-hover:scale-110 transition-transform" /> Tạo nhóm mới
                                    </button>
                                    {filteredConversations.map(conv => (
                                        <div key={conv.id} onClick={() => selectConversation(conv)} className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all border border-transparent ${currentConv?.id === conv.id ? 'bg-blue-50 border-blue-100 shadow-sm' : 'hover:bg-white hover:shadow-sm'}`}>
                                            <div className="relative shrink-0">
                                                <img src={getAvatar({ fullName: conv.name, avatar: conv.avatar })} onError={handleImageError} className="w-10 h-10 rounded-full object-cover ring-2 ring-white" alt="" />
                                                {conv.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white"></div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <h4 className="text-sm font-bold text-slate-800 truncate">{conv.name}</h4>
                                                    <span className="text-[10px] text-slate-400 font-semibold">{formatDateTime(conv.lastTime || '', true)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className={`text-xs truncate max-w-[120px] ${(conv.unreadCount || 0) > 0 ? 'font-bold text-slate-900' : 'text-slate-500'}`}>{conv.lastMessage}</p>
                                                    {(conv.unreadCount || 0) > 0 && <div className="h-4 min-w-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">{conv.unreadCount}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredConversations.length === 0 && <div className="text-center py-4 text-xs text-slate-400">Không tìm thấy hội thoại nào</div>}
                                </>
                            )}
                            {activeTab === 'members' && (
                                <>
                                    {filteredMembers.map(member => (
                                        <div key={member.id} onClick={() => startDirectChat(member)} className="p-2.5 rounded-xl cursor-pointer flex items-center gap-3 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100 group">
                                            <img src={getAvatar({ fullName: member.name, avatar: member.avatar })} onError={handleImageError} className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-100" alt="" />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-slate-800 truncate">{member.name}</h4>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase bg-slate-100 inline px-1.5 rounded">{member.role}</p>
                                            </div>
                                            <div onClick={(e) => { e.stopPropagation(); startDirectChat(member); }} className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors shadow-sm cursor-pointer active:scale-95 transform">
                                                <PiChatCircleTextFill className="text-slate-300 group-hover:text-blue-600 text-lg transition-colors" />
                                            </div>
                                        </div>
                                    ))}
                                    {filteredMembers.length === 0 && <div className="text-center py-4 text-xs text-slate-400">Không tìm thấy nhân viên nào</div>}
                                </>
                            )}
                        </div>
                    </div>

                    {/* FIX: Thêm h-full vào container này để nó fit chiều cao */}
                    <div className={`flex-1 bg-white/60 backdrop-blur-md border border-white/60 rounded-[32px] flex flex-col h-full shadow-glass relative overflow-hidden ${isMobileChatOpen || window.innerWidth >= 768 ? 'flex' : 'hidden'}`}>
                        {currentConv && (
                            <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-white/40 backdrop-blur-md shrink-0">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setIsMobileChatOpen(false)} className="md:hidden text-slate-500 hover:text-slate-800"><PiArrowLeftBold className="text-xl" /></button>
                                    <img src={getAvatar({ fullName: currentConv.name, avatar: currentConv.avatar })} onError={handleImageError} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" alt="" />
                                    <div>
                                        <h3 className="font-bold text-slate-800 leading-tight">{currentConv.name}</h3>
                                        {currentConv.online && <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span><span className="text-[10px] text-green-600 font-bold">Online</span></div>}
                                    </div>
                                </div>
                                {(!currentConv.type || currentConv.type === 'DIRECT') && (
                                    <div className="flex gap-1">
                                        <button onClick={() => startCall(false)} className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><PiPhoneFill className="text-lg" /></button>
                                        <button onClick={() => startCall(true)} className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><PiVideoCameraFill className="text-lg" /></button>
                                        <div className="w-px h-5 bg-slate-200 mx-2 my-auto"></div>
                                        <button className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"><PiDotsThreeVerticalFill className="text-lg" /></button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-custom min-h-0" id="chat-messages" ref={chatMessagesRef}>
                            {!currentConv && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm ring-4 ring-slate-50/50"><PiChatsCircleDuotone className="text-5xl text-blue-200" /></div>
                                    <p className="font-bold text-slate-600">Bắt đầu cuộc trò chuyện</p>
                                </div>
                            )}
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex w-full animate-pop message-row mb-4 ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                                    {msg.type === 'CALL_LOG' ? (
                                        <div className={`flex w-full message-row mb-2 ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                                            {msg.senderId !== user.id && <img src={getAvatar(msg.sender)} onError={handleImageError} className="w-8 h-8 rounded-full shadow-sm border border-white bg-white mb-1 mr-2 self-end" alt="" />}
                                            <div className={`p-3.5 rounded-2xl border shadow-sm flex items-center gap-3 min-w-[220px] ${msg.senderId === user.id ? 'bg-white border-blue-100 rounded-br-none' : 'bg-white border-slate-100 rounded-bl-none'}`}>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner ${msg.content.includes('nhỡ') || msg.content.includes('từ chối') ? 'bg-red-50 text-red-500' : (msg.content.includes('bận') ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500')}`}>
                                                    {msg.content.includes('nhỡ') ? <PiPhoneSlashFill className="text-xl" /> :
                                                        (msg.content.includes('video') ? <PiVideoCameraFill className="text-xl" /> :
                                                            (msg.content.includes('bận') ? <PiProhibitFill className="text-xl" /> :
                                                                <PiPhoneCallFill className="text-xl" />))}
                                                </div>
                                                <div className="flex flex-col">
                                                    <h4 className="text-xs font-extrabold text-slate-700">{msg.content.includes('bận') ? 'Người nhận đang bận' : (msg.content.includes('nhỡ') ? 'Cuộc gọi nhỡ' : (msg.senderId === user.id ? 'Cuộc gọi đi' : 'Cuộc gọi đến'))}</h4>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[10px] text-slate-400 font-medium">{formatDateTime(msg.createdAt)}</span>
                                                        {!msg.content.includes('nhỡ') && !msg.content.includes('bận') && !msg.content.includes('từ chối') && (
                                                            <span className="text-[10px] font-mono bg-slate-100 px-1.5 rounded text-slate-600">{msg.content.split('-')[1]?.trim() || 'Kết thúc'}</span>
                                                        )}
                                                    </div>
                                                    {(msg.content.includes('nhỡ') || msg.content.includes('bận')) && <span className="text-[10px] text-red-500 font-bold mt-1 cursor-pointer hover:underline" onClick={() => startCall(false)}>Nhấn để gọi lại</span>}
                                                </div>
                                            </div>
                                            {msg.senderId === user.id && <img src={getAvatar(user)} onError={handleImageError} className="w-8 h-8 rounded-full shadow-sm border border-white bg-white mb-1 ml-2 self-end" alt="" />}
                                        </div>
                                    ) : (
                                        <div className={`flex max-w-[80%] gap-2 items-end relative ${msg.senderId === user.id ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {msg.senderId !== user.id && <img src={getAvatar(msg.sender)} onError={handleImageError} className="w-8 h-8 rounded-full shadow-sm border border-white bg-white mb-1" alt="" />}
                                            <div className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                                                {msg.senderId !== user.id && currentConv?.type === 'GROUP' && <span className="text-[10px] text-slate-400 ml-1 mb-0.5 font-bold">{msg.sender?.fullName}</span>}
                                                <div className={`relative group flex items-center gap-2 ${msg.senderId === user.id ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <div className="relative">
                                                        {msg.type === 'IMAGE' && (
                                                            <div className="rounded-xl overflow-hidden border-2 border-white shadow-sm mb-1 cursor-pointer hover:shadow-md transition-shadow">
                                                                <img src={'https://aegism.online' + msg.content} className="max-w-[240px] max-h-[300px] object-cover" onClick={() => window.open('https://aegism.online' + msg.content, '_blank')} onError={handleImageError} alt="sent image" />
                                                            </div>
                                                        )}
                                                        {msg.type === 'FILE' && (
                                                            <a href={'https://aegism.online' + msg.content} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm mb-1 min-w-[200px]">
                                                                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><PiFileTextFill className="text-2xl" /></div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold text-slate-700 truncate">File đính kèm</p>
                                                                    <p className="text-[10px] text-blue-500 font-semibold">Nhấn để tải về</p>
                                                                </div>
                                                            </a>
                                                        )}
                                                        {msg.type === 'TEXT' && (
                                                            <div className={`py-2 px-4 rounded-[18px] text-sm leading-relaxed shadow-sm border msg-bubble ${msg.senderId === user.id ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white' : 'bg-white text-slate-700'}`}>
                                                                <p>{msg.content}</p>
                                                            </div>
                                                        )}
                                                        <div className={`absolute -bottom-3 flex gap-1 z-10 ${msg.senderId === user.id ? 'right-0' : 'left-0'}`}>
                                                            {getUniqueReactions(msg.reactions || []).map((r: any) => (
                                                                <div key={r.type} className="bg-white border border-slate-100 rounded-full px-1.5 py-0.5 shadow-sm text-[10px] flex items-center gap-0.5 cursor-help" title={r.users}>
                                                                    <span>{r.icon}</span><span className="font-bold text-slate-600">{r.count}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className={`msg-action-btn transition-all duration-200 opacity-0 group-hover:opacity-100 flex items-center gap-1 ${msg.senderId === user.id ? 'mr-1' : 'ml-1'}`}>
                                                        {/* Reactions */}
                                                        <ReactionButton onReact={(type) => reactToMessage(msg.id, type)} isSelf={msg.senderId === user.id} />

                                                        {/* Options (Edit/Delete) */}
                                                        {msg.senderId === user.id && <MessageOptions onEdit={() => editMessage(msg)} onDelete={() => deleteMessage(msg)} />}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 mt-1 justify-end w-full">
                                                    <span className="text-[9px] text-slate-300 font-bold tracking-wide">{formatDateTime(msg.createdAt)}</span>
                                                    {msg.senderId === user.id && msg.seenBy && msg.seenBy.length > 0 && (
                                                        <div className="flex ml-1 items-center">
                                                            {currentConv?.type === 'DIRECT' ? (
                                                                msg.seenBy.map((viewer: any) => (
                                                                    viewer.user.id !== user.id && <span key={viewer.user.id} className="text-[9px] text-gray-400 font-medium italic">Đã xem</span>
                                                                ))
                                                            ) : (
                                                                <div className="flex -space-x-1.5">
                                                                    {msg.seenBy.map((viewer: any) => (
                                                                        viewer.user.id !== user.id && <img key={viewer.user.id} src={getAvatar(viewer.user)} onError={handleImageError} className="w-3.5 h-3.5 rounded-full ring-1 ring-white" title={'Đã xem bởi ' + viewer.user.fullName} alt="" />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {currentConv && (
                            <div className="p-4 bg-white/40 backdrop-blur-md border-t border-white/50 shrink-0">
                                <div className="flex items-end gap-2 bg-white p-1.5 rounded-[24px] border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all">
                                    <button onClick={() => fileInputRef.current?.click()} className="w-9 h-9 flex-shrink-0 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"><PiPaperclipBold className="text-xl" /></button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="*/*" onChange={handleFileUpload} />
                                    <div className="flex-1 py-2">
                                        <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} rows={1} className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-700 placeholder-slate-400 resize-none max-h-24 font-medium outline-none" placeholder="Nhập tin nhắn..."></textarea>
                                    </div>
                                    <button onClick={sendMessage} disabled={!newMessage.trim()} className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all"><PiPaperPlaneRightFill className="text-lg" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {showCreateGroupModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
                        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-pop">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-800">Tạo Nhóm Chat</h3>
                                <button onClick={() => setShowCreateGroupModal(false)} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"><PiXBold /></button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Tên nhóm</label>
                                    <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none text-sm font-semibold transition-all" placeholder="Nhập tên nhóm..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Thành viên</label>
                                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-1 scrollbar-custom bg-slate-50">
                                        {availableMembers.map(member => (
                                            <label key={member.userId} className="flex items-center p-2 hover:bg-white rounded-lg cursor-pointer transition-all gap-3 border border-transparent hover:border-slate-100 hover:shadow-sm mb-1">
                                                <input type="checkbox" value={member.userId} checked={selectedMembers.includes(member.userId)} onChange={(e) => {
                                                    if (e.target.checked) setSelectedMembers(prev => [...prev, member.userId]);
                                                    else setSelectedMembers(prev => prev.filter(id => id !== member.userId));
                                                }} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                                                <img src={getAvatar({ fullName: member.name, avatar: member.avatar })} onError={handleImageError} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-100" alt="" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-700 truncate">{member.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{member.role}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="mt-2 text-right"><span className="text-xs font-semibold text-slate-500">Đã chọn: <b className="text-blue-600">{selectedMembers.length}</b></span></div>
                                </div>
                            </div>
                            <div className="p-5 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-2">
                                <button onClick={() => setShowCreateGroupModal(false)} className="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors">Hủy</button>
                                <button onClick={createGroup} className="px-5 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/40 transition-all">Tạo nhóm</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS FOR REACTION & OPTIONS (To handle their own outside click state) ---
const ReactionButton = ({ onReact, isSelf }: { onReact: (type: string) => void, isSelf: boolean }) => {
    const [showReact, setShowReact] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowReact(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={wrapperRef} className="relative">
            <button onClick={() => setShowReact(!showReact)} className="w-6 h-6 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 text-lg transition-colors"><PiSmileyBold /></button>
            {showReact && (
                <div className={`absolute bottom-full mb-2 bg-white rounded-full shadow-xl border border-slate-100 p-1 flex gap-1 animate-pop z-50 ${isSelf ? 'right-0' : 'left-0'}`}>
                    <button onClick={() => { onReact('LIKE'); setShowReact(false); }} className="w-8 h-8 rounded-full hover:bg-blue-50 flex items-center justify-center text-xl transition-transform">👍</button>
                    <button onClick={() => { onReact('LOVE'); setShowReact(false); }} className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-xl transition-transform">❤️</button>
                    <button onClick={() => { onReact('HAHA'); setShowReact(false); }} className="w-8 h-8 rounded-full hover:bg-yellow-50 flex items-center justify-center text-xl transition-transform">😂</button>
                    <button onClick={() => { onReact('WOW'); setShowReact(false); }} className="w-8 h-8 rounded-full hover:bg-yellow-50 flex items-center justify-center text-xl transition-transform">😮</button>
                    <button onClick={() => { onReact('SAD'); setShowReact(false); }} className="w-8 h-8 rounded-full hover:bg-yellow-50 flex items-center justify-center text-xl transition-transform">😢</button>
                    <button onClick={() => { onReact('ANGRY'); setShowReact(false); }} className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-xl transition-transform">😡</button>
                </div>
            )}
        </div>
    );
};

const MessageOptions = ({ onEdit, onDelete }: { onEdit: () => void, onDelete: () => void }) => {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={wrapperRef} className="relative">
            <button onClick={() => setOpen(!open)} className="w-6 h-6 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400"><PiDotsThreeVerticalBold className="text-xs" /></button>
            {open && (
                <div className="absolute top-0 mt-1 w-24 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden py-1 z-20 right-full mr-1">
                    <button onClick={() => { onEdit(); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Sửa</button>
                    <button onClick={() => { onDelete(); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50">Xóa</button>
                </div>
            )}
        </div>
    );
};

export default Chat;