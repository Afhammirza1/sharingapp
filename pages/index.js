import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Room from '../components/Room';
import ThemeToggle from '../components/ThemeToggle';
import QRCode from 'qrcode.react';
import Head from 'next/head';

let socket;

export default function Home() {
  const [room, setRoom] = useState('');
  const [password, setPassword] = useState('');
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize socket connection on component mount
    const socketInitializer = async () => {
      await fetch('/api/socket'); // This initializes the socket server
      socket = io();
    };
    socketInitializer();

    // Handle URL params for joining a room
    const queryParams = new URLSearchParams(window.location.search);
    const roomFromUrl = queryParams.get('room');
    if (roomFromUrl) {
      setRoom(roomFromUrl);
    }
  }, []);

  const createRoom = () => {
    setError('');
    if (!password) {
      setError('Password is required to create a secure room.');
      return;
    }
    socket.emit('create-room', password, (roomId) => {
      setRoom(roomId);
      setJoinedRoom(true);
      window.history.pushState(null, '', `?room=${roomId}`);
    });
  };

  const joinRoom = () => {
    setError('');
    if (!room || !password) {
      setError('Room code and password are required.');
      return;
    }
    socket.emit('join-room', room, password, (response) => {
      if (response.success) {
        setJoinedRoom(true);
      } else {
        setError(response.message);
      }
    });
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <Head>
        <title>Sharenear - Real-Time File Sharing</title>
        <meta name="description" content="Secure, real-time file sharing made simple" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen transition-all duration-500">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <a href="/" className="logo">
              <div className="logo-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <span className="logo-text">Sharenear</span>
            </a>
            <ThemeToggle isDark={isDark} setIsDark={setIsDark} />
          </div>
        </header>

        <main className="container">
          {!joinedRoom ? (
            <div className="hero">
              {/* Hero Section */}
              <div className="animate-fade-in">
                <h2 className="hero-title">
                  Share Files Instantly
                </h2>
                <p className="hero-subtitle">
                  Secure, real-time file sharing with end-to-end encryption. No registration required.
                </p>
              </div>

              {/* Login Card */}
              <div className="login-card">
                <div className="login-header">
                  <div className="login-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="login-title">Join or Create Room</h3>
                  <p className="login-description">Enter your room details to get started</p>
                </div>

                <form className="space-y-6">
                  <div className="form-group">
                    <div className="input-group">
                      <input
                        type="text"
                        placeholder="Room Code"
                        value={room}
                        onChange={(e) => setRoom(e.target.value.toUpperCase())}
                        className="form-input"
                      />
                      <div className="input-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="input-group">
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-input"
                      />
                      <div className="input-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="form-error-message">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      {error}
                    </div>
                  )}

                  <div className="space-y-3">
                    <button 
                      type="button"
                      onClick={joinRoom} 
                      className="btn btn-primary btn-lg w-full"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Join Room
                    </button>
                    <button 
                      type="button"
                      onClick={createRoom} 
                      className="btn btn-secondary btn-lg w-full"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create New Room
                    </button>
                  </div>
                </form>
              </div>

              {/* Features */}
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon" style={{background: 'linear-gradient(135deg, #3b82f6, #06b6d4)'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="feature-title">Lightning Fast</h3>
                  <p className="feature-description">Real-time file transfers with optimized chunking and WebRTC technology</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon" style={{background: 'linear-gradient(135deg, #10b981, #059669)'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="feature-title">Secure</h3>
                  <p className="feature-description">End-to-end encryption with password protection and secure room codes</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon" style={{background: 'linear-gradient(135deg, #8b5cf6, #ec4899)'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="feature-title">Cross-Platform</h3>
                  <p className="feature-description">Works seamlessly on any device with a modern web browser</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              {/* Room Header */}
              <div className="room-header">
                <h2 className="room-title">
                  Room: <span className="room-code">{room}</span>
                </h2>
                <p className="room-description">Share this code or QR code with others to join</p>
                <div className="qr-container">
                  <QRCode 
                    value={`${window.location.origin}?room=${room}`} 
                    size={150}
                    bgColor="#ffffff"
                    fgColor="#1e40af"
                    level="M"
                  />
                </div>
              </div>
              <Room socket={socket} roomId={room} password={password} />
            </div>
          )}
        </main>

        {/* Background decoration */}
        <div className="bg-decoration">
          <div className="bg-blob"></div>
          <div className="bg-blob"></div>
        </div>
      </div>
    </div>
  );
}