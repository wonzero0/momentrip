// @ts-nocheck
import { useState, useEffect } from 'react';
import { Camera, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react';
import { AppScreen, DiaryType, MissionInfo } from '../App';

// 나중에 백엔드 DB/API와 연동할 때 이 함수를 fetch('/api/missions?city=...') 형태로 교체하시면 됩니다!
async function fetchMissions(userDestination: string): Promise<{
  missions: MissionInfo[];
  descs: Record<number, string>;
}> {
  // 현재는 API 키 할당량 문제나 서버 부재로 인한 에러를 막기 위해 
  // 선택한 지역 기반의 깔끔한 기본 미션 데이터를 반환합니다.
  return {
    missions: [
      { id: 1, icon: '🍜', title: `${userDestination} 향토 음식 맛보기`, reward: 300 },
      { id: 2, icon: '🌆', title: `${userDestination} 대표 명소 인증샷`, reward: 500 },
      { id: 3, icon: '🥟', title: '로컬 시장/간식 즐기기', reward: 200 },
      { id: 4, icon: '💬', title: '주민에게 숨은 명소 묻기', reward: 800 },
      { id: 5, icon: '☕', title: '지역 감성 카페 방문', reward: 100 },
      { id: 6, icon: '🤳', title: '여행지 랜드마크 셀카', reward: 1000 },
    ],
    descs: {
      1: `${userDestination}의 대표 향토 음식을 맛보세요`,
      2: '여행지 대표 명소 앞에서 사진을 남겨요',
      3: '활기찬 로컬 시장과 간식을 즐겨보세요',
      4: '현지인만 아는 숨은 명소를 물어보세요',
      5: '지역 특색이 담긴 예쁜 카페 찾기',
      6: '오늘 여행의 하이라이트 인증샷',
    }
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
  const targetArea = userDestination || '충청남도';
  
  const [missions, setMissions] = useState<MissionInfo[]>([]);
  const [missionDescs, setMissionDescs] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadMissions() {
      setLoading(true);
      // 나중에 백엔드 연동 시 이 부분을 서버 API 호출로 변경하시면 됩니다.
      const data = await fetchMissions(targetArea);
      setMissions(data.missions);
      setMissionDescs(data.descs);
      setLoading(false);
    }
    loadMissions();
  }, [targetArea]);

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
        <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>{targetArea} 맞춤 미션을 불러오는 중이에요! ✨</p>
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
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>여행 미션</p>
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