// @ts-nocheck
import { useState, useEffect } from 'react';
import { Camera, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react';
import { AppScreen, DiaryType, MissionInfo } from '../App';

async function fetchMissions(destinationProp?: string): Promise<{
  cityTitle: string;
  missions: MissionInfo[];
  descs: Record<number, string>;
}> {
  // 💡 부모가 값을 안 주더라도 브라우저에 저장된 모든 가능성 있는 키값(userDestination, destination, travelDestination 등)을 탐색합니다.
  const savedDest = 
    localStorage.getItem('userDestination') || 
    localStorage.getItem('destination') || 
    localStorage.getItem('travelDestination') || 
    localStorage.getItem('selectedRegion') || '';

  const rawText = destinationProp || savedDest || '충청남도';

  console.log("🔍 [디버깅] 최종 감지된 여행지 원본 텍스트:", rawText);

  // 충남 시군구 키워드 매칭
  let detectedCity = '충청남도';
  if (rawText.includes('천안')) detectedCity = '천안';
  else if (rawText.includes('보령') || rawText.includes('대천')) detectedCity = '보령/대천';
  else if (rawText.includes('공주')) detectedCity = '공주';
  else if (rawText.includes('아산')) detectedCity = '아산';
  else if (rawText.includes('서산')) detectedCity = '서산';
  else if (rawText.includes('태안')) detectedCity = '태안';
  else if (rawText.includes('당진')) detectedCity = '당진';
  else if (rawText.includes('부여')) detectedCity = '부여';
  else if (rawText.includes('서천')) detectedCity = '서천';
  else if (rawText.includes('홍성')) detectedCity = '홍성';
  else if (rawText.includes('예산')) detectedCity = '예산';
  else if (rawText.includes('청양')) detectedCity = '청양';
  else if (rawText.includes('금산')) detectedCity = '금산';
  else if (rawText.includes('계룡')) detectedCity = '계룡';
  else if (rawText.includes('논산')) detectedCity = '논산';

  const commonMissions: MissionInfo[] = [
    { id: 1, icon: '🍜', title: `${detectedCity} 향토 음식 맛보기`, reward: 300 },
    { id: 2, icon: '🌆', title: `${detectedCity} 대표 명소 인증샷`, reward: 500 },
    { id: 3, icon: '🥟', title: '로컬 시장/간식 즐기기', reward: 200 },
    { id: 4, icon: '💬', title: '주민에게 숨은 명소 묻기', reward: 800 },
  ];

  const commonDescs: Record<number, string> = {
    1: `${detectedCity}의 대표 향토 음식을 맛보세요`,
    2: '여행지 대표 명소 앞에서 사진을 남겨요',
    3: '활기찬 로컬 시장과 간식을 즐겨보세요',
    4: '현지인만 아는 숨은 명소를 물어보세요',
  };

  let specificMissions: MissionInfo[] = [];
  let specificDescs: Record<number, string> = {};

  if (detectedCity === '천안') {
    specificMissions = [
      { id: 101, icon: '🥜', title: '천안 명물 호두과자 인증샷', reward: 600 },
      { id: 102, icon: '🏛️', title: '독립기념관 역사 탐방 인증', reward: 700 },
    ];
    specificDescs = {
      101: '갓 구운 따끈한 천안 호두과자와 함께 사진을 찍어보세요',
      102: '민족의 혼이 담긴 독립기념관에서 뜻깊은 인증샷을 남겨요',
    };
  } else if (detectedCity === '보령/대천') {
    specificMissions = [
      { id: 201, icon: '🌊', title: '대천해수욕장 바다 인증샷', reward: 600 },
      { id: 202, icon: '🐚', title: '조개구이 또는 해산물 먹방', reward: 700 },
    ];
    specificDescs = {
      201: '탁 트인 서해 바다를 배경으로 추억을 남겨보세요',
      202: '싱싱한 서해안 조개구이와 해산물을 즐겨보세요',
    };
  } else if (detectedCity === '공주') {
    specificMissions = [
      { id: 301, icon: '👑', title: '공산성 백제 유적지 탐방', reward: 600 },
      { id: 302, icon: '🌰', title: '공주 알밤 간식 맛보기', reward: 500 },
    ];
    specificDescs = {
      301: '세계유산 공산성 성곽길을 걸으며 인증샷을 남겨요',
      302: '달콤하고 고소한 공주 알밤 디저트를 맛보세요',
    };
  } else if (detectedCity === '아산') {
    specificMissions = [
      { id: 401, icon: '♨️', title: '온양온천 족욕/스파 체험', reward: 600 },
      { id: 402, icon: '🌿', title: '지중해마을 이국적 산책', reward: 500 },
    ];
    specificDescs = {
      401: '피로를 풀어주는 따뜻한 온천 문화를 즐겨보세요',
      402: '이국적인 건축물이 가득한 지중해마을을 거닐어봐요',
    };
  } else if (detectedCity === '태안' || detectedCity === '서산') {
    specificMissions = [
      { id: 501, icon: '🦀', title: `${detectedCity} 꽃게장 맛보기`, reward: 700 },
      { id: 502, icon: '🌲', title: '안면도 자연휴양림 힐링 산책', reward: 600 },
    ];
    specificDescs = {
      501: '밥도둑 서해안 대표 특산물 간장게장을 즐겨보세요',
      502: '피톤치드 가득한 소나무숲 속에서 힐링을 만끽해요',
    };
  } else if (detectedCity === '당진') {
    specificMissions = [
      { id: 601, icon: '🧀', title: '아미 미술관 & 목장 체험', reward: 600 },
      { id: 602, icon: '⚓', title: '삽교호 놀이동산 인증샷', reward: 500 },
    ];
    specificDescs = {
      601: '고즈넉한 폐교를 리모델링한 아미 미술관을 방문해요',
      602: '레트로 감성이 물씬 풍기는 삽교호에서 추억을 남겨요',
    };
  } else if (detectedCity === '부여') {
    specificMissions = [
      { id: 701, icon: '🌸', title: '궁남지 연꽃 정원 산책', reward: 600 },
      { id: 702, icon: '🏺', title: '백제문화단지 역사 탐방', reward: 700 },
    ];
    specificDescs = {
      701: '아름다운 연꽃이 가득한 역사 깊은 궁남지를 거닐어봐요',
      702: '백제 왕궁과 사비궁을 재현한 단지를 둘러봐요',
    };
  } else {
    specificMissions = [
      { id: 901, icon: '☕', title: `${detectedCity} 감성 카페 방문`, reward: 400 },
      { id: 902, icon: '🤳', title: `${detectedCity} 랜드마크 셀카`, reward: 500 },
    ];
    specificDescs = {
      901: '지역 특색이 담긴 예쁜 로컬 카페를 찾아보세요',
      902: '오늘 여행지의 하이라이트 순간을 셀카로 남겨요',
    };
  }

  return {
    cityTitle: detectedCity,
    missions: [...commonMissions, ...specificMissions],
    descs: { ...commonDescs, ...specificDescs },
  };
}

interface Props {
  onNavigate: (s: AppScreen) => void;
  setDiaryType: (t: DiaryType) => void;
  setSelectedMission: (m: MissionInfo) => void;
  captured: number[];
  earnedByMission: Record<number, number>;
  userDestination?: string;
}

export function MissionScreen({ 
  onNavigate, 
  setDiaryType, 
  setSelectedMission, 
  captured, 
  earnedByMission,
  userDestination 
}: Props) {
  const [cityName, setCityName] = useState<string>('충청남도');
  const [missions, setMissions] = useState<MissionInfo[]>([]);
  const [missionDescs, setMissionDescs] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadMissions() {
      setLoading(true);
      const data = await fetchMissions(userDestination);
      setCityName(data.cityTitle);
      setMissions(data.missions);
      setMissionDescs(data.descs);
      setLoading(false);
    }
    loadMissions();
  }, [userDestination]);

  const earnedPoints = captured.reduce((sum, id) => {
    const m = missions.find(m => m.id === id);
    return sum + (earnedByMission[id] ?? m?.reward ?? 0);
  }, 0);

  const totalPossible = missions.reduce((sum, m) => sum + m.reward, 0);
  const progress = missions.length > 0 ? captured.length / missions.length : 0;

  const handleCamera = (mission: MissionInfo) => {
    setSelectedMission(mission);
    onNavigate('photocheck');
  };

  const handleComplete = () => {
    setDiaryType(null);
    onNavigate('diary');
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: '#FAF8F5' }}>
        <Loader2 size={36} className="animate-spin mb-3" color="#C97C56" />
        <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>맞춤 미션을 불러오는 중이에요! ✨</p>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex-shrink-0 flex items-center gap-3">
        <button
          onClick={() => onNavigate('main')}
          className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60"
          style={{ background: '#EDE5DB' }}
        >
          <ChevronLeft size={20} color="#2A1F1A" />
        </button>
        <div className="flex-1">
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>{cityName} 여행 미션</p>
          <p style={{ fontSize: 12, color: '#9E8B7E' }}>
            {captured.length}/{missions.length} 완료
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl"
          style={{ background: '#F5EFE6', border: '1.5px solid rgba(201,124,86,0.2)' }}
        >
          <span style={{ fontSize: 14 }}>🪙</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#C97C56' }}>
            {earnedPoints.toLocaleString()}P
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-1 flex-shrink-0">
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 6, background: '#EDE5DB' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress * 100}%`,
              background: progress === 1
                ? '#2A8B4A'
                : 'linear-gradient(90deg, #C97C56, #D4A070)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span style={{ fontSize: 10, color: '#9E8B7E' }}>0P</span>
          <span style={{ fontSize: 10, color: '#9E8B7E', fontWeight: 600 }}>
            최대 {totalPossible.toLocaleString()}P
          </span>
        </div>
      </div>

      {/* Mission list */}
      <div className="flex-1 overflow-y-auto px-5">
        <div className="flex flex-col gap-3 pb-4">
          {missions.map((m, i) => {
            const done = captured.includes(m.id);
            const earned = earnedByMission[m.id] ?? m.reward;
            return (
              <div
                key={m.id}
                className="rounded-2xl p-4 transition-all"
                style={{
                  background: done ? '#F5EFE6' : '#FFFFFF',
                  boxShadow: done ? 'none' : '0 2px 12px rgba(42,31,26,0.07)',
                  border: done ? '1.5px solid rgba(201,124,86,0.2)' : '1.5px solid transparent',
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center relative"
                    style={{ background: done ? '#C97C56' : '#FAF8F5' }}
                  >
                    {done ? (
                      <CheckCircle2 size={22} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
                    ) : (
                      <span style={{ fontSize: 22 }}>{m.icon}</span>
                    )}
                    <div
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: done ? '#2A1F1A' : '#EDE5DB' }}
                    >
                      <span style={{ fontSize: 9, fontWeight: 700, color: done ? '#FAF8F5' : '#9E8B7E' }}>
                        {i + 1}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: done ? '#8B6148' : '#2A1F1A',
                        textDecoration: done ? 'line-through' : 'none',
                      }}
                    >
                      {m.title}
                    </p>
                    <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 1 }}>
                      {missionDescs[m.id]}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <span style={{ fontSize: 12 }}>🪙</span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: done ? '#C97C56' : '#D4A070',
                        }}
                      >
                        {done ? `+${earned.toLocaleString()}P 획득!` : `${m.reward.toLocaleString()}P`}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCamera(m)}
                    className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-all"
                    style={{
                      background: done ? '#C97C56' : '#2A1F1A',
                      boxShadow: done
                        ? '0 4px 12px rgba(201,124,86,0.4)'
                        : '0 4px 12px rgba(42,31,26,0.2)',
                    }}
                  >
                    <Camera size={18} color={done ? '#FFFFFF' : '#FAF8F5'} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Complete button */}
      <div className="px-5 py-5 flex-shrink-0">
        <button
          onClick={handleComplete}
          className="w-full py-4 rounded-2xl active:scale-95 transition-all"
          style={{
            background: captured.length > 0 ? '#2A1F1A' : '#EDE5DB',
            color: captured.length > 0 ? '#FAF8F5' : '#9E8B7E',
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
            boxShadow: captured.length > 0 ? '0 8px 24px rgba(42,31,26,0.2)' : 'none',
          }}
        >
          {captured.length === missions.length ? '🎉 미션 완료!' : '완료'}
        </button>
      </div>
    </div>
  );
}