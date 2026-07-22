import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, MapPin, Clock, Sparkles, Compass, Loader2 } from 'lucide-react';

interface Props { onHome: () => void; }

type PersonType = 'J' | 'P' | null;

interface PlanItem {
  id: number;
  time?: string;
  badge?: string;
  title: string;
  desc: string;
  addr: string;
  emoji: string;
  category: string;
}

export function MeohalTab({ onHome }: Props) {
  const [selected, setSelected] = useState<PersonType>(null);
  const [selectedCity, setSelectedCity] = useState<string>('천안시');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [currentPlans, setCurrentPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cities = ['천안시', '공주시', '보령시', '아산시', '당진시', '태안군'];

  useEffect(() => {
    if (!selected) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/recommendations?type=${selected}&city=${encodeURIComponent(selectedCity)}`);
        
        if (!response.ok) {
          throw new Error('서버 응답이 올바르지 않습니다.');
        }

        const data = await response.json();
        setCurrentPlans(data.plans || []);
      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다. 백엔드 서버 및 인증키를 확인해주세요.');
        setCurrentPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [selected, selectedCity]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div
      className="w-full h-full overflow-y-auto"
      style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <div className="px-5 pt-4 pb-2 flex justify-between items-center">
        <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>뭐할까유</p>
        <button onClick={onHome} style={{ fontSize: 12, color: '#C97C56', fontWeight: 600 }}>
          홈으로
        </button>
      </div>

      <div className="px-5 pt-2 pb-4">
        <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>어떤 여행 성향이세요?</p>
        <p style={{ fontSize: 13, color: '#9E8B7E', marginTop: 4 }}>
          티맵 내비게이션 기반 공공데이터를 성향에 맞게 실시간 연동합니다
        </p>
      </div>

      <div className="px-5 grid grid-cols-2 gap-4 mb-5">
        <button
          onClick={() => { setSelected('J'); setExpandedId(null); }}
          className="rounded-3xl p-5 text-left active:scale-95 transition-all flex flex-col relative"
          style={{
            height: 160,
            background: selected === 'J' ? 'linear-gradient(135deg, #2A1F1A 0%, #4A3020 100%)' : '#FFFFFF',
            boxShadow: selected === 'J' ? '0 12px 32px rgba(42,31,26,0.3)' : '0 4px 16px rgba(42,31,26,0.08)',
            border: selected === 'J' ? 'none' : '1.5px solid rgba(42,31,26,0.06)',
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-auto" style={{ background: selected === 'J' ? 'rgba(255,255,255,0.15)' : '#F0EAE2' }}>
            <Clock size={20} color={selected === 'J' ? '#FAF8F5' : '#2A1F1A'} />
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 800, color: selected === 'J' ? '#FAF8F5' : '#2A1F1A' }}>J형 (계획형)</p>
            <p style={{ fontSize: 11, color: selected === 'J' ? 'rgba(250,248,245,0.6)' : '#9E8B7E', marginTop: 2 }}>체계적 코스 루트</p>
          </div>
          {selected === 'J' && (
            <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#C97C56' }}>
              <span style={{ color: '#FFF', fontSize: 10, fontWeight: 700 }}>✓</span>
            </div>
          )}
        </button>

        <button
          onClick={() => { setSelected('P'); setExpandedId(null); }}
          className="rounded-3xl p-5 text-left active:scale-95 transition-all flex flex-col relative"
          style={{
            height: 160,
            background: selected === 'P' ? 'linear-gradient(135deg, #C97C56 0%, #A85A38 100%)' : '#FFFFFF',
            boxShadow: selected === 'P' ? '0 12px 32px rgba(201,124,86,0.35)' : '0 4px 16px rgba(42,31,26,0.08)',
            border: selected === 'P' ? 'none' : '1.5px solid rgba(42,31,26,0.06)',
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-auto" style={{ background: selected === 'P' ? 'rgba(255,255,255,0.2)' : '#FFF0E6' }}>
            <Compass size={20} color={selected === 'P' ? '#FAF8F5' : '#C97C56'} />
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 800, color: selected === 'P' ? '#FAF8F5' : '#2A1F1A' }}>P형 (즉흥형)</p>
            <p style={{ fontSize: 11, color: selected === 'P' ? 'rgba(250,248,245,0.7)' : '#9E8B7E', marginTop: 2 }}>티맵 연관 핫플</p>
          </div>
          {selected === 'P' && (
            <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.3)' }}>
              <span style={{ color: '#FFF', fontSize: 10, fontWeight: 700 }}>✓</span>
            </div>
          )}
        </button>
      </div>

      {selected && (
        <div className="px-5 mb-5 animate-fade-in">
          <div className="flex items-center gap-1.5 mb-2.5">
            <MapPin size={14} color="#C97C56" />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A' }}>행정구역별 관광 인프라 필터</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {cities.map((city) => {
              const isChosen = selectedCity === city;
              return (
                <button
                  key={city}
                  onClick={() => { setSelectedCity(city); setExpandedId(null); }}
                  className="px-3.5 py-2 rounded-xl flex-shrink-0 transition-all"
                  style={{
                    background: isChosen ? '#2A1F1A' : '#FFFFFF',
                    color: isChosen ? '#FAF8F5' : '#7A6B62',
                    fontSize: 12,
                    fontWeight: isChosen ? 700 : 500,
                    boxShadow: '0 2px 8px rgba(42,31,26,0.04)',
                    border: isChosen ? 'none' : '1.5px solid rgba(42,31,26,0.06)',
                  }}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selected ? (
        <div className="px-5 pb-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              {selected === 'J' ? <Clock size={16} color="#C97C56" /> : <Sparkles size={16} color="#C97C56" />}
              <p style={{ fontSize: 15, fontWeight: 700, color: '#2A1F1A' }}>
                {selectedCity} {selected === 'J' ? 'J형 계획형 코스' : 'P형 티맵 핫플 코스'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full" style={{ background: '#F0EAE2', fontSize: 10, fontWeight: 600, color: '#C97C56' }}>
              {selected === 'J' ? '계획형 맞춤' : '즉흥형 핫플'}
            </span>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="animate-spin" size={28} color="#C97C56" />
              <p style={{ fontSize: 13, color: '#9E8B7E' }}>공공데이터 API 정보를 불러오는 중...</p>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl p-5 text-center bg-red-50 border border-red-100">
              <p style={{ fontSize: 13, color: '#E53E3E', fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {!loading && !error && currentPlans.length === 0 && (
            <div className="rounded-2xl p-8 text-center bg-white border border-stone-100">
              <p style={{ fontSize: 13, color: '#9E8B7E' }}>조회된 관광 데이터가 없습니다. 지역 시군구 코드를 확인해주세요.</p>
            </div>
          )}

          {!loading && !error && currentPlans.length > 0 && (
            <div className="flex flex-col gap-3.5">
              {currentPlans.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl p-4 flex flex-col gap-1.5 transition-all"
                    style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(42,31,26,0.06)', border: '1px solid rgba(42,31,26,0.04)' }}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: '#C97C56' }}></span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#C97C56' }}>
                          {selected === 'J' ? item.time : '티맵 인기 핫플'}
                        </span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: selected === 'J' ? '#F0EAE2' : '#FFF0E6', color: '#C97C56', fontWeight: 700 }}>
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#FAF8F5', fontSize: 20 }}>
                        {item.emoji}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }} className="truncate">{item.title}</p>
                          <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: '#F0EAE2', color: '#C97C56', fontWeight: 600 }}>{item.category}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#9E8B7E', marginTop: 2 }} className="truncate">{item.desc}</p>
                        
                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-stone-100 animate-fade-in flex items-center gap-1">
                            <MapPin size={12} color="#C97C56" className="flex-shrink-0" />
                            <p style={{ fontSize: 11, color: '#7A6B62', fontWeight: 500 }}>{item.addr}</p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform"
                        style={{ background: '#FAF8F5' }}
                        aria-label="상세 주소 보기"
                      >
                        {isExpanded ? <ChevronDown size={16} color="#C97C56" /> : <ChevronRight size={16} color="#9E8B7E" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 pb-8">
          <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: '#F0EAE2', border: '1.5px dashed rgba(201,124,86,0.3)' }}>
            <span style={{ fontSize: 28 }}>🧭</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#2A1F1A' }}>여행 성향을 선택해주세요</p>
              <p style={{ fontSize: 12, color: '#9E8B7E', marginTop: 2 }}>티맵 내비게이션 기반 공공데이터를 성향에 맞춰 연동합니다</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}