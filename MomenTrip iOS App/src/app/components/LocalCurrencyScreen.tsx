import { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';

interface Props {
  onBack: () => void;
  totalPoints: number;
}

interface Store {
  id: string;
  name: string;
  category: string;
  img: string;
  address: string;
}

interface Region {
  id: string;
  name: string;
  currency: string;
  emoji: string;
  color: string;
  stores: Store[];
}

const STORE_IMGS = {
  food: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&auto=format',
  cafe: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&auto=format',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop&auto=format',
  market: 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=400&h=300&fit=crop&auto=format',
  tourist: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop&auto=format',
  restaurant: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop&auto=format',
};

const REGIONS: Region[] = [
  {
    id: 'cheonan', name: '천안', currency: '천안사랑카드', emoji: '🌸', color: '#F5D4D4',
    stores: [
      { id: 's1', name: '천안 한우촌', category: '한우 전문점', img: STORE_IMGS.food, address: '충남 천안시 동남구 봉명동 182' },
      { id: 's2', name: '카페 어울림', category: '카페·음료', img: STORE_IMGS.cafe, address: '충남 천안시 서북구 쌍용동 441' },
      { id: 's3', name: '천안 중앙시장', category: '전통시장', img: STORE_IMGS.market, address: '충남 천안시 동남구 중앙동 24' },
    ],
  },
  {
    id: 'asan', name: '아산', currency: '아산페이', emoji: '🌿', color: '#D4E8D4',
    stores: [
      { id: 's1', name: '외암민속마을 식당', category: '한정식', img: STORE_IMGS.restaurant, address: '충남 아산시 송악면 외암리 347' },
      { id: 's2', name: '온양 전통빵집', category: '베이커리', img: STORE_IMGS.bakery, address: '충남 아산시 온양동 12-5' },
      { id: 's3', name: '신정호 카페', category: '카페·음료', img: STORE_IMGS.cafe, address: '충남 아산시 배방읍 신정리 55' },
    ],
  },
  {
    id: 'gongju', name: '공주', currency: '공주페이', emoji: '🏯', color: '#E8E0D4',
    stores: [
      { id: 's1', name: '마곡사 수목원 카페', category: '카페·관광', img: STORE_IMGS.tourist, address: '충남 공주시 사곡면 마곡사로 966' },
      { id: 's2', name: '공주 밤 요리 전문점', category: '향토음식', img: STORE_IMGS.food, address: '충남 공주시 중동 33' },
      { id: 's3', name: '금강 베이커리', category: '베이커리', img: STORE_IMGS.bakery, address: '충남 공주시 금성동 78' },
    ],
  },
  {
    id: 'boryeong', name: '보령', currency: '보령사랑상품권', emoji: '🏖️', color: '#D4DCE8',
    stores: [
      { id: 's1', name: '머드 테마 카페', category: '카페·음료', img: STORE_IMGS.cafe, address: '충남 보령시 대천해수욕장로 55' },
      { id: 's2', name: '대천 해물 칼국수', category: '해산물', img: STORE_IMGS.food, address: '충남 보령시 신흑동 66-7' },
      { id: 's3', name: '보령 전통시장', category: '전통시장', img: STORE_IMGS.market, address: '충남 보령시 중앙로 77' },
    ],
  },
  {
    id: 'seosan', name: '서산', currency: '서산사랑상품권', emoji: '🦢', color: '#D4E4E8',
    stores: [
      { id: 's1', name: '간월도 굴밥집', category: '해산물', img: STORE_IMGS.restaurant, address: '충남 서산시 부석면 간월도리 12' },
      { id: 's2', name: '서산 마늘 빵집', category: '베이커리', img: STORE_IMGS.bakery, address: '충남 서산시 동문동 44' },
      { id: 's3', name: '해미읍성 카페', category: '카페·역사', img: STORE_IMGS.cafe, address: '충남 서산시 해미면 읍내리 16' },
    ],
  },
  {
    id: 'nonsan', name: '논산', currency: '논산사랑지역화폐', emoji: '🍓', color: '#E8D4D4',
    stores: [
      { id: 's1', name: '딸기 카페 논산', category: '카페·딸기', img: STORE_IMGS.cafe, address: '충남 논산시 강경읍 강경로 88' },
      { id: 's2', name: '강경젓갈 시장', category: '전통시장', img: STORE_IMGS.market, address: '충남 논산시 강경읍 계백로 10' },
      { id: 's3', name: '논산 한우 마을', category: '한우 전문점', img: STORE_IMGS.food, address: '충남 논산시 채운면 삼거리 34' },
    ],
  },
  {
    id: 'gyeryong', name: '계룡', currency: '계룡사랑상품권', emoji: '⛰️', color: '#DCE8D4',
    stores: [
      { id: 's1', name: '계룡산 약초 식당', category: '건강식', img: STORE_IMGS.food, address: '충남 계룡시 엄사면 계룡대로 55' },
      { id: 's2', name: '두마 카페', category: '카페·음료', img: STORE_IMGS.cafe, address: '충남 계룡시 두마면 도곡리 22' },
    ],
  },
  {
    id: 'dangjin', name: '당진', currency: '당진사랑상품권', emoji: '🌾', color: '#E8E4D4',
    stores: [
      { id: 's1', name: '당진 쌀 빵집', category: '베이커리', img: STORE_IMGS.bakery, address: '충남 당진시 원당골로 11' },
      { id: 's2', name: '아미산 전망 카페', category: '카페·뷰맛집', img: STORE_IMGS.tourist, address: '충남 당진시 고대면 진관리 55' },
      { id: 's3', name: '당진 수산물 시장', category: '수산물', img: STORE_IMGS.market, address: '충남 당진시 채운동 44' },
    ],
  },
  {
    id: 'geumsan', name: '금산', currency: '금산사랑상품권', emoji: '🌿', color: '#D4E8DC',
    stores: [
      { id: 's1', name: '인삼 약초 카페', category: '카페·건강', img: STORE_IMGS.cafe, address: '충남 금산군 금산읍 인삼광장 3' },
      { id: 's2', name: '금산 인삼 시장', category: '약재시장', img: STORE_IMGS.market, address: '충남 금산군 금산읍 중도리 55' },
      { id: 's3', name: '오두산 자연 식당', category: '향토음식', img: STORE_IMGS.restaurant, address: '충남 금산군 남일면 금강로 22' },
    ],
  },
  {
    id: 'buyeo', name: '부여', currency: '굿뜨래페이', emoji: '🏛️', color: '#E8DCD4',
    stores: [
      { id: 's1', name: '백마강 유람선 카페', category: '카페·관광', img: STORE_IMGS.tourist, address: '충남 부여군 부여읍 강변로 1' },
      { id: 's2', name: '정림사지 한정식', category: '한정식', img: STORE_IMGS.restaurant, address: '충남 부여군 부여읍 정림로 14' },
      { id: 's3', name: '부여 연잎 빵집', category: '베이커리', img: STORE_IMGS.bakery, address: '충남 부여군 부여읍 사비로 33' },
    ],
  },
  {
    id: 'seocheon', name: '서천', currency: '서천사랑상품권', emoji: '🐟', color: '#D4E0E8',
    stores: [
      { id: 's1', name: '한산 모시 식당', category: '향토음식', img: STORE_IMGS.food, address: '충남 서천군 한산면 한산리 44' },
      { id: 's2', name: '장항항 수산물 센터', category: '수산물', img: STORE_IMGS.market, address: '충남 서천군 장항읍 장항로 55' },
      { id: 's3', name: '신성리 갈대 카페', category: '카페·자연', img: STORE_IMGS.cafe, address: '충남 서천군 화양면 남산리 22' },
    ],
  },
  {
    id: 'cheongyang', name: '청양', currency: '청양사랑상품권', emoji: '🌶️', color: '#E8D4D4',
    stores: [
      { id: 's1', name: '고추 나라 식당', category: '향토음식', img: STORE_IMGS.food, address: '충남 청양군 청양읍 청양로 33' },
      { id: 's2', name: '칠갑산 허브 카페', category: '카페·허브', img: STORE_IMGS.cafe, address: '충남 청양군 대치면 장곡리 11' },
    ],
  },
  {
    id: 'hongseong', name: '홍성', currency: '홍성사랑상품권', emoji: '🐄', color: '#E4E8D4',
    stores: [
      { id: 's1', name: '홍성 한우 명가', category: '한우 전문점', img: STORE_IMGS.restaurant, address: '충남 홍성군 홍성읍 고암리 22' },
      { id: 's2', name: '용봉산 전통 찻집', category: '카페·전통', img: STORE_IMGS.cafe, address: '충남 홍성군 홍북읍 상하리 55' },
      { id: 's3', name: '홍성 로컬 마켓', category: '지역마켓', img: STORE_IMGS.market, address: '충남 홍성군 홍성읍 대교리 1' },
    ],
  },
  {
    id: 'yesan', name: '예산', currency: '예산사랑상품권', emoji: '🍎', color: '#E8D8D4',
    stores: [
      { id: 's1', name: '사과 농장 카페', category: '카페·과수원', img: STORE_IMGS.tourist, address: '충남 예산군 고덕면 몽곡리 88' },
      { id: 's2', name: '예당호 수산물', category: '수산물', img: STORE_IMGS.food, address: '충남 예산군 응봉면 지석리 11' },
      { id: 's3', name: '수덕사 전통 한식', category: '한식', img: STORE_IMGS.restaurant, address: '충남 예산군 덕산면 사천리 44' },
    ],
  },
  {
    id: 'taean', name: '태안', currency: '태안사랑상품권', emoji: '🌊', color: '#D4DCE8',
    stores: [
      { id: 's1', name: '안면도 조개구이', category: '해산물', img: STORE_IMGS.food, address: '충남 태안군 안면읍 안면해변로 77' },
      { id: 's2', name: '해변 선셋 카페', category: '카페·뷰맛집', img: STORE_IMGS.cafe, address: '충남 태안군 소원면 모항리 33' },
      { id: 's3', name: '태안 꽃지 시장', category: '전통시장', img: STORE_IMGS.market, address: '충남 태안군 안면읍 꽃지해변로 22' },
    ],
  },
];

function MapCard({ store, region }: { store: Store; region: Region }) {
  return (
    <div className="mt-3 rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 16px rgba(42,31,26,0.1)' }}>
      {/* Styled map area */}
      <div
        className="relative"
        style={{ height: 150, background: '#E8EDD4' }}
      >
        {/* Map grid lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.35 }}>
          <line x1="0" y1="60" x2="100%" y2="60" stroke="#B8C8A0" strokeWidth="8" />
          <line x1="0" y1="100" x2="100%" y2="100" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="80" y1="0" x2="80" y2="100%" stroke="#B8C8A0" strokeWidth="6" />
          <line x1="220" y1="0" x2="220" y2="100%" stroke="#FFFFFF" strokeWidth="2" />
          <rect x="60" y="20" width="50" height="30" rx="4" fill="#D4D0B8" />
          <rect x="140" y="70" width="70" height="40" rx="4" fill="#D4D0B8" />
          <rect x="170" y="20" width="40" height="25" rx="4" fill="#C8C4B0" />
        </svg>
        {/* Pin */}
        <div
          className="absolute flex flex-col items-center"
          style={{ top: '25%', left: '48%', transform: 'translateX(-50%)' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#C97C56', boxShadow: '0 4px 12px rgba(201,124,86,0.5)' }}
          >
            <MapPin size={18} color="#FFF" fill="#FFF" strokeWidth={0} />
          </div>
          <div
            className="w-2 h-2 rounded-full mt-0.5"
            style={{ background: 'rgba(201,124,86,0.3)' }}
          />
        </div>
        {/* Map label badge */}
        <div
          className="absolute top-3 left-3 px-2 py-1 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.9)' }}
        >
          <span style={{ fontSize: 10, fontWeight: 600, color: '#2A1F1A' }}>{region.name} 지도</span>
        </div>
      </div>
      {/* Address panel */}
      <div
        className="px-4 py-3 flex items-start gap-3"
        style={{ background: '#FFFFFF' }}
      >
        <MapPin size={14} color="#C97C56" className="mt-0.5 flex-shrink-0" />
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A' }}>{store.name}</p>
          <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 2 }}>{store.address}</p>
        </div>
      </div>
    </div>
  );
}

export function LocalCurrencyScreen({ onBack, totalPoints }: Props) {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  if (selectedRegion) {
    return (
      <div
        className="w-full h-full flex flex-col"
        style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex-shrink-0 flex items-center gap-3">
          <button
            onClick={() => { setSelectedRegion(null); setSelectedStore(null); }}
            className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60"
            style={{ background: '#EDE5DB' }}
          >
            <ChevronLeft size={20} color="#2A1F1A" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 18 }}>{selectedRegion.emoji}</span>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#2A1F1A' }}>{selectedRegion.name}</p>
            </div>
            <p style={{ fontSize: 11, color: '#C97C56' }}>{selectedRegion.currency}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {/* Currency info card */}
          <div
            className="rounded-2xl p-4 mb-5 flex items-center gap-3"
            style={{ background: selectedRegion.color, border: '1px solid rgba(42,31,26,0.06)' }}
          >
            <span style={{ fontSize: 28 }}>🏦</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A' }}>{selectedRegion.currency}</p>
              <p style={{ fontSize: 11, color: '#6B5040', marginTop: 2 }}>
                보유 포인트를 지역화폐로 전환하여 사용할 수 있어요
              </p>
            </div>
          </div>

          <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A', marginBottom: 12 }}>
            가맹점 목록 ({selectedRegion.stores.length}곳)
          </p>

          {/* Store list */}
          <div className="flex flex-col gap-3">
            {selectedRegion.stores.map(store => (
              <div key={store.id}>
                <button
                  onClick={() => setSelectedStore(selectedStore?.id === store.id ? null : store)}
                  className="w-full text-left active:opacity-80 transition-opacity"
                >
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      boxShadow: selectedStore?.id === store.id
                        ? '0 4px 16px rgba(201,124,86,0.2)'
                        : '0 2px 10px rgba(42,31,26,0.06)',
                      border: selectedStore?.id === store.id
                        ? '1.5px solid rgba(201,124,86,0.3)'
                        : '1.5px solid transparent',
                    }}
                  >
                    <div className="relative" style={{ height: 100 }}>
                      <img
                        src={store.img}
                        alt={store.name}
                        className="w-full h-full object-cover"
                        style={{ filter: 'brightness(0.95) saturate(0.9)' }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(to top, rgba(42,31,26,0.5), transparent)' }}
                      />
                      <span
                        className="absolute bottom-2 left-3 px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 600, color: '#2A1F1A' }}
                      >
                        {store.category}
                      </span>
                    </div>
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{ background: '#FFFFFF' }}
                    >
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#2A1F1A' }}>{store.name}</p>
                      <ChevronRight
                        size={16}
                        color={selectedStore?.id === store.id ? '#C97C56' : '#9E8B7E'}
                        style={{ transform: selectedStore?.id === store.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                      />
                    </div>
                  </div>
                </button>
                {/* Map card expands below selected store */}
                {selectedStore?.id === store.id && (
                  <MapCard store={store} region={selectedRegion} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Region list
  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex-shrink-0 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60"
          style={{ background: '#EDE5DB' }}
        >
          <ChevronLeft size={20} color="#2A1F1A" />
        </button>
        <div className="flex-1">
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>지역화폐</p>
          <p style={{ fontSize: 11, color: '#9E8B7E' }}>충청남도 15개 지역</p>
        </div>
      </div>

      {/* Balance strip */}
      <div className="px-5 mb-3 flex-shrink-0">
        <div
          className="rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{ background: '#F5EFE6', border: '1.5px solid rgba(201,124,86,0.2)' }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 16 }}>🪙</span>
            <span style={{ fontSize: 13, color: '#2A1F1A', fontWeight: 600 }}>전환 가능 포인트</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#C97C56' }}>{totalPoints.toLocaleString()}P</span>
        </div>
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, color: '#9E8B7E', paddingLeft: 20, marginBottom: 8, flexShrink: 0 }}>
        지역 선택
      </p>

      {/* Region grid */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="grid grid-cols-3 gap-3">
          {REGIONS.map(region => (
            <button
              key={region.id}
              onClick={() => setSelectedRegion(region)}
              className="rounded-2xl p-3 text-center active:scale-95 transition-all"
              style={{
                background: region.color,
                border: '1px solid rgba(42,31,26,0.06)',
                boxShadow: '0 2px 8px rgba(42,31,26,0.06)',
              }}
            >
              <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>{region.emoji}</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A' }}>{region.name}</p>
              <p style={{ fontSize: 9, color: '#6B5040', marginTop: 2, lineHeight: 1.3 }}>
                {region.currency}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
