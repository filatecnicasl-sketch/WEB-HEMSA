import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    const finish = (result) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(800);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

function localBackendPlugin() {
  let backend = null;
  let stopping = false;

  const stop = () => {
    stopping = true;
    if (backend && backend.exitCode === null && !backend.killed) backend.kill();
  };

  return {
    name: 'hemsa-local-backend',
    configureServer(server) {
      return async () => {
        if (await portInUse(5174)) return;
        const python = process.env.HEMSA_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
        backend = spawn(python, [path.join(server.config.root, 'local-server', 'server.py')], {
          cwd: server.config.root,
          stdio: ['ignore', 'ignore', 'pipe'],
        });
        backend.stderr.on('data', (data) => server.config.logger.error(`[HEMSA local] ${String(data).trim()}`));
        backend.on('error', (error) => server.config.logger.error(`No se pudo iniciar el servidor local: ${error.message}`));
        backend.on('exit', (code) => {
          if (!stopping && code !== 0) server.config.logger.error('El servidor local se ha detenido.');
        });
        server.httpServer?.once('close', stop);
        process.once('exit', stop);
      };
    },
  };
}

export default defineConfig({
  plugins: [react(), localBackendPlugin()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5174',
        changeOrigin: false,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
