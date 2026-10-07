import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const HOST = '0.0.0.0';
const preferredPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Health check endpoint for container probes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Serve static assets from Vite production build
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath, { maxAge: '1h' }));

// SPA fallback: return index.html for all non-static GET routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

function startServer(port) {
  const server = app.listen(port, HOST, () => {
    console.log(`Server listening on http://${HOST}:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port !== 3000) {
      console.warn(`Port ${port} already in use, trying fallback port 3000...`);
      startServer(3000);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, closing server...');
    server.close(() => process.exit(0));
  });
}

startServer(preferredPort);
