import { useState } from 'react';
import { MapPin, Compass, Star, ChevronRight, Home } from 'lucide-react';
import { AppScreen } from '../App';

interface Props {
  onNavigate: (s: AppScreen) => void;
}

type Phase = 'home' | 'planQuestion' | 'planInput';

export function YeohaengTab({ onNavigate }: Props) {
  const [phase, setPhase] = useState<Phase>('planQuestion');
  const [planText, setPlanText] = useState('');

  const destinations = [
    { name: '제주도', tag: '자연 · 힐링', img: 'https://images.unsplash.com/photo-1583416750470-965b2707b27a?w=400&h=300&fit=crop&auto=format', color: '#D4E8D4' },
    { name: '부산', tag: '바다 · 야경', img: 'https://images.unsplash.com/photo-1620484892730-2949c2a74b5a?w=400&h=300&fit=crop&auto=format', color: '#D4DCE8' },
    { name: '경주', tag: '역사 · 문화', img: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=400&h=300&fit=crop&auto=format', color: '#E8E4D4' },
  ];

  if (phase === 'planQuestion' || phase === 'planInput') {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        <div
          className="mx-5 rounded-3xl p-7 relative"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 20px 60px rgba(42,31,26,0.12)',
            width: '100%',
          }}
        >
          {/* Accent bar */}
          <div
            className="w-10 h-1 rounded-full mb-6"
            style={{ background: '#C97C56' }}
          />

          {phase === 'planQuestion' && (
            <>
              <p
                style={{ fontSize: 20, fontWeight: 700, color: '#2A1F1A', lineHeight: 1.4, marginBottom: 8 }}
              >
                짜여진 계획이<br />있으신가유? 🗺️
              </p>
              <p style={{ fontSize: 13, color: '#9E8B7E', marginBottom: 28 }}>
                여행 계획을 공유하거나 새로 만들 수 있어요
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
                  onClick={() => setPhase('home')}
                  className="flex-1 py-3.5 rounded-2xl active:scale-95 transition-all"
                  style={{ background: '#F0EAE2', color: '#2A1F1A', fontSize: 15, fontWeight: 600, border: 'none' }}
                >
                  아니오
                </button>
              </div>
            </>
          )}

          {phase === 'planInput' && (
            <>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#2A1F1A', lineHeight: 1.4, marginBottom: 8 }}>
                계획을 입력해주세요 ✍️
              </p>
              <p style={{ fontSize: 13, color: '#9E8B7E', marginBottom: 20 }}>
                여행 일정, 장소, 날짜를 자유롭게 적어보세요
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
                  height: 130,
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
                placeholder="예: 6월 20일~22일, 제주도 3박4일&#10;첫째날: 성산일출봉, 우도..."
              />
              <div className="flex gap-3 mt-4">
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
            </>
          )}
        </div>
      </div>
    );
  }

  // Home state (아니오 selected)
  return (
    <div
      className="w-full h-full overflow-y-auto"
      style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      {/* Hero */}
      <div className="px-5 pt-4 pb-6">
        <div
          className="rounded-3xl overflow-hidden relative"
          style={{ height: 180 }}
        >
          <img
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=400&fit=crop&auto=format"
            alt="travel destination"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(42,31,26,0.7) 0%, rgba(42,31,26,0.1) 60%)' }}
          />
          <div className="absolute bottom-5 left-5">
            <p className="text-white" style={{ fontSize: 11, opacity: 0.8, letterSpacing: '0.1em' }}>RECOMMENDED</p>
            <p className="text-white" style={{ fontSize: 20, fontWeight: 700 }}>이번 주 인기 여행지</p>
          </div>
          <button
            onClick={() => setPhase('planQuestion')}
            className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 active:opacity-80"
            style={{ background: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600, color: '#2A1F1A' }}
          >
            <Compass size={12} />
            계획 추가
          </button>
        </div>
      </div>

      {/* Destinations */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontSize: 16, fontWeight: 700, color: '#2A1F1A' }}>추천 여행지</p>
          <button style={{ fontSize: 12, color: '#C97C56', fontWeight: 500 }}>전체보기</button>
        </div>
        <div className="flex flex-col gap-3">
          {destinations.map(d => (
            <div
              key={d.name}
              className="flex items-center rounded-2xl overflow-hidden active:opacity-80 transition-opacity"
              style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(42,31,26,0.06)' }}
            >
              <div className="w-20 h-20 flex-shrink-0 overflow-hidden">
                <img src={d.img} alt={d.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 px-4">
                <p style={{ fontSize: 15, fontWeight: 600, color: '#2A1F1A' }}>{d.name}</p>
                <p style={{ fontSize: 12, color: '#9E8B7E', marginTop: 2 }}>{d.tag}</p>
                <div className="flex items-center gap-1 mt-2">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={10} fill={i <= 4 ? '#D4A070' : 'none'} color="#D4A070" />
                  ))}
                  <span style={{ fontSize: 10, color: '#9E8B7E', marginLeft: 4 }}>4.8</span>
                </div>
              </div>
              <ChevronRight size={16} color="#9E8B7E" className="mr-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick start */}
      <div className="px-5 mt-6 pb-6">
        <button
          onClick={() => setPhase('planQuestion')}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          style={{ background: '#2A1F1A', color: '#FAF8F5', fontSize: 15, fontWeight: 600, border: 'none' }}
        >
          <MapPin size={16} />
          여행 시작하기
        </button>
      </div>
    </div>
  );
}
