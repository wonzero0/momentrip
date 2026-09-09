import { useMemo, useState } from 'react';
import { ChevronLeft, MapPin, Search, Store } from 'lucide-react';
import { CHUNGNAM_REGIONS, FOOD_PLACES } from '../data/chungnam';

interface Props {
  onBack: () => void;
}

function compactRegionName(regionName: string) {
  return regionName.replace(/(시|군)$/u, '');
}

export function FoodRestaurantScreen({ onBack }: Props) {
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [query, setQuery] = useState('');

  const filteredPlaces = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return FOOD_PLACES.filter((place) => {
      const regionMatched = selectedRegion === '전체' || place.region === selectedRegion;
      const keywordMatched = !keyword || [place.name, place.category, place.address, place.region]
        .some((text) => text.toLowerCase().includes(keyword));
      return regionMatched && keywordMatched;
    });
  }, [query, selectedRegion]);

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <div className="px-5 pt-4 pb-3 flex-shrink-0 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60"
          style={{ background: '#EDE5DB' }}
          aria-label="뒤로가기"
        >
          <ChevronLeft size={20} color="#2A1F1A" />
        </button>
        <div className="flex-1">
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>지역화폐 음식점</p>
          <p style={{ fontSize: 11, color: '#9E8B7E' }}>충남 로컬 사용처 후보</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div
          className="p-4 mb-4"
          style={{
            borderRadius: 20,
            background: 'linear-gradient(135deg, #2A1F1A 0%, #4A3020 100%)',
            boxShadow: '0 10px 28px rgba(42,31,26,0.22)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 flex items-center justify-center"
              style={{ borderRadius: 16, background: 'rgba(255,255,255,0.12)' }}
            >
              <Store size={23} color="#D4A070" />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#FAF8F5' }}>
                {filteredPlaces.length}곳
              </p>
              <p style={{ fontSize: 12, color: 'rgba(250,248,245,0.65)', marginTop: 2 }}>
                지역과 키워드로 바로 찾는 음식점 목록
              </p>
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 mb-4"
          style={{ borderRadius: 16, background: '#FFFFFF', border: '1px solid rgba(42,31,26,0.08)' }}
        >
          <Search size={16} color="#9E8B7E" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="음식점, 분류, 주소 검색"
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: 13, color: '#2A1F1A' }}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          {['전체', ...CHUNGNAM_REGIONS.map((region) => region.name)].map((regionName) => {
            const active = selectedRegion === regionName;
            const region = CHUNGNAM_REGIONS.find((item) => item.name === regionName);
            return (
              <button
                key={regionName}
                onClick={() => setSelectedRegion(regionName)}
                className="px-3 py-2 rounded-full flex items-center gap-1.5 active:scale-95 transition-all flex-shrink-0"
                style={{
                  background: active ? '#C97C56' : '#FFFFFF',
                  color: active ? '#FFFFFF' : '#2A1F1A',
                  border: active ? '1px solid #C97C56' : '1px solid rgba(42,31,26,0.08)',
                }}
              >
                {region && <span style={{ fontSize: 13 }}>{region.emoji}</span>}
                <span style={{ fontSize: 12, fontWeight: 700 }}>
                  {regionName === '전체' ? '전체' : compactRegionName(regionName)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          {filteredPlaces.map((place) => {
            return (
              <div
                key={place.id}
                className="p-4"
                style={{
                  borderRadius: 20,
                  background: '#FFFFFF',
                  boxShadow: '0 2px 12px rgba(42,31,26,0.06)',
                  border: '1px solid rgba(42,31,26,0.04)',
                }}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={place.imageUrl}
                    alt={place.name}
                    className="w-20 h-20 object-cover flex-shrink-0"
                    style={{ borderRadius: 16, background: '#F0EAE2' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#2A1F1A' }}>{place.name}</p>
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{ background: '#F5EFE6', fontSize: 9, fontWeight: 700, color: '#C97C56' }}
                      >
                        {compactRegionName(place.region)}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#6B5040', fontWeight: 600 }}>{place.category}</p>
                    <div className="flex items-start gap-1.5 mt-2">
                      <MapPin size={13} color="#C97C56" className="mt-0.5 flex-shrink-0" />
                      <p style={{ fontSize: 11, color: '#9E8B7E', lineHeight: 1.4 }}>{place.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPlaces.length === 0 && (
            <div
              className="p-6 text-center"
              style={{ borderRadius: 20, background: '#FFFFFF', boxShadow: '0 2px 12px rgba(42,31,26,0.06)' }}
            >
              <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>검색 결과가 없어요</p>
              <p style={{ fontSize: 12, color: '#9E8B7E', marginTop: 4 }}>다른 지역이나 키워드를 선택해보세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
