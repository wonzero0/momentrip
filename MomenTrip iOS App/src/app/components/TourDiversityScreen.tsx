import { ChevronLeft, Compass, MapPin, TrendingUp } from 'lucide-react';
import { CHUNGNAM_REGIONS, TOUR_PLACES, tourPlacesByCity } from '../data/chungnam';

interface Props {
  onBack: () => void;
}

const sortedRegions = [...CHUNGNAM_REGIONS].sort((a, b) => b.visitorIndex - a.visitorIndex);
const topRegion = sortedRegions[0];
const averageVisitorIndex = Math.round(
  CHUNGNAM_REGIONS.reduce((sum, region) => sum + region.visitorIndex, 0) / CHUNGNAM_REGIONS.length
);

function compactRegionName(regionName: string) {
  return regionName.replace(/(시|군)$/u, '');
}

function barWidth(value: number) {
  return `${Math.min(100, Math.max(0, value))}%`;
}

export function TourDiversityScreen({ onBack }: Props) {
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
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>관광 다양성</p>
          <p style={{ fontSize: 11, color: '#9E8B7E' }}>충남 지역별 방문 후보 비교</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div
          className="p-5 mb-4"
          style={{
            borderRadius: 20,
            background: 'linear-gradient(135deg, #C97C56 0%, #8F5B3D 100%)',
            boxShadow: '0 10px 28px rgba(201,124,86,0.25)',
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-12 h-12 flex items-center justify-center"
              style={{ borderRadius: 16, background: 'rgba(255,255,255,0.16)' }}
            >
              <Compass size={24} color="#FFFFFF" />
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'rgba(250,248,245,0.66)' }}>상위 방문 후보</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', marginTop: 1 }}>
                {topRegion.emoji} {topRegion.name}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3" style={{ borderRadius: 16, background: 'rgba(255,255,255,0.12)' }}>
              <p style={{ fontSize: 10, color: 'rgba(250,248,245,0.65)' }}>평균 방문 지수</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', marginTop: 3 }}>{averageVisitorIndex}</p>
            </div>
            <div className="p-3" style={{ borderRadius: 16, background: 'rgba(255,255,255,0.12)' }}>
              <p style={{ fontSize: 10, color: 'rgba(250,248,245,0.65)' }}>추천 장소</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', marginTop: 3 }}>{TOUR_PLACES.length}</p>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A', marginBottom: 12 }}>지역별 비교</p>
        <div className="flex flex-col gap-3 mb-5">
          {sortedRegions.map((region, index) => {
            const tours = tourPlacesByCity(region.name);
            return (
              <div
                key={region.id}
                className="p-4"
                style={{
                  borderRadius: 20,
                  background: '#FFFFFF',
                  boxShadow: '0 2px 12px rgba(42,31,26,0.06)',
                  border: index === 0 ? '1px solid rgba(201,124,86,0.35)' : '1px solid rgba(42,31,26,0.04)',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                    style={{ borderRadius: 14, background: '#F5EFE6', fontSize: 20 }}
                  >
                    {region.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#2A1F1A' }}>{region.name}</p>
                      {index === 0 && (
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{ background: '#FFF0E6', fontSize: 9, fontWeight: 800, color: '#C97C56' }}
                        >
                          TOP
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 1 }}>{region.currency}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ fontSize: 18, fontWeight: 800, color: '#C97C56' }}>{region.visitorIndex.toFixed(1)}</p>
                    <p style={{ fontSize: 10, color: '#9E8B7E' }}>방문</p>
                  </div>
                </div>

                <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: '#F0EAE2' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: barWidth(region.visitorIndex), background: '#C97C56' }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={13} color="#65814E" />
                    <span style={{ fontSize: 11, color: '#6B5040' }}>
                      소비 지수 {region.consumerIndex.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} color="#C97C56" />
                    <span style={{ fontSize: 11, color: '#9E8B7E' }}>
                      {compactRegionName(region.name)} 후보 {Math.max(1, tours.length)}곳
                    </span>
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
