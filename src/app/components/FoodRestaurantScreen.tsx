import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { FOOD_DATA } from '../../data/food_data';

export type AppScreen = 
  | 'intro' | 'login' | 'signup' | 'main' | 'mission' | 'diary' 
  | 'photocheck' | 'reward' | 'localcurrency' | 'foodrestaurant'                  
  | 'localcurrency-select' | 'accountmgmt' | 'notifications' | 'appinfo' | 'contact';

export function FoodRestaurantScreen({ onNavigate }: { onNavigate: (s: AppScreen) => void }) {
  const [selectedRegion, setSelectedRegion] = useState<string>('천안시');
  const [visibleCount, setVisibleCount] = useState<number>(30);

  const regions = [
    '천안시', '공주시', '보령시', '아산시', '서산시', 
    '논산시', '계룡시', '당진시', '금산군', '부여군', 
    '서천군', '청양군', '홍성군', '예산군', '태안군'
  ];

  const filteredRestaurants = FOOD_DATA.filter((t: any) => {
    if (!t || !t.도로명주소) return false;
    return t.도로명주소.includes(selectedRegion);
  });

  const currentList = filteredRestaurants.slice(0, visibleCount);

  return (
    // 💡 absolute와 inset-0을 주어 부모 영역 전체를 강제로 채우도록 수정
    <div className="absolute inset-0 w-full h-full flex flex-col bg-[#FAF8F5] z-50 overflow-hidden" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      {/* 상단 헤더 */}
      <div className="px-5 pt-4 pb-3 flex-shrink-0 flex items-center gap-3 bg-[#FAF8F5]">
        <button onClick={() => onNavigate('reward')} className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60" style={{ background: '#EDE5DB' }}>
          <ChevronLeft size={20} color="#2A1F1A" />
        </button>
        <div className="flex-1">
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>지역화폐 가맹 음식점</p>
          <p style={{ fontSize: 11, color: '#9E8B7E' }}>충청남도 지역화폐 사용 가능 업소 안내</p>
        </div>
      </div>

      {/* 지역 선택 탭 */}
      <div className="px-5 pb-2 flex-shrink-0 overflow-x-auto flex gap-1.5 no-scrollbar bg-[#FAF8F5]">
        {regions.map((reg) => (
          <button
            key={reg}
            onClick={() => {
              setSelectedRegion(reg);
              setVisibleCount(30);
            }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
            style={{
              background: selectedRegion === reg ? '#C97C56' : '#EDE5DB',
              color: selectedRegion === reg ? '#FFFFFF' : '#2A1F1A',
            }}
          >
            {reg}
          </button>
        ))}
      </div>

      {/* 리스트 영역 */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 pt-2 no-scrollbar">
        <div className="mb-3 flex items-center justify-between">
          <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>{selectedRegion} 가맹점 목록</p>
          <span style={{ fontSize: 11, color: '#9E8B7E' }}>총 {filteredRestaurants.length}곳 중 표시중</span>
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: '#EDE5DB', color: '#6B4C38' }}>
            해당 지역의 등록된 가맹점 정보가 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-10">
            {currentList.map((t: any, idx: number) => (
              <div key={idx} className="rounded-2xl p-4" style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}>
                <div className="flex items-start justify-between">
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#2A1F1A' }}>{t.사업장명}</span>
                  <span className="px-2 py-0.5 rounded-md" style={{ fontSize: 10, background: '#F5EFE6', color: '#C97C56', fontWeight: 600 }}>
                    {t.업태구분명}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#6B4C38', marginTop: 6 }}>📍 {t.도로명주소}</p>
              </div>
            ))}

            {visibleCount < filteredRestaurants.length && (
              <button
                onClick={() => setVisibleCount(prev => prev + 30)}
                className="w-full py-3 rounded-xl mt-2 font-bold text-sm transition-all active:scale-95"
                style={{ background: '#EDE5DB', color: '#2A1F1A' }}
              >
                더보기 ({visibleCount}/{filteredRestaurants.length})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}