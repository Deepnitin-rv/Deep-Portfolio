import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const PYTHON_PORT = Number(process.env.PYTHON_PORT) || 8765;
const PYTHON_URL = `http://127.0.0.1:${PYTHON_PORT}`;

let pythonProc: ChildProcess | null = null;
let isShuttingDown = false;

function startPythonBackend(): void {
  if (isShuttingDown) return;

  const scriptPath = path.join(__dirname, 'python', 'app.py');
  const child = spawn('python3', [scriptPath, '--host', '127.0.0.1', '--port', String(PYTHON_PORT)], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk: Buffer) => {
    process.stdout.write(`[python] ${chunk.toString()}`);
  });

  child.stderr.on('data', (chunk: Buffer) => {
    process.stderr.write(chunk.toString());
  });

  child.on('exit', (code) => {
    if (!isShuttingDown) {
      console.error(`Python backend exited with code ${code}; restarting in 500ms...`);
      setTimeout(startPythonBackend, 500);
    }
  });

  pythonProc = child;
}

async function waitForPythonReady(timeoutMs = 6000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${PYTHON_URL}/api/health`);
      if (res.ok) return;
    } catch {
      // Wait for Python HTTP server to bind
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function proxyToPython(req: Request, res: Response): Promise<void> {
  const targetUrl = `${PYTHON_URL}${req.originalUrl}`;
  const headers: Record<string, string> = {};
  if (req.headers['content-type']) {
    headers['content-type'] = String(req.headers['content-type']);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = JSON.stringify(req.body ?? {});
    headers['content-type'] = 'application/json';
  }

  try {
    const upstream = await fetch(targetUrl, init);
    res.status(upstream.status);

    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);

    const contentDisposition = upstream.headers.get('content-disposition');
    if (contentDisposition) res.setHeader('Content-Disposition', contentDisposition);

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (err) {
    console.error('Error proxying to Python backend:', err);
    res.status(502).json({ error: 'Python backend unavailable' });
  }
}

async function bootstrap(): Promise<void> {
  startPythonBackend();
  await waitForPythonReady();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', (req, res) => {
    void proxyToPython(req, res);
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Portfolio server running at http://0.0.0.0:${PORT} (Python engine on :${PYTHON_PORT})`);
  });

  const shutdown = () => {
    isShuttingDown = true;
    if (pythonProc && !pythonProc.killed) {
      pythonProc.kill('SIGTERM');
    }
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

void bootstrap();
