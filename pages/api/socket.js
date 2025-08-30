import { Server } from 'socket.io';

const rooms = new Map();

export default function handler(req, res) {
  if (res.socket.server.io) {
    // Socket is already running
  } else {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {

      socket.on('create-room', (password, callback) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        rooms.set(roomId, {
          password,
          users: new Set([socket.id]),
          files: [],
          messages: []
        });
        
        socket.join(roomId);
        socket.roomId = roomId;
        
        io.to(roomId).emit('user-count', rooms.get(roomId).users.size);
        callback(roomId);
      });

      socket.on('join-room', (roomId, password, callback) => {
        const room = rooms.get(roomId);
        if (!room) {
          callback({ success: false, message: 'Room not found' });
          return;
        }
        
        if (room.password !== password) {
          callback({ success: false, message: 'Invalid password' });
          return;
        }

        room.users.add(socket.id);
        socket.join(roomId);
        socket.roomId = roomId;
        
        // Send existing files to the new user
        room.files.forEach(file => {
          socket.emit('file-shared', file);
        });
        
        // Send existing messages to the new user
        room.messages.forEach(message => {
          socket.emit('chat-message', message);
        });
        
        io.to(roomId).emit('user-count', room.users.size);
        callback({ success: true });
      });

      socket.on('share-file', (fileData) => {
        const room = rooms.get(fileData.roomId);
        if (room && room.password === fileData.password) {
          room.files.push(fileData);
          io.to(fileData.roomId).emit('file-shared', fileData);
        }
      });

      socket.on('send-message', (messageData) => {
        const room = rooms.get(messageData.roomId);
        if (room) {
          room.messages.push(messageData);
          io.to(messageData.roomId).emit('chat-message', messageData);
        }
      });

      // WebRTC signaling events
      socket.on('webrtc-ready', (roomId) => {
        socket.to(roomId).emit('user-joined-webrtc', socket.id);
      });

      socket.on('webrtc-offer', ({ target, offer, roomId }) => {
        socket.to(target).emit('webrtc-offer', { from: socket.id, offer });
      });

      socket.on('webrtc-answer', ({ target, answer, roomId }) => {
        socket.to(target).emit('webrtc-answer', { from: socket.id, answer });
      });

      socket.on('webrtc-ice-candidate', ({ target, candidate, roomId }) => {
        socket.to(target).emit('webrtc-ice-candidate', { from: socket.id, candidate });
      });



      // Ping handler for latency measurement
      socket.on('ping', (timestamp, callback) => {
        if (callback) callback(timestamp);
      });

      socket.on('disconnect', () => {
        if (socket.roomId) {
          const room = rooms.get(socket.roomId);
          if (room) {
            room.users.delete(socket.id);
            if (room.users.size === 0) {
              rooms.delete(socket.roomId);
            } else {
              io.to(socket.roomId).emit('user-count', room.users.size);
            }
          }
        }
      });
    });
  }
  res.end();
}