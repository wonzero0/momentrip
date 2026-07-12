import { useState } from 'react';
import { CalendarPlus, ChevronRight, Clock, Compass, MapPin, Star, WalletCards, X } from 'lucide-react';
import { AppScreen } from '../App';

interface Props {
  onNavigate: (s: AppScreen) => void;
  onHome: () => void;
}

type Phase = 'home' | 'planQuestion' | 'planInput';

interface Destination {
  id: string;
  name: string;
  tag: string;
  img: string;
  rating: number;
  summary: string;
  bestSeason: string;
  duration: string;
  budget: string;
  highlights: string[];
  itinerary: string[];
}

const PLAN_STORAGE_KEY = 'momentrip.savedTravelPlans';

const DESTINATIONS: Destination[] = [
  {
    id: 'jeju',
    name: '제주도',
    tag: '자연 · 힐링',
    img: 'https://images.unsplash.com/photo-1579169825453-8d4b465d7c6a?w=700&h=460&fit=crop&auto=format',
    rating: 4.8,
    summary: '바다, 오름, 로컬 음식이 한 번에 이어지는 대표 힐링 여행지예요.',
    bestSeason: '4-6월, 9-10월',
    duration: '2박 3일',
    budget: '1인 35-55만원',
    highlights: ['성산일출봉', '우도', '협재해변', '동문시장'],
    itinerary: ['1일차: 동문시장과 함덕해변', '2일차: 성산일출봉, 우도, 섭지코지', '3일차: 협재해변, 한림공원'],
  },
  {
    id: 'busan',
    name: '부산',
    tag: '바다 · 야경',
    img: 'https://images.unsplash.com/photo-1598048129182-7d70c3c65f82?w=700&h=460&fit=crop&auto=format',
    rating: 4.7,
    summary: '해변 산책, 시장 먹거리, 야경 명소를 촘촘하게 즐기기 좋아요.',
    bestSeason: '5-6월, 9-11월',
    duration: '1박 2일',
    budget: '1인 22-38만원',
    highlights: ['해운대', '광안리', '감천문화마을', '자갈치시장'],
    itinerary: ['1일차: 감천문화마을, 자갈치시장, 광안리 야경', '2일차: 해운대, 동백섬, 송정 카페거리'],
  },
  {
    id: 'gyeongju',
    name: '경주',
    tag: '역사 · 문화',
    img: 'https://images.unsplash.com/photo-1599148401005-fe6d7497cbf4?w=700&h=460&fit=crop&auto=format',
    rating: 4.6,
    summary: '낮에는 유적지, 밤에는 동궁과 월지 야경으로 분위기가 달라져요.',
    bestSeason: '3-5월, 10-11월',
    duration: '1박 2일',
    budget: '1인 18-32만원',
    highlights: ['첨성대', '황리단길', '불국사', '동궁과 월지'],
    itinerary: ['1일차: 황리단길, 첨성대, 동궁과 월지', '2일차: 불국사, 석굴암, 보문호 산책'],
  },
  {
    id: 'gangneung',
    name: '강릉',
    tag: '커피 · 바다',
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&h=460&fit=crop&auto=format',
    rating: 4.7,
    summary: '바다 전망 카페와 아침 해변 산책을 중심으로 가볍게 다녀오기 좋아요.',
    bestSeason: '6-8월, 10월',
    duration: '1박 2일',
    budget: '1인 20-35만원',
    highlights: ['안목해변', '경포호', '오죽헌', '중앙시장'],
    itinerary: ['1일차: 안목해변 카페거리, 중앙시장', '2일차: 경포호 산책, 오죽헌, 주문진'],
  },
  {
    id: 'yeosu',
    name: '여수',
    tag: '낭만 · 섬',
    img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=700&h=460&fit=crop&auto=format',
    rating: 4.5,
    summary: '밤바다와 해상 케이블카, 섬 코스를 함께 묶기 좋은 남해 여행지예요.',
    bestSeason: '4-6월, 9월',
    duration: '2박 3일',
    budget: '1인 30-48만원',
    highlights: ['여수밤바다', '오동도', '해상케이블카', '낭만포차'],
    itinerary: ['1일차: 오동도, 해상케이블카, 낭만포차', '2일차: 향일암, 돌산공원, 해변 드라이브', '3일차: 이순신광장, 로컬 맛집'],
  },
  {
    id: 'jeonju',
    name: '전주',
    tag: '한옥 · 미식',
    img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=700&h=460&fit=crop&auto=format',
    rating: 4.6,
    summary: '한옥마을 산책과 전통 음식 코스가 짧은 일정에도 잘 맞아요.',
    bestSeason: '4-5월, 10월',
    duration: '당일-1박 2일',
    budget: '1인 12-28만원',
    highlights: ['한옥마을', '전동성당', '남부시장', '경기전'],
    itinerary: ['1일차: 한옥마을, 경기전, 전동성당', '2일차: 남부시장, 객리단길 카페'],
  },
];

function readSavedPlans() {
  try {
    const value = localStorage.getItem(PLAN_STORAGE_KEY);
    return value ? JSON.parse(value) as string[] : [];
  } catch {
    return [];
  }
}

function destinationToPlan(destination: Destination) {
  return [
    `${destination.name} ${destination.duration}`,
    `추천 시기: ${destination.bestSeason}`,
    `예상 예산: ${destination.budget}`,
    ...destination.itinerary,
  ].join('\n');
}

export function YeohaengTab({ onNavigate }: Props) {
  const [phase, setPhase] = useState<Phase>('planQuestion');
  const [planText, setPlanText] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [savedPlans, setSavedPlans] = useState<string[]>(readSavedPlans);
  const [notice, setNotice] = useState('');

  const handleAddDestination = (destination: Destination) => {
    const nextPlan = destinationToPlan(destination);
    setPlanText(nextPlan);
    setSavedPlans(prev => {
      const next = [nextPlan, ...prev.filter(plan => plan !== nextPlan)].slice(0, 5);
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setNotice(`${destination.name} 일정이 추가되었습니다.`);
    setSelectedDestination(null);
    setPhase('planInput');
  };

  if (phase === 'planQuestion' || phase === 'planInput') {
    return (
      <div
        className="w-full h-full flex flex-col"
        style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        <div className="px-5 pt-4 pb-3 flex justify-center">
          <p style={{ fontSize: 14, fontWeight: 600, color: '#2A1F1A' }}>여행가유</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-5">
          <div
            className="rounded-3xl p-7 relative w-full"
            style={{ background: '#FFFFFF', boxShadow: '0 20px 60px rgba(42,31,26,0.12)' }}
          >
            <div className="w-10 h-1 rounded-full mb-6" style={{ background: '#C97C56' }} />

            {phase === 'planQuestion' && (
              <>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#2A1F1A', lineHeight: 1.4, marginBottom: 8 }}>
                  짜여진 계획이<br />있으신가요? 🗺️
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
                <p style={{ fontSize: 13, color: '#9E8B7E', marginBottom: 10 }}>
                  여행 일정, 장소, 날짜를 자유롭게 적어보세요
                </p>
                {notice && (
                  <p className="rounded-xl px-3 py-2 mb-3" style={{ fontSize: 12, color: '#6B4C38', background: '#F5EFE6' }}>
                    {notice}
                  </p>
                )}
                <textarea
                  value={planText}
                  onChange={e => setPlanText(e.target.value)}
                  className="w-full rounded-2xl p-4 outline-none resize-none"
                  style={{
                    background: '#FAF8F5',
                    border: '1.5px solid rgba(201,124,86,0.3)',
                    fontSize: 14,
                    color: '#2A1F1A',
                    height: 150,
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                  placeholder="예: 6월 20일~22일, 제주도 3박4일&#10;첫째날: 성산일출봉, 우도..."
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => { setNotice(''); setPhase('home'); }}
                    className="py-3.5 px-5 rounded-2xl active:scale-95 transition-all"
                    style={{ background: '#F0EAE2', color: '#2A1F1A', fontSize: 14, fontWeight: 600, border: 'none' }}
                  >
                    추천 보기
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
      </div>
    );
  }

  return (
    <div
      className="w-full h-full overflow-y-auto"
      style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <div className="px-5 pt-4 pb-2 flex justify-center">
        <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>여행가유</p>
      </div>

      <div className="px-5 pt-4 pb-6">
        <div className="rounded-3xl overflow-hidden relative" style={{ height: 180 }}>
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

      {savedPlans.length > 0 && (
        <div className="px-5 pb-5">
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A', marginBottom: 8 }}>내 일정</p>
          <div className="rounded-2xl px-4 py-3" style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(42,31,26,0.06)' }}>
            <p style={{ fontSize: 12, color: '#6B5040', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
              {savedPlans[0]}
            </p>
          </div>
        </div>
      )}

      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontSize: 16, fontWeight: 700, color: '#2A1F1A' }}>추천 여행지</p>
          <span style={{ fontSize: 12, color: '#C97C56', fontWeight: 500 }}>{DESTINATIONS.length}곳</span>
        </div>
        <div className="flex flex-col gap-3">
          {DESTINATIONS.map(destination => (
            <button
              key={destination.id}
              onClick={() => setSelectedDestination(destination)}
              className="flex items-center rounded-2xl overflow-hidden active:opacity-80 transition-opacity text-left"
              style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(42,31,26,0.06)' }}
            >
              <div className="w-20 h-20 flex-shrink-0 overflow-hidden">
                <img src={destination.img} alt={destination.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 px-4 min-w-0">
                <p style={{ fontSize: 15, fontWeight: 600, color: '#2A1F1A' }}>{destination.name}</p>
                <p style={{ fontSize: 12, color: '#9E8B7E', marginTop: 2 }}>{destination.tag}</p>
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={10} fill={i <= Math.round(destination.rating) ? '#D4A070' : 'none'} color="#D4A070" />
                  ))}
                  <span style={{ fontSize: 10, color: '#9E8B7E', marginLeft: 4 }}>{destination.rating.toFixed(1)}</span>
                </div>
              </div>
              <ChevronRight size={16} color="#9E8B7E" className="mr-4" />
            </button>
          ))}
        </div>
      </div>

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

      {selectedDestination && (
        <div className="absolute inset-0 z-50 flex items-end" style={{ background: 'rgba(42,31,26,0.35)' }}>
          <div
            className="w-full rounded-t-3xl overflow-hidden"
            style={{ background: '#FAF8F5', maxHeight: '86%', boxShadow: '0 -12px 32px rgba(42,31,26,0.22)' }}
          >
            <div className="relative" style={{ height: 170 }}>
              <img src={selectedDestination.img} alt={selectedDestination.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(42,31,26,0.7), transparent)' }} />
              <button
                onClick={() => setSelectedDestination(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.9)' }}
              >
                <X size={16} color="#2A1F1A" />
              </button>
              <div className="absolute bottom-4 left-5 right-5">
                <p style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF' }}>{selectedDestination.name}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>{selectedDestination.summary}</p>
              </div>
            </div>

            <div className="overflow-y-auto px-5 py-5" style={{ maxHeight: 500 }}>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-2xl p-3" style={{ background: '#FFFFFF' }}>
                  <Clock size={15} color="#C97C56" />
                  <p style={{ fontSize: 10, color: '#9E8B7E', marginTop: 6 }}>추천 일정</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#2A1F1A', marginTop: 2 }}>{selectedDestination.duration}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: '#FFFFFF' }}>
                  <CalendarPlus size={15} color="#C97C56" />
                  <p style={{ fontSize: 10, color: '#9E8B7E', marginTop: 6 }}>추천 시기</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#2A1F1A', marginTop: 2 }}>{selectedDestination.bestSeason}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: '#FFFFFF' }}>
                  <WalletCards size={15} color="#C97C56" />
                  <p style={{ fontSize: 10, color: '#9E8B7E', marginTop: 6 }}>예상 예산</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#2A1F1A', marginTop: 2 }}>{selectedDestination.budget}</p>
                </div>
              </div>

              <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A', marginBottom: 8 }}>대표 장소</p>
              <div className="flex gap-2 flex-wrap mb-4">
                {selectedDestination.highlights.map(item => (
                  <span key={item} className="rounded-full px-3 py-1.5" style={{ background: '#F5EFE6', color: '#6B4C38', fontSize: 12, fontWeight: 600 }}>
                    {item}
                  </span>
                ))}
              </div>

              <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A', marginBottom: 8 }}>추천 일정</p>
              <div className="flex flex-col gap-2 mb-5">
                {selectedDestination.itinerary.map(item => (
                  <div key={item} className="rounded-2xl px-4 py-3" style={{ background: '#FFFFFF' }}>
                    <p style={{ fontSize: 12, color: '#2A1F1A', lineHeight: 1.45 }}>{item}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleAddDestination(selectedDestination)}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                style={{ background: '#C97C56', color: '#FFFFFF', fontSize: 15, fontWeight: 700, border: 'none', boxShadow: '0 8px 24px rgba(201,124,86,0.35)' }}
              >
                <CalendarPlus size={16} />
                일정에 추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
