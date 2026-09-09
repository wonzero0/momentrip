import { useMemo, useState } from 'react';
import { Check, ChevronLeft, Coins } from 'lucide-react';
import { CHUNGNAM_REGIONS } from '../data/chungnam';

interface Props {
  onBack: () => void;
  totalPoints: number;
  onConvert: (amount: number, regionName: string, currency: string) => Promise<void> | void;
}

const AMOUNT_OPTIONS = [1000, 3000, 5000, 10000];

function compactRegionName(regionName: string) {
  return regionName.replace(/(시|군)$/u, '');
}

export function LocalCurrencyExchangeScreen({ onBack, totalPoints, onConvert }: Props) {
  const initialAmount = totalPoints >= AMOUNT_OPTIONS[0] ? AMOUNT_OPTIONS[0] : totalPoints;
  const [selectedRegionId, setSelectedRegionId] = useState(CHUNGNAM_REGIONS[0].id);
  const [amount, setAmount] = useState(initialAmount);
  const [converted, setConverted] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');

  const selectedRegion = useMemo(
    () => CHUNGNAM_REGIONS.find((region) => region.id === selectedRegionId) ?? CHUNGNAM_REGIONS[0],
    [selectedRegionId]
  );
  const canConvert = amount > 0 && amount <= totalPoints;

  const handleConvert = async () => {
    if (!canConvert || converting) return;
    setConverting(true);
    setError('');
    try {
      await onConvert(amount, selectedRegion.name, selectedRegion.currency);
      setConverted(true);
    } catch (convertError) {
      setError(convertError instanceof Error ? convertError.message : '전환에 실패했습니다.');
    } finally {
      setConverting(false);
    }
  };

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
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>지역화폐 전환</p>
          <p style={{ fontSize: 11, color: '#9E8B7E' }}>보유 포인트를 충남 지역화폐로 사용</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div
          className="p-5 mb-5"
          style={{
            borderRadius: 20,
            background: 'linear-gradient(135deg, #2A1F1A 0%, #4A3020 100%)',
            boxShadow: '0 12px 32px rgba(42,31,26,0.25)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={{ fontSize: 11, color: 'rgba(250,248,245,0.55)' }}>전환 가능 포인트</p>
              <p style={{ fontSize: 34, fontWeight: 800, color: '#FAF8F5', lineHeight: 1.1, marginTop: 4 }}>
                {totalPoints.toLocaleString()}P
              </p>
            </div>
            <div
              className="w-12 h-12 flex items-center justify-center"
              style={{ borderRadius: 16, background: 'rgba(255,255,255,0.12)' }}
            >
              <Coins size={24} color="#D4A070" />
            </div>
          </div>
          <div className="p-3" style={{ borderRadius: 16, background: 'rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: 11, color: 'rgba(250,248,245,0.6)' }}>선택 지역화폐</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#D4A070', marginTop: 3 }}>
              {selectedRegion.emoji} {selectedRegion.currency}
            </p>
          </div>
        </div>

        <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A', marginBottom: 12 }}>지역</p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {CHUNGNAM_REGIONS.map((region) => {
            const active = selectedRegionId === region.id;
            return (
              <button
                key={region.id}
                onClick={() => {
                  setSelectedRegionId(region.id);
                  setConverted(false);
                }}
                className="py-3 px-2 active:scale-95 transition-all"
                style={{
                  minHeight: 74,
                  borderRadius: 16,
                  background: active ? '#C97C56' : '#FFFFFF',
                  border: active ? '1px solid #C97C56' : '1px solid rgba(42,31,26,0.08)',
                  boxShadow: active ? '0 6px 16px rgba(201,124,86,0.22)' : '0 2px 8px rgba(42,31,26,0.05)',
                }}
              >
                <p style={{ fontSize: 18 }}>{region.emoji}</p>
                <p style={{ fontSize: 11, fontWeight: 800, color: active ? '#FFFFFF' : '#2A1F1A', marginTop: 5 }}>
                  {compactRegionName(region.name)}
                </p>
              </button>
            );
          })}
        </div>

        <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A', marginBottom: 12 }}>전환 금액</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {AMOUNT_OPTIONS.map((option) => {
            const active = amount === option;
            const disabled = option > totalPoints;
            return (
              <button
                key={option}
                onClick={() => {
                  if (!disabled) {
                    setAmount(option);
                    setConverted(false);
                  }
                }}
                disabled={disabled}
                className="py-3 rounded-2xl active:scale-95 transition-all"
                style={{
                  background: active ? '#2A1F1A' : '#FFFFFF',
                  color: active ? '#FFFFFF' : disabled ? '#CDBEB2' : '#2A1F1A',
                  border: active ? '1px solid #2A1F1A' : '1px solid rgba(42,31,26,0.08)',
                  opacity: disabled ? 0.55 : 1,
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                {option.toLocaleString()}P
              </button>
            );
          })}
        </div>

        <div
          className="p-4 mb-5"
          style={{ borderRadius: 18, background: '#FFFFFF', border: '1px solid rgba(42,31,26,0.06)' }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 12, color: '#9E8B7E' }}>전환 후 포인트</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#2A1F1A' }}>
              {Math.max(0, totalPoints - amount).toLocaleString()}P
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span style={{ fontSize: 12, color: '#9E8B7E' }}>받을 지역화폐</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#C97C56' }}>
              {amount.toLocaleString()}원
            </span>
          </div>
        </div>

        {converted && (
          <div
            className="p-4 mb-4 flex items-center gap-3"
            style={{ borderRadius: 18, background: '#EEF3E8', border: '1px solid rgba(101,129,78,0.16)' }}
          >
            <div
              className="w-9 h-9 flex items-center justify-center"
              style={{ borderRadius: 14, background: '#65814E' }}
            >
              <Check size={18} color="#FFFFFF" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#2A1F1A' }}>전환 내역이 저장됐어요</p>
            <p style={{ fontSize: 11, color: '#6B5040', marginTop: 2 }}>{selectedRegion.currency} {amount.toLocaleString()}원</p>
            </div>
          </div>
        )}

        {error && (
          <div
            className="p-4 mb-4"
            style={{ borderRadius: 18, background: '#FFF0F0', border: '1px solid rgba(212,24,61,0.16)' }}
          >
            <p style={{ fontSize: 13, fontWeight: 800, color: '#d4183d' }}>{error}</p>
          </div>
        )}
      </div>

      <div className="px-5 py-5 flex-shrink-0">
        <button
          onClick={handleConvert}
          disabled={!canConvert || converting}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          style={{
            background: canConvert && !converting ? '#C97C56' : '#CDBEB2',
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 800,
            border: 'none',
            boxShadow: canConvert && !converting ? '0 8px 24px rgba(201,124,86,0.35)' : 'none',
          }}
        >
          <Coins size={18} color="#FFFFFF" />
          {converting ? '전환 중...' : canConvert ? `${amount.toLocaleString()}P 전환` : '전환 가능한 포인트 없음'}
        </button>
      </div>
    </div>
  );
}
