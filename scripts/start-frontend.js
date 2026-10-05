import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { createServer } = require('http-server');
const port = Number(process.env.FRONTEND_PORT || 5501);
const server = createServer({ root: resolve('frontend'), cache: -1 });

server.server.once('error', async (error) => {
  if (error.code !== 'EADDRINUSE') {
    console.error(`Could not start the frontend: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  try {
    const response = await fetch(`http://localhost:${port}/`);
    const page = await response.text();
    if (response.ok && page.includes('LyricSlide')) {
      console.log(`LyricSlide frontend is already running at http://localhost:${port}`);
      return;
    }
  } catch { /* The port is occupied by a service that is not responding as LyricSlide. */ }

  console.error(`Port ${port} is already in use by another service. Stop it or set FRONTEND_PORT to a free port.`);
  process.exitCode = 1;
});

server.listen(port, '0.0.0.0', () => {
  console.log(`LyricSlide frontend listening on http://localhost:${port}`);
});
