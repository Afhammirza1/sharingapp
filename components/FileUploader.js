import { useState, useRef } from 'react';

export default function FileUploader({ socket, roomId, password, uploadProgress, setUploadProgress, webrtcManager }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [useWebRTC, setUseWebRTC] = useState(true);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    if (!socket || files.length === 0) return;

    setUploading(true);

    for (const file of files) {
      await uploadFile(file);
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const fileData = {
          name: file.name,
          size: file.size,
          type: file.type,
          data: reader.result,
          roomId,
          password,
          sender: 'You',
          timestamp: new Date().toISOString(),
          isFolder: false
        };

        socket.emit('share-file', fileData);

        // Simulate upload progress
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.random() * 30;
          if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
            
            setTimeout(() => {
              setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[file.name];
                return newProgress;
              });
            }, 1000);
            
            resolve();
          }
          
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.min(progress, 100)
          }));
        }, 200);
      };
      
      reader.onerror = () => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
        resolve();
      };
      
      reader.readAsDataURL(file);
    });
  };



  return (
    <div className="upload-container">


      {/* Upload Area */}
      <div
        className={`upload-zone ${dragOver ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="upload-input"
          disabled={uploading}
        />
        
        <div className="upload-content">
          <div className="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          
          <div className="upload-text">
            <h3>{dragOver ? 'Drop files & folders here' : 'Upload Files & Folders'}</h3>
            <p>Drag and drop individual files or entire folders, or use the buttons below</p>
            <div className="upload-features">
              <span className="feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Any file type
              </span>
              <span className="feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                Folders supported
              </span>
              <span className="feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Fast transfer
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="upload-progress">
          <div className="progress-header">
            <svg className="progress-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <h4>Uploading Files</h4>
          </div>
          <div className="progress-list">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="progress-item">
                <div className="progress-info">
                  <span className="progress-filename">{fileName}</span>
                  <span className="progress-percentage">{Math.round(progress)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Actions */}
      <div className="upload-actions">
        
        <button
          onClick={() => {
            // Create a new input for individual files
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = '*/*';
            input.onchange = (e) => handleFiles(Array.from(e.target.files));
            input.click();
          }}
          disabled={uploading}
          className="upload-btn primary"
        >
          {uploading ? (
            <>
              <svg className="btn-icon spinning" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span>Choose Files</span>
            </>
          )}
        </button>
        
        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.webkitdirectory = true;
            input.multiple = true;
            input.onchange = (e) => handleFiles(Array.from(e.target.files));
            input.click();
          }}
          disabled={uploading}
          className="upload-btn secondary"
        >
          <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          </svg>
          <span>Choose Folder</span>
        </button>
      </div>
    </div>
  );
}