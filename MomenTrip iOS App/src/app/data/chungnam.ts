export interface ChungnamRegion {
  id: string;
  name: string;
  fullName: string;
  currency: string;
  emoji: string;
  consumerIndex: number;
  visitorIndex: number;
}

export interface FoodPlace {
  id: string;
  region: string;
  name: string;
  category: string;
  address: string;
  imageUrl: string;
}

export interface TourPlace {
  id: string;
  city: string;
  name: string;
  category: string;
  address: string;
  desc: string;
  emoji: string;
  imageUrl: string;
}

const COMMONS_FILE = 'https://commons.wikimedia.org/wiki/Special:FilePath/';

const FOOD_IMAGES = {
  beef: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=700&h=460&fit=crop&auto=format',
  cafe: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=700&h=460&fit=crop&auto=format',
  market: 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=700&h=460&fit=crop&auto=format',
  seafood: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=700&h=460&fit=crop&auto=format',
  koreanTable: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=700&h=460&fit=crop&auto=format',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=700&h=460&fit=crop&auto=format',
  strawberry: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=700&h=460&fit=crop&auto=format',
  herb: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=700&h=460&fit=crop&auto=format',
  orchard: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=700&h=460&fit=crop&auto=format',
};

const TOUR_IMAGES: Record<string, string> = {
  'cheonan-tour-1': `${COMMONS_FILE}%EB%8F%85%EB%A6%BD%EA%B8%B0%EB%85%90%EA%B4%80_20181018.jpg?width=900`,
  'cheonan-tour-2': 'https://images.unsplash.com/photo-1545987796-200677ee1011?w=900&h=600&fit=crop&auto=format',
  'gongju-tour-1': `${COMMONS_FILE}Korea-Gongju-Gongsanseong-01.jpg?width=900`,
  'gongju-tour-2': `${COMMONS_FILE}Magoksa.JPG?width=900`,
  'boryeong-tour-1': `${COMMONS_FILE}Korea-Boryeong-Daecheon_Beach-01.jpg?width=900`,
  'asan-tour-1': `${COMMONS_FILE}Oeam_Folk_Village%2C_2006_%283%29.jpg?width=900`,
  'seosan-tour-1': `${COMMONS_FILE}Haemieupseong_Castle.jpg?width=900`,
  'nonsan-tour-1': 'https://storage.googleapis.com/cr-resource/image/ad1a43e7562ee454d987131b5e0756f2/sunshinestudio/650/c6af60fe2d0d05f04200a500bd9c1170.jpg?_1785814794',
  'dangjin-tour-1': `${COMMONS_FILE}Sapgyoho_amusement_park%2C_Dangjin%2C_South_Chungcheong_Province%2C_South_Korea.jpg?width=900`,
  'buyeo-tour-1': `${COMMONS_FILE}%EA%B6%81%EB%82%A8%EC%A7%80-Gungnamji-10.jpg?width=900`,
  'yesan-tour-1': `${COMMONS_FILE}%EC%98%88%EB%8B%B9%EC%B6%9C%EB%A0%81%EB%8B%A4%EB%A6%AC-%EC%82%AC%EC%9E%A5%EA%B5%90.jpg?width=900`,
  'taean-tour-1': `${COMMONS_FILE}%EA%BD%83%EC%A7%80%EC%9D%98%EC%84%9D%EC%96%91.jpg?width=900`,
};

function foodImageForCategory(category: string) {
  if (category.includes('한우')) return FOOD_IMAGES.beef;
  if (category.includes('카페')) return category.includes('딸기') ? FOOD_IMAGES.strawberry : FOOD_IMAGES.cafe;
  if (category.includes('시장') || category.includes('마켓') || category.includes('수산물') || category.includes('약재')) {
    return FOOD_IMAGES.market;
  }
  if (category.includes('해산물') || category.includes('조개') || category.includes('굴')) return FOOD_IMAGES.seafood;
  if (category.includes('베이커리')) return FOOD_IMAGES.bakery;
  if (category.includes('건강') || category.includes('약초')) return FOOD_IMAGES.herb;
  if (category.includes('과수원')) return FOOD_IMAGES.orchard;
  return FOOD_IMAGES.koreanTable;
}

export const CHUNGNAM_REGIONS: ChungnamRegion[] = [
  { id: 'cheonan', name: '천안시', fullName: '충청남도 천안시', currency: '천안사랑카드', emoji: '🌸', consumerIndex: 80.92, visitorIndex: 85.1 },
  { id: 'gongju', name: '공주시', fullName: '충청남도 공주시', currency: '공주페이', emoji: '🏯', consumerIndex: 65.4, visitorIndex: 71.2 },
  { id: 'boryeong', name: '보령시', fullName: '충청남도 보령시', currency: '보령사랑상품권', emoji: '🏖️', consumerIndex: 66.61, visitorIndex: 74.3 },
  { id: 'asan', name: '아산시', fullName: '충청남도 아산시', currency: '아산페이', emoji: '🌿', consumerIndex: 75.96, visitorIndex: 79.8 },
  { id: 'seosan', name: '서산시', fullName: '충청남도 서산시', currency: '서산사랑상품권', emoji: '🦢', consumerIndex: 70.12, visitorIndex: 73.5 },
  { id: 'nonsan', name: '논산시', fullName: '충청남도 논산시', currency: '논산사랑지역화폐', emoji: '🍓', consumerIndex: 67.83, visitorIndex: 69.4 },
  { id: 'gyeryong', name: '계룡시', fullName: '충청남도 계룡시', currency: '계룡사랑상품권', emoji: '⛰️', consumerIndex: 63.25, visitorIndex: 61.9 },
  { id: 'dangjin', name: '당진시', fullName: '충청남도 당진시', currency: '당진사랑상품권', emoji: '🌾', consumerIndex: 72.4, visitorIndex: 76.1 },
  { id: 'geumsan', name: '금산군', fullName: '충청남도 금산군', currency: '금산사랑상품권', emoji: '🌿', consumerIndex: 64.9, visitorIndex: 68.2 },
  { id: 'buyeo', name: '부여군', fullName: '충청남도 부여군', currency: '굿뜨래페이', emoji: '🏛️', consumerIndex: 69.7, visitorIndex: 77.4 },
  { id: 'seocheon', name: '서천군', fullName: '충청남도 서천군', currency: '서천사랑상품권', emoji: '🐟', consumerIndex: 66.2, visitorIndex: 70.6 },
  { id: 'cheongyang', name: '청양군', fullName: '충청남도 청양군', currency: '청양사랑상품권', emoji: '🌶️', consumerIndex: 61.8, visitorIndex: 64.3 },
  { id: 'hongseong', name: '홍성군', fullName: '충청남도 홍성군', currency: '홍성사랑상품권', emoji: '🐄', consumerIndex: 68.5, visitorIndex: 72.7 },
  { id: 'yesan', name: '예산군', fullName: '충청남도 예산군', currency: '예산사랑상품권', emoji: '🍎', consumerIndex: 70.3, visitorIndex: 75.8 },
  { id: 'taean', name: '태안군', fullName: '충청남도 태안군', currency: '태안사랑상품권', emoji: '🌊', consumerIndex: 73.2, visitorIndex: 82.6 },
];

const FOOD_PLACE_ROWS: Omit<FoodPlace, 'imageUrl'>[] = [
  { id: 'cheonan-1', region: '천안시', name: '천안 한우촌', category: '한우 전문점', address: '충남 천안시 동남구 봉명동 182' },
  { id: 'cheonan-2', region: '천안시', name: '카페 어울림', category: '카페·음료', address: '충남 천안시 서북구 쌍용동 441' },
  { id: 'cheonan-3', region: '천안시', name: '천안 중앙시장', category: '전통시장', address: '충남 천안시 동남구 중앙동 24' },
  { id: 'gongju-1', region: '공주시', name: '공주 밤 요리 전문점', category: '향토음식', address: '충남 공주시 중동 33' },
  { id: 'gongju-2', region: '공주시', name: '마곡사 수목원 카페', category: '카페·관광', address: '충남 공주시 사곡면 마곡사로 966' },
  { id: 'boryeong-1', region: '보령시', name: '대천 해물 칼국수', category: '해산물', address: '충남 보령시 신흑동 66-7' },
  { id: 'boryeong-2', region: '보령시', name: '머드 테마 카페', category: '카페·음료', address: '충남 보령시 대천해수욕장로 55' },
  { id: 'asan-1', region: '아산시', name: '외암민속마을 식당', category: '한정식', address: '충남 아산시 송악면 외암리 347' },
  { id: 'asan-2', region: '아산시', name: '신정호 카페', category: '카페·음료', address: '충남 아산시 배방읍 신정리 55' },
  { id: 'seosan-1', region: '서산시', name: '간월도 굴밥집', category: '해산물', address: '충남 서산시 부석면 간월도리 12' },
  { id: 'seosan-2', region: '서산시', name: '해미읍성 카페', category: '카페·역사', address: '충남 서산시 해미면 읍내리 16' },
  { id: 'nonsan-1', region: '논산시', name: '딸기 카페 논산', category: '카페·딸기', address: '충남 논산시 강경읍 강경로 88' },
  { id: 'nonsan-2', region: '논산시', name: '강경젓갈 시장', category: '전통시장', address: '충남 논산시 강경읍 계백로 10' },
  { id: 'gyeryong-1', region: '계룡시', name: '계룡산 약초 식당', category: '건강식', address: '충남 계룡시 엄사면 계룡대로 55' },
  { id: 'dangjin-1', region: '당진시', name: '당진 쌀 빵집', category: '베이커리', address: '충남 당진시 원당골로 11' },
  { id: 'dangjin-2', region: '당진시', name: '아미산 전망 카페', category: '카페·뷰맛집', address: '충남 당진시 고대면 진관리 55' },
  { id: 'geumsan-1', region: '금산군', name: '금산 인삼 시장', category: '약재시장', address: '충남 금산군 금산읍 중도리 55' },
  { id: 'geumsan-2', region: '금산군', name: '오두산 자연 식당', category: '향토음식', address: '충남 금산군 남일면 금강로 22' },
  { id: 'buyeo-1', region: '부여군', name: '백마강 유람선 카페', category: '카페·관광', address: '충남 부여군 부여읍 강변로 1' },
  { id: 'buyeo-2', region: '부여군', name: '정림사지 한정식', category: '한정식', address: '충남 부여군 부여읍 정림로 14' },
  { id: 'seocheon-1', region: '서천군', name: '한산 모시 식당', category: '향토음식', address: '충남 서천군 한산면 한산리 44' },
  { id: 'cheongyang-1', region: '청양군', name: '고추 나라 식당', category: '향토음식', address: '충남 청양군 청양읍 청양로 33' },
  { id: 'hongseong-1', region: '홍성군', name: '홍성 한우 명가', category: '한우 전문점', address: '충남 홍성군 홍성읍 고암리 22' },
  { id: 'yesan-1', region: '예산군', name: '사과 농장 카페', category: '카페·과수원', address: '충남 예산군 고덕면 몽곡리 88' },
  { id: 'taean-1', region: '태안군', name: '안면도 조개구이', category: '해산물', address: '충남 태안군 안면읍 안면해변로 77' },
];

export const FOOD_PLACES: FoodPlace[] = FOOD_PLACE_ROWS.map((place) => ({
  ...place,
  imageUrl: foodImageForCategory(place.category),
}));

const TOUR_PLACE_ROWS: Omit<TourPlace, 'imageUrl'>[] = [
  { id: 'cheonan-tour-1', city: '천안시', name: '독립기념관', category: '역사', address: '충남 천안시 동남구 목천읍 독립기념관로 1', desc: '한국 근현대사를 차분히 둘러볼 수 있는 대표 역사 여행지입니다.', emoji: '🏛️' },
  { id: 'cheonan-tour-2', city: '천안시', name: '아라리오 광장', category: '도심', address: '충남 천안시 동남구 만남로 43', desc: '도심 산책과 전시, 카페를 함께 묶기 좋은 코스입니다.', emoji: '🎨' },
  { id: 'gongju-tour-1', city: '공주시', name: '공산성', category: '역사', address: '충남 공주시 웅진로 280', desc: '백제의 성곽길을 따라 걷는 야경 코스로도 좋습니다.', emoji: '🏯' },
  { id: 'gongju-tour-2', city: '공주시', name: '마곡사', category: '사찰', address: '충남 공주시 사곡면 마곡사로 966', desc: '숲길과 사찰을 천천히 즐기는 힐링 코스입니다.', emoji: '🌲' },
  { id: 'boryeong-tour-1', city: '보령시', name: '대천해수욕장', category: '바다', address: '충남 보령시 신흑동', desc: '해변 산책과 해산물 식사를 한 번에 즐길 수 있습니다.', emoji: '🌊' },
  { id: 'asan-tour-1', city: '아산시', name: '외암민속마을', category: '문화', address: '충남 아산시 송악면 외암민속길 5', desc: '전통 가옥과 골목길을 여유롭게 둘러보는 코스입니다.', emoji: '🏘️' },
  { id: 'seosan-tour-1', city: '서산시', name: '해미읍성', category: '역사', address: '충남 서산시 해미면 읍내리', desc: '성곽 산책과 주변 카페를 연결하기 좋습니다.', emoji: '🏰' },
  { id: 'nonsan-tour-1', city: '논산시', name: '선샤인랜드', category: '체험', address: '충남 논산시 연무읍 봉황로 102', desc: '사진 찍기 좋은 세트장과 체험형 여행지입니다.', emoji: '📸' },
  { id: 'dangjin-tour-1', city: '당진시', name: '삽교호 관광지', category: '호수', address: '충남 당진시 신평면 삽교천3길 79', desc: '바다와 호수 분위기를 같이 느낄 수 있는 코스입니다.', emoji: '🎡' },
  { id: 'buyeo-tour-1', city: '부여군', name: '궁남지', category: '연못', address: '충남 부여군 부여읍 궁남로 52', desc: '계절 꽃과 백제 분위기를 함께 담기 좋은 산책지입니다.', emoji: '🪷' },
  { id: 'yesan-tour-1', city: '예산군', name: '예당호 출렁다리', category: '전망', address: '충남 예산군 응봉면', desc: '호수 전망과 주변 먹거리를 함께 즐길 수 있습니다.', emoji: '🌉' },
  { id: 'taean-tour-1', city: '태안군', name: '꽃지해수욕장', category: '바다', address: '충남 태안군 안면읍 승언리', desc: '일몰 사진과 해변 산책에 잘 맞는 대표 코스입니다.', emoji: '🌅' },
];

export const TOUR_PLACES: TourPlace[] = TOUR_PLACE_ROWS.map((place) => ({
  ...place,
  imageUrl: TOUR_IMAGES[place.id] || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&h=600&fit=crop&auto=format',
}));

export function cityNames() {
  return CHUNGNAM_REGIONS.map((region) => region.name);
}

export function foodPlacesByRegion(regionName: string) {
  return FOOD_PLACES.filter((place) => place.region === regionName);
}

export function tourPlacesByCity(cityName: string) {
  return TOUR_PLACES.filter((place) => place.city === cityName);
}
