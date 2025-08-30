import { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';

export default function useWebRTCManager({ socket, roomId, onFileReceived, onPeerConnected }) {
  const [peers, setPeers] = useState({});
  const [isInitiator, setIsInitiator] = useState(false);
  const peersRef = useRef({});

  useEffect(() => {
    if (!socket) return;

    // WebRTC signaling events
    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);
    socket.on('user-joined-webrtc', handleUserJoined);
    socket.on('user-left-webrtc', handleUserLeft);

    // Announce WebRTC capability
    socket.emit('webrtc-ready', roomId);

    return () => {
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('user-joined-webrtc');
      socket.off('user-left-webrtc');
      
      // Clean up peer connections
      Object.values(peersRef.current).forEach(peer => {
        if (peer && !peer.destroyed) {
          peer.destroy();
        }
      });
    };
  }, [socket, roomId]);

  const handleUserJoined = (userId) => {
    if (userId === socket.id) return;
    
    // Create peer connection as initiator
    createPeerConnection(userId, true);
  };

  const handleUserLeft = (userId) => {
    if (peersRef.current[userId]) {
      peersRef.current[userId].destroy();
      delete peersRef.current[userId];
      setPeers(prev => {
        const newPeers = { ...prev };
        delete newPeers[userId];
        return newPeers;
      });
    }
  };

  const createPeerConnection = (userId, initiator = false) => {
    const peer = new Peer({
      initiator,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on('signal', (data) => {
      if (data.type === 'offer') {
        socket.emit('webrtc-offer', { target: userId, offer: data, roomId });
      } else if (data.type === 'answer') {
        socket.emit('webrtc-answer', { target: userId, answer: data, roomId });
      }
    });

    peer.on('connect', () => {
      onPeerConnected?.(userId);
    });

    peer.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'file') {
          onFileReceived?.(message.file);
        }
      } catch (error) {
        // Silently handle parsing errors
      }
    });

    peer.on('error', (error) => {
      // Handle peer errors silently
    });

    peersRef.current[userId] = peer;
    setPeers(prev => ({ ...prev, [userId]: peer }));

    return peer;
  };

  const handleOffer = ({ from, offer }) => {
    if (!peersRef.current[from]) {
      const peer = createPeerConnection(from, false);
      peer.signal(offer);
    }
  };

  const handleAnswer = ({ from, answer }) => {
    if (peersRef.current[from]) {
      peersRef.current[from].signal(answer);
    }
  };

  const handleIceCandidate = ({ from, candidate }) => {
    if (peersRef.current[from]) {
      peersRef.current[from].signal(candidate);
    }
  };

  const sendFileToPeers = (file) => {
    const fileData = {
      type: 'file',
      file: {
        name: file.name,
        size: file.size,
        data: file.data,
        sender: 'You'
      }
    };

    Object.values(peersRef.current).forEach(peer => {
      if (peer.connected) {
        try {
          peer.send(JSON.stringify(fileData));
        } catch (error) {
          // Handle send errors silently
        }
      }
    });
  };

  const getConnectedPeersCount = () => {
    return Object.values(peersRef.current).filter(peer => peer.connected).length;
  };

  return {
    sendFileToPeers,
    getConnectedPeersCount,
    connectedPeers: Object.keys(peers).filter(id => peersRef.current[id]?.connected)
  };
}