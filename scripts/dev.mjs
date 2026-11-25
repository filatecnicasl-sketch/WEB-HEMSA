import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const python = process.env.HEMSA_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const backend = spawn(python, [path.join(root, 'local-server', 'server.py')], {
  cwd: root,
  stdio: ['ignore', 'inherit', 'inherit'],
});
const vite = spawn(process.execPath, [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), ...process.argv.slice(2)], {
  cwd: root,
  stdio: ['inherit', 'inherit', 'inherit'],
});

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  if (backend.exitCode === null && !backend.killed) backend.kill();
  if (vite.exitCode === null && !vite.killed) vite.kill();
  setTimeout(() => process.exit(code), 150).unref();
}

backend.on('error', (error) => {
  console.error(`No se pudo iniciar Python: ${error.message}`);
  stop(1);
});
backend.on('exit', (code) => {
  if (!stopping) {
    console.error('El servidor local de contenidos se ha detenido.');
    stop(code || 1);
  }
});
vite.on('error', (error) => {
  console.error(`No se pudo iniciar Vite: ${error.message}`);
  stop(1);
});
vite.on('exit', (code) => stop(code || 0));
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
