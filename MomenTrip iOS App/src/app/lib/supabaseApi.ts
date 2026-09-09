import { getSupabase, supabaseAuthEmail } from '../../lib/supabase';
import type { User, Friend, TripRoom, TravelPhoto, DiaryEntry, FourCut, RewardSummary, RewardTransaction, MissionStatus } from '../types';
import { isValidLoginId } from './authId';

const BUCKET = 'momentrip-photos';
const today = () => new Date().toISOString().slice(0, 10);
type Row = Record<string, any>;
function checked<T extends { data?: unknown; error: { message: string } | null }>(result: T): NonNullable<T['data']> {
  if (result.error) throw new Error(result.error.message);
  return result.data as NonNullable<T['data']>;
}
// PostgREST caps result sets. Page through records so old history/balances are not truncated.
async function allRows(query: any): Promise<Row[]> {
  const result: Row[] = [];
  for (;;) {
    const page = checked(await query.range(result.length, result.length + 499)) as Row[];
    if (!page.length) return result;
    result.push(...page);
  }
}
async function rpc<T>(name: string, args: Row = {}): Promise<T> {
  return checked(await getSupabase().rpc(name, args)) as T;
}
function toUser(row: Row): User {
  return { id: row.id, username: row.username, displayName: row.display_name, email: row.email, code: row.code, createdAt: row.created_at };
}
async function currentProfile(): Promise<Row | null> {
  const { session } = checked(await getSupabase().auth.getSession());
  if (!session) return null;
  return checked(await getSupabase().from('profiles').select('*').eq('auth_id', session.user.id).single());
}
async function requireProfile(): Promise<Row> {
  const profile = await currentProfile();
  if (!profile) throw new Error('로그인이 필요합니다.');
  return profile;
}
async function cacheProfile(row: Row): Promise<User> {
  const user = toUser(row);
  // Compatibility metadata only. Supabase owns and refreshes the actual auth session.
  localStorage.setItem('momentrip_token', JSON.stringify({ provider: 'supabase', user }));
  localStorage.setItem('momentrip.accountProfile', JSON.stringify({ displayName: user.displayName, userCode: user.code, photoDataUrl: await readImage(row.avatar_path) }));
  return user;
}
async function blobDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
  return `data:${blob.type || 'image/jpeg'};base64,${btoa(binary)}`;
}
async function dataUrlBlob(value: string): Promise<Blob> {
  const match = /^data:(image\/(?:jpeg|png|webp|gif|heic|heif));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(value);
  if (!match) throw new Error('지원하는 이미지 파일을 선택해주세요.');
  const binary = atob(match[2]);
  return new Blob([Uint8Array.from(binary, char => char.charCodeAt(0))], { type: match[1] });
}
async function readImage(path?: string | null): Promise<string | null> {
  if (!path) return null;
  const blob = checked(await getSupabase().storage.from(BUCKET).download(path));
  return blobDataUrl(blob);
}
async function storeImage(userId: string, blob: Blob): Promise<string> {
  if (!/^image\/(jpeg|png|webp|gif|heic|heif)$/.test(blob.type) || blob.size > 16 * 1024 * 1024) throw new Error('16MB 이하의 이미지 파일을 선택해주세요.');
  const path = `${userId}/${crypto.randomUUID()}`;
  checked(await getSupabase().storage.from(BUCKET).upload(path, blob, { contentType: blob.type, upsert: false }));
  return path;
}
async function removeImage(path?: string | null) {
  if (path) checked(await getSupabase().storage.from(BUCKET).remove([path]));
}
async function rollbackImage(path?: string | null) {
  try { await removeImage(path); } catch { console.warn('사용하지 않는 이미지 정리가 필요합니다.'); }
}
async function toPhoto(row: Row): Promise<TravelPhoto> {
  return { id: row.id, userId: row.user_id, label: row.label, date: row.date, dataUrl: (await readImage(row.storage_path))!, source: row.source, roomId: row.room_id, filename: row.filename, uploadPath: null, mimeType: row.mime_type, createdAt: row.created_at };
}
async function toDiary(row: Row): Promise<DiaryEntry> {
  return { id: row.id, userId: row.user_id, date: row.date, title: row.title, text: row.text, photoIds: row.photo_ids, imageDataUrl: await readImage(row.image_path), createdAt: row.created_at, updatedAt: row.updated_at };
}
async function toFourCut(row: Row): Promise<FourCut> {
  return { id: row.id, userId: row.user_id, photoIds: row.photo_ids, filter: row.filter, imageDataUrl: await readImage(row.image_path), createdAt: row.created_at };
}
async function room(id: string): Promise<TripRoom> {
  const row = checked(await getSupabase().from('rooms').select('*,room_members(*)').eq('id', id).single());
  return toRoom(row);
}
function toRoom(row: Row): TripRoom {
  return { id: row.id, ownerId: row.owner_id, name: row.name, inviteCode: row.invite_code, planText: row.plan_text, createdAt: row.created_at,
    members: [...row.room_members.map((member: Row) => ({ id: member.user_id, name: member.name, code: member.code, emoji: member.emoji, owner: member.owner })), ...(row.legacy_members || [])] };
}
function passwordValid(password: string) {
  if (password.length < 6 || password.length > 72) throw new Error('비밀번호는 6~72자로 입력해 주세요.');
}
const MISSIONS = [
  { id: 1, icon: '🍜', title: '현지 음식 먹기', desc: '여행지의 대표 음식을 맛보세요', reward: 300 },
  { id: 2, icon: '🌆', title: '야경 사진 찍기', desc: '아름다운 밤 풍경을 담아요', reward: 500 },
  { id: 3, icon: '🥟', title: '길거리 음식 시도', desc: '현지 로컬 길거리 음식 도전', reward: 200 },
  { id: 4, icon: '💬', title: '낯선 사람과 대화', desc: '현지인과 친해져 보세요', reward: 800 },
  { id: 5, icon: '☕', title: '현지 카페 방문', desc: '숨겨진 로컬 카페 발견하기', reward: 100 },
  { id: 6, icon: '🤳', title: '랜드마크 셀카', desc: '여행지 대표 명소 인증샷', reward: 1000 },
];
export const supabaseApi = {
  baseUrl: () => 'supabase',
  async signup(username: string, password: string, displayName = '여행자님'): Promise<User> {
    if (!isValidLoginId(username)) throw new Error('올바른 아이디를 입력해주세요.');
    passwordValid(password);
    const { session } = checked(await getSupabase().auth.signUp({ email: await supabaseAuthEmail(username), password,
      options: { data: { username: username.trim().toLowerCase(), display_name: displayName } } }));
    if (!session) throw new Error('아이디 가입을 사용하려면 Supabase의 이메일 확인 설정을 해제해야 합니다.');
    return cacheProfile(await requireProfile());
  },
  async login(username: string, password: string): Promise<User> {
    checked(await getSupabase().auth.signInWithPassword({ email: await supabaseAuthEmail(username), password }));
    return cacheProfile(await requireProfile());
  },
  async checkUsername(username: string): Promise<boolean> {
    if (!isValidLoginId(username)) throw new Error('올바른 아이디를 입력해주세요.');
    return rpc('check_username', { p_username: username.trim().toLowerCase() });
  },
  async logout() {
    checked(await getSupabase().auth.signOut());
    localStorage.removeItem('momentrip_token');
    localStorage.removeItem('momentrip.accountProfile');
  },
  async me(): Promise<User | null> {
    const profile = await currentProfile();
    return profile ? toUser(profile) : null;
  },
  async friends(query = ''): Promise<Friend[]> { return rpc('find_friends', { p_query: query.trim() }); },
  async rooms(): Promise<TripRoom[]> {
    return (await allRows(getSupabase().from('rooms').select('*,room_members(*)').order('created_at', { ascending: false }).order('id'))).map(toRoom);
  },
  room,
  async createRoom(input: { name?: string; memberIds: string[]; planText?: string }): Promise<TripRoom> {
    return room(await rpc('create_room', { p_name: input.name || '', p_member_ids: input.memberIds, p_plan_text: input.planText || '' }));
  },
  async joinRoom(inviteCode: string): Promise<TripRoom> { return room(await rpc('join_room', { p_invite_code: inviteCode.trim().toUpperCase() })); },
  async missions(roomId?: string | null): Promise<MissionStatus[]> {
    if (roomId) await room(roomId);
    let query = getSupabase().from('mission_completions').select('*');
    query = roomId ? query.eq('room_id', roomId) : query.is('room_id', null);
    const rows = checked(await query);
    return MISSIONS.map(mission => { const row = rows.find(item => item.mission_id === mission.id); return { ...mission, completed: !!row, completedAt: row?.completed_at || null, photoId: row?.photo_id || null }; });
  },
  async completeMission(missionId: number, photoId?: string, earnedPoints?: number, roomId?: string | null, title?: string) {
    await rpc('complete_mission', { p_mission_id: missionId, p_photo_id: photoId || null, p_room_id: roomId || null, p_earned_points: earnedPoints === undefined ? null : Math.round(earnedPoints), p_title: title || null });
    return { missions: await supabaseApi.missions(roomId), rewards: await supabaseApi.rewards() };
  },
  async rewards(): Promise<RewardSummary> {
    const rows = await allRows(getSupabase().from('reward_transactions').select('*').order('created_at', { ascending: false }).order('id'));
    const transactions: RewardTransaction[] = rows.map(row => ({ id: row.id, userId: row.user_id, category: row.category, amount: row.amount, title: row.title, desc: row.description, missionId: row.mission_id, roomId: row.room_id, createdAt: row.created_at }));
    return { transactions, balances: transactions.reduce((sum, row) => ({ ...sum, [row.category]: sum[row.category] + row.amount }), { points: 0, localMoney: 0 }) };
  },
  async convertLocalCurrency(input: { amount: number; regionName: string; currency: string }) {
    await rpc('convert_currency', { p_amount: input.amount, p_region_name: input.regionName, p_currency: input.currency });
    return { rewards: await supabaseApi.rewards() };
  },
  async photos(month?: string, roomId?: string | null): Promise<TravelPhoto[]> {
    let query = getSupabase().from('photos').select('*').order('created_at', { ascending: false });
    if (roomId) { await room(roomId); query = query.eq('room_id', roomId); }
    if (month) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('조회 월은 YYYY-MM 형식이어야 합니다.');
      const [year, number] = month.split('-').map(Number);
      query = query.gte('date', `${month}-01`).lt('date', `${number === 12 ? year + 1 : year}-${String(number === 12 ? 1 : number + 1).padStart(2,'0')}-01`);
    }
    return Promise.all((await allRows(query.order('id'))).map(toPhoto));
  },
  async uploadPhoto(input: { dataUrl: string; label: string; date?: string; source?: string; roomId?: string | null }): Promise<TravelPhoto> {
    return supabaseApi.uploadPhotoFile({ ...input, file: await dataUrlBlob(input.dataUrl), filename: 'photo' });
  },
  async uploadPhotoFile(input: { file: Blob; filename: string; label: string; date?: string; source?: string; roomId?: string | null }): Promise<TravelPhoto> {
    const profile = await requireProfile();
    const path = await storeImage(profile.id, input.file);
    let row: Row;
    try {
      row = checked(await getSupabase().from('photos').insert({ user_id: profile.id, storage_path: path, label: input.label.trim().slice(0,100) || '여행 사진', date: input.date || today(), source: input.source || 'upload', room_id: input.roomId || null, filename: input.filename, mime_type: input.file.type }).select().single());
    } catch (error) { await rollbackImage(path); throw error; }
    return toPhoto(row);
  },
  async deletePhoto(id: string) {
    const row = checked(await getSupabase().from('photos').select('storage_path').eq('id', id).single());
    checked(await getSupabase().from('photos').delete().eq('id', id));
    await removeImage(row.storage_path);
  },
  async diaries(date?: string): Promise<DiaryEntry[]> {
    let query = getSupabase().from('diaries').select('*').order('updated_at', { ascending: false });
    if (date) query = query.eq('date', date);
    return Promise.all((await allRows(query.order('id'))).map(toDiary));
  },
  async saveDiary(input: { date?: string; title?: string; text: string; photoIds?: string[]; imageDataUrl?: string | null }): Promise<DiaryEntry> {
    const profile = await requireProfile();
    const path = input.imageDataUrl ? await storeImage(profile.id, await dataUrlBlob(input.imageDataUrl)) : null;
    let row: Row;
    try { row = checked(await getSupabase().from('diaries').insert({ user_id: profile.id, date: input.date || today(), title: input.title?.trim() || '오늘의 여행', text: input.text, photo_ids: [...new Set(input.photoIds || [])], image_path: path }).select().single()); }
    catch (error) { await rollbackImage(path); throw error; }
    return toDiary(row);
  },
  async updateDiary(id: string, input: { title?: string; text?: string; photoIds?: string[]; imageDataUrl?: string | null }): Promise<DiaryEntry> {
    const profile = await requireProfile();
    const old = checked(await getSupabase().from('diaries').select('image_path').eq('id', id).single());
    const change: Row = {};
    if (input.title !== undefined) change.title = input.title.trim();
    if (input.text !== undefined) change.text = input.text;
    if (input.photoIds !== undefined) change.photo_ids = [...new Set(input.photoIds)];
    if (input.imageDataUrl !== undefined) change.image_path = input.imageDataUrl ? await storeImage(profile.id, await dataUrlBlob(input.imageDataUrl)) : null;
    let row: Row;
    try { row = checked(await getSupabase().from('diaries').update(change).eq('id', id).select().single()); }
    catch (error) { await rollbackImage(change.image_path); throw error; }
    if (input.imageDataUrl !== undefined) await rollbackImage(old.image_path);
    return toDiary(row);
  },
  async saveFourCut(input: { photoIds: string[]; filter: string; imageDataUrl?: string | null }): Promise<FourCut> {
    const profile = await requireProfile();
    const path = input.imageDataUrl ? await storeImage(profile.id, await dataUrlBlob(input.imageDataUrl)) : null;
    let row: Row;
    try { row = checked(await getSupabase().from('four_cuts').insert({ user_id: profile.id, photo_ids: [...new Set(input.photoIds)], filter: input.filter, image_path: path }).select().single()); }
    catch (error) { await rollbackImage(path); throw error; }
    return toFourCut(row);
  },
  async fourCuts(): Promise<FourCut[]> { return Promise.all((await allRows(getSupabase().from('four_cuts').select('*').order('created_at', { ascending: false }).order('id'))).map(toFourCut)); },
  async share(input: { kind: string; targetId?: string; channel?: string }): Promise<{ message: string }> {
    const profile = await requireProfile();
    checked(await getSupabase().from('shares').insert({ user_id: profile.id, kind: input.kind, target_id: input.targetId || null, channel: input.channel || 'system' }));
    return { message: '공유 기록이 저장되었습니다.' };
  },
  async inquiries() {
    return checked(await getSupabase().from('inquiries').select('*').order('created_at', { ascending: false }).limit(20)).map(row => ({ id: row.id, userId: row.user_id, category: row.category, message: row.message, createdAt: row.created_at }));
  },
  async saveInquiry(input: { category: string; message: string }) {
    const profile = await requireProfile();
    const row = checked(await getSupabase().from('inquiries').insert({ user_id: profile.id, category: input.category.trim(), message: input.message.trim() }).select().single());
    return { id: row.id, userId: row.user_id, category: row.category, message: row.message, createdAt: row.created_at };
  },
  async updateProfile(input: { displayName?: string; code?: string; photoDataUrl?: string | null }): Promise<User> {
    const profile = await requireProfile();
    const change: Row = { updated_at: new Date().toISOString() };
    if (input.displayName !== undefined) change.display_name = input.displayName.trim();
    if (input.code !== undefined) change.code = `#${input.code.replace(/^#/, '').trim()}`;
    if (input.photoDataUrl !== undefined) change.avatar_path = input.photoDataUrl ? await storeImage(profile.id, await dataUrlBlob(input.photoDataUrl)) : null;
    let row: Row;
    try { row = checked(await getSupabase().from('profiles').update(change).eq('id', profile.id).select().single()); }
    catch (error) { await rollbackImage(change.avatar_path); throw error; }
    if (input.photoDataUrl !== undefined) await rollbackImage(profile.avatar_path);
    return cacheProfile(row);
  },
  async updatePassword(input: { currentPassword: string; newPassword: string }) {
    passwordValid(input.newPassword);
    const profile = await requireProfile();
    checked(await getSupabase().auth.signInWithPassword({ email: await supabaseAuthEmail(profile.username), password: input.currentPassword }));
    checked(await getSupabase().auth.updateUser({ password: input.newPassword }));
  },
};
