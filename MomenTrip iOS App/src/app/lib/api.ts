import { supabaseRequested } from '../../lib/supabase';
import { supabaseApi } from './supabaseApi';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import type {
  DiaryEntry,
  FourCut,
  Friend,
  MissionStatus,
  RewardSummary,
  RewardTransaction,
  TravelPhoto,
  TripRoom,
  User,
} from '../types';
import { assertFirebaseConfigured, auth, db, firebaseTargetLabel } from './firebase';

const TOKEN_KEY = 'momentrip_token';
const AUTH_ALIAS_DOMAIN = 'momentrip.local';
const FIREBASE_REQUEST_TIMEOUT_MS = 15000;
const SERVER_API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

interface AuthRestSession {
  uid: string;
  email: string;
  idToken: string;
  refreshToken: string;
}

interface ServerSession {
  token: string;
  user?: User;
  provider?: 'server';
}

interface Inquiry {
  id: string;
  userId?: string;
  category: string;
  message: string;
  createdAt: string;
}

const MISSIONS = [
  { id: 1, icon: '🍜', title: '현지 음식 먹기', desc: '여행지의 대표 음식을 맛보세요' },
  { id: 2, icon: '🌆', title: '야경 사진 찍기', desc: '아름다운 밤 풍경을 담아요' },
  { id: 3, icon: '🥟', title: '길거리 음식 시도', desc: '현지 로컬 길거리 음식 도전' },
  { id: 4, icon: '💬', title: '낯선 사람과 대화', desc: '현지인과 친해져 보세요' },
  { id: 5, icon: '☕', title: '현지 카페 방문', desc: '숨겨진 로컬 카페 발견하기' },
  { id: 6, icon: '🤳', title: '랜드마크 셀카', desc: '여행지 대표 명소 인증샷' },
];

function now() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${random}`;
}

function makeInviteCode() {
  return Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0').toUpperCase();
}

function normalizeInviteCode(inviteCode: string) {
  return String(inviteCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function makeUserCode() {
  return `#${Math.floor(1000 + Math.random() * 9000)}`;
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function shouldUseServerApi() {
  return Boolean(SERVER_API_BASE_URL);
}

function serverApiUrl(path: string) {
  if (!SERVER_API_BASE_URL) throw new Error('VITE_API_BASE_URL이 설정되어 있지 않습니다.');
  return `${SERVER_API_BASE_URL}${path}`;
}

function mapServerNetworkError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  const isNetworkFailure =
    error instanceof TypeError ||
    message.includes('Load failed') ||
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('Network request failed');

  if (!isNetworkFailure) return error instanceof Error ? error : new Error(message || '서버 요청 중 오류가 발생했습니다.');

  return new Error(
    [
      '서버에 연결할 수 없습니다.',
      '네트워크 연결을 확인한 뒤 다시 시도해주세요.',
    ].join('\n'),
  );
}

function readServerSession(): ServerSession | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as ServerSession;
    return session?.token ? session : null;
  } catch {
    return null;
  }
}

function saveServerSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ token, user, provider: 'server' }));
}

async function serverRequest<T>(path: string, init: RequestInit = {}, authRequired = false): Promise<T> {
  const headers = new Headers(init.headers);
  const hasBody = init.body !== undefined && !(init.body instanceof FormData);

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const session = readServerSession();
  if (session?.token) headers.set('Authorization', `Bearer ${session.token}`);
  if (authRequired && !session?.token) throw new Error('로그인이 필요합니다.');

  let response: Response;
  try {
    response = await fetch(serverApiUrl(path), {
      ...init,
      headers,
    });
  } catch (error) {
    throw mapServerNetworkError(error);
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => '');

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `서버 요청 실패: ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

function usernameKey(username: string) {
  const normalized = normalizeUsername(username);
  const encoded = Array.from(normalized)
    .map((char) => char.codePointAt(0)?.toString(16).padStart(4, '0') || '0000')
    .join('_');
  return `u_${encoded}`;
}

function usernameEmail(username: string) {
  return `${usernameKey(username)}@${AUTH_ALIAS_DOMAIN}`;
}

function mapFirebaseError(error: unknown, fallback = '요청 처리 중 오류가 발생했습니다.') {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  const message = error instanceof Error ? error.message : fallback;

  if (code === 'auth/email-already-in-use') return new Error('이미 사용 중인 아이디입니다.');
  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
  }
  if (code === 'auth/weak-password') return new Error('Firebase Auth 비밀번호는 6자 이상이어야 합니다.');
  if (code === 'auth/invalid-api-key') return new Error('Firebase API Key가 올바르지 않습니다. .env.local 값을 확인해주세요.');
  if (code === 'permission-denied') return new Error('Firestore 권한이 없습니다. 보안 규칙을 확인해주세요.');
  if (code === 'unavailable') return new Error('Firebase에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
  if (code === 'client/timeout' || code === 'client/auth-timeout' || code === 'client/rest-timeout') {
    return new Error(message || '요청 시간이 초과되었습니다.');
  }
  if (code === 'EMAIL_EXISTS' || message === 'EMAIL_EXISTS') return new Error('이미 가입된 이메일입니다.');
  if (message.includes('이미 사용 중인 아이디')) return new Error('이미 사용 중인 아이디입니다.');
  if (code === 'INVALID_EMAIL' || message === 'INVALID_EMAIL') return new Error('이메일 형식이 올바르지 않습니다.');
  if (code.includes('WEAK_PASSWORD') || message.includes('WEAK_PASSWORD')) {
    return new Error('비밀번호는 최소 6자 이상이어야 합니다.');
  }
  if (code === 'OPERATION_NOT_ALLOWED' || message === 'OPERATION_NOT_ALLOWED') {
    return new Error('Firebase Console에서 Email/Password 로그인을 활성화해야 합니다.');
  }
  if (message.includes('timeout') || message.includes('시간이 초과')) {
    return new Error('회원가입 인증시간 요청 초과');
  }
  if (message.includes('Firebase 환경변수')) return new Error(message);

  return new Error(message || fallback);
}

function mapSignupError(error: unknown) {
  const errorRecord = error && typeof error === 'object' ? (error as Record<string, unknown>) : null;
  const code = errorRecord?.code ? String(errorRecord.code) : '';
  const message = error instanceof Error ? error.message : String(error || '알 수 없는 오류');

  if (code === 'EMAIL_EXISTS' || message === 'EMAIL_EXISTS') return new Error('이미 가입된 이메일입니다.');
  if (code === 'INVALID_EMAIL' || message === 'INVALID_EMAIL') return new Error('이메일 형식이 올바르지 않습니다.');
  if (code.includes('WEAK_PASSWORD') || message.includes('WEAK_PASSWORD')) {
    return new Error('비밀번호는 최소 6자 이상이어야 합니다.');
  }
  if (code === 'OPERATION_NOT_ALLOWED' || message === 'OPERATION_NOT_ALLOWED') {
    return new Error('Firebase Console에서 Email/Password 로그인을 활성화해야 합니다.');
  }
  if (code === 'client/rest-timeout' || message.includes('timeout') || message.includes('시간이 초과')) {
    return new Error('회원가입 인증시간 요청 초과');
  }
  if (code === 'permission-denied' || code === 'PERMISSION_DENIED' || message.includes('PERMISSION_DENIED')) {
    return new Error('Firestore 권한이 없습니다. 보안 규칙을 확인해주세요.');
  }

  return new Error(`회원가입 실패: ${message}`);
}

function errorDetail(error: unknown) {
  const errorRecord = error && typeof error === 'object' ? (error as Record<string, unknown>) : null;

  return {
    status: errorRecord?.status,
    statusText: errorRecord?.statusText,
    body: errorRecord?.body,
    code: errorRecord?.code,
    message: error instanceof Error ? error.message : undefined,
    stringified: String(error),
  };
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  init?: RequestInit,
  timeoutMessage = 'Firebase REST 요청 시간이 초과되었습니다.',
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      const timeoutError = new Error(timeoutMessage) as Error & { code?: string };
      timeoutError.code = 'client/rest-timeout';
      throw timeoutError;
    }

    const errorRecord = error && typeof error === 'object' ? (error as Record<string, unknown>) : null;
    if (errorRecord?.name === 'AbortError') {
      const timeoutError = new Error(timeoutMessage) as Error & { code?: string };
      timeoutError.code = 'client/rest-timeout';
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function firestoreRestDocumentUrl(path: string) {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!projectId || !apiKey) throw new Error('Firebase REST 환경변수가 없습니다.');

  const encodedPath = path
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');

  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${encodedPath}?key=${encodeURIComponent(apiKey)}`;
}

function firestoreRestCommitUrl() {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!projectId || !apiKey) throw new Error('Firebase REST 환경변수가 없습니다.');

  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:commit?key=${encodeURIComponent(apiKey)}`;
}

function firebaseAuthRestUrl(action: string) {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) throw new Error('VITE_FIREBASE_API_KEY가 설정되어 있지 않습니다.');

  return `https://identitytoolkit.googleapis.com/v1/${action}?key=${encodeURIComponent(apiKey)}`;
}

function firebaseAuthRestError(errorMessage: string) {
  const error = new Error(errorMessage || 'UNKNOWN_AUTH_ERROR') as Error & { code?: string };
  error.code = errorMessage || 'UNKNOWN_AUTH_ERROR';
  return error;
}

function sanitizeAuthRestResponse(data: Record<string, unknown>) {
  return {
    ...data,
    idToken: data.idToken ? '[redacted]' : undefined,
    refreshToken: data.refreshToken ? '[redacted]' : undefined,
  };
}

export async function signupWithEmailPasswordRest(email: string, password: string): Promise<AuthRestSession> {
  console.log('[firebase][signup:rest] start', {
    email,
    timeoutMs: FIREBASE_REQUEST_TIMEOUT_MS,
  });

  const response = await fetchWithTimeout(
    firebaseAuthRestUrl('accounts:signUp'),
    FIREBASE_REQUEST_TIMEOUT_MS,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    },
    '회원가입 인증시간 요청 초과',
  );

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  console.log('[firebase][signup:rest] status:', response.status);
  console.log('[firebase][signup:rest] response:', sanitizeAuthRestResponse(data));

  if (!response.ok) {
    const firebaseMessage =
      typeof data.error === 'object' &&
      data.error &&
      'message' in data.error &&
      typeof data.error.message === 'string'
        ? data.error.message
        : 'UNKNOWN_AUTH_ERROR';
    throw firebaseAuthRestError(firebaseMessage);
  }

  const uid = typeof data.localId === 'string' ? data.localId : '';
  const responseEmail = typeof data.email === 'string' ? data.email : email;
  const idToken = typeof data.idToken === 'string' ? data.idToken : '';
  const refreshToken = typeof data.refreshToken === 'string' ? data.refreshToken : '';

  if (!uid || !idToken || !refreshToken) {
    throw firebaseAuthRestError('INVALID_AUTH_REST_RESPONSE');
  }

  return {
    uid,
    email: responseEmail,
    idToken,
    refreshToken,
  };
}

async function deleteAuthUserRest(idToken: string) {
  console.log('[firebase][signup:rest-delete] start');
  const response = await fetchWithTimeout(
    firebaseAuthRestUrl('accounts:delete'),
    8000,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    },
    '회원가입 롤백 요청 시간이 초과되었습니다.',
  );
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  console.log('[firebase][signup:rest-delete] status:', response.status);
  console.log('[firebase][signup:rest-delete] response:', sanitizeAuthRestResponse(data));

  if (!response.ok) {
    const firebaseMessage =
      typeof data.error === 'object' &&
      data.error &&
      'message' in data.error &&
      typeof data.error.message === 'string'
        ? data.error.message
        : 'UNKNOWN_AUTH_DELETE_ERROR';
    throw firebaseAuthRestError(firebaseMessage);
  }
}

function firestoreRestDocumentName(path: string) {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Firebase REST 환경변수가 없습니다.');
  return `projects/${projectId}/databases/(default)/documents/${path}`;
}

type FirestoreRestValue = Record<string, unknown>;

function toFirestoreValue(value: unknown): FirestoreRestValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: value.length ? { values: value.map(toFirestoreValue) } : {} };
  }
  if (typeof value === 'object') {
    return { mapValue: { fields: toFirestoreFields(value as Record<string, unknown>) } };
  }
  return { stringValue: String(value) };
}

function toFirestoreFields(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toFirestoreValue(value)]),
  );
}

async function checkUsernameAvailabilityRest(normalizedUsername: string, logPrefix: string) {
  const key = usernameKey(normalizedUsername);
  const path = `usernames/${key}`;
  const restUrl = firestoreRestDocumentUrl(path);
  console.log(`${logPrefix} start`, {
    username: normalizedUsername,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    key,
    timeoutMs: FIREBASE_REQUEST_TIMEOUT_MS,
  });
  console.log(`${logPrefix} path:`, path);
  console.log(`${logPrefix} request:`, {
    host: 'firestore.googleapis.com',
    path,
    keyParam: 'redacted',
  });

  try {
    const response = await fetchWithTimeout(
      restUrl,
      FIREBASE_REQUEST_TIMEOUT_MS,
      undefined,
      '아이디 확인 REST 요청 시간이 초과되었습니다.',
    );
    console.log(`${logPrefix} status:`, response.status);

    if (response.status === 404) {
      console.log(`${logPrefix} available:`, true);
      return true;
    }

    if (response.status === 200) {
      console.log(`${logPrefix} available:`, false);
      return false;
    }

    const body = await response.text().catch(() => '');
    const restError = new Error(
      `Firestore REST username check failed: ${response.status} ${response.statusText} ${body.slice(0, 300)}`,
    ) as Error & { status?: number; statusText?: string; body?: string };
    restError.status = response.status;
    restError.statusText = response.statusText;
    restError.body = body.slice(0, 300);
    throw restError;
  } catch (error) {
    console.error(`${logPrefix} failed detail`, errorDetail(error));
    throw error;
  }
}

async function commitFirestoreDocumentsRest(
  documents: Array<{ path: string; data: Record<string, unknown> }>,
  idToken: string,
) {
  const paths = documents.map((item) => item.path);
  console.log('[firebase][signup:rest-commit] start', {
    documentCount: documents.length,
    paths,
    timeoutMs: FIREBASE_REQUEST_TIMEOUT_MS,
  });

  const response = await fetchWithTimeout(
    firestoreRestCommitUrl(),
    FIREBASE_REQUEST_TIMEOUT_MS,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        writes: documents.map((item) => ({
          update: {
            name: firestoreRestDocumentName(item.path),
            fields: toFirestoreFields(item.data),
          },
        })),
      }),
    },
    '회원가입 데이터 저장 REST 요청 시간이 초과되었습니다.',
  );

  console.log('[firebase][signup:rest-commit] status:', response.status);

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const restError = new Error(
      `Firestore REST commit failed: ${response.status} ${response.statusText} ${body.slice(0, 300)}`,
    ) as Error & { status?: number; statusText?: string; body?: string };
    restError.status = response.status;
    restError.statusText = response.statusText;
    restError.body = body.slice(0, 300);
    console.error('[firebase][signup:rest-commit] failed detail', errorDetail(restError));
    throw restError;
  }

  console.log('[firebase][signup:rest-commit] saved:', paths);
}

function rewardSummary(transactions: RewardTransaction[]): RewardSummary {
  const balances = transactions.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    },
    { localMoney: 0, points: 0 },
  );

  return {
    balances,
    transactions: [...transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

function storageTodoDataUrl(label: string, date: string) {
  const safeLabel = label || '사진 업로드 보류';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
      <rect width="900" height="1200" fill="#F0EAE2"/>
      <circle cx="450" cy="430" r="118" fill="#D8CCB8"/>
      <path d="M337 456l74-80 86 102 54-62 95 126H274z" fill="#FAF8F5"/>
      <text x="450" y="700" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#2A1F1A">Firebase Storage 보류</text>
      <text x="450" y="766" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#9E8B7E">${safeLabel}</text>
      <text x="450" y="816" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#9E8B7E">${date}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function userFromData(id: string, data: DocumentData): User {
  return {
    id,
    username: String(data.username || ''),
    displayName: String(data.displayName || data.username || '여행자님'),
    email: String(data.email || ''),
    code: String(data.code || '#0000'),
    createdAt: String(data.createdAt || now()),
  };
}

function friendFromUser(user: User, owner = false): Friend & { owner?: boolean } {
  return {
    id: user.id,
    name: user.displayName,
    code: user.code,
    emoji: '✈️',
    ...(owner ? { owner: true } : {}),
  };
}

function roomFromData(id: string, data: DocumentData): TripRoom {
  const members = Array.isArray(data.members)
    ? data.members.map((member) => ({
        id: String(member.id || ''),
        name: String(member.name || ''),
        code: String(member.code || ''),
        emoji: String(member.emoji || '✈️'),
        owner: Boolean(member.owner),
      }))
    : [];

  return {
    id,
    ownerId: String(data.ownerId || ''),
    name: String(data.name || '나의 여행방'),
    inviteCode: String(data.inviteCode || ''),
    planText: String(data.planText || ''),
    members,
    createdAt: String(data.createdAt || now()),
  };
}

function missionCompletionFromData(id: string, data: DocumentData) {
  return {
    id,
    userId: String(data.userId || ''),
    roomId: data.roomId ? String(data.roomId) : null,
    missionId: Number(data.missionId),
    photoId: data.photoId ? String(data.photoId) : null,
    completedAt: String(data.completedAt || now()),
  };
}

function rewardTransactionFromData(id: string, data: DocumentData): RewardTransaction {
  const category = data.category === 'points' ? 'points' : 'localMoney';
  return {
    id,
    userId: String(data.userId || ''),
    category,
    amount: Number(data.amount || 0),
    title: String(data.title || ''),
    desc: String(data.desc || ''),
    missionId: data.missionId ? Number(data.missionId) : null,
    roomId: data.roomId ? String(data.roomId) : null,
    createdAt: String(data.createdAt || now()),
  };
}

function photoFromData(id: string, data: DocumentData): TravelPhoto {
  const label = String(data.label || '여행 사진');
  const date = String(data.date || todayIsoDate());

  return {
    id,
    userId: String(data.userId || ''),
    label,
    date,
    dataUrl: storageTodoDataUrl(label, date),
    source: String(data.source || 'upload'),
    roomId: data.roomId ? String(data.roomId) : null,
    filename: data.filename ? String(data.filename) : null,
    uploadPath: null,
    mimeType: data.mimeType ? String(data.mimeType) : null,
    createdAt: String(data.createdAt || now()),
  };
}

function diaryFromData(id: string, data: DocumentData): DiaryEntry {
  return {
    id,
    userId: String(data.userId || ''),
    date: String(data.date || todayIsoDate()),
    title: String(data.title || '오늘의 여행'),
    text: String(data.text || ''),
    photoIds: Array.isArray(data.photoIds) ? data.photoIds.map(String) : [],
    imageDataUrl: data.imageDataUrl ? String(data.imageDataUrl) : null,
    createdAt: String(data.createdAt || now()),
    updatedAt: String(data.updatedAt || data.createdAt || now()),
  };
}

function fourCutFromData(id: string, data: DocumentData): FourCut {
  return {
    id,
    userId: String(data.userId || ''),
    photoIds: Array.isArray(data.photoIds) ? data.photoIds.map(String).slice(0, 4) : [],
    filter: String(data.filter || '감성'),
    imageDataUrl: null,
    createdAt: String(data.createdAt || now()),
  };
}

async function initialFirebaseUser() {
  assertFirebaseConfigured();
  if (auth.currentUser) return auth.currentUser;

  return new Promise<FirebaseUser | null>((resolve, reject) => {
    let unsubscribe: () => void = () => undefined;
    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      (error) => {
        unsubscribe();
        reject(error);
      },
    );
  });
}

async function requireFirebaseUser() {
  const firebaseUser = await initialFirebaseUser();
  if (!firebaseUser) throw new Error('로그인이 필요합니다.');
  return firebaseUser;
}

async function loadUser(uid: string) {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? userFromData(snapshot.id, snapshot.data()) : null;
}

async function requireAppUser() {
  const firebaseUser = await requireFirebaseUser();
  const user = await loadUser(firebaseUser.uid);
  if (user) return user;

  const fallback: User = {
    id: firebaseUser.uid,
    username: firebaseUser.email?.split('@')[0] || firebaseUser.uid,
    displayName: firebaseUser.displayName || '여행자님',
    email: firebaseUser.email || '',
    code: makeUserCode(),
    createdAt: now(),
  };
  await setDoc(doc(db, 'users', fallback.id), fallback, { merge: true });
  return fallback;
}

async function userDocsByIds(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))].slice(0, 4);
  const users = await Promise.all(uniqueIds.map((id) => loadUser(id).catch(() => null)));
  return users.filter((user): user is User => Boolean(user));
}

async function missionStatuses(userId: string, roomId?: string | null): Promise<MissionStatus[]> {
  const snapshot = await getDocs(query(collection(db, 'missionCompletions'), where('userId', '==', userId)));
  const targetRoomId = roomId || null;
  const completions = snapshot.docs
    .map((item) => missionCompletionFromData(item.id, item.data()))
    .filter((item) => (item.roomId || null) === targetRoomId);

  return MISSIONS.map((mission) => {
    const completion = completions.find((item) => item.missionId === mission.id);
    return {
      ...mission,
      completed: Boolean(completion),
      completedAt: completion?.completedAt || null,
      photoId: completion?.photoId || null,
    };
  });
}

async function rewardTransactionsForUser(userId: string) {
  const snapshot = await getDocs(query(collection(db, 'rewardTransactions'), where('userId', '==', userId)));
  return snapshot.docs.map((item) => rewardTransactionFromData(item.id, item.data()));
}

async function createPhotoMetadata(input: {
  label: string;
  date?: string;
  source?: string;
  roomId?: string | null;
  filename?: string | null;
  mimeType?: string | null;
}) {
  const user = await requireAppUser();
  const createdAt = now();
  const photo: TravelPhoto = {
    id: makeId('photo'),
    userId: user.id,
    label: String(input.label || '여행 사진').trim(),
    date: input.date || todayIsoDate(),
    dataUrl: storageTodoDataUrl(input.label || '여행 사진', input.date || todayIsoDate()),
    source: input.source || 'upload',
    roomId: input.roomId || null,
    filename: input.filename || null,
    uploadPath: null,
    mimeType: input.mimeType || null,
    createdAt,
  };

  await setDoc(doc(db, 'photos', photo.id), {
    id: photo.id,
    userId: photo.userId,
    label: photo.label,
    date: photo.date,
    source: photo.source,
    roomId: photo.roomId,
    filename: photo.filename,
    mimeType: photo.mimeType,
    storageStatus: 'todo-storage-disabled',
    storageTodo: 'Firebase Storage는 Blaze 요금제 필요 가능성이 있어 1차 전환에서 보류했습니다.',
    createdAt: photo.createdAt,
  });

  console.info('[firebase][photos] Storage 보류: Firestore에는 사진 메타데이터만 저장했습니다.', {
    photoId: photo.id,
    source: photo.source,
  });

  return photo;
}

const serverApi = {
  baseUrl: () => `server://${SERVER_API_BASE_URL || 'unconfigured'}`,

  async signup(username: string, password: string, displayName?: string) {
    const data = await serverRequest<{ token: string; user: User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username: normalizeUsername(username), password, displayName }),
    });
    saveServerSession(data.token, data.user);
    return data.user;
  },

  async login(username: string, password: string) {
    const data = await serverRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: normalizeUsername(username), password }),
    });
    saveServerSession(data.token, data.user);
    return data.user;
  },

  async checkUsername(username: string) {
    const normalizedUsername = normalizeUsername(username);
    if (normalizedUsername.length < 3) throw new Error('아이디는 3자 이상이어야 합니다.');
    const data = await serverRequest<{ available: boolean }>(
      `/api/auth/check-username?username=${encodeURIComponent(normalizedUsername)}`,
    );
    return data.available;
  },

  async logout() {
    await serverRequest('/api/auth/logout', { method: 'POST' }, false).catch(() => undefined);
    localStorage.removeItem(TOKEN_KEY);
  },

  async me() {
    if (!readServerSession()) return null;
    const data = await serverRequest<{ user: User }>('/api/me', {}, true);
    if (data.user) saveServerSession(readServerSession()?.token || '', data.user);
    return data.user || null;
  },

  async friends(queryText = '') {
    const data = await serverRequest<{ friends: Friend[] }>(
      `/api/friends?query=${encodeURIComponent(queryText.trim())}`,
      {},
      true,
    );
    return data.friends || [];
  },

  async rooms() {
    const data = await serverRequest<{ rooms: TripRoom[] }>('/api/rooms', {}, true);
    return data.rooms || [];
  },

  async createRoom(input: { name?: string; memberIds: string[]; planText?: string }) {
    const data = await serverRequest<{ room: TripRoom }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(input),
    }, true);
    return data.room;
  },

  async joinRoom(inviteCode: string) {
    const data = await serverRequest<{ room: TripRoom }>('/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode: normalizeInviteCode(inviteCode) }),
    }, true);
    return data.room;
  },

  async missions(roomId?: string | null) {
    const query = roomId ? `?roomId=${encodeURIComponent(roomId)}` : '';
    const data = await serverRequest<{ missions: MissionStatus[] }>(`/api/missions${query}`, {}, true);
    return data.missions || [];
  },

  async completeMission(missionId: number, photoId?: string, earnedPoints?: number, roomId?: string | null, title?: string) {
    return serverRequest<{ missions: MissionStatus[]; rewards: RewardSummary }>(
      `/api/missions/${missionId}/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ photoId: photoId || null, earnedPoints, roomId: roomId || null, title }),
      },
      true,
    );
  },

  async rewards() {
    return serverRequest<RewardSummary>('/api/rewards', {}, true);
  },

  async convertLocalCurrency(input: { amount: number; regionName: string; currency: string }) {
    return serverRequest<{ rewards: RewardSummary }>('/api/rewards/convert', {
      method: 'POST',
      body: JSON.stringify(input),
    }, true);
  },

  async photos(month?: string, roomId?: string | null) {
    const params = new URLSearchParams();
    if (month) params.set('month', month);
    if (roomId) params.set('roomId', roomId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await serverRequest<{ photos: TravelPhoto[] }>(`/api/photos${query}`, {}, true);
    return data.photos || [];
  },

  async uploadPhoto(input: { dataUrl: string; label: string; date?: string; source?: string; roomId?: string | null }) {
    const data = await serverRequest<{ photo: TravelPhoto }>('/api/photos', {
      method: 'POST',
      body: JSON.stringify(input),
    }, true);
    return data.photo;
  },

  async uploadPhotoFile(input: { file: Blob; filename: string; label: string; date?: string; source?: string; roomId?: string | null }) {
    const form = new FormData();
    form.append('file', input.file, input.filename);
    form.append('label', input.label);
    form.append('date', input.date || todayIsoDate());
    form.append('source', input.source || 'upload');
    if (input.roomId) form.append('roomId', input.roomId);

    const data = await serverRequest<{ photo: TravelPhoto }>('/api/photos', {
      method: 'POST',
      body: form,
    }, true);
    return data.photo;
  },

  async diaries(date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const data = await serverRequest<{ diaries: DiaryEntry[] }>(`/api/diaries${query}`, {}, true);
    return data.diaries || [];
  },

  async saveDiary(input: { date?: string; title?: string; text: string; photoIds?: string[]; imageDataUrl?: string | null }) {
    const data = await serverRequest<{ diary: DiaryEntry }>('/api/diaries', {
      method: 'POST',
      body: JSON.stringify(input),
    }, true);
    return data.diary;
  },

  async updateDiary(id: string, input: { title?: string; text?: string; photoIds?: string[]; imageDataUrl?: string | null }) {
    const data = await serverRequest<{ diary: DiaryEntry }>(`/api/diaries/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }, true);
    return data.diary;
  },

  async saveFourCut(input: { photoIds: string[]; filter: string; imageDataUrl?: string | null }) {
    const data = await serverRequest<{ fourCut: FourCut }>('/api/fourcuts', {
      method: 'POST',
      body: JSON.stringify(input),
    }, true);
    return data.fourCut;
  },

  async share(input: { kind: string; targetId?: string; channel?: string }) {
    return serverRequest<{ message: string }>('/api/share', {
      method: 'POST',
      body: JSON.stringify(input),
    }, true);
  },

  async inquiries() {
    const data = await serverRequest<{ inquiries: Inquiry[] }>('/api/inquiries', {}, true);
    return data.inquiries || [];
  },

  async saveInquiry(input: { category: string; message: string }) {
    const data = await serverRequest<{ inquiry: Inquiry }>('/api/inquiries', {
      method: 'POST',
      body: JSON.stringify(input),
    }, true);
    return data.inquiry;
  },

  async updateProfile(input: { displayName?: string; code?: string; photoDataUrl?: string | null }) {
    const data = await serverRequest<{ user: User }>('/api/me/profile', {
      method: 'PUT',
      body: JSON.stringify(input),
    }, true);
    const session = readServerSession();
    if (session?.token) saveServerSession(session.token, data.user);
    return data.user;
  },

  async updatePassword(input: { currentPassword: string; newPassword: string }) {
    await serverRequest<{ ok: boolean }>('/api/me/password', {
      method: 'PUT',
      body: JSON.stringify(input),
    }, true);
  },
};

const firebaseApi = {
  baseUrl: firebaseTargetLabel,

  async signup(username: string, password: string, displayName?: string) {
    assertFirebaseConfigured();
    const normalizedUsername = normalizeUsername(username);
    if (normalizedUsername.length < 3) throw new Error('아이디는 3자 이상이어야 합니다.');
    if (password.length < 6) throw new Error('Firebase Auth 비밀번호는 6자 이상이어야 합니다.');

    console.log('[firebase][signup] start', {
      username: normalizedUsername,
      key: usernameKey(normalizedUsername),
      timeoutMs: FIREBASE_REQUEST_TIMEOUT_MS,
    });

    let createdAuthSession: AuthRestSession | null = null;

    try {
      const available = await checkUsernameAvailabilityRest(normalizedUsername, '[firebase][signup:username-rest]');
      if (!available) throw new Error('이미 사용 중인 아이디입니다.');

      const email = usernameEmail(normalizedUsername);
      console.log('[signup] auth create user start');
      const authSession = await signupWithEmailPasswordRest(email, password);
      createdAuthSession = authSession;
      console.log('[signup] auth create user success:', {
        uid: authSession.uid,
        email: authSession.email,
      });

      const user: User = {
        id: authSession.uid,
        username: normalizedUsername,
        displayName: displayName || normalizedUsername || '여행자님',
        email,
        code: makeUserCode(),
        createdAt: now(),
      };

      const localMoneyReward: RewardTransaction = {
        id: makeId('reward'),
        userId: user.id,
        category: 'localMoney',
        amount: 5000,
        title: '가입 축하 지역화폐',
        desc: '첫 여행을 시작할 수 있도록 지급된 가입 보상입니다.',
        createdAt: now(),
      };
      const pointReward: RewardTransaction = {
        id: makeId('reward'),
        userId: user.id,
        category: 'points',
        amount: 1000,
        title: '가입 리워드 포인트',
        desc: '첫 여행 기록을 시작해보세요.',
        createdAt: now(),
      };

      await commitFirestoreDocumentsRest(
        [
          { path: `users/${user.id}`, data: { ...user } },
          {
            path: `usernames/${usernameKey(normalizedUsername)}`,
            data: {
              username: normalizedUsername,
              displayUsername: username.trim(),
              userId: user.id,
              email,
              createdAt: user.createdAt,
            },
          },
          { path: `rewardTransactions/${localMoneyReward.id}`, data: { ...localMoneyReward } },
          { path: `rewardTransactions/${pointReward.id}`, data: { ...pointReward } },
        ],
        authSession.idToken,
      );

      localStorage.setItem(
        TOKEN_KEY,
        JSON.stringify({
          ...authSession,
          username: normalizedUsername,
          displayName: user.displayName,
          createdAt: user.createdAt,
        }),
      );
      createdAuthSession = null;
      console.log('[signup] user profile created', {
        uid: user.id,
        usernamePath: `usernames/${usernameKey(normalizedUsername)}`,
      });
      console.log('[firebase][signup] finished:', user.id);
      return user;
    } catch (error) {
      console.error('[firebase][signup] failed detail:', errorDetail(error));
      if (createdAuthSession) {
        await deleteAuthUserRest(createdAuthSession.idToken).catch((rollbackError) => {
          console.error('[firebase][signup] rollback failed detail:', errorDetail(rollbackError));
        });
      }
      throw mapSignupError(error);
    }
  },

  async login(username: string, password: string) {
    assertFirebaseConfigured();
    try {
      const credential = await signInWithEmailAndPassword(auth, usernameEmail(username), password);
      const user = await loadUser(credential.user.uid);
      localStorage.removeItem(TOKEN_KEY);
      return user || requireAppUser();
    } catch (error) {
      throw mapFirebaseError(error, '로그인에 실패했습니다.');
    }
  },

  async checkUsername(username: string) {
    assertFirebaseConfigured();
    const normalizedUsername = normalizeUsername(username);
    if (normalizedUsername.length < 3) throw new Error('아이디는 3자 이상이어야 합니다.');

    try {
      return await checkUsernameAvailabilityRest(normalizedUsername, '[firebase][checkUsername:rest]');
    } catch (error) {
      throw mapFirebaseError(error, '아이디 확인 중 오류가 발생했습니다.');
    }
  },

  async logout() {
    await signOut(auth).catch(() => undefined);
    localStorage.removeItem(TOKEN_KEY);
  },

  async me() {
    try {
      const firebaseUser = await initialFirebaseUser();
      if (!firebaseUser) return null;
      return loadUser(firebaseUser.uid);
    } catch {
      return null;
    }
  },

  async friends(queryText = '') {
    await requireAppUser();
    const normalizedQuery = queryText.trim().toLowerCase();
    if (!normalizedQuery) return [] as Friend[];

    const snapshot = await getDocs(query(collection(db, 'users'), where('username', '==', normalizedQuery)));
    return snapshot.docs
      .map((item) => userFromData(item.id, item.data()))
      .filter((user) => user.id !== auth.currentUser?.uid)
      .map((user) => friendFromUser(user));
  },

  async rooms() {
    const user = await requireAppUser();
    const snapshot = await getDocs(collection(db, 'rooms'));
    return snapshot.docs
      .map((item) => roomFromData(item.id, item.data()))
      .filter((room) => room.ownerId === user.id || room.members.some((member) => member.id === user.id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createRoom(input: { name?: string; memberIds: string[]; planText?: string }) {
    const user = await requireAppUser();
    const selectedUsers = await userDocsByIds(input.memberIds || []);
    const room: TripRoom = {
      id: makeId('room'),
      ownerId: user.id,
      name: String(input.name || `${user.displayName}님의 여행방`).trim(),
      inviteCode: makeInviteCode(),
      planText: String(input.planText || '').trim(),
      members: [friendFromUser(user, true), ...selectedUsers.map((member) => friendFromUser(member))],
      createdAt: now(),
    };

    await setDoc(doc(db, 'rooms', room.id), room);
    return room;
  },

  async joinRoom(inviteCode: string) {
    const user = await requireAppUser();
    const code = normalizeInviteCode(inviteCode);
    if (!code) throw new Error('초대코드를 입력해주세요.');

    const snapshot = await getDocs(query(collection(db, 'rooms'), where('inviteCode', '==', code)));
    const roomDoc = snapshot.docs[0];
    if (!roomDoc) throw new Error('일치하는 초대코드의 방을 찾을 수 없습니다.');

    const room = roomFromData(roomDoc.id, roomDoc.data());
    if (room.ownerId === user.id || room.members.some((member) => member.id === user.id)) return room;

    const members = [...room.members, friendFromUser(user)];
    await updateDoc(doc(db, 'rooms', room.id), { members });
    return { ...room, members };
  },

  async missions(roomId?: string | null) {
    const user = await requireAppUser();
    return missionStatuses(user.id, roomId);
  },

  async completeMission(missionId: number, photoId?: string, earnedPoints = 100, roomId?: string | null, title?: string) {
    const user = await requireAppUser();
    const mission = MISSIONS.find((item) => item.id === missionId);
    if (!mission) throw new Error('미션을 찾을 수 없습니다.');
    const targetRoomId = roomId || null;
    const missionTitle = String(title || mission.title).trim();

    const existingSnapshot = await getDocs(
      query(collection(db, 'missionCompletions'), where('userId', '==', user.id)),
    );
    const existing = existingSnapshot.docs
      .map((item) => missionCompletionFromData(item.id, item.data()))
      .find((item) => item.missionId === missionId && (item.roomId || null) === targetRoomId);

    if (!existing) {
      const completedAt = now();
      const completion = {
        id: makeId('mission'),
        userId: user.id,
        roomId: targetRoomId,
        missionId,
        photoId: photoId || null,
        completedAt,
      };
      const localMoneyReward: RewardTransaction = {
        id: makeId('reward'),
        userId: user.id,
        category: 'localMoney',
        amount: 1000,
        title: `${missionTitle} 지역화폐 적립`,
        desc: '여행 미션 인증 보상',
        missionId,
        roomId: targetRoomId,
        createdAt: completedAt,
      };
      const pointReward: RewardTransaction = {
        id: makeId('reward'),
        userId: user.id,
        category: 'points',
        amount: Math.max(0, Math.round(earnedPoints)),
        title: `${missionTitle} 리워드`,
        desc: '미션 완료 포인트',
        missionId,
        roomId: targetRoomId,
        createdAt: completedAt,
      };

      const batch = writeBatch(db);
      batch.set(doc(db, 'missionCompletions', completion.id), completion);
      batch.set(doc(db, 'rewardTransactions', localMoneyReward.id), localMoneyReward);
      batch.set(doc(db, 'rewardTransactions', pointReward.id), pointReward);
      await batch.commit();
    }

    const [missions, transactions] = await Promise.all([missionStatuses(user.id, targetRoomId), rewardTransactionsForUser(user.id)]);
    return { missions, rewards: rewardSummary(transactions) };
  },

  async rewards() {
    const user = await requireAppUser();
    const transactions = await rewardTransactionsForUser(user.id);
    return rewardSummary(transactions);
  },

  async convertLocalCurrency(input: { amount: number; regionName: string; currency: string }) {
    const user = await requireAppUser();
    const transactions = await rewardTransactionsForUser(user.id);
    const pointsBalance = transactions
      .filter((item) => item.category === 'points')
      .reduce((sum, item) => sum + item.amount, 0);
    const amount = Math.max(0, Math.round(input.amount));
    if (amount <= 0 || amount > pointsBalance) throw new Error('보유 포인트가 부족합니다.');

    const transaction: RewardTransaction = {
      id: makeId('reward'),
      userId: user.id,
      category: 'points',
      amount: -amount,
      title: `${input.regionName} ${input.currency} 전환`,
      desc: '지역화폐 전환 내역',
      createdAt: now(),
    };
    await setDoc(doc(db, 'rewardTransactions', transaction.id), transaction);
    return { rewards: rewardSummary([...transactions, transaction]) };
  },

  async photos(month?: string, roomId?: string | null) {
    const user = await requireAppUser();
    const snapshot = await getDocs(query(collection(db, 'photos'), where('userId', '==', user.id)));
    const targetRoomId = roomId || null;
    return snapshot.docs
      .map((item) => photoFromData(item.id, item.data()))
      .filter((photo) => !month || photo.date.startsWith(month))
      .filter((photo) => !roomId || (photo.roomId || null) === targetRoomId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async uploadPhoto(input: { dataUrl: string; label: string; date?: string; source?: string; roomId?: string | null }) {
    console.info('[firebase][photos] TODO: Firebase Storage 보류로 실제 이미지 업로드는 수행하지 않습니다.');
    return createPhotoMetadata({
      label: input.label,
      date: input.date,
      source: input.source,
      roomId: input.roomId || null,
      mimeType: input.dataUrl.match(/^data:([^;]+);/)?.[1] || null,
    });
  },

  async uploadPhotoFile(input: { file: Blob; filename: string; label: string; date?: string; source?: string; roomId?: string | null }) {
    console.info('[firebase][photos] TODO: Firebase Storage 보류로 Blob 파일 업로드는 수행하지 않습니다.', {
      filename: input.filename,
    });
    return createPhotoMetadata({
      label: input.label,
      date: input.date || todayIsoDate(),
      source: input.source || 'upload',
      roomId: input.roomId || null,
      filename: input.filename,
      mimeType: input.file.type || null,
    });
  },

  async diaries(date?: string) {
    const user = await requireAppUser();
    const snapshot = await getDocs(query(collection(db, 'diaries'), where('userId', '==', user.id)));
    return snapshot.docs
      .map((item) => diaryFromData(item.id, item.data()))
      .filter((diary) => !date || diary.date === date)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async saveDiary(input: { date?: string; title?: string; text: string; photoIds?: string[]; imageDataUrl?: string | null }) {
    const user = await requireAppUser();
    const diary: DiaryEntry = {
      id: makeId('diary'),
      userId: user.id,
      date: input.date || todayIsoDate(),
      title: String(input.title || '오늘의 여행').trim(),
      text: String(input.text || ''),
      photoIds: Array.isArray(input.photoIds) ? input.photoIds : [],
      imageDataUrl: input.imageDataUrl || null,
      createdAt: now(),
      updatedAt: now(),
    };
    await setDoc(doc(db, 'diaries', diary.id), diary);
    return diary;
  },

  async updateDiary(id: string, input: { title?: string; text?: string; photoIds?: string[]; imageDataUrl?: string | null }) {
    const user = await requireAppUser();
    const diaryRef = doc(db, 'diaries', id);
    const snapshot = await getDoc(diaryRef);
    if (!snapshot.exists()) throw new Error('다이어리를 찾을 수 없습니다.');

    const current = diaryFromData(snapshot.id, snapshot.data());
    if (current.userId !== user.id) throw new Error('다이어리를 수정할 권한이 없습니다.');

    const next = {
      title: input.title !== undefined ? String(input.title).trim() : current.title,
      text: input.text !== undefined ? String(input.text) : current.text,
      photoIds: Array.isArray(input.photoIds) ? input.photoIds : current.photoIds,
      imageDataUrl: input.imageDataUrl !== undefined ? input.imageDataUrl : current.imageDataUrl,
      updatedAt: now(),
    };
    await updateDoc(diaryRef, next);
    return { ...current, ...next };
  },

  async saveFourCut(input: { photoIds: string[]; filter: string; imageDataUrl?: string | null }) {
    const user = await requireAppUser();
    const fourCut: FourCut = {
      id: makeId('fourcut'),
      userId: user.id,
      photoIds: Array.isArray(input.photoIds) ? input.photoIds.slice(0, 4) : [],
      filter: String(input.filter || '감성'),
      imageDataUrl: null,
      createdAt: now(),
    };
    await setDoc(doc(db, 'fourCuts', fourCut.id), {
      ...fourCut,
      imageDataUrl: null,
      storageStatus: 'todo-storage-disabled',
      storageTodo: 'Firebase Storage 보류로 네컷 완성 이미지는 아직 저장하지 않습니다.',
    });
    console.info('[firebase][fourCuts] TODO: imageDataUrl 저장은 Storage 전환 단계에서 처리합니다.');
    return fourCut;
  },

  async share(input: { kind: string; targetId?: string; channel?: string }) {
    const user = await requireAppUser();
    const share = {
      id: makeId('share'),
      userId: user.id,
      kind: String(input.kind || 'moment'),
      targetId: String(input.targetId || ''),
      channel: String(input.channel || 'system'),
      createdAt: now(),
    };
    await setDoc(doc(db, 'shares', share.id), share);
    return { message: '공유 기록이 저장되었습니다.' };
  },

  async inquiries() {
    const user = await requireAppUser();
    const snapshot = await getDocs(query(collection(db, 'inquiries'), where('userId', '==', user.id)));
    return snapshot.docs
      .map((item) => ({ id: item.id, ...(item.data() as Omit<Inquiry, 'id'>) }))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  },

  async saveInquiry(input: { category: string; message: string }) {
    const user = await requireAppUser();
    const inquiry: Inquiry = {
      id: makeId('inquiry'),
      userId: user.id,
      category: input.category,
      message: input.message,
      createdAt: now(),
    };
    await setDoc(doc(db, 'inquiries', inquiry.id), inquiry);
    return inquiry;
  },

  async updateProfile(input: { displayName?: string; code?: string; photoDataUrl?: string | null }) {
    const user = await requireAppUser();
    const next = {
      ...user,
      displayName: input.displayName || user.displayName,
      code: input.code || user.code,
    };
    await setDoc(doc(db, 'users', user.id), next, { merge: true });
    return next;
  },

  async updatePassword(_input: { currentPassword: string; newPassword: string }) {
    throw new Error('Firebase fallback의 비밀번호 변경은 계정 관리 화면의 Firebase 직접 처리로만 지원됩니다.');
  },
};

export const api = supabaseRequested ? supabaseApi : shouldUseServerApi() ? serverApi : firebaseApi;

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value);
}

export async function fileToCompressedDataUrl(file: File, maxSize = 1280, quality = 0.82) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);

  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return dataUrl;
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'));
    image.src = src;
  });
}

export async function shareText(title: string, text: string) {
  const sharePayload = `${title}\n${text}`;

  if (navigator.share) {
    await navigator.share({ title, text });
    return;
  }

  if (navigator.clipboard) {
    await navigator.clipboard.writeText(sharePayload);
    return;
  }

  window.prompt('아래 내용을 복사해 공유하세요.', sharePayload);
}
