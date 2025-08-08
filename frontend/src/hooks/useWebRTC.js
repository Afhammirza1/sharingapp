import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export const useWebRTC = (roomId) => {
  const [peers, setPeers] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [dataChannels, setDataChannels] = useState({});
  const [transferProgress, setTransferProgress] = useState({});
  
  const localPeerRef = useRef(null);
  const iceCandidatesQueue = useRef([]);

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ]
  };

  // Initialize WebRTC peer connection
  const initializePeerConnection = useCallback((peerId, initiator = false) => {
    const peerConnection = new RTCPeerConnection(iceServers);
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, send this to the signaling server
        // For now, we'll store it locally
        console.log('ICE candidate generated:', event.candidate);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        setIsConnected(true);
        toast.success('Peer-to-peer connection established!');
      } else if (peerConnection.connectionState === 'disconnected') {
        setIsConnected(false);
        toast.info('Peer connection lost');
      }
    };

    // Create data channel for file transfer
    if (initiator) {
      const dataChannel = peerConnection.createDataChannel('fileTransfer', {
        ordered: true
      });
      setupDataChannel(dataChannel, peerId);
    } else {
      peerConnection.ondatachannel = (event) => {
        setupDataChannel(event.channel, peerId);
      };
    }

    return peerConnection;
  }, []);

  // Setup data channel handlers
  const setupDataChannel = (dataChannel, peerId) => {
    dataChannel.onopen = () => {
      console.log('Data channel opened with peer:', peerId);
      setDataChannels(prev => ({ ...prev, [peerId]: dataChannel }));
    };

    dataChannel.onclose = () => {
      console.log('Data channel closed with peer:', peerId);
      setDataChannels(prev => {
        const newChannels = { ...prev };
        delete newChannels[peerId];
        return newChannels;
      });
    };

    dataChannel.onmessage = (event) => {
      handleDataChannelMessage(event.data, peerId);
    };

    dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
      toast.error('File transfer error');
    };
  };

  // Handle incoming data channel messages
  const handleDataChannelMessage = (data, peerId) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'file-info':
          handleFileInfo(message, peerId);
          break;
        case 'file-chunk':
          handleFileChunk(message, peerId);
          break;
        case 'file-complete':
          handleFileComplete(message, peerId);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      // Handle binary data (file chunks)
      console.log('Received binary data from peer:', peerId);
    }
  };

  // Handle file information
  const handleFileInfo = (message, peerId) => {
    console.log('Receiving file:', message.fileName, 'from peer:', peerId);
    toast.info(`Receiving ${message.fileName} from peer`);
  };

  // Handle file chunk
  const handleFileChunk = (message, peerId) => {
    const progress = (message.chunkIndex / message.totalChunks) * 100;
    setTransferProgress(prev => ({
      ...prev,
      [`${peerId}-${message.fileId}`]: progress
    }));
  };

  // Handle file completion
  const handleFileComplete = (message, peerId) => {
    console.log('File transfer complete:', message.fileName);
    toast.success(`File ${message.fileName} received successfully!`);
    setTransferProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[`${peerId}-${message.fileId}`];
      return newProgress;
    });
  };

  // Send file to peer
  const sendFile = useCallback(async (file, peerId) => {
    const dataChannel = dataChannels[peerId];
    if (!dataChannel || dataChannel.readyState !== 'open') {
      toast.error('No connection to peer');
      return;
    }

    const fileId = Date.now().toString();
    const chunkSize = 16384; // 16KB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);

    // Send file info
    dataChannel.send(JSON.stringify({
      type: 'file-info',
      fileId,
      fileName: file.name,
      fileSize: file.size,
      totalChunks
    }));

    // Send file chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      const arrayBuffer = await chunk.arrayBuffer();
      
      // Send chunk info
      dataChannel.send(JSON.stringify({
        type: 'file-chunk',
        fileId,
        chunkIndex: i,
        totalChunks
      }));

      // Send chunk data
      dataChannel.send(arrayBuffer);

      // Update progress
      const progress = ((i + 1) / totalChunks) * 100;
      setTransferProgress(prev => ({
        ...prev,
        [`local-${fileId}`]: progress
      }));

      // Small delay to prevent overwhelming the connection
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    // Send completion signal
    dataChannel.send(JSON.stringify({
      type: 'file-complete',
      fileId,
      fileName: file.name
    }));

    toast.success(`File ${file.name} sent successfully!`);
  }, [dataChannels]);

  // Create offer to connect to peer
  const createOffer = useCallback(async (peerId) => {
    const peerConnection = initializePeerConnection(peerId, true);
    setPeers(prev => ({ ...prev, [peerId]: peerConnection }));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    return offer;
  }, [initializePeerConnection]);

  // Create answer for incoming offer
  const createAnswer = useCallback(async (peerId, offer) => {
    const peerConnection = initializePeerConnection(peerId, false);
    setPeers(prev => ({ ...prev, [peerId]: peerConnection }));

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    return answer;
  }, [initializePeerConnection]);

  // Handle received answer
  const handleAnswer = useCallback(async (peerId, answer) => {
    const peerConnection = peers[peerId];
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
    }
  }, [peers]);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (peerId, candidate) => {
    const peerConnection = peers[peerId];
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate);
    }
  }, [peers]);

  // Disconnect from peer
  const disconnectPeer = useCallback((peerId) => {
    const peerConnection = peers[peerId];
    if (peerConnection) {
      peerConnection.close();
      setPeers(prev => {
        const newPeers = { ...prev };
        delete newPeers[peerId];
        return newPeers;
      });
    }
  }, [peers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(peers).forEach(peer => peer.close());
    };
  }, [peers]);

  return {
    peers,
    isConnected,
    dataChannels,
    transferProgress,
    sendFile,
    createOffer,
    createAnswer,
    handleAnswer,
    handleIceCandidate,
    disconnectPeer
  };
};