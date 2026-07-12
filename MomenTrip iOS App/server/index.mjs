import http from 'node:http';
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4174);
const DATA_DIR = process.env.MOMENTRIP_DATA_DIR
  ? path.resolve(process.env.MOMENTRIP_DATA_DIR)
  : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOAD_DIR = process.env.MOMENTRIP_UPLOAD_DIR
  ? path.resolve(process.env.MOMENTRIP_UPLOAD_DIR)
  : path.join(__dirname, 'uploads');
const MAX_BODY_BYTES = 16 * 1024 * 1024;

const FRIENDS = [];

const MISSIONS = [
  { id: 1, icon: '🍜', title: '현지 음식 먹기', desc: '여행지의 대표 음식을 맛보세요' },
  { id: 2, icon: '🌆', title: '야경 사진 찍기', desc: '아름다운 밤 풍경을 담아요' },
  { id: 3, icon: '🥟', title: '길거리 음식 시도', desc: '현지 로컬 길거리 음식 도전' },
  { id: 4, icon: '💬', title: '낯선 사람과 대화', desc: '현지인과 친해져 보세요' },
  { id: 5, icon: '☕', title: '현지 카페 방문', desc: '숨겨진 로컬 카페 발견하기' },
  { id: 6, icon: '🤳', title: '랜드마크 셀카', desc: '여행지 대표 명소 인증샷' },
];

const emptyDb = () => ({
  users: [],
  sessions: [],
  rooms: [],
  photos: [],
  missionCompletions: [],
  diaries: [],
  rewardTransactions: [],
  fourCuts: [],
  shares: [],
});

const now = () => new Date().toISOString();
const makeId = (prefix) => `${prefix}_${crypto.randomUUID()}`;
const makeToken = () => crypto.randomBytes(32).toString('hex');
const makeInviteCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();
const makeUserCode = () => `#${crypto.randomInt(1000, 9999)}`;

async function ensureDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(emptyDb(), null, 2));
  }
}

async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(DB_FILE, 'utf8');
  return { ...emptyDb(), ...JSON.parse(raw) };
}

async function writeDb(db) {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

async function withDb(mutator) {
  const db = await readDb();
  const result = await mutator(db);
  await writeDb(db);
  return result;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, user) {
  const { hash } = hashPassword(password, user.passwordSalt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.passwordHash, 'hex'));
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    code: user.code,
    createdAt: user.createdAt,
  };
}

function rewardSummary(transactions) {
  const balances = transactions.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    },
    { localMoney: 0, points: 0 },
  );

  return { balances, transactions: transactions.toReversed?.() ?? [...transactions].reverse() };
}

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(body);
}

function sendError(res, status, message) {
  send(res, status, { error: message });
}

async function readJson(req) {
  const chunks = await readBodyChunks(req);
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function readBodyChunks(req) {
  let size = 0;
  const chunks = [];

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new Error('요청 데이터가 너무 큽니다.');
    }
    chunks.push(chunk);
  }

  return chunks;
}

async function readBodyBuffer(req) {
  return Buffer.concat(await readBodyChunks(req));
}

function authToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function getUserFromRequest(req, db) {
  const token = authToken(req);
  if (!token) return null;
  const session = db.sessions.find((item) => item.token === token);
  if (!session) return null;
  return db.users.find((user) => user.id === session.userId) || null;
}

function requireUser(req, res, db) {
  const user = getUserFromRequest(req, db);
  if (!user) {
    sendError(res, 401, '로그인이 필요합니다.');
    return null;
  }
  return user;
}

function validateImageDataUrl(dataUrl) {
  return typeof dataUrl === 'string' && /^data:image\/(jpeg|jpg|png|webp);base64,/.test(dataUrl);
}

function mimeExtension(mimeType, fallbackName = '') {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'jpg';
  const match = fallbackName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || 'jpg';
}

function parseMultipartForm(contentType, bodyBuffer) {
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[1] || contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[2];
  if (!boundary) {
    throw new Error('multipart boundary를 찾을 수 없습니다.');
  }

  const fields = {};
  const files = [];
  const delimiter = `--${boundary}`;
  const raw = bodyBuffer.toString('latin1');
  const parts = raw.split(delimiter).slice(1, -1);

  for (const partRaw of parts) {
    let part = partRaw;
    if (part.startsWith('\r\n')) part = part.slice(2);
    if (part.endsWith('\r\n')) part = part.slice(0, -2);

    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;

    const headerText = part.slice(0, headerEnd);
    let content = part.slice(headerEnd + 4);
    if (content.endsWith('\r\n')) content = content.slice(0, -2);

    const headers = Object.fromEntries(
      headerText.split('\r\n').map((line) => {
        const index = line.indexOf(':');
        return [line.slice(0, index).toLowerCase(), line.slice(index + 1).trim()];
      }),
    );
    const disposition = headers['content-disposition'] || '';
    const name = disposition.match(/name="([^"]+)"/)?.[1];
    const filename = disposition.match(/filename="([^"]*)"/)?.[1];
    if (!name) continue;

    const buffer = Buffer.from(content, 'latin1');
    if (filename) {
      files.push({
        name,
        filename,
        mimeType: headers['content-type'] || 'application/octet-stream',
        buffer,
      });
    } else {
      fields[name] = buffer.toString('utf8');
    }
  }

  return { fields, files };
}

async function saveImageUpload(file) {
  if (!file || !file.mimeType.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있습니다.');
  }

  const ext = mimeExtension(file.mimeType, file.filename);
  const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const absolutePath = path.join(UPLOAD_DIR, filename);
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(absolutePath, file.buffer);

  return {
    filename,
    uploadPath: absolutePath,
    mimeType: file.mimeType,
    dataUrl: `data:${file.mimeType};base64,${file.buffer.toString('base64')}`,
  };
}

function photoForClient(photo) {
  return {
    id: photo.id,
    userId: photo.userId,
    label: photo.label,
    date: photo.date,
    dataUrl: photo.dataUrl,
    source: photo.source,
    filename: photo.filename || null,
    uploadPath: photo.uploadPath || null,
    mimeType: photo.mimeType || null,
    createdAt: photo.createdAt,
  };
}

function completeMissionPayload(db, userId) {
  const completions = db.missionCompletions.filter((item) => item.userId === userId);
  return MISSIONS.map((mission) => {
    const done = completions.find((item) => item.missionId === mission.id);
    return {
      ...mission,
      completed: !!done,
      completedAt: done?.completedAt || null,
      photoId: done?.photoId || null,
    };
  });
}

async function route(req, res) {
  if (req.method === 'OPTIONS') {
    send(res, 200, { ok: true });
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const { pathname, searchParams } = url;

  if (pathname === '/health') {
    send(res, 200, { ok: true, service: 'momentrip-api', time: now() });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/auth/check-username') {
    const username = String(searchParams.get('username') || '').trim();
    if (username.length < 3) return sendError(res, 400, '아이디는 3자 이상이어야 합니다.');

    const db = await readDb();
    const exists = db.users.some((user) => user.username.toLowerCase() === username.toLowerCase());
    console.log('[check-username] query:', { username, available: !exists });
    send(res, 200, { available: !exists });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/signup') {
    const body = await readJson(req);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const displayName = String(body.displayName || username || '여행자님').trim();

    if (username.length < 3) return sendError(res, 400, '아이디는 3자 이상이어야 합니다.');
    if (password.length < 4) return sendError(res, 400, '비밀번호는 4자 이상이어야 합니다.');

    const result = await withDb((db) => {
      const exists = db.users.some((user) => user.username.toLowerCase() === username.toLowerCase());
      if (exists) return { status: 409, payload: { error: '이미 사용 중인 아이디입니다.' } };

      const passwordResult = hashPassword(password);
      const user = {
        id: makeId('user'),
        username,
        displayName,
        email: `${username}@momentrip.local`,
        code: makeUserCode(),
        passwordSalt: passwordResult.salt,
        passwordHash: passwordResult.hash,
        createdAt: now(),
      };
      const token = makeToken();
      db.users.push(user);
      db.sessions.push({ token, userId: user.id, createdAt: now() });
      db.rewardTransactions.push(
        {
          id: makeId('reward'),
          userId: user.id,
          category: 'localMoney',
          amount: 5000,
          title: '가입 축하 지역화폐',
          desc: '첫 여행을 시작할 수 있도록 지급된 가입 보상입니다.',
          createdAt: now(),
        },
        {
          id: makeId('reward'),
          userId: user.id,
          category: 'points',
          amount: 1000,
          title: '가입 리워드 포인트',
          desc: '첫 여행 기록을 시작해보세요.',
          createdAt: now(),
        },
      );

      return { status: 201, payload: { token, user: publicUser(user) } };
    });

    send(res, result.status, result.payload);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const body = await readJson(req);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    const result = await withDb((db) => {
      const user = db.users.find((item) => item.username.toLowerCase() === username.toLowerCase());
      if (!user || !verifyPassword(password, user)) {
        return { status: 401, payload: { error: '아이디 또는 비밀번호가 올바르지 않습니다.' } };
      }

      const token = makeToken();
      db.sessions.push({ token, userId: user.id, createdAt: now() });
      return { status: 200, payload: { token, user: publicUser(user) } };
    });

    send(res, result.status, result.payload);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    const token = authToken(req);
    await withDb((db) => {
      db.sessions = db.sessions.filter((item) => item.token !== token);
      return null;
    });
    send(res, 200, { ok: true });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/me') {
    const db = await readDb();
    const user = requireUser(req, res, db);
    if (!user) return;
    send(res, 200, { user: publicUser(user) });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/friends') {
    const db = await readDb();
    if (!requireUser(req, res, db)) return;
    const query = String(searchParams.get('query') || '').trim().toLowerCase();
    const friends = query
      ? FRIENDS.filter((friend) => `${friend.name} ${friend.code}`.toLowerCase().includes(query))
      : FRIENDS;
    send(res, 200, { friends });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/rooms') {
    const db = await readDb();
    const user = requireUser(req, res, db);
    if (!user) return;
    const rooms = db.rooms
      .filter((room) => room.ownerId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    send(res, 200, { rooms });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/rooms') {
    const body = await readJson(req);
    const result = await withDb((db) => {
      const user = requireUser(req, res, db);
      if (!user) return null;

      const memberIds = Array.isArray(body.memberIds) ? body.memberIds.slice(0, 4) : [];
      const friends = FRIENDS.filter((friend) => memberIds.includes(friend.id));
      const room = {
        id: makeId('room'),
        ownerId: user.id,
        name: String(body.name || `${user.displayName}님의 여행방`).trim(),
        inviteCode: makeInviteCode(),
        planText: String(body.planText || '').trim(),
        members: [
          { id: user.id, name: user.displayName, code: user.code, emoji: '✈️', owner: true },
          ...friends,
        ],
        createdAt: now(),
      };
      db.rooms.push(room);
      return room;
    });
    if (!result) return;
    send(res, 201, { room: result });
    return;
  }

  if (req.method === 'GET' && pathname.startsWith('/api/rooms/')) {
    const db = await readDb();
    const user = requireUser(req, res, db);
    if (!user) return;
    const roomId = pathname.split('/').at(-1);
    const room = db.rooms.find((item) => item.id === roomId && item.ownerId === user.id);
    if (!room) return sendError(res, 404, '방을 찾을 수 없습니다.');
    send(res, 200, { room });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/missions') {
    const db = await readDb();
    const user = requireUser(req, res, db);
    if (!user) return;
    send(res, 200, { missions: completeMissionPayload(db, user.id) });
    return;
  }

  if (req.method === 'POST' && pathname.match(/^\/api\/missions\/\d+\/complete$/)) {
    const body = await readJson(req);
    const missionId = Number(pathname.split('/')[3]);
    const mission = MISSIONS.find((item) => item.id === missionId);
    if (!mission) return sendError(res, 404, '미션을 찾을 수 없습니다.');

    const result = await withDb((db) => {
      const user = requireUser(req, res, db);
      if (!user) return null;

      const existing = db.missionCompletions.find((item) => item.userId === user.id && item.missionId === missionId);
      if (!existing) {
        db.missionCompletions.push({
          id: makeId('mission'),
          userId: user.id,
          missionId,
          photoId: body.photoId || null,
          completedAt: now(),
        });
        db.rewardTransactions.push(
          {
            id: makeId('reward'),
            userId: user.id,
            category: 'localMoney',
            amount: 1000,
            title: `${mission.title} 지역화폐 적립`,
            desc: '여행 미션 인증 보상',
            createdAt: now(),
          },
          {
            id: makeId('reward'),
            userId: user.id,
            category: 'points',
            amount: 100,
            title: `${mission.title} 리워드`,
            desc: '미션 완료 포인트',
            createdAt: now(),
          },
        );
      }

      return { missions: completeMissionPayload(db, user.id), rewards: rewardSummary(db.rewardTransactions.filter((item) => item.userId === user.id)) };
    });
    if (!result) return;
    send(res, 200, result);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/rewards') {
    const db = await readDb();
    const user = requireUser(req, res, db);
    if (!user) return;
    const transactions = db.rewardTransactions.filter((item) => item.userId === user.id);
    send(res, 200, rewardSummary(transactions));
    return;
  }

  if (req.method === 'GET' && pathname === '/api/photos') {
    const db = await readDb();
    const user = requireUser(req, res, db);
    if (!user) return;
    const month = String(searchParams.get('month') || '').trim();
    const photos = db.photos
      .filter((photo) => photo.userId === user.id && (!month || photo.date.startsWith(month)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(photoForClient);
    send(res, 200, { photos });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/photos') {
    const contentType = req.headers['content-type'] || '';
    let body = {};
    let upload = null;

    if (contentType.includes('multipart/form-data')) {
      const form = parseMultipartForm(contentType, await readBodyBuffer(req));
      const file = form.files.find((item) => item.name === 'file') || form.files[0];
      upload = await saveImageUpload(file);
      body = {
        ...form.fields,
        dataUrl: upload.dataUrl,
      };
    } else {
      body = await readJson(req);
      if (!validateImageDataUrl(body.dataUrl)) {
        sendError(res, 400, '이미지 파일만 업로드할 수 있습니다.');
        return;
      }
    }

    const result = await withDb((db) => {
      const user = requireUser(req, res, db);
      if (!user) return null;

      const photo = {
        id: makeId('photo'),
        userId: user.id,
        label: String(body.label || '여행 사진').trim(),
        date: String(body.date || new Date().toISOString().slice(0, 10)),
        dataUrl: body.dataUrl,
        source: String(body.source || 'upload'),
        filename: upload?.filename || null,
        uploadPath: upload?.uploadPath || null,
        mimeType: upload?.mimeType || null,
        createdAt: now(),
      };
      db.photos.push(photo);
      console.log('[photo-upload]', {
        userId: user.id,
        label: photo.label,
        source: photo.source,
        filename: photo.filename,
        uploadPath: photo.uploadPath,
        dbFile: DB_FILE,
      });
      return photoForClient(photo);
    });
    if (!result) return;
    send(res, 201, { photo: result });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/diaries') {
    const db = await readDb();
    const user = requireUser(req, res, db);
    if (!user) return;
    const date = String(searchParams.get('date') || '').trim();
    const diaries = db.diaries
      .filter((item) => item.userId === user.id && (!date || item.date === date))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    send(res, 200, { diaries });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/diaries') {
    const body = await readJson(req);
    const result = await withDb((db) => {
      const user = requireUser(req, res, db);
      if (!user) return null;
      const diary = {
        id: makeId('diary'),
        userId: user.id,
        date: String(body.date || new Date().toISOString().slice(0, 10)),
        title: String(body.title || '오늘의 여행').trim(),
        text: String(body.text || ''),
        photoIds: Array.isArray(body.photoIds) ? body.photoIds : [],
        createdAt: now(),
        updatedAt: now(),
      };
      db.diaries.push(diary);
      return diary;
    });
    if (!result) return;
    send(res, 201, { diary: result });
    return;
  }

  if (req.method === 'PUT' && pathname.startsWith('/api/diaries/')) {
    const body = await readJson(req);
    const result = await withDb((db) => {
      const user = requireUser(req, res, db);
      if (!user) return null;
      const diaryId = pathname.split('/').at(-1);
      const diary = db.diaries.find((item) => item.id === diaryId && item.userId === user.id);
      if (!diary) return { missing: true };
      diary.title = String(body.title || diary.title).trim();
      diary.text = String(body.text ?? diary.text);
      diary.photoIds = Array.isArray(body.photoIds) ? body.photoIds : diary.photoIds;
      diary.updatedAt = now();
      return diary;
    });
    if (!result) return;
    if (result.missing) return sendError(res, 404, '다이어리를 찾을 수 없습니다.');
    send(res, 200, { diary: result });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/fourcuts') {
    const db = await readDb();
    const user = requireUser(req, res, db);
    if (!user) return;
    const fourCuts = db.fourCuts
      .filter((item) => item.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    send(res, 200, { fourCuts });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/fourcuts') {
    const body = await readJson(req);
    const result = await withDb((db) => {
      const user = requireUser(req, res, db);
      if (!user) return null;
      const fourCut = {
        id: makeId('fourcut'),
        userId: user.id,
        photoIds: Array.isArray(body.photoIds) ? body.photoIds.slice(0, 4) : [],
        filter: String(body.filter || '감성'),
        imageDataUrl: validateImageDataUrl(body.imageDataUrl) ? body.imageDataUrl : null,
        createdAt: now(),
      };
      db.fourCuts.push(fourCut);
      return fourCut;
    });
    if (!result) return;
    send(res, 201, { fourCut: result });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/share') {
    const body = await readJson(req);
    const result = await withDb((db) => {
      const user = requireUser(req, res, db);
      if (!user) return null;
      const share = {
        id: makeId('share'),
        userId: user.id,
        kind: String(body.kind || 'moment'),
        targetId: String(body.targetId || ''),
        channel: String(body.channel || 'system'),
        createdAt: now(),
      };
      db.shares.push(share);
      return share;
    });
    if (!result) return;
    send(res, 201, { share: result, message: '공유 기록이 저장되었습니다.' });
    return;
  }

  sendError(res, 404, 'API 경로를 찾을 수 없습니다.');
}

const server = http.createServer((req, res) => {
  route(req, res).catch((error) => {
    console.error(error);
    sendError(res, 500, error.message || '서버 오류가 발생했습니다.');
  });
});

function localNetworkIps() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((item) => item && item.family === 'IPv4' && !item.internal)
    .map((item) => item.address);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`MomenTrip API server listening on http://0.0.0.0:${PORT}`);
  for (const address of localNetworkIps()) {
    console.log(`iPhone API URL: http://${address}:${PORT}`);
  }
  console.log(`Data file: ${DB_FILE}`);
  console.log(`Upload dir: ${UPLOAD_DIR}`);
});
