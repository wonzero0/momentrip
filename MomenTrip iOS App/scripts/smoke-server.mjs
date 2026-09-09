import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'momentrip-smoke-'));
const port = await availablePort();
const baseUrl = `http://127.0.0.1:${port}`;
let serverOutput = '';

const apiProcess = spawn(process.execPath, ['server/index.mjs'], {
  cwd: projectRoot,
  env: {
    ...process.env,
    PORT: String(port),
    MOMENTRIP_DATA_DIR: path.join(temporaryRoot, 'data'),
    MOMENTRIP_UPLOAD_DIR: path.join(temporaryRoot, 'uploads'),
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

apiProcess.stdout.on('data', (chunk) => { serverOutput += chunk; });
apiProcess.stderr.on('data', (chunk) => { serverOutput += chunk; });

async function availablePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolve);
  });
  const address = probe.address();
  assert(address && typeof address === 'object');
  await new Promise((resolve) => probe.close(resolve));
  return address.port;
}

async function request(pathname, { method = 'GET', token, body, status = 200 } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  assert.equal(response.status, status, `${method} ${pathname}: ${JSON.stringify(payload)}`);
  return { payload, response };
}

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (apiProcess.exitCode !== null) throw new Error(`API 서버가 조기 종료되었습니다.\n${serverOutput}`);
    try {
      await request('/health');
      return;
    } catch {
      await delay(100);
    }
  }
  throw new Error(`API 서버 시작 시간이 초과되었습니다.\n${serverOutput}`);
}

try {
  await waitForServer();

  const username = `smoke_${Date.now()}`;
  const friendUsername = `${username}_friend`;
  const password = 'travel123';
  const newPassword = 'journey456';

  const available = await request(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
  assert.equal(available.payload.available, true);

  const signup = await request('/api/auth/signup', {
    method: 'POST',
    status: 201,
    body: { username, password, displayName: '스모크 여행자' },
  });
  const ownerToken = signup.payload.token;
  assert(ownerToken);

  const unavailable = await request(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
  assert.equal(unavailable.payload.available, false);

  const friendSignup = await request('/api/auth/signup', {
    method: 'POST',
    status: 201,
    body: { username: friendUsername, password, displayName: '동행자' },
  });
  const friendToken = friendSignup.payload.token;

  const me = await request('/api/me', { token: ownerToken });
  assert.equal(me.payload.user.username, username);

  const friends = await request(`/api/friends?query=${encodeURIComponent(friendUsername)}`, { token: ownerToken });
  assert.equal(friends.payload.friends.length, 1);

  const roomResult = await request('/api/rooms', {
    method: 'POST',
    status: 201,
    token: ownerToken,
    body: { name: 'API 스모크 여행', memberIds: [], planText: '공주 당일 여행' },
  });
  const room = roomResult.payload.room;
  assert(room.id && room.inviteCode);

  const joined = await request('/api/rooms/join', {
    method: 'POST',
    token: friendToken,
    body: { inviteCode: room.inviteCode },
  });
  assert.equal(joined.payload.room.members.length, 2);

  const roomDetail = await request(`/api/rooms/${encodeURIComponent(room.id)}`, { token: ownerToken });
  assert.equal(roomDetail.payload.room.members.length, 2);

  const profile = await request('/api/me/profile', {
    method: 'PUT',
    token: ownerToken,
    body: { displayName: '수정된 여행자', code: '4321' },
  });
  assert.equal(profile.payload.user.code, '#4321');

  const missions = await request(`/api/missions?roomId=${encodeURIComponent(room.id)}`, { token: ownerToken });
  assert.equal(missions.payload.missions.length, 6);

  const photoResult = await request('/api/photos', {
    method: 'POST',
    status: 201,
    token: ownerToken,
    body: {
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      label: '스모크 사진',
      date: '2026-09-08',
      source: `mission:${room.id}:1`,
      roomId: room.id,
    },
  });
  const photo = photoResult.payload.photo;

  const completed = await request('/api/missions/1/complete', {
    method: 'POST',
    token: ownerToken,
    body: { photoId: photo.id, earnedPoints: 300, roomId: room.id, title: '현지 음식 먹기' },
  });
  assert.equal(completed.payload.missions.find((item) => item.id === 1).completed, true);
  const transactionCount = completed.payload.rewards.transactions.length;

  const completedAgain = await request('/api/missions/1/complete', {
    method: 'POST',
    token: ownerToken,
    body: { photoId: photo.id, earnedPoints: 300, roomId: room.id },
  });
  assert.equal(completedAgain.payload.rewards.transactions.length, transactionCount);

  const photos = await request('/api/photos?month=2026-09', { token: ownerToken });
  assert.equal(photos.payload.photos.length, 1);

  const rewards = await request('/api/rewards', { token: ownerToken });
  assert.equal(rewards.payload.balances.points, 1300);

  const converted = await request('/api/rewards/convert', {
    method: 'POST',
    status: 201,
    token: ownerToken,
    body: { amount: 200, regionName: '공주시', currency: '공주페이' },
  });
  assert.equal(converted.payload.rewards.balances.points, 1100);

  const diaryResult = await request('/api/diaries', {
    method: 'POST',
    status: 201,
    token: ownerToken,
    body: { date: '2026-09-08', title: '오늘의 여행', text: '즐거운 하루', photoIds: [photo.id] },
  });
  const diary = diaryResult.payload.diary;

  const updatedDiary = await request(`/api/diaries/${encodeURIComponent(diary.id)}`, {
    method: 'PUT',
    token: ownerToken,
    body: { title: '수정된 여행', text: '아주 즐거운 하루' },
  });
  assert.equal(updatedDiary.payload.diary.title, '수정된 여행');

  const diaries = await request('/api/diaries?date=2026-09-08', { token: ownerToken });
  assert.equal(diaries.payload.diaries.length, 1);

  await request('/api/fourcuts', {
    method: 'POST',
    status: 400,
    token: ownerToken,
    body: { photoIds: [photo.id], filter: '감성' },
  });
  const fourCutPhotoIds = [photo.id];
  for (let index = 0; index < 3; index += 1) {
    const extraPhoto = await request('/api/photos', {
      method: 'POST',
      status: 201,
      token: ownerToken,
      body: { dataUrl: photo.dataUrl, label: `네컷 사진 ${index + 2}`, date: '2026-09-08' },
    });
    fourCutPhotoIds.push(extraPhoto.payload.photo.id);
  }
  await request('/api/fourcuts', {
    method: 'POST',
    status: 201,
    token: ownerToken,
    body: { photoIds: fourCutPhotoIds, filter: '감성' },
  });
  const fourCuts = await request('/api/fourcuts', { token: ownerToken });
  assert.equal(fourCuts.payload.fourCuts.length, 1);

  await request('/api/share', {
    method: 'POST',
    status: 201,
    token: ownerToken,
    body: { kind: 'diary', targetId: diary.id, channel: 'system' },
  });

  await request('/api/inquiries', {
    method: 'POST',
    status: 201,
    token: ownerToken,
    body: { category: '이용 문의', message: '스모크 테스트 문의' },
  });
  const inquiries = await request('/api/inquiries', { token: ownerToken });
  assert.equal(inquiries.payload.inquiries.length, 1);

  await request('/api/me/password', {
    method: 'PUT',
    token: ownerToken,
    body: { currentPassword: password, newPassword },
  });
  await request('/api/auth/logout', { method: 'POST', token: ownerToken });
  await request('/api/me', { token: ownerToken, status: 401 });
  await request('/api/auth/login', {
    method: 'POST',
    status: 401,
    body: { username, password },
  });
  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { username, password: newPassword },
  });
  assert(login.payload.token);

  const preflight = await request('/api/rooms', { method: 'OPTIONS' });
  assert.equal(preflight.response.headers.get('access-control-allow-origin'), '*');
  await request('/api/rooms', { status: 401 });

  console.log('MomenTrip API smoke test passed.');
} catch (error) {
  console.error(error);
  if (serverOutput) console.error(serverOutput);
  process.exitCode = 1;
} finally {
  apiProcess.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => apiProcess.once('exit', resolve)),
    delay(2000),
  ]);
  await rm(temporaryRoot, { recursive: true, force: true });
}
