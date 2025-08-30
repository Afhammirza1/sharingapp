import { useState, useEffect } from 'react';
import FileUploader from './FileUploader';
import Chat from './Chat';
import useWebRTCManager from './WebRTCManager';

// Increased chunk size for better performance with large files
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks for better speed

export default function Room({ socket, roomId, password }) {
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [uploadProgress, setUploadProgress] = useState({});
  const [totalDataTransferred, setTotalDataTransferred] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Define callback functions before using them in the hook
  const handleFileReceived = (file) => {
    setFiles(prev => [...prev, file]);
  };

  const handlePeerConnected = (peerId) => {
    console.log('Peer connected:', peerId);
  };

  const webrtcManager = useWebRTCManager({
    socket,
    roomId,
    onFileReceived: handleFileReceived,
    onPeerConnected: handlePeerConnected
  });

  useEffect(() => {
    if (!socket) return;

    socket.on('file-shared', (fileData) => {
      setFiles(prev => [...prev, fileData]);
      setTotalDataTransferred(prev => prev + (fileData.size || 0));
    });

    socket.on('chat-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('user-count', (count) => {
      setConnectedUsers(count);
    });

    socket.on('upload-progress', ({ fileName, progress }) => {
      setUploadProgress(prev => ({
        ...prev,
        [fileName]: progress
      }));
    });

    return () => {
      socket.off('file-shared');
      socket.off('chat-message');
      socket.off('user-count');
      socket.off('upload-progress');
    };
  }, [socket]);

  const downloadFile = (file) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    link.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleFileSelection = (index) => {
    setSelectedFiles(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };



  return (
    <div className="room-container">
      <div className="room-content">

        {/* Connection Status */}
        <div className="connection-status">
          <div className="status-indicator">
            <div className="status-dot status-online"></div>
            <span>Connected • {connectedUsers} users online</span>
          </div>
        </div>

        {/* Stats Dashboard */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3>Online Users</h3>
                <p>{connectedUsers}</p>
              </div>
              <div className="stat-icon" style={{background: 'rgba(16, 185, 129, 0.2)'}}>
                <div className="status-dot status-online"></div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3>Files Shared</h3>
                <p>{files.length}</p>
              </div>
              <div className="stat-icon" style={{background: 'rgba(59, 130, 246, 0.2)'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3>Messages</h3>
                <p>{messages.length}</p>
              </div>
              <div className="stat-icon" style={{background: 'rgba(139, 92, 246, 0.2)'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--secondary-500)" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3>Data Transfer</h3>
                <p>{formatFileSize(totalDataTransferred)}</p>
              </div>
              <div className="stat-icon" style={{background: 'rgba(245, 158, 11, 0.2)'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warning-500)" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main className="room-main">
          {/* Upload Section */}
          <section className="room-section">
            <div className="section-card">
              <div className="section-header">
                <div className="section-icon" style={{background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))'}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                <div className="section-info">
                  <h2>Upload Files & Folders</h2>
                  <p>Share files up to 10GB instantly • Supports folders</p>
                </div>
              </div>
              <FileUploader
                socket={socket}
                roomId={roomId}
                password={password}
                uploadProgress={uploadProgress}
                setUploadProgress={setUploadProgress}
                webrtcManager={webrtcManager}
              />
            </div>

            {/* Files List */}
            <div className="section-card">
              <div className="section-header">
                <div className="section-icon" style={{background: 'linear-gradient(135deg, var(--secondary-500), var(--secondary-600))'}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="section-info">
                  <h2>Shared Files</h2>
                  <p>{files.length} files available • High-speed downloads</p>
                </div>
                <div className="section-actions">
                  {files.length > 0 && (
                    <div className="section-badge">
                      {files.length}
                    </div>
                  )}
                </div>
              </div>

              {files.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  </div>
                  <h3 className="empty-title">No files shared yet</h3>
                  <p className="empty-description">Upload files or folders to share with everyone in this room</p>
                  <div className="empty-status">
                    <div className="status-dot status-online"></div>
                    <span>Waiting for uploads...</span>
                  </div>
                </div>
              ) : (
                <div className="file-list">
                  {files.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        <div className="file-icon">
                          📄
                        </div>
                        <div className="file-details">
                          <h4>{file.name}</h4>
                          <div className="file-meta">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>{file.sender}</span>
                          </div>
                        </div>
                      </div>
                      <div className="file-actions">
                        <button
                          onClick={() => downloadFile(file)}
                          className="btn btn-primary btn-sm"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Chat Section */}
          <aside className="chat-section">
            <div className="section-card">
              <div className="section-header">
                <div className="section-icon" style={{background: 'linear-gradient(135deg, var(--success-500), var(--success-600))'}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="section-info">
                  <h2>Live Chat</h2>
                  <p>Real-time messaging</p>
                </div>
              </div>
              <Chat
                socket={socket}
                roomId={roomId}
                messages={messages}
                setMessages={setMessages}
              />
            </div>
          </aside>
        </main>
      </div>


    </div>
  );
}