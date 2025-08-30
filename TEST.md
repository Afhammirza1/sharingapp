# 🧪 ShareNear File Upload Test Guide

## Quick Test Steps

### 1. Start the Application
```bash
# Development mode
npm run dev
# OR
./docker-run.sh dev

# Access: http://localhost:3000 (or 3002 if using Docker)
```

### 2. Create/Join a Room
1. Open the application in your browser
2. Enter a password (e.g., "test123")
3. Click "Create New Room"
4. Note the room code generated

### 3. Test Individual File Upload
1. In the upload section, click "Choose Files" button
2. Select one or more individual files (images, documents, etc.)
3. Wait for upload progress to complete
4. Check if files appear in "Shared Files" section below

### 4. Test Folder Upload
1. Click "Choose Folder" button
2. Select a folder with multiple files
3. Wait for upload progress to complete
4. Check if files appear in "Shared Files" section

### 5. Test Drag & Drop
1. Drag individual files from your file manager
2. Drop them on the upload area
3. Verify they upload and appear in shared files

### 6. Test Download
1. Click "Download" button on any shared file
2. Verify the file downloads correctly

## Expected Behavior

### ✅ What Should Work
- [x] Individual file selection and upload
- [x] Multiple file selection
- [x] Folder upload with all contained files
- [x] Drag and drop for files and folders
- [x] Upload progress indication
- [x] Files appearing in shared files list immediately after upload
- [x] File download functionality
- [x] Real-time sharing between multiple users

### 🐛 Common Issues & Solutions

#### Files Not Appearing in Shared List
**Symptoms**: Upload completes but files don't show in "Shared Files"
**Check**: 
- Browser console for errors
- Network tab for failed requests
- Server logs for socket events

**Solution**: 
- Refresh the page
- Check if socket connection is active
- Verify room password matches

#### Upload Progress Stuck
**Symptoms**: Progress bar doesn't complete
**Check**:
- File size (should be under 10GB)
- Network connection
- Browser console for errors

**Solution**:
- Try smaller files first
- Check network stability
- Clear browser cache

#### Can't Select Individual Files
**Symptoms**: File picker only shows folders
**Check**:
- Browser compatibility
- File input configuration

**Solution**:
- Use "Choose Files" button instead of drag-drop
- Try different browser
- Check if webkitdirectory attribute is properly removed

## Debug Information

### Browser Console Logs
Look for these messages:
```
Sharing file: [filename] Size: [size]
File shared received: [filename]
WebRTC connection established with [peer-id]
```

### Network Tab
Check for these requests:
- Socket.IO connection: `ws://localhost:3000/socket.io/`
- File share events: Look for 'share-file' and 'file-shared' events

### Server Logs
If running with Docker:
```bash
docker logs sharenear-dev-1 -f
```

Look for:
```
User connected: [socket-id]
Socket is already running
```

## Multi-User Testing

### Test Real-Time Sharing
1. Open application in two browser windows/tabs
2. Create room in first window
3. Join same room in second window (use same password)
4. Upload file in first window
5. Verify file appears in second window immediately

### Test WebRTC P2P Transfer
1. Have both users in same room
2. Check WebRTC status shows "X peer(s) connected"
3. Upload file and verify faster transfer speed
4. Check console for "WebRTC connection established" messages

## File Type Testing

### Recommended Test Files
- **Images**: .jpg, .png, .gif, .svg
- **Documents**: .pdf, .txt, .docx
- **Archives**: .zip, .rar
- **Code**: .js, .html, .css
- **Large files**: Test with files > 100MB

### Size Testing
- Small files: < 1MB
- Medium files: 1-50MB  
- Large files: 50MB-1GB
- Very large files: 1-10GB (if needed)

## Performance Testing

### Concurrent Uploads
1. Select multiple large files simultaneously
2. Verify all upload with progress tracking
3. Check memory usage doesn't spike excessively

### Multiple Users
1. Have 3-5 users join same room
2. Have all users upload files simultaneously
3. Verify all files appear for all users
4. Check server performance

## Troubleshooting Commands

### Check Application Health
```bash
curl http://localhost:3000/api/health
```

### View Docker Logs
```bash
docker logs sharenear-dev-1 --tail 50 -f
```

### Check Port Usage
```bash
lsof -i :3000
netstat -tulpn | grep :3000
```

### Clear Browser Data
1. Open Developer Tools (F12)
2. Go to Application/Storage tab
3. Clear all site data
4. Refresh page

## Success Criteria

The file upload system is working correctly if:

1. ✅ Individual files can be selected and uploaded
2. ✅ Multiple files can be selected at once
3. ✅ Folders can be uploaded with all contents
4. ✅ Drag and drop works for both files and folders
5. ✅ Upload progress is shown and completes
6. ✅ Files appear in shared files list immediately
7. ✅ Files can be downloaded successfully
8. ✅ Multiple users see shared files in real-time
9. ✅ WebRTC P2P transfer works when peers are connected
10. ✅ No console errors during upload process

## Report Issues

If you find issues, please note:
- Browser and version
- File types and sizes tested
- Error messages from console
- Steps to reproduce
- Expected vs actual behavior

This will help identify and fix any remaining issues with the file upload system.