import { useState } from 'react';
import { Camera, CheckCircle2, ChevronLeft } from 'lucide-react';
import { AppScreen } from '../App';
import { DiaryType } from '../App';

interface Props {
  onNavigate: (s: AppScreen) => void;
  setDiaryType: (t: DiaryType) => void;
}

const MISSIONS = [
  { id: 1, icon: '🍜', title: '현지 음식 먹기', desc: '여행지의 대표 음식을 맛보세요' },
  { id: 2, icon: '🌆', title: '야경 사진 찍기', desc: '아름다운 밤 풍경을 담아요' },
  { id: 3, icon: '🥟', title: '길거리 음식 시도', desc: '현지 로컬 길거리 음식 도전' },
  { id: 4, icon: '💬', title: '낯선 사람과 대화', desc: '현지인과 친해져 보세요' },
  { id: 5, icon: '☕', title: '현지 카페 방문', desc: '숨겨진 로컬 카페 발견하기' },
  { id: 6, icon: '🤳', title: '랜드마크 셀카', desc: '여행지 대표 명소 인증샷' },
];

export function MissionScreen({ onNavigate, setDiaryType }: Props) {
  const [captured, setCaptured] = useState<number[]>([]);

  const toggleCapture = (id: number) => {
    setCaptured(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const progress = captured.length / MISSIONS.length;

  const handleComplete = () => {
    setDiaryType(null);
    onNavigate('diary');
  };

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex-shrink-0 flex items-center gap-3">
        <button
          onClick={() => onNavigate('main')}
          className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60"
          style={{ background: '#EDE5DB' }}
        >
          <ChevronLeft size={20} color="#2A1F1A" />
        </button>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>여행 미션</p>
          <p style={{ fontSize: 12, color: '#9E8B7E' }}>
            {captured.length}/{MISSIONS.length} 완료
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-4 flex-shrink-0">
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
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: 11, color: '#9E8B7E' }}>시작</span>
          <span style={{ fontSize: 11, color: progress === 1 ? '#2A8B4A' : '#9E8B7E', fontWeight: progress === 1 ? 700 : 400 }}>
            {progress === 1 ? '🎉 모두 완료!' : '완료'}
          </span>
        </div>
      </div>

      {/* Mission list */}
      <div className="flex-1 overflow-y-auto px-5">
        <div className="flex flex-col gap-3 pb-4">
          {MISSIONS.map((m, i) => {
            const done = captured.includes(m.id);
            return (
              <div
                key={m.id}
                className="rounded-2xl p-4 flex items-center gap-4 transition-all"
                style={{
                  background: done ? '#F5EFE6' : '#FFFFFF',
                  boxShadow: done ? 'none' : '0 2px 12px rgba(42,31,26,0.07)',
                  border: done ? '1.5px solid rgba(201,124,86,0.2)' : '1.5px solid transparent',
                }}
              >
                {/* Mission number + icon */}
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
                  <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 2 }}>{m.desc}</p>
                </div>

                {/* Camera button */}
                <button
                  onClick={() => toggleCapture(m.id)}
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-all"
                  style={{
                    background: done ? '#C97C56' : '#2A1F1A',
                    boxShadow: done ? '0 4px 12px rgba(201,124,86,0.4)' : '0 4px 12px rgba(42,31,26,0.2)',
                  }}
                >
                  {done ? (
                    <CheckCircle2 size={18} color="#FFFFFF" />
                  ) : (
                    <Camera size={18} color="#FAF8F5" />
                  )}
                </button>
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
            background: captured.length > 0
              ? '#2A1F1A'
              : '#EDE5DB',
            color: captured.length > 0 ? '#FAF8F5' : '#9E8B7E',
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
            boxShadow: captured.length > 0 ? '0 8px 24px rgba(42,31,26,0.2)' : 'none',
          }}
        >
          {captured.length === MISSIONS.length ? '🎉 미션 완료!' : '완료'}
        </button>
      </div>
    </div>
  );
}
