import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Share2, Users, Eye, Copy, FileText, Zap, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Progress } from './components/ui/progress';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { toast, Toaster } from 'sonner';
import { storage, db } from './lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, getMetadata } from 'firebase/storage';
import { doc, setDoc, getDoc, onSnapshot, collection, addDoc, query, orderBy } from 'firebase/firestore';
import QRCodeGenerator from './components/QRCodeGenerator';


const ShareNear = () => {
  const [currentRoom, setCurrentRoom] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [transferSpeed, setTransferSpeed] = useState(0);
  const [roomFiles, setRoomFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Check URL parameters for room code on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl && roomFromUrl.length === 6) {
      setRoomCode(roomFromUrl);
      joinRoomDirectly(roomFromUrl);
    }
  }, []);

  // Generate 6-digit room code
  const generateRoomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
async function uploadFile(file) {
  const fileRef = ref(storage, `uploads/${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);

  // Generate QR code with Firebase URL
  QRCode.toCanvas(canvasRef.current, url, (error) => {
    if (error) console.error(error);
  });
}
  // Create new room
  const createRoom = async () => {
    const code = generateRoomCode();
    setRoomCode(code);
    setCurrentRoom(code);
    
    try {
      await setDoc(doc(db, 'rooms', code), {
        code,
        createdAt: new Date(),
        createdBy: 'anonymous',
        users: ['anonymous'],
        files: [],
        active: true
      });
      
      toast.success(`Room ${code} created! Share this code with others.`);
    } catch (error) {
      toast.error('Failed to create room');
      console.error(error);
    }
  };

  // Join existing room directly (for URL sharing)
  const joinRoomDirectly = async (code) => {
    try {
      const roomRef = doc(db, 'rooms', code);
      const roomSnap = await getDoc(roomRef);
      
      if (roomSnap.exists()) {
        setCurrentRoom(code);
        setRoomCode(code);
        toast.success(`Joined room ${code} via link!`);
      } else {
        toast.error('Room not found');
      }
    } catch (error) {
      toast.error('Failed to join room');
      console.error(error);
    }
  };

  // Join existing room
  const joinRoom = async () => {
    if (!roomCode || roomCode.length !== 6) {
      toast.error('Please enter a valid 6-digit room code');
      return;
    }

    await joinRoomDirectly(roomCode);
  };

  // Listen for room updates
  useEffect(() => {
    if (!currentRoom) return;

    const roomRef = doc(db, 'rooms', currentRoom);
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setRoomFiles(data.files || []);
        setConnectedUsers(data.users || []);
      }
    });

    return () => unsubscribe();
  }, [currentRoom]);

  // Listen for messages
  useEffect(() => {
    if (!currentRoom) return;

    const messagesRef = collection(db, 'rooms', currentRoom, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [currentRoom]);

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  // Process selected files
  const handleFiles = (fileList) => {
    const newFiles = fileList.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending'
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  // Upload files to Firebase Storage
  const uploadFiles = async () => {
  if (!currentRoom) {
    toast.error('Please join a room first');
    return;
  }

  const pendingFiles = files.filter(f => f.status === 'pending');

  for (const fileObj of pendingFiles) {
    try {
      const storageRef = ref(storage, `rooms/${currentRoom}/${fileObj.id}_${fileObj.name}`);
      const uploadTask = uploadBytesResumable(storageRef, fileObj.file);
      const startTime = Date.now();

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({
            ...prev,
            [fileObj.id]: progress
          }));

          // Estimate transfer speed (bytes/sec)
          const elapsedMs = Date.now() - startTime + 1; // avoid div by zero
          const speed = snapshot.bytesTransferred / (elapsedMs / 1000);
          setTransferSpeed(speed);
        },
        (error) => {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${fileObj.name}`);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const metadata = await getMetadata(uploadTask.snapshot.ref);

            // Update room with new file info
            const roomRef = doc(db, 'rooms', currentRoom);
            const roomSnap = await getDoc(roomRef);
            const roomData = roomSnap.data();

            const fileData = {
              id: fileObj.id,
              name: fileObj.name,
              size: fileObj.size,
              type: fileObj.type,
              url: downloadURL,
              uploadedAt: new Date(),
              uploadedBy: 'anonymous',
              firebaseTimeCreated: metadata?.timeCreated || null
            };

            await setDoc(roomRef, {
              ...roomData,
              files: [...(roomData.files || []), fileData]
            }, { merge: true });

            // Update local state
            setFiles(prev =>
              prev.map(f =>
                f.id === fileObj.id
                  ? { ...f, status: 'completed', url: downloadURL }
                  : f
              )
            );

            toast.success(`${fileObj.name} uploaded successfully!`);
          } catch (finalError) {
            console.error('Finalization error:', finalError);
            toast.error(`Something went wrong with ${fileObj.name}`);
          }
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${fileObj.name}`);
    }
  }
};

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentRoom) return;

    try {
      const messagesRef = collection(db, 'rooms', currentRoom, 'messages');
      await addDoc(messagesRef, {
        text: newMessage,
        sender: 'anonymous',
        timestamp: new Date()
      });
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  // Copy room code
  const copyRoomCode = () => {
    navigator.clipboard.writeText(currentRoom);
    toast.success('Room code copied to clipboard!');
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format speed
  const formatSpeed = (bytesPerMs) => {
    const mbps = (bytesPerMs * 8) / 1000; // Convert to Mbps
    return `${mbps.toFixed(2)} Mbps`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-700/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ShareNear
              </h1>
            </div>
            
            {currentRoom && (
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-sm font-mono">
                  Room: {currentRoom}
                </Badge>
                <Button onClick={copyRoomCode} variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
                <Button onClick={() => setShowQRCode(!showQRCode)} variant="outline" size="sm">
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Code
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {!currentRoom ? (
          /* Room Creation/Join */
          <div className="max-w-md mx-auto">
            <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-800/90 shadow-2xl border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold mb-2">
                  Share Files Instantly
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-300">
                  Create or join a room to start sharing files up to 10GB
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={createRoom} className="w-full h-12 text-lg">
                  <Share2 className="w-5 h-5 mr-2" />
                  Create New Room
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                      or
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit room code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    className="text-center text-lg font-mono h-12"
                    maxLength={6}
                  />
                  <Button onClick={joinRoom} variant="outline" className="w-full h-12">
                    <Users className="w-5 h-5 mr-2" />
                    Join Room
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Main File Sharing Interface */
          <div className="space-y-6">
            {/* QR Code Modal */}
            {showQRCode && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowQRCode(false)}>
                <div onClick={e => e.stopPropagation()}>
                  <QRCodeGenerator roomCode={currentRoom} isVisible={showQRCode} />
                </div>
              </div>
            )}
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-800/90">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Users className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Connected Users</p>
                      <p className="text-2xl font-bold">{connectedUsers.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-800/90">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Files Shared</p>
                      <p className="text-2xl font-bold">{roomFiles.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-800/90">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Transfer Speed</p>
                      <p className="text-2xl font-bold">{formatSpeed(transferSpeed)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="upload" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload">Upload Files</TabsTrigger>
                <TabsTrigger value="download">Download Files</TabsTrigger>
                <TabsTrigger value="chat">Room Chat</TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-800/90">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Files
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* File Drop Zone */}
                    <div
                      ref={dropZoneRef}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                        isDragOver 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">
                        Drop files here or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports files up to 10GB
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="mt-4"
                      >
                        Browse Files
                      </Button>
                    </div>

                    {/* Selected Files */}
                    {files.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-medium">Selected Files:</h3>
                        {files.map(file => (
                          <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                              {uploadProgress[file.id] && (
                                <Progress value={uploadProgress[file.id]} className="mt-2" />
                              )}
                            </div>
                            <Badge variant={file.status === 'completed' ? 'default' : 'secondary'}>
                              {file.status === 'completed' ? 'Uploaded' : 'Pending'}
                            </Badge>
                          </div>
                        ))}
                        <Button onClick={uploadFiles} className="w-full">
                          Upload All Files
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="download">
                <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-800/90">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Download className="w-5 h-5 mr-2" />
                      Available Files
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {roomFiles.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No files available in this room yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {roomFiles.map(file => (
                          <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-gray-500">
                                {formatFileSize(file.size)} • Uploaded by {file.uploadedBy}
                              </p>
                            </div>
                            <Button
                              onClick={() => window.open(file.url, '_blank')}
                              size="sm"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat">
                <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-800/90">
                  <CardHeader>
                    <CardTitle>Room Chat</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                      {messages.length === 0 ? (
                        <p className="text-center text-gray-500">No messages yet. Start the conversation!</p>
                      ) : (
                        <div className="space-y-2">
                          {messages.map(msg => (
                            <div key={msg.id} className="flex items-start space-x-2">
                              <span className="font-medium text-blue-600">{msg.sender}:</span>
                              <span>{msg.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button onClick={sendMessage}>Send</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareNear;