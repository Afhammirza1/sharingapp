# Sharenear - Enhanced Real-Time File Sharing

A secure, real-time file sharing application with WebRTC support, built with Next.js and Socket.io.

## 🚀 Features

### Core Features
- **Real-time file sharing** with Socket.io
- **WebRTC peer-to-peer transfers** for faster speeds
- **Password-protected rooms** with secure room codes
- **Live chat** with real-time messaging

- **Drag & drop file uploads** with folder support
- **Cross-platform compatibility** - works on any modern browser

### Enhanced Features
- **File preview system** - Preview images, videos, audio, PDFs, and text files
- **Bulk file operations** - Select and download multiple files as ZIP
- **Connection status monitoring** - Real-time connection health and latency
- **Smart notifications** - Toast notifications for file sharing events
- **Image compression** - Automatic compression for large images
- **File validation** - Size and type validation with user feedback
- **Responsive design** - Optimized for desktop and mobile devices

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18
- **Backend**: Node.js, Socket.io
- **Real-time Communication**: WebRTC, Socket.io
- **Styling**: CSS3 with custom properties, Tailwind CSS
- **File Handling**: JSZip for bulk downloads
- **Deployment**: Docker, Kubernetes ready

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sharenear
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Railway Deployment (Recommended)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/sharenear)

1. **One-click deploy**: Click the Railway button above
2. **Fork and deploy**: Fork this repo and connect to Railway
3. **CLI deploy**: Use Railway CLI for custom deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Railway deployment guide.

### Docker Deployment

1. **Build production image**
   ```bash
   npm run docker:build
   ```

2. **Run container**
   ```bash
   npm run docker:run
   ```

### Manual Production Deployment

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Environment Variables

Create `.env.production` for production settings:

```env
NODE_ENV=production
PORT=3000
# Add other production-specific variables
```

### File Size Limits

Default maximum file size is 10GB. Modify in `utils/fileUtils.js`:

```javascript
export const validateFile = (file, maxSize = 10 * 1024 * 1024 * 1024) => {
  // Adjust maxSize as needed
}
```

## 🎯 Usage

### Creating a Room
1. Enter a secure password
2. Click "Create New Room"
3. Share the room code and password with others

### Joining a Room
1. Enter the room code and password
2. Click "Join Room"
3. Start sharing files and chatting

### File Sharing
- **Drag & Drop**: Drag files or folders directly onto the upload area
- **Browse Files**: Click "Choose Files" to select individual files
- **Browse Folders**: Click "Choose Folder" to upload entire directories
- **Preview**: Click on supported files to preview them
- **Bulk Download**: Select multiple files and download as ZIP



## 🏗️ Architecture

### Component Structure
```
components/
├── Chat.js              # Real-time messaging
├── FileUploader.js      # File upload with validation
├── Room.js              # Main room interface

├── WebRTCManager.js     # P2P connection management
├── ThemeToggle.js       # Dark/light mode toggle
├── ConnectionStatus.js  # Connection monitoring
├── FilePreview.js       # File preview modal
└── NotificationSystem.js # Toast notifications
```

### Utility Modules
```
utils/
├── fileUtils.js         # File handling utilities
└── encryption.js        # Basic encryption helpers
```

### API Endpoints
```
pages/api/
├── socket.js           # Socket.io server
└── health.js           # Health check endpoint
```

## 🔒 Security Features

- **Password-protected rooms** with server-side validation
- **Secure room code generation** with cryptographically random IDs
- **File validation** to prevent malicious uploads
- **Basic client-side encryption** for sensitive data
- **CORS protection** and secure headers
- **Input sanitization** for all user inputs

## 🚀 Performance Optimizations

- **WebRTC P2P transfers** for faster file sharing
- **Image compression** for large files
- **Chunked file uploads** for better reliability
- **Connection pooling** and efficient socket management
- **Lazy loading** for file previews
- **Optimized bundle size** with Next.js

## 📱 Mobile Support

- **Responsive design** that works on all screen sizes
- **Touch-friendly interface** with proper touch targets
- **Mobile file picker** integration
- **Optimized performance** for mobile devices

## 🔧 Development

### Project Structure
```
sharenear/
├── components/          # React components
├── pages/              # Next.js pages and API routes
├── styles/             # CSS stylesheets
├── utils/              # Utility functions
├── public/             # Static assets
├── k8s/                # Kubernetes manifests
├── terraform/          # Infrastructure as code
└── docker files        # Container configuration
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container

### Adding New Features

1. **Create component** in `components/` directory
2. **Add utilities** in `utils/` if needed
3. **Update styles** in `styles/components.css`
4. **Add tests** (when test framework is added)
5. **Update documentation**

## 🐛 Troubleshooting

### Common Issues

**Files not uploading**
- Check file size limits (default 10GB)
- Verify socket connection status
- Check browser console for errors

**WebRTC not working**
- Ensure HTTPS in production
- Check firewall settings
- Verify STUN/TURN server configuration



### Debug Mode

Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'sharenear:*');
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the documentation

## 🎉 Acknowledgments

- Socket.io for real-time communication
- WebRTC for peer-to-peer connections
- Next.js for the excellent React framework
- All contributors and users of this project