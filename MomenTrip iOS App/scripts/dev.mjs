import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const apiPort = process.env.PORT || '4174';
const webPort = process.env.MOMENTRIP_WEB_PORT || '5173';
const viteExecutable = path.join(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'vite.cmd' : 'vite',
);

const children = [];

async function responseBody(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
    return response.ok ? await response.text() : '';
  } catch {
    return '';
  }
}

const apiBody = await responseBody(`http://127.0.0.1:${apiPort}/health`);
const webBody = await responseBody(`http://127.0.0.1:${webPort}/`);

if (apiBody.includes('momentrip-api')) {
  console.log(`MomenTrip API가 이미 ${apiPort} 포트에서 실행 중입니다.`);
} else {
  children.push(spawn(process.execPath, ['server/index.mjs'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: apiPort },
    stdio: 'inherit',
  }));
}

if (webBody.includes('<title>MomenTrip</title>')) {
  console.log(`MomenTrip 웹 앱이 이미 ${webPort} 포트에서 실행 중입니다.`);
} else {
  children.push(spawn(viteExecutable, ['--host', '0.0.0.0', '--port', webPort, '--strictPort'], {
    cwd: projectRoot,
    stdio: 'inherit',
  }));
}

if (children.length === 0) {
  console.log(`브라우저에서 http://localhost:${webPort} 을 열어주세요.`);
}

let shuttingDown = false;

function stop(signal = 'SIGTERM') {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => stop(signal));
}

for (const child of children) {
  child.on('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
    stop();
  });

  child.on('exit', (code, signal) => {
    if (!shuttingDown && code !== null) process.exitCode = code;
    if (!shuttingDown && signal) process.exitCode = 1;
    stop();
  });
}
