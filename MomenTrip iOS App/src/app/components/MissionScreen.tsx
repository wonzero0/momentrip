import { useMemo } from 'react';
import { Camera, CheckCircle2, ChevronLeft } from 'lucide-react';
import { AppScreen, DiaryType, MissionInfo } from '../App';
import type { TripRoom } from '../types';

interface Props {
  onNavigate: (s: AppScreen) => void;
  setDiaryType: (t: DiaryType) => void;
  setSelectedMission: (m: MissionInfo) => void;
  captured: number[];
  earnedByMission: Record<number, number>;
  activeTrip: TripRoom | null;
}

const DEFAULT_MISSIONS: MissionInfo[] = [
  { id: 1, icon: '🍜', title: '현지 음식 먹기', desc: '여행지의 대표 음식을 맛보세요', reward: 300 },
  { id: 2, icon: '🌆', title: '야경 사진 찍기', desc: '아름다운 밤 풍경을 담아요', reward: 500 },
  { id: 3, icon: '🥟', title: '길거리 음식 시도', desc: '현지 로컬 길거리 음식 도전', reward: 200 },
  { id: 4, icon: '💬', title: '낯선 사람과 대화', desc: '현지인과 친해져 보세요', reward: 800 },
  { id: 5, icon: '☕', title: '현지 카페 방문', desc: '숨겨진 로컬 카페 발견하기', reward: 100 },
  { id: 6, icon: '🤳', title: '랜드마크 셀카', desc: '여행지 대표 명소 인증샷', reward: 1000 },
];

const MISSION_POOLS: Array<Array<Omit<MissionInfo, 'id'>>> = [
  [
    { icon: '🍜', title: '{place} 대표 음식 인증', desc: '이번 여행에서 가장 기억나는 한 끼를 남겨요', reward: 320 },
    { icon: '🥢', title: '첫 로컬 식사 기록', desc: '{place}에서 처음 먹은 음식을 사진으로 남겨요', reward: 280 },
    { icon: '🍲', title: '따뜻한 한 그릇 찾기', desc: '지역 분위기가 느껴지는 음식을 골라보세요', reward: 340 },
  ],
  [
    { icon: '🌆', title: '{place} 빛나는 순간', desc: '해질녘이나 야경처럼 빛이 예쁜 장면을 담아요', reward: 520 },
    { icon: '🌅', title: '오늘의 풍경 스탬프', desc: '여행의 시작이나 끝을 보여주는 풍경을 기록해요', reward: 480 },
    { icon: '🏙️', title: '거리 분위기 캡처', desc: '걷다가 멈추고 싶어진 장면을 남겨요', reward: 500 },
  ],
  [
    { icon: '🥟', title: '작은 간식 발견', desc: '시장, 골목, 휴게소에서 만난 간식을 기록해요', reward: 230 },
    { icon: '🍡', title: '로컬 디저트 도전', desc: '{place}에서만 더 특별해 보이는 디저트를 찾아요', reward: 260 },
    { icon: '🛍️', title: '기념품 가게 한 컷', desc: '여행지 감성이 느껴지는 물건이나 포장을 담아요', reward: 220 },
  ],
  [
    { icon: '💬', title: '현지 정보 하나 얻기', desc: '가게, 숙소, 안내소에서 추천을 하나 물어보세요', reward: 780 },
    { icon: '🗺️', title: '길 위의 대화 기록', desc: '새로 알게 된 장소나 팁을 사진과 함께 남겨요', reward: 820 },
    { icon: '🙋', title: '친절한 순간 남기기', desc: '여행 중 도움받았거나 물어본 순간을 기록해요', reward: 760 },
  ],
  [
    { icon: '☕', title: '{place} 쉬어가는 자리', desc: '카페, 벤치, 전망대처럼 잠깐 머문 곳을 담아요', reward: 180 },
    { icon: '🪑', title: '마음에 든 공간 기록', desc: '분위기가 좋았던 실내외 공간을 남겨요', reward: 160 },
    { icon: '📖', title: '여행 중 쉼표 한 장', desc: '잠깐 쉬며 본 장면을 미션 사진으로 남겨요', reward: 140 },
  ],
  [
    { icon: '🤳', title: '{place} 상징 인증샷', desc: '이번 여행지를 가장 잘 보여주는 장소에서 인증해요', reward: 1000 },
    { icon: '📍', title: '오늘의 도착 인증', desc: '지금 이곳에 왔다는 증거가 되는 장면을 남겨요', reward: 920 },
    { icon: '🎞️', title: '엔딩 컷 만들기', desc: '스크랩북 마지막에 어울릴 대표 사진을 찍어요', reward: 980 },
  ],
];

const PLACE_NAMES = ['제주', '부산', '경주', '강릉', '여수', '전주', '천안', '공주', '보령', '아산', '서산', '논산', '당진', '부여', '서천', '청양', '홍성', '예산', '태안'];

function hashString(value: string) {
  return Array.from(value).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function tripPlace(room: TripRoom | null) {
  const source = `${room?.name || ''} ${room?.planText || ''}`;
  return PLACE_NAMES.find((place) => source.includes(place)) || room?.name?.replace(/\s*여행방?$/u, '').trim() || '이번 여행';
}

function buildTripMissions(room: TripRoom | null) {
  if (!room?.id) return DEFAULT_MISSIONS;
  const place = tripPlace(room);
  const seed = Math.abs(hashString(`${room.id}:${room.name}:${room.planText}`));

  return MISSION_POOLS.map((pool, index) => {
    const template = pool[(seed + index * 2) % pool.length];
    return {
      ...template,
      id: index + 1,
      title: template.title.replaceAll('{place}', place),
      desc: template.desc?.replaceAll('{place}', place),
    };
  });
}

export function MissionScreen({ onNavigate, setDiaryType, setSelectedMission, captured, earnedByMission, activeTrip }: Props) {
  const missions = useMemo(() => buildTripMissions(activeTrip), [activeTrip]);
  const earnedPoints = captured.reduce((sum, id) => {
    const m = missions.find(m => m.id === id);
    return sum + (earnedByMission[id] ?? m?.reward ?? 0);
  }, 0);

  const totalPossible = missions.reduce((sum, m) => sum + m.reward, 0);
  const progress = captured.length / missions.length;

  const handleCamera = (mission: MissionInfo) => {
    setSelectedMission(mission);
    onNavigate('photocheck');
  };

  const handleComplete = () => {
    setDiaryType('scrapbook');
    onNavigate('diary');
  };

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
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>여행 미션</p>
          <p style={{ fontSize: 12, color: '#9E8B7E' }}>
            {activeTrip ? `${activeTrip.name} · ` : ''}{captured.length}/{missions.length} 완료
          </p>
        </div>
        {/* Points badge */}
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

      {/* Reward summary strip */}
      {earnedPoints > 0 && (
        <div className="px-5 mb-3 flex-shrink-0">
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #2A1F1A 0%, #4A3020 100%)' }}
          >
            <span style={{ fontSize: 20 }}>🎉</span>
            <div className="flex-1">
              <p style={{ fontSize: 12, color: 'rgba(250,248,245,0.7)' }}>현재 획득 포인트</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#FAF8F5' }}>
                +{earnedPoints.toLocaleString()}P
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: 'rgba(250,248,245,0.5)' }}>달성률</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#D4A070' }}>
                {Math.round((earnedPoints / totalPossible) * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}

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
                  {/* Icon */}
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

                  {/* Text */}
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
                      {m.desc}
                    </p>
                    {/* Reward badge */}
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

                  {/* Camera button */}
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
