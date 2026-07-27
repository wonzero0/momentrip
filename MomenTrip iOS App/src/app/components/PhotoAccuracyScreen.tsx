import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { ChevronLeft, MapPin, ImageIcon, Upload, CheckCircle2 } from 'lucide-react';
import { MissionInfo } from '../App';

interface Props {
  mission: MissionInfo | null;
  onBack: () => void;
  onConfirm: (earnedReward: number, photoDataUrl: string | null) => void;
}

const ACCURACY_DATA: Record<number, { imageScore: number; locationScore: number }> = {
  1: { imageScore: 94, locationScore: 88 },
  2: { imageScore: 91, locationScore: 96 },
  3: { imageScore: 87, locationScore: 83 },
  4: { imageScore: 78, locationScore: 72 },
  5: { imageScore: 96, locationScore: 90 },
  6: { imageScore: 98, locationScore: 95 },
};

const LOCATIONS: Record<number, string> = {
  1: '제주 흑돼지 거리, 제주시',
  2: '남산 서울타워, 서울 용산구',
  3: '명동 거리, 서울 중구',
  4: '보성 녹차밭, 전남 보성군',
  5: '성수동 카페거리, 서울 성동구',
  6: '성산일출봉, 제주 서귀포시',
};

function AnimatedBar({ target, color, delay }: { target: number; color: string; delay: number }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(target), delay);
    return () => clearTimeout(t);
  }, [target, delay]);

  return (
    <div
      className="h-full rounded-full transition-all duration-700"
      style={{ width: `${width}%`, background: color }}
    />
  );
}

export function PhotoAccuracyScreen({ mission, onBack, onConfirm }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [done, setDone] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  const missionId = mission?.id ?? 1;
  const scores = ACCURACY_DATA[missionId] ?? { imageScore: 90, locationScore: 85 };
  const avgScore = Math.round((scores.imageScore + scores.locationScore) / 2);
  const earnedReward = Math.round((mission?.reward ?? 0) * (avgScore / 100));

  useEffect(() => {
    setUploaded(false);
    setAnalyzing(false);
    setDone(false);
    setPhotoDataUrl(null);
  }, [missionId]);

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(typeof reader.result === 'string' ? reader.result : null);
      setUploaded(true);
      setAnalyzing(true);
      setDone(false);
      setTimeout(() => {
        setAnalyzing(false);
        setDone(true);
      }, 1800);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

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
          <p style={{ fontSize: 17, fontWeight: 700, color: '#2A1F1A' }}>사진 정확도 확인</p>
          <p style={{ fontSize: 11, color: '#9E8B7E' }}>AI가 미션 달성 여부를 분석해요</p>
        </div>
        {done && (
          <div
            className="px-3 py-1.5 rounded-full flex items-center gap-1"
            style={{ background: '#E8F5EE' }}
          >
            <CheckCircle2 size={12} color="#2A8B4A" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2A8B4A' }}>분석 완료</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />

        {/* Mission badge */}
        <div
          className="flex items-center gap-3 rounded-2xl p-3 mb-4"
          style={{ background: '#F5EFE6', border: '1.5px solid rgba(201,124,86,0.2)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#FFFFFF', fontSize: 20 }}
          >
            {mission?.icon ?? '🎯'}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A' }}>{mission?.title ?? '미션'}</p>
            <p style={{ fontSize: 11, color: '#C97C56', fontWeight: 600 }}>
              🪙 최대 {mission?.reward.toLocaleString()}P
            </p>
          </div>
        </div>

        {/* Photo upload area */}
        <div className="mb-4">
          {!uploaded ? (
            <button
              onClick={handleUpload}
              className="w-full rounded-3xl flex flex-col items-center justify-center gap-3 active:scale-98 transition-all"
              style={{
                height: 200,
                background: '#F0EAE2',
                border: '2px dashed rgba(201,124,86,0.4)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: '#FFFFFF' }}
              >
                <Upload size={24} color="#C97C56" />
              </div>
              <div className="text-center">
                <p style={{ fontSize: 14, fontWeight: 600, color: '#2A1F1A' }}>사진 업로드</p>
                <p style={{ fontSize: 12, color: '#9E8B7E', marginTop: 2 }}>탭하여 사진을 선택하세요</p>
              </div>
            </button>
          ) : (
            <div className="relative rounded-3xl overflow-hidden" style={{ height: 200 }}>
              <img
                src={photoDataUrl ?? ''}
                alt="uploaded"
                className="w-full h-full object-cover"
              />
              {analyzing && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{ background: 'rgba(42,31,26,0.65)' }}
                >
                  <div
                    className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin"
                    style={{ border: '3px solid rgba(250,248,245,0.3)', borderTopColor: '#C97C56' }}
                  />
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#FAF8F5' }}>AI 분석 중...</p>
                </div>
              )}
              {done && (
                <div
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(42,31,26,0.7)' }}
                >
                  <CheckCircle2 size={12} color="#D4A070" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#FAF8F5' }}>분석 완료</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location info */}
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-4"
          style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}
        >
          <MapPin size={14} color="#C97C56" />
          <p style={{ fontSize: 12, fontWeight: 500, color: '#2A1F1A' }}>
            {LOCATIONS[missionId] ?? '위치 정보 없음'}
          </p>
        </div>

        {/* AI Score section */}
        {done && (
          <>
            {/* Score cards row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {/* Image accuracy */}
              <div
                className="rounded-2xl p-3 flex flex-col items-center gap-1"
                style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}
              >
                <ImageIcon size={16} color="#C97C56" />
                <p style={{ fontSize: 10, color: '#9E8B7E', textAlign: 'center' }}>이미지</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#2A1F1A' }}>{scores.imageScore}%</p>
              </div>
              {/* Location accuracy */}
              <div
                className="rounded-2xl p-3 flex flex-col items-center gap-1"
                style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}
              >
                <MapPin size={16} color="#8B9EC9" />
                <p style={{ fontSize: 10, color: '#9E8B7E', textAlign: 'center' }}>위치</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#2A1F1A' }}>{scores.locationScore}%</p>
              </div>
              {/* Reward */}
              <div
                className="rounded-2xl p-3 flex flex-col items-center gap-1"
                style={{
                  background: 'linear-gradient(135deg, #C97C56, #D4A070)',
                  boxShadow: '0 4px 12px rgba(201,124,86,0.35)',
                }}
              >
                <span style={{ fontSize: 16 }}>🪙</span>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>획득</p>
                <p style={{ fontSize: 17, fontWeight: 800, color: '#FFFFFF' }}>+{earnedReward}P</p>
              </div>
            </div>

            {/* Accuracy graph */}
            <div
              className="rounded-2xl p-4"
              style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}
            >
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A', marginBottom: 16 }}>
                정확도 분석
              </p>

              {/* Image Accuracy bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon size={12} color="#C97C56" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#2A1F1A' }}>이미지 정확도</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#C97C56' }}>{scores.imageScore}%</span>
                </div>
                <div
                  className="w-full rounded-full overflow-hidden"
                  style={{ height: 10, background: '#F0EAE2' }}
                >
                  <AnimatedBar target={scores.imageScore} color="#C97C56" delay={100} />
                </div>
              </div>

              {/* Location Accuracy bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} color="#8B9EC9" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#2A1F1A' }}>위치 정확도</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#8B9EC9' }}>{scores.locationScore}%</span>
                </div>
                <div
                  className="w-full rounded-full overflow-hidden"
                  style={{ height: 10, background: '#F0EAE2' }}
                >
                  <AnimatedBar target={scores.locationScore} color="#8B9EC9" delay={300} />
                </div>
              </div>

              {/* Overall bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: 12 }}>⚡</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#2A1F1A' }}>종합 점수</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#2A1F1A' }}>{avgScore}%</span>
                </div>
                <div
                  className="w-full rounded-full overflow-hidden"
                  style={{ height: 10, background: '#F0EAE2' }}
                >
                  <AnimatedBar
                    target={avgScore}
                    color="linear-gradient(90deg, #C97C56, #D4A070)"
                    delay={500}
                  />
                </div>
              </div>

              {/* Label row */}
              <div className="flex justify-between mt-3">
                {[0, 25, 50, 75, 100].map(v => (
                  <span key={v} style={{ fontSize: 9, color: '#9E8B7E' }}>{v}%</span>
                ))}
              </div>
            </div>

            {/* Reward summary */}
            <div
              className="mt-4 rounded-2xl px-4 py-3 flex items-center justify-between"
              style={{
                background: 'linear-gradient(135deg, #2A1F1A, #4A3020)',
                boxShadow: '0 8px 24px rgba(42,31,26,0.2)',
              }}
            >
              <div>
                <p style={{ fontSize: 11, color: 'rgba(250,248,245,0.6)' }}>종합 정확도 {avgScore}% 달성</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#FAF8F5' }}>
                  보상 획득
                  <span style={{ color: '#D4A070', marginLeft: 8 }}>+{earnedReward.toLocaleString()}P</span>
                </p>
              </div>
              <span style={{ fontSize: 28 }}>🎖️</span>
            </div>
          </>
        )}

        {/* Placeholder when not yet analyzed */}
        {!done && !analyzing && !uploaded && (
          <div
            className="rounded-2xl p-5 flex flex-col items-center gap-2"
            style={{ background: '#F5EFE6', border: '1.5px dashed rgba(201,124,86,0.3)' }}
          >
            <span style={{ fontSize: 28 }}>🤖</span>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#2A1F1A', textAlign: 'center' }}>
              AI 정확도 분석 대기 중
            </p>
            <p style={{ fontSize: 12, color: '#9E8B7E', textAlign: 'center', lineHeight: 1.5 }}>
              사진을 업로드하면 이미지 정확도와<br />위치 정보를 자동으로 분석해요
            </p>
          </div>
        )}

        {analyzing && !done && (
          <div
            className="rounded-2xl p-5 flex flex-col items-center gap-3"
            style={{ background: '#F5EFE6' }}
          >
            <div
              className="w-10 h-10 rounded-full border-3 animate-spin"
              style={{ border: '3px solid #EDE5DB', borderTopColor: '#C97C56' }}
            />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#2A1F1A' }}>AI 분석 중...</p>
            <p style={{ fontSize: 12, color: '#9E8B7E' }}>잠시만 기다려주세요</p>
          </div>
        )}
      </div>

      {/* Confirm button */}
      <div className="px-5 py-5 flex-shrink-0">
        <button
          onClick={() => onConfirm(earnedReward, photoDataUrl)}
          disabled={!done}
          className="w-full py-4 rounded-2xl active:scale-95 transition-all"
          style={{
            background: done ? '#C97C56' : '#EDE5DB',
            color: done ? '#FFFFFF' : '#9E8B7E',
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
            boxShadow: done ? '0 8px 24px rgba(201,124,86,0.35)' : 'none',
          }}
        >
          {done ? `+${earnedReward.toLocaleString()}P 획득` : '사진을 업로드해주세요'}
        </button>
      </div>
    </div>
  );
}
