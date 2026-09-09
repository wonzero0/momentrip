import { useMemo, useState } from 'react';
import { ChevronRight, Home, MapPin } from 'lucide-react';
import {
  CHUNGNAM_REGIONS,
  FOOD_PLACES,
  TOUR_PLACES,
  cityNames,
  foodPlacesByRegion,
  tourPlacesByCity,
  type FoodPlace,
  type TourPlace,
} from '../data/chungnam';

interface Props {
  onHome: () => void;
}

type PersonType = 'J' | 'P';

interface PlanItem {
  title: string;
  desc: string;
  emoji: string;
  imageUrl: string;
}

function cityPalette(cityName: string) {
  const region = CHUNGNAM_REGIONS.find((item) => item.name === cityName);
  return region ?? CHUNGNAM_REGIONS[0];
}

function compactCityName(cityName: string) {
  return cityName.replace(/(시|군)$/u, '');
}

function buildPlan(type: PersonType, cityName: string, tours: TourPlace[], foods: FoodPlace[]): PlanItem[] {
  const fallbackTour = TOUR_PLACES[0];
  const fallbackFood = FOOD_PLACES[0];
  const firstTour = tours[0] ?? fallbackTour;
  const secondTour = tours[1] ?? tours[0] ?? fallbackTour;
  const firstFood = foods[0] ?? fallbackFood;
  const secondFood = foods[1] ?? foods[0] ?? fallbackFood;
  const compactCity = compactCityName(cityName);

  if (type === 'J') {
    return [
      {
        emoji: '🗺️',
        imageUrl: firstTour.imageUrl,
        title: `${firstTour.name} 중심 코스`,
        desc: `${firstTour.category} 방문 후 ${firstFood.name}까지 이어지는 계획형 동선`,
      },
      {
        emoji: '🍽️',
        imageUrl: firstFood.imageUrl,
        title: `${compactCity} 지역화폐 식사`,
        desc: `${firstFood.category} 가맹점에서 포인트 전환 사용을 고려해보세요`,
      },
      {
        emoji: '📍',
        imageUrl: secondTour.imageUrl,
        title: `${secondTour.name} 예비 일정`,
        desc: `날씨나 이동 시간에 따라 바꿔 넣기 좋은 ${secondTour.category} 여행지`,
      },
    ];
  }

  return [
    {
      emoji: '🎲',
      imageUrl: firstTour.imageUrl,
      title: `${compactCity} 즉흥 산책`,
      desc: `${firstTour.name} 주변을 걷다가 가까운 로컬 장소를 고르는 흐름`,
    },
    {
      emoji: '☕',
      imageUrl: secondFood.imageUrl,
      title: `${secondFood.name} 들르기`,
      desc: `${secondFood.category} 분위기로 쉬어가기 좋은 후보`,
    },
    {
      emoji: '📸',
      imageUrl: secondTour.imageUrl,
      title: `${secondTour.name} 사진 스폿`,
      desc: `${secondTour.desc}`,
    },
  ];
}

export function MeohalTab({ onHome }: Props) {
  const cities = cityNames();
  const [selected, setSelected] = useState<PersonType>('J');
  const [selectedCity, setSelectedCity] = useState(cities[0]);

  const region = cityPalette(selectedCity);
  const tours = useMemo(() => tourPlacesByCity(selectedCity), [selectedCity]);
  const foods = useMemo(() => foodPlacesByRegion(selectedCity), [selectedCity]);
  const plan = useMemo(() => buildPlan(selected, selectedCity, tours, foods), [selected, selectedCity, tours, foods]);

  return (
    <div
      className="w-full h-full overflow-y-auto"
      style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={onHome}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:opacity-70"
          style={{ background: '#EDE5DB' }}
          aria-label="홈 탭으로 이동"
        >
          <Home size={17} color="#2A1F1A" />
        </button>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>뭐할까유</p>
        <div style={{ width: 36 }} />
      </div>

      <div className="px-5 pt-2 pb-4">
        <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>충남에서 뭐할까유?</p>
        <p style={{ fontSize: 13, color: '#9E8B7E', marginTop: 4 }}>
          여행 성향과 지역을 고르면 관광지와 로컬 음식점을 함께 추천해요
        </p>
      </div>

      <div className="px-5 grid grid-cols-2 gap-3 mb-5">
        {(['J', 'P'] as PersonType[]).map((type) => {
          const active = selected === type;
          return (
            <button
              key={type}
              onClick={() => setSelected(type)}
              className="p-4 text-left active:scale-95 transition-all relative"
              style={{
                minHeight: 132,
                borderRadius: 20,
                background: active
                  ? type === 'J'
                    ? 'linear-gradient(135deg, #2A1F1A 0%, #5A4436 100%)'
                    : 'linear-gradient(135deg, #C97C56 0%, #A85A38 100%)'
                  : '#FFFFFF',
                boxShadow: active ? '0 10px 28px rgba(42,31,26,0.18)' : '0 3px 14px rgba(42,31,26,0.07)',
                border: active ? 'none' : '1px solid rgba(42,31,26,0.06)',
              }}
            >
              <div
                className="w-11 h-11 flex items-center justify-center mb-5"
                style={{
                  borderRadius: 16,
                  background: active ? 'rgba(255,255,255,0.16)' : type === 'J' ? '#F0EAE2' : '#FFF0E6',
                }}
              >
                <span style={{ fontSize: 23 }}>{type === 'J' ? '📋' : '🎲'}</span>
              </div>
              <p style={{ fontSize: 26, fontWeight: 800, color: active ? '#FAF8F5' : '#2A1F1A' }}>
                {type}형
              </p>
              <p style={{ fontSize: 11, color: active ? 'rgba(250,248,245,0.72)' : '#9E8B7E', marginTop: 2 }}>
                {type === 'J' ? '계획형 코스' : '즉흥형 발견'}
              </p>
            </button>
          );
        })}
      </div>

      <div className="px-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>지역 선택</p>
          <span style={{ fontSize: 11, color: '#C97C56', fontWeight: 700 }}>{region.currency}</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {cities.map((city) => {
            const active = city === selectedCity;
            const item = cityPalette(city);
            return (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className="px-3 py-2 rounded-full flex items-center gap-1.5 active:scale-95 transition-all flex-shrink-0"
                style={{
                  background: active ? '#2A1F1A' : '#FFFFFF',
                  color: active ? '#FFFFFF' : '#2A1F1A',
                  border: active ? '1px solid #2A1F1A' : '1px solid rgba(42,31,26,0.08)',
                  boxShadow: active ? '0 6px 14px rgba(42,31,26,0.18)' : '0 2px 8px rgba(42,31,26,0.05)',
                }}
              >
                <span style={{ fontSize: 13 }}>{item.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{compactCityName(city)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pb-8">
        <div
          className="p-4 mb-4"
          style={{
            borderRadius: 20,
            background: '#FFFFFF',
            boxShadow: '0 3px 16px rgba(42,31,26,0.07)',
            border: '1px solid rgba(201,124,86,0.12)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 flex items-center justify-center flex-shrink-0"
              style={{ borderRadius: 16, background: '#F5EFE6', fontSize: 24 }}
            >
              {region.emoji}
            </div>
            <div className="flex-1">
              <p style={{ fontSize: 15, fontWeight: 800, color: '#2A1F1A' }}>{selectedCity} 추천 플랜</p>
              <p style={{ fontSize: 12, color: '#9E8B7E', marginTop: 3 }}>
                관광지 {tours.length || 1}곳과 음식점 {foods.length || 1}곳을 조합했어요
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            {plan.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="flex items-center gap-3 p-3"
                style={{ borderRadius: 16, background: index === 0 ? '#FAF8F5' : '#FFFFFF' }}
              >
                <div
                  className="w-12 h-12 flex-shrink-0 overflow-hidden"
                  style={{ borderRadius: 14, background: '#F0EAE2' }}
                >
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A' }}>{item.title}</p>
                  <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 2, lineHeight: 1.45 }}>{item.desc}</p>
                </div>
                <ChevronRight size={15} color="#B9A79A" />
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A', marginBottom: 12 }}>
          바로 갈 만한 곳
        </p>
        <div className="flex flex-col gap-3">
          {[...tours.slice(0, 2), ...foods.slice(0, 2)].map((item) => {
            const isTour = 'city' in item;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4"
                style={{ borderRadius: 20, background: '#FFFFFF', boxShadow: '0 2px 12px rgba(42,31,26,0.06)' }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-16 h-16 object-cover flex-shrink-0"
                  style={{ borderRadius: 16, background: isTour ? '#EEF3E8' : '#FFF0E6' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A' }}>{item.name}</p>
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ background: isTour ? '#EEF3E8' : '#FFF0E6', fontSize: 9, fontWeight: 700, color: isTour ? '#65814E' : '#C97C56' }}
                    >
                      {isTour ? '관광' : '음식'}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 3 }}>{item.category}</p>
                  <div className="flex items-start gap-1.5 mt-2">
                    <MapPin size={12} color="#C97C56" className="mt-0.5 flex-shrink-0" />
                    <p style={{ fontSize: 10, color: '#9E8B7E', lineHeight: 1.35 }}>{item.address}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
