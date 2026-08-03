import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, MapPin, Clock, Sparkles, Compass, Loader2 } from 'lucide-react';

// 💡 로컬 JSON 파일 및 음식점 데이터 임포트
import originalTourData from '../../data/chungnam_tours.json';
import detailedTourData from '../../data/chungnam_tours_detailed.json';
import { FOOD_DATA } from '../../data/food_data';

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

  // 💡 관광 데이터와 food_data.ts의 음식점/카페 데이터를 조합하여 점심, 저녁, 카페 코스 구성
  useEffect(() => {
    if (!selected) return;

    const loadLocalData = () => {
      setLoading(true);
      setError(null);
      try {
        // 1. 관광 명소 데이터 병합
        const rawTourData = [
          ...detailedTourData,
          ...originalTourData.map((item: any) => ({
            ...item,
            관광지명: item.관광지명,
            관광지주소: item['관광지 주소'],
            관광지연락처: item['관광지 연락처'],
            관광지구분: '관광지',
            관광지소개: `${item.시군명}에 위치한 매력적인 관광 명소입니다.`
          }))
        ];

        // 선택한 시군명으로 관광지 필터링
        let filteredTours = rawTourData.filter((item: any) => item.시군명 === selectedCity);

        // 2. food_data.ts에서 선택한 도시(예: 천안시 등)에 해당하는 음식점/카페 필터링
        const filteredFood = FOOD_DATA.filter((item: any) => 
          item.도로명주소 && item.도로명주소.includes(selectedCity)
        );

        // 음식점과 카페 분류
        const restaurants = filteredFood.filter((item: any) => 
          !item.업태구분명?.includes('카페') && !item.업태구분명?.includes('다방')
        );
        const cafes = filteredFood.filter((item: any) => 
          item.업태구분명?.includes('카페') || item.업태구분명?.includes('다방')
        );

        // P형일 때는 즉흥성을 위해 리스트를 랜덤하게 섞음
        if (selected === 'P') {
          filteredTours = [...filteredTours].sort(() => Math.random() - 0.5);
        }

        // 기본 관광지 아이템 매핑
        let mappedPlans: PlanItem[] = filteredTours.map((item: any, index: number) => {
          let category = item.관광지구분 || '관광지';
          let emoji = '🏛️';
          const name = item.관광지명 || '';
          
          if (name.includes('식당') || name.includes('국밥') || name.includes('회관') || name.includes('음식')) {
            category = '식당';
            emoji = '🍽️';
          } else if (name.includes('카페') || name.includes('커피')) {
            category = '카페';
            emoji = '☕';
          } else {
            const emojis = ['🏛️', '🌿', '🌊', '⛩️', '📸', '🌲'];
            emoji = emojis[index % emojis.length];
          }

          return {
            id: (item.연번 || index) + index * 1000,
            time: selected === 'J' ? `${9 + (index * 2) % 10}:00 - ${11 + (index * 2) % 10}:00` : undefined,
            badge: selected === 'J' ? `코스 ${index + 1}` : '티맵 핫플',
            title: name,
            desc: item.관광지소개 || `${item.시군명}의 매력적인 공간입니다.`,
            addr: item.관광지주소 || '주소 정보 없음',
            emoji,
            category
          };
        });

        // 3. food_data 기반 점심, 저녁, 카페 항목을 코스 중간중간에 삽입 (데이터가 있는 경우)
        const lunchSpot = restaurants[0];
        const cafeSpot = cafes[0] || restaurants[1];
        const dinnerSpot = restaurants[2] || restaurants[1];

        if (selected === 'J') {
          // J형(계획형): 시간대별(점심, 카페, 저녁) 코스로 재구성
          const structuredPlans: PlanItem[] = [];
          
          if (mappedPlans.length > 0) {
            structuredPlans.push({ ...mappedPlans[0], time: '10:00 - 11:30', badge: '오전 코스', category: '관광지' });
          }

          if (lunchSpot) {
            structuredPlans.push({
              id: 99991,
              time: '12:00 - 13:30',
              badge: '점심 식사',
              title: lunchSpot.사업장명,
              desc: `${selectedCity} 추천 맛집 (${lunchSpot.업태구분명})`,
              addr: lunchSpot.도로명주소,
              emoji: '🍽️',
              category: '식당'
            });
          }

          if (mappedPlans.length > 1) {
            structuredPlans.push({ ...mappedPlans[1], time: '14:00 - 15:30', badge: '오후 코스', category: '관광지' });
          }

          if (cafeSpot) {
            structuredPlans.push({
              id: 99992,
              time: '16:00 - 17:00',
              badge: '디저트 카페',
              title: cafeSpot.사업장명,
              desc: `${selectedCity} 분위기 좋은 카페/디저트`,
              addr: cafeSpot.도로명주소,
              emoji: '☕',
              category: '카페'
            });
          }

          if (dinnerSpot) {
            structuredPlans.push({
              id: 99993,
              time: '18:00 - 19:30',
              badge: '저녁 식사',
              title: dinnerSpot.사업장명,
              desc: `${selectedCity} 저녁 추천 맛집 (${dinnerSpot.업태구분명})`,
              addr: dinnerSpot.도로명주소,
              emoji: '🍖',
              category: '식당'
            });
          }

          if (structuredPlans.length > 0) {
            mappedPlans = structuredPlans;
          }
        } else {
          // P형(즉흥형): 핫플 목록에 맛집과 카페를 골고루 섞어줌
          const foodItems: PlanItem[] = [];
          if (lunchSpot) {
            foodItems.push({
              id: 88881,
              badge: '티맵 인기 맛집',
              title: lunchSpot.사업장명,
              desc: `${selectedCity} 실시간 추천 맛집`,
              addr: lunchSpot.도로명주소,
              emoji: '🍽️',
              category: '식당'
            });
          }
          if (cafeSpot) {
            foodItems.push({
              id: 88882,
              badge: '티맵 인기 카페',
              title: cafeSpot.사업장명,
              desc: `${selectedCity} 핫한 감성 카페`,
              addr: cafeSpot.도로명주소,
              emoji: '☕',
              category: '카페'
            });
          }
          if (dinnerSpot) {
            foodItems.push({
              id: 88883,
              badge: '티맵 인기 맛집',
              title: dinnerSpot.사업장명,
              desc: `${selectedCity} 저녁 핫플레이스`,
              addr: dinnerSpot.도로명주소,
              emoji: '🍷',
              category: '식당'
            });
          }
          // 관광지와 맛집/카페를 섞어서 배치
          mappedPlans = [...foodItems, ...mappedPlans].slice(0, 8);
        }

        setCurrentPlans(mappedPlans);
      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        setCurrentPlans([]);
      } finally {
        setLoading(false);
      }
    };

    loadLocalData();
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
                {selectedCity} {selected === 'J' ? 'J형 계획형 코스 (점심·저녁·카페 포함)' : 'P형 티맵 핫플 코스'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full" style={{ background: '#F0EAE2', fontSize: 10, fontWeight: 600, color: '#C97C56' }}>
              {selected === 'J' ? '시간별 맞춤 코스' : '즉흥형 핫플'}
            </span>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="animate-spin" size={28} color="#C97C56" />
              <p style={{ fontSize: 13, color: '#9E8B7E' }}>맛집 및 관광 데이터를 조합하는 중...</p>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl p-5 text-center bg-red-50 border border-red-100">
              <p style={{ fontSize: 13, color: '#E53E3E', fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {!loading && !error && currentPlans.length === 0 && (
            <div className="rounded-2xl p-8 text-center bg-white border border-stone-100">
              <p style={{ fontSize: 13, color: '#9E8B7E' }}>조회된 데이터가 없습니다.</p>
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