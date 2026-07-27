import { useState } from 'react';
import { Users, Plus, Check, Search, Link, Hash, DoorOpen, Copy, ChevronRight, MapPin } from 'lucide-react';
import { AppScreen } from '../App';

interface Props {
  onNavigate: (s: AppScreen) => void;
  onHome: () => void;
}

type Phase = 'home' | 'friendList' | 'planQuestion' | 'planInput';

const FRIENDS = [
  { id: 'f1', name: '김민준', code: '#3241', emoji: '🌊' },
  { id: 'f2', name: '이서연', code: '#8812', emoji: '🌸' },
  { id: 'f3', name: '박지후', code: '#5519', emoji: '⛰️' },
  { id: 'f4', name: '최수아', code: '#2234', emoji: '🌙' },
];

const STORED_MEMBERS = [
  { name: '김민준', code: '#3241', emoji: '🌊' },
  { name: '이서연', code: '#8812', emoji: '🌸' },
];

const SHARED_PLANS = [
  { title: '제주 3박4일', date: '7월 10일 ~ 13일', places: 8, emoji: '🏝️' },
  { title: '부산 당일치기', date: '6월 28일', places: 5, emoji: '🌊' },
];

const INVITE_LINK = 'momentrip.app/room/xyz99';
const INVITE_CODE = 'XYZ-9912';

export function GatiTab({ onNavigate, onHome }: Props) {
  const [phase, setPhase] = useState<Phase>('home');
  const [selected, setSelected] = useState<string[]>([]);
  const [planText, setPlanText] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState<{ name: string; code: string; emoji: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const selectedFriends = FRIENDS.filter(f => selected.includes(f.id));

  const toggleFriend = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const handleSearch = () => {
    if (searchCode.startsWith('#')) {
      const found = FRIENDS.find(f => f.code === searchCode);
      setSearchResult(found ? { name: found.name, code: found.code, emoji: found.emoji }
        : { name: '알 수 없는 사용자', code: searchCode, emoji: '❓' });
    }
  };

  const handleCopyLink = () => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); };
  const handleCopyCode = () => { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); };

  // ─── Home phase ───
  if (phase === 'home') {
    return (
      <div className="w-full h-full flex flex-col" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
        {/* Sub-header */}
<div className="px-5 pt-4 pb-3 flex-shrink-0 flex justify-center">
  <p
    style={{
      fontSize: 14,
      fontWeight: 700,
      color: '#2A1F1A',
    }}
  >
    같이가유
  </p>
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
                  className="px-3 py-1.5 rounded-xl active:scale-95 text-xs font-semibold"
                  style={{ background: '#C97C56', color: '#FFF', border: 'none' }}
                >
                  추가
                </button>
              </div>
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
                />
              </div>
              <button
                className="rounded-2xl px-4 active:scale-95 flex-shrink-0"
                style={{ height: 48, background: '#C97C56', color: '#FFF', fontSize: 13, fontWeight: 600, border: 'none' }}
                onClick={() => { setShowJoinInput(false); setJoinCode(''); }}
              >
                입장
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
                    {INVITE_LINK}
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
                    {INVITE_CODE}
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
                {STORED_MEMBERS.length}명
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {STORED_MEMBERS.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#F5EFE6', fontSize: 16 }}
                  >
                    {m.emoji}
                  </div>
                  <div className="flex-1">
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#2A1F1A' }}>{m.name}</p>
                    <p style={{ fontSize: 10, color: '#9E8B7E' }}>{m.code}</p>
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
                {SHARED_PLANS.length}개
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {SHARED_PLANS.map((plan, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: '#FAF8F5', border: '1px solid rgba(42,31,26,0.06)' }}
                >
                  <span style={{ fontSize: 22 }}>{plan.emoji}</span>
                  <div className="flex-1">
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#2A1F1A' }}>{plan.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span style={{ fontSize: 10, color: '#9E8B7E' }}>{plan.date}</span>
                      <span style={{ fontSize: 10, color: '#C97C56' }}>📍 {plan.places}곳</span>
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
            {FRIENDS.map(f => {
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
              onClick={() => onNavigate('mission')}
              className="flex-1 py-3.5 rounded-2xl active:scale-95 transition-all"
              style={{ background: '#F0EAE2', color: '#2A1F1A', fontSize: 15, fontWeight: 600, border: 'none' }}
            >아니오</button>
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
            onClick={() => onNavigate('mission')}
            className="flex-1 py-3.5 rounded-2xl active:scale-95 transition-all"
            style={{ background: '#C97C56', color: '#FFFFFF', fontSize: 15, fontWeight: 600, border: 'none', boxShadow: '0 6px 20px rgba(201,124,86,0.35)' }}
          >확인</button>
        </div>
      </div>
    </div>
  );
}
