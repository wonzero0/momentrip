import { useState } from 'react';
import { ChevronLeft, Share2, BookOpen, Grid2X2, Download } from 'lucide-react';
import { AppScreen, DiaryType } from '../App';

interface Props {
  onNavigate: (s: AppScreen) => void;
  diaryType: DiaryType;
  setDiaryType: (t: DiaryType) => void;
}

const FOUR_CUT_PHOTOS = [
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=600&h=600&fit=crop&auto=format',
];

export function DiaryScreen({ onNavigate, diaryType, setDiaryType }: Props) {
  const [diaryText, setDiaryText] = useState('');
  const [shared, setShared] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleShare = () => {
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!diaryType) {
    return (
      <div
        className="w-full h-full flex flex-col"
        style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        <div className="px-5 pt-4 pb-2 flex-shrink-0 flex items-center gap-3">
          <button
            onClick={() => onNavigate('mission')}
            className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60"
            style={{ background: '#EDE5DB' }}
          >
            <ChevronLeft size={20} color="#2A1F1A" />
          </button>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>여행 기록</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: '#F0EAE2' }}
          >
            <span style={{ fontSize: 32 }}>✨</span>
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#2A1F1A', textAlign: 'center', marginBottom: 8 }}>
            여행을 기록해요
          </p>
          <p style={{ fontSize: 14, color: '#9E8B7E', textAlign: 'center', marginBottom: 48, lineHeight: 1.6 }}>
            소중한 여행의 기억을<br />나만의 방식으로 남겨보세요
          </p>

          <div className="flex flex-col gap-4 w-full">
            {/* Diary card */}
            <button
              onClick={() => setDiaryType('diary')}
              className="w-full rounded-3xl p-6 text-left active:scale-95 transition-all flex items-center gap-5"
              style={{
                background: '#FFFFFF',
                boxShadow: '0 8px 24px rgba(42,31,26,0.1)',
                border: '1.5px solid rgba(201,124,86,0.12)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #F5EFE6, #EDE5DB)' }}
              >
                <BookOpen size={24} color="#C97C56" />
              </div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#2A1F1A' }}>다이어리</p>
                <p style={{ fontSize: 12, color: '#9E8B7E', marginTop: 3 }}>
                  감성적인 노트 스타일로 기록해요
                </p>
              </div>
            </button>

            {/* Four-cut card */}
            <button
              onClick={() => setDiaryType('fourcut')}
              className="w-full rounded-3xl p-6 text-left active:scale-95 transition-all flex items-center gap-5"
              style={{
                background: 'linear-gradient(135deg, #2A1F1A 0%, #4A3020 100%)',
                boxShadow: '0 8px 24px rgba(42,31,26,0.25)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <Grid2X2 size={24} color="#FAF8F5" />
              </div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#FAF8F5' }}>네컷사진</p>
                <p style={{ fontSize: 12, color: 'rgba(250,248,245,0.6)', marginTop: 3 }}>
                  인스타 스타일 4컷 포토북
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (diaryType === 'diary') {
    return (
      <div
        className="w-full h-full flex flex-col"
        style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        <div className="px-5 pt-4 pb-2 flex-shrink-0 flex items-center gap-3">
          <button
            onClick={() => setDiaryType(null)}
            className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60"
            style={{ background: '#EDE5DB' }}
          >
            <ChevronLeft size={20} color="#2A1F1A" />
          </button>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>여행 다이어리</p>
            <p style={{ fontSize: 11, color: '#9E8B7E' }}>2026년 6월 16일</p>
          </div>
        </div>

        {/* Notebook */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: '#FFFDF9',
              boxShadow: '0 8px 32px rgba(42,31,26,0.12)',
              border: '1px solid rgba(201,124,86,0.1)',
            }}
          >
            {/* Notebook header */}
            <div
              className="p-5 border-b"
              style={{ borderColor: 'rgba(201,124,86,0.15)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 16 }}>📍</span>
                <span style={{ fontSize: 12, color: '#C97C56', fontWeight: 600 }}>나의 여행 기록</span>
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#2A1F1A' }}>오늘의 여행</p>
              <p style={{ fontSize: 12, color: '#9E8B7E', marginTop: 4 }}>MON, JUNE 16, 2026</p>
            </div>

            {/* Lined note area */}
            <div
              className="relative"
              style={{ background: '#FFFDF9' }}
            >
              {/* Red margin line */}
              <div
                className="absolute top-0 bottom-0"
                style={{ left: 46, width: 1, background: 'rgba(255,150,150,0.3)' }}
              />
              {/* Line rows */}
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="flex"
                  style={{
                    height: 40,
                    borderBottom: '1px solid rgba(212,184,150,0.3)',
                  }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: 46, opacity: 0.4 }}
                  >
                    <span style={{ fontSize: 9, color: '#9E8B7E' }}>{i + 1}</span>
                  </div>
                </div>
              ))}

              {/* Actual textarea overlay */}
              <textarea
                value={diaryText}
                onChange={e => setDiaryText(e.target.value)}
                className="absolute inset-0 bg-transparent outline-none resize-none"
                style={{
                  paddingTop: 10,
                  paddingLeft: 56,
                  paddingRight: 16,
                  fontSize: 14,
                  color: '#2A1F1A',
                  lineHeight: '40px',
                  fontFamily: "'Noto Sans KR', sans-serif",
                  zIndex: 10,
                }}
                placeholder="오늘 여행에서 있었던 일을 기록해보세요..."
              />
            </div>

            {/* Sticker area */}
            <div
              className="p-4 flex gap-2 border-t"
              style={{ borderColor: 'rgba(201,124,86,0.1)' }}
            >
              {['🌸', '⭐', '🌊', '🏔️', '🍀', '🌙'].map(e => (
                <button
                  key={e}
                  className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all"
                  style={{ background: '#F5EFE6', fontSize: 18 }}
                  onClick={() => setDiaryText(prev => prev + e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Share + Save buttons */}
        <div className="px-5 py-4 flex-shrink-0 flex gap-3">
          <button
            onClick={handleSave}
            className="py-4 px-5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all flex-shrink-0"
            style={{
              background: saved ? '#2A8B4A' : '#2A1F1A',
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 600,
              border: 'none',
              boxShadow: '0 8px 24px rgba(42,31,26,0.2)',
            }}
          >
            <Download size={18} />
            {saved ? '✓' : '저장'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            style={{
              background: shared ? '#2A8B4A' : '#C97C56',
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 600,
              border: 'none',
              boxShadow: '0 8px 24px rgba(201,124,86,0.35)',
            }}
          >
            <Share2 size={18} />
            {shared ? '공유 완료! ✓' : 'SNS 공유'}
          </button>
        </div>
      </div>
    );
  }

  // Four-cut photo
  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: '#2A1F1A', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <div className="px-5 pt-4 pb-2 flex-shrink-0 flex items-center gap-3">
        <button
          onClick={() => setDiaryType(null)}
          className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <ChevronLeft size={20} color="#FAF8F5" />
        </button>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#FAF8F5' }}>네컷사진</p>
          <p style={{ fontSize: 11, color: 'rgba(250,248,245,0.5)' }}>MomenTrip · 2026.06.16</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 pb-4">
        {/* Film strip */}
        <div
          className="w-full rounded-3xl overflow-hidden"
          style={{
            background: '#FAF8F5',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            maxWidth: 280,
          }}
        >
          {/* Top label */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ background: '#FAF8F5' }}
          >
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A', letterSpacing: '0.08em' }}>
                MOMENTRIP
              </p>
              <p style={{ fontSize: 10, color: '#9E8B7E', letterSpacing: '0.05em' }}>
                2026.06.16
              </p>
            </div>
            <div style={{ fontSize: 20 }}>✈️</div>
          </div>

          {/* 4 photos */}
          <div className="flex flex-col gap-1 px-3 pb-3">
            {FOUR_CUT_PHOTOS.map((src, i) => (
              <div
                key={i}
                className="relative rounded-xl overflow-hidden"
                style={{ height: 130 }}
              >
                <img
                  src={src}
                  alt={`photo ${i + 1}`}
                  className="w-full h-full object-cover"
                  style={{ filter: 'saturate(0.9) brightness(0.95)' }}
                />
                {/* Photo number */}
                <div
                  className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(42,31,26,0.5)' }}
                >
                  <span style={{ fontSize: 10, color: '#FAF8F5', fontWeight: 700 }}>{i + 1}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom label */}
          <div
            className="flex items-center justify-center py-4 gap-2"
            style={{ borderTop: '1px solid rgba(42,31,26,0.1)' }}
          >
            <div className="w-4 h-0.5 rounded-full" style={{ background: '#C97C56' }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: '#9E8B7E', letterSpacing: '0.15em' }}>
              MY JOURNEY
            </span>
            <div className="w-4 h-0.5 rounded-full" style={{ background: '#C97C56' }} />
          </div>
        </div>

        {/* Color filter options */}
        <div className="flex gap-3 mt-5">
          {['🌸 감성', '🌊 쨍함', '🌙 빈티지', '🌿 자연'].map((f, i) => (
            <button
              key={i}
              className="px-3 py-2 rounded-full active:scale-95 transition-all"
              style={{
                background: i === 0 ? '#C97C56' : 'rgba(255,255,255,0.1)',
                fontSize: 11,
                fontWeight: 600,
                color: i === 0 ? '#FFFFFF' : 'rgba(250,248,245,0.6)',
                border: 'none',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Share + Save buttons */}
      <div className="px-5 py-4 flex-shrink-0 flex gap-3">
        <button
          onClick={handleSave}
          className="py-4 px-5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all flex-shrink-0"
          style={{
            background: saved ? '#2A8B4A' : 'rgba(255,255,255,0.15)',
            color: '#FFFFFF',
            fontSize: 15,
            fontWeight: 600,
            border: '1.5px solid rgba(255,255,255,0.2)',
          }}
        >
          <Download size={18} />
          {saved ? '✓' : '저장'}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          style={{
            background: shared ? '#2A8B4A' : '#C97C56',
            color: '#FFFFFF',
            fontSize: 15,
            fontWeight: 600,
            border: 'none',
            boxShadow: '0 8px 24px rgba(201,124,86,0.5)',
          }}
        >
          <Share2 size={18} />
          {shared ? '공유 완료! ✓' : 'SNS 공유'}
        </button>
      </div>
    </div>
  );
}
