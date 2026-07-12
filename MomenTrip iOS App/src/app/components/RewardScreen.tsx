import { ChevronLeft, TrendingDown, TrendingUp } from 'lucide-react';
import type { RewardHistoryItem } from '../App';

interface Props {
  onBack: () => void;
  onLocalCurrency: () => void;
  totalPoints: number;
  history: RewardHistoryItem[];
}

export function RewardScreen({ onBack, onLocalCurrency, totalPoints, history }: Props) {
  const totalEarned = history.reduce((s, h) => s + h.earned, 0);
  const totalUsed = history.reduce((s, h) => s + h.used, 0);

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
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>포인트 내역</p>
          <p style={{ fontSize: 11, color: '#9E8B7E' }}>여행 미션 보상 기록</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Balance card */}
        <div
          className="rounded-3xl p-6 mb-5"
          style={{
            background: 'linear-gradient(135deg, #2A1F1A 0%, #4A3020 100%)',
            boxShadow: '0 12px 32px rgba(42,31,26,0.25)',
          }}
        >
          <p style={{ fontSize: 11, color: 'rgba(250,248,245,0.55)', letterSpacing: '0.08em' }}>
            보유 포인트
          </p>
          <div className="flex items-end gap-2 mt-2 mb-5">
            <span style={{ fontSize: 42, fontWeight: 800, color: '#FAF8F5', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {totalPoints.toLocaleString()}
            </span>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#D4A070', marginBottom: 4 }}>P</span>
          </div>
          <div className="flex gap-4">
            <div
              className="flex-1 rounded-2xl p-3"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={12} color="#D4A070" />
                <span style={{ fontSize: 10, color: 'rgba(250,248,245,0.55)' }}>총 획득</span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#D4A070' }}>
                +{totalEarned.toLocaleString()}P
              </p>
            </div>
            <div
              className="flex-1 rounded-2xl p-3"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown size={12} color="rgba(250,248,245,0.5)" />
                <span style={{ fontSize: 10, color: 'rgba(250,248,245,0.55)' }}>총 사용</span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(250,248,245,0.7)' }}>
                -{totalUsed.toLocaleString()}P
              </p>
            </div>
          </div>
        </div>

        {/* History label */}
        <div className="flex items-center justify-between mb-3">
          <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>거래 내역</p>
          <span style={{ fontSize: 11, color: '#9E8B7E' }}>최근 {history.length}건</span>
        </div>

        {/* History list */}
        <div className="flex flex-col gap-2">
          {history.length === 0 && (
            <div
              className="rounded-2xl p-5 text-center"
              style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}
            >
              <span style={{ fontSize: 28 }}>🪙</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A', marginTop: 8 }}>아직 적립 내역이 없어요</p>
              <p style={{ fontSize: 12, color: '#9E8B7E', marginTop: 4 }}>미션을 완료하면 포인트가 여기에 저장됩니다.</p>
            </div>
          )}
          {history.map(h => {
            const isUsed = h.used > 0;
            return (
              <div
                key={h.id}
                className="flex items-center gap-3 rounded-2xl p-4"
                style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: isUsed ? '#FFF0F0' : '#F5EFE6', overflow: 'hidden' }}
                >
                  {h.photoDataUrl ? (
                    <img src={h.photoDataUrl} alt={h.mission} className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ fontSize: 18 }}>{isUsed ? '🏪' : '🪙'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2A1F1A' }}>{h.mission}</p>
                  <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 1 }}>{h.date}</p>
                </div>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: isUsed ? '#d4183d' : '#C97C56',
                    flexShrink: 0,
                  }}
                >
                  {isUsed ? `-${h.used.toLocaleString()}P` : `+${h.earned.toLocaleString()}P`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 지역화폐 button */}
      <div className="px-5 py-5 flex-shrink-0">
        <button
          onClick={onLocalCurrency}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          style={{
            background: '#C97C56',
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
            boxShadow: '0 8px 24px rgba(201,124,86,0.35)',
          }}
        >
          <span style={{ fontSize: 18 }}>🏦</span>
          지역화폐로 전환
        </button>
      </div>
    </div>
  );
}
