import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const TRAVEL_PHOTOS: Record<number, string> = {
  2: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop&auto=format',
  5: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=400&fit=crop&auto=format',
  8: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=400&fit=crop&auto=format',
  12: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=400&h=400&fit=crop&auto=format',
  15: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&auto=format',
  18: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400&h=400&fit=crop&auto=format',
  22: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop&auto=format',
  25: 'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=400&h=400&fit=crop&auto=format',
};

const PHOTO_LABELS: Record<number, string> = {
  2: '제주 한라산',
  5: '강릉 경포호',
  8: '북한산 등산',
  12: '부산 해운대',
  15: '설악산 대청봉',
  18: '서울 야경',
  22: '전주 한옥마을',
  25: '도쿄 여행',
};

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const YEAR = 2026;
const MONTH = 5; // June (0-indexed)

interface Props { onHome: () => void; }

export function GieongTab({ onHome }: Props) {
  const [previewDate, setPreviewDate] = useState<number | null>(null);

  // June 2026 starts on Monday (1)
  const firstDayOfWeek = new Date(YEAR, MONTH, 1).getDay();
  const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const previewPhoto = previewDate ? TRAVEL_PHOTOS[previewDate] : null;
  const previewLabel = previewDate ? PHOTO_LABELS[previewDate] : null;

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
{/* Sub-header */}
<div className="px-5 pt-4 pb-2 flex-shrink-0 flex justify-center">
  <p
    style={{
      fontSize: 14,
      fontWeight: 700,
      color: '#2A1F1A',
    }}
  >
    기억나유
  </p>
</div>

      {/* Month header */}
      <div className="px-5 pb-2 flex-shrink-0 flex items-center justify-between">
        <button className="w-8 h-8 flex items-center justify-center rounded-full active:opacity-60" style={{ background: '#EDE5DB' }}>
          <ChevronLeft size={16} color="#2A1F1A" />
        </button>
        <div className="text-center">
          <p style={{ fontSize: 16, fontWeight: 700, color: '#2A1F1A' }}>2026년 6월</p>
          <p style={{ fontSize: 11, color: '#9E8B7E' }}>여행의 기억들</p>
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-full active:opacity-60" style={{ background: '#EDE5DB' }}>
          <ChevronRight size={16} color="#2A1F1A" />
        </button>
      </div>

      {/* Days of week header */}
      <div className="px-4 flex-shrink-0 grid grid-cols-7 mb-2">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="flex items-center justify-center py-2">
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: d === '일' ? '#C97C56' : d === '토' ? '#8B9EC9' : '#9E8B7E',
              }}
            >
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            const hasPhoto = !!TRAVEL_PHOTOS[day];
            const isToday = day === 16;
            return (
              <button
                key={day}
                onClick={() => hasPhoto && setPreviewDate(day)}
                className="flex flex-col items-center rounded-xl overflow-hidden active:scale-95 transition-all"
                style={{
                  aspectRatio: '1',
                  background: isToday ? '#2A1F1A' : hasPhoto ? '#FFFFFF' : '#F5EFE6',
                  boxShadow: hasPhoto ? '0 2px 8px rgba(42,31,26,0.1)' : 'none',
                  border: isToday ? 'none' : hasPhoto ? '1px solid rgba(201,124,86,0.15)' : '1px solid transparent',
                }}
              >
                {hasPhoto ? (
                  <>
                    <img
                      src={TRAVEL_PHOTOS[day]}
                      alt={`travel photo ${day}`}
                      className="w-full object-cover"
                      style={{ height: '65%' }}
                    />
                    <div
                      className="w-full flex items-center justify-center"
                      style={{ height: '35%' }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#2A1F1A',
                        }}
                      >
                        {day}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: isToday ? 700 : 400,
                        color: isToday ? '#FAF8F5' : '#9E8B7E',
                      }}
                    >
                      {day}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Photo stats */}
      <div className="px-5 py-3 flex-shrink-0 flex items-center gap-3">
        <div
          className="flex-1 rounded-2xl p-3 flex items-center gap-3"
          style={{ background: '#F5EFE6' }}
        >
          <span style={{ fontSize: 20 }}>📸</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#2A1F1A' }}>이번 달 여행 사진</p>
            <p style={{ fontSize: 11, color: '#C97C56' }}>{Object.keys(TRAVEL_PHOTOS).length}장</p>
          </div>
        </div>
        <div
          className="flex-1 rounded-2xl p-3 flex items-center gap-3"
          style={{ background: '#F5EFE6' }}
        >
          <span style={{ fontSize: 20 }}>🗺️</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#2A1F1A' }}>방문한 장소</p>
            <p style={{ fontSize: 11, color: '#C97C56' }}>5곳</p>
          </div>
        </div>
      </div>

      {/* Photo preview modal */}
      {previewDate && previewPhoto && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(42,31,26,0.85)' }}
          onClick={() => setPreviewDate(null)}
        >
          <div
            className="mx-5 rounded-3xl overflow-hidden w-full"
            style={{ maxWidth: 320 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={previewPhoto}
                alt={previewLabel || ''}
                className="w-full object-cover"
                style={{ height: 280 }}
              />
              <button
                onClick={() => setPreviewDate(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full active:opacity-60"
                style={{ background: 'rgba(42,31,26,0.6)' }}
              >
                <X size={16} color="#FAF8F5" />
              </button>
              <div
                className="absolute bottom-0 left-0 right-0 p-4"
                style={{ background: 'linear-gradient(to top, rgba(42,31,26,0.9), transparent)' }}
              >
                <p style={{ fontSize: 18, fontWeight: 700, color: '#FAF8F5' }}>{previewLabel}</p>
                <p style={{ fontSize: 12, color: 'rgba(250,248,245,0.7)', marginTop: 2 }}>
                  2026년 6월 {previewDate}일
                </p>
              </div>
            </div>
            <div
              className="p-4 flex gap-3"
              style={{ background: '#FFFFFF' }}
            >
              <button
                className="flex-1 py-3 rounded-xl active:opacity-80"
                style={{ background: '#F0EAE2', fontSize: 13, fontWeight: 600, color: '#2A1F1A', border: 'none' }}
              >
                공유하기
              </button>
              <button
                onClick={() => setPreviewDate(null)}
                className="flex-1 py-3 rounded-xl active:opacity-80"
                style={{ background: '#C97C56', fontSize: 13, fontWeight: 600, color: '#FFFFFF', border: 'none' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
