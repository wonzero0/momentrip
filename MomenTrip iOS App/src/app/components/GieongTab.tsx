import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, Share2, Upload, X } from 'lucide-react';
import { api, monthKey, shareText, todayIsoDate } from '../lib/api';
import { isNativeApp, pickNativePhotoBlob } from '../lib/nativeCamera';
import type { TravelPhoto } from '../types';

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];

interface Props {
  onHome: () => void;
}

function monthLabel(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function photoDay(photo: TravelPhoto) {
  return Number(photo.date.slice(8, 10));
}

export function GieongTab({ onHome }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [photos, setPhotos] = useState<TravelPhoto[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<TravelPhoto | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const currentMonthKey = monthKey(calendarDate);
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const photosByDay = useMemo(() => {
    return photos.reduce<Record<number, TravelPhoto[]>>((acc, photo) => {
      const day = photoDay(photo);
      acc[day] = acc[day] ? [...acc[day], photo] : [photo];
      return acc;
    }, {});
  }, [photos]);

  const loadPhotos = async () => {
    setLoading(true);
    setNotice('');
    try {
      setPhotos(await api.photos(currentMonthKey));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '사진을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPhotos();
  }, [currentMonthKey]);

  const shiftMonth = (delta: number) => {
    setCalendarDate(new Date(year, month + delta, 1));
    setPreviewPhoto(null);
  };

  const savePhotoFile = async (file: Blob, filename: string, source = 'memory') => {
    setUploading(true);
    setNotice('');
    try {
      await api.uploadPhotoFile({
        file,
        filename,
        label: '여행 사진',
        date: todayIsoDate(),
        source,
      });
      await loadPhotos();
      setNotice('사진이 서버에 저장되었습니다.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '사진 저장에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!isNativeApp()) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const photo = await pickNativePhotoBlob();
      await savePhotoFile(photo.blob, photo.filename, 'memory-native');
    } catch (error) {
      if (error instanceof Error) setNotice(error.message);
    }
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    await savePhotoFile(file, file.name || `momentrip-${Date.now()}.jpg`);
  };

  const handleShare = async (photo: TravelPhoto) => {
    try {
      await shareText('MomenTrip 여행 사진', `${photo.label}\n${photo.date}`);
      await api.share({ kind: 'photo', targetId: photo.id, channel: 'system' }).catch(() => undefined);
      setNotice('공유 기록이 저장되었습니다.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '공유에 실패했습니다.');
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} style={{ display: 'none' }} />

      <div className="px-5 pt-4 pb-2 flex-shrink-0 flex items-center justify-between">
        <button
          onClick={onHome}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:opacity-60"
          style={{ background: '#EDE5DB' }}
          aria-label="홈으로 이동"
        >
          <ChevronLeft size={16} color="#2A1F1A" />
        </button>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>기억나유</p>
        <button
          onClick={handleAddPhoto}
          disabled={uploading}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:opacity-60"
          style={{ background: uploading ? '#CDBEB2' : '#C97C56' }}
          aria-label="사진 추가"
        >
          {uploading ? <Upload size={16} color="#FFFFFF" /> : <Camera size={16} color="#FFFFFF" />}
        </button>
      </div>

      <div className="px-5 pb-2 flex-shrink-0 flex items-center justify-between">
        <button
          onClick={() => shiftMonth(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full active:opacity-60"
          style={{ background: '#EDE5DB' }}
        >
          <ChevronLeft size={16} color="#2A1F1A" />
        </button>
        <div className="text-center">
          <p style={{ fontSize: 16, fontWeight: 700, color: '#2A1F1A' }}>{monthLabel(calendarDate)}</p>
          <p style={{ fontSize: 11, color: '#9E8B7E' }}>
            {loading ? '사진 불러오는 중' : `서버 저장 사진 ${photos.length}장`}
          </p>
        </div>
        <button
          onClick={() => shiftMonth(1)}
          className="w-8 h-8 flex items-center justify-center rounded-full active:opacity-60"
          style={{ background: '#EDE5DB' }}
        >
          <ChevronRight size={16} color="#2A1F1A" />
        </button>
      </div>

      {notice && (
        <div className="px-5 pb-2 flex-shrink-0">
          <p
            className="px-3 py-2 rounded-xl"
            style={{ background: '#F5EFE6', color: '#6B5040', fontSize: 11, lineHeight: 1.4 }}
          >
            {notice}
          </p>
        </div>
      )}

      <div className="px-4 flex-shrink-0 grid grid-cols-7 mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="flex items-center justify-center py-2">
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: day === '일' ? '#C97C56' : day === '토' ? '#8B9EC9' : '#9E8B7E',
              }}
            >
              {day}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} />;
            const dayPhotos = photosByDay[day] || [];
            const primaryPhoto = dayPhotos[0];
            const isToday =
              year === new Date().getFullYear() &&
              month === new Date().getMonth() &&
              day === new Date().getDate();

            return (
              <button
                key={day}
                onClick={() => primaryPhoto && setPreviewPhoto(primaryPhoto)}
                className="flex flex-col items-center rounded-xl overflow-hidden active:scale-95 transition-all"
                style={{
                  aspectRatio: '1',
                  background: isToday ? '#2A1F1A' : primaryPhoto ? '#FFFFFF' : '#F5EFE6',
                  boxShadow: primaryPhoto ? '0 2px 8px rgba(42,31,26,0.1)' : 'none',
                  border: isToday ? 'none' : primaryPhoto ? '1px solid rgba(201,124,86,0.15)' : '1px solid transparent',
                }}
              >
                {primaryPhoto ? (
                  <>
                    <img src={primaryPhoto.dataUrl} alt={primaryPhoto.label} className="w-full object-cover" style={{ height: '65%' }} />
                    <div className="w-full flex items-center justify-center gap-1" style={{ height: '35%' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#2A1F1A' }}>{day}</span>
                      {dayPhotos.length > 1 && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#C97C56' }}>+{dayPhotos.length - 1}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? '#FAF8F5' : '#9E8B7E' }}>
                      {day}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {!loading && photos.length === 0 && (
          <div
            className="mt-5 p-5 flex items-center gap-3"
            style={{ borderRadius: 20, background: '#FFFFFF', boxShadow: '0 2px 12px rgba(42,31,26,0.06)' }}
          >
            <div className="w-11 h-11 flex items-center justify-center" style={{ borderRadius: 16, background: '#F5EFE6' }}>
              <Camera size={20} color="#C97C56" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#2A1F1A' }}>아직 저장된 사진이 없어요</p>
              <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 2 }}>오른쪽 위 카메라 버튼으로 사진을 추가하세요.</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-3 flex-shrink-0 flex items-center gap-3">
        <div className="flex-1 rounded-2xl p-3 flex items-center gap-3" style={{ background: '#F5EFE6' }}>
          <span style={{ fontSize: 20 }}>📸</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#2A1F1A' }}>이번 달 사진</p>
            <p style={{ fontSize: 11, color: '#C97C56' }}>{photos.length}장</p>
          </div>
        </div>
        <button
          onClick={handleAddPhoto}
          disabled={uploading}
          className="flex-1 rounded-2xl p-3 flex items-center gap-3 text-left active:scale-95 transition-all"
          style={{ background: '#2A1F1A' }}
        >
          <Upload size={20} color="#D4A070" />
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#FAF8F5' }}>{uploading ? '업로드 중' : '사진 추가'}</p>
            <p style={{ fontSize: 11, color: 'rgba(250,248,245,0.6)' }}>서버 저장</p>
          </div>
        </button>
      </div>

      {previewPhoto && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(42,31,26,0.85)' }}
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="mx-5 rounded-3xl overflow-hidden w-full" style={{ maxWidth: 320 }} onClick={(event) => event.stopPropagation()}>
            <div className="relative">
              <img src={previewPhoto.dataUrl} alt={previewPhoto.label} className="w-full object-cover" style={{ height: 280 }} />
              <button
                onClick={() => setPreviewPhoto(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full active:opacity-60"
                style={{ background: 'rgba(42,31,26,0.6)' }}
              >
                <X size={16} color="#FAF8F5" />
              </button>
              <div
                className="absolute bottom-0 left-0 right-0 p-4"
                style={{ background: 'linear-gradient(to top, rgba(42,31,26,0.9), transparent)' }}
              >
                <p style={{ fontSize: 18, fontWeight: 700, color: '#FAF8F5' }}>{previewPhoto.label}</p>
                <p style={{ fontSize: 12, color: 'rgba(250,248,245,0.7)', marginTop: 2 }}>{previewPhoto.date}</p>
              </div>
            </div>
            <div className="p-4 flex gap-3" style={{ background: '#FFFFFF' }}>
              <button
                onClick={() => handleShare(previewPhoto)}
                className="flex-1 py-3 rounded-xl active:opacity-80 flex items-center justify-center gap-2"
                style={{ background: '#F0EAE2', fontSize: 13, fontWeight: 600, color: '#2A1F1A', border: 'none' }}
              >
                <Share2 size={14} color="#2A1F1A" />
                공유하기
              </button>
              <button
                onClick={() => setPreviewPhoto(null)}
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
