import { useState } from 'react';
import { ChevronLeft, Mail, MessageSquareText, Send } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface Inquiry {
  id: string;
  category: string;
  message: string;
  createdAt: string;
}

const STORAGE_KEY = 'momentrip.inquiries';

function readInquiries() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) as Inquiry[] : [];
  } catch {
    return [];
  }
}

export function ContactScreen({ onBack }: Props) {
  const [category, setCategory] = useState('이용 문의');
  const [message, setMessage] = useState('');
  const [inquiries, setInquiries] = useState<Inquiry[]>(readInquiries);
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!message.trim()) {
      alert('문의 내용을 입력해 주세요.');
      return;
    }

    const next = [
      {
        id: `inquiry-${Date.now()}`,
        category,
        message: message.trim(),
        createdAt: new Date().toLocaleString('ko-KR'),
      },
      ...inquiries,
    ].slice(0, 10);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setInquiries(next);
    setMessage('');
    setSent(true);
    window.setTimeout(() => setSent(false), 1500);
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div className="px-5 pt-4 pb-3 flex-shrink-0 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60" style={{ background: '#EDE5DB' }}>
          <ChevronLeft size={20} color="#2A1F1A" />
        </button>
        <div className="flex-1">
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>문의하기</p>
          <p style={{ fontSize: 11, color: '#9E8B7E' }}>{sent ? '문의가 저장되었습니다' : '불편사항과 제안을 남겨주세요'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="rounded-3xl p-5 mb-4" style={{ background: '#FFFFFF', boxShadow: '0 4px 16px rgba(42,31,26,0.08)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#F5EFE6' }}>
              <MessageSquareText size={20} color="#C97C56" />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#2A1F1A' }}>문의 등록</p>
              <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 2 }}>현재는 이 기기에 임시 저장됩니다.</p>
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            {['이용 문의', '오류 신고', '기능 제안'].map(item => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className="flex-1 py-2 rounded-xl active:scale-95 transition-all"
                style={{
                  background: category === item ? '#2A1F1A' : '#F0EAE2',
                  color: category === item ? '#FAF8F5' : '#2A1F1A',
                  fontSize: 12,
                  fontWeight: 700,
                  border: 'none',
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={event => setMessage(event.target.value)}
            className="w-full rounded-2xl p-4 outline-none resize-none"
            style={{ height: 150, background: '#FAF8F5', border: '1.5px solid rgba(201,124,86,0.25)', fontSize: 14, color: '#2A1F1A' }}
            placeholder="문의 내용을 입력하세요"
          />

          <button
            onClick={handleSubmit}
            className="w-full mt-4 py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            style={{ background: sent ? '#2A8B4A' : '#C97C56', color: '#FFFFFF', fontSize: 15, fontWeight: 700, border: 'none', boxShadow: '0 8px 24px rgba(201,124,86,0.28)' }}
          >
            {sent ? <Mail size={16} /> : <Send size={16} />}
            {sent ? '저장 완료' : '문의 등록'}
          </button>
        </div>

        <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A', marginBottom: 10 }}>최근 문의</p>
        <div className="flex flex-col gap-2">
          {inquiries.length === 0 && (
            <div className="rounded-2xl p-5 text-center" style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A' }}>아직 등록된 문의가 없어요</p>
              <p style={{ fontSize: 12, color: '#9E8B7E', marginTop: 4 }}>문의를 남기면 이곳에 기록됩니다.</p>
            </div>
          )}
          {inquiries.map(item => (
            <div key={item.id} className="rounded-2xl p-4" style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="rounded-full px-2 py-1" style={{ background: '#F5EFE6', color: '#C97C56', fontSize: 11, fontWeight: 700 }}>{item.category}</span>
                <span style={{ fontSize: 10, color: '#9E8B7E' }}>{item.createdAt}</span>
              </div>
              <p style={{ fontSize: 12, color: '#2A1F1A', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{item.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
