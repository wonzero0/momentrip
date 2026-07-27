import { useEffect, useState } from 'react';
import { ChevronLeft, Coins, Gift, RefreshCw, WalletCards } from 'lucide-react';
import { AppScreen } from '../App';
import { api, formatNumber } from '../lib/api';
import type { RewardSummary } from '../types';

interface Props {
  onNavigate: (s: AppScreen) => void;
}

export function RewardsScreen({ onNavigate }: Props) {
  const [summary, setSummary] = useState<RewardSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRewards = async () => {
    setLoading(true);
    setError('');
    try {
      setSummary(await api.rewards());
    } catch (err) {
      setError(err instanceof Error ? err.message : '리워드를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewards();
  }, []);

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <div className="px-5 pt-4 pb-2 flex-shrink-0 flex items-center gap-3">
        <button
          onClick={() => onNavigate('main')}
          className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60"
          style={{ background: '#EDE5DB' }}
        >
          <ChevronLeft size={20} color="#2A1F1A" />
        </button>
        <div className="flex-1">
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>지역화폐 · 리워드</p>
          <p style={{ fontSize: 11, color: '#9E8B7E' }}>미션 완료 보상을 확인해요</p>
        </div>
        <button
          onClick={loadRewards}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:scale-95"
          style={{ background: '#EDE5DB' }}
        >
          <RefreshCw size={16} color="#2A1F1A" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div
          className="rounded-3xl p-5 mt-3"
          style={{
            background: 'linear-gradient(135deg, #2A1F1A 0%, #5B3C2B 100%)',
            boxShadow: '0 16px 40px rgba(42,31,26,0.25)',
          }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <p style={{ fontSize: 11, color: 'rgba(250,248,245,0.65)', letterSpacing: '0.08em' }}>
                MOMENTRIP WALLET
              </p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#FAF8F5', marginTop: 4 }}>
                여행 보상 지갑
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              <WalletCards size={22} color="#FAF8F5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <Coins size={18} color="#E8C4A0" />
              <p style={{ fontSize: 11, color: 'rgba(250,248,245,0.6)', marginTop: 12 }}>지역화폐</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#FAF8F5', marginTop: 2 }}>
                {formatNumber(summary?.balances.localMoney || 0)}
              </p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <Gift size={18} color="#E8C4A0" />
              <p style={{ fontSize: 11, color: 'rgba(250,248,245,0.6)', marginTop: 12 }}>리워드</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#FAF8F5', marginTop: 2 }}>
                {formatNumber(summary?.balances.points || 0)}P
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl p-4 mt-4" style={{ background: '#FFF0F0', color: '#d4183d', fontSize: 12 }}>
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <p style={{ fontSize: 16, fontWeight: 700, color: '#2A1F1A' }}>적립 내역</p>
          <span style={{ fontSize: 11, color: '#9E8B7E' }}>
            {summary?.transactions.length || 0}건
          </span>
        </div>

        <div className="flex flex-col gap-3 mt-3">
          {loading && (
            <div className="rounded-2xl p-4" style={{ background: '#F0EAE2', fontSize: 13, color: '#9E8B7E' }}>
              불러오는 중...
            </div>
          )}

          {!loading && summary?.transactions.length === 0 && (
            <div className="rounded-2xl p-5 text-center" style={{ background: '#F0EAE2' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#2A1F1A' }}>아직 적립 내역이 없어요</p>
              <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 4 }}>미션을 완료하면 보상이 쌓입니다.</p>
            </div>
          )}

          {summary?.transactions.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(42,31,26,0.06)' }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: item.category === 'localMoney' ? '#F5EFE6' : '#FFF4D9' }}
              >
                {item.category === 'localMoney'
                  ? <Coins size={18} color="#C97C56" />
                  : <Gift size={18} color="#C97C56" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A' }}>{item.title}</p>
                <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 2 }}>{item.desc}</p>
              </div>
              <div className="text-right">
                <p style={{ fontSize: 14, fontWeight: 800, color: '#C97C56' }}>
                  +{formatNumber(item.amount)}{item.category === 'points' ? 'P' : ''}
                </p>
                <p style={{ fontSize: 10, color: '#9E8B7E', marginTop: 2 }}>
                  {item.createdAt.slice(5, 10)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
