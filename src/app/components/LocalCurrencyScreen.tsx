import { useState } from 'react';
import { ChevronLeft, Compass, Users } from 'lucide-react';
import type { AppScreen } from '../App';

interface Props {
  onNavigate: (s: AppScreen) => void;
}

export function LocalCurrencyScreen({ onNavigate }: Props) {
  const [diversityData] = useState([
    { region: "충청남도 천안시 동남구", date: "202509", consumerIndex: 78.91, visitorIndex: 82.40 },
    { region: "충청남도 천안시 서북구", date: "202509", consumerIndex: 80.92, visitorIndex: 85.10 },
    { region: "충청남도 공주시", date: "202509", consumerIndex: 65.40, visitorIndex: 71.20 },
    { region: "충청남도 보령시", date: "202509", consumerIndex: 66.61, visitorIndex: 74.30 },
    { region: "충청남도 아산시", date: "202509", consumerIndex: 75.96, visitorIndex: 79.80 },
    { region: "충청남도 서산시", date: "202509", consumerIndex: 70.12, visitorIndex: 73.50 },
    { region: "충청남도 논산시", date: "202509", consumerIndex: 67.83, visitorIndex: 69.40 },
    { region: "충청남도 계룡시", date: "202509", consumerIndex: 63.25, visitorIndex: 61.90 },
    { region: "충청남도 당진시", date: "202509", consumerIndex: 72.40, visitorIndex: 76.10 }
  ]);

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div className="px-5 pt-4 pb-3 flex-shrink-0 flex items-center gap-3">
        <button onClick={() => onNavigate('reward')} className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60" style={{ background: '#EDE5DB' }}>
          <ChevronLeft size={20} color="#2A1F1A" />
        </button>
        <div className="flex-1">
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>관광 다양성</p>
          <p style={{ fontSize: 11, color: '#9E8B7E' }}>한국관광공사 오픈API 실시간 연동</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="mt-2 mb-3 flex items-center justify-between">
          <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>지역별 관광객 및 소비 다양성 지수</p>
          <span style={{ fontSize: 11, color: '#9E8B7E' }}>{diversityData.length}곳</span>
        </div>

        <div className="flex flex-col gap-3">
          {diversityData.map((item, idx) => (
            <div key={idx} className="rounded-2xl p-4" style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>{item.region}</p>
                  <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 1 }}>기준 연월: {item.date}</p>
                </div>
              </div>

              {/* 지수 비교 영역 */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#F5EFE6]">
                <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background: '#FAF8F5' }}>
                  <Users size={16} color="#C97C56" />
                  <div>
                    <p style={{ fontSize: 10, color: '#9E8B7E' }}>관광객 다양성</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#C97C56' }}>{item.visitorIndex}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background: '#FAF8F5' }}>
                  <Compass size={16} color="#4A3020" />
                  <div>
                    <p style={{ fontSize: 10, color: '#9E8B7E' }}>관광 소비 다양성</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#4A3020' }}>{item.consumerIndex}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}