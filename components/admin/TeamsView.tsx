import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
    Users, Phone, Video, MessageCircle, Mic, Image as ImageIcon,
    Send, X, PhoneOff, MicOff, VideoOff, Play, Pause, Camera,
    ChevronLeft, Circle, Check, CheckCheck, Minimize2, Maximize2,
    PhoneIncoming, Square
} from 'lucide-react';
import { Worker, Message } from '../../types';
import { socketService } from '../../services/socket';
import { useCall } from '../../contexts/CallContext';

interface TeamsViewProps {
    workers: Worker[];
    currentUser: Worker | null;
}

export const TeamsView: React.FC<TeamsViewProps> = ({ workers, currentUser }) => {
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');

    // Voice recording states
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(socketService.isConnected());

    // Camera capture states
    const [showCamera, setShowCamera] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const cameraVideoRef = useRef<HTMLVideoElement>(null);
    const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

    // -- SOCKET & MESSAGE HANDLING --

    // Listen for incoming messages
    useEffect(() => {
        const handleMessage = (msg: Message) => {
            console.log("TeamsView Received Message:", msg);
            if (msg.receiver_id === 'ADMIN' || msg.sender_id === 'ADMIN') {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id || (m.timestamp === msg.timestamp && m.content === msg.content))) {
                        return prev;
                    }
                    return [...prev, msg];
                });
            }
        };

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        socketService.onMessage('message:receive', handleMessage);
        socketService.onConnect(handleConnect);
        socketService.socket?.on('disconnect', handleDisconnect);

        // Initial check
        setIsConnected(socketService.isConnected());

        return () => {
            // Cleanup not strictly necessary for singleton signals but good practice if we had removeListener
        };
    }, []);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, selectedWorker]); // Scroll when messages change or we switch chat

    // Auto-scroll to latest message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Filter messages for selected worker
    const currentChat = messages.filter(m =>
        (m.sender_id === 'ADMIN' && m.receiver_id === selectedWorker?.id) ||
        (m.sender_id === selectedWorker?.id && m.receiver_id === 'ADMIN')
    ).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));


    // -- GLOBAL CALL CONTEXT --
    const {
        isCalling,
        isInCall,
        incomingCall: globalIncomingCall,
        localStream,
        remoteStream,
        startCall,
        answerCall,
        rejectCall,
        endCall
    } = useCall();

    // Local UI state for call controls - REMOVED (Handled Globally)



    // -- RECORDING --
    const startVoiceRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result as string;
                    if (selectedWorker) {
                        const msgData: Message = {
                            id: `MSG-${Date.now()}`,
                            sender_id: 'ADMIN',
                            receiver_id: selectedWorker.id,
                            content: 'Voice Note',
                            type: 'audio',
                            attachment_url: base64,
                            timestamp: Date.now(),
                            is_read: false
                        };
                        socketService.sendMessage('message:send', msgData);
                        setMessages(prev => [...prev, msgData]);
                    }
                };
                reader.readAsDataURL(audioBlob);
                stream.getTracks().forEach(track => track.stop());

                setIsRecording(false);
                if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone");
        }
    };

    const stopVoiceRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    // Play voice message
    const playVoiceMessage = (messageId: string, audioUrl: string) => {
        // Stop any currently playing audio
        audioElementsRef.current.forEach((audio, id) => {
            if (id !== messageId) {
                audio.pause();
                audio.currentTime = 0;
            }
        });

        let audio = audioElementsRef.current.get(messageId);
        if (!audio) {
            audio = new Audio(audioUrl);
            audioElementsRef.current.set(messageId, audio);
            audio.onended = () => setPlayingVoiceId(null);
        }

        if (playingVoiceId === messageId) {
            audio.pause();
            setPlayingVoiceId(null);
        } else {
            audio.play();
            setPlayingVoiceId(messageId);
        }
    };

    // -- CAMERA / IMAGE --
    const openCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            setCameraStream(stream);
            setShowCamera(true);
            setTimeout(() => {
                if (cameraVideoRef.current) {
                    cameraVideoRef.current.srcObject = stream;
                }
            }, 100);
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Could not access camera. Please check permissions.');
        }
    };

    const capturePhoto = () => {
        if (!cameraVideoRef.current || !cameraStream) return;
        const canvas = document.createElement('canvas');
        canvas.width = cameraVideoRef.current.videoWidth;
        canvas.height = cameraVideoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(cameraVideoRef.current, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.9);

            if (selectedWorker) {
                const msgData: Message = {
                    id: `MSG-${Date.now()}`,
                    sender_id: 'ADMIN',
                    receiver_id: selectedWorker.id,
                    content: 'Photo',
                    type: 'image',
                    attachment_url: base64,
                    timestamp: Date.now(),
                    is_read: false
                };
                socketService.sendMessage('message:send', msgData);
                setMessages(prev => [...prev, msgData]);
            }
        }
        closeCamera();
    };

    const closeCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }
        setCameraStream(null);
        setShowCamera(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !selectedWorker) return;

        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                const msgData: Message = {
                    id: `MSG-${Date.now()}-${Math.random()}`,
                    sender_id: 'ADMIN',
                    receiver_id: selectedWorker.id,
                    content: file.name,
                    type: 'image',
                    attachment_url: base64,
                    timestamp: Date.now(),
                    is_read: false
                };
                socketService.sendMessage('message:send', msgData);
                setMessages(prev => [...prev, msgData]);
            };
            reader.readAsDataURL(file);
        });
    };


    const initiateCall = async (type: 'audio' | 'video') => {
        if (!selectedWorker) return;
        startCall(selectedWorker.id, type === 'video' ? 'VIDEO' : 'AUDIO');
    };



    // -- SEND TEXT --

    // -- SEND TEXT --
    const handleSendMessage = () => {
        if (!inputText.trim() || !selectedWorker) return;

        const newMsg: Message = {
            id: `MSG-${Date.now()}`,
            sender_id: 'ADMIN',
            receiver_id: selectedWorker.id,
            content: inputText.trim(),
            type: 'text',
            timestamp: Date.now(),
            is_read: false
        };

        console.log('[Admin Chat] Sending message:', newMsg);
        socketService.sendMessage('message:send', newMsg);
        setMessages(prev => [...prev, newMsg]);
        setInputText('');
    };


    // Helper
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTimestamp = (ts: number) => {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const teamMembers = workers.filter(w => w.role !== 'ADMIN');


    return (
        <>
            <div className="flex flex-col md:flex-row h-full md:h-[calc(100vh-180px)] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl m-0 md:m-4">

                {/* LEFT: Team Members List */}
                <div className={`${selectedWorker ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-slate-800/50 backdrop-blur-xl border-b md:border-b-0 md:border-r border-slate-700/50 flex-col max-h-[40vh] md:max-h-full overflow-hidden`}>
                    {/* Header */}
                    <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <Users size={22} />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-base font-bold text-white tracking-wide">Team Chat</h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-xs text-slate-400">{teamMembers.length} members</p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${isConnected
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                                        {isConnected ? 'LIVE' : 'OFFLINE'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Members List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
                        {teamMembers.map(worker => (
                            <button
                                key={worker.id}
                                onClick={() => setSelectedWorker(worker)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${selectedWorker?.id === worker.id
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                                    : 'hover:bg-slate-700/50 text-white'
                                    }`}
                            >
                                <div className="relative">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${selectedWorker?.id === worker.id
                                        ? 'bg-white/20 text-white'
                                        : 'bg-gradient-to-br from-slate-600 to-slate-700 text-slate-300'
                                        }`}>
                                        {worker.name.charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-800 shadow-sm"></div>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <p className="font-semibold text-sm truncate">{worker.name}</p>
                                    <p className={`text-[11px] truncate ${selectedWorker?.id === worker.id ? 'text-blue-200' : 'text-slate-500'}`}>
                                        {worker.role}
                                    </p>
                                </div>
                                {selectedWorker?.id === worker.id && (
                                    <div className="w-1.5 h-8 bg-white/30 rounded-full"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Chat Area */}
                <div className="flex-1 flex flex-col bg-slate-900">
                    {selectedWorker ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-18 bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 flex items-center justify-between px-5 py-4">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setSelectedWorker(null)} className="md:hidden p-2 hover:bg-slate-700 rounded-xl text-slate-400 transition-colors">
                                        <ChevronLeft size={20} />
                                    </button>
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                                            {selectedWorker.name.charAt(0)}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-800"></div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-base">{selectedWorker.name}</h3>
                                        <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                            Online
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => initiateCall('audio')}
                                        className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95"
                                        title="Voice Call"
                                    >
                                        <Phone size={18} />
                                    </button>
                                    <button
                                        onClick={() => initiateCall('video')}
                                        className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95"
                                        title="Video Call"
                                    >
                                        <Video size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-slate-900 to-slate-900/95">
                                {currentChat.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                        <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4">
                                            <MessageCircle size={36} className="text-slate-600" />
                                        </div>
                                        <p className="text-base font-semibold text-slate-400">No messages yet</p>
                                        <p className="text-sm text-slate-600 mt-1">Start chatting with {selectedWorker.name}</p>
                                    </div>
                                ) : (
                                    currentChat.map((msg, idx) => {
                                        const isMine = msg.sender_id === 'ADMIN';
                                        return (
                                            <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%]`}>
                                                    {msg.type === 'text' && (
                                                        <div className={`px-4 py-3 rounded-2xl ${isMine
                                                            ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-md shadow-lg shadow-blue-500/20'
                                                            : 'bg-slate-800 text-white rounded-bl-md border border-slate-700/50'
                                                            }`}>
                                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                                        </div>
                                                    )}
                                                    {(msg.type === 'image' || (msg.type === 'file' && (msg.content?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || msg.attachment_url?.startsWith('data:image')))) && (
                                                        <div className={`p-1.5 rounded-2xl ${isMine ? 'bg-gradient-to-br from-blue-600 to-blue-500' : 'bg-slate-800 border border-slate-700/50'}`}>
                                                            <img src={msg.attachment_url || ''} alt="Shared" className="max-w-full h-auto rounded-xl max-h-52 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.attachment_url, '_blank')} />
                                                        </div>
                                                    )}
                                                    {msg.type === 'file' && !(msg.content?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || msg.attachment_url?.startsWith('data:image')) && (
                                                        <div className={`px-4 py-3 rounded-2xl ${isMine ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white' : 'bg-slate-800 text-white border border-slate-700/50'}`}>
                                                            <a href={msg.attachment_url} download={msg.content} className="flex items-center gap-2 hover:underline" target="_blank" rel="noreferrer">
                                                                <Square size={16} />
                                                                <span className="text-sm truncate max-w-[150px]">{msg.content || 'Download File'}</span>
                                                            </a>
                                                        </div>
                                                    )}
                                                    {msg.type === 'audio' && (
                                                        <div className={`px-4 py-3 rounded-2xl flex items-center gap-3 ${isMine ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white' : 'bg-slate-800 text-white border border-slate-700/50'
                                                            }`}>
                                                            <button
                                                                onClick={() => playVoiceMessage(msg.id, msg.attachment_url || '')}
                                                                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-all"
                                                            >
                                                                {playingVoiceId === msg.id ? <Pause size={14} /> : <Play size={14} />}
                                                            </button>
                                                            <div className="flex-1 h-1.5 bg-white/20 rounded-full w-24 relative overflow-hidden">
                                                                <div className={`h-full bg-white rounded-full ${playingVoiceId === msg.id ? 'animate-pulse w-full' : 'w-0'}`}></div>
                                                            </div>
                                                            <span className="text-[11px] font-medium opacity-80">Voice</span>
                                                        </div>
                                                    )}
                                                    <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-500 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                        <span>{formatTimestamp(msg.timestamp)}</span>
                                                        {isMine && (
                                                            <CheckCheck size={12} className={msg.is_read ? "text-blue-400" : "text-slate-500"} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="bg-slate-800/80 backdrop-blur-xl border-t border-slate-700/50 flex items-center gap-3 px-5 py-4">
                                {isRecording ? (
                                    <div className="flex-1 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                                        <span className="text-red-400 font-medium text-sm">Recording {formatTime(recordingTime)}</span>
                                        <button onClick={stopVoiceRecording} className="ml-auto p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors" title="Stop & Send">
                                            <Square size={14} />
                                        </button>
                                        <button onClick={() => { stopVoiceRecording(); }} className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-colors" title="Cancel">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => fileInputRef.current?.click()} className="p-2.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all" title="Send Image">
                                                <ImageIcon size={20} />
                                            </button>
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />

                                            <button onClick={openCamera} className="p-2.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all" title="Take Photo">
                                                <Camera size={20} />
                                            </button>

                                            <button onClick={startVoiceRecording} className="p-2.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all" title="Voice Message">
                                                <Mic size={20} />
                                            </button>
                                        </div>

                                        <input
                                            type="text"
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-slate-700/50 border border-slate-600/50 focus:border-blue-500/50 outline-none px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-500 transition-colors"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!inputText.trim()}
                                            className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95 disabled:hover:scale-100"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-slate-900">
                            <div className="w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-3xl flex items-center justify-center mb-6 border border-slate-700/50">
                                <MessageCircle size={40} className="text-slate-600" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Select a Chat</h3>
                            <p className="text-sm text-slate-500 max-w-[250px] text-center">Choose a team member from the list to start a conversation</p>
                        </div>
                    )}
                </div>
            </div>

            {/* CAMERA CAPTURE MODAL */}
            {showCamera && (
                <div className="fixed inset-0 z-[300] bg-black flex flex-col">
                    <div className="flex-1 relative">
                        <video
                            ref={cameraVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="bg-black p-6 flex items-center justify-center gap-6">
                        <button
                            onClick={closeCamera}
                            className="p-4 bg-slate-800 text-white rounded-full"
                        >
                            <X size={24} />
                        </button>
                        <button
                            onClick={capturePhoto}
                            className="p-6 bg-white rounded-full shadow-xl hover:scale-105 transition-all"
                        >
                            <div className="w-12 h-12 bg-red-500 rounded-full"></div>
                        </button>
                        <div className="w-16"></div>
                    </div>
                </div>
            )}
        </>
    );
};
