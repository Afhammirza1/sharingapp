# Railway Deployment Guide

This guide will help you deploy Sharenear to Railway.app quickly and easily.

## 🚀 Quick Deploy

### Option 1: Deploy from GitHub (Recommended)

1. **Fork this repository** to your GitHub account

2. **Connect to Railway**:
   - Go to [Railway.app](https://railway.app)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your forked repository

3. **Configure Environment** (Optional):
   - Railway will automatically detect the Next.js app
   - No environment variables are required for basic functionality
   - The app will be available at your Railway-provided URL

### Option 2: Deploy with Railway CLI

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Deploy from your local repository**:
   ```bash
   railway link
   railway up
   ```

## ⚙️ Configuration

### Environment Variables (Optional)

You can set these in Railway's dashboard under Variables:

```env
NODE_ENV=production
PORT=3000
MAX_FILE_SIZE=10737418240
ROOM_CLEANUP_INTERVAL=3600000
```

### Custom Domain (Optional)

1. Go to your Railway project dashboard
2. Click on "Settings" 
3. Scroll to "Domains"
4. Add your custom domain
5. Update your DNS records as instructed

## 🔧 Railway Configuration Files

The following files are included for optimal Railway deployment:

- **`railway.json`**: Railway-specific configuration
- **`nixpacks.toml`**: Build configuration for Nixpacks
- **`next.config.js`**: Next.js production optimizations
- **`.env.example`**: Example environment variables

## 📊 Monitoring & Health Checks

### Health Check Endpoint

The app includes a health check endpoint at `/api/health` that Railway uses to monitor your deployment:

```
GET https://your-app.railway.app/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-19T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "2.0.0",
  "memory": {
    "used": 45.67,
    "total": 128.00,
    "external": 12.34
  }
}
```

### Logs

View your application logs in Railway:
1. Go to your project dashboard
2. Click on your service
3. Navigate to "Logs" tab

## 🚨 Troubleshooting

### Common Issues

**Build Failures**:
- Ensure all dependencies are in `package.json`
- Check build logs in Railway dashboard
- Verify Node.js version compatibility

**Memory Issues**:
- Railway provides 512MB RAM by default
- Upgrade to a paid plan for more resources if needed
- Monitor memory usage in the health endpoint

**Socket.io Connection Issues**:
- Railway automatically handles WebSocket connections
- Ensure your client connects to the correct Railway URL
- Check browser console for connection errors

**File Upload Issues**:
- Railway has request size limits
- Large files may timeout - consider chunked uploads
- Monitor upload progress in browser dev tools

### Performance Optimization

**For High Traffic**:
1. **Upgrade Railway Plan**: Get more CPU and memory
2. **Enable Caching**: Use Railway's Redis addon for session storage
3. **CDN**: Use Railway's built-in CDN for static assets
4. **Database**: Add PostgreSQL for persistent room storage

**For Large Files**:
1. **Increase Timeout**: Configure in `railway.json`
2. **Chunked Uploads**: Implement progressive upload
3. **External Storage**: Use S3 or similar for large files

## 🔒 Security Considerations

### Production Security

The app includes several security headers and configurations:

- **HTTPS**: Automatically enabled on Railway
- **Security Headers**: Configured in `next.config.js`
- **CORS**: Properly configured for cross-origin requests
- **Input Validation**: File size and type validation
- **Rate Limiting**: Consider adding for production use

### Recommended Additions

For production deployments, consider adding:

1. **Rate Limiting**: Prevent abuse of file uploads
2. **Authentication**: Optional user accounts
3. **Logging**: Structured logging with external service
4. **Monitoring**: Application performance monitoring
5. **Backup**: Regular data backups if using persistent storage

## 📈 Scaling

### Horizontal Scaling

Railway supports horizontal scaling:

1. Go to project settings
2. Increase replica count
3. Configure load balancing

### Vertical Scaling

Upgrade your Railway plan for:
- More CPU cores
- Additional RAM
- Higher bandwidth
- Priority support

## 💰 Cost Optimization

### Free Tier Limits

Railway's free tier includes:
- 512MB RAM
- 1 vCPU
- 100GB bandwidth/month
- $5 credit/month

### Cost Management

1. **Monitor Usage**: Check Railway dashboard regularly
2. **Optimize Bundle**: Reduce JavaScript bundle size
3. **Efficient Code**: Optimize memory usage and CPU
4. **Sleep Mode**: Railway automatically sleeps inactive apps

## 🆘 Support

### Getting Help

1. **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
2. **Railway Discord**: Join the community
3. **GitHub Issues**: Report bugs in this repository
4. **Railway Support**: For platform-specific issues

### Useful Links

- [Railway Dashboard](https://railway.app/dashboard)
- [Railway CLI Documentation](https://docs.railway.app/develop/cli)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Socket.io Documentation](https://socket.io/docs/v4/)

---

## 🎉 Success!

Once deployed, your Sharenear instance will be available at:
```
https://your-project-name.railway.app
```

Share this URL with others to start sharing files instantly!

### Next Steps

1. **Test the deployment** with file uploads and chat
2. **Share the URL** with your team or friends  
3. **Monitor performance** in Railway dashboard
4. **Consider custom domain** for professional use
5. **Set up monitoring** for production workloads

Happy file sharing! 🚀