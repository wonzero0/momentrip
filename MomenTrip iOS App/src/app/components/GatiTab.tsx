import { useState } from 'react';
import { Users, Plus, Check, ChevronRight } from 'lucide-react';
import { AppScreen } from '../App';

interface Props {
  onNavigate: (s: AppScreen) => void;
}

type Phase = 'initial' | 'friendList' | 'planQuestion' | 'planInput';

const FRIENDS = [
  { id: 'f1', name: '김민준', code: '#3241', emoji: '🌊' },
  { id: 'f2', name: '이서연', code: '#8812', emoji: '🌸' },
  { id: 'f3', name: '박지후', code: '#5519', emoji: '⛰️' },
  { id: 'f4', name: '최수아', code: '#2234', emoji: '🌙' },
];

export function GatiTab({ onNavigate }: Props) {
  const [phase, setPhase] = useState<Phase>('initial');
  const [selected, setSelected] = useState<string[]>([]);
  const [planText, setPlanText] = useState('');

  const toggleFriend = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(f => f !== id)
        : prev.length < 4
        ? [...prev, id]
        : prev
    );
  };

  const selectedFriends = FRIENDS.filter(f => selected.includes(f.id));

  if (phase === 'initial') {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center px-6"
        style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        {/* Illustration */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
          style={{ background: '#F0EAE2' }}
        >
          <Users size={40} color="#C97C56" />
        </div>

        <p style={{ fontSize: 22, fontWeight: 700, color: '#2A1F1A', textAlign: 'center', marginBottom: 8 }}>
          함께 떠나요
        </p>
        <p style={{ fontSize: 14, color: '#9E8B7E', textAlign: 'center', marginBottom: 40, lineHeight: 1.6 }}>
          친구들과 함께 여행 방을 만들고<br />추억을 쌓아보세요
        </p>

        <button
          onClick={() => setPhase('friendList')}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          style={{
            background: '#C97C56',
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 600,
            border: 'none',
            boxShadow: '0 8px 24px rgba(201,124,86,0.35)',
          }}
        >
          <Plus size={18} />
          방 생성하기
        </button>

        {/* Active rooms hint */}
        <div
          className="mt-6 w-full rounded-2xl p-4 flex items-center gap-3"
          style={{ background: '#F0EAE2' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#EDE5DB' }}
          >
            <span style={{ fontSize: 16 }}>🏕️</span>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#2A1F1A' }}>활성 방 없음</p>
            <p style={{ fontSize: 11, color: '#9E8B7E' }}>새 방을 만들어 친구를 초대해보세요</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'friendList') {
    return (
      <div
        className="w-full h-full flex flex-col"
        style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        <div className="px-5 pt-5 pb-4 flex-shrink-0">
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>친구 초대</p>
          <p style={{ fontSize: 13, color: '#9E8B7E', marginTop: 4 }}>
            최대 4명까지 초대할 수 있어요 ({selected.length}/4)
          </p>
        </div>

        {/* Selected friends preview */}
        {selected.length > 0 && (
          <div className="px-5 mb-4 flex-shrink-0">
            <div
              className="rounded-2xl p-4 flex gap-3"
              style={{ background: '#F5EFE6' }}
            >
              {selectedFriends.map(f => (
                <div key={f.id} className="flex flex-col items-center gap-1">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: '#C97C56' }}
                  >
                    <span style={{ color: '#FFF', fontSize: 14, fontWeight: 700 }}>
                      {f.name[0]}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: '#6B4C38' }}>{f.name.slice(0, 2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends list */}
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
                      : <span>{f.emoji}</span>
                    }
                  </div>
                  <div className="flex-1">
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#2A1F1A' }}>{f.name}</p>
                    <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 2 }}>{f.code}</p>
                  </div>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: isSelected ? '#C97C56' : '#EDE5DB' }}
                  >
                    {isSelected
                      ? <Check size={14} color="#FFF" strokeWidth={3} />
                      : <Plus size={12} color="#9E8B7E" />
                    }
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-5 py-5 flex-shrink-0 flex gap-3">
          <button
            onClick={() => { setPhase('initial'); setSelected([]); }}
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
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 600,
                border: 'none',
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

  if (phase === 'planQuestion') {
    return (
      <div
        className="w-full h-full flex items-center justify-center px-5"
        style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        <div
          className="w-full rounded-3xl p-7"
          style={{ background: '#FFFFFF', boxShadow: '0 20px 60px rgba(42,31,26,0.12)' }}
        >
          <div className="mb-2 flex gap-2">
            {selectedFriends.map(f => (
              <div
                key={f.id}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#C97C56' }}
              >
                <span style={{ color: '#FFF', fontSize: 11, fontWeight: 700 }}>{f.name[0]}</span>
              </div>
            ))}
          </div>
          <div className="w-10 h-1 rounded-full mb-5 mt-5" style={{ background: '#C97C56' }} />
          <p style={{ fontSize: 20, fontWeight: 700, color: '#2A1F1A', lineHeight: 1.4, marginBottom: 8 }}>
            짜여진 계획이<br />있으신가유? 🗺️
          </p>
          <p style={{ fontSize: 13, color: '#9E8B7E', marginBottom: 28 }}>
            멤버와 함께 할 계획을 공유하거나 새로 만들어요
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setPhase('planInput')}
              className="flex-1 py-3.5 rounded-2xl active:scale-95 transition-all"
              style={{ background: '#C97C56', color: '#FFFFFF', fontSize: 15, fontWeight: 600, border: 'none' }}
            >
              예
            </button>
            <button
              onClick={() => onNavigate('mission')}
              className="flex-1 py-3.5 rounded-2xl active:scale-95 transition-all"
              style={{ background: '#F0EAE2', color: '#2A1F1A', fontSize: 15, fontWeight: 600, border: 'none' }}
            >
              아니오
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'planInput') {
    return (
      <div
        className="w-full h-full flex items-center justify-center px-5"
        style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        <div
          className="w-full rounded-3xl p-7"
          style={{ background: '#FFFFFF', boxShadow: '0 20px 60px rgba(42,31,26,0.12)' }}
        >
          <div className="w-10 h-1 rounded-full mb-6" style={{ background: '#C97C56' }} />
          <p style={{ fontSize: 20, fontWeight: 700, color: '#2A1F1A', lineHeight: 1.4, marginBottom: 8 }}>
            계획을 입력해주세요 ✍️
          </p>
          <p style={{ fontSize: 13, color: '#9E8B7E', marginBottom: 20 }}>
            여행 일정을 자유롭게 적어보세요
          </p>
          <textarea
            value={planText}
            onChange={e => setPlanText(e.target.value)}
            className="w-full rounded-2xl p-4 outline-none resize-none"
            style={{
              background: '#FAF8F5',
              border: '1.5px solid rgba(201,124,86,0.3)',
              fontSize: 14,
              color: '#2A1F1A',
              height: 140,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
            placeholder="예: 7월 1일~3일, 강릉 여행&#10;1일차: 경포대, 초당순두부..."
          />
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setPhase('planQuestion')}
              className="py-3.5 px-5 rounded-2xl active:scale-95 transition-all"
              style={{ background: '#F0EAE2', color: '#2A1F1A', fontSize: 14, fontWeight: 600, border: 'none' }}
            >
              뒤로
            </button>
            <button
              onClick={() => onNavigate('mission')}
              className="flex-1 py-3.5 rounded-2xl active:scale-95 transition-all"
              style={{ background: '#C97C56', color: '#FFFFFF', fontSize: 15, fontWeight: 600, border: 'none', boxShadow: '0 6px 20px rgba(201,124,86,0.35)' }}
            >
              확인
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
