import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

type PersonType = 'J' | 'P' | null;

const J_RECS = [
  { emoji: '🗺️', title: '경복궁 투어', desc: '체계적인 역사 탐방 코스' },
  { emoji: '🍽️', title: '미슐랭 식당 예약', desc: '사전 예약 필수 파인다이닝' },
  { emoji: '🚌', title: '시티투어버스', desc: '정해진 루트로 명소 관람' },
  { emoji: '📋', title: '가이드 투어', desc: '전문 가이드와 함께하는 여행' },
];

const P_RECS = [
  { emoji: '🌅', title: '무작정 골목 탐방', desc: '발길 닿는 대로 걷기' },
  { emoji: '☕', title: '분위기 좋은 카페', desc: '우연히 발견한 숨은 명소' },
  { emoji: '🎲', title: '즉흥 맛집 도전', desc: '현지인 추천 식당 찾기' },
  { emoji: '🎡', title: '야시장 탐험', desc: '밤의 로컬 감성 체험' },
];

export function MeohalTab() {
  const [selected, setSelected] = useState<PersonType>(null);

  return (
    <div
      className="w-full h-full overflow-y-auto"
      style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <div className="px-5 pt-5 pb-4">
        <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>어떤 여행자세요?</p>
        <p style={{ fontSize: 13, color: '#9E8B7E', marginTop: 4 }}>
          나의 여행 스타일에 맞는 활동을 찾아드려요
        </p>
      </div>

      {/* Type cards */}
      <div className="px-5 grid grid-cols-2 gap-4 mb-6">
        {/* J 카드 */}
        <button
          onClick={() => setSelected('J')}
          className="rounded-3xl p-5 text-left active:scale-95 transition-all flex flex-col"
          style={{
            height: 200,
            background: selected === 'J'
              ? 'linear-gradient(135deg, #2A1F1A 0%, #4A3020 100%)'
              : '#FFFFFF',
            boxShadow: selected === 'J'
              ? '0 12px 32px rgba(42,31,26,0.3)'
              : '0 4px 16px rgba(42,31,26,0.08)',
            border: selected === 'J' ? 'none' : '1.5px solid rgba(42,31,26,0.06)',
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-auto"
            style={{ background: selected === 'J' ? 'rgba(255,255,255,0.15)' : '#F0EAE2' }}
          >
            <span style={{ fontSize: 24 }}>📋</span>
          </div>
          <div>
            <p
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: selected === 'J' ? '#FAF8F5' : '#2A1F1A',
                letterSpacing: '-0.02em',
              }}
            >
              J형
            </p>
            <p style={{ fontSize: 11, color: selected === 'J' ? 'rgba(250,248,245,0.6)' : '#9E8B7E', marginTop: 2 }}>
              계획형 여행자
            </p>
          </div>
          {selected === 'J' && (
            <div
              className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: '#C97C56' }}
            >
              <span style={{ color: '#FFF', fontSize: 10, fontWeight: 700 }}>✓</span>
            </div>
          )}
        </button>

        {/* P 카드 */}
        <button
          onClick={() => setSelected('P')}
          className="rounded-3xl p-5 text-left active:scale-95 transition-all flex flex-col relative"
          style={{
            height: 200,
            background: selected === 'P'
              ? 'linear-gradient(135deg, #C97C56 0%, #A85A38 100%)'
              : '#FFFFFF',
            boxShadow: selected === 'P'
              ? '0 12px 32px rgba(201,124,86,0.35)'
              : '0 4px 16px rgba(42,31,26,0.08)',
            border: selected === 'P' ? 'none' : '1.5px solid rgba(42,31,26,0.06)',
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-auto"
            style={{ background: selected === 'P' ? 'rgba(255,255,255,0.2)' : '#FFF0E6' }}
          >
            <span style={{ fontSize: 24 }}>🎲</span>
          </div>
          <div>
            <p
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: selected === 'P' ? '#FAF8F5' : '#2A1F1A',
                letterSpacing: '-0.02em',
              }}
            >
              P형
            </p>
            <p style={{ fontSize: 11, color: selected === 'P' ? 'rgba(250,248,245,0.7)' : '#9E8B7E', marginTop: 2 }}>
              즉흥형 여행자
            </p>
          </div>
          {selected === 'P' && (
            <div
              className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.3)' }}
            >
              <span style={{ color: '#FFF', fontSize: 10, fontWeight: 700 }}>✓</span>
            </div>
          )}
        </button>
      </div>

      {/* Recommendations */}
      {selected && (
        <div className="px-5 pb-8">
          <div className="flex items-center justify-between mb-4">
            <p style={{ fontSize: 15, fontWeight: 700, color: '#2A1F1A' }}>
              {selected === 'J' ? 'J형' : 'P형'} 추천 활동
            </p>
            <span
              className="px-3 py-1 rounded-full"
              style={{ background: '#F0EAE2', fontSize: 11, fontWeight: 600, color: '#C97C56' }}
            >
              추천 내용
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {(selected === 'J' ? J_RECS : P_RECS).map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl p-4"
                style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(42,31,26,0.06)' }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#FAF8F5', fontSize: 22 }}
                >
                  {item.emoji}
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#2A1F1A' }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: '#9E8B7E', marginTop: 2 }}>{item.desc}</p>
                </div>
                <ChevronRight size={16} color="#9E8B7E" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!selected && (
        <div className="px-5 pb-8">
          <div
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{ background: '#F0EAE2', border: '1.5px dashed rgba(201,124,86,0.3)' }}
          >
            <span style={{ fontSize: 28 }}>🧭</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#2A1F1A' }}>여행 스타일을 선택해보세요</p>
              <p style={{ fontSize: 12, color: '#9E8B7E', marginTop: 2 }}>나에게 맞는 활동을 추천해드려요</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
