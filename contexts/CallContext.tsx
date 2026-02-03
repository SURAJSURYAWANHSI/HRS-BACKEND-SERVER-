import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { socketService } from '../services/socket';
import { notificationSound } from '../services/notificationSound';

interface CallContextType {
    isCalling: boolean;
    isInCall: boolean;
    callType: 'AUDIO' | 'VIDEO';
    incomingCall: { callerId: string; callerName: string; offer: any; type: 'AUDIO' | 'VIDEO' } | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    startCall: (targetId: string, type: 'AUDIO' | 'VIDEO') => void;
    answerCall: () => void;
    rejectCall: () => void;
    endCall: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isCalling, setIsCalling] = useState(false);
    const [isInCall, setIsInCall] = useState(false);
    const [callType, setCallType] = useState<'AUDIO' | 'VIDEO'>('AUDIO');
    const [incomingCall, setIncomingCall] = useState<{ callerId: string; callerName: string; offer: any; type: 'AUDIO' | 'VIDEO' } | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    // Use refs to avoid stale closures
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const remoteSocketIdRef = useRef<string | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const incomingCallRef = useRef<{ callerId: string; callerName: string; offer: any; type: 'AUDIO' | 'VIDEO' } | null>(null);

    // Keep refs in sync
    useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
    useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);

    // Cleanup function using refs
    const cleanupCall = useCallback(() => {
        console.log('[Admin CallContext] Cleaning up call...');

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('[Admin CallContext] Stopped track:', track.kind);
            });
        }

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
            console.log('[Admin CallContext] Closed peer connection');
        }

        setLocalStream(null);
        setRemoteStream(null);
        setIncomingCall(null);
        setIsCalling(false);
        setIsInCall(false);
        remoteSocketIdRef.current = null;
        notificationSound.stop();

        console.log('[Admin CallContext] Cleanup complete');
    }, []);

    // Setup WebRTC Peer Connection
    const setupPeerConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            console.log('[Admin CallContext] Reusing existing peer connection');
            return peerConnectionRef.current;
        }

        console.log('[Admin CallContext] Creating new peer connection');
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && remoteSocketIdRef.current) {
                console.log('[Admin CallContext] Sending ICE candidate');
                socketService.sendMessage('call:ice-candidate', {
                    target: remoteSocketIdRef.current,
                    receiverId: remoteSocketIdRef.current,
                    senderId: 'ADMIN',
                    candidate: event.candidate
                });
            }
        };

        pc.ontrack = (event) => {
            console.log('[Admin CallContext] Remote track received:', event.track.kind);
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('[Admin CallContext] Connection state:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                console.log('[Admin CallContext] WebRTC Connected!');
                setIsInCall(true);
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                console.log('[Admin CallContext] WebRTC Disconnected/Failed');
                cleanupCall();
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('[Admin CallContext] ICE state:', pc.iceConnectionState);
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [cleanupCall]);

    // Socket event handlers
    useEffect(() => {
        const handleOffer = async (data: any) => {
            // Filter: Only accept if intended for ADMIN
            if (data.receiverId !== 'ADMIN') return;

            console.log('[Admin CallContext] Received offer:', data);

            // Don't answer if already in a call
            if (peerConnectionRef.current) {
                console.log('[Admin CallContext] Already in a call, ignoring');
                return;
            }

            setIncomingCall({
                callerId: data.senderId,
                callerName: data.senderId,
                offer: data.offer,
                type: data.type === 'video' ? 'VIDEO' : 'AUDIO'
            });
            remoteSocketIdRef.current = data.senderId;
            notificationSound.playRingtone();
        };

        const handleAnswer = async (data: any) => {
            if (data.receiverId !== 'ADMIN') return;

            console.log('[Admin CallContext] Received answer:', data);
            notificationSound.stop();
            setIsCalling(false);
            setIsInCall(true);

            if (peerConnectionRef.current && data.answer) {
                try {
                    await peerConnectionRef.current.setRemoteDescription(
                        new RTCSessionDescription(data.answer)
                    );
                    console.log('[Admin CallContext] Remote description set');
                } catch (err) {
                    console.error('[Admin CallContext] Error setting remote description:', err);
                }
            }
        };

        const handleEnd = (data: any) => {
            console.log('[Admin CallContext] Received end signal:', data);

            const fromMyPeer = remoteSocketIdRef.current && data.senderId === remoteSocketIdRef.current;
            const forMe = data.receiverId === 'ADMIN';

            if (fromMyPeer || forMe) {
                console.log('[Admin CallContext] Call ended by remote');
                notificationSound.stop();
                cleanupCall();
            }
        };

        const handleIceCandidate = async (data: any) => {
            if (data.receiverId !== 'ADMIN') return;

            if (peerConnectionRef.current && data.candidate) {
                try {
                    await peerConnectionRef.current.addIceCandidate(
                        new RTCIceCandidate(data.candidate)
                    );
                    console.log('[Admin CallContext] Added ICE candidate');
                } catch (e) {
                    console.error('[Admin CallContext] Error adding ICE candidate:', e);
                }
            }
        };

        // Register listeners
        socketService.onMessage('call:offer', handleOffer);
        socketService.onMessage('call:answer', handleAnswer);
        socketService.onMessage('call:end', handleEnd);
        socketService.onMessage('call:ice-candidate', handleIceCandidate);

        // Cleanup on unmount
        return () => {
            socketService.off('call:offer', handleOffer);
            socketService.off('call:answer', handleAnswer);
            socketService.off('call:end', handleEnd);
            socketService.off('call:ice-candidate', handleIceCandidate);
        };
    }, [cleanupCall]);

    // Start outgoing call
    const startCall = useCallback(async (targetId: string, type: 'AUDIO' | 'VIDEO') => {
        console.log('[Admin CallContext] Starting call to:', targetId, type);

        setIsCalling(true);
        setCallType(type);
        remoteSocketIdRef.current = targetId;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === 'VIDEO'
            });
            console.log('[Admin CallContext] Got local stream');
            setLocalStream(stream);
            localStreamRef.current = stream;

            const pc = setupPeerConnection();
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
                console.log('[Admin CallContext] Added track:', track.kind);
            });

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.log('[Admin CallContext] Created and set local offer');

            socketService.sendMessage('call:offer', {
                receiverId: targetId,
                senderId: 'ADMIN',
                offer: offer,
                type: type === 'VIDEO' ? 'video' : 'audio'
            });

        } catch (err) {
            console.error('[Admin CallContext] Failed to start call:', err);
            cleanupCall();
        }
    }, [setupPeerConnection, cleanupCall]);

    // Answer incoming call
    const answerCall = useCallback(async () => {
        const call = incomingCallRef.current;
        if (!call) {
            console.log('[Admin CallContext] No incoming call to answer');
            return;
        }

        console.log('[Admin CallContext] Answering call from:', call.callerId);

        try {
            notificationSound.stop();
            setCallType(call.type);

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: call.type === 'VIDEO'
            });
            console.log('[Admin CallContext] Got local stream for answer');
            setLocalStream(stream);
            localStreamRef.current = stream;

            const pc = setupPeerConnection();
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
                console.log('[Admin CallContext] Added track:', track.kind);
            });

            await pc.setRemoteDescription(new RTCSessionDescription(call.offer));
            console.log('[Admin CallContext] Set remote description from offer');

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log('[Admin CallContext] Created and set local answer');

            socketService.sendMessage('call:answer', {
                receiverId: call.callerId,
                senderId: 'ADMIN',
                answer: answer
            });

            setIsInCall(true);
            setIncomingCall(null);
            console.log('[Admin CallContext] Call answered successfully');

        } catch (err) {
            console.error('[Admin CallContext] Error answering call:', err);
            cleanupCall();
        }
    }, [setupPeerConnection, cleanupCall]);

    // Reject incoming call
    const rejectCall = useCallback(() => {
        const call = incomingCallRef.current;
        if (call) {
            console.log('[Admin CallContext] Rejecting call from:', call.callerId);
            notificationSound.stop();
            socketService.sendMessage('call:end', {
                receiverId: call.callerId,
                senderId: 'ADMIN'
            });
            setIncomingCall(null);
            remoteSocketIdRef.current = null;
        }
    }, []);

    // End active call
    const endCall = useCallback(() => {
        console.log('[Admin CallContext] Ending call');
        if (remoteSocketIdRef.current) {
            socketService.sendMessage('call:end', {
                receiverId: remoteSocketIdRef.current,
                senderId: 'ADMIN'
            });
        }
        cleanupCall();
    }, [cleanupCall]);

    return (
        <CallContext.Provider value={{
            isCalling,
            isInCall,
            callType,
            incomingCall,
            localStream,
            remoteStream,
            startCall,
            answerCall,
            rejectCall,
            endCall
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) throw new Error('useCall must be used within a CallProvider');
    return context;
};
