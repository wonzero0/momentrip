import { useEffect, useState } from 'react';
import { Plus, Check, Search, Link, Hash, DoorOpen, Copy, ChevronRight } from 'lucide-react';
import { AppScreen } from '../App';
import { api } from '../lib/api';
import { copyText } from '../lib/clipboard';
import type { Friend, TripRoom } from '../types';

interface Props {
  onNavigate: (s: AppScreen) => void;
  onHome: () => void;
  activeTrip: TripRoom | null;
  onTripStarted: (room: TripRoom) => void;
}

type Phase = 'home' | 'friendList' | 'planQuestion' | 'planInput';

export function GatiTab({ onNavigate, onHome, activeTrip, onTripStarted }: Props) {
  const [phase, setPhase] = useState<Phase>('home');
  const [selected, setSelected] = useState<string[]>([]);
  const [planText, setPlanText] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState<Friend | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [rooms, setRooms] = useState<TripRoom[]>([]);
  const [savingRoom, setSavingRoom] = useState(false);
  const [notice, setNotice] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const selectedFriends = friends.filter(f => selected.includes(f.id));
  const primaryRoom = rooms[0] ?? null;
  const roomMembers = primaryRoom?.members ?? [];
  const inviteCode = primaryRoom?.inviteCode ?? '';
  const inviteLink = inviteCode ? `momentrip.app/room/${inviteCode}` : '방 생성 후 표시됩니다';

  const loadRooms = async () => {
    try {
      setRooms(await api.rooms());
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '방 목록을 불러오지 못했습니다.');
    }
  };

  const loadFriends = async (queryText = '') => {
    try {
      const result = await api.friends(queryText);
      setFriends(result);
      return result;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '친구 목록을 불러오지 못했습니다.');
      return [] as Friend[];
    }
  };

  useEffect(() => {
    void loadRooms();
    void loadFriends();
  }, []);

  const toggleFriend = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const handleSearch = async () => {
    const result = await loadFriends(searchCode);
    const found = result[0];
    setSearchResult(found ?? null);
  };

  const handleAddSearchResult = () => {
    if (!searchResult) return;
    toggleFriend(searchResult.id);
    setPhase('friendList');
  };

  const handleCreateRoom = async (withPlan: boolean) => {
    setSavingRoom(true);
    setNotice('');
    try {
      const room = await api.createRoom({
        name: selectedFriends.length ? '함께 떠나는 여행방' : '나의 여행방',
        memberIds: selected,
        planText: withPlan ? planText : '',
      });
      onTripStarted(room);
      await loadRooms();
      setSelected([]);
      setPlanText('');
      onNavigate('mission');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '방 생성에 실패했습니다.');
    } finally {
      setSavingRoom(false);
    }
  };

  const copyInviteText = async (value: string, copied: (value: boolean) => void) => {
    if (!inviteCode) {
      setNotice('먼저 여행방을 생성하면 초대코드가 발급됩니다.');
      return;
    }

    try {
      await copyText(value);
      copied(true);
      setTimeout(() => copied(false), 2000);
    } catch {
      setNotice('클립보드 접근이 제한되었습니다. 초대코드를 직접 전달해주세요.');
    }
  };

  const handleCopyLink = () => void copyInviteText(inviteLink, setLinkCopied);
  const handleCopyCode = () => void copyInviteText(inviteCode, setCodeCopied);

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      setNotice('초대코드를 입력해주세요.');
      return;
    }

    setSavingRoom(true);
    setNotice('');
    try {
      const room = await api.joinRoom(joinCode);
      onTripStarted(room);
      await loadRooms();
      setJoinCode('');
      setShowJoinInput(false);
      setNotice(`${room.name}에 참여했습니다.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '방 참여에 실패했습니다.');
    } finally {
      setSavingRoom(false);
    }
  };

  // ─── Home phase ───
  if (phase === 'home') {
    return (
      <div className="w-full h-full flex flex-col" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
        {/* Sub-header */}
<div className="px-5 pt-4 pb-3 flex-shrink-0 flex justify-center">
  <div style={{ textAlign: 'center' }}>
    <p
      style={{
        fontSize: 14,
        fontWeight: 700,
        color: '#2A1F1A',
      }}
    >
      같이가유
    </p>
    {activeTrip && (
      <p style={{ fontSize: 10, color: '#9E8B7E', marginTop: 2 }}>현재 여행: {activeTrip.name}</p>
    )}
  </div>
</div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">

          {/* ① Friend code search */}
          <div className="mb-4">
            <p style={{ fontSize: 12, fontWeight: 700, color: '#9E8B7E', letterSpacing: '0.05em', marginBottom: 8 }}>
              친구 코드 검색
            </p>
            <div className="flex gap-2">
              <div
                className="flex-1 flex items-center rounded-2xl px-3"
                style={{ height: 48, background: '#F0EAE2' }}
              >
                <Hash size={14} color="#9E8B7E" className="mr-2 flex-shrink-0" />
                <input
                  className="flex-1 bg-transparent outline-none"
                  style={{ fontSize: 14, color: '#2A1F1A', fontFamily: "'Noto Sans KR', sans-serif" }}
                  placeholder="#1234 코드 입력"
                  value={searchCode}
                  onChange={e => setSearchCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                className="rounded-2xl px-4 active:scale-95 transition-all flex-shrink-0"
                style={{ height: 48, background: '#2A1F1A', color: '#FAF8F5', fontSize: 13, fontWeight: 600, border: 'none' }}
              >
                <Search size={16} color="#FAF8F5" />
              </button>
            </div>
            {searchResult && (
              <div
                className="mt-2 flex items-center gap-3 rounded-2xl p-3"
                style={{ background: '#FFFFFF', border: '1.5px solid rgba(201,124,86,0.2)' }}
              >
                <span style={{ fontSize: 22 }}>{searchResult.emoji}</span>
                <div className="flex-1">
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2A1F1A' }}>{searchResult.name}</p>
                  <p style={{ fontSize: 11, color: '#9E8B7E' }}>{searchResult.code}</p>
                </div>
                <button
                  onClick={handleAddSearchResult}
                  className="px-3 py-1.5 rounded-xl active:scale-95 text-xs font-semibold"
                  style={{ background: '#C97C56', color: '#FFF', border: 'none' }}
                >
                  추가
                </button>
              </div>
            )}
            {!searchResult && searchCode && (
              <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 8 }}>
                검색 결과가 없으면 상대방도 회원가입을 먼저 해야 합니다.
              </p>
            )}
            {notice && (
              <p className="rounded-xl px-3 py-2 mt-2" style={{ fontSize: 11, color: '#6B5040', background: '#F5EFE6' }}>
                {notice}
              </p>
            )}
          </div>

          {/* ② Create / Join buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setPhase('friendList')}
              className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
              style={{ background: '#2A1F1A', color: '#FAF8F5', fontSize: 14, fontWeight: 700, border: 'none', boxShadow: '0 6px 16px rgba(42,31,26,0.2)' }}
            >
              <Plus size={16} />방 생성하기
            </button>
            <button
              onClick={() => setShowJoinInput(!showJoinInput)}
              className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
              style={{ background: '#F5EFE6', color: '#2A1F1A', fontSize: 14, fontWeight: 700, border: '1.5px solid rgba(201,124,86,0.25)' }}
            >
              <DoorOpen size={16} />방 참여하기
            </button>
          </div>

          {/* Join input */}
          {showJoinInput && (
            <div className="mb-4 flex gap-2">
              <div
                className="flex-1 flex items-center rounded-2xl px-3"
                style={{ height: 48, background: '#F0EAE2' }}
              >
                <input
                  className="flex-1 bg-transparent outline-none"
                  style={{ fontSize: 14, color: '#2A1F1A', fontFamily: "'Noto Sans KR', sans-serif" }}
                  placeholder="초대 코드 입력 (예: XYZ-9912)"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && void handleJoinRoom()}
                />
              </div>
              <button
                className="rounded-2xl px-4 active:scale-95 flex-shrink-0"
                style={{ height: 48, background: savingRoom ? '#CDBEB2' : '#C97C56', color: '#FFF', fontSize: 13, fontWeight: 600, border: 'none' }}
                onClick={() => void handleJoinRoom()}
                disabled={savingRoom}
              >
                {savingRoom ? '입장 중' : '입장'}
              </button>
            </div>
          )}

          {/* ③ Invite section */}
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}
          >
            <p style={{ fontSize: 12, fontWeight: 700, color: '#2A1F1A', marginBottom: 12 }}>초대하기</p>
            {/* Invite link */}
            <div className="mb-3">
              <p style={{ fontSize: 10, color: '#9E8B7E', marginBottom: 6 }}>초대 링크</p>
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 flex items-center gap-2 rounded-xl px-3"
                  style={{ height: 40, background: '#FAF8F5', border: '1px solid rgba(42,31,26,0.08)' }}
                >
                  <Link size={12} color="#C97C56" />
                  <span style={{ fontSize: 12, color: '#2A1F1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inviteLink}
                  </span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 flex-shrink-0"
                  style={{ background: linkCopied ? '#C97C56' : '#EDE5DB' }}
                >
                  {linkCopied ? <Check size={14} color="#FFF" /> : <Copy size={14} color="#2A1F1A" />}
                </button>
              </div>
            </div>
            {/* Invite code */}
            <div>
              <p style={{ fontSize: 10, color: '#9E8B7E', marginBottom: 6 }}>초대 코드</p>
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 flex items-center gap-2 rounded-xl px-3"
                  style={{ height: 40, background: '#FAF8F5', border: '1px solid rgba(42,31,26,0.08)' }}
                >
                  <Hash size={12} color="#C97C56" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A', letterSpacing: '0.1em' }}>
                    {inviteCode || '------'}
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 flex-shrink-0"
                  style={{ background: codeCopied ? '#C97C56' : '#EDE5DB' }}
                >
                  {codeCopied ? <Check size={14} color="#FFF" /> : <Copy size={14} color="#2A1F1A" />}
                </button>
              </div>
            </div>
          </div>

          {/* ④ Member list storage */}
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <p style={{ fontSize: 12, fontWeight: 700, color: '#2A1F1A' }}>멤버 목록</p>
              <span
                className="px-2 py-0.5 rounded-full"
                style={{ background: '#F5EFE6', fontSize: 10, fontWeight: 700, color: '#C97C56' }}
              >
                {roomMembers.length}명
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {roomMembers.length === 0 && (
                <div className="rounded-xl p-3" style={{ background: '#FAF8F5', border: '1px solid rgba(42,31,26,0.06)' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#2A1F1A' }}>아직 참여 중인 방이 없어요</p>
                  <p style={{ fontSize: 10, color: '#9E8B7E', marginTop: 2 }}>방을 만들거나 초대코드로 입장하면 멤버가 표시됩니다.</p>
                </div>
              )}
              {roomMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#F5EFE6', fontSize: 16 }}
                  >
                    {m.emoji}
                  </div>
                  <div className="flex-1">
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#2A1F1A' }}>{m.name}</p>
                    <p style={{ fontSize: 10, color: '#9E8B7E' }}>{m.owner ? '방장' : '멤버'} · {m.code}</p>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: '#E8F5EE' }}
                  >
                    <Check size={10} color="#2A8B4A" strokeWidth={3} />
                  </div>
                </div>
              ))}
              <button
                onClick={() => setPhase('friendList')}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl active:opacity-70"
                style={{ border: '1px dashed rgba(201,124,86,0.3)', marginTop: 4 }}
              >
                <Plus size={12} color="#C97C56" />
                <span style={{ fontSize: 11, color: '#C97C56', fontWeight: 600 }}>멤버 추가</span>
              </button>
            </div>
          </div>

          {/* ⑤ Shared travel plan storage */}
          <div
            className="rounded-2xl p-4"
            style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <p style={{ fontSize: 12, fontWeight: 700, color: '#2A1F1A' }}>공유 여행 계획</p>
              <span
                className="px-2 py-0.5 rounded-full"
                style={{ background: '#F5EFE6', fontSize: 10, fontWeight: 700, color: '#C97C56' }}
              >
                {rooms.length}개
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {rooms.length === 0 && (
                <div className="rounded-xl p-3" style={{ background: '#FAF8F5', border: '1px solid rgba(42,31,26,0.06)' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#2A1F1A' }}>아직 생성된 방이 없어요</p>
                  <p style={{ fontSize: 10, color: '#9E8B7E', marginTop: 2 }}>방 생성하기를 누르면 서버에 저장됩니다.</p>
                </div>
              )}
              {rooms.map((room, i) => (
                <div
                  key={room.id}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: '#FAF8F5', border: '1px solid rgba(42,31,26,0.06)' }}
                >
                  <span style={{ fontSize: 22 }}>✈️</span>
                  <div className="flex-1">
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#2A1F1A' }}>{room.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span style={{ fontSize: 10, color: '#9E8B7E' }}>{room.createdAt.slice(0, 10)}</span>
                      <span style={{ fontSize: 10, color: '#C97C56' }}>초대코드 {room.inviteCode}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} color="#9E8B7E" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Friend list phase ───
  if (phase === 'friendList') {
    return (
      <div className="w-full h-full flex flex-col" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
<div className="px-5 pt-4 pb-3 flex-shrink-0 flex flex-col items-center">
  <p
    style={{
      fontSize: 16,
      fontWeight: 700,
      color: '#2A1F1A',
    }}
  >
    친구 초대
  </p>

  <p
    style={{
      fontSize: 11,
      color: '#9E8B7E',
      marginTop: 2,
    }}
  >
    최대 4명 ({selected.length}/4)
  </p>
</div>

        {selected.length > 0 && (
          <div className="px-5 mb-3 flex-shrink-0">
            <div className="rounded-2xl p-3 flex gap-3" style={{ background: '#F5EFE6' }}>
              {selectedFriends.map(f => (
                <div key={f.id} className="flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#C97C56' }}>
                    <span style={{ color: '#FFF', fontSize: 13, fontWeight: 700 }}>{f.name[0]}</span>
                  </div>
                  <span style={{ fontSize: 9, color: '#6B4C38' }}>{f.name.slice(0, 2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5">
          <div className="flex flex-col gap-3">
            {friends.map(f => {
              const isSelected = selected.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggleFriend(f.id)}
                  className="flex items-center gap-4 rounded-2xl p-4 w-full text-left active:opacity-80 transition-all"
                  style={{
                    background: isSelected ? '#F5EFE6' : '#FFFFFF',
                    border: isSelected ? '1.5px solid #C97C56' : '1.5px solid transparent',
                    boxShadow: '0 2px 12px rgba(42,31,26,0.06)',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: isSelected ? '#C97C56' : '#EDE5DB', fontSize: 22 }}
                  >
                    {isSelected
                      ? <span style={{ color: '#FFF', fontSize: 16, fontWeight: 700 }}>{f.name[0]}</span>
                      : <span>{f.emoji}</span>}
                  </div>
                  <div className="flex-1">
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#2A1F1A' }}>{f.name}</p>
                    <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 2 }}>{f.code}</p>
                  </div>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: isSelected ? '#C97C56' : '#EDE5DB' }}
                  >
                    {isSelected ? <Check size={14} color="#FFF" strokeWidth={3} /> : <Plus size={12} color="#9E8B7E" />}
                  </div>
                </button>
              );
            })}
            {friends.length === 0 && (
              <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(42,31,26,0.06)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A' }}>초대 가능한 친구가 없어요</p>
                <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 4 }}>다른 계정이 가입된 뒤 아이디나 사용자 코드로 검색할 수 있습니다.</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-5 flex-shrink-0 flex gap-3">
          <button
            onClick={() => { setPhase('home'); setSelected([]); }}
            className="py-4 px-5 rounded-2xl active:scale-95 transition-all"
            style={{ background: '#EDE5DB', color: '#2A1F1A', fontSize: 14, fontWeight: 600, border: 'none' }}
          >
            취소
          </button>
          {selected.length > 0 && (
            <button
              onClick={() => setPhase('planQuestion')}
              className="flex-1 py-4 rounded-2xl active:scale-95 transition-all"
              style={{
                background: selected.length === 4 ? '#2A1F1A' : '#C97C56',
                color: '#FFFFFF', fontSize: 15, fontWeight: 600, border: 'none',
                boxShadow: '0 6px 20px rgba(201,124,86,0.3)',
              }}
            >
              {selected.length === 4 ? '멤버 확정' : `추가하기 (${selected.length})`}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Plan question phase ───
  if (phase === 'planQuestion') {
    return (
      <div className="w-full h-full flex items-center justify-center px-5" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
        <div className="w-full rounded-3xl p-7" style={{ background: '#FFFFFF', boxShadow: '0 20px 60px rgba(42,31,26,0.12)' }}>
          <div className="mb-2 flex gap-2">
            {selectedFriends.map(f => (
              <div key={f.id} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#C97C56' }}>
                <span style={{ color: '#FFF', fontSize: 11, fontWeight: 700 }}>{f.name[0]}</span>
              </div>
            ))}
          </div>
          <div className="w-10 h-1 rounded-full mb-5 mt-5" style={{ background: '#C97C56' }} />
          <p style={{ fontSize: 20, fontWeight: 700, color: '#2A1F1A', lineHeight: 1.4, marginBottom: 8 }}>
            짜여진 계획이<br />있으신가요? 🗺️
          </p>
          <p style={{ fontSize: 13, color: '#9E8B7E', marginBottom: 28 }}>멤버와 함께 할 계획을 공유하거나 새로 만들어요</p>
          <div className="flex gap-3">
            <button
              onClick={() => setPhase('planInput')}
              className="flex-1 py-3.5 rounded-2xl active:scale-95 transition-all"
              style={{ background: '#C97C56', color: '#FFFFFF', fontSize: 15, fontWeight: 600, border: 'none' }}
            >예</button>
            <button
              onClick={() => handleCreateRoom(false)}
              disabled={savingRoom}
              className="flex-1 py-3.5 rounded-2xl active:scale-95 transition-all"
              style={{ background: '#F0EAE2', color: '#2A1F1A', fontSize: 15, fontWeight: 600, border: 'none' }}
            >{savingRoom ? '생성 중' : '아니오'}</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Plan input phase ───
  return (
    <div className="w-full h-full flex items-center justify-center px-5" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div className="w-full rounded-3xl p-7" style={{ background: '#FFFFFF', boxShadow: '0 20px 60px rgba(42,31,26,0.12)' }}>
        <div className="w-10 h-1 rounded-full mb-6" style={{ background: '#C97C56' }} />
        <p style={{ fontSize: 20, fontWeight: 700, color: '#2A1F1A', lineHeight: 1.4, marginBottom: 8 }}>
          계획을 입력해주세요 ✍️
        </p>
        <p style={{ fontSize: 13, color: '#9E8B7E', marginBottom: 20 }}>여행 일정을 자유롭게 적어보세요</p>
        <textarea
          value={planText}
          onChange={e => setPlanText(e.target.value)}
          className="w-full rounded-2xl p-4 outline-none resize-none"
          style={{
            background: '#FAF8F5', border: '1.5px solid rgba(201,124,86,0.3)',
            fontSize: 14, color: '#2A1F1A', height: 140,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
          placeholder="예: 7월 1일~3일, 강릉 여행&#10;1일차: 경포대, 초당순두부..."
        />
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => setPhase('planQuestion')}
            className="py-3.5 px-5 rounded-2xl active:scale-95 transition-all"
            style={{ background: '#F0EAE2', color: '#2A1F1A', fontSize: 14, fontWeight: 600, border: 'none' }}
          >뒤로</button>
          <button
            onClick={() => handleCreateRoom(true)}
            disabled={savingRoom}
            className="flex-1 py-3.5 rounded-2xl active:scale-95 transition-all"
            style={{ background: '#C97C56', color: '#FFFFFF', fontSize: 15, fontWeight: 600, border: 'none', boxShadow: '0 6px 20px rgba(201,124,86,0.35)' }}
          >{savingRoom ? '저장 중' : '확인'}</button>
        </div>
      </div>
    </div>
  );
}
