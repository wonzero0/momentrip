import { useState } from 'react';
import { ChevronLeft, Database, Info, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const INFO_ROWS = [
  { label: '앱 이름', value: 'MomenTrip · 모먼트립' },
  { label: '버전', value: '1.0.0' },
  { label: '빌드', value: 'React + Vite + Firebase' },
  { label: '저장 방식', value: 'Firebase Auth + 로컬 기기 저장' },
];

const FEATURE_ROWS = [
  '이메일 형식이 아닌 아이디 회원가입',
  '추천 여행지 상세 정보와 일정 추가',
  '사진 기반 미션 완료와 포인트 적립',
  '지역화폐 가맹점 탐색',
  '알림 설정과 계정 관리',
];

export function AppInfoScreen({ onBack }: Props) {
  const [cleared, setCleared] = useState(false);

  const clearTravelData = () => {
    const confirmed = window.confirm('미션 완료, 포인트 내역, 추천 일정 등 로컬 저장 데이터를 초기화할까요? 계정 로그인 정보는 유지됩니다.');
    if (!confirmed) return;

    Object.keys(localStorage)
      .filter(key => key.startsWith('momentrip.') && key !== 'momentrip.notificationSettings' && key !== 'momentrip.accountProfile')
      .forEach(key => localStorage.removeItem(key));
    setCleared(true);
    window.setTimeout(() => setCleared(false), 1600);
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div className="px-5 pt-4 pb-3 flex-shrink-0 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60" style={{ background: '#EDE5DB' }}>
          <ChevronLeft size={20} color="#2A1F1A" />
        </button>
        <div className="flex-1">
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>앱 정보</p>
          <p style={{ fontSize: 11, color: '#9E8B7E' }}>서비스 상태와 저장 데이터를 확인해요</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="rounded-3xl p-6 mb-4 text-center" style={{ background: 'linear-gradient(135deg, #2A1F1A, #4A3020)', boxShadow: '0 12px 32px rgba(42,31,26,0.24)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3" style={{ background: '#C97C56' }}>
            <Sparkles size={24} color="#FFFFFF" />
          </div>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#FAF8F5' }}>MomenTrip</p>
          <p style={{ fontSize: 12, color: 'rgba(250,248,245,0.65)', marginTop: 4 }}>당신의 여행을 기억하다</p>
        </div>

        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}>
          {INFO_ROWS.map((row, index) => (
            <div
              key={row.label}
              className="px-4 py-3 flex items-center justify-between gap-3"
              style={{ borderBottom: index < INFO_ROWS.length - 1 ? '1px solid rgba(42,31,26,0.05)' : 'none' }}
            >
              <span style={{ fontSize: 12, color: '#9E8B7E' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A', textAlign: 'right' }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-4 mb-4" style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} color="#C97C56" />
            <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>현재 구현된 기능</p>
          </div>
          <div className="flex flex-col gap-2">
            {FEATURE_ROWS.map(feature => (
              <div key={feature} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#C97C56' }} />
                <p style={{ fontSize: 12, color: '#6B5040' }}>{feature}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-4 mb-4" style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}>
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} color="#2A8B4A" className="mt-0.5 flex-shrink-0" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>개인정보</p>
              <p style={{ fontSize: 12, color: '#9E8B7E', lineHeight: 1.5, marginTop: 4 }}>
                미션 사진과 일정, 포인트 내역은 현재 이 기기의 브라우저 저장소에 보관됩니다. Firebase에는 로그인 계정 정보가 저장됩니다.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={clearTravelData}
          className="w-full rounded-2xl p-4 flex items-center gap-3 text-left active:scale-95 transition-all"
          style={{ background: cleared ? '#E8F5EE' : '#FFF0F0', border: 'none' }}
        >
          {cleared ? <Database size={18} color="#2A8B4A" /> : <Trash2 size={18} color="#d4183d" />}
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: cleared ? '#2A8B4A' : '#d4183d' }}>
              {cleared ? '로컬 데이터 초기화 완료' : '여행 데이터 초기화'}
            </p>
            <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 2 }}>미션, 포인트, 일정 저장값을 지웁니다.</p>
          </div>
        </button>
      </div>
    </div>
  );
}
