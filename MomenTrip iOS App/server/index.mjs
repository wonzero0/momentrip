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
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_PASSWORD_LENGTH = 72;
const MAX_DISPLAY_NAME_LENGTH = 30;
const MAX_PLAN_LENGTH = 5000;
const MAX_DIARY_TEXT_LENGTH = 10000;
const MAX_INQUIRY_LENGTH = 2000;

const FRIENDS = [];

const MISSIONS = [
  { id: 1, icon: '🍜', title: '현지 음식 먹기', desc: '여행지의 대표 음식을 맛보세요', reward: 300 },
  { id: 2, icon: '🌆', title: '야경 사진 찍기', desc: '아름다운 밤 풍경을 담아요', reward: 500 },
  { id: 3, icon: '🥟', title: '길거리 음식 시도', desc: '현지 로컬 길거리 음식 도전', reward: 200 },
  { id: 4, icon: '💬', title: '낯선 사람과 대화', desc: '현지인과 친해져 보세요', reward: 800 },
  { id: 5, icon: '☕', title: '현지 카페 방문', desc: '숨겨진 로컬 카페 발견하기', reward: 100 },
  { id: 6, icon: '🤳', title: '랜드마크 셀카', desc: '여행지 대표 명소 인증샷', reward: 1000 },
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
  inquiries: [],
});

const now = () => new Date().toISOString();
const makeId = (prefix) => `${prefix}_${crypto.randomUUID()}`;
const makeToken = () => crypto.randomBytes(32).toString('hex');
const makeInviteCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();
const makeUserCode = () => `#${crypto.randomInt(1000, 10000)}`;
const normalizeInviteCode = (code) => String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
const normalizeUsername = (username) => String(username || '').trim().toLowerCase();
const isValidUsername = (username) => /^[\p{L}\p{N}._-]{3,40}$/u.test(username);

function makeUniqueInviteCode(db) {
  let code;
  do code = makeInviteCode(); while (db.rooms.some((room) => room.inviteCode === code));
  return code;
}

function makeUniqueUserCode(db) {
  let code;
  do code = makeUserCode(); while (db.users.some((user) => user.code === code));
  return code;
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

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
  const parsed = JSON.parse(raw);
  const normalized = emptyDb();
  for (const key of Object.keys(normalized)) {
    normalized[key] = Array.isArray(parsed?.[key]) ? parsed[key] : [];
  }
  return normalized;
}

async function writeDb(db) {
  const temporaryFile = `${DB_FILE}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryFile, JSON.stringify(db, null, 2));
    await fs.rename(temporaryFile, DB_FILE);
  } catch (error) {
    await fs.rm(temporaryFile, { force: true }).catch(() => undefined);
    throw error;
  }
}

let dbMutationQueue = Promise.resolve();

function withDb(mutator) {
  const operation = dbMutationQueue.then(async () => {
    const db = await readDb();
    const result = await mutator(db);
    await writeDb(db);
    return result;
  });
  dbMutationQueue = operation.then(() => undefined, () => undefined);
  return operation;
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

function issueSession(db, userId) {
  const cutoff = Date.now() - SESSION_TTL_MS;
  db.sessions = db.sessions.filter((session) => Date.parse(session.createdAt || '') >= cutoff);

  const token = makeToken();
  db.sessions.push({ token, userId, createdAt: now() });

  const userSessions = db.sessions
    .filter((session) => session.userId === userId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const expiredTokens = new Set(userSessions.slice(5).map((session) => session.token));
  if (expiredTokens.size) db.sessions = db.sessions.filter((session) => !expiredTokens.has(session.token));

  return token;
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
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
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
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw httpError(400, 'JSON 요청 형식이 올바르지 않습니다.');
  }
}

async function readBodyChunks(req) {
  let size = 0;
  const chunks = [];

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw httpError(413, '요청 데이터가 너무 큽니다.');
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
  const createdAt = Date.parse(session.createdAt || '');
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > SESSION_TTL_MS) return null;
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
  if (typeof dataUrl !== 'string') return false;
  const match = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) return false;
  const bytes = Buffer.from(match[2], 'base64');
  return bytes.length > 0 && bytes.length <= 12 * 1024 * 1024;
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
    throw httpError(400, 'multipart boundary를 찾을 수 없습니다.');
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
  const supportedMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
  if (!file || !supportedMimeTypes.has(file.mimeType) || file.buffer.length === 0) {
    throw httpError(400, 'JPEG, PNG, WebP 이미지 파일만 업로드할 수 있습니다.');
  }
  if (file.buffer.length > 12 * 1024 * 1024) {
    throw httpError(413, '이미지는 12MB 이하만 업로드할 수 있습니다.');
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
    roomId: photo.roomId || null,
    filename: photo.filename || null,
    mimeType: photo.mimeType || null,
    createdAt: photo.createdAt,
  };
}

function normalizeRoomId(roomId) {
  const value = String(roomId || '').trim();
  return value || null;
}

function canAccessRoom(db, userId, roomId) {
  const targetRoomId = normalizeRoomId(roomId);
  if (!targetRoomId) return true;
  const room = db.rooms.find((item) => item.id === targetRoomId);
  return Boolean(room && (room.ownerId === userId || room.members?.some((member) => member.id === userId)));
}

function completeMissionPayload(db, userId, roomId = null) {
  const targetRoomId = normalizeRoomId(roomId);
  const completions = db.missionCompletions.filter(
    (item) => item.userId === userId && normalizeRoomId(item.roomId) === targetRoomId,
  );
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
    const username = normalizeUsername(searchParams.get('username'));
    if (!isValidUsername(username)) {
      return sendError(res, 400, '아이디는 3~40자의 한글, 영문, 숫자, 마침표, 밑줄, 하이픈만 사용할 수 있습니다.');
    }

    const db = await readDb();
    const exists = db.users.some((user) => normalizeUsername(user.username) === username);
    console.log('[check-username] query:', { username, available: !exists });
    send(res, 200, { available: !exists });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/signup') {
    const body = await readJson(req);
    const username = normalizeUsername(body.username);
    const password = String(body.password || '');
    const displayName = String(body.displayName || username || '여행자님').trim();

    if (!isValidUsername(username)) {
      return sendError(res, 400, '아이디는 3~40자의 한글, 영문, 숫자, 마침표, 밑줄, 하이픈만 사용할 수 있습니다.');
    }
    if (password.length < 6 || password.length > MAX_PASSWORD_LENGTH) {
      return sendError(res, 400, '비밀번호는 6~72자로 입력해 주세요.');
    }
    if (!displayName || displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      return sendError(res, 400, '표시 이름은 1~30자로 입력해 주세요.');
    }

    const result = await withDb((db) => {
      const exists = db.users.some((user) => normalizeUsername(user.username) === username);
      if (exists) return { status: 409, payload: { error: '이미 사용 중인 아이디입니다.' } };

      const passwordResult = hashPassword(password);
      const user = {
        id: makeId('user'),
        username,
        displayName,
        email: `${username}@momentrip.local`,
        code: makeUniqueUserCode(db),
        passwordSalt: passwordResult.salt,
        passwordHash: passwordResult.hash,
        createdAt: now(),
      };
      db.users.push(user);
      const token = issueSession(db, user.id);
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
    const username = normalizeUsername(body.username);
    const password = String(body.password || '');

    const result = await withDb((db) => {
      const user = db.users.find((item) => normalizeUsername(item.username) === username);
      if (!user || password.length > MAX_PASSWORD_LENGTH || !verifyPassword(password, user)) {
        return { status: 401, payload: { error: '아이디 또는 비밀번호가 올바르지 않습니다.' } };
      }

      const token = issueSession(db, user.id);
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

  if (req.method === 'PUT' && pathname === '/api/me/profile') {
    const body = await readJson(req);
    const displayName = String(body.displayName || '').trim();
    const rawCode = String(body.code || '').trim();
    const code = rawCode.startsWith('#') ? rawCode : `#${rawCode}`;
    if (!displayName || displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      return sendError(res, 400, '표시 이름은 1~30자로 입력해 주세요.');
    }
    if (!/^#[0-9]{4}$/.test(code)) {
      return sendError(res, 400, '사용자 코드는 #을 제외한 숫자 4자리로 입력해 주세요.');
    }

    const result = await withDb((db) => {
      const user = requireUser(req, res, db);
      if (!user) return null;
      const duplicateCode = db.users.some((item) => item.id !== user.id && item.code === code);
      if (duplicateCode) return { status: 409, payload: { error: '이미 사용 중인 사용자 코드입니다.' } };

      user.displayName = displayName;
      user.code = code;
      return { status: 200, payload: { user: publicUser(user) } };
    });
    if (!result) return;
    send(res, result.status, result.payload);
    return;
  }

  if (req.method === 'PUT' && pathname === '/api/me/password') {
    const body = await readJson(req);
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');

    if (newPassword.length < 6 || newPassword.length > MAX_PASSWORD_LENGTH) {
      return sendError(res, 400, '새 비밀번호는 6~72자로 입력해 주세요.');
    }

    const result = await withDb((db) => {
      const user = requireUser(req, res, db);
      if (!user) return null;
      if (!verifyPassword(currentPassword, user)) {
        return { status: 401, payload: { error: '현재 비밀번호가 일치하지 않습니다.' } };
      }

      const passwordResult = hashPassword(newPassword);
      user.passwordSalt = passwordResult.salt;
      user.passwordHash = passwordResult.hash;
      return { status: 200, payload: { ok: true } };
    });
    if (!result) return;
    send(res, result.status, result.payload);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/friends') {
    const db = await readDb();
    const user = requireUser(req, res, db);
    if (!user) return;
    const query = String(searchParams.get('query') || '').trim().toLowerCase();
    const users = db.users
      .filter((item) => item.id !== user.id)
      .filter((item) => {
        if (!query) return true;
        return `${item.username} ${item.displayName} ${item.code}`.toLowerCase().includes(query);
      })
      .slice(0, 20);
    const friends = users.map((item) => ({
      id: item.id,
      name: item.displayName || item.username,
      code: item.code,
      emoji: '✈️',
    }));
    send(res, 200, { friends });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/rooms') {
    const db = await readDb();
    const user = requireUser(req, res, db);
    if (!user) return;
    const rooms = db.rooms
      .filter((room) => room.ownerId === user.id || room.members?.some((member) => member.id === user.id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    send(res, 200, { rooms });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/rooms') {
    const body = await readJson(req);
    const requestedName = String(body.name || '').trim();
    const planText = String(body.planText || '').trim();
    if (requestedName.length > 60) return sendError(res, 400, '여행방 이름은 60자 이하로 입력해 주세요.');
    if (planText.length > MAX_PLAN_LENGTH) return sendError(res, 400, '여행 계획은 5,000자 이하로 입력해 주세요.');

    const result = await withDb((db) => {
      const user = requireUser(req, res, db);
      if (!user) return null;

      const memberIds = Array.isArray(body.memberIds) ? body.memberIds.slice(0, 4) : [];
      const friends = db.users
        .filter((member) => member.id !== user.id && memberIds.includes(member.id))
        .map((member) => ({
          id: member.id,
          name: member.displayName || member.username,
          code: member.code,
          emoji: '✈️',
        }));
      const room = {
        id: makeId('room'),
        ownerId: user.id,
        name: requestedName || `${user.displayName}님의 여행방`,
        inviteCode: makeUniqueInviteCode(db),
        planText,
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

  if (req.method === 'POST' && pathname === '/api/rooms/join') {
    const body = await readJson(req);
    const result = await withDb((db) => {
      const user = requireUser(req, res, db);
      if (!user) return null;

      const inviteCode = normalizeInviteCode(body.inviteCode);
      if (!inviteCode) return { status: 400, payload: { error: '초대코드를 입력해주세요.' } };
      if (!/^[A-F0-9]{6}$/.test(inviteCode)) {
        return { status: 400, payload: { error: '초대코드는 영문과 숫자 6자리입니다.' } };
      }

      const room = db.rooms.find((item) => normalizeInviteCode(item.inviteCode) === inviteCode);
      if (!room) return { status: 404, payload: { error: '일치하는 초대코드의 방을 찾을 수 없습니다.' } };

      if (!Array.isArray(room.members)) room.members = [];
      const alreadyJoined = room.ownerId === user.id || room.members.some((member) => member.id === user.id);
      if (!alreadyJoined) {
        room.members.push({
          id: user.id,
          name: user.displayName || user.username,
          code: user.code,
          emoji: '✈️',
        });
      }

      return { status: 200, payload: { room } };
    });
    if (!result) return;
    send(res, result.status, result.payload);
    return;
  }

  if (req.method === 'GET' && pathname.startsWith('/api/rooms/')) {
    const db = await readDb();
    const user = requireUser(req, res, db);
    if (!user) return;
    const roomId = pathname.split('/').at(-1);
    const room = db.rooms.find(
      (item) => item.id === roomId && (item.ownerId === user.id || item.members?.some((member) => member.id === user.id)),
    );
    if (!room) return sendError(res, 404, '방을 찾을 수 없습니다.');
    send(res, 200, { room });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/missions') {
    const db = await readDb();
    const user = requireUser(req, res, db);
    if (!user) return;
    const roomId = normalizeRoomId(searchParams.get('roomId'));
    if (!canAccessRoom(db, user.id, roomId)) return sendError(res, 404, '여행방을 찾을 수 없습니다.');
    send(res, 200, { missions: completeMissionPayload(db, user.id, roomId) });
    return;
  }

  if (req.method === 'POST' && pathname.match(/^\/api\/missions\/\d+\/complete$/)) {
    const body = await readJson(req);
    const missionId = Number(pathname.split('/')[3]);
    const mission = MISSIONS.find((item) => item.id === missionId);
    if (!mission) return sendError(res, 404, '미션을 찾을 수 없습니다.');
    const maximumRewards = [340, 520, 260, 820, 180, 1000];
    const requestedPoints = Math.round(Number(body.earnedPoints || mission.reward));
    const earnedPoints = Math.min(maximumRewards[missionId - 1], Math.max(0, requestedPoints));
    const roomId = normalizeRoomId(body.roomId);
    const missionTitle = String(body.title || mission.title).trim().slice(0, 80) || mission.title;

    const result = await withDb((db) => {
      const user = requireUser(req, res, db);
      if (!user) return null;
      if (!canAccessRoom(db, user.id, roomId)) return { status: 404, payload: { error: '여행방을 찾을 수 없습니다.' } };
      const photo = db.photos.find(
        (item) => item.id === body.photoId && item.userId === user.id && normalizeRoomId(item.roomId) === roomId,
      );
      if (!photo) return { status: 400, payload: { error: '미션을 완료하려면 현재 여행방의 사진이 필요합니다.' } };

      const existing = db.missionCompletions.find(
        (item) => item.userId === user.id && item.missionId === missionId && normalizeRoomId(item.roomId) === roomId,
      );
      if (!existing) {
        db.missionCompletions.push({
          id: makeId('mission'),
          userId: user.id,
          roomId,
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
            title: `${missionTitle} 지역화폐 적립`,
            desc: '여행 미션 인증 보상',
            missionId,
            roomId,
            createdAt: now(),
          },
          {
            id: makeId('reward'),
            userId: user.id,
            category: 'points',
            amount: earnedPoints,
            title: `${missionTitle} 리워드`,
            desc: '미션 완료 포인트',
            missionId,
            roomId,
            createdAt: now(),
          },
        );
      }

      return {
        status: 200,
        payload: {
          missions: completeMissionPayload(db, user.id, roomId),
          rewards: rewardSummary(db.rewardTransactions.filter((item) => item.userId === user.id)),
        },
      };
    });
    if (!result) return;
    send(res, result.status, result.payload);
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

  if (req.method === 'POST' && pathname === '/api/rewards/convert') {
    const body = await readJson(req);
    const amount = Math.floor(Number(body.amount || 0));
    const regionName = String(body.regionName || '충청남도').trim().slice(0, 40);
    const currency = String(body.currency || '지역화폐').trim().slice(0, 40);

    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1_000_000) {
      return sendError(res, 400, '전환 금액이 올바르지 않습니다.');
    }

    const result = await withDb((db) => {
      const user = requireUser(req, res, db);
      if (!user) return null;
      const transactions = db.rewardTransactions.filter((item) => item.userId === user.id);
      const pointsBalance = transactions
        .filter((item) => item.category === 'points')
        .reduce((sum, item) => sum + item.amount, 0);

      if (amount > pointsBalance) {
        return { status: 400, payload: { error: '보유 포인트가 부족합니다.' } };
      }

      db.rewardTransactions.push({
        id: makeId('reward'),
        userId: user.id,
        category: 'points',
        amount: -amount,
        title: `${regionName} ${currency} 전환`,
        desc: '앱 테스트용 지역화폐 전환 내역',
        createdAt: now(),
      });

      return {
        status: 201,
        payload: { rewards: rewardSummary(db.rewardTransactions.filter((item) => item.userId === user.id)) },
      };
    });
    if (!result) return;
    send(res, result.status, result.payload);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/photos') {
    const db = await readDb();
    const user = requireUser(req, res, db);
    if (!user) return;
    const month = String(searchParams.get('month') || '').trim();
    if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return sendError(res, 400, '조회 월은 YYYY-MM 형식이어야 합니다.');
    }
    const roomId = normalizeRoomId(searchParams.get('roomId'));
    if (!canAccessRoom(db, user.id, roomId)) return sendError(res, 404, '여행방을 찾을 수 없습니다.');
    const photos = db.photos
      .filter((photo) => photo.userId === user.id && (!month || photo.date.startsWith(month)))
      .filter((photo) => !roomId || normalizeRoomId(photo.roomId) === roomId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(photoForClient);
    send(res, 200, { photos });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/photos') {
    const accessDb = await readDb();
    const authenticatedUser = requireUser(req, res, accessDb);
    if (!authenticatedUser) return;

    const contentType = req.headers['content-type'] || '';
    let body = {};
    let upload = null;
    let uploadFile = null;

    if (contentType.includes('multipart/form-data')) {
      const form = parseMultipartForm(contentType, await readBodyBuffer(req));
      uploadFile = form.files.find((item) => item.name === 'file') || form.files[0];
      body = { ...form.fields };
    } else {
      body = await readJson(req);
      if (!validateImageDataUrl(body.dataUrl)) {
        sendError(res, 400, '이미지 파일만 업로드할 수 있습니다.');
        return;
      }
    }

    const roomId = normalizeRoomId(body.roomId);
    if (!canAccessRoom(accessDb, authenticatedUser.id, roomId)) {
      return sendError(res, 404, '여행방을 찾을 수 없습니다.');
    }
    const date = String(body.date || new Date().toISOString().slice(0, 10));
    if (!/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(date)) {
      return sendError(res, 400, '사진 날짜는 YYYY-MM-DD 형식이어야 합니다.');
    }
    if (uploadFile) {
      upload = await saveImageUpload(uploadFile);
      body.dataUrl = upload.dataUrl;
    }

    const result = await withDb((db) => {
      const user = getUserFromRequest(req, db);
      if (!user) return { status: 401, payload: { error: '로그인이 필요합니다.' } };
      if (!canAccessRoom(db, user.id, roomId)) {
        return { status: 404, payload: { error: '여행방을 찾을 수 없습니다.' } };
      }

      const photo = {
        id: makeId('photo'),
        userId: user.id,
        label: String(body.label || '여행 사진').trim().slice(0, 100) || '여행 사진',
        date,
        dataUrl: body.dataUrl,
        source: String(body.source || 'upload').slice(0, 160),
        roomId,
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
        roomId: photo.roomId,
        filename: photo.filename,
        dbFile: DB_FILE,
      });
      return { status: 201, payload: { photo: photoForClient(photo) } };
    });
    if (result.status !== 201 && upload?.uploadPath) {
      await fs.rm(upload.uploadPath, { force: true }).catch(() => undefined);
    }
    send(res, result.status, result.payload);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/diaries') {
    const db = await readDb();
    const user = requireUser(req, res, db);
    if (!user) return;
    const date = String(searchParams.get('date') || '').trim();
    if (date && !/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(date)) {
      return sendError(res, 400, '조회 날짜는 YYYY-MM-DD 형식이어야 합니다.');
    }
    const diaries = db.diaries
      .filter((item) => item.userId === user.id && (!date || item.date === date))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    send(res, 200, { diaries });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/diaries') {
    const body = await readJson(req);
    const date = String(body.date || new Date().toISOString().slice(0, 10));
    const title = String(body.title || '오늘의 여행').trim();
    const text = String(body.text || '');
    const photoIds = Array.isArray(body.photoIds) ? [...new Set(body.photoIds.map(String))].slice(0, 20) : [];
    if (!/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(date)) {
      return sendError(res, 400, '다이어리 날짜는 YYYY-MM-DD 형식이어야 합니다.');
    }
    if (!title || title.length > 100) return sendError(res, 400, '다이어리 제목은 1~100자로 입력해 주세요.');
    if (text.length > MAX_DIARY_TEXT_LENGTH) return sendError(res, 400, '다이어리 내용은 10,000자 이하로 입력해 주세요.');
    if (body.imageDataUrl && !validateImageDataUrl(body.imageDataUrl)) {
      return sendError(res, 400, '다이어리 이미지 형식이 올바르지 않습니다.');
    }

    const result = await withDb((db) => {
      const user = requireUser(req, res, db);
      if (!user) return null;
      const ownsAllPhotos = photoIds.every((photoId) => db.photos.some((photo) => photo.id === photoId && photo.userId === user.id));
      if (!ownsAllPhotos) return { status: 400, payload: { error: '본인이 업로드한 사진만 다이어리에 추가할 수 있습니다.' } };
      const diary = {
        id: makeId('diary'),
        userId: user.id,
        date,
        title,
        text,
        photoIds,
        imageDataUrl: body.imageDataUrl ? String(body.imageDataUrl) : null,
        createdAt: now(),
        updatedAt: now(),
      };
      db.diaries.push(diary);
      return { status: 201, payload: { diary } };
    });
    if (!result) return;
    send(res, result.status, result.payload);
    return;
  }

  if (req.method === 'PUT' && pathname.startsWith('/api/diaries/')) {
    const body = await readJson(req);
    const nextTitle = body.title === undefined ? null : String(body.title).trim();
    const nextText = body.text === undefined ? null : String(body.text);
    const nextPhotoIds = Array.isArray(body.photoIds) ? [...new Set(body.photoIds.map(String))].slice(0, 20) : null;
    if (nextTitle !== null && (!nextTitle || nextTitle.length > 100)) {
      return sendError(res, 400, '다이어리 제목은 1~100자로 입력해 주세요.');
    }
    if (nextText !== null && nextText.length > MAX_DIARY_TEXT_LENGTH) {
      return sendError(res, 400, '다이어리 내용은 10,000자 이하로 입력해 주세요.');
    }
    if (body.imageDataUrl && !validateImageDataUrl(body.imageDataUrl)) {
      return sendError(res, 400, '다이어리 이미지 형식이 올바르지 않습니다.');
    }

    const result = await withDb((db) => {
      const user = requireUser(req, res, db);
      if (!user) return null;
      const diaryId = pathname.split('/').at(-1);
      const diary = db.diaries.find((item) => item.id === diaryId && item.userId === user.id);
      if (!diary) return { missing: true };
      if (nextPhotoIds && !nextPhotoIds.every((photoId) => db.photos.some((photo) => photo.id === photoId && photo.userId === user.id))) {
        return { status: 400, payload: { error: '본인이 업로드한 사진만 다이어리에 추가할 수 있습니다.' } };
      }
      diary.title = nextTitle ?? diary.title;
      diary.text = nextText ?? diary.text;
      diary.photoIds = nextPhotoIds ?? diary.photoIds;
      if ('imageDataUrl' in body) diary.imageDataUrl = body.imageDataUrl ? String(body.imageDataUrl) : null;
      diary.updatedAt = now();
      return { status: 200, payload: { diary } };
    });
    if (!result) return;
    if (result.missing) return sendError(res, 404, '다이어리를 찾을 수 없습니다.');
    send(res, result.status, result.payload);
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
    const photoIds = Array.isArray(body.photoIds) ? [...new Set(body.photoIds.map(String))].slice(0, 4) : [];
    if (photoIds.length !== 4) return sendError(res, 400, '네컷사진에는 서로 다른 사진 4장이 필요합니다.');
    if (body.imageDataUrl && !validateImageDataUrl(body.imageDataUrl)) {
      return sendError(res, 400, '네컷 이미지 형식이 올바르지 않습니다.');
    }

    const result = await withDb((db) => {
      const user = requireUser(req, res, db);
      if (!user) return null;
      const ownsAllPhotos = photoIds.every((photoId) => db.photos.some((photo) => photo.id === photoId && photo.userId === user.id));
      if (!ownsAllPhotos) return { status: 400, payload: { error: '본인이 업로드한 사진만 사용할 수 있습니다.' } };
      const fourCut = {
        id: makeId('fourcut'),
        userId: user.id,
        photoIds,
        filter: String(body.filter || '감성').slice(0, 30),
        imageDataUrl: validateImageDataUrl(body.imageDataUrl) ? body.imageDataUrl : null,
        createdAt: now(),
      };
      db.fourCuts.push(fourCut);
      return { status: 201, payload: { fourCut } };
    });
    if (!result) return;
    send(res, result.status, result.payload);
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
        kind: String(body.kind || 'moment').slice(0, 30),
        targetId: String(body.targetId || '').slice(0, 160),
        channel: String(body.channel || 'system').slice(0, 30),
        createdAt: now(),
      };
      db.shares.push(share);
      return share;
    });
    if (!result) return;
    send(res, 201, { share: result, message: '공유 기록이 저장되었습니다.' });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/inquiries') {
    const db = await readDb();
    const user = requireUser(req, res, db);
    if (!user) return;
    const inquiries = db.inquiries
      .filter((item) => item.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20);
    send(res, 200, { inquiries });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/inquiries') {
    const body = await readJson(req);
    const category = String(body.category || '이용 문의').trim();
    const message = String(body.message || '').trim();
    if (!message) return sendError(res, 400, '문의 내용을 입력해 주세요.');
    if (category.length > 40) return sendError(res, 400, '문의 유형은 40자 이하로 입력해 주세요.');
    if (message.length > MAX_INQUIRY_LENGTH) return sendError(res, 400, '문의 내용은 2,000자 이하로 입력해 주세요.');

    const result = await withDb((db) => {
      const user = requireUser(req, res, db);
      if (!user) return null;
      const inquiry = {
        id: makeId('inquiry'),
        userId: user.id,
        category,
        message,
        createdAt: now(),
      };
      db.inquiries.push(inquiry);
      return inquiry;
    });
    if (!result) return;
    send(res, 201, { inquiry: result });
    return;
  }

  sendError(res, 404, 'API 경로를 찾을 수 없습니다.');
}

const server = http.createServer((req, res) => {
  route(req, res).catch((error) => {
    const status = Number(error?.status) || 500;
    if (status >= 500) console.error(error);
    if (!res.headersSent) sendError(res, status, error.message || '서버 오류가 발생했습니다.');
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
  const localHostname = os.hostname();
  if (localHostname) {
    const bonjourHostname = localHostname.endsWith('.local') ? localHostname : `${localHostname}.local`;
    console.log(`Stable iPhone API URL: http://${bonjourHostname}:${PORT}`);
  }
  for (const address of localNetworkIps()) {
    console.log(`iPhone API URL: http://${address}:${PORT}`);
  }
  console.log(`Data file: ${DB_FILE}`);
  console.log(`Upload dir: ${UPLOAD_DIR}`);
});
