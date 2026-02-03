import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { socketService } from '../services/socket';
import { notificationSound } from '../services/notificationSound';

interface CallContextType {
    isCalling: boolean;
    isInCall: boolean;
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
    const [isCalling, setIsCalling] = useState(false); // Outgoing
    const [isInCall, setIsInCall] = useState(false); // Connected
    const [incomingCall, setIncomingCall] = useState<{ callerId: string; callerName: string; offer: any; type: 'AUDIO' | 'VIDEO' } | null>(null);

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const remoteSocketId = useRef<string | null>(null);

    // -- SETUP WEBRTC --
    const setupPeerConnection = () => {
        if (peerConnection.current) return peerConnection.current;

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && remoteSocketId.current) {
                socketService.sendMessage('call:ice-candidate', {
                    target: remoteSocketId.current, // Keep this if server handles it, OR broadcast with receiverId
                    receiverId: remoteSocketId.current,
                    senderId: 'ADMIN',
                    candidate: event.candidate
                });
            }
        };

        pc.ontrack = (event) => {
            console.log('Remote Stream Received globally');
            setRemoteStream(event.streams[0]);
        };

        peerConnection.current = pc;
        return pc;
    };

    const cleanupCall = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
        setIncomingCall(null);
        setIsCalling(false);
        setIsInCall(false);
        remoteSocketId.current = null;
    };

    // -- SOCKET LISTENERS --
    useEffect(() => {
        // Handle Incoming Offer
        socketService.onMessage('call:offer', async (data: any) => {
            // Filter: Only accept if intended for ADMIN
            if (data.receiverId !== 'ADMIN') return;

            console.log('Incoming Call Offer:', data);

            // If already in call, maybe reject or ignore? For now auto-reject or show busy could be nice but let's just ring.
            setIncomingCall({
                callerId: data.senderId,
                callerName: data.senderId, // Or look up worker name
                offer: data.offer,
                type: data.type === 'video' ? 'VIDEO' : 'AUDIO'
            });
            remoteSocketId.current = data.senderId;
            notificationSound.playRingtone();
        });

        // Handle Answer (When we are the caller)
        socketService.onMessage('call:answer', async (data: any) => {
            if (data.receiverId !== 'ADMIN') return;

            console.log('Call Accepted by Peer', data);
            setIsCalling(false);
            setIsInCall(true);
            notificationSound.stop(); // Stop ringing out

            if (peerConnection.current) {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
        });

        // Handle End/Reject
        socketService.onMessage('call:end', (data: any) => {
            // Check if it relates to us (either we are sender or receiver involved)
            // Simplified: If we are in a call with this person, end it.
            if (remoteSocketId.current && (data.senderId === remoteSocketId.current || data.receiverId === 'ADMIN')) {
                console.log('Call Ended by Remote');
                notificationSound.stop();
                cleanupCall();
            }
        });

        // Handle ICE Candidates
        socketService.onMessage('call:ice-candidate', async (data: any) => {
            if (data.receiverId !== 'ADMIN') return;

            if (peerConnection.current) {
                try {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                    console.error('Error adding received ice candidate', e);
                }
            }
        });

        return () => {
            // clear listeners if needed
        };
    }, []);

    // -- ACTIONS --
    const startCall = async (targetId: string, type: 'AUDIO' | 'VIDEO') => {
        setIsCalling(true);
        remoteSocketId.current = targetId;

        // Get Local Stream
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === 'VIDEO'
            });
            setLocalStream(stream);

            const pc = setupPeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socketService.sendMessage('call:offer', {
                receiverId: targetId,
                senderId: 'ADMIN',
                offer: offer,
                type: type === 'VIDEO' ? 'video' : 'audio'
            });

        } catch (err) {
            console.error('Failed to start call:', err);
            setIsCalling(false);
        }
    };

    const answerCall = async () => {
        if (!incomingCall) return;
        notificationSound.stop();

        try {
            const type = incomingCall.type;
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === 'VIDEO'
            });
            setLocalStream(stream);

            const pc = setupPeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socketService.sendMessage('call:answer', {
                receiverId: incomingCall.callerId,
                senderId: 'ADMIN',
                answer: answer
            });

            setIsInCall(true);
            setIncomingCall(null);
        } catch (err) {
            console.error('Error answering call:', err);
        }
    };

    const rejectCall = () => {
        if (incomingCall) {
            notificationSound.stop();
            socketService.sendMessage('call:end', {
                receiverId: incomingCall.callerId,
                senderId: 'ADMIN'
            });
            setIncomingCall(null);
            remoteSocketId.current = null;
        }
    };

    const endCall = () => {
        if (remoteSocketId.current) {
            socketService.sendMessage('call:end', {
                receiverId: remoteSocketId.current, // Target
                senderId: 'ADMIN'
            });
        }
        cleanupCall();
    };

    return (
        <CallContext.Provider value={{
            isCalling,
            isInCall,
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
