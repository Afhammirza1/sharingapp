// Health check endpoint for Railway and other deployment platforms
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '2.0.0',
    platform: process.platform,
    nodeVersion: process.version,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100,
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024 * 100) / 100
    },
    cpu: process.cpuUsage(),
    port: process.env.PORT || 3000
  };

  try {
    // Basic service checks
    const checks = {
      server: true,
      memory: healthCheck.memory.used < 400, // Alert if using >400MB
      uptime: healthCheck.uptime > 0
    };

    const allChecksPass = Object.values(checks).every(check => check === true);
    
    if (allChecksPass) {
      res.status(200).json({
        ...healthCheck,
        checks
      });
    } else {
      res.status(503).json({
        ...healthCheck,
        status: 'degraded',
        checks
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: Math.floor(process.uptime())
    });
  }
}